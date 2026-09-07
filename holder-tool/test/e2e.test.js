'use strict';

// Full flow, using common-credo-core directly (the same layer the Express
// routes call into) -- mirrors the pattern proven in issuer-tool/test/e2e.test.js.
// Uses the FakePool for determinism; live-relay behaviour was verified
// manually (see the plan's "manual verification" step) and by the
// smoke tests run during development of core/lib/holderActions.js and bundle.js.

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
const holderActions = require('common-credo-core/lib/holderActions');
const { verifyRecord } = require('common-credo-core/lib/verify');

const RELAYS = ['wss://fake-a', 'wss://fake-b'];

function issuerInfo() {
  return { name: 'E2E Issuing Co-op', orgType: 'cooperative', location: 'Nairobi, Kenya', anchor: { type: 'cooperative_ngo_registration', country: 'KE', value: 'COOP-E2E' } };
}

test('holder onboards, imports a record, sees it verified, watches it get cancelled and disputes it, and separately withdraws a second record with zero issuer involvement', async () => {
  const pool = new FakePool();
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-holder-e2e-'));

  // --- a fake issuer, set up exactly as issuer-tool's onboarding does
  const issuer = keys.generateKeypair();
  await cancellationList.initializeList(pool, issuer.secretKey, RELAYS);

  // --- holder onboarding (mirrors holder-tool's routes/onboarding.js)
  const holder = keys.generateKeypair();
  const backup = keys.encodeForBackup(holder.secretKey, holder.publicKey);
  assert.match(backup.nsec, /^nsec1/);
  const holderKeyFile = path.join(dataDir, 'holder-key.enc.json');
  keys.saveEncryptedKey(holderKeyFile, holder.secretKey, 'a-strong-test-password');
  assert.equal(
    Buffer.from(keys.loadEncryptedKey(holderKeyFile, 'a-strong-test-password')).equals(Buffer.from(holder.secretKey)),
    true
  );

  // --- issuer issues a record naming this holder's pubkey (the small
  // issuer-tool addition from the plan's section 3)
  const record1 = createRecord({
    issuer: issuerInfo(),
    subject: { reference: 'Amina Yusuf', identityAnchorType: 'phone_number', identityAnchorValue: '+254-700-000-000' },
    claim: { claimType: 'trade_credit_honoured', amount: 500, period: '2025', outcome: { polarity: 'positive', detail: 'honoured on time' } },
    vouchType: 'saw_money_move',
    stake: { type: 'financial', description: 'bonding deposit' },
  }, issuer.secretKey, holder.publicKey);

  // --- holder "imports" it (mirrors routes/records.js: seal check then persist)
  const { recordIsStructurallySealed } = require('common-credo-core/lib/record');
  assert.equal(recordIsStructurallySealed(record1), true);

  // --- wallet view: fresh record verifies as valid
  const fresh = await verifyRecord(pool, record1, RELAYS, holder.publicKey);
  assert.equal(fresh.overall, 'valid');

  // --- issuer cancels it; scheduler promotes past the 72h window
  pendingQueue.enqueueCancellation(dataDir, { recordId: record1.id, reason: 'fraud discovered after issue', cancelledBy: 'issuer' });
  const past72h = new Date(Date.now() + 73 * 3600 * 1000);
  const promoted = await cancellationList.promotePendingCancellations(pool, issuer.secretKey, issuer.publicKey, dataDir, RELAYS, past72h);
  assert.equal(promoted.publishResult.ok, true);

  const afterCancel = await verifyRecord(pool, record1, RELAYS, holder.publicKey);
  assert.equal(afterCancel.overall, 'cancelled');
  assert.equal(afterCancel.check2.cancellation.reason, 'fraud discovered after issue');

  // --- holder disputes it (mirrors routes/disputes.js)
  const disputeResult = await holderActions.publishDispute(pool, holder.secretKey, record1.id, 'cancellation_factually_wrong', 'the invoices were real', RELAYS);
  assert.equal(disputeResult.publishResult.ok, true);

  const afterDispute = await verifyRecord(pool, record1, RELAYS, holder.publicKey);
  assert.equal(afterDispute.overall, 'cancelled'); // dispute doesn't flip status back to valid (D8: neither party can suppress the other's side)
  assert.equal(afterDispute.check2.dispute.category, 'cancellation_factually_wrong');
  assert.equal(afterDispute.check2.dispute.detail, 'the invoices were real');

  // --- SEPARATELY: a second record, never cancelled by the issuer at all,
  // withdrawn independently by the holder -- the concrete proof Gap 3 is
  // closed for a holder with her own wallet.
  const record2 = createRecord({
    issuer: issuerInfo(),
    subject: { reference: 'Amina Yusuf', identityAnchorType: 'phone_number', identityAnchorValue: '+254-700-000-000' },
    claim: { claimType: 'membership_good_standing', period: '2025', outcome: { polarity: 'neutral', detail: 'member in good standing' } },
    vouchType: 'knows_character',
    stake: { type: 'none', declaredProfile: 'cooperative attesting a membership fact' },
  }, issuer.secretKey, holder.publicKey);

  const beforeWithdrawal = await verifyRecord(pool, record2, RELAYS, holder.publicKey);
  assert.equal(beforeWithdrawal.overall, 'valid');

  // No issuer action anywhere in this block -- only the holder's own key touches record2.
  const withdrawResult = await holderActions.publishWithdrawal(pool, holder.secretKey, record2.id, 'no longer wish to show this', RELAYS);
  assert.equal(withdrawResult.publishResult.ok, true);

  const afterWithdrawal = await verifyRecord(pool, record2, RELAYS, holder.publicKey);
  assert.equal(afterWithdrawal.overall, 'withdrawn_by_holder');
  assert.equal(afterWithdrawal.check2.withdrawal.reason, 'no longer wish to show this');
  assert.equal(afterWithdrawal.check2.cancellation, null);

  // --- a verifier who never learns the holder's pubkey still gets an
  // honest "we couldn't check" rather than a silent false "valid"
  const noPubkeyCheck = await verifyRecord(pool, record2, RELAYS);
  assert.equal(noPubkeyCheck.check2.holderChecksCompleted, false);
  assert.equal(noPubkeyCheck.overall, 'valid'); // named residual gap, not a crash -- see NOSTR-KINDS.md
});
