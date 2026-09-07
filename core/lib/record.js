'use strict';

// Apache-2.0 -- see LICENSE-APACHE-2.0. Must never import from issuer-tool/, holder-tool/, or any other app -- see CONTRIBUTING.md.
//
// Builds and seals a Common Credo record (Spec v0.3 Part II) as a Nostr
// event, kind 3388 (NOSTR-KINDS.md). Field-validation shape ported from
// toolkit/lib/record.js (the v0.2 demo); R1's content-hash ID and the seal
// itself now come from nostr-tools' finalizeEvent() instead of hand-rolled
// crypto -- see NOSTR-KINDS.md for why.

const { finalizeEvent, getPublicKey, verifyEvent } = require('nostr-tools/pure');
const { CORE_CLAIM_TYPES, HOLDER_IDENTITY_ANCHOR_TYPES, VOUCH_TYPES, OUTCOME_POLARITY } = require('./claimTypes');
const { validateIssuerAnchor } = require('./anchor');

const RECORD_KIND = 3388;
const CC_VERSION = '0.3';

function assert(cond, msg) {
  if (!cond) throw new Error('Record rejected -- ' + msg);
}

// Validates and assembles everything the Spec requires EXCEPT the seal and
// the record ID, which finalizeEvent() derives from this content (R1).
function buildRecordContent(fields, issuerPublicKeyHex) {
  const { issuer, subject, claim, vouchType, stake, claimTypeExtension } = fields;

  // 1. Named issuer + issuer identity anchor (D7)
  assert(issuer && issuer.name && issuer.orgType && issuer.location, 'named issuer needs name, orgType, and location');
  validateIssuerAnchor(issuer.anchor);

  // 2. Subject reference + holder identity anchor (D1)
  assert(subject && subject.reference, 'subject reference is required');
  assert(subject && HOLDER_IDENTITY_ANCHOR_TYPES.includes(subject.identityAnchorType),
    `holder identity anchor must be declared as one of: ${HOLDER_IDENTITY_ANCHOR_TYPES.join(', ')}`);

  // 3. The claim (D2) -- core type, or a marked regional extension
  let claimTypeInfo;
  if (claimTypeExtension) {
    assert(claim && claim.claimType, 'extension claim needs a claimType label');
    claimTypeInfo = { creditJudgement: !!claimTypeExtension.creditJudgement };
  } else {
    assert(claim && CORE_CLAIM_TYPES[claim.claimType],
      `claimType must be a core type (${Object.keys(CORE_CLAIM_TYPES).join(', ')}) or declared as a regional extension`);
    claimTypeInfo = CORE_CLAIM_TYPES[claim.claimType];
  }
  assert(claim.period, 'claim needs a period');
  assert(claim.outcome && OUTCOME_POLARITY.includes(claim.outcome.polarity),
    `claim outcome needs a polarity: ${OUTCOME_POLARITY.join(', ')}`);

  // 4. Vouch type
  assert(VOUCH_TYPES.includes(vouchType), `vouchType must be one of: ${VOUCH_TYPES.join(', ')}`);

  // 5. Recorded skin-in-the-game (D3)
  assert(stake && stake.type, 'stake field is required (financial, reputational, or none)');
  assert(['financial', 'reputational', 'none'].includes(stake.type), 'stake.type invalid');
  if (stake.type === 'none') {
    assert(stake.declaredProfile, 'zero stake requires a declared issuer profile (Spec D3)');
  }

  const flags = [];
  if (stake.type === 'none' && claimTypeInfo.creditJudgement) {
    flags.push('ZERO_STAKE_CREDIT_JUDGEMENT: unbacked credit vouch, price near zero (Spec D3)');
  }

  return {
    ccVersion: CC_VERSION,
    issuer: {
      name: issuer.name,
      orgType: issuer.orgType,
      location: issuer.location,
      publicKey: issuerPublicKeyHex,
      anchor: issuer.anchor,
    },
    subject: {
      reference: subject.reference,
      identityAnchorType: subject.identityAnchorType,
      identityAnchorValue: subject.identityAnchorValue || null,
    },
    claim: {
      claimType: claim.claimType,
      isRegionalExtension: !!claimTypeExtension,
      amount: claim.amount != null ? claim.amount : null,
      period: claim.period,
      outcome: claim.outcome,
    },
    vouchType,
    stake: {
      type: stake.type,
      description: stake.description || null,
      declaredProfile: stake.declaredProfile || null,
    },
    // 8. Revocation pointer -- never a fixed relay URL (see NOSTR-KINDS.md);
    // resolved at verification time via the issuer's NIP-65 relay list.
    revocationPointer: { issuerPubkey: issuerPublicKeyHex, kind: 30300, dTag: 'cc-cancellation-list' },
    flags,
  };
}

// Creates and seals a record. issuerSecretKey is a Uint8Array (from
// lib/keys.js). The issuer's public key is DERIVED from the secret key
// here, never trusted from caller-supplied input -- this rules out an
// entire class of "declared key doesn't match signing key" bugs.
function createRecord(fields, issuerSecretKey, holderPubkeyHex) {
  const issuerPublicKeyHex = getPublicKey(issuerSecretKey);
  const content = buildRecordContent(fields, issuerPublicKeyHex);

  const tags = [
    ['claim', content.claim.claimType],
    ['polarity', content.claim.outcome.polarity],
  ];
  if (holderPubkeyHex) tags.unshift(['p', holderPubkeyHex]);

  const template = {
    kind: RECORD_KIND,
    created_at: Math.floor(Date.now() / 1000), // 7. Dates -- single source of truth, see NOSTR-KINDS.md
    tags,
    content: JSON.stringify(content),
  };

  // finalizeEvent computes id = sha256(canonical serialization) per NIP-01
  // (R1: content-hash record ID) and signs id with the issuer's key
  // (Part II.2.2 #6: the seal). Both properties from one library call.
  return finalizeEvent(template, issuerSecretKey);
}

// Structural genuineness check: does the event's signature match its own
// id, and does its id match its own content? (See lib/verify.js for the
// full two-check flow including cancellation-list lookup.)
function recordIsStructurallySealed(record) {
  return verifyEvent(record);
}

function parseRecordContent(record) {
  return JSON.parse(record.content);
}

module.exports = {
  RECORD_KIND,
  CC_VERSION,
  buildRecordContent,
  createRecord,
  recordIsStructurallySealed,
  parseRecordContent,
};
