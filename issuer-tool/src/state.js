'use strict';

// AGPL-3.0 -- see LICENSE-AGPL-3.0.
//
// Minimal in-memory session state for a single-operator, self-hosted,
// single-process localhost app (the plan's stated v1 shape -- no
// multi-operator/multi-device support). Deliberately not a full
// session/cookie framework: there is exactly one issuer per running
// instance, so a couple of module-level variables are enough, and adding
// express-session would be complexity this v1 doesn't need.

const { createPool, DEFAULT_RELAYS } = require('common-credo-core/lib/relay');

let unlockedSecretKey = null; // Uint8Array, held only while the process is unlocked and running
let pendingOnboardingKeypair = null; // { secretKey, publicKey } between "generate" and "complete" steps
const pool = createPool();

function isUnlocked() {
  return unlockedSecretKey !== null;
}
function setUnlockedSecretKey(sk) {
  unlockedSecretKey = sk;
}
function getUnlockedSecretKey() {
  return unlockedSecretKey;
}
function lock() {
  unlockedSecretKey = null;
}

function setPendingOnboardingKeypair(kp) {
  pendingOnboardingKeypair = kp;
}
function getPendingOnboardingKeypair() {
  return pendingOnboardingKeypair;
}
function clearPendingOnboardingKeypair() {
  pendingOnboardingKeypair = null;
}

function getPool() {
  return pool;
}
function getRelays() {
  // v1 does not ship a relay-settings UI (kept out of scope, see the plan);
  // this is the one place a future settings page would plug in.
  return DEFAULT_RELAYS;
}

module.exports = {
  isUnlocked, setUnlockedSecretKey, getUnlockedSecretKey, lock,
  setPendingOnboardingKeypair, getPendingOnboardingKeypair, clearPendingOnboardingKeypair,
  getPool, getRelays,
};
