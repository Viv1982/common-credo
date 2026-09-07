'use strict';

// Headless tests for the wallet's orchestration layer (actions.js), the same
// way core/ is tested: real IndexedDB store (fake-indexeddb), the shared core
// engine, and a FakePool injected in place of live relays. Proves every
// holder action -- onboarding, unlock, import, dispute, withdraw, bundle --
// without a browser, and that the withdraw path produces a record that
// verify.js reads back as "withdrawn by holder" (the same end-to-end
// assertion the Phase 1 spike made in a real browser).

require('fake-indexeddb/auto');

const test = require('node:test');
const assert = require('node:assert/strict');

const store = require('../src/store-idb');
const engine = require('../src/engine');
const { makeActions } = require('../src/actions');
const { FakePool } = require('../../core/test/helpers/fakePool');
const { createRecord } = require('common-credo-core/lib/record');

const GOOD_PW = 'password123';

function makeSessionStub(pool) {
  let sk = null;
  let pending = null;
  return {
    getPool: () => pool,
    getRelays: () => ['wss://fake-a', 'wss://fake-b'],
    isUnlocked: () => sk !== null,
    setUnlockedSecretKey: (k) => { sk = k; },
    getUnlockedSecretKey: () => sk,
    lock: () => { sk = null; },
    setPendingOnboardingKeypair: (kp) => { pending = kp; },
    getPendingOnboardingKeypair: () => pending,
    clearPendingOnboardingKeypair: () => { pending = null; },
  };
}

function baseFields(overrides) {
  return Object.assign({
    issuer: { name: 'Spike Co-op', orgType: 'cooperative', location: 'Nairobi, Kenya',
      anchor: { type: 'cooperative_ngo_registration', country: 'KE', value: 'PWA-1' } },
    subject: { reference: 'Amina Yusuf', identityAnchorType: 'phone_number', identityAnchorValue: '+254-700-000-000' },
    claim: { claimType: 'trade_credit_honoured', amount: 500, period: '2025', outcome: { polarity: 'positive', detail: 'honoured on time' } },
    vouchType: 'saw_money_move',
    stake: { type: 'financial', description: 'bonding deposit' },
  }, overrides);
}

let session, actions;
test.beforeEach(async () => {
  await store.clearAll();
  session = makeSessionStub(new FakePool());
  actions = makeActions({ store, session, engine });
});

// Onboard and return the holder's public key (used to mint records about her).
async function onboard() {
  await actions.generateOnboardingKey();
  await actions.completeOnboarding({ confirmedBackup: true, password: GOOD_PW, passwordConfirm: GOOD_PW });
  return (await store.loadHolderProfile()).publicKey;
}

test('onboarding: generate returns nsec/npub, complete persists and unlocks', async () => {
  const backup = await actions.generateOnboardingKey();
  assert.match(backup.nsec, /^nsec1/);
  assert.match(backup.npub, /^npub1/);
  assert.equal(await store.isOnboarded(), false, 'nothing persisted until complete');

  await actions.completeOnboarding({ confirmedBackup: true, password: GOOD_PW, passwordConfirm: GOOD_PW });
  assert.equal(await store.isOnboarded(), true);
  assert.equal(session.isUnlocked(), true);
  const profile = await store.loadHolderProfile();
  assert.equal(profile.npub, backup.npub);
});

test('onboarding validations', async () => {
  await actions.generateOnboardingKey();
  await assert.rejects(actions.completeOnboarding({ confirmedBackup: false, password: GOOD_PW, passwordConfirm: GOOD_PW }), /confirm you saved/);
  await assert.rejects(actions.completeOnboarding({ confirmedBackup: true, password: GOOD_PW, passwordConfirm: 'other' }), /did not match/);
  await assert.rejects(actions.completeOnboarding({ confirmedBackup: true, password: 'short', passwordConfirm: 'short' }), /at least 8/);
});

test('completeOnboarding with no pending key is rejected', async () => {
  await assert.rejects(actions.completeOnboarding({ confirmedBackup: true, password: GOOD_PW, passwordConfirm: GOOD_PW }), /expired/);
});

test('unlock: correct password restores the key, wrong password fails', async () => {
  await onboard();
  session.lock();
  assert.equal(session.isUnlocked(), false);
  await actions.unlock(GOOD_PW);
  assert.equal(session.isUnlocked(), true);

  session.lock();
  await assert.rejects(actions.unlock('wrong-password'), /Wrong password/);
});

test('import: seals are validated, contents parsed, duplicates are no-ops', async () => {
  const holderPub = await onboard();
  const issuer = engine.generateKeypair();
  const record = createRecord(baseFields(), issuer.secretKey, holderPub);

  const first = await actions.importRecord(JSON.stringify(record));
  assert.equal(first.alreadyPresent, false);
  assert.equal(await store.hasRecord(record.id), true);

  const again = await actions.importRecord(JSON.stringify(record));
  assert.equal(again.alreadyPresent, true, 'same record id is idempotent');
  assert.equal((await store.loadAllImportedRecords()).length, 1);
});

test('import rejects tampered and non-JSON files', async () => {
  const holderPub = await onboard();
  const issuer = engine.generateKeypair();
  const record = createRecord(baseFields(), issuer.secretKey, holderPub);
  const tampered = JSON.parse(JSON.stringify(record));
  tampered.content = tampered.content.replace('500', '999999');

  await assert.rejects(actions.importRecord(JSON.stringify(tampered)), /seal does not check out/);
  await assert.rejects(actions.importRecord('not json {{{'), /not valid JSON/);
  assert.equal((await store.loadAllImportedRecords()).length, 0, 'nothing persisted on rejection');
});

test('withdraw publishes 30303 and verify then reads it back as withdrawn_by_holder', async () => {
  const holderPub = await onboard();
  const issuer = engine.generateKeypair();
  const record = createRecord(baseFields(), issuer.secretKey, holderPub);
  await store.saveImportedRecord(record);

  const res = await actions.withdraw(record.id, 'no longer wish to show this');
  assert.equal(res.publishResult.ok, true);
  assert.equal(res.event.kind, 30303);

  const v = await engine.verifyRecord(session.getPool(), record, session.getRelays(), holderPub);
  assert.equal(v.overall, 'withdrawn_by_holder');
  assert.equal(v.check1.genuine, true);
});

test('withdraw requires a reason', async () => {
  await onboard();
  await assert.rejects(actions.withdraw('some-id', ''), /must state a reason/);
});

test('fileDispute publishes a 30301 event', async () => {
  await onboard();
  const res = await actions.fileDispute('rec-abc', 'cancellation_retaliatory', 'the invoices were real');
  assert.equal(res.publishResult.ok, true);
  assert.equal(res.event.kind, 30301);
});

test('buildBundle assembles the export envelope; empty selection is rejected', async () => {
  const holderPub = await onboard();
  const issuer = engine.generateKeypair();
  const r1 = createRecord(baseFields(), issuer.secretKey, holderPub);
  const r2 = createRecord(baseFields({ claim: { claimType: 'loan_repaid', amount: 200, period: '2024', outcome: { polarity: 'positive', detail: 'repaid' } } }), issuer.secretKey, holderPub);
  await store.saveImportedRecord(r1);
  await store.saveImportedRecord(r2);

  const { standing, envelope } = await actions.buildBundle([r1.id, r2.id], []);
  assert.equal(envelope.ccBundleVersion, '0.3');
  assert.equal(envelope.holderPubkey, holderPub);
  assert.equal(envelope.records.length, 2);
  assert.equal(standing.summary.shownInStandard, 2);

  await assert.rejects(actions.buildBundle([], []), /at least one/);
});

test('key backup: export returns the stored payload and marks it exported', async () => {
  await onboard();
  assert.equal(await actions.isKeyFileExported(), false);
  const payload = await actions.exportKeyPayload();
  assert.equal(payload.algorithm, 'aes-256-gcm');
  assert.equal(payload.version, 1);
  await actions.markKeyExported();
  assert.equal(await actions.isKeyFileExported(), true);
});

test('restore: a key file + correct password rebuilds the identity on a fresh device', async () => {
  // Device A: onboard and export.
  const holderPub = await onboard();
  const npubA = (await store.loadHolderProfile()).npub;
  const payload = await actions.exportKeyPayload();

  // Device B: fresh store + fresh session, only the exported file + password.
  await store.clearAll();
  session = makeSessionStub(new FakePool());
  actions = makeActions({ store, session, engine });
  assert.equal(await store.isOnboarded(), false);

  const { npub } = await actions.restoreFromKeyFile(JSON.stringify(payload), GOOD_PW);
  assert.equal(npub, npubA, 'restored identity matches the original');
  assert.equal((await store.loadHolderProfile()).publicKey, holderPub);
  assert.equal(session.isUnlocked(), true, 'restore also unlocks');
  assert.equal(await store.isOnboarded(), true);
});

test('restore rejects a wrong password and a non-key file', async () => {
  const holderPub = await onboard();
  const payload = await actions.exportKeyPayload();
  await store.clearAll();
  session = makeSessionStub(new FakePool());
  actions = makeActions({ store, session, engine });

  await assert.rejects(actions.restoreFromKeyFile(JSON.stringify(payload), 'wrong-password'), /Wrong password/);
  await assert.rejects(actions.restoreFromKeyFile('not a key file', GOOD_PW), /not a valid Common Credo key file/);
  assert.equal(await store.isOnboarded(), false, 'nothing restored on failure');
});

test('loadWallet returns live verification for each record', async () => {
  const holderPub = await onboard();
  const issuer = engine.generateKeypair();
  const record = createRecord(baseFields(), issuer.secretKey, holderPub);
  await store.saveImportedRecord(record);

  const { profile, rows } = await actions.loadWallet();
  assert.equal(profile.publicKey, holderPub);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].verification.check1.genuine, true);
  assert.equal(rows[0].content.claim.claimType, 'trade_credit_honoured');
});
