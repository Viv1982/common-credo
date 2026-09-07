'use strict';

// AGPL-3.0 -- see LICENSE-AGPL-3.0.
//
// This app has no identity and nothing to persist -- unlike issuer-tool
// and holder-tool's state.js, there is no unlocked key, no onboarding.
// Just a relay pool kept alive for the process's lifetime so repeated
// checks don't each open fresh connections.

const { createPool, DEFAULT_RELAYS } = require('common-credo-core/lib/relay');

const pool = createPool();

function getPool() {
  return pool;
}
function getRelays() {
  return DEFAULT_RELAYS;
}

module.exports = { getPool, getRelays };
