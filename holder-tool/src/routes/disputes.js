'use strict';

// AGPL-3.0 -- see LICENSE-AGPL-3.0.
//
// D8's holder-controlled dispute address (kind 30301) -- disputing an
// ISSUER's cancellation. Immediate publish, no window: see
// core/lib/holderActions.js for why.

const express = require('express');
const { page, flash } = require('../web/layout');
const pages = require('../web/pages');
const store = require('../store');
const state = require('../state');
const { verifyRecord } = require('common-credo-core/lib/verify');
const { parseRecordContent } = require('common-credo-core/lib/record');
const holderActions = require('common-credo-core/lib/holderActions');

const router = express.Router();

router.get('/disputes/new', async (req, res) => {
  const record = store.loadImportedRecord(req.query.recordId);
  if (!record) return res.status(404).send('Record not found.');
  const profile = store.loadHolderProfile();
  const verification = await verifyRecord(state.getPool(), record, state.getRelays(), profile.publicKey);

  // UI gate, not a protocol restriction (see the plan): filing a dispute
  // only makes sense against a cancellation that actually happened. A
  // holder who was never cancelled but wants to say "I never authorised
  // this" should withdraw instead.
  if (verification.check2.status !== 'cancelled') {
    return res.redirect('/wallet?error=' + encodeURIComponent('This record has not been cancelled by the issuer -- nothing to dispute. Use "Withdraw" if you want it out of circulation.'));
  }

  res.send(page({
    title: 'File a dispute',
    body: flash(req.query) + pages.disputeForm({ record, content: parseRecordContent(record), cancellation: verification.check2.cancellation }),
  }));
});

router.post('/disputes/:recordId', async (req, res) => {
  const { category, detail } = req.body;
  try {
    const result = await holderActions.publishDispute(state.getPool(), state.getUnlockedSecretKey(), req.params.recordId, category, detail, state.getRelays());
    if (!result.publishResult.ok) {
      return res.redirect('/wallet?error=' + encodeURIComponent('Could not publish the dispute (relay quorum not met). Please try again.'));
    }
    res.redirect('/wallet?success=' + encodeURIComponent('Dispute published. It travels with the cancellation for every future verifier.'));
  } catch (e) {
    res.redirect('/wallet?error=' + encodeURIComponent(e.message));
  }
});

module.exports = router;
