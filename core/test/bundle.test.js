'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { generateSecretKey, getPublicKey, finalizeEvent } = require('nostr-tools/pure');
const { FakePool } = require('./helpers/fakePool');
const { createRecord } = require('../lib/record');
const cancellationList = require('../lib/cancellationList');
const holderActions = require('../lib/holderActions');
const { readBundle } = require('../lib/bundle');

const RELAYS = ['wss://fake-a', 'wss://fake-b'];

function issuerInfo() {
  return { name: 'Bundle Test Co-op', orgType: 'cooperative', location: 'Nairobi, Kenya', anchor: { type: 'cooperative_ngo_registration', country: 'KE', value: 'B-1' } };
}

// Hand-crafts an aged record (bundle.js reads age off the event's own
// created_at, which createRecord always stamps as "now" -- so an aged
// fixture needs to be built directly with finalizeEvent, same technique
// used in the live smoke test during development).
function agedRecord(issuerSecretKey, issuerPubkey, ageYears, polarity, claimType) {
  const content = JSON.stringify({
    ccVersion: '0.3', issuer: issuerInfo(),
    subject: { reference: 'Amina', identityAnchorType: 'phone_number', identityAnchorValue: null },
    claim: { claimType, isRegionalExtension: false, amount: 300, period: '2018', outcome: { polarity, detail: 'x' } },
    vouchType: 'saw_money_move', stake: { type: 'financial', description: 'x', declaredProfile: null },
    revocationPointer: { issuerPubkey, kind: 30300, dTag: 'cc-cancellation-list' }, flags: [],
  });
  const createdAt = Math.floor(Date.now() / 1000) - Math.round(ageYears * 365 * 24 * 3600);
  return finalizeEvent({ kind: 3388, created_at: createdAt, tags: [], content }, issuerSecretKey);
}

test('a fresh positive record is shown; an old negative record is lapsed and hidden by default', async () => {
  const pool = new FakePool();
  const issuer = generateSecretKey();
  const issuerPubkey = getPublicKey(issuer);
  const holder = generateSecretKey();
  const holderPubkey = getPublicKey(holder);
  await cancellationList.initializeList(pool, issuer, RELAYS);

  const fresh = createRecord({
    issuer: issuerInfo(), subject: { reference: 'Amina', identityAnchorType: 'phone_number' },
    claim: { claimType: 'trade_credit_honoured', period: '2025', outcome: { polarity: 'positive', detail: 'ok' } },
    vouchType: 'saw_money_move', stake: { type: 'financial', description: 'x' },
  }, issuer, holderPubkey);
  const old = agedRecord(issuer, issuerPubkey, 8, 'negative', 'loan_defaulted');

  const bundle = await readBundle(pool, [fresh, old], RELAYS, holderPubkey);
  assert.equal(bundle.summary.totalRecordsInWallet, 2);
  assert.equal(bundle.summary.shownInStandard, 1);
  assert.equal(bundle.summary.hiddenAsLapsed, 1);
  assert.equal(bundle.summary.positive, 1);
});

test('the holder can force-show a lapsed record', async () => {
  const pool = new FakePool();
  const issuer = generateSecretKey();
  const issuerPubkey = getPublicKey(issuer);
  const holderPubkey = getPublicKey(generateSecretKey());
  await cancellationList.initializeList(pool, issuer, RELAYS);

  const old = agedRecord(issuer, issuerPubkey, 8, 'negative', 'loan_defaulted');
  const bundle = await readBundle(pool, [old], RELAYS, holderPubkey, { forceShowRecordIds: [old.id] });
  assert.equal(bundle.summary.shownInStandard, 1);
  assert.equal(bundle.summary.hiddenAsLapsed, 0);
  assert.equal(bundle.entries[0].shownByHolderOverride, true);
});

test('a positive record never lapses regardless of age', async () => {
  const pool = new FakePool();
  const issuer = generateSecretKey();
  const issuerPubkey = getPublicKey(issuer);
  const holderPubkey = getPublicKey(generateSecretKey());
  await cancellationList.initializeList(pool, issuer, RELAYS);

  const old = agedRecord(issuer, issuerPubkey, 20, 'positive', 'trade_credit_honoured');
  const bundle = await readBundle(pool, [old], RELAYS, holderPubkey);
  assert.equal(bundle.summary.shownInStandard, 1);
  assert.equal(bundle.summary.hiddenAsLapsed, 0);
});

test('summary counts a withdrawn record separately from cancelled', async () => {
  const pool = new FakePool();
  const issuer = generateSecretKey();
  const issuerPubkey = getPublicKey(issuer);
  const holder = generateSecretKey();
  const holderPubkey = getPublicKey(holder);
  await cancellationList.initializeList(pool, issuer, RELAYS);

  const record = createRecord({
    issuer: issuerInfo(), subject: { reference: 'Amina', identityAnchorType: 'phone_number' },
    claim: { claimType: 'membership_good_standing', period: '2025', outcome: { polarity: 'neutral', detail: 'x' } },
    vouchType: 'knows_character', stake: { type: 'none', declaredProfile: 'membership fact' },
  }, issuer, holderPubkey);
  await holderActions.publishWithdrawal(pool, holder, record.id, 'no longer wish to show this', RELAYS);

  const bundle = await readBundle(pool, [record], RELAYS, holderPubkey);
  assert.equal(bundle.summary.withdrawn, 1);
  assert.equal(bundle.summary.cancelled, 0);
  assert.equal(bundle.entries[0].verification.overall, 'withdrawn_by_holder');
});

test('bundle entries carry the merged dispute alongside a cancellation', async () => {
  const pool = new FakePool();
  const issuer = generateSecretKey();
  const issuerPubkey = getPublicKey(issuer);
  const holder = generateSecretKey();
  const holderPubkey = getPublicKey(holder);
  await cancellationList.initializeList(pool, issuer, RELAYS);
  const pendingQueue = require('../lib/pendingQueue');
  const fs = require('fs'), os = require('os'), path = require('path');
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-bundle-'));

  const record = createRecord({
    issuer: issuerInfo(), subject: { reference: 'Amina', identityAnchorType: 'phone_number' },
    claim: { claimType: 'trade_credit_honoured', period: '2025', outcome: { polarity: 'positive', detail: 'x' } },
    vouchType: 'saw_money_move', stake: { type: 'financial', description: 'x' },
  }, issuer, holderPubkey);

  pendingQueue.enqueueCancellation(dataDir, { recordId: record.id, reason: 'fraud claimed', cancelledBy: 'issuer' });
  const future = new Date(Date.now() + 73 * 3600 * 1000);
  await cancellationList.promotePendingCancellations(pool, issuer, issuerPubkey, dataDir, RELAYS, future);
  await holderActions.publishDispute(pool, holder, record.id, 'cancellation_factually_wrong', 'invoices were real', RELAYS);

  const bundle = await readBundle(pool, [record], RELAYS, holderPubkey);
  assert.equal(bundle.summary.cancelled, 1);
  assert.equal(bundle.entries[0].verification.check2.dispute.category, 'cancellation_factually_wrong');
});
