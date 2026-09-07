'use strict';

// Apache-2.0 -- see LICENSE-APACHE-2.0. Must never import from issuer-tool/, holder-tool/, or any other app -- see CONTRIBUTING.md.
//
// Kind 30300, the issuer's own signed cancellation list (Spec Part III /
// D6 / R2 -- see NOSTR-KINDS.md). The read/build/publish half lives in the
// browser-safe cancellationListRead.js; this file adds the ONE function that
// needs Node `fs` -- promotePendingCancellations, which drains lib/
// pendingQueue.js's 72h staging queue into the published list and re-stamps
// it for freshness (R2). Keeping the fs dependency isolated to this function
// is what lets verify.js (read-only) bundle for the phone wallet PWA without
// pulling `fs` into the browser. The full public API is preserved by
// re-exporting the read module, so issuer-tool is unaffected.
//
// Deliberately does NOT implement the D8 dispute-flag mechanism (kind
// 30301) -- that lives at a holder-controlled address; see holderActions.js.

const pendingQueue = require('./pendingQueue');
const { needsReStamp } = require('./freshness');
const read = require('./cancellationListRead');
const { fetchList, publishList, upsertEntry } = read;

// The only path by which a cancellation becomes visible: promotes any
// pending-queue entries whose 72h window has elapsed into the published
// list, AND independently re-stamps the list if it's aging toward the
// 90-day cap even with nothing new to add (R2). Safe to call frequently
// (e.g. from the in-process scheduler) -- it is a no-op publish when there
// is nothing promotable and the list is still fresh.
async function promotePendingCancellations(pool, secretKey, issuerPubkey, dataDir, relayUrls, now) {
  const toPromote = pendingQueue.promotableEntries(dataDir, now);
  const { event: currentEvent, entries: currentEntries } = await fetchList(pool, issuerPubkey, relayUrls);

  if (toPromote.length === 0) {
    if (!needsReStamp(currentEvent, now)) {
      return { attempted: false, promoted: [], reason: 'nothing to promote and list is fresh' };
    }
    // Nothing new, but re-sign to keep the freshness stamp within the
    // 90-day cap -- "silence and 'all clear' must mean different things."
    const { event, publishResult } = await publishList(pool, secretKey, currentEntries, relayUrls, currentEvent && currentEvent.created_at);
    return { attempted: true, promoted: [], reStampedOnly: true, event, publishResult };
  }

  let entries = currentEntries;
  toPromote.forEach((pending) => {
    // No `disputed` field here, deliberately: D8 repeals dispute flags
    // travelling on the issuer's own list ("it placed the victim's
    // protection under the control of the potential perpetrator"). A
    // dispute now lives at an address only the HOLDER controls -- see
    // holderActions.js -- and verify.js reads it from there, never from
    // this entry.
    entries = upsertEntry(entries, pending.recordId, {
      status: 'cancelled',
      cancelledBy: pending.cancelledBy,
      reason: pending.reason,
      requestedAt: pending.requestedAt,
      cancelledAt: (now || new Date()).toISOString(),
    });
  });

  // NOTE: promoted[] here reflects what we ATTEMPTED, not necessarily what
  // succeeded -- check publishResult.ok. On failure nothing is removed
  // from the pending queue, so the next scheduler tick retries the same
  // entries automatically.
  const { event, publishResult } = await publishList(pool, secretKey, entries, relayUrls, currentEvent && currentEvent.created_at);
  if (publishResult.ok) {
    pendingQueue.removeFromQueue(dataDir, toPromote.map((e) => e.recordId));
  }
  return { attempted: true, promoted: publishResult.ok ? toPromote.map((e) => e.recordId) : [], event, publishResult };
}

// Re-export the browser-safe read/build/publish half so the issuer tool's
// existing `require('.../cancellationList')` API is unchanged.
module.exports = Object.assign({}, read, { promotePendingCancellations });
