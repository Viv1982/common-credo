'use strict';

// AGPL-3.0 -- see LICENSE-AGPL-3.0.

const express = require('express');
const multer = require('multer');
const { page, flash } = require('../web/layout');
const pages = require('../web/pages');
const state = require('../state');
const { verifyRecord } = require('common-credo-core/lib/verify');
const { parseRecordContent } = require('common-credo-core/lib/record');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 512 * 1024 } });

router.get('/', (req, res) => {
  res.send(page({ title: 'Check a bundle', body: flash(req.query) + pages.uploadForm() }));
});

// Bundle envelope shape (Spec Part V / holder-tool's src/routes/bundle.js):
// { ccBundleVersion, holderPubkey, holderNpub, generatedAt, records: [...] }.
// A plain, honest error here beats a stack trace for a non-technical
// verifier who was just handed a file by someone else. Exported so
// test/check.test.js can exercise it directly, with no HTTP involved.
function validateEnvelope(envelope) {
  if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope)) {
    throw new Error('That file is not a Common Credo bundle -- expected a JSON object.');
  }
  if (!Array.isArray(envelope.records) || envelope.records.length === 0) {
    throw new Error('That bundle has no records in it.');
  }
  for (const r of envelope.records) {
    if (!r || typeof r !== 'object' || !r.id || !r.sig || !r.pubkey || typeof r.content !== 'string') {
      throw new Error('One of the records in this bundle is not shaped like a Common Credo record -- the file may be corrupted or was not really exported by a Common Credo wallet.');
    }
  }
  // holderPubkey is expected but not hard-required to render results --
  // its absence just means every record's dispute/withdrawal check is
  // skipped (surfaced per-record via holderChecksCompleted, not hidden).
}

// The actual verification + display-data assembly, independent of
// Express req/res -- takes an injected pool so test/check.test.js can run
// this against the same FakePool the other tools' tests use, instead of
// real relays. The real route below just wires this to state.getPool().
async function runCheck(pool, relays, envelope) {
  return Promise.all(envelope.records.map(async (record) => {
    const verification = await verifyRecord(pool, record, relays, envelope.holderPubkey || undefined);
    let content;
    try {
      content = parseRecordContent(record);
    } catch (e) {
      // A record that fails Check 1 may not even have valid JSON content
      // (e.g. content was tampered with) -- don't let that crash the page;
      // show what we can and let the not_genuine badge speak for itself.
      content = {
        issuer: { name: '(unreadable)', orgType: '', location: '', anchor: null },
        subject: { reference: '(unreadable)', identityAnchorType: 'unknown' },
        claim: { claimType: 'unknown', period: '', outcome: { polarity: 'neutral', detail: '' } },
        vouchType: 'unknown', stake: { type: 'unknown' }, flags: [],
      };
    }
    return { record, content, verification };
  }));
}

router.post('/check', upload.single('bundleFile'), async (req, res) => {
  if (!req.file) return res.redirect('/?error=' + encodeURIComponent('Choose a bundle file to check.'));

  let envelope;
  try {
    envelope = JSON.parse(req.file.buffer.toString('utf8'));
    validateEnvelope(envelope);
  } catch (e) {
    return res.redirect('/?error=' + encodeURIComponent(e.message));
  }

  const results = await runCheck(state.getPool(), state.getRelays(), envelope);
  res.send(page({ title: 'Standing', body: pages.resultsPage({ envelope, results }) }));
});

module.exports = router;
module.exports.validateEnvelope = validateEnvelope;
module.exports.runCheck = runCheck;
