'use strict';

// A narrated, end-to-end run of the Common Credo demo toolkit against
// Standard Spec v0.2: create a record, seal it, cancel it (issuer-led and
// holder-requested paths), verify it, and read a bundle into a standing.
// Run with: node demo.js

const fs = require('fs');
const keys = require('./lib/keys');
const { createRecord } = require('./lib/record');
const { sealRecord } = require('./lib/seal');
const cancel = require('./lib/cancel');
const { verifyRecord } = require('./lib/verify');
const { readBundle } = require('./lib/bundle');

function section(title) {
  console.log('\n' + '='.repeat(70));
  console.log(title);
  console.log('='.repeat(70));
}
function say(msg) { console.log(msg); }
function json(obj) { console.log(JSON.stringify(obj, null, 2)); }

// Fresh state each run, so the demo is reproducible.
// (fs.rmSync needs Node 14+; this Node install is v9, so remove by hand.)
function removeDirRecursive(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir)) {
    const full = dir + '/' + entry;
    if (fs.statSync(full).isDirectory()) removeDirRecursive(full);
    else fs.unlinkSync(full);
  }
  fs.rmdirSync(dir);
}
removeDirRecursive(keys.DATA_DIR);

section('STEP 0 -- Onboard an issuer (and hit Gap 1 immediately)');
say('Riverside Traders Co-operative is going to start vouching for its members.');
say('It generates a signing keypair -- a private half it never shares, and a');
say('public half that travels inside every record it seals.\n');

const issuerName = 'Riverside Traders Co-operative';
const issuerKeys = keys.generateIssuerKeypair();
const cancellationListAddress = `local-noticeboard://${issuerName}`;

say('Real gap, made visible: nothing in the Spec says how a verifier who has');
say('never heard of Riverside Traders first learns that THIS is really its key');
say('and THIS is really its noticeboard address. The Spec has the record self-');
say('declare both -- which proves internal consistency, not identity.');
say('');
say('This demo\'s stand-in (NOT a Common Credo component): a small shared');
say('directory, playing the role of whatever real trust root CC eventually');
say('picks -- a federation registry, a verified domain, a chamber phonebook.');

keys.registerIssuer(issuerName, issuerKeys.publicKey, cancellationListAddress);
say(`\nRegistered "${issuerName}" in the demo directory.`);

cancel.initializeList(issuerName, issuerKeys.secretKey);
say('The co-op also publishes its first cancellation list -- empty, but signed,');
say('so a verifier always finds a genuine noticeboard, even one with nothing on');
say('it yet ("honest issuers\' lists sit mostly empty" -- Part III).');

section('STEP 1 -- Create a record (the mandatory fields, Spec Part II.2.2)');
say('Amina Yusuf, a trader, has honoured two years of trade credit with the');
say('co-op. The co-op vouches for her -- it saw the money move, and it has');
say('real stake in being right.\n');

const record1 = createRecord({
  issuer: { name: issuerName, orgType: 'cooperative', location: 'Nairobi, Kenya', publicKey: issuerKeys.publicKey },
  subject: { reference: 'Amina Yusuf', identityAnchorType: 'phone_number', identityAnchorValue: '+254-7XX-XXX-001' },
  claim: {
    claimType: 'trade_credit_honoured',
    amount: 1200,
    period: '2024-01 to 2026-01',
    outcome: { polarity: 'positive', detail: 'all trade credit repaid on agreed terms' },
  },
  vouchType: 'saw_money_move',
  stake: { type: 'financial', description: 'co-op forfeits a bonding deposit if this vouch is proven false' },
  issuedAt: '2026-01-15T00:00:00.000Z',
  revocationPointer: { issuer: issuerName, address: cancellationListAddress },
});

say('Record built. Every mandatory field Part II.2.2 requires is present,');
say('and it was given a record ID (Gap 2 fix -- see lib/record.js) before');
say('sealing, so the ID itself is tamper-evident:\n');
say('  recordId: ' + record1.recordId);

section('STEP 2 -- Seal it (Part II.2.2 #6)');
const sealedRecord1 = sealRecord(record1, issuerKeys.secretKey);
say('Signed with the co-op\'s key. Change one character now and the seal breaks.');

section('STEP 3 -- Verify it (Part III, the two checks)');
let result = verifyRecord(sealedRecord1);
say('Check 1 (genuine?) and Check 2 (still valid?):');
json(result);
say(`\nOverall: ${result.overall.toUpperCase()} -- as expected for a fresh, uncancelled record.`);

section('STEP 4 -- Cancel it: the issuer-led path (Part IV, D5)');
say('Suppose the co-op later discovers the underlying trade-credit paperwork');
say('was forged. It cancels the record it signed, stating a reason, and');
say('republishes its own signed cancellation list (Part III / D6).\n');

cancel.issuerCancel(sealedRecord1, issuerKeys.secretKey, 'fraud discovered: underlying invoices were forged');
say('Cancellation list updated and re-signed by the issuer.');

result = verifyRecord(sealedRecord1);
say('\nRe-verifying the same record:');
json(result);
say(`\nOverall: ${result.overall.toUpperCase()} -- the seal is still genuine (it truly was`);
say('issued), but Check 2 now reads the cancellation, exactly like a cancelled');
say('passport that still looks perfect (Brief, "How checking works").');

section('STEP 5 -- Cancel it: the holder-requested path (Gap 3, made visible)');
say('A second record, for a different claim, so we can isolate the holder path.\n');

const record2 = createRecord({
  issuer: { name: issuerName, orgType: 'cooperative', location: 'Nairobi, Kenya', publicKey: issuerKeys.publicKey },
  subject: { reference: 'Amina Yusuf', identityAnchorType: 'phone_number', identityAnchorValue: '+254-7XX-XXX-001' },
  claim: { claimType: 'membership_good_standing', period: '2025', outcome: { polarity: 'neutral', detail: 'member in good standing, 2025' } },
  vouchType: 'knows_character',
  stake: { type: 'none', declaredProfile: 'cooperative attesting a membership fact, not a credit judgement' },
  issuedAt: '2025-06-01T00:00:00.000Z',
  revocationPointer: { issuer: issuerName, address: cancellationListAddress },
});
const sealedRecord2 = sealRecord(record2, issuerKeys.secretKey);
say('Record 2 created and sealed: a plain membership-standing fact, zero stake');
say('(permitted under D3 because it is a factual attestation, not a credit claim).');

say('\nAmina\'s phone is stolen. She exercises her Part IV right to cancel any');
say('record about herself. She submits a request:');
const request = cancel.requestHolderCancellation(sealedRecord2, 'phone stolen, withdrawing from circulation as a precaution');
json(request);

say('\nBUT -- checking the record right now, before the co-op acts on the');
say('request:');
result = verifyRecord(sealedRecord2);
say(`Overall: ${result.overall.toUpperCase()}. This is Gap 3: Amina\'s spec-granted right`);
say('to cancel her own record has, so far, changed nothing a verifier can see --');
say('because only the co-op\'s key can write to the one list that matters, and');
say('nothing compels the co-op to act. If the co-op were unreachable or simply');
say('ignored her, this record would sit "valid" forever despite her cancelling it.');

say('\nThe co-op does the right thing and honours her request:');
cancel.issuerHonourHolderRequest(request, issuerKeys.secretKey);
result = verifyRecord(sealedRecord2);
say(`Now re-checking: Overall: ${result.overall.toUpperCase()}, cancelledBy: "${result.check2.cancelledBy}".`);
say('Only now, once the issuer has cooperated, does Amina\'s right actually bind.');

section('STEP 6 -- A holder disputes an issuer cancellation (Part IV)');
say('Amina disputes the Step 4 cancellation -- she says the invoices were real.');
cancel.attachDispute(issuerName, sealedRecord1.recordId, 'I dispute this: the invoices were genuine, I have the originals.', issuerKeys.secretKey);
result = verifyRecord(sealedRecord1);
say('The disputed flag now travels with the cancellation for every future verifier:');
json(result.check2);

section('STEP 7 -- Read a bundle into a standing (Part V)');
say('Amina assembles a third record -- an old default from 8 years ago -- to');
say('show how the memory rule (D4) behaves in a bundle.\n');

const record3 = createRecord({
  issuer: { name: issuerName, orgType: 'cooperative', location: 'Nairobi, Kenya', publicKey: issuerKeys.publicKey },
  subject: { reference: 'Amina Yusuf', identityAnchorType: 'phone_number', identityAnchorValue: '+254-7XX-XXX-001' },
  claim: { claimType: 'loan_defaulted', amount: 300, period: '2017-2018', outcome: { polarity: 'negative', detail: 'defaulted on a small working-capital loan' } },
  vouchType: 'saw_money_move',
  stake: { type: 'financial', description: 'co-op absorbed part of the loss' },
  issuedAt: '2018-03-01T00:00:00.000Z',
  revocationPointer: { issuer: issuerName, address: cancellationListAddress },
});
const sealedRecord3 = sealRecord(record3, issuerKeys.secretKey);

const bundle = readBundle([sealedRecord1, sealedRecord2, sealedRecord3], { now: new Date('2026-07-06') });
say('Standard bundle (default view -- old negative record past the lapse window is hidden):');
json(bundle.summary);

say('\nAmina chooses to show the lapsed record anyway -- her right, per D4');
say('("lapsed means hidden, never deleted") -- to tell the fuller story:');
const bundleForced = readBundle([sealedRecord1, sealedRecord2, sealedRecord3], {
  now: new Date('2026-07-06'),
  forceShowRecordIds: [sealedRecord3.recordId],
});
json(bundleForced.summary);

say('\nNotice throughout: no score was produced anywhere. Per Part V, CC carries');
say('facts -- vouch type, stake, dates, check status -- and leaves scoring to');
say('whoever builds the lending tool on top.');

section('STEP 8 -- Degraded check: a dead issuer (Part III honest edges)');
say('One more record, from an issuer that never published anything -- modelling');
say('a co-op that has since gone dark.\n');

const ghostIssuer = 'Defunct Traders Union';
const ghostKeys = keys.generateIssuerKeypair();
keys.registerIssuer(ghostIssuer, ghostKeys.publicKey, `local-noticeboard://${ghostIssuer}`);
const record4 = createRecord({
  issuer: { name: ghostIssuer, orgType: 'trade association', location: 'Lagos, Nigeria', publicKey: ghostKeys.publicKey },
  subject: { reference: 'Amina Yusuf', identityAnchorType: 'phone_number', identityAnchorValue: '+254-7XX-XXX-001' },
  claim: { claimType: 'character_vouch', period: '2020', outcome: { polarity: 'positive', detail: 'known as reliable trader' } },
  vouchType: 'knows_character',
  stake: { type: 'reputational', description: "issuer's own vouching track record" },
  issuedAt: '2020-01-01T00:00:00.000Z',
  revocationPointer: { issuer: ghostIssuer, address: `local-noticeboard://${ghostIssuer}` },
});
const sealedRecord4 = sealRecord(record4, ghostKeys.secretKey);
say('Note: this issuer never called initializeList(), so no noticeboard exists.\n');
result = verifyRecord(sealedRecord4);
json(result);
say(`\nOverall: ${result.overall.toUpperCase()} -- "not rejected, not accepted" (Part III):`);
say('a verifier prices this the way they would any claim they cannot check.');

section('Done.');
say('All five plumbing operations ran against Spec v0.2: create, seal, cancel');
say('(both issuer-led and holder-requested), verify, and read-a-bundle.');
say('Three spec gaps were surfaced along the way rather than silently worked');
say('around -- see the comments in lib/keys.js, lib/record.js, and lib/cancel.js.');
