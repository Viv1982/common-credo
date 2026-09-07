'use strict';

// AGPL-3.0 -- see LICENSE-AGPL-3.0.

const express = require('express');
const { page, flash } = require('../web/layout');
const pages = require('../web/pages');
const store = require('../store');
const state = require('../state');
const { verifyRecord } = require('common-credo-core/lib/verify');
const { parseRecordContent } = require('common-credo-core/lib/record');

const router = express.Router();

// Every imported record's LIVE status. Holder-tool always has her own
// pubkey locally (it's her own wallet), so the "who do I check the
// dispute/withdrawal address as" problem that a third-party verifier
// faces (see core/NOSTR-KINDS.md) doesn't apply here.
router.get('/wallet', async (req, res) => {
  const profile = store.loadHolderProfile();
  const records = store.loadAllImportedRecords();
  const pool = state.getPool();

  const withStatus = await Promise.all(records.map(async (record) => {
    const content = parseRecordContent(record);
    const verification = await verifyRecord(pool, record, state.getRelays(), profile.publicKey);
    return { record, content, verification };
  }));

  res.send(page({ title: 'Wallet', body: flash(req.query) + pages.walletPage({ profile, records: withStatus }) }));
});

module.exports = router;
