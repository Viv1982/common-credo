# Why this folder duplicates checking logic — and how that's kept honest

`standalone/index.html` is a single file. Double-click it, or open it with
`file://` — no `npm install`, no server, no build step. That's the whole
point of it: a verifier who only ever checks one bundle shouldn't need to
install anything.

That zero-build-step promise is exactly what forces the duplication: this
file can't `require('common-credo-core/lib/verify')` the way
`verifier-tool/src/` does, because that's CommonJS Node code, and this
page has no bundler turning it into something a browser can load. So
`index.html` contains its own copy of the checking logic — the part that
decides `valid` / `cancelled` / `withdrawn_by_holder` / `unverifiable` /
`not_genuine` — inside a clearly delimited region:

```html
<script type="module">
  ...
  // === VERIFY-ENGINE START ===
  ...the duplicated logic...
  // === VERIFY-ENGINE END ===
  ...UI glue (file reading, rendering) — not duplicated, not tested for sync...
</script>
```

**What is *not* duplicated:** the actual cryptography. `nostr-tools` ships
real ESM builds (confirmed via its own `package.json` `exports` map), so
this page imports the *same* library `core/lib/` uses in Node — just from
a CDN (`esm.sh`) instead of `node_modules`. Only the interpretation logic
around it — reading a cancellation list, a dispute, a withdrawal, and
deciding what status that adds up to — is a second, independent copy.

## The safeguard: `../test/sync.test.js`

That test reads this file as plain text, extracts everything between the
`VERIFY-ENGINE START` / `VERIFY-ENGINE END` markers, writes it to a
temporary `.mjs` file, and `import()`s it directly in Node — no headless
browser needed, because the engine region deliberately has no `document`,
`window`, `fetch`, or other browser-only reference in it; everything it
needs (a `pool` object, `verifyEvent`) is either imported at the top of
the script (also inside the extraction) or passed in as a parameter.

It then builds around seven real, signed fixture scenarios with
`common-credo-core` (a fresh valid record; cancelled with no dispute;
cancelled and disputed; withdrawn and never cancelled; a tampered/
not-genuine record; a dead issuer with no published list; a valid record
checked with no holder pubkey at all) against a shared in-memory
`FakePool`, runs **both** `core/lib/verify.js`'s `verifyRecord` and this
file's extracted engine against the identical fixtures and identical pool
state, and asserts the two results match on every field the UI actually
displays.

**If you change checking logic here, `npm test` will fail until you make
the equivalent change in `core/lib/verify.js` (or `cancellationList.js` /
`holderActions.js`), and vice versa.** That's deliberate — the test is the
thing keeping this duplication safe, not a comment asking someone to
remember. Do not "fix" a failing `sync.test.js` by loosening its
assertions; the failure means the two copies actually disagree, which is
exactly the bug the test exists to catch.

## If you're adding a new status or a new kind

Update `core/lib/` first (that's the single source of truth for what the
*correct* behaviour is), then port the equivalent change into this file's
`VERIFY-ENGINE` region, then run `npm test` from `verifier-tool/` and
confirm `sync.test.js` passes before considering the change done.
