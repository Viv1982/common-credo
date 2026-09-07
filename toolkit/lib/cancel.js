'use strict';

const fs = require('fs');
const path = require('path');
const nacl = require('tweetnacl');
const { canonicalBytes } = require('./canonical');
const { fromHex, toHex, DATA_DIR } = require('./keys');
const { mkdirpSync } = require('./fsutil');

function issuerDir(issuerName) {
  return path.join(DATA_DIR, 'issuers', issuerName);
}
function listPath(issuerName) {
  return path.join(issuerDir(issuerName), 'cancellation_list.json');
}

// Spec Part III -- "a small signed file, published at the issuer's own
// address, containing only record IDs and cancellation status." We keep
// reason/disputed alongside status because Part IV requires every
// cancellation to carry a permanent, visible reason and a disputable flag.
function loadList(issuerName) {
  const p = listPath(issuerName);
  // No file at all means this issuer has never published a list -- the
  // Spec's "dead issuer" case. This is distinct from a file that exists but
  // is signed-and-empty, which is what an honest issuer with nothing to
  // report looks like ("Honest issuers' lists sit mostly empty" -- Part
  // III implies the list exists from the start, just usually with no
  // entries, not that it's absent until the first cancellation).
  if (!fs.existsSync(p)) return { issuer: issuerName, entries: [], missing: true };
  const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
  return raw;
}

// An issuer publishes its (empty) signed list the moment it starts
// vouching, so a verifier always finds a genuine noticeboard to check --
// even one with nothing on it yet.
function initializeList(issuerName, issuerSecretKeyHex) {
  if (fs.existsSync(listPath(issuerName))) return loadList(issuerName);
  return saveList(issuerName, [], issuerSecretKeyHex);
}

// Only the issuer's own key may sign its list ("hosting delegable, signing
// never" -- Part III). Re-signing on every change is what makes the list
// tamper-proof: nobody, including CC, can alter an entry after the fact
// without invalidating the whole file's seal.
function saveList(issuerName, entries, issuerSecretKeyHex) {
  const body = { issuer: issuerName, entries };
  const signature = nacl.sign.detached(canonicalBytes(body), fromHex(issuerSecretKeyHex));
  const signed = Object.assign({}, body, {
    seal: { algorithm: 'ed25519', signature: toHex(signature), signedAt: new Date().toISOString() },
  });
  mkdirpSync(issuerDir(issuerName));
  fs.writeFileSync(listPath(issuerName), JSON.stringify(signed, null, 2));
  return signed;
}

function upsertEntry(entries, recordId, patch) {
  const idx = entries.findIndex((e) => e.recordId === recordId);
  if (idx === -1) {
    entries.push(Object.assign({ recordId }, patch));
  } else {
    entries[idx] = Object.assign({}, entries[idx], patch);
  }
  return entries;
}

// --- D5: issuer-initiated cancellation -----------------------------------
// "The issuer may cancel a record it signed -- the legitimate grounds being
// fraud discovered after issue, or genuine error." This is the clean case:
// the issuer holds the only key that can write to the list, and is acting
// on its own signature, so there is no gap here.
function issuerCancel(record, issuerSecretKeyHex, reason) {
  if (!reason) throw new Error('a cancellation must state a reason (Spec Part IV)');
  const issuerName = record.issuer.name;
  const list = loadList(issuerName);
  upsertEntry(list.entries, record.recordId, {
    status: 'cancelled',
    cancelledBy: 'issuer',
    reason,
    disputed: false,
    cancelledAt: new Date().toISOString(),
  });
  return saveList(issuerName, list.entries, issuerSecretKeyHex);
}

// --- D5: holder-initiated cancellation -- Gap 3 made visible --------------
// "The holder may cancel any record about themselves ... Ownership you
// cannot exercise is not ownership." But Part III allows only the ISSUER's
// key to sign the one list a verifier actually checks. So a holder cannot,
// by themselves, make a verifier see their record as cancelled -- they can
// only ask the issuer to. This function returns a plain, unsigned request:
// on its own it changes nothing a verifier will see. Call
// issuerHonourHolderRequest() to actually make it count. If the issuer
// never does (is unreachable, uncooperative, or simply slow), the holder's
// spec-granted right has no path into the mechanism that decides validity
// -- which is the gap, demonstrated rather than papered over.
function requestHolderCancellation(record, reason) {
  if (!reason) throw new Error('a cancellation must state a reason (Spec Part IV)');
  return {
    recordId: record.recordId,
    issuer: record.issuer.name,
    requestedBy: 'holder',
    reason,
    requestedAt: new Date().toISOString(),
    honoured: false,
  };
}

function issuerHonourHolderRequest(request, issuerSecretKeyHex) {
  const list = loadList(request.issuer);
  upsertEntry(list.entries, request.recordId, {
    status: 'cancelled',
    cancelledBy: 'holder',
    reason: request.reason,
    disputed: false,
    cancelledAt: new Date().toISOString(),
  });
  return saveList(request.issuer, list.entries, issuerSecretKeyHex);
}

// Part IV -- "if the holder disputes it, the disputed flag travels with the
// cancellation for all verifiers to see." Same mechanical note as above:
// only the issuer's key can publish that flag into the authoritative list,
// even though the dispute itself is the holder's assertion, not the
// issuer's. Modelled here as the issuer incorporating a holder's dispute.
function attachDispute(issuerName, recordId, disputeReason, issuerSecretKeyHex) {
  const list = loadList(issuerName);
  const entry = list.entries.find((e) => e.recordId === recordId);
  if (!entry) throw new Error('no cancellation entry to dispute for this record');
  upsertEntry(list.entries, recordId, { disputed: true, disputeReason });
  return saveList(issuerName, list.entries, issuerSecretKeyHex);
}

module.exports = {
  loadList,
  saveList,
  initializeList,
  issuerCancel,
  requestHolderCancellation,
  issuerHonourHolderRequest,
  attachDispute,
  listPath,
};
