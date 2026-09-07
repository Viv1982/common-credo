'use strict';

// Apache-2.0 -- see LICENSE-APACHE-2.0. Must never import from issuer-tool/, holder-tool/, or any other app -- see CONTRIBUTING.md.
//
// The two checks (Spec Part III), extended for D8 (holder-controlled
// dispute address) and this build's holder-withdrawal extension (see
// holderActions.js and NOSTR-KINDS.md). This is not the full verifier
// app -- it doesn't resolve D7 anchors against jurisdictional registries
// (a verifier's own job).

const { verifyEvent } = require('nostr-tools/pure');
// Only the read half of the cancellation list is needed here, and it is
// deliberately the browser-safe module (no fs) so verify.js bundles for the
// phone wallet PWA. See cancellationListRead.js.
const cancellationList = require('./cancellationListRead');
const holderActions = require('./holderActions');

// Check 1 -- is it genuine? Purely structural: does the seal match the
// record's own id, and does the id match the record's own content
// (nostr-tools' verifyEvent checks both per NIP-01 -- see record.js).
function checkGenuine(record) {
  const structurallySealed = verifyEvent(record);
  return { structurallySealed, genuine: structurallySealed };
}

// Check 2 -- is it still valid? Reads the issuer's cancellation list
// (kind 30300) AND, when a holder pubkey is available, the holder's own
// dispute (30301) and withdrawal (30303) addresses -- neither of which
// the issuer can see or suppress.
//
// Precedence: a withdrawal always wins the display status, regardless of
// what the issuer's list says -- it is the holder's own unambiguous
// signal, and closing Gap 3 means her word on her own record does not
// need the issuer's agreement. Otherwise the issuer's cancellation status
// stands, with any dispute merged in as context (D8: "neither party can
// suppress the other's side" -- a dispute is visible alongside a
// cancellation, it never silently reverses it back to "valid").
async function checkStillValid(pool, record, relayUrls, holderPubkeyHex) {
  // A record whose content is corrupted (not valid JSON, or missing the
  // revocation pointer) has already failed -- or will fail -- Check 1,
  // since content is part of what the seal covers. checkStillValid must
  // still degrade gracefully rather than throw: verifyRecord() below
  // always calls both checks, and a thrown error here would crash the
  // whole verification instead of letting check1's `not_genuine` speak
  // for itself.
  let content, issuerPubkey;
  try {
    content = JSON.parse(record.content);
    issuerPubkey = content.revocationPointer.issuerPubkey;
    if (!issuerPubkey) throw new Error('missing revocationPointer.issuerPubkey');
  } catch (e) {
    return { checked: false, status: 'unverifiable', reason: 'record content is unreadable -- cannot determine which issuer to check', cancellation: null, dispute: null, withdrawal: null, holderChecksCompleted: false };
  }
  const recordId = record.id;

  const [{ event: listEvent, entries }, disputeContent, withdrawalContent] = await Promise.all([
    cancellationList.fetchList(pool, issuerPubkey, relayUrls),
    holderPubkeyHex ? holderActions.fetchDispute(pool, holderPubkeyHex, recordId, relayUrls) : Promise.resolve(null),
    holderPubkeyHex ? holderActions.fetchWithdrawal(pool, holderPubkeyHex, recordId, relayUrls) : Promise.resolve(null),
  ]);

  const holderChecksCompleted = !!holderPubkeyHex;
  const withdrawal = withdrawalContent ? { reason: withdrawalContent.reason, withdrawnAt: withdrawalContent.withdrawnAt } : null;
  const dispute = disputeContent ? { category: disputeContent.category, detail: disputeContent.detail, disputedAt: disputeContent.disputedAt } : null;

  // A holder's own withdrawal is independent of the issuer's list entirely
  // -- it is checked and honoured even if the issuer's noticeboard is
  // unreachable ("dead issuer"), which is the whole point of closing Gap 3.
  if (withdrawal) {
    return { checked: true, status: 'withdrawn_by_holder', cancellation: null, dispute, withdrawal, holderChecksCompleted };
  }

  if (!listEvent) {
    return { checked: false, status: 'unverifiable', reason: 'dead issuer: no cancellation list found at all', cancellation: null, dispute, withdrawal: null, holderChecksCompleted };
  }

  const entry = entries.find((e) => e.recordId === recordId);
  if (!entry) {
    return { checked: true, status: 'valid', cancellation: null, dispute, withdrawal: null, holderChecksCompleted };
  }

  return {
    checked: true,
    status: 'cancelled',
    cancellation: { reason: entry.reason, cancelledBy: entry.cancelledBy, cancelledAt: entry.cancelledAt },
    dispute,
    withdrawal: null,
    holderChecksCompleted,
  };
}

async function verifyRecord(pool, record, relayUrls, holderPubkeyHex) {
  const check1 = checkGenuine(record);
  const check2 = await checkStillValid(pool, record, relayUrls, holderPubkeyHex);
  return {
    recordId: record.id,
    check1,
    check2,
    overall: !check1.genuine ? 'not_genuine' : check2.status,
  };
}

module.exports = { checkGenuine, checkStillValid, verifyRecord };
