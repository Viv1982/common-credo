'use strict';

// Runs the same scenario as ../demo.js, using the same plumbing (lib/*),
// but instead of printing narration to a terminal, collects a structured
// "story" -- one entry per step -- and writes it out as a small JS file
// the walkthrough page loads directly (no server needed, just open
// index.html). Plumbing first, story second, same build, same data.

const fs = require('fs');
const path = require('path');
const keys = require('../lib/keys');
const { createRecord } = require('../lib/record');
const { sealRecord } = require('../lib/seal');
const cancel = require('../lib/cancel');
const { verifyRecord } = require('../lib/verify');
const { readBundle } = require('../lib/bundle');

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

const story = [];
function step(entry) { story.push(entry); }

// --- Step 0: onboarding, Gap 1 -------------------------------------------
const issuerName = 'Riverside Traders Co-operative';
const issuerKeys = keys.generateIssuerKeypair();
const cancellationListAddress = `local-noticeboard://${issuerName}`;
keys.registerIssuer(issuerName, issuerKeys.publicKey, cancellationListAddress);
cancel.initializeList(issuerName, issuerKeys.secretKey);

step({
  id: 'step-0',
  title: 'Onboard an issuer',
  paragraphs: [
    'Riverside Traders Co-operative is going to start vouching for its members. It generates a signing key: a private half it never shares, and a public half that will travel inside every record it seals.',
    'It also publishes its first cancellation noticeboard — empty, but signed — so a verifier always finds a genuine noticeboard to check, even one with nothing on it yet.',
  ],
  gapCallout: {
    label: 'Gap 1',
    text: 'Nothing in the Spec says how a verifier who has never heard of Riverside Traders first learns that this is really its key and noticeboard. The Spec has the record self-declare both, which proves internal consistency, not identity. This demo stands in with a small shared directory — not a Common Credo component, just a placeholder for whatever real trust root CC eventually picks.',
  },
  card: { type: 'keyvalue', title: 'Issuer', rows: [
    ['Name', issuerName], ['Type', 'Cooperative'], ['Location', 'Nairobi, Kenya'],
    ['Public key (truncated)', issuerKeys.publicKey.slice(0, 16) + '…'],
  ] },
});

// --- Step 1-2: create + seal a record ------------------------------------
const record1 = createRecord({
  issuer: { name: issuerName, orgType: 'cooperative', location: 'Nairobi, Kenya', publicKey: issuerKeys.publicKey },
  subject: { reference: 'Amina Yusuf', identityAnchorType: 'phone_number', identityAnchorValue: '+254-7XX-XXX-001' },
  claim: { claimType: 'trade_credit_honoured', amount: 1200, period: '2024-01 to 2026-01',
    outcome: { polarity: 'positive', detail: 'all trade credit repaid on agreed terms' } },
  vouchType: 'saw_money_move',
  stake: { type: 'financial', description: 'co-op forfeits a bonding deposit if this vouch is proven false' },
  issuedAt: '2026-01-15T00:00:00.000Z',
  revocationPointer: { issuer: issuerName, address: cancellationListAddress },
});
const sealedRecord1 = sealRecord(record1, issuerKeys.secretKey);

step({
  id: 'step-1',
  title: 'Create and seal a record',
  paragraphs: [
    'Amina Yusuf, a trader, has honoured two years of trade credit with the co-op. The co-op vouches for her — it saw the money move, and it has real stake in being right.',
    'Every mandatory field the Spec requires is present. Before sealing, the record is given a Record ID: the fingerprint of everything in it, computed by hashing the record’s own content.',
    'The co-op signs it. Change one character now — the amount, the date, anything — and the seal breaks.',
  ],
  gapCallout: {
    label: 'Gap 2',
    text: 'The Spec’s own mandatory-fields list never actually defines a Record ID, even though the cancellation mechanism depends on one to know which record an entry refers to. This toolkit fills that hole: the ID is a hash of the record’s content, computed before sealing, so it is tamper-evident by the same logic as the seal itself.',
  },
  card: { type: 'record', data: sealedRecord1 },
});

// --- Step 2: verify a fresh record ----------------------------------------
let result = verifyRecord(sealedRecord1);
step({
  id: 'step-2',
  title: 'Verify it',
  paragraphs: [
    'A verifier runs the two checks the Spec describes, in about a second: is it genuine (does the seal match)? Is it still valid (has it been cancelled)? No phone call to the co-op, no record contents leaving Amina’s device.',
  ],
  card: { type: 'check', data: result },
});

// --- Step 3: issuer-led cancellation --------------------------------------
cancel.issuerCancel(sealedRecord1, issuerKeys.secretKey, 'fraud discovered: underlying invoices were forged');
result = verifyRecord(sealedRecord1);
step({
  id: 'step-3',
  title: 'Cancel it — the issuer’s own path',
  paragraphs: [
    'The co-op later discovers the underlying trade-credit paperwork was forged. It cancels the record it signed, stating a reason, and republishes its own signed cancellation list.',
    'Re-checking the same record: the seal is still genuine — it truly was issued — but the validity check now reads the cancellation. Exactly like a cancelled passport that still looks perfect.',
  ],
  card: { type: 'check', data: result },
});

// --- Step 4: holder-requested cancellation, Gap 3 -------------------------
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
const request = cancel.requestHolderCancellation(sealedRecord2, 'phone stolen, withdrawing from circulation as a precaution');
const beforeHonoured = verifyRecord(sealedRecord2);
cancel.issuerHonourHolderRequest(request, issuerKeys.secretKey);
const afterHonoured = verifyRecord(sealedRecord2);

step({
  id: 'step-4',
  title: 'Cancel it — the holder’s own path',
  paragraphs: [
    'A second record: a plain membership-standing fact, zero stake — permitted because it’s a factual attestation, not a credit judgement.',
    'Amina’s phone is stolen. She exercises her right to cancel any record about herself, and submits a request to the co-op.',
    'Checking the record right now, before the co-op acts: it still shows valid. Only once the co-op cooperates and countersigns does her cancellation actually take effect.',
  ],
  gapCallout: {
    label: 'Gap 3',
    text: 'The Spec grants the holder a unilateral right to cancel, but the one list a verifier checks can only be signed by the issuer’s key. So the holder’s right, on its own, changes nothing a verifier sees — it only takes effect if the issuer cooperates. An unreachable or uncooperative issuer would leave this record sitting "valid" forever, despite Amina having cancelled it.',
  },
  card: { type: 'beforeAfter', before: { label: 'Before the co-op acts', data: beforeHonoured },
    after: { label: 'After the co-op honours the request', data: afterHonoured } },
});

// --- Step 5: dispute --------------------------------------------------------
cancel.attachDispute(issuerName, sealedRecord1.recordId, 'I dispute this: the invoices were genuine, I have the originals.', issuerKeys.secretKey);
result = verifyRecord(sealedRecord1);
step({
  id: 'step-5',
  title: 'Dispute a cancellation',
  paragraphs: [
    'Amina disputes the Step 3 cancellation — she says the invoices were real. The disputed flag now travels permanently with the cancellation, visible to every future verifier. It doesn’t undo the cancellation; it makes both sides of the story visible.',
  ],
  card: { type: 'check', data: result },
});

// --- Step 6: bundle / standing --------------------------------------------
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

const bundleStandard = readBundle([sealedRecord1, sealedRecord2, sealedRecord3], { now: new Date('2026-07-06') });
const bundleForced = readBundle([sealedRecord1, sealedRecord2, sealedRecord3], {
  now: new Date('2026-07-06'), forceShowRecordIds: [sealedRecord3.recordId],
});

step({
  id: 'step-6',
  title: 'Read a bundle into a standing',
  paragraphs: [
    'Amina assembles her records to show a new lender. One is an 8-year-old default — old enough that the memory rule hides it from the standard view by default. Good history never lapses; bad history lapses after 5–7 years and is hidden, never deleted.',
    'She can still choose to show the lapsed record herself, to tell the fuller story — "I defaulted in 2018, and here is everything since." Notice: no score is produced anywhere. Common Credo carries facts; whoever builds the lending tool decides how to weigh them.',
  ],
  card: { type: 'bundleCompare', standard: bundleStandard, forced: bundleForced },
});

// --- Step 7: dead issuer -----------------------------------------------
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
result = verifyRecord(sealedRecord4);

step({
  id: 'step-7',
  title: 'A dead issuer (degraded check)',
  paragraphs: [
    'One more record, from a trade union that never published a noticeboard — it has since gone dark. The Spec’s own honest edge: this is not rejected and not accepted. It is unverifiable, and priced accordingly by whoever is reading it.',
  ],
  card: { type: 'check', data: result },
});

fs.writeFileSync(
  path.join(__dirname, 'story-data.js'),
  'window.CC_STORY = ' + JSON.stringify(story, null, 2) + ';\n'
);
console.log('Wrote visual/story-data.js with ' + story.length + ' steps.');
