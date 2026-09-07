'use strict';

// AGPL-3.0 -- see LICENSE-AGPL-3.0.

const express = require('express');
const { page, flash } = require('../web/layout');
const pages = require('../web/pages');
const store = require('../store');
const state = require('../state');
const pendingQueue = require('common-credo-core/lib/pendingQueue');
const cancellationList = require('common-credo-core/lib/cancellationList');

const router = express.Router();

router.get('/cancellations', async (req, res) => {
  const profile = store.loadIssuerProfile();
  const pending = pendingQueue.loadQueue(store.DATA_DIR).entries;
  const { entries: published } = await cancellationList.fetchList(state.getPool(), profile.publicKey, state.getRelays());
  res.send(page({ title: 'Cancellations', body: flash(req.query) + pages.cancellationsPage({ pending, published }) }));
});

// NOTE: registration order matters here. Express matches routes in the
// order they're registered, not by specificity -- a POST to
// "/cancellations/run-scheduler" would otherwise be captured by the
// "/cancellations/:recordId" handler below (with recordId literally set
// to the string "run-scheduler"). The static route must come first.
router.post('/cancellations/run-scheduler', async (req, res) => {
  const profile = store.loadIssuerProfile();
  const result = await cancellationList.promotePendingCancellations(
    state.getPool(), state.getUnlockedSecretKey(), profile.publicKey, store.DATA_DIR, state.getRelays()
  );
  const msg = !result.attempted
    ? 'Nothing to do -- no cancellations due and the noticeboard is fresh.'
    : result.publishResult.ok
      ? (result.reStampedOnly ? 'Noticeboard re-stamped.' : `Promoted ${result.promoted.length} cancellation(s).`)
      : 'Publish failed (relay quorum not met) -- will retry on the next run.';
  res.redirect('/dashboard?success=' + encodeURIComponent(msg));
});

// Issuer-initiated cancellation of a record it signed (Spec Part IV,
// D5/D8). Enqueues into the 72h pending window -- see lib/pendingQueue.js
// for why this is enforced locally rather than via a future-dated tag.
router.post('/cancellations/:recordId', (req, res) => {
  try {
    pendingQueue.enqueueCancellation(store.DATA_DIR, {
      recordId: req.params.recordId,
      reason: req.body.reason,
      cancelledBy: 'issuer',
    });
    res.redirect('/records?success=' + encodeURIComponent('Cancellation queued -- becomes visible to verifiers in 72 hours.'));
  } catch (e) {
    res.redirect('/records?error=' + encodeURIComponent(e.message));
  }
});

module.exports = router;
