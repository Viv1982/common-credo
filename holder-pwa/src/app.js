'use strict';

// AGPL-3.0 -- see LICENSE-AGPL-3.0.
//
// The DOM controller: hash-based routing, gating (onboard -> unlock ->
// wallet), and event wiring from the rendered screens to actions.js. This is
// the only browser-coupled module (document/window/location); all logic lives
// in actions.js (tested headlessly) and the copy in views.js. The unlocked
// key never leaves session.js's memory and is dropped when the tab closes.

const store = require('./store-idb');
const session = require('./session');
const engine = require('./engine');
const { makeActions } = require('./actions');
const views = require('./views');

const actions = makeActions({ store, session, engine });

// Transient, in-memory UI state (never persisted).
let pendingBackup = null;   // { nsec, npub } shown once during onboarding
let lastBundle = null;      // { standing, envelope } for the "ready" screen
let pendingFlash = null;    // { msg, kind } shown on the next screen

const appEl = () => document.getElementById('app');

function takeFlash() {
  const f = pendingFlash; pendingFlash = null;
  return f ? views.flash(f.msg, f.kind) : '';
}
// Render without touching the pending flash (used for transient placeholders
// like the wallet's "loading" state, so they don't consume a flash meant for
// the screen that follows).
function renderShell(html, opts) {
  appEl().innerHTML = views.shell(html, opts || {});
  window.scrollTo(0, 0);
}
function setScreen(html, opts) {
  renderShell(takeFlash() + html, opts);
}
function go(hash) {
  if (location.hash === hash) route();
  else location.hash = hash;
}
function flashThen(hash, msg, kind) {
  pendingFlash = { msg, kind };
  go(hash);
}

// --------------------------------------------------------------- rendering

async function route() {
  const parts = (location.hash || '#/').split('/');
  const seg1 = parts[1] || '';
  const seg2 = parts[2] || '';

  const onboarded = await store.isOnboarded();
  const unlocked = session.isUnlocked();

  // Gating: cannot use the wallet before onboarding and unlocking. Restore
  // (bringing back an identity from an exported key file) is allowed on a
  // device with no wallet yet.
  if (!onboarded && seg1 !== 'onboarding' && seg1 !== 'restore') return go('#/onboarding');
  if (onboarded && !unlocked && seg1 !== 'unlock') return go('#/unlock');

  try {
    switch (seg1) {
      case 'onboarding': return renderOnboarding(seg2);
      case 'restore': return setScreen(views.restore(), { nav: false });
      case 'unlock': return setScreen(views.unlock(), { nav: false });
      case 'wallet': return renderWallet();
      case 'import': return setScreen(views.importRecord(), { nav: true });
      case 'dispute': return renderDispute(seg2);
      case 'withdraw': return renderWithdraw(seg2);
      case 'bundle': return renderBundle(seg2);
      default: return go(onboarded ? (unlocked ? '#/wallet' : '#/unlock') : '#/onboarding');
    }
  } catch (e) {
    setScreen(`<div class="card"><h1>Something went wrong</h1><p>${views.escapeHtml(e.message || String(e))}</p><a class="btn" href="#/wallet">Back</a></div>`, { nav: false });
  }
}

function renderOnboarding(seg2) {
  if (seg2 === 'backup') {
    if (!pendingBackup) return go('#/onboarding');
    return setScreen(views.onboardingBackup(pendingBackup), { nav: false });
  }
  return setScreen(views.onboardingIntro(), { nav: false });
}

async function renderWallet() {
  // Placeholder must not consume a pending flash (success message shown after
  // an action redirects here) -- render it without takeFlash.
  renderShell('<div class="card"><p class="muted">Checking your records against the relays…</p></div>', { nav: true });
  const data = await actions.loadWallet();
  const keyStatus = { persisted: await storagePersisted(), exported: await actions.isKeyFileExported() };
  setScreen(views.wallet(Object.assign({}, data, { keyStatus })), { nav: true });
}

async function renderDispute(id) {
  const record = await store.loadImportedRecord(id);
  if (!record) return flashThen('#/wallet', 'Record not found.', 'error');
  const profile = await store.loadHolderProfile();
  const verification = await engine.verifyRecord(session.getPool(), record, session.getRelays(), profile.publicKey);
  // UI gate (not a protocol rule): only a cancellation can be disputed.
  if (verification.check2.status !== 'cancelled') {
    return flashThen('#/wallet', 'This record has not been cancelled by the issuer — nothing to dispute. Use "Withdraw" to take it out of circulation.', 'error');
  }
  setScreen(views.dispute({ record, content: engine.parseRecordContent(record), cancellation: verification.check2.cancellation }), { nav: true });
}

async function renderWithdraw(id) {
  const record = await store.loadImportedRecord(id);
  if (!record) return flashThen('#/wallet', 'Record not found.', 'error');
  setScreen(views.withdraw({ record, content: engine.parseRecordContent(record) }), { nav: true });
}

async function renderBundle(seg2) {
  if (seg2 === 'ready') {
    if (!lastBundle) return go('#/bundle');
    return setScreen(views.bundleReady({ standing: lastBundle.standing }), { nav: true });
  }
  const index = await store.loadRecordsIndex();
  setScreen(views.bundleBuilder({ records: index.records }), { nav: true });
}

// ---------------------------------------------------------------- handlers

async function handleClick(e) {
  const el = e.target.closest('[data-action]');
  if (!el || el.tagName === 'FORM') return;
  const action = el.getAttribute('data-action');
  if (action === 'lock') { e.preventDefault(); session.lock(); return go('#/unlock'); }
  if (action === 'copy') {
    e.preventDefault();
    const src = document.getElementById(el.getAttribute('data-copy'));
    if (src) { try { await navigator.clipboard.writeText(src.textContent); el.textContent = 'Copied'; } catch (_) {} }
    return;
  }
  if (action === 'generate-key') {
    e.preventDefault();
    pendingBackup = await actions.generateOnboardingKey();
    return go('#/onboarding/backup');
  }
  if (action === 'import-record') {
    e.preventDefault();
    return doImport();
  }
  if (action === 'export-key') { e.preventDefault(); return doExportKey(); }
  if (action === 'restore') { e.preventDefault(); return doRestore(); }
  if (action === 'share-bundle') { e.preventDefault(); return shareBundle(); }
  if (action === 'download-bundle') { e.preventDefault(); return downloadBundle(); }
}

async function handleSubmit(e) {
  const form = e.target;
  const action = form.getAttribute && form.getAttribute('data-action');
  if (!action) return;
  e.preventDefault();
  const el = form.elements;

  try {
    if (action === 'complete-onboarding') {
      await actions.completeOnboarding({
        confirmedBackup: el.confirmedBackup.checked,
        password: el.password.value,
        passwordConfirm: el.passwordConfirm.value,
      });
      pendingBackup = null;
      await requestPersistence(); // ask the phone to keep the wallet's storage
      return flashThen('#/wallet', 'Your wallet is ready.', 'success');
    }
    if (action === 'unlock') {
      await actions.unlock(el.password.value);
      return go('#/wallet');
    }
    if (action === 'file-dispute') {
      const id = form.getAttribute('data-record-id');
      await actions.fileDispute(id, el.category.value, el.detail.value);
      return flashThen('#/wallet', 'Dispute published. It travels with the cancellation for every future verifier.', 'success');
    }
    if (action === 'withdraw') {
      const id = form.getAttribute('data-record-id');
      if (!el.confirmedPermanent.checked) throw new Error('You must confirm you understand this is permanent and public.');
      await actions.withdraw(id, el.reason.value);
      return flashThen('#/wallet', 'Withdrawn. Any verifier checking this record now sees it as withdrawn by you — no issuer involved.', 'success');
    }
    if (action === 'build-bundle') {
      const selected = Array.from(form.querySelectorAll('input[name="recordIds"]:checked')).map((c) => c.value);
      const { standing, envelope } = await actions.buildBundle(selected, []);
      lastBundle = { standing, envelope };
      return go('#/bundle/ready');
    }
  } catch (err) {
    // Re-render the current screen with the error banner.
    pendingFlash = { msg: err.message || String(err), kind: 'error' };
    return route();
  }
}

async function doImport() {
  const fileInput = document.getElementById('record-file');
  const paste = document.getElementById('record-paste');
  let text = '';
  if (fileInput && fileInput.files && fileInput.files[0]) text = await fileInput.files[0].text();
  else if (paste && paste.value.trim()) text = paste.value.trim();
  else return flashThen('#/import', 'Choose a record file or paste the record text.', 'error');

  try {
    const res = await actions.importRecord(text);
    return flashThen('#/wallet', res.alreadyPresent ? 'Already in your wallet.' : 'Record imported.', 'success');
  } catch (err) {
    return flashThen('#/import', err.message || String(err), 'error');
  }
}

// --- Key backup / restore / persistence --------------------------------

async function requestPersistence() {
  try { if (navigator.storage && navigator.storage.persist) return await navigator.storage.persist(); } catch (_) {}
  return false;
}
async function storagePersisted() {
  try { if (navigator.storage && navigator.storage.persisted) return await navigator.storage.persisted(); } catch (_) {}
  return false;
}
function downloadJson(obj, filename) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function doExportKey() {
  try {
    const payload = await actions.exportKeyPayload();
    downloadJson(payload, 'common-credo-key.enc.json');
    await actions.markKeyExported();
    return flashThen('#/wallet', "Key file exported. Keep it somewhere safe, like your phone's Files.", 'success');
  } catch (err) {
    return flashThen('#/wallet', err.message || String(err), 'error');
  }
}
async function doRestore() {
  const fileInput = document.getElementById('key-file');
  const pw = (document.getElementById('restore-password') || {}).value || '';
  let text = '';
  if (fileInput && fileInput.files && fileInput.files[0]) text = await fileInput.files[0].text();
  if (!text) return flashThen('#/restore', 'Choose your key file.', 'error');
  if (!pw) return flashThen('#/restore', 'Enter the password for the key file.', 'error');
  try {
    await actions.restoreFromKeyFile(text, pw);
    await requestPersistence();
    return flashThen('#/wallet', 'Restored. Import your records again to see them here.', 'success');
  } catch (err) {
    return flashThen('#/restore', err.message || String(err), 'error');
  }
}

function bundleFile() {
  const json = JSON.stringify(lastBundle.envelope, null, 2);
  return new File([json], 'common-credo-bundle.json', { type: 'application/json' });
}
async function shareBundle() {
  if (!lastBundle) return;
  const file = bundleFile();
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Common Credo bundle' });
      return;
    }
  } catch (_) { /* fall through to download */ }
  downloadBundle();
}
function downloadBundle() {
  if (!lastBundle) return;
  const url = URL.createObjectURL(bundleFile());
  const a = document.createElement('a');
  a.href = url; a.download = 'common-credo-bundle.json';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// --------------------------------------------------------- install affordance

let deferredPrompt = null;

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}
function installDismissed() {
  try { return localStorage.getItem('cc-install-dismissed') === '1'; } catch (_) { return false; }
}
function dismissInstall() {
  try { localStorage.setItem('cc-install-dismissed', '1'); } catch (_) {}
  const bar = document.getElementById('install-bar');
  if (bar) bar.remove();
}
function showInstallBar(inner) {
  if (document.getElementById('install-bar') || installDismissed() || isStandalone()) return;
  const bar = document.createElement('div');
  bar.id = 'install-bar';
  bar.className = 'install-bar';
  bar.innerHTML = `${inner}<button class="install-x" data-install="dismiss" aria-label="Dismiss">&times;</button>`;
  bar.addEventListener('click', async (e) => {
    const act = e.target.getAttribute && e.target.getAttribute('data-install');
    if (act === 'dismiss') return dismissInstall();
    if (act === 'install' && deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      dismissInstall();
    }
  });
  document.body.appendChild(bar);
}
function setupInstall() {
  if (isStandalone()) return;
  // Android/Chromium: capture the prompt and offer an Install button.
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallBar('<span>Install this wallet on your phone.</span> <button class="btn-inline" data-install="install">Install</button>');
  });
  // iOS Safari has no install prompt -- show the Add-to-Home-Screen hint.
  if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
    showInstallBar('<span>Add to your Home Screen: tap Share, then &ldquo;Add to Home Screen&rdquo;.</span>');
  }
}

// ------------------------------------------------------------------- init

// Auto-lock: drop the key when the tab is closed/hidden away. pagehide covers
// closing/navigating; a background timer covers prolonged backgrounding
// (e.g. the phone is locked with the app open).
let bgTimer = null;
function onHidden() {
  bgTimer = setTimeout(() => { session.lock(); }, 5 * 60 * 1000);
}
function onVisible() {
  if (bgTimer) { clearTimeout(bgTimer); bgTimer = null; }
  // If we were locked while hidden, the next route() will gate to /unlock.
  if (!session.isUnlocked()) route();
}

function init() {
  if (!engine.cryptoSupported()) {
    appEl().innerHTML = '<main class="screen"><div class="card"><h1>Unsupported browser</h1><p>This wallet needs WebCrypto, which your browser does not provide. Try a current version of Chrome, Safari, or Firefox.</p></div></main>';
    return;
  }
  appEl().addEventListener('click', handleClick);
  appEl().addEventListener('submit', handleSubmit);
  window.addEventListener('hashchange', route);
  window.addEventListener('pagehide', () => session.lock());
  document.addEventListener('visibilitychange', () => (document.hidden ? onHidden() : onVisible()));
  setupInstall();
  route();
}

// Register the service worker (installability + offline). Independent of the
// app's own init so it runs even if the crypto-unsupported branch is taken.
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}
