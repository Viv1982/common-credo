'use strict';

// AGPL-3.0 -- see LICENSE-AGPL-3.0.
//
// Self-hosted, single-operator localhost app -- Amina's tool. Mirrors
// issuer-tool/src/server.js's shape exactly (same reasoning: she won't
// run a CLI, and this isn't a hosted SaaS CC runs on anyone's behalf).

const express = require('express');
const store = require('./store');
const state = require('./state');

const onboardingRoutes = require('./routes/onboarding');
const recordsRoutes = require('./routes/records');
const walletRoutes = require('./routes/wallet');
const bundleRoutes = require('./routes/bundle');
const disputesRoutes = require('./routes/disputes');
const withdrawalsRoutes = require('./routes/withdrawals');

const PORT = process.env.PORT || 4174;

const app = express();
app.use(express.urlencoded({ extended: true }));

// Gate everything except onboarding/unlock behind the unlocked-key check
// -- same simplification as issuer-tool/src/server.js (single-tenant app,
// not real session/cookie auth).
app.use((req, res, next) => {
  const openPaths = ['/onboarding', '/unlock'];
  if (openPaths.some((p) => req.path.startsWith(p))) return next();
  if (!store.isOnboarded()) return res.redirect('/onboarding');
  if (!state.isUnlocked()) return res.redirect('/unlock');
  next();
});

app.use(onboardingRoutes);
app.use(recordsRoutes);
app.use(walletRoutes);
app.use(bundleRoutes);
app.use(disputesRoutes);
app.use(withdrawalsRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Something went wrong: ' + err.message);
});

// Opens the user's default browser at `url` so the packaged double-click
// app "just opens the tool" -- no dependency, just the OS's own open
// command. Best-effort; the printed URL is the fallback.
function openBrowser(url) {
  const { exec } = require('child_process');
  const cmd = process.platform === 'darwin' ? `open "${url}"`
    : process.platform === 'win32' ? `start "" "${url}"`
    : `xdg-open "${url}"`;
  exec(cmd, () => {});
}

// No scheduler needed here, unlike issuer-tool -- disputes and
// withdrawals are one-shot immediate publishes with no freshness
// obligation (see core/lib/holderActions.js).
if (require.main === module) {
  const url = `http://localhost:${PORT}`;
  app.listen(PORT, '127.0.0.1', () => {
    if (process.pkg) {
      console.log(`\nCommon Credo wallet is running.\nYour browser should have opened. If not, go to ${url}\nTo stop it, close this window.\n`);
      openBrowser(url);
    } else {
      console.log(`Common Credo holder tool listening on ${url}`);
    }
  });
}

module.exports = { app };
