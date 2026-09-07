'use strict';

// AGPL-3.0 -- see LICENSE-AGPL-3.0.

const express = require('express');
const { page, flash } = require('../web/layout');
const pages = require('../web/pages');
const store = require('../store');
const state = require('../state');
const keys = require('common-credo-core/lib/keys');

const router = express.Router();

router.get('/onboarding', (req, res) => {
  if (store.isOnboarded()) return res.redirect('/wallet');
  res.send(page({ title: 'Set up', nav: false, body: flash(req.query) + pages.onboardingIntro() }));
});

router.post('/onboarding/generate', (req, res) => {
  if (store.isOnboarded()) return res.redirect('/wallet');
  const kp = keys.generateKeypair(); // same keygen fn -- it's generic, not issuer-specific
  state.setPendingOnboardingKeypair(kp);
  const { nsec, npub } = keys.encodeForBackup(kp.secretKey, kp.publicKey);
  res.send(page({ title: 'Back up your key', nav: false, body: pages.onboardingBackup({ nsec, npub }) }));
});

router.post('/onboarding/complete', (req, res) => {
  if (store.isOnboarded()) return res.redirect('/wallet');
  const pending = state.getPendingOnboardingKeypair();
  if (!pending) return res.redirect('/onboarding?error=' + encodeURIComponent('Session expired -- please generate a key again.'));

  const b = req.body;
  if (!b.confirmedBackup) return res.redirect('/onboarding?error=' + encodeURIComponent('You must confirm you saved the backup.'));
  if (b.password !== b.passwordConfirm) return res.redirect('/onboarding?error=' + encodeURIComponent('Passwords did not match.'));
  if (!b.password || b.password.length < 8) return res.redirect('/onboarding?error=' + encodeURIComponent('Password must be at least 8 characters.'));

  // Simpler than the issuer's onboarding: no anchor declaration, and no
  // list to publish -- R2's "list from day one" obligation belongs to
  // issuers, not holders. Generating the key and saving it is the whole act.
  keys.saveEncryptedKey(store.KEY_PATH, pending.secretKey, b.password);
  store.saveHolderProfile({
    npub: keys.encodeForBackup(pending.secretKey, pending.publicKey).npub,
    publicKey: pending.publicKey,
    onboardedAt: new Date().toISOString(),
  });
  state.setUnlockedSecretKey(pending.secretKey);
  state.clearPendingOnboardingKeypair();
  res.redirect('/wallet');
});

router.get('/unlock', (req, res) => {
  if (!store.isOnboarded()) return res.redirect('/onboarding');
  if (state.isUnlocked()) return res.redirect('/wallet');
  res.send(page({ title: 'Unlock', nav: false, body: flash(req.query) + pages.unlockPage() }));
});

router.post('/unlock', (req, res) => {
  try {
    const sk = keys.loadEncryptedKey(store.KEY_PATH, req.body.password);
    state.setUnlockedSecretKey(sk);
    res.redirect('/wallet');
  } catch (e) {
    res.redirect('/unlock?error=' + encodeURIComponent(e.message));
  }
});

router.get('/', (req, res) => {
  if (!store.isOnboarded()) return res.redirect('/onboarding');
  if (!state.isUnlocked()) return res.redirect('/unlock');
  res.redirect('/wallet');
});

module.exports = router;
