'use strict';

// Route-level logic tests: envelope validation and the check/render data
// assembly, using the FakePool (same pattern as core/issuer-tool/holder-tool)
// so this suite stays fast and offline -- the checking logic itself is
// already proven against real relays in the manual verification step and
// against every status branch in sync.test.js.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { generateSecretKey, getPublicKey } = require('nostr-tools/pure');
const { FakePool } = require('./helpers/fakePool');
const { validateEnvelope, runCheck } = require('../src/routes/check');
const { createRecord } = require('common-credo-core/lib/record');
const cancellationList = require('common-credo-core/lib/cancellationList');

const RELAYS = ['wss://fake-a', 'wss://fake-b'];

function issuerInfo() {
  return { name: 'Check Test Co-op', orgType: 'cooperative', location: 'Nairobi, Kenya', anchor: { type: 'cooperative_ngo_registration', country: 'KE', value: 'CHK-1' } };
}

test('validateEnvelope rejects non-object input', () => {
  assert.throws(() => validateEnvelope(null), /not a Common Credo bundle/);
  assert.throws(() => validateEnvelope('a string'), /not a Common Credo bundle/);
  assert.throws(() => validateEnvelope([1, 2, 3]), /not a Common Credo bundle/);
});

test('validateEnvelope rejects an empty or missing records array', () => {
  assert.throws(() => validateEnvelope({}), /no records/);
  assert.throws(() => validateEnvelope({ records: [] }), /no records/);
  assert.throws(() => validateEnvelope({ records: 'not-an-array' }), /no records/);
});

test('validateEnvelope rejects records missing required Nostr-event fields', () => {
  assert.throws(() => validateEnvelope({ records: [{ id: 'x' }] }), /not shaped like a Common Credo record/);
  assert.throws(() => validateEnvelope({ records: [{ id: 'x', sig: 'y', pubkey: 'z', content: 123 }] }), /not shaped like a Common Credo record/);
});

test('validateEnvelope accepts a well-shaped envelope without throwing', () => {
  assert.doesNotThrow(() => validateEnvelope({
    records: [{ id: 'x', sig: 'y', pubkey: 'z', content: '{}' }],
  }));
});

test('runCheck produces a not_genuine result for a tampered record', async () => {
  const pool = new FakePool();
  const issuer = { secretKey: generateSecretKey() };
  issuer.publicKey = getPublicKey(issuer.secretKey);
  await cancellationList.initializeList(pool, issuer.secretKey, RELAYS);

  const record = createRecord({
    issuer: issuerInfo(),
    subject: { reference: 'Amina Yusuf', identityAnchorType: 'phone_number' },
    claim: { claimType: 'trade_credit_honoured', amount: 500, period: '2025', outcome: { polarity: 'positive', detail: 'x' } },
    vouchType: 'saw_money_move', stake: { type: 'financial', description: 'x' },
  }, issuer.secretKey);

  const tampered = JSON.parse(JSON.stringify(record));
  tampered.content = tampered.content.replace('500', '999999');

  const [result] = await runCheck(pool, RELAYS, { records: [tampered] });
  assert.equal(result.verification.overall, 'not_genuine');
  assert.equal(result.verification.check1.genuine, false);
});

test('runCheck produces an unverifiable result for a dead issuer', async () => {
  const pool = new FakePool();
  const ghost = { secretKey: generateSecretKey() };
  ghost.publicKey = getPublicKey(ghost.secretKey);
  // deliberately never initializeList -- no noticeboard published at all

  const record = createRecord({
    issuer: issuerInfo(),
    subject: { reference: 'Amina Yusuf', identityAnchorType: 'phone_number' },
    claim: { claimType: 'character_vouch', period: '2020', outcome: { polarity: 'positive', detail: 'x' } },
    vouchType: 'knows_character', stake: { type: 'reputational', description: 'x' },
  }, ghost.secretKey);

  const [result] = await runCheck(pool, RELAYS, { records: [record] });
  assert.equal(result.verification.overall, 'unverifiable');
});

test('runCheck handles a record whose content is not valid JSON without crashing', async () => {
  const pool = new FakePool();
  const issuer = { secretKey: generateSecretKey() };
  issuer.publicKey = getPublicKey(issuer.secretKey);
  await cancellationList.initializeList(pool, issuer.secretKey, RELAYS);

  const record = createRecord({
    issuer: issuerInfo(),
    subject: { reference: 'Amina Yusuf', identityAnchorType: 'phone_number' },
    claim: { claimType: 'trade_credit_honoured', period: '2025', outcome: { polarity: 'positive', detail: 'x' } },
    vouchType: 'saw_money_move', stake: { type: 'financial', description: 'x' },
  }, issuer.secretKey);

  // Corrupt content into non-JSON while keeping the object otherwise
  // record-shaped (id/sig/pubkey intact) -- exercises the parseRecordContent
  // catch branch in runCheck, not just checkGenuine.
  //
  // MUST clone via JSON round-trip, not Object.assign/spread: nostr-tools'
  // verifyEvent caches its result as a property keyed by a well-known
  // Symbol directly on the event object (a real perf optimization, not a
  // bug) -- Object.assign copies symbol-keyed properties along with
  // everything else, so a shallow copy of an already-verified record
  // silently inherits a stale "verified: true" and never gets re-checked,
  // even after content is corrupted. JSON.stringify drops symbol keys
  // entirely, which is exactly what forces a fresh, honest verification
  // here. Found by this test failing for the wrong reason during
  // development -- worth keeping this comment so nobody "fixes" a future
  // version of this test back into the trap.
  const corrupted = JSON.parse(JSON.stringify(record));
  corrupted.content = 'not json at all {{{';

  const [result] = await runCheck(pool, RELAYS, { records: [corrupted] });
  assert.equal(result.content.issuer.name, '(unreadable)');
  // The seal check runs against the record's OWN id/content pairing --
  // corrupting content after signing also fails Check 1, as expected.
  assert.equal(result.verification.check1.genuine, false);
});
