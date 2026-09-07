'use strict';

// AGPL-3.0 -- see LICENSE-AGPL-3.0.

const express = require('express');
const multer = require('multer');
const { page, flash } = require('../web/layout');
const pages = require('../web/pages');
const store = require('../store');
const { recordIsStructurallySealed, parseRecordContent } = require('common-credo-core/lib/record');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 256 * 1024 } });

router.get('/records/import', (req, res) => {
  res.send(page({ title: 'Import a record', body: flash(req.query) + pages.importRecordForm() }));
});

router.post('/records/import', upload.single('recordFile'), (req, res) => {
  if (!req.file) return res.redirect('/records/import?error=' + encodeURIComponent('Choose a record file to import.'));

  let record;
  try {
    record = JSON.parse(req.file.buffer.toString('utf8'));
  } catch (e) {
    return res.redirect('/records/import?error=' + encodeURIComponent('That file is not valid JSON -- was it really a Common Credo record?'));
  }

  // Validate the structural seal BEFORE persisting anything (Spec Part
  // II.2.2 #6): a corrupted or tampered file must be rejected here, not
  // silently added to the wallet and only discovered later.
  if (!recordIsStructurallySealed(record)) {
    return res.redirect('/records/import?error=' + encodeURIComponent('This record\'s seal does not check out -- it may be corrupted or tampered with. Not imported.'));
  }

  let content;
  try {
    content = parseRecordContent(record);
  } catch (e) {
    return res.redirect('/records/import?error=' + encodeURIComponent('Could not read this record\'s contents.'));
  }

  // R1 gives a free idempotency key -- re-importing the same file twice
  // is a harmless no-op, not a duplicate.
  if (store.hasRecord(record.id)) {
    return res.redirect('/wallet?success=' + encodeURIComponent('Already in your wallet.'));
  }

  store.saveImportedRecord(record);
  store.addRecordToIndex({
    recordId: record.id,
    claimType: content.claim.claimType,
    issuer: content.issuer.name,
    issuedAt: new Date(record.created_at * 1000).toISOString(),
    importedAt: new Date().toISOString(),
  });

  res.redirect('/wallet?success=' + encodeURIComponent('Record imported.'));
});

module.exports = router;
