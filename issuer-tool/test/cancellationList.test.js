'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { generateSecretKey, getPublicKey } = require('nostr-tools/pure');
const { FakePool } = require('./helpers/fakePool');
const cancellationList = require('common-credo-core/lib/cancellationList');
const pendingQueue = require('common-credo-core/lib/pendingQueue');
const { RESTAMP_THRESHOLD_DAYS } = require('common-credo-core/lib/freshness');

const RELAYS = ['wss://fake-a', 'wss://fake-b'];

function tmpDataDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'cc-cancellationlist-'));
}

test('initializeList publishes an empty signed list, fetchList reads it back', async () => {
  const pool = new FakePool();
  const sk = generateSecretKey();
  const pubkey = getPublicKey(sk);

  const { publishResult } = await cancellationList.initializeList(pool, sk, RELAYS);
  assert.equal(publishResult.ok, true);

  const { event, entries } = await cancellationList.fetchList(pool, pubkey, RELAYS);
  assert.ok(event);
  assert.deepEqual(entries, []);
});

test('promotePendingCancellations is a no-op when nothing is pending and the list is fresh', async () => {
  const pool = new FakePool();
  const sk = generateSecretKey();
  const pubkey = getPublicKey(sk);
  const dir = tmpDataDir();

  await cancellationList.initializeList(pool, sk, RELAYS);
  const result = await cancellationList.promotePendingCancellations(pool, sk, pubkey, dir, RELAYS, new Date());
  assert.equal(result.attempted, false);
});

test('promotePendingCancellations publishes a promotable entry and removes it from the queue', async () => {
  const pool = new FakePool();
  const sk = generateSecretKey();
  const pubkey = getPublicKey(sk);
  const dir = tmpDataDir();

  await cancellationList.initializeList(pool, sk, RELAYS);
  pendingQueue.enqueueCancellation(dir, { recordId: 'rec1', reason: 'fraud discovered', cancelledBy: 'issuer' }, 72);

  const future = new Date(Date.now() + 73 * 3600 * 1000);
  const result = await cancellationList.promotePendingCancellations(pool, sk, pubkey, dir, RELAYS, future);

  assert.equal(result.attempted, true);
  assert.deepEqual(result.promoted, ['rec1']);
  assert.equal(result.publishResult.ok, true);

  const { entries } = await cancellationList.fetchList(pool, pubkey, RELAYS);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].recordId, 'rec1');
  assert.equal(entries[0].status, 'cancelled');
  assert.equal(entries[0].cancelledBy, 'issuer');

  assert.deepEqual(pendingQueue.loadQueue(dir), { entries: [] });
});

test('a failed publish (quorum not met) does not remove the entry from the pending queue -- it retries next tick', async () => {
  const pool = new FakePool({ failRelays: RELAYS }); // every relay fails
  const sk = generateSecretKey();
  const pubkey = getPublicKey(sk);
  const dir = tmpDataDir();

  pendingQueue.enqueueCancellation(dir, { recordId: 'rec1', reason: 'x', cancelledBy: 'issuer' }, 72);
  const future = new Date(Date.now() + 73 * 3600 * 1000);
  const result = await cancellationList.promotePendingCancellations(pool, sk, pubkey, dir, RELAYS, future);

  assert.equal(result.publishResult.ok, false);
  assert.deepEqual(result.promoted, []);
  // still in the queue -- not silently dropped on publish failure
  const remaining = pendingQueue.loadQueue(dir);
  assert.equal(remaining.entries.length, 1);
  assert.equal(remaining.entries[0].recordId, 'rec1');
});

test('re-stamps a list nearing the 90-day cap even with nothing new to promote (R2)', async () => {
  const pool = new FakePool();
  const sk = generateSecretKey();
  const pubkey = getPublicKey(sk);
  const dir = tmpDataDir();

  // Publish an "old" list directly (bypassing initializeList's current timestamp)
  // by injecting an event with an aged created_at into the fake pool.
  const { finalizeEvent } = require('nostr-tools/pure');
  const oldCreatedAt = Math.floor(Date.now() / 1000) - (RESTAMP_THRESHOLD_DAYS + 1) * 24 * 60 * 60;
  const oldEvent = finalizeEvent({ kind: 30300, created_at: oldCreatedAt, tags: [['d', 'cc-cancellation-list']], content: '{"entries":[]}' }, sk);
  pool.events.push(oldEvent);

  const result = await cancellationList.promotePendingCancellations(pool, sk, pubkey, dir, RELAYS, new Date());
  assert.equal(result.attempted, true);
  assert.equal(result.reStampedOnly, true);

  const { event } = await cancellationList.fetchList(pool, pubkey, RELAYS);
  assert.ok(event.created_at > oldEvent.created_at);
});
