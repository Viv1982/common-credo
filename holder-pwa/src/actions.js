'use strict';

// AGPL-3.0 -- see LICENSE-AGPL-3.0.
//
// The wallet's orchestration layer: every holder action, DOM-free and
// dependency-injected, so it is unit-tested headlessly (FakePool +
// fake-indexeddb) exactly like core/. app.js wires the DOM to these; nothing
// here touches `document`, `window`, or the network directly -- the relay
// pool arrives via the injected session. Behaviour mirrors the tested desktop
// routes in holder-tool/src/routes/* (same validation, same messages, same
// D8/withdrawal semantics), so the phone and desktop tools stay consistent.

function makeActions({ store, session, engine }) {
  // --- Onboarding --------------------------------------------------------

  // Generate the keypair, hold it in memory, and hand back the backup forms.
  // Nothing is persisted yet -- persistence happens only after the holder
  // confirms she has saved the backup (completeOnboarding).
  async function generateOnboardingKey() {
    const kp = engine.generateKeypair();
    session.setPendingOnboardingKeypair(kp);
    return engine.encodeForBackup(kp.secretKey, kp.publicKey); // { nsec, npub }
  }

  async function completeOnboarding({ confirmedBackup, password, passwordConfirm }) {
    const pending = session.getPendingOnboardingKeypair();
    if (!pending) throw new Error('Setup expired -- please generate a key again.');
    if (!confirmedBackup) throw new Error('You must confirm you saved the backup.');
    if (password !== passwordConfirm) throw new Error('Passwords did not match.');
    if (!password || password.length < 8) throw new Error('Password must be at least 8 characters.');

    // Encrypt with the WebCrypto adapter, store the exact interoperable
    // payload, and save the public profile. No cancellation list to publish
    // -- R2's "list from day one" is an issuer obligation, not a holder's.
    const payload = await engine.encryptSecretKey(pending.secretKey, password);
    await store.saveEncryptedKey(payload);
    const { npub } = engine.encodeForBackup(pending.secretKey, pending.publicKey);
    await store.saveHolderProfile({
      npub,
      publicKey: pending.publicKey,
      onboardedAt: new Date().toISOString(),
    });
    session.setUnlockedSecretKey(pending.secretKey);
    session.clearPendingOnboardingKeypair();
    return { npub };
  }

  async function unlock(password) {
    const payload = await store.loadEncryptedKey();
    if (!payload) throw new Error('No key on this device -- set up the wallet first.');
    const sk = await engine.decryptSecretKey(payload, password); // throws "Wrong password..." on failure
    session.setUnlockedSecretKey(sk);
  }

  // --- Key backup & restore (Phase 5) ------------------------------------
  // The encrypted key file is byte-identical to the desktop tool's and to
  // what the PWA stores; exporting it to the phone's Files is the real
  // safety net, because browser storage can be evicted or cleared.

  async function exportKeyPayload() {
    const payload = await store.loadEncryptedKey();
    if (!payload) throw new Error('No key to export.');
    return payload;
  }
  async function markKeyExported() {
    await store.setKeyFileExported(true);
  }
  async function isKeyFileExported() {
    return store.isKeyFileExported();
  }

  // Restore an identity on a fresh (or wiped) device from an exported
  // encrypted key file. The password proves ownership and decrypts it; the
  // public profile is rebuilt from the recovered secret key. Records are NOT
  // restored -- they are separate files the holder re-imports -- which the UI
  // states plainly.
  async function restoreFromKeyFile(payloadText, password) {
    let payload;
    try {
      payload = JSON.parse(payloadText);
    } catch (e) {
      throw new Error('That file is not a valid Common Credo key file.');
    }
    const sk = await engine.decryptSecretKey(payload, password); // throws "Wrong password..." or a format error
    const publicKey = engine.publicKeyFromSecret(sk);
    const { npub } = engine.encodeForBackup(sk, publicKey);
    await store.saveEncryptedKey(payload);
    await store.saveHolderProfile({ npub, publicKey, onboardedAt: new Date().toISOString(), restored: true });
    await store.setKeyFileExported(true); // she demonstrably holds the file
    session.setUnlockedSecretKey(sk);
    return { npub };
  }

  // --- Records -----------------------------------------------------------

  // Validate the seal BEFORE persisting (Spec II.2.2 #6): a tampered file is
  // rejected here, never silently added. Re-importing the same record is a
  // harmless no-op (R1 gives a free idempotency key).
  async function importRecord(jsonText) {
    let record;
    try {
      record = JSON.parse(jsonText);
    } catch (e) {
      throw new Error('That file is not valid JSON -- was it really a Common Credo record?');
    }
    if (!engine.recordIsStructurallySealed(record)) {
      throw new Error("This record's seal does not check out -- it may be corrupted or tampered with. Not imported.");
    }
    let content;
    try {
      content = engine.parseRecordContent(record);
    } catch (e) {
      throw new Error("Could not read this record's contents.");
    }
    if (await store.hasRecord(record.id)) {
      return { alreadyPresent: true, record };
    }
    await store.saveImportedRecord(record);
    await store.addRecordToIndex({
      recordId: record.id,
      claimType: content.claim.claimType,
      issuer: content.issuer.name,
      issuedAt: new Date(record.created_at * 1000).toISOString(),
      importedAt: new Date().toISOString(),
    });
    return { alreadyPresent: false, record };
  }

  // --- Wallet view (live status) -----------------------------------------

  // Every record's status is pulled LIVE from core verify.js against the
  // relays -- never a cached verdict from the store.
  async function loadWallet() {
    const profile = await store.loadHolderProfile();
    const records = await store.loadAllImportedRecords();
    const pool = session.getPool();
    const relays = session.getRelays();
    const rows = await Promise.all(records.map(async (record) => {
      const content = engine.parseRecordContent(record);
      const verification = await engine.verifyRecord(pool, record, relays, profile.publicKey);
      return { record, content, verification };
    }));
    return { profile, rows };
  }

  // --- Dispute (kind 30301) / Withdraw (kind 30303) ----------------------

  async function fileDispute(recordId, category, detail) {
    const result = await engine.publishDispute(
      session.getPool(), session.getUnlockedSecretKey(), recordId, category, detail, session.getRelays());
    if (!result.publishResult.ok) {
      throw new Error('Could not publish the dispute (relay quorum not met). Please try again.');
    }
    return result;
  }

  async function withdraw(recordId, reason) {
    if (!reason) throw new Error('A withdrawal must state a reason.');
    const result = await engine.publishWithdrawal(
      session.getPool(), session.getUnlockedSecretKey(), recordId, reason, session.getRelays());
    if (!result.publishResult.ok) {
      throw new Error('Could not publish the withdrawal (relay quorum not met). Please try again.');
    }
    return result;
  }

  // --- Build & show a bundle ---------------------------------------------

  // Produces both the live standing (what a verifier would compute, so she
  // sees it before handing anything over) and the export envelope -- the
  // wrapper a verifier actually needs (her pubkey lets them check her
  // dispute/withdrawal addresses). app.js turns the envelope into a
  // downloadable/shareable Blob; there is no server file to write.
  async function buildBundle(selectedIds, forceShowIds) {
    const profile = await store.loadHolderProfile();
    const records = [];
    for (const id of selectedIds) {
      const r = await store.loadImportedRecord(id);
      if (r) records.push(r);
    }
    if (records.length === 0) throw new Error('Select at least one record to show.');

    const standing = await engine.readBundle(
      session.getPool(), records, session.getRelays(), profile.publicKey,
      { forceShowRecordIds: forceShowIds || [] });

    const shownRecords = standing.entries
      .filter((e) => e.shown)
      .map((e) => records.find((r) => r.id === e.recordId));

    const envelope = {
      ccBundleVersion: '0.3',
      holderPubkey: profile.publicKey,
      holderNpub: profile.npub,
      generatedAt: new Date().toISOString(),
      records: shownRecords,
    };
    return { standing, envelope };
  }

  return {
    generateOnboardingKey, completeOnboarding, unlock,
    exportKeyPayload, markKeyExported, isKeyFileExported, restoreFromKeyFile,
    importRecord, loadWallet,
    fileDispute, withdraw, buildBundle,
  };
}

module.exports = { makeActions };
