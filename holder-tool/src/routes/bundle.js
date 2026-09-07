'use strict';

// AGPL-3.0 -- see LICENSE-AGPL-3.0.

const express = require('express');
const fs = require('fs');
const path = require('path');
const { page, flash } = require('../web/layout');
const pages = require('../web/pages');
const store = require('../store');
const state = require('../state');
const { readBundle } = require('common-credo-core/lib/bundle');

const router = express.Router();

router.get('/bundle', (req, res) => {
  const { records } = store.loadRecordsIndex();
  res.send(page({ title: 'Show a bundle', body: flash(req.query) + pages.bundleBuilderPage({ records }) }));
});

router.post('/bundle/export', async (req, res) => {
  const profile = store.loadHolderProfile();
  const pool = state.getPool();

  // Checkbox values arrive as a string, an array, or absent depending on
  // how many were checked -- normalise to an array of record IDs.
  let selected = req.body.recordIds || [];
  if (!Array.isArray(selected)) selected = [selected];
  const forceShow = Array.isArray(req.body.forceShowRecordIds) ? req.body.forceShowRecordIds
    : req.body.forceShowRecordIds ? [req.body.forceShowRecordIds] : [];

  const records = selected.map((id) => store.loadImportedRecord(id)).filter(Boolean);
  if (records.length === 0) {
    return res.redirect('/bundle?error=' + encodeURIComponent('Select at least one record to show.'));
  }

  // She sees live status before presenting -- same standing a verifier
  // would compute, so nothing surprises her when she hands it over.
  const standing = await readBundle(pool, records, state.getRelays(), profile.publicKey, { forceShowRecordIds: forceShow });

  // Spec Part V: "a verifier's reading of a bundle." A verifier needs her
  // pubkey to check her dispute/withdrawal addresses at all -- see
  // core/NOSTR-KINDS.md -- so the export is a wrapper envelope, not a
  // bare array of raw records.
  const envelope = {
    ccBundleVersion: '0.3',
    holderPubkey: profile.publicKey,
    holderNpub: profile.npub,
    generatedAt: new Date().toISOString(),
    records: standing.entries.filter((e) => e.shown).map((e) => records.find((r) => r.id === e.recordId)),
  };

  store.ensureDataDir();
  const fileName = `bundle-${Date.now()}.json`;
  const exportPath = store.exportPathFor(fileName);
  fs.writeFileSync(exportPath, JSON.stringify(envelope, null, 2));

  res.send(page({ title: 'Bundle ready', body: pages.bundleExportedPage({ standing, fileName }) }));
});

router.get('/bundle/download/:fileName', (req, res) => {
  const p = store.exportPathFor(path.basename(req.params.fileName));
  if (!fs.existsSync(p)) return res.status(404).send('Bundle not found.');
  res.download(p);
});

module.exports = router;
