'use strict';

// AGPL-3.0 -- see LICENSE-AGPL-3.0.

const express = require('express');
const fs = require('fs');
const { page, flash } = require('../web/layout');
const pages = require('../web/pages');
const store = require('../store');
const state = require('../state');
const { createRecord } = require('common-credo-core/lib/record');
const cancellationList = require('common-credo-core/lib/cancellationList');
const pendingQueue = require('common-credo-core/lib/pendingQueue');

const router = express.Router();

router.get('/records/new', (req, res) => {
  res.send(page({ title: 'New record', body: flash(req.query) + pages.recordNewForm() }));
});

router.post('/records', async (req, res) => {
  const b = req.body;
  const profile = store.loadIssuerProfile();

  const isExtension = b.claimType === '__extension__';
  const claimType = isExtension ? b.extensionClaimType : b.claimType;

  const fields = {
    issuer: { name: profile.name, orgType: profile.orgType, location: profile.location, anchor: profile.anchor },
    subject: { reference: b.subjectReference, identityAnchorType: b.identityAnchorType, identityAnchorValue: b.identityAnchorValue },
    claim: {
      claimType,
      amount: b.amount ? Number(b.amount) : null,
      period: b.period,
      outcome: { polarity: b.polarity, detail: b.outcomeDetail },
    },
    vouchType: b.vouchType,
    stake: { type: b.stakeType, description: b.stakeDescription, declaredProfile: b.declaredProfile },
  };
  if (isExtension) fields.claimTypeExtension = { creditJudgement: true };

  let record;
  try {
    record = createRecord(fields, state.getUnlockedSecretKey(), b.holderPubkeyHex || undefined);
  } catch (e) {
    return res.redirect('/records/new?error=' + encodeURIComponent(e.message));
  }

  store.ensureDataDir();
  const exportPath = store.exportPathFor(record.id);
  fs.writeFileSync(exportPath, JSON.stringify(record, null, 2));
  store.addRecordToIndex({
    recordId: record.id, claimType, subjectReference: b.subjectReference, issuedAt: new Date(record.created_at * 1000).toISOString(),
  });

  res.send(page({ title: 'Record sealed', body: pages.recordCreatedPage({ record, exportPath }) }));
});

router.get('/records/:id/export', (req, res) => {
  const p = store.exportPathFor(req.params.id);
  if (!fs.existsSync(p)) return res.status(404).send('Record not found.');
  res.download(p);
});

router.get('/records', async (req, res) => {
  const { records } = store.loadRecordsIndex();
  const pool = state.getPool();
  const profile = store.loadIssuerProfile();
  const { entries: publishedEntries } = await cancellationList.fetchList(pool, profile.publicKey, state.getRelays());
  const pendingEntries = pendingQueue.loadQueue(store.DATA_DIR).entries;

  const withStatus = records.map((r) => {
    const published = publishedEntries.find((e) => e.recordId === r.recordId);
    const pending = pendingEntries.find((e) => e.recordId === r.recordId);
    let cancellationStatus = 'none';
    if (published) cancellationStatus = `cancelled (${published.cancelledBy})`;
    else if (pending) cancellationStatus = `pending until ${pending.effectiveAt}`;
    return Object.assign({}, r, { cancellationStatus });
  });

  res.send(page({ title: 'Records', body: flash(req.query) + pages.recordsListPage({ records: withStatus }) }));
});

module.exports = router;
