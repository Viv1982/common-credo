'use strict';

// AGPL-3.0 -- see LICENSE-AGPL-3.0.
//
// The intake + countersign workflow for the residual gap documented in
// toolkit/GAPS.md (Gap 3): D5 grants the holder a right to cancel their
// own record, but only the issuer's key can sign the noticeboard a
// verifier checks. This is a request the issuer must countersign, not a
// self-executing right -- named as such in the UI (see
// src/web/pages.js#holderRequestsPage), not silently smoothed over.

const express = require('express');
const { page, flash } = require('../web/layout');
const pages = require('../web/pages');
const store = require('../store');
const pendingQueue = require('common-credo-core/lib/pendingQueue');

const router = express.Router();

router.get('/holder-requests', (req, res) => {
  res.send(page({ title: 'Holder requests', body: flash(req.query) + pages.holderRequestsPage() }));
});

router.post('/holder-requests', (req, res) => {
  const b = req.body;
  if (!b.notifiedHolder) {
    return res.redirect('/holder-requests?error=' + encodeURIComponent('You must confirm the request is genuinely the holder\'s.'));
  }
  try {
    pendingQueue.enqueueCancellation(store.DATA_DIR, {
      recordId: b.recordId,
      reason: b.reason,
      cancelledBy: 'holder',
    });
    res.redirect('/cancellations?success=' + encodeURIComponent('Holder request countersigned and queued -- becomes visible to verifiers in 72 hours.'));
  } catch (e) {
    res.redirect('/holder-requests?error=' + encodeURIComponent(e.message));
  }
});

module.exports = router;
