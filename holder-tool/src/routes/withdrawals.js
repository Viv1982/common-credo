'use strict';

// AGPL-3.0 -- see LICENSE-AGPL-3.0.
//
// The new holder-withdrawal mechanism (kind 30303) -- an independent
// exercise of her Part IV.5 right, needing no issuer cooperation at all.
// This is what actually closes Gap 3 for a holder who has set up this
// tool. Immediate publish, no window: see core/lib/holderActions.js for
// why, and the plan this was built from for why this kind exists at all
// (it is a small, deliberate extension beyond the literal current spec
// text, not something D8 already specifies).

const express = require('express');
const { page, flash } = require('../web/layout');
const pages = require('../web/pages');
const store = require('../store');
const state = require('../state');
const { parseRecordContent } = require('common-credo-core/lib/record');
const holderActions = require('common-credo-core/lib/holderActions');

const router = express.Router();

router.get('/withdrawals/new', (req, res) => {
  const record = store.loadImportedRecord(req.query.recordId);
  if (!record) return res.status(404).send('Record not found.');
  res.send(page({ title: 'Withdraw this record', body: flash(req.query) + pages.withdrawalForm({ record, content: parseRecordContent(record) }) }));
});

router.post('/withdrawals/:recordId', async (req, res) => {
  if (!req.body.confirmedPermanent) {
    return res.redirect(`/withdrawals/new?recordId=${encodeURIComponent(req.params.recordId)}&error=` + encodeURIComponent('You must confirm you understand this is permanent and public.'));
  }
  try {
    const result = await holderActions.publishWithdrawal(state.getPool(), state.getUnlockedSecretKey(), req.params.recordId, req.body.reason, state.getRelays());
    if (!result.publishResult.ok) {
      return res.redirect('/wallet?error=' + encodeURIComponent('Could not publish the withdrawal (relay quorum not met). Please try again.'));
    }
    res.redirect('/wallet?success=' + encodeURIComponent('Withdrawn. Any verifier checking this record now sees it as withdrawn by you -- no issuer involved.'));
  } catch (e) {
    res.redirect('/wallet?error=' + encodeURIComponent(e.message));
  }
});

module.exports = router;
