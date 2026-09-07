'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { generateSecretKey } = require('nostr-tools/pure');
const { createRecord, recordIsStructurallySealed, parseRecordContent, RECORD_KIND } = require('common-credo-core/lib/record');

function validFields(overrides) {
  return Object.assign({
    issuer: {
      name: 'Test Co-op', orgType: 'cooperative', location: 'Nairobi, Kenya',
      anchor: { type: 'cooperative_ngo_registration', country: 'KE', value: 'COOP-1' },
    },
    subject: { reference: 'Amina Yusuf', identityAnchorType: 'phone_number', identityAnchorValue: '+254-700-000-000' },
    claim: { claimType: 'trade_credit_honoured', amount: 500, period: '2025', outcome: { polarity: 'positive', detail: 'ok' } },
    vouchType: 'saw_money_move',
    stake: { type: 'financial', description: 'bonding deposit' },
  }, overrides);
}

test('creates a structurally sealed record of the right kind', () => {
  const sk = generateSecretKey();
  const record = createRecord(validFields(), sk);
  assert.equal(record.kind, RECORD_KIND);
  assert.equal(recordIsStructurallySealed(record), true);
});

test('record ID is the content hash -- tampering breaks it', () => {
  const sk = generateSecretKey();
  const record = createRecord(validFields(), sk);
  const tampered = JSON.parse(JSON.stringify(record));
  tampered.content = tampered.content.replace('500', '999999');
  assert.equal(recordIsStructurallySealed(tampered), false);
});

test('two different records get different content-hash IDs', () => {
  const sk = generateSecretKey();
  const a = createRecord(validFields(), sk);
  const b = createRecord(validFields({ claim: { claimType: 'loan_repaid', period: '2025', outcome: { polarity: 'positive' } } }), sk);
  assert.notEqual(a.id, b.id);
});

test('rejects a missing issuer anchor (D7 -- no anonymous issuers)', () => {
  const sk = generateSecretKey();
  assert.throws(() => createRecord(validFields({ issuer: { name: 'X', orgType: 'ngo', location: 'Y' } }), sk), /anchor/i);
});

test('rejects an invalid holder identity anchor type (D1)', () => {
  const sk = generateSecretKey();
  assert.throws(
    () => createRecord(validFields({ subject: { reference: 'A', identityAnchorType: 'not_real' } }), sk),
    /holder identity anchor/i
  );
});

test('rejects a claim type outside the core list without a marked extension (D2)', () => {
  const sk = generateSecretKey();
  assert.throws(
    () => createRecord(validFields({ claim: { claimType: 'made_up_type', period: '2025', outcome: { polarity: 'positive' } } }), sk),
    /claimType must be a core type/
  );
});

test('accepts a marked regional extension claim type (D2)', () => {
  const sk = generateSecretKey();
  const record = createRecord(validFields({
    claim: { claimType: 'harambee_contribution_honoured', period: '2025', outcome: { polarity: 'positive' } },
    claimTypeExtension: { creditJudgement: false },
  }), sk);
  const content = parseRecordContent(record);
  assert.equal(content.claim.isRegionalExtension, true);
});

test('zero stake on a credit-judgement claim is valid but flagged (D3)', () => {
  const sk = generateSecretKey();
  const record = createRecord(validFields({ stake: { type: 'none', declaredProfile: 'community registry, factual attestation only' } }), sk);
  const content = parseRecordContent(record);
  assert.equal(content.flags.length, 1);
  assert.match(content.flags[0], /ZERO_STAKE_CREDIT_JUDGEMENT/);
});

test('zero stake without a declared profile is rejected (D3)', () => {
  const sk = generateSecretKey();
  assert.throws(() => createRecord(validFields({ stake: { type: 'none' } }), sk), /declared issuer profile/);
});

test('zero stake on a factual (non-credit-judgement) claim needs no flag', () => {
  const sk = generateSecretKey();
  const record = createRecord(validFields({
    claim: { claimType: 'membership_good_standing', period: '2025', outcome: { polarity: 'neutral' } },
    stake: { type: 'none', declaredProfile: 'cooperative attesting a membership fact' },
  }), sk);
  const content = parseRecordContent(record);
  assert.equal(content.flags.length, 0);
});

test('issuer public key in content is derived from the signing key, never trusted from caller input', () => {
  const sk = generateSecretKey();
  const record = createRecord(validFields(), sk);
  const content = parseRecordContent(record);
  assert.equal(content.issuer.publicKey, record.pubkey);
  assert.equal(content.revocationPointer.issuerPubkey, record.pubkey);
});

test('revocation pointer never stores a relay URL, only issuer pubkey + kind + d-tag', () => {
  const sk = generateSecretKey();
  const record = createRecord(validFields(), sk);
  const content = parseRecordContent(record);
  assert.deepEqual(Object.keys(content.revocationPointer).sort(), ['dTag', 'issuerPubkey', 'kind']);
  assert.equal(content.revocationPointer.kind, 30300);
});
