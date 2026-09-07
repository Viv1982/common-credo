'use strict';

const crypto = require('crypto');
const { canonicalBytes } = require('./canonical');

// D2 -- the working core claim-type list named in the Spec (Part II.2.2 #3),
// each marked with whether it is a credit-judgement (relevant to D3's
// zero-stake flag) or a factual attestation. This finalised list is an open
// item per Spec Part VII ("to be locked with the first warm-seed
// community") -- treat this as a placeholder working set, not a locked one.
const CORE_CLAIM_TYPES = {
  loan_repaid: { creditJudgement: true },
  loan_defaulted: { creditJudgement: true },
  trade_credit_honoured: { creditJudgement: true },
  trade_credit_defaulted: { creditJudgement: true },
  supplier_payments_record: { creditJudgement: true },
  savings_record: { creditJudgement: false },
  membership_good_standing: { creditJudgement: false },
  registration_licence_fact: { creditJudgement: false },
  character_vouch: { creditJudgement: false },
};

const IDENTITY_ANCHOR_TYPES = ['national_id', 'company_registration', 'phone_number', 'community_register'];
const VOUCH_TYPES = ['saw_money_move', 'knows_character'];
const OUTCOME_POLARITY = ['positive', 'negative', 'neutral'];

function assert(cond, msg) {
  if (!cond) throw new Error('Record rejected -- ' + msg);
}

// Builds the mandatory-field body of a record (everything except the
// record ID and the seal, which are derived from this body). Throws if any
// Spec Part II.2.2 mandatory field is missing -- "a record is not a valid
// CC record unless it contains ALL of the following."
function buildRecordBody(fields) {
  const { issuer, subject, claim, vouchType, stake, issuedAt, revocationPointer, claimTypeExtension } = fields;

  // 1. Named issuer (Part II.2.2 #1)
  assert(issuer && issuer.name && issuer.orgType && issuer.location && issuer.publicKey,
    'named issuer needs name, orgType, location, and publicKey');

  // 2. Subject reference with declared identity anchor (D1)
  assert(subject && subject.reference, 'subject reference is required');
  assert(subject && IDENTITY_ANCHOR_TYPES.includes(subject.identityAnchorType),
    `identity anchor must be declared as one of: ${IDENTITY_ANCHOR_TYPES.join(', ')}`);

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

  // 7. Dates (issuance date, "always prominent")
  assert(issuedAt, 'issuedAt date is required');

  // 8. Revocation pointer -- address of the issuer's cancellation list
  assert(revocationPointer && revocationPointer.issuer && revocationPointer.address,
    'revocationPointer (issuer + address of the cancellation list) is required');

  // D3 flag: a credit-judgement claim with zero stake is valid but must be
  // visibly flagged, so verifiers price it near zero rather than missing it.
  const flags = [];
  if (stake.type === 'none' && claimTypeInfo.creditJudgement) {
    flags.push('ZERO_STAKE_CREDIT_JUDGEMENT: unbacked credit vouch, price near zero (Spec D3)');
  }

  return {
    issuer: {
      name: issuer.name,
      orgType: issuer.orgType,
      location: issuer.location,
      publicKey: issuer.publicKey,
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
    issuedAt,
    revocationPointer: {
      issuer: revocationPointer.issuer,
      address: revocationPointer.address,
    },
    flags,
  };
}

// --- Gap 2 fix ------------------------------------------------------------
// Spec Parts III and IV both refer to "record IDs" in the cancellation
// list and cancellation entries, but Part II.2.2's list of mandatory
// fields never actually defines one. Without a stable identifier, nothing
// tells a verifier which entry in an issuer's cancellation list corresponds
// to the record in front of them. We fill that gap here: the record ID is
// the SHA-256 hash of the canonical record body, computed BEFORE sealing.
// This keeps it content-addressed and tamper-evident by construction (the
// same "two halves must match" logic as the seal itself) rather than an
// arbitrary counter an issuer could reassign.
function computeRecordId(body) {
  return crypto.createHash('sha256').update(canonicalBytes(body)).digest('hex');
}

function createRecord(fields) {
  const body = buildRecordBody(fields);
  const recordId = computeRecordId(body);
  return Object.assign({ recordId }, body);
}

module.exports = {
  CORE_CLAIM_TYPES,
  IDENTITY_ANCHOR_TYPES,
  VOUCH_TYPES,
  createRecord,
  computeRecordId,
};
