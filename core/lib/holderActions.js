'use strict';

// Apache-2.0 -- see LICENSE-APACHE-2.0. Must never import from issuer-tool/, holder-tool/, or any other app -- see CONTRIBUTING.md.
//
// The two things ONLY a holder's own key can publish (Spec v0.3 Part IV,
// D8, and this build's extension of the same pattern -- see the plan
// this was built from and core/NOSTR-KINDS.md):
//
//  - Kind 30301: disputing an ISSUER's cancellation (D8, "the core
//    repair" -- the dispute flag lives with the holder, never the
//    issuer, so neither party can suppress the other's side).
//  - Kind 30303: an INDEPENDENT holder withdrawal of her own record
//    (closes Gap 3 for real -- a holder with her own key no longer
//    depends on issuer cooperation to exercise her Part IV.5 right of
//    withdrawal). This kind is a small, deliberate protocol extension
//    beyond the literal current spec text, not something D8 already
//    specifies -- named here, not hidden.
//
// Both are immediate-publish, no pending queue: D8's 72h window exists to
// protect against the ISSUER as potential perpetrator on a channel the
// holder can't stop. There is no symmetric party the spec protects from a
// holder's own actions on her own addresses.

const { finalizeEvent, getPublicKey } = require('nostr-tools/pure');
const { publishWithQuorum, fetchLatestAddressable } = require('./relay');

const DISPUTE_KIND = 30301;
const WITHDRAWAL_KIND = 30303;

// Part IV.4's fixed dispute-category list (working set, per Spec Part VII
// -- to be finalised with the warm-seed community, same status as the
// core claim-type list in claimTypes.js).
const DISPUTE_CATEGORIES = ['cancellation_factually_wrong', 'cancellation_retaliatory', 'record_never_authorised'];

function disputeDTag(recordId) {
  return 'cc-dispute-' + recordId;
}
function withdrawalDTag(recordId) {
  return 'cc-withdrawal-' + recordId;
}

function assert(cond, msg) {
  if (!cond) throw new Error('Rejected -- ' + msg);
}

// `notBefore` (unix seconds) forces created_at strictly greater than a
// previously-published version of this same address -- same fix as
// cancellationList.js's publishList, for the same reason: two publishes
// (e.g. a refiled dispute) issued within the same wall-clock second would
// otherwise tie, and a reader's tie-break could silently keep the OLDER
// version as "latest." Refiling must always win.
function buildDisputeEvent(recordId, category, detail, holderSecretKey, notBefore) {
  assert(recordId, 'recordId is required');
  assert(DISPUTE_CATEGORIES.includes(category), `category must be one of: ${DISPUTE_CATEGORIES.join(', ')}`);
  const candidate = Math.floor(Date.now() / 1000);
  const template = {
    kind: DISPUTE_KIND,
    created_at: notBefore != null && notBefore >= candidate ? notBefore + 1 : candidate,
    tags: [['d', disputeDTag(recordId)]],
    content: JSON.stringify({ recordId, category, detail: detail || null, disputedAt: new Date().toISOString() }),
  };
  return finalizeEvent(template, holderSecretKey);
}

function buildWithdrawalEvent(recordId, reason, holderSecretKey, notBefore) {
  assert(recordId, 'recordId is required');
  assert(reason, 'a withdrawal must state a reason (same visibility principle as Spec Part IV.1)');
  const candidate = Math.floor(Date.now() / 1000);
  const template = {
    kind: WITHDRAWAL_KIND,
    created_at: notBefore != null && notBefore >= candidate ? notBefore + 1 : candidate,
    tags: [['d', withdrawalDTag(recordId)]],
    content: JSON.stringify({ recordId, reason, withdrawnAt: new Date().toISOString() }),
  };
  return finalizeEvent(template, holderSecretKey);
}

async function publishDispute(pool, holderSecretKey, recordId, category, detail, relayUrls) {
  const holderPubkey = getPublicKey(holderSecretKey);
  const existing = await fetchLatestAddressable(pool, relayUrls, { pubkey: holderPubkey, kind: DISPUTE_KIND, dTag: disputeDTag(recordId) });
  const event = buildDisputeEvent(recordId, category, detail, holderSecretKey, existing && existing.created_at);
  const publishResult = await publishWithQuorum(pool, event, relayUrls);
  return { event, publishResult };
}

async function publishWithdrawal(pool, holderSecretKey, recordId, reason, relayUrls) {
  const holderPubkey = getPublicKey(holderSecretKey);
  const existing = await fetchLatestAddressable(pool, relayUrls, { pubkey: holderPubkey, kind: WITHDRAWAL_KIND, dTag: withdrawalDTag(recordId) });
  const event = buildWithdrawalEvent(recordId, reason, holderSecretKey, existing && existing.created_at);
  const publishResult = await publishWithQuorum(pool, event, relayUrls);
  return { event, publishResult };
}

async function fetchDispute(pool, holderPubkeyHex, recordId, relayUrls) {
  const event = await fetchLatestAddressable(pool, relayUrls, { pubkey: holderPubkeyHex, kind: DISPUTE_KIND, dTag: disputeDTag(recordId) });
  if (!event) return null;
  return JSON.parse(event.content);
}

async function fetchWithdrawal(pool, holderPubkeyHex, recordId, relayUrls) {
  const event = await fetchLatestAddressable(pool, relayUrls, { pubkey: holderPubkeyHex, kind: WITHDRAWAL_KIND, dTag: withdrawalDTag(recordId) });
  if (!event) return null;
  return JSON.parse(event.content);
}

module.exports = {
  DISPUTE_KIND, WITHDRAWAL_KIND, DISPUTE_CATEGORIES,
  disputeDTag, withdrawalDTag,
  buildDisputeEvent, buildWithdrawalEvent,
  publishDispute, publishWithdrawal,
  fetchDispute, fetchWithdrawal,
};
