#!/usr/bin/env node
'use strict';

// AGPL-3.0 -- see LICENSE-AGPL-3.0.
//
// Standalone, non-interactive version of the in-process scheduler in
// src/server.js -- for anyone who wants R2's 90-day freshness guarantee
// and the 72h promotion to survive server restarts/crashes, invoked via
// OS-level cron / launchd / systemd-timer. NOT required to run the issuer
// tool in v1; the server's own setInterval loop is sufficient as long as
// the process stays up.
//
// Security trade-off, named rather than hidden: a cron job can't answer
// an interactive password prompt, so this script reads the issuer's
// unlock password from the CC_ISSUER_PASSWORD environment variable. That
// is a real, lower-security convenience trade-off compared to the
// server's interactive unlock -- treat the file/service that sets this
// env var (e.g. a root-only-readable file referenced by crontab) with the
// same care as the key itself. If that trade-off is unacceptable for a
// given deployment, don't use this script -- rely on the in-process
// scheduler and keep the server running instead.
//
// Usage: CC_ISSUER_PASSWORD=... node bin/cc-issuer-scheduler.js
// Cron example (hourly): 0 * * * * CC_ISSUER_PASSWORD=$(cat /path/to/secret) node /path/to/issuer-tool/bin/cc-issuer-scheduler.js >> /path/to/scheduler.log 2>&1

const store = require('../src/store');
const keys = require('common-credo-core/lib/keys');
const { createPool, DEFAULT_RELAYS } = require('common-credo-core/lib/relay');
const { promotePendingCancellations } = require('common-credo-core/lib/cancellationList');

async function main() {
  if (!store.isOnboarded()) {
    console.error('Not onboarded yet -- nothing to do.');
    process.exit(1);
  }
  const password = process.env.CC_ISSUER_PASSWORD;
  if (!password) {
    console.error('Set CC_ISSUER_PASSWORD in the environment to run this script headlessly.');
    process.exit(1);
  }

  let secretKey;
  try {
    secretKey = keys.loadEncryptedKey(store.KEY_PATH, password);
  } catch (e) {
    console.error('Could not decrypt the issuer key:', e.message);
    process.exit(1);
  }

  const profile = store.loadIssuerProfile();
  const pool = createPool();
  try {
    const result = await promotePendingCancellations(pool, secretKey, profile.publicKey, store.DATA_DIR, DEFAULT_RELAYS);
    console.log(new Date().toISOString(), JSON.stringify(result.attempted
      ? { promoted: result.promoted, reStampedOnly: !!result.reStampedOnly, publishOk: result.publishResult.ok }
      : { attempted: false, reason: result.reason }));
    process.exit(result.attempted && !result.publishResult.ok ? 1 : 0);
  } finally {
    pool.destroy();
  }
}

main().catch((e) => {
  console.error('Scheduler run failed:', e);
  process.exit(1);
});
