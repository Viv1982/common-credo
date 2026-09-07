'use strict';

const fs = require('fs');
const path = require('path');

// This demo runs on a very old Node (v9.7.1) that predates
// fs.mkdirSync's { recursive: true } option (added in Node 10.12). This is
// a runtime-compatibility shim, not part of the Common Credo design.
function mkdirpSync(dir) {
  const parent = path.dirname(dir);
  if (parent !== dir && !fs.existsSync(parent)) mkdirpSync(parent);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
}

module.exports = { mkdirpSync };
