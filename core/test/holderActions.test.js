'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { generateSecretKey, getPublicKey } = require('nostr-tools/pure');
const { FakePool } = require('./helpers/fakePool');
const holderActions = require('../lib/holderActions');

const RELAYS = ['wss://fake-a', 'wss://fake-b'];

test('publishes a dispute and fetches it back', async () => {
  const pool = new FakePool();
  const holder = generateSecretKey();
  const holderPubkey = getPublicKey(holder);

  const { publishResult } = await holderActions.publishDispute(pool, holder, 'rec1', 'cancellation_factually_wrong', 'the invoices were real', RELAYS);
  assert.equal(publishResult.ok, true);

  const dispute = await holderActions.fetchDispute(pool, holderPubkey, 'rec1', RELAYS);
  assert.equal(dispute.category, 'cancellation_factually_wrong');
  assert.equal(dispute.detail, 'the invoices were real');
  assert.ok(dispute.disputedAt);
});

test('publishes a withdrawal and fetches it back', async () => {
  const pool = new FakePool();
  const holder = generateSecretKey();
  const holderPubkey = getPublicKey(holder);

  const { publishResult } = await holderActions.publishWithdrawal(pool, holder, 'rec2', 'phone stolen', RELAYS);
  assert.equal(publishResult.ok, true);

  const withdrawal = await holderActions.fetchWithdrawal(pool, holderPubkey, 'rec2', RELAYS);
  assert.equal(withdrawal.reason, 'phone stolen');
  assert.ok(withdrawal.withdrawnAt);
});

test('no dispute/withdrawal found for a record that was never touched', async () => {
  const pool = new FakePool();
  const holder = generateSecretKey();
  const holderPubkey = getPublicKey(holder);

  assert.equal(await holderActions.fetchDispute(pool, holderPubkey, 'untouched', RELAYS), null);
  assert.equal(await holderActions.fetchWithdrawal(pool, holderPubkey, 'untouched', RELAYS), null);
});

test('rejects an invalid dispute category (Spec Part IV.4)', () => {
  const holder = generateSecretKey();
  assert.throws(
    () => holderActions.buildDisputeEvent('rec1', 'not_a_real_category', 'x', holder),
    /category must be one of/
  );
});

test('rejects a withdrawal with no reason', () => {
  const holder = generateSecretKey();
  assert.throws(() => holderActions.buildWithdrawalEvent('rec1', '', holder), /must state a reason/);
});

test('dispute and withdrawal for the same record use different d-tags -- refiling replaces, not accumulates', async () => {
  const pool = new FakePool();
  const holder = generateSecretKey();
  const holderPubkey = getPublicKey(holder);

  await holderActions.publishDispute(pool, holder, 'rec3', 'cancellation_retaliatory', 'first filing', RELAYS);
  await holderActions.publishDispute(pool, holder, 'rec3', 'cancellation_factually_wrong', 'refiled with a better reason', RELAYS);

  const dispute = await holderActions.fetchDispute(pool, holderPubkey, 'rec3', RELAYS);
  assert.equal(dispute.category, 'cancellation_factually_wrong');
  assert.equal(dispute.detail, 'refiled with a better reason');
});

test('a dispute from one holder is invisible under a different holder pubkey', async () => {
  const pool = new FakePool();
  const holderA = generateSecretKey();
  const holderB = generateSecretKey();
  const holderBPubkey = getPublicKey(holderB);

  await holderActions.publishDispute(pool, holderA, 'rec4', 'cancellation_retaliatory', 'x', RELAYS);
  assert.equal(await holderActions.fetchDispute(pool, holderBPubkey, 'rec4', RELAYS), null);
});
