'use strict';

// Bundles the Phase 1 spike entry into one self-contained browser ESM, the
// same esbuild technique build-site.js uses to vendor nostr-tools for the
// hosted verifier. Resolution walks from core/lib/* up into core/node_modules
// for nostr-tools and @noble/hashes, so nothing extra needs installing here.

const path = require('path');
const esbuild = require('esbuild');

const ROOT = path.join(__dirname, '..', '..');

esbuild.build({
  entryPoints: [path.join(__dirname, 'entry.js')],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  outfile: path.join(__dirname, 'bundle.js'),
  legalComments: 'none',
  // nostr-tools and @noble/hashes are installed in core/node_modules; add it
  // as a resolution root so bare specifiers resolve regardless of which file
  // imports them (same idea as build-site.js's resolveDir).
  nodePaths: [path.join(ROOT, 'core', 'node_modules')],
}).then(() => console.log('wrote holder-pwa/spike/bundle.js'))
  .catch((e) => { console.error(e); process.exit(1); });
