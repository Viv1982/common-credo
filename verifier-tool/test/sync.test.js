'use strict';

// The core deliverable of this build: proves standalone/index.html's
// duplicated checking engine produces IDENTICAL results to
// common-credo-core/lib/verify.js, the single source of truth. See
// standalone/README.md for why the duplication exists at all.
//
// Extracts the #verify-engine region from the real index.html (not a
// copy of it) so this test can never pass against stale logic that no
// longer matches what actually ships.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');

const { generateSecretKey, getPublicKey, finalizeEvent } = require('nostr-tools/pure');
const { FakePool } = require('./helpers/fakePool');
const { createRecord } = require('common-credo-core/lib/record');
const cancellationList = require('common-credo-core/lib/cancellationList');
const pendingQueue = require('common-credo-core/lib/pendingQueue');
const holderActions = require('common-credo-core/lib/holderActions');
const coreVerify = require('common-credo-core/lib/verify');

const RELAYS = ['wss://fake-a', 'wss://fake-b'];
const INDEX_HTML_PATH = path.join(__dirname, '..', 'standalone', 'index.html');

function extractEngineModulePath() {
  const html = fs.readFileSync(INDEX_HTML_PATH, 'utf8');
  const startMarker = '@sync-test:engine-start';
  const endMarker = '@sync-test:engine-end';
  const startIdx = html.indexOf(startMarker);
  const endIdx = html.indexOf(endMarker);
  assert.ok(startIdx !== -1 && endIdx !== -1 && endIdx > startIdx,
    'standalone/index.html is missing its @sync-test markers -- the engine region cannot be extracted');

  const body = html.slice(startIdx + startMarker.length, endIdx);
  // The extracted body references `verifyEvent` as a free variable (it's
  // imported above the markers in index.html, from an esm.sh CDN URL that
  // only works in a browser). Node resolves the same real library from
  // this app's own node_modules instead -- same library, different
  // module resolution, which is exactly the difference the two
  // environments are allowed to have.
  const moduleSource = `import { verifyEvent } from 'nostr-tools/pure';\n${body}`;

  // Written inside this project (not os.tmpdir()) so Node's ESM resolver
  // can walk up to verifier-tool/node_modules/nostr-tools -- a bare
  // specifier import from outside this directory tree can't find it.
  const tmpDir = path.join(__dirname, '.tmp-sync-test');
  fs.mkdirSync(tmpDir, { recursive: true });
  const tmpFile = path.join(tmpDir, `engine-${Date.now()}-${Math.random().toString(36).slice(2)}.mjs`);
  fs.writeFileSync(tmpFile, moduleSource);
  return tmpFile;
}

function issuerInfo() {
  return { name: 'Sync Test Co-op', orgType: 'cooperative', location: 'Nairobi, Kenya', anchor: { type: 'cooperative_ngo_registration', country: 'KE', value: 'SYNC-1' } };
}

function baseFields(overrides) {
  return Object.assign({
    issuer: issuerInfo(),
    subject: { reference: 'Amina Yusuf', identityAnchorType: 'phone_number', identityAnchorValue: '+254-700-000-000' },
    claim: { claimType: 'trade_credit_honoured', amount: 500, period: '2025', outcome: { polarity: 'positive', detail: 'honoured on time' } },
    vouchType: 'saw_money_move',
    stake: { type: 'financial', description: 'bonding deposit' },
  }, overrides);
}

// Strips fields that are expected to legitimately vary (nothing should,
// but recordId is asserted separately for a clearer failure message) and
// returns the subset that actually drives the UI.
function comparable(result) {
  return {
    overall: result.overall,
    check1: { genuine: result.check1.genuine },
    check2: {
      status: result.check2.status,
      cancellation: result.check2.cancellation,
      dispute: result.check2.dispute,
      withdrawal: result.check2.withdrawal,
      holderChecksCompleted: result.check2.holderChecksCompleted,
    },
  };
}

test('standalone engine matches common-credo-core/lib/verify.js across all status branches', async (t) => {
  const enginePath = extractEngineModulePath();
  const engine = await import(pathToFileURL(enginePath).href);

  const pool = new FakePool();
  const issuer = { secretKey: generateSecretKey() };
  issuer.publicKey = getPublicKey(issuer.secretKey);
  const holder = { secretKey: generateSecretKey() };
  holder.publicKey = getPublicKey(holder.secretKey);
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-sync-'));

  await cancellationList.initializeList(pool, issuer.secretKey, RELAYS);

  async function assertBothAgree(label, record, holderPubkeyHex) {
    await t.test(label, async () => {
      const expected = await coreVerify.verifyRecord(pool, record, RELAYS, holderPubkeyHex);
      const actual = await engine.verifyRecord(pool, record, RELAYS, holderPubkeyHex);
      assert.deepEqual(comparable(actual), comparable(expected));
      assert.equal(actual.recordId, expected.recordId);
    });
  }

  // 1. Fresh, valid.
  const validRecord = createRecord(baseFields(), issuer.secretKey, holder.publicKey);
  await assertBothAgree('valid', validRecord, holder.publicKey);

  // 2. Cancelled, no dispute.
  const cancelledRecord = createRecord(baseFields({ claim: { claimType: 'loan_repaid', period: '2024', outcome: { polarity: 'positive', detail: 'x' } } }), issuer.secretKey, holder.publicKey);
  pendingQueue.enqueueCancellation(dataDir, { recordId: cancelledRecord.id, reason: 'fraud discovered', cancelledBy: 'issuer' });
  const past72h = new Date(Date.now() + 73 * 3600 * 1000);
  await cancellationList.promotePendingCancellations(pool, issuer.secretKey, issuer.publicKey, dataDir, RELAYS, past72h);
  await assertBothAgree('cancelled, no dispute', cancelledRecord, holder.publicKey);

  // 3. Cancelled + disputed.
  const disputedRecord = createRecord(baseFields({ claim: { claimType: 'loan_defaulted', period: '2023', outcome: { polarity: 'negative', detail: 'x' } } }), issuer.secretKey, holder.publicKey);
  pendingQueue.enqueueCancellation(dataDir, { recordId: disputedRecord.id, reason: 'fraud discovered', cancelledBy: 'issuer' });
  await cancellationList.promotePendingCancellations(pool, issuer.secretKey, issuer.publicKey, dataDir, RELAYS, new Date(Date.now() + 200 * 3600 * 1000));
  await holderActions.publishDispute(pool, holder.secretKey, disputedRecord.id, 'cancellation_factually_wrong', 'the invoices were real', RELAYS);
  await assertBothAgree('cancelled and disputed', disputedRecord, holder.publicKey);

  // 4. Withdrawn, never cancelled.
  const withdrawnRecord = createRecord(baseFields({ claim: { claimType: 'membership_good_standing', period: '2025', outcome: { polarity: 'neutral', detail: 'x' } }, stake: { type: 'none', declaredProfile: 'membership fact' } }), issuer.secretKey, holder.publicKey);
  await holderActions.publishWithdrawal(pool, holder.secretKey, withdrawnRecord.id, 'no longer wish to show this', RELAYS);
  await assertBothAgree('withdrawn by holder', withdrawnRecord, holder.publicKey);

  // 5. Tampered / not genuine (still valid JSON, just a changed value).
  const tamperedRecord = JSON.parse(JSON.stringify(validRecord));
  tamperedRecord.content = tamperedRecord.content.replace('500', '999999');
  await assertBothAgree('tampered -- not genuine', tamperedRecord, holder.publicKey);

  // 5b. Content corrupted into non-JSON entirely -- regression coverage
  // for a real bug this build caught: checkStillValid used to throw on
  // JSON.parse failure instead of degrading gracefully. Both copies must
  // now handle this identically (checked separately from #5 because valid
  // JSON is a different code path than a JSON.parse failure).
  const corruptedRecord = Object.assign({}, validRecord, { content: 'not json at all {{{' });
  await assertBothAgree('content corrupted to non-JSON -- not genuine', corruptedRecord, holder.publicKey);

  // 6. Dead issuer -- unverifiable.
  const ghostIssuer = { secretKey: generateSecretKey() };
  ghostIssuer.publicKey = getPublicKey(ghostIssuer.secretKey);
  const ghostRecord = createRecord(baseFields({ claim: { claimType: 'character_vouch', period: '2020', outcome: { polarity: 'positive', detail: 'x' } }, vouchType: 'knows_character', stake: { type: 'reputational', description: 'track record' } }), ghostIssuer.secretKey, holder.publicKey);
  await assertBothAgree('dead issuer -- unverifiable', ghostRecord, holder.publicKey);

  // 7. Valid, but no holder pubkey supplied at all.
  await assertBothAgree('valid, holderChecksCompleted false', validRecord, undefined);
});
