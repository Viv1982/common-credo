'use strict';

// AGPL-3.0 -- see LICENSE-AGPL-3.0.
//
// Self-hosted, single-operator localhost app (Spec-conformant issuer
// tool, Plan v1). Not a hosted SaaS -- binds to localhost only. Not a
// CLI -- the White-Label decision record is explicit that target users
// "will not hire developers or assemble tools from code blocks."

const express = require('express');
const store = require('./store');
const state = require('./state');
const cancellationList = require('common-credo-core/lib/cancellationList');

const issuerRoutes = require('./routes/issuer');
const recordsRoutes = require('./routes/records');
const cancellationsRoutes = require('./routes/cancellations');
const holderRequestsRoutes = require('./routes/holder-requests');

const PORT = process.env.PORT || 4173;
const SCHEDULER_INTERVAL_MS = 60 * 60 * 1000; // hourly is plenty of margin inside a 72h window and a 90-day cap

const app = express();
app.use(express.urlencoded({ extended: true }));

// Gate everything except onboarding/unlock behind the unlocked-key check.
// Single-tenant app, so this is a simple state check, not real
// session/cookie auth -- see src/state.js for why that's an acceptable v1
// simplification.
app.use((req, res, next) => {
  const openPaths = ['/onboarding', '/unlock'];
  if (openPaths.some((p) => req.path.startsWith(p))) return next();
  if (!store.isOnboarded()) return res.redirect('/onboarding');
  if (!state.isUnlocked()) return res.redirect('/unlock');
  next();
});

app.use(issuerRoutes);
app.use(recordsRoutes);
app.use(cancellationsRoutes);
app.use(holderRequestsRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Something went wrong: ' + err.message);
});

// In-process scheduler: promotes due cancellations and re-stamps an aging
// noticeboard, per issuer, with no extra configuration needed for v1.
// bin/cc-issuer-scheduler.js is the documented OS-level-cron alternative
// for anyone who wants R2's guarantee to survive server restarts.
async function tick() {
  if (!store.isOnboarded() || !state.isUnlocked()) return;
  const profile = store.loadIssuerProfile();
  try {
    const result = await cancellationList.promotePendingCancellations(
      state.getPool(), state.getUnlockedSecretKey(), profile.publicKey, store.DATA_DIR, state.getRelays()
    );
    if (result.attempted) console.log('[scheduler]', new Date().toISOString(), JSON.stringify({ promoted: result.promoted, reStampedOnly: !!result.reStampedOnly, ok: result.publishResult.ok }));
  } catch (e) {
    console.error('[scheduler] tick failed:', e.message);
  }
}

// Opens the user's default browser at `url`. Used so the packaged
// double-click app "just opens the tool" -- no dependency, just the OS's
// own open command. Best-effort: if it fails, the printed URL is the
// fallback.
function openBrowser(url) {
  const { exec } = require('child_process');
  const cmd = process.platform === 'darwin' ? `open "${url}"`
    : process.platform === 'win32' ? `start "" "${url}"`
    : `xdg-open "${url}"`;
  exec(cmd, () => {});
}

if (require.main === module) {
  const url = `http://localhost:${PORT}`;
  app.listen(PORT, '127.0.0.1', () => {
    if (process.pkg) {
      console.log(`\nCommon Credo issuer tool is running.\nYour browser should have opened. If not, go to ${url}\nTo stop it, close this window.\n`);
      openBrowser(url);
    } else {
      console.log(`Common Credo issuer tool listening on ${url}`);
    }
  });
  setInterval(tick, SCHEDULER_INTERVAL_MS);
}

module.exports = { app, tick };
