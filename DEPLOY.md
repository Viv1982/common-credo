# Putting Common Credo online

This is the step-by-step for taking the `site/` folder live. Everything in
`site/` is static files, so hosting is free and takes a few minutes. There
are two stages: get it live now on a free address, and (later, optional)
put it on a `commoncredo.org` domain.

A few of these steps involve creating an account or paying for a domain.
Those are yours to do — I can't create accounts or enter payment. The
`site/` folder is ready to deploy exactly as it is.

## Before you deploy: build the site once

The `site/` folder has several generated parts (the spec and foundations
pages, the hosted verifier's bundled library, the phone wallet, and the
downloadable desktop apps). Regenerate them whenever their sources change:

```
npm install                      # once, at repo root (installs the build tools)
npm run build:site               # writes site/spec.html, site/foundations.html, site/verify/vendor/
( cd holder-pwa && npm install ) # once, links the shared core into the wallet
npm run build:wallet             # writes the phone wallet into site/wallet/
npm run build:packages           # writes the downloadable desktop apps into site/downloads/
```

After that, `site/` is a complete, self-contained folder. Nothing in it
calls out to anyone else's server at runtime (the wallet and verifier talk
only to the public Nostr relays, same as any use of Common Credo).

**When you re-deploy a changed wallet:** bump `CACHE_VERSION` in
`holder-pwa/src/sw.js` (e.g. `cc-wallet-v1` &rarr; `cc-wallet-v2`) before
`npm run build:wallet`. The wallet's service worker caches its files for
offline use; bumping the version is what makes already-installed phones pick
up the new build on their next launch instead of serving the old one.

## Stage 1 — live now, free, on a temporary address

Use Cloudflare Pages (recommended) or Netlify. Both are free and both work
by you dragging the `site/` folder onto a web page. Cloudflare steps:

1. Go to <https://dash.cloudflare.com> and create a free account.
2. In the left menu choose **Workers & Pages**, then **Create** →
   **Pages** → **Upload assets**.
3. Give the project a name (e.g. `common-credo`).
4. Drag your whole `site/` folder onto the upload area. Wait for it to
   finish, then click **Deploy site**.
5. Cloudflare gives you a live address like
   `https://common-credo.pages.dev`. Open it — the site is live.

To update the site later, come back to the same project and choose
**Create new deployment**, then drag the updated `site/` folder again.

(Netlify is equally simple: sign up at <https://app.netlify.com>, choose
**Add new site** → **Deploy manually**, drag the `site/` folder, done. It
gives you a `*.netlify.app` address.)

## Stage 2 — a real domain, when you want one

A domain costs about US$10–12 a year. This is the one part that costs
money, and only you can do it.

1. **Register the name.** Recommended registrar: **Cloudflare Registrar**
   (<https://dash.cloudflare.com> → **Domain Registration** → **Register
   Domains**), because it sells domains at cost with no markup. Search for
   `commoncredo.org` (the `.org` ending suits a nonprofit public good), or
   another name if that one is taken. Pay for it. Alternatives with the
   same idea: Porkbun, Namecheap.
2. **Point it at your Pages site.** If you registered through Cloudflare
   and your site is on Cloudflare Pages, this is nearly automatic: open the
   Pages project → **Custom domains** → **Set up a custom domain** → type
   `commoncredo.org` → follow the prompts. Cloudflare wires up the DNS and
   the HTTPS certificate for you.
   If your registrar and host are different, the host (Cloudflare Pages /
   Netlify) will show you one or two DNS records to add at your registrar;
   copy them across. HTTPS is set up automatically once DNS resolves
   (usually within an hour).

That's all. The same `site/` folder now answers at `commoncredo.org`.

## The phone wallet (hosted, not a download)

`npm run build:wallet` produces `site/wallet/` &mdash; the holder's wallet as
an installable web app (a PWA). It is **not** a download: holders open
`https://<your-site>/wallet/` on their phone and add it to the home screen
(Android shows an install prompt; on iOS it's Share &rarr; Add to Home
Screen). Installability and offline opening rely on the HTTPS your host
already provides, so nothing extra is needed. The desktop wallet zips below
remain available as a secondary option, and share the same encrypted key
file format, so a holder can move between phone and computer.

## What is in the downloads

`npm run build:packages` produces, in `site/downloads/`:

- `common-credo-issuer-tool-mac.zip`, `-windows.zip`, `-linux.zip`
- `common-credo-wallet-mac.zip`, `-windows.zip`, `-linux.zip`
- `common-credo-verifier-standalone.html` (the single-file offline verifier)

Each app zip contains one double-click program (the Node runtime is bundled
in, so there is nothing to install) and a plain README.

**Signing status, stated honestly.** These programs are not code-signed, so
the first time someone runs one their operating system shows a one-time
"unidentified developer" warning. The READMEs explain how to click through
it. Removing that warning needs paid developer accounts (Apple ~US$99/year;
a Windows signing certificate) and is a later hardening step, not part of
this first release.

**Tested-platform status, stated honestly.** The macOS package was built and
run end-to-end on the build machine. The Windows and Linux packages are
cross-compiled from the same machine and have not been run there. Before
handing them to anyone who depends on them, run each once on a real machine
of that operating system to confirm it opens and works. They are built from
the identical, tested code; this is a caution about the packaging, not the
program.

**Holder wallet, stated honestly.** The wallet now runs on a phone (the PWA
at `site/wallet/`) as well as on a computer. It has been built and verified
in a browser, but not yet run across the full range of real phones &mdash;
in particular, confirm on a real Android device and a real iPhone that it
installs to the home screen, opens offline, and keeps its stored key across
days of not being opened (iOS is the one to watch for storage eviction). The
exported key file is the backstop if a phone ever clears the wallet's data.
