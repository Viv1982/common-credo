'use strict';

// AGPL-3.0 -- see LICENSE-AGPL-3.0. This is application state for the phone
// wallet PWA, not the reusable core -- common-credo-core/lib never reaches
// into this file (same boundary the desktop holder-tool/src/store.js keeps).
//
// The browser equivalent of holder-tool/src/store.js: same conceptual API
// (onboarding profile, the encrypted signing key, imported records + a light
// convenience index), backed by IndexedDB instead of the filesystem. Every
// function is async because IndexedDB is -- the desktop store is sync (fs);
// the PWA app awaits these. Dependency-free: a tiny promise wrapper over the
// raw IndexedDB API, no `idb` library, so nothing extra ships in the bundle.
//
// IMPORTANT (see the PWA plan, Phase 5): browser storage can be evicted by
// the OS or cleared by the user. This store is the working copy, NOT the
// backup. The irreplaceable key's real safety net is the user exporting the
// encrypted key payload to a file (the Files app on iOS, outside evictable
// browser storage). `loadEncryptedKey()` returns exactly the payload the
// desktop tool writes, so an export from here restores on the desktop tool
// and vice versa.

const DB_NAME = 'common-credo-wallet';
const DB_VERSION = 1;
const KV_STORE = 'kv';        // singletons: profile, encryptedKey, recordsIndex
const RECORDS_STORE = 'records'; // imported records, keyed by their own id

const KV_PROFILE = 'profile';
const KV_ENCRYPTED_KEY = 'encryptedKey';
const KV_RECORDS_INDEX = 'recordsIndex';
const KV_KEY_EXPORTED = 'keyFileExported';

// Resolve the IndexedDB factory at call time (not import time) so a test
// polyfill (fake-indexeddb/auto) or a browser both work, and so importing
// this module never throws in a non-browser context.
function idbFactory() {
  const f = globalThis.indexedDB;
  if (!f) throw new Error('IndexedDB is unavailable in this environment.');
  return f;
}

function openDB() {
  return new Promise((resolve, reject) => {
    const req = idbFactory().open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(KV_STORE)) db.createObjectStore(KV_STORE);
      if (!db.objectStoreNames.contains(RECORDS_STORE)) db.createObjectStore(RECORDS_STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Run one transaction and resolve with the operation's result. `fn(store)`
// returns an IDBRequest whose result is what we want (or undefined for writes).
async function tx(storeName, mode, fn) {
  const db = await openDB();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);
      let result;
      const maybeReq = fn(store);
      if (maybeReq && typeof maybeReq === 'object' && 'onsuccess' in maybeReq) {
        maybeReq.onsuccess = () => { result = maybeReq.result; };
        maybeReq.onerror = () => reject(maybeReq.error);
      }
      transaction.oncomplete = () => resolve(result);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error || new Error('transaction aborted'));
    });
  } finally {
    db.close();
  }
}

const kvGet = (key) => tx(KV_STORE, 'readonly', (s) => s.get(key));
const kvPut = (key, value) => tx(KV_STORE, 'readwrite', (s) => s.put(value, key));

// --- Onboarding / profile -------------------------------------------------

async function saveHolderProfile(profile) {
  await kvPut(KV_PROFILE, profile);
}
async function loadHolderProfile() {
  const v = await kvGet(KV_PROFILE);
  return v === undefined ? null : v;
}

// --- The encrypted signing key --------------------------------------------
// Stores the exact payload object produced by core keyCrypto (web adapter):
// { version, algorithm, kdf, salt, iv, authTag, ciphertext }. Interoperable
// with the desktop key file byte-for-byte.

async function saveEncryptedKey(payload) {
  await kvPut(KV_ENCRYPTED_KEY, payload);
}
async function loadEncryptedKey() {
  const v = await kvGet(KV_ENCRYPTED_KEY);
  return v === undefined ? null : v;
}
async function hasEncryptedKey() {
  return (await kvGet(KV_ENCRYPTED_KEY)) !== undefined;
}

// Onboarded means both halves exist: an identity profile AND the key that
// backs it (mirrors holder-tool/src/store.js's isOnboarded).
async function isOnboarded() {
  const [profile, key] = await Promise.all([kvGet(KV_PROFILE), kvGet(KV_ENCRYPTED_KEY)]);
  return profile !== undefined && key !== undefined;
}

// --- Imported records -----------------------------------------------------

async function saveImportedRecord(record) {
  if (!record || !record.id) throw new Error('record must have an id');
  await tx(RECORDS_STORE, 'readwrite', (s) => s.put(record));
}
async function loadImportedRecord(recordId) {
  const v = await tx(RECORDS_STORE, 'readonly', (s) => s.get(recordId));
  return v === undefined ? null : v;
}
async function hasRecord(recordId) {
  // getKey resolves to the key if present, undefined otherwise -- cheaper
  // than fetching the whole record.
  const k = await tx(RECORDS_STORE, 'readonly', (s) => s.getKey(recordId));
  return k !== undefined;
}
async function loadAllImportedRecords() {
  const all = await tx(RECORDS_STORE, 'readonly', (s) => s.getAll());
  return all || [];
}

// --- Records index (convenience list of meta, same role as desktop) -------
// Never a second source of truth for a record's live status -- that always
// comes from core/lib/verify.js against live relays. This is just "what have
// I imported, and when".

async function loadRecordsIndex() {
  const v = await kvGet(KV_RECORDS_INDEX);
  return v === undefined ? { records: [] } : v;
}
async function saveRecordsIndex(index) {
  await kvPut(KV_RECORDS_INDEX, index);
}
async function addRecordToIndex(meta) {
  const index = await loadRecordsIndex();
  index.records.push(meta);
  await saveRecordsIndex(index);
}

// --- Key-backup tracking --------------------------------------------------
// Whether the holder has exported her encrypted key file at least once. Drives
// the re-naggable backup reminder (Phase 5): browser storage can be evicted,
// so an exported key file kept in the phone's Files is the real safety net.

async function isKeyFileExported() {
  return (await kvGet(KV_KEY_EXPORTED)) === true;
}
async function setKeyFileExported(value) {
  await kvPut(KV_KEY_EXPORTED, value === true);
}

// --- Reset (a real "start over" for the user, and test teardown) ----------
// Wipes the wallet from this device. The user must be warned this is
// irreversible without an exported key (Phase 5 UX).

async function clearAll() {
  await tx(KV_STORE, 'readwrite', (s) => s.clear());
  await tx(RECORDS_STORE, 'readwrite', (s) => s.clear());
}

module.exports = {
  DB_NAME, DB_VERSION,
  isOnboarded,
  saveHolderProfile, loadHolderProfile,
  saveEncryptedKey, loadEncryptedKey, hasEncryptedKey,
  saveImportedRecord, loadImportedRecord, hasRecord, loadAllImportedRecords,
  loadRecordsIndex, saveRecordsIndex, addRecordToIndex,
  isKeyFileExported, setKeyFileExported,
  clearAll,
};
