'use strict';

const nacl = require('tweetnacl');
const { canonicalBytes } = require('./canonical');
const { fromHex, lookupIssuer } = require('./keys');
const { sealMatchesEmbeddedKey } = require('./seal');
const { loadList } = require('./cancel');

// --- Check 1: is it genuine? (Spec Part III) -------------------------------
// The Spec's own Check 1 is purely structural: "verify the seal against the
// issuer's public key... answered from the record itself, like a
// watermark." We report that as `structurallySealed`. But (Gap 1) a
// structural pass only proves internal self-consistency -- it does not
// prove the embedded key belongs to the named issuer. `issuerKeyConfirmed`
// cross-checks the record's self-declared key against the demo directory
// stand-in (lib/keys.js) for that missing trust root. `genuine` is true
// only when both hold -- named clearly so the two are never conflated.
function checkGenuine(record) {
  const structurallySealed = sealMatchesEmbeddedKey(record);

  const directoryEntry = lookupIssuer(record.issuer.name);
  const issuerKeyConfirmed = !!directoryEntry && directoryEntry.publicKey === record.issuer.publicKey;

  return {
    structurallySealed,
    issuerKeyConfirmed,
    issuerKeyConfirmedNote: directoryEntry
      ? null
      : `"${record.issuer.name}" is not in the demo trust-root directory -- this is Gap 1: nothing outside the record itself vouches that its embedded key really belongs to the named issuer.`,
    genuine: structurallySealed && issuerKeyConfirmed,
  };
}

// --- Check 2: is it still valid? (Spec Part III, D6) -----------------------
// Reads the revocation pointer OUT OF THE RECORD ITSELF and checks the
// issuer's own signed cancellation list. Degraded-check rules from the
// Spec: an unreachable list means "unverifiable, priced accordingly" -- not
// rejected, not accepted.
function checkStillValid(record) {
  const { issuer: issuerName, address } = record.revocationPointer;

  const directoryEntry = lookupIssuer(issuerName);
  const addressConfirmed = !!directoryEntry && directoryEntry.cancellationListAddress === address;

  const list = loadList(issuerName);
  if (list.missing) {
    return { checked: false, status: 'unverifiable', reason: 'dead issuer: no cancellation list found at all', addressConfirmed };
  }

  // The list itself must carry a valid seal, or it isn't the tamper-proof
  // noticeboard the Spec describes -- verify against the directory-confirmed
  // key when we have one (the Gap-1-aware check), falling back to the
  // record's own self-declared key with that fact noted.
  const keyForListCheck = directoryEntry ? directoryEntry.publicKey : record.issuer.publicKey;
  let listSealValid = false;
  if (list.seal) {
    const { seal, ...body } = list;
    listSealValid = nacl.sign.detached.verify(canonicalBytes(body), fromHex(seal.signature), fromHex(keyForListCheck));
  }
  if (!listSealValid) {
    return { checked: false, status: 'unverifiable', reason: 'cancellation list seal did not verify', addressConfirmed };
  }

  const entry = list.entries.find((e) => e.recordId === record.recordId);
  if (!entry) {
    return { checked: true, status: 'valid', addressConfirmed };
  }
  return {
    checked: true,
    status: 'cancelled',
    reason: entry.reason,
    cancelledBy: entry.cancelledBy,
    disputed: !!entry.disputed,
    disputeReason: entry.disputeReason || null,
    cancelledAt: entry.cancelledAt,
    addressConfirmed,
  };
}

// Runs both checks and records which ones completed, per Spec Part VI
// conformance rule: "performs both checks... and records which checks
// completed."
function verifyRecord(record) {
  const check1 = checkGenuine(record);
  const check2 = checkStillValid(record);
  return {
    recordId: record.recordId,
    check1,
    check2,
    checksCompleted: { check1: true, check2: true },
    overall: !check1.genuine ? 'not_genuine' : (check2.status === 'cancelled' ? 'cancelled' : (check2.status === 'unverifiable' ? 'unverifiable' : 'valid')),
  };
}

module.exports = { checkGenuine, checkStillValid, verifyRecord };
