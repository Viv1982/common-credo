'use strict';

// AGPL-3.0 -- see LICENSE-AGPL-3.0.
//
// Self-hosted, stateless localhost app -- the simplest of the three
// White-Label apps. No identity, no onboarding, no unlock, no scheduler:
// every request is a one-shot upload-and-check.

const express = require('express');
const checkRoutes = require('./routes/check');

const PORT = process.env.PORT || 4175;

const app = express();
app.use(checkRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Something went wrong: ' + err.message);
});

if (require.main === module) {
  app.listen(PORT, '127.0.0.1', () => {
    console.log(`Common Credo verifier tool listening on http://127.0.0.1:${PORT}`);
  });
}

module.exports = { app };
