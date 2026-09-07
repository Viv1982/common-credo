'use strict';

// AGPL-3.0 -- see LICENSE-AGPL-3.0.

const express = require('express');
const { page, flash } = require('../web/layout');
const pages = require('../web/pages');
const store = require('../store');
const state = require('../state');
const keys = require('common-credo-core/lib/keys');
const { validateIssuerAnchor } = require('common-credo-core/lib/anchor');
const cancellationList = require('common-credo-core/lib/cancellationList');

const router = express.Router();

router.get('/onboarding', (req, res) => {
  if (store.isOnboarded()) return res.redirect('/dashboard');
  res.send(page({ title: 'Set up', nav: false, body: flash(req.query) + pages.onboardingIntro() }));
});

router.post('/onboarding/generate', (req, res) => {
  if (store.isOnboarded()) return res.redirect('/dashboard');
  const kp = keys.generateKeypair();
  state.setPendingOnboardingKeypair(kp);
  const { nsec, npub } = keys.encodeForBackup(kp.secretKey, kp.publicKey);
  res.send(page({ title: 'Back up your key', nav: false, body: pages.onboardingBackup({ nsec, npub }) }));
});

router.post('/onboarding/complete', async (req, res) => {
  if (store.isOnboarded()) return res.redirect('/dashboard');
  const pending = state.getPendingOnboardingKeypair();
  if (!pending) return res.redirect('/onboarding?error=' + encodeURIComponent('Session expired -- please generate a key again.'));

  const b = req.body;
  if (!b.confirmedBackup) return res.redirect('/onboarding?error=' + encodeURIComponent('You must confirm you saved the backup.'));
  if (b.password !== b.passwordConfirm) return res.redirect('/onboarding?error=' + encodeURIComponent('Passwords did not match.'));
  if (!b.password || b.password.length < 8) return res.redirect('/onboarding?error=' + encodeURIComponent('Password must be at least 8 characters.'));

  const anchor = { type: b.anchorType, country: b.anchorCountry, value: b.anchorValue };
  try {
    validateIssuerAnchor(anchor);
  } catch (e) {
    return res.redirect('/onboarding?error=' + encodeURIComponent(e.message));
  }

  // R2: keygen + publishing the (empty) signed list happen as one act --
  // this is that second half, in the same request as saving the key.
  const pool = state.getPool();
  const init = await cancellationList.initializeList(pool, pending.secretKey, state.getRelays());
  if (!init.publishResult.ok) {
    return res.redirect('/onboarding?error=' + encodeURIComponent(
      'Could not publish the initial cancellation noticeboard (relay quorum not met). Please try again.'
    ));
  }

  keys.saveEncryptedKey(store.KEY_PATH, pending.secretKey, b.password);
  store.saveIssuerProfile({
    name: b.name, orgType: b.orgType, location: b.location,
    anchor, publicKey: pending.publicKey, onboardedAt: new Date().toISOString(),
  });
  state.setUnlockedSecretKey(pending.secretKey);
  state.clearPendingOnboardingKeypair();
  res.redirect('/dashboard');
});

router.get('/unlock', (req, res) => {
  if (!store.isOnboarded()) return res.redirect('/onboarding');
  if (state.isUnlocked()) return res.redirect('/dashboard');
  res.send(page({ title: 'Unlock', nav: false, body: flash(req.query) + pages.unlockPage() }));
});

router.post('/unlock', (req, res) => {
  try {
    const sk = keys.loadEncryptedKey(store.KEY_PATH, req.body.password);
    state.setUnlockedSecretKey(sk);
    res.redirect('/dashboard');
  } catch (e) {
    res.redirect('/unlock?error=' + encodeURIComponent(e.message));
  }
});

router.get('/', (req, res) => {
  if (!store.isOnboarded()) return res.redirect('/onboarding');
  if (!state.isUnlocked()) return res.redirect('/unlock');
  res.redirect('/dashboard');
});

router.get('/dashboard', async (req, res) => {
  const profile = store.loadIssuerProfile();
  const { records } = store.loadRecordsIndex();
  const pending = require('common-credo-core/lib/pendingQueue').loadQueue(store.DATA_DIR).entries; // all pending, regardless of window
  const pool = state.getPool();
  const { event } = await cancellationList.fetchList(pool, profile.publicKey, state.getRelays());
  const { isStale } = require('common-credo-core/lib/freshness');
  const listStatus = !event
    ? '<span class="badge bad">not found -- publish failed?</span>'
    : isStale(event)
      ? '<span class="badge bad">stale (over 90 days)</span>'
      : '<span class="badge good">fresh</span>';

  res.send(page({
    title: 'Dashboard',
    body: flash(req.query) + pages.dashboardPage({
      profile, recordCount: records.length, pendingCount: pending.length, listStatus,
    }),
  }));
});

module.exports = router;
