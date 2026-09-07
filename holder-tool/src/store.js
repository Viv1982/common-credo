'use strict';

// AGPL-3.0 -- see LICENSE-AGPL-3.0. This is application state, not the
// reusable core -- core/lib/ never reaches into this file.

const fs = require('fs');
const path = require('path');

// When running as a packaged executable (@yao-pkg/pkg sets process.pkg),
// __dirname points inside the read-only snapshot, so the wallet data must
// live next to the executable instead. In normal `node src/server.js`
// development this branch is never taken and behaviour is unchanged.
const DATA_DIR = process.pkg
  ? path.join(path.dirname(process.execPath), 'common-credo-wallet-data')
  : path.join(__dirname, '..', 'data');
const PROFILE_PATH = path.join(DATA_DIR, 'holder-profile.json');
const KEY_PATH = path.join(DATA_DIR, 'holder-key.enc.json');
const RECORDS_DIR = path.join(DATA_DIR, 'records');
const RECORDS_INDEX_PATH = path.join(DATA_DIR, 'records-index.json');
const EXPORTS_DIR = path.join(DATA_DIR, 'exports');

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(RECORDS_DIR, { recursive: true });
  fs.mkdirSync(EXPORTS_DIR, { recursive: true });
}

function isOnboarded() {
  return fs.existsSync(PROFILE_PATH) && fs.existsSync(KEY_PATH);
}

function saveHolderProfile(profile) {
  ensureDataDir();
  fs.writeFileSync(PROFILE_PATH, JSON.stringify(profile, null, 2));
}

function loadHolderProfile() {
  if (!fs.existsSync(PROFILE_PATH)) return null;
  return JSON.parse(fs.readFileSync(PROFILE_PATH, 'utf8'));
}

function recordPathFor(recordId) {
  return path.join(RECORDS_DIR, recordId + '.json');
}

function hasRecord(recordId) {
  return fs.existsSync(recordPathFor(recordId));
}

function saveImportedRecord(record) {
  ensureDataDir();
  fs.writeFileSync(recordPathFor(record.id), JSON.stringify(record, null, 2));
}

function loadImportedRecord(recordId) {
  const p = recordPathFor(recordId);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function loadAllImportedRecords() {
  const { records } = loadRecordsIndex();
  return records.map((r) => loadImportedRecord(r.recordId)).filter(Boolean);
}

function loadRecordsIndex() {
  if (!fs.existsSync(RECORDS_INDEX_PATH)) return { records: [] };
  return JSON.parse(fs.readFileSync(RECORDS_INDEX_PATH, 'utf8'));
}

function saveRecordsIndex(index) {
  ensureDataDir();
  fs.writeFileSync(RECORDS_INDEX_PATH, JSON.stringify(index, null, 2));
}

// Local convenience list of "what have I imported" -- never a second
// source of truth for a record's live status, same rule as issuer-tool's
// store.js. Status always comes live from core/lib/verify.js.
function addRecordToIndex(meta) {
  const index = loadRecordsIndex();
  index.records.push(meta);
  saveRecordsIndex(index);
}

function exportPathFor(bundleFileName) {
  return path.join(EXPORTS_DIR, bundleFileName);
}

module.exports = {
  DATA_DIR, PROFILE_PATH, KEY_PATH, RECORDS_DIR, RECORDS_INDEX_PATH, EXPORTS_DIR,
  ensureDataDir, isOnboarded, saveHolderProfile, loadHolderProfile,
  recordPathFor, hasRecord, saveImportedRecord, loadImportedRecord, loadAllImportedRecords,
  loadRecordsIndex, saveRecordsIndex, addRecordToIndex, exportPathFor,
};
