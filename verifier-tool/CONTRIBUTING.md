# Contributing to the Common Credo verifier tool

## Licence boundary — read before adding a dependency

This app is **AGPL-3.0** — see `LICENSE-AGPL-3.0`. That covers both
`src/` (the installed Express app) and `standalone/` (the single-file
static page) — the whole app is one licence, deliberately, even though
`standalone/index.html` embeds a duplicate of some `core/` logic (see
below). It's shipped software, not a library meant for others to embed
in their own products — that's what `core/` is for.

`src/` depends on the shared `../core/` package (Apache-2.0, via the
`common-credo-core` `file:../core` dependency in `package.json`). See
`../core/CONTRIBUTING.md` for that package's own licence-boundary rule.
`src/` may freely `require('common-credo-core/lib/...')`. It must never
duplicate that logic locally — if something reusable is missing from
`core/`, add it there.

## The one deliberate exception: `standalone/index.html`

`standalone/` is a single-file, zero-install, zero-build-step page. It
cannot `require()` `core/`'s CommonJS modules, so its `#verify-engine`
script block is a **second, independent implementation** of
`core/lib/verify.js`'s checking logic, in ESM. This is a real duplication,
accepted deliberately (not an oversight) — see `standalone/README.md` for
the full reasoning and `test/sync.test.js` for the automated test that
fails the build if the two implementations' outputs ever diverge.

**If you change checking logic in one, you must change it in the other.**
The sync test will tell you if you forgot — don't work around a failing
`sync.test.js` by loosening its assertions; fix the actual divergence.
