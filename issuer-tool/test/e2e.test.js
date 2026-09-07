'use strict';

// Full flow, using lib/ directly (the same layer the Express routes call
// into) -- mirrors the pattern already proven in toolkit/demo.js.
// Uses the FakePool for determinism; live-relay behaviour was verified
// manually (see the plan's "manual verification" step) and by the earlier
// smoke tests run during development.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { FakePool } = require('./helpers/fakePool');
const keys = require('common-credo-core/lib/keys');
const { createRecord } = require('common-credo-core/lib/record');
const cancellationList = require('common-credo-core/lib/cancellationList');
const pendingQueue = require('common-credo-core/lib/pendingQueue');
const { verifyRecord } = require('common-credo-core/lib/verify');

const RELAYS = ['wss://fake-a', 'wss://fake-b'];

test('onboard -> create+seal -> export -> issuer-cancel -> not visible before window -> promoted after 72h -> verified cancelled', async () => {
  const pool = new FakePool();
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-e2e-'));
  const exportsDir = path.join(dataDir, 'exports');
  fs.mkdirSync(exportsDir);

  // --- onboard: keygen + forced-backup analogue + D7 anchor + initial empty list, one act
  const issuer = keys.generateKeypair();
  const backup = keys.encodeForBackup(issuer.secretKey, issuer.publicKey);
  assert.match(backup.nsec, /^nsec1/);
  assert.match(backup.npub, /^npub1/);

  const keyFile = path.join(dataDir, 'issuer-key.enc.json');
  keys.saveEncryptedKey(keyFile, issuer.secretKey, 'a-strong-test-password');

  const init = await cancellationList.initializeList(pool, issuer.secretKey, RELAYS);
  assert.equal(init.publishResult.ok, true, 'initial empty list must publish before onboarding is considered complete');

  // --- create + seal a record
  const record = createRecord({
    issuer: {
      name: 'E2E Test Co-op', orgType: 'cooperative', location: 'Nairobi, Kenya',
      anchor: { type: 'cooperative_ngo_registration', country: 'KE', value: 'COOP-E2E' },
    },
    subject: { reference: 'Amina Yusuf', identityAnchorType: 'phone_number', identityAnchorValue: '+254-700-000-000' },
    claim: { claimType: 'trade_credit_honoured', amount: 500, period: '2025', outcome: { polarity: 'positive', detail: 'honoured on time' } },
    vouchType: 'saw_money_move',
    stake: { type: 'financial', description: 'bonding deposit' },
  }, issuer.secretKey);

  // --- export
  const exportPath = path.join(exportsDir, record.id + '.json');
  fs.writeFileSync(exportPath, JSON.stringify(record, null, 2));
  assert.ok(fs.existsSync(exportPath));

  // sanity: fresh record verifies as valid before any cancellation
  const freshCheck = await verifyRecord(pool, record, RELAYS);
  assert.equal(freshCheck.overall, 'valid');

  // --- issuer cancels (enters the 72h pending window)
  pendingQueue.enqueueCancellation(dataDir, { recordId: record.id, reason: 'fraud discovered after issue', cancelledBy: 'issuer' });

  // --- confirm NOT visible to a verifier before the window elapses
  const beforeWindow = await verifyRecord(pool, record, RELAYS);
  assert.equal(beforeWindow.overall, 'valid', 'D8: must not be visible as cancelled before the 72h window elapses');

  // an attempt to promote before the window elapses must be a no-op
  const tooEarly = await cancellationList.promotePendingCancellations(
    pool, issuer.secretKey, issuer.publicKey, dataDir, RELAYS, new Date()
  );
  assert.equal(tooEarly.attempted, false);

  // --- mock-clock past 72h, scheduler promotes
  const past72h = new Date(Date.now() + 73 * 3600 * 1000);
  const promoted = await cancellationList.promotePendingCancellations(
    pool, issuer.secretKey, issuer.publicKey, dataDir, RELAYS, past72h
  );
  assert.equal(promoted.attempted, true);
  assert.equal(promoted.publishResult.ok, true);
  assert.deepEqual(promoted.promoted, [record.id]);

  // --- verify.js now confirms cancelled
  // (check2 nests cancellation info under `.cancellation` since the
  // holder-tool build -- see core/lib/verify.js -- because `dispute` and
  // `withdrawal` are now separate, holder-controlled fields alongside it.)
  const afterWindow = await verifyRecord(pool, record, RELAYS);
  assert.equal(afterWindow.overall, 'cancelled');
  assert.equal(afterWindow.check2.cancellation.cancelledBy, 'issuer');
  assert.equal(afterWindow.check2.cancellation.reason, 'fraud discovered after issue');

  // --- pending queue is empty; a re-run of the scheduler is a clean no-op
  assert.deepEqual(pendingQueue.loadQueue(dataDir), { entries: [] });
  const secondRun = await cancellationList.promotePendingCancellations(
    pool, issuer.secretKey, issuer.publicKey, dataDir, RELAYS, past72h
  );
  assert.equal(secondRun.attempted, false);
});
