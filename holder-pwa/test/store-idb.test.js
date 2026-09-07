'use strict';

// Headless tests for the phone wallet's IndexedDB store, using
// fake-indexeddb to provide a spec-compliant IndexedDB in Node -- so the
// storage layer is proven without a browser, the same way core/ is tested.
// fake-indexeddb keeps data in-process across openDB calls, which is exactly
// what lets the "survives a reopen" assertions be meaningful.

require('fake-indexeddb/auto');

const test = require('node:test');
const assert = require('node:assert/strict');
const store = require('../src/store-idb');

// Each test starts from an empty wallet.
test.beforeEach(async () => { await store.clearAll(); });

function sampleProfile() {
  return { displayName: 'Amina Yusuf', npub: 'npub1testtesttest', createdAt: '2026-08-10T00:00:00.000Z' };
}
function samplePayload(tag) {
  // Shaped like the real keyCrypto payload; contents are opaque to the store.
  return { version: 1, algorithm: 'aes-256-gcm', kdf: 'scrypt', salt: 'aa', iv: 'bb', authTag: 'cc', ciphertext: tag || 'dd' };
}
function sampleRecord(id) {
  return { kind: 3388, id, pubkey: 'issuerpub', sig: 'sig', created_at: 1, tags: [], content: '{}' };
}

test('a fresh wallet is empty and not onboarded', async () => {
  assert.equal(await store.isOnboarded(), false);
  assert.equal(await store.loadHolderProfile(), null);
  assert.equal(await store.loadEncryptedKey(), null);
  assert.equal(await store.hasEncryptedKey(), false);
  assert.deepEqual(await store.loadAllImportedRecords(), []);
  assert.deepEqual(await store.loadRecordsIndex(), { records: [] });
});

test('profile round-trips', async () => {
  const p = sampleProfile();
  await store.saveHolderProfile(p);
  assert.deepEqual(await store.loadHolderProfile(), p);
});

test('encrypted key round-trips and hasEncryptedKey reflects it', async () => {
  assert.equal(await store.hasEncryptedKey(), false);
  const payload = samplePayload();
  await store.saveEncryptedKey(payload);
  assert.equal(await store.hasEncryptedKey(), true);
  assert.deepEqual(await store.loadEncryptedKey(), payload);
});

test('isOnboarded requires BOTH profile and key', async () => {
  await store.saveHolderProfile(sampleProfile());
  assert.equal(await store.isOnboarded(), false, 'profile alone is not onboarded');
  await store.saveEncryptedKey(samplePayload());
  assert.equal(await store.isOnboarded(), true, 'profile + key is onboarded');
});

test('imported records: save, load, has, load-all', async () => {
  assert.equal(await store.hasRecord('rec-1'), false);
  const r1 = sampleRecord('rec-1');
  const r2 = sampleRecord('rec-2');
  await store.saveImportedRecord(r1);
  await store.saveImportedRecord(r2);
  assert.equal(await store.hasRecord('rec-1'), true);
  assert.equal(await store.hasRecord('missing'), false);
  assert.deepEqual(await store.loadImportedRecord('rec-1'), r1);
  assert.equal(await store.loadImportedRecord('missing'), null);
  const all = await store.loadAllImportedRecords();
  assert.equal(all.length, 2);
  assert.deepEqual(all.map((r) => r.id).sort(), ['rec-1', 'rec-2']);
});

test('re-importing the same record id overwrites, does not duplicate', async () => {
  await store.saveImportedRecord(Object.assign(sampleRecord('rec-x'), { content: '{"v":1}' }));
  await store.saveImportedRecord(Object.assign(sampleRecord('rec-x'), { content: '{"v":2}' }));
  const all = await store.loadAllImportedRecords();
  assert.equal(all.length, 1);
  assert.equal((await store.loadImportedRecord('rec-x')).content, '{"v":2}');
});

test('saveImportedRecord rejects a record with no id', async () => {
  await assert.rejects(store.saveImportedRecord({ kind: 3388 }), /must have an id/);
});

test('records index accumulates and round-trips', async () => {
  await store.addRecordToIndex({ recordId: 'rec-1', importedAt: 't1' });
  await store.addRecordToIndex({ recordId: 'rec-2', importedAt: 't2' });
  const index = await store.loadRecordsIndex();
  assert.equal(index.records.length, 2);
  assert.deepEqual(index.records.map((m) => m.recordId), ['rec-1', 'rec-2']);
  await store.saveRecordsIndex({ records: [{ recordId: 'only' }] });
  assert.deepEqual((await store.loadRecordsIndex()).records.map((m) => m.recordId), ['only']);
});

test('data survives a simulated reopen (fresh transactions see prior writes)', async () => {
  await store.saveHolderProfile(sampleProfile());
  await store.saveEncryptedKey(samplePayload('persisted'));
  await store.saveImportedRecord(sampleRecord('rec-keep'));
  // Every store call opens and closes its own db handle, so these reads are
  // already "after a reopen" relative to the writes above.
  assert.equal(await store.isOnboarded(), true);
  assert.equal((await store.loadEncryptedKey()).ciphertext, 'persisted');
  assert.equal(await store.hasRecord('rec-keep'), true);
});

test('clearAll wipes the wallet from this device', async () => {
  await store.saveHolderProfile(sampleProfile());
  await store.saveEncryptedKey(samplePayload());
  await store.saveImportedRecord(sampleRecord('rec-1'));
  await store.addRecordToIndex({ recordId: 'rec-1' });

  await store.clearAll();

  assert.equal(await store.isOnboarded(), false);
  assert.equal(await store.loadHolderProfile(), null);
  assert.equal(await store.loadEncryptedKey(), null);
  assert.deepEqual(await store.loadAllImportedRecords(), []);
  assert.deepEqual(await store.loadRecordsIndex(), { records: [] });
});
