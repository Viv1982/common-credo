'use strict';

// Apache-2.0 -- see LICENSE-APACHE-2.0. Must never import from issuer-tool/, holder-tool/, or any other app -- see CONTRIBUTING.md.
//
// The browser-safe half of the issuer's cancellation list (kind 30300):
// reading the current list and building/publishing it. Everything here needs
// only nostr-tools + relay.js -- NO fs. It is split out from
// cancellationList.js so that verify.js (which only reads the list) can be
// bundled for the phone wallet PWA without dragging in pendingQueue.js's
// Node `fs` staging queue. cancellationList.js keeps the one fs-backed
// function (promotePendingCancellations) and re-exports everything here, so
// the issuer tool's API is unchanged.

const { finalizeEvent } = require('nostr-tools/pure');
const { publishWithQuorum, fetchLatestAddressable } = require('./relay');

const LIST_KIND = 30300;
const D_TAG = 'cc-cancellation-list';

function buildListEvent(entries, secretKey, createdAt) {
  const template = {
    kind: LIST_KIND,
    created_at: createdAt || Math.floor(Date.now() / 1000),
    tags: [['d', D_TAG]],
    content: JSON.stringify({ entries }),
  };
  return finalizeEvent(template, secretKey);
}

async function fetchList(pool, issuerPubkey, relayUrls) {
  const event = await fetchLatestAddressable(pool, relayUrls, { pubkey: issuerPubkey, kind: LIST_KIND, dTag: D_TAG });
  if (!event) return { event: null, entries: [] };
  return { event, entries: JSON.parse(event.content).entries };
}

// `notBefore` (unix seconds) forces created_at to be strictly greater than
// the currently-published version. Nostr timestamps are second-granular;
// two publishes issued within the same wall-clock second -- entirely
// realistic for an automated scheduler processing several due
// cancellations back-to-back -- would otherwise tie, and a relay/reader
// tie-break could silently keep the OLDER version as "latest." Forcing
// monotonicity here removes the ambiguity rather than hoping ties don't
// happen.
async function publishList(pool, secretKey, entries, relayUrls, notBefore) {
  const candidate = Math.floor(Date.now() / 1000);
  const createdAt = notBefore != null && notBefore >= candidate ? notBefore + 1 : candidate;
  const event = buildListEvent(entries, secretKey, createdAt);
  const publishResult = await publishWithQuorum(pool, event, relayUrls);
  return { event, publishResult };
}

// R2: "becoming an issuer means two things happen as one act: generating
// your signing key and publishing your signed cancellation list -- even if
// empty." This function is that second half; the route layer (src/) is
// responsible for calling it in the same onboarding step as key
// generation, never as a separable/skippable step.
async function initializeList(pool, secretKey, relayUrls) {
  return publishList(pool, secretKey, [], relayUrls);
}

function upsertEntry(entries, recordId, patch) {
  const idx = entries.findIndex((e) => e.recordId === recordId);
  if (idx === -1) entries.push(Object.assign({ recordId }, patch));
  else entries[idx] = Object.assign({}, entries[idx], patch);
  return entries;
}

module.exports = { LIST_KIND, D_TAG, buildListEvent, fetchList, publishList, initializeList, upsertEntry };
