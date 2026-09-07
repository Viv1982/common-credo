'use strict';

// AGPL-3.0 -- see LICENSE-AGPL-3.0.
//
// Same minimal in-memory session-state approach as issuer-tool/src/state.js
// -- one holder per running instance, self-hosted single-process localhost
// app, no multi-device support in v1.

const { createPool, DEFAULT_RELAYS } = require('common-credo-core/lib/relay');

let unlockedSecretKey = null;
let pendingOnboardingKeypair = null;
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
  return DEFAULT_RELAYS;
}

module.exports = {
  isUnlocked, setUnlockedSecretKey, getUnlockedSecretKey, lock,
  setPendingOnboardingKeypair, getPendingOnboardingKeypair, clearPendingOnboardingKeypair,
  getPool, getRelays,
};
