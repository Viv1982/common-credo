'use strict';

// AGPL-3.0 -- see LICENSE-AGPL-3.0. This is application state, not the
// reusable core -- lib/ never reaches into this file.

const fs = require('fs');
const path = require('path');

// When running as a packaged executable (@yao-pkg/pkg sets process.pkg),
// __dirname points inside the read-only snapshot, so the data directory
// must live next to the executable instead -- that's where the issuer's
// key and records get written and must persist across runs. In normal
// `node src/server.js` development this branch is never taken and
// behaviour is unchanged.
const DATA_DIR = process.pkg
  ? path.join(path.dirname(process.execPath), 'common-credo-issuer-data')
  : path.join(__dirname, '..', 'data');
const PROFILE_PATH = path.join(DATA_DIR, 'issuer-profile.json');
const KEY_PATH = path.join(DATA_DIR, 'issuer-key.enc.json');
const RECORDS_INDEX_PATH = path.join(DATA_DIR, 'records-index.json');
const EXPORTS_DIR = path.join(DATA_DIR, 'exports');

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(EXPORTS_DIR, { recursive: true });
}

function isOnboarded() {
  return fs.existsSync(PROFILE_PATH) && fs.existsSync(KEY_PATH);
}

function saveIssuerProfile(profile) {
  ensureDataDir();
  fs.writeFileSync(PROFILE_PATH, JSON.stringify(profile, null, 2));
}

function loadIssuerProfile() {
  if (!fs.existsSync(PROFILE_PATH)) return null;
  return JSON.parse(fs.readFileSync(PROFILE_PATH, 'utf8'));
}

function loadRecordsIndex() {
  if (!fs.existsSync(RECORDS_INDEX_PATH)) return { records: [] };
  return JSON.parse(fs.readFileSync(RECORDS_INDEX_PATH, 'utf8'));
}

function saveRecordsIndex(index) {
  ensureDataDir();
  fs.writeFileSync(RECORDS_INDEX_PATH, JSON.stringify(index, null, 2));
}

// The authoritative status of a record (valid/cancelled/pending/etc.)
// always comes live from lib/verify.js + the pending queue -- this index
// is only a local convenience list of "what have I issued," never a
// second source of truth for cancellation status.
function addRecordToIndex(meta) {
  const index = loadRecordsIndex();
  index.records.push(meta);
  saveRecordsIndex(index);
}

function exportPathFor(recordId) {
  return path.join(EXPORTS_DIR, recordId + '.json');
}

module.exports = {
  DATA_DIR, PROFILE_PATH, KEY_PATH, RECORDS_INDEX_PATH, EXPORTS_DIR,
  ensureDataDir, isOnboarded, saveIssuerProfile, loadIssuerProfile,
  loadRecordsIndex, saveRecordsIndex, addRecordToIndex, exportPathFor,
};
