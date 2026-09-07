'use strict';

// AGPL-3.0 -- see LICENSE-AGPL-3.0.
//
// In-memory session state for one holder on one device -- the browser
// equivalent of holder-tool/src/state.js. The unlocked secret key lives ONLY
// in this module's memory for the life of the page; it is never written
// anywhere in the clear, and is dropped on lock() or when the tab is closed.
// The encrypted key at rest lives in IndexedDB (store-idb.js); unlocking
// decrypts it into here.

const engine = require('./engine');

let unlockedSecretKey = null;
let pendingOnboardingKeypair = null;
let pool = null;

// Lazily create the relay pool so importing this module never opens a
// WebSocket (and so headless tests can inject a FakePool instead).
function getPool() {
  if (!pool) pool = engine.createPool();
  return pool;
}
function getRelays() {
  return engine.DEFAULT_RELAYS;
}

function isUnlocked() { return unlockedSecretKey !== null; }
function setUnlockedSecretKey(sk) { unlockedSecretKey = sk; }
function getUnlockedSecretKey() { return unlockedSecretKey; }
function lock() { unlockedSecretKey = null; }

function setPendingOnboardingKeypair(kp) { pendingOnboardingKeypair = kp; }
function getPendingOnboardingKeypair() { return pendingOnboardingKeypair; }
function clearPendingOnboardingKeypair() { pendingOnboardingKeypair = null; }

module.exports = {
  getPool, getRelays,
  isUnlocked, setUnlockedSecretKey, getUnlockedSecretKey, lock,
  setPendingOnboardingKeypair, getPendingOnboardingKeypair, clearPendingOnboardingKeypair,
};
