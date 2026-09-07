'use strict';

// Builds the generated parts of site/ from their single sources of truth:
//   1. site/spec.html            <- Common_Credo_Standard_Spec_v0_3.md
//   2. site/verify/vendor/*.js   <- nostr-tools, bundled self-contained (esbuild)
//   3. site/verify/index.html    <- verifier-tool/standalone/index.html, with
//                                    its esm.sh imports rewritten to the vendored file
//   4. site/downloads/common-credo-verifier-standalone.html <- the standalone, verbatim
//
// The point of (2)+(3): the hosted verifier must not depend on a third-party
// CDN at runtime. esm.sh is only used, if at all, by the downloadable
// single-file standalone -- never by the live site. The engine logic is not
// duplicated here; the hosted page is derived from the canonical standalone,
// which verifier-tool/test/sync.test.js keeps honest.

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const ROOT = __dirname;
const SITE = path.join(ROOT, 'site');
const SPEC_MD = path.join(ROOT, 'Common_Credo_Standard_Spec_v0_3.md');
const FOUNDATIONS_MD = path.join(ROOT, 'Common_Credo_Foundations_and_Lineage.md');
const STANDALONE = path.join(ROOT, 'verifier-tool', 'standalone', 'index.html');

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Inline formatting: **bold**, *italic*, `code`, and [text](url).
function inline(s) {
  let out = escapeHtml(s);
  out = out.replace(/`([^`]+)`/g, (_, c) => `<code>${c}</code>`);
  out = out.replace(/\*\*([^*]+)\*\*/g, (_, c) => `<strong>${c}</strong>`);
  out = out.replace(/\*([^*]+)\*/g, (_, c) => `<em>${c}</em>`);
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, u) => `<a href="${u}">${t}</a>`);
  return out;
}

// A small, line-based Markdown -> HTML converter, scoped to the constructs
// the spec actually uses: ATX headings, ---, bullet + numbered lists,
// blockquotes, GFM tables, and paragraphs. Not a general Markdown engine.
function mdToHtml(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let i = 0;
  const para = [];
  const flushPara = () => {
    if (para.length) { out.push(`<p>${inline(para.join(' '))}</p>`); para.length = 0; }
  };

  while (i < lines.length) {
    const line = lines[i];

    if (/^\s*$/.test(line)) { flushPara(); i++; continue; }

    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) { flushPara(); const lvl = h[1].length; out.push(`<h${lvl}>${inline(h[2].trim())}</h${lvl}>`); i++; continue; }

    if (/^---+\s*$/.test(line) || /^\*\*\*+\s*$/.test(line)) { flushPara(); out.push('<hr>'); i++; continue; }

    // GFM table: a header row followed by a |---|---| separator row.
    if (/^\s*\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
      flushPara();
      const cells = (row) => row.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      const header = cells(line);
      out.push('<table>', '<tr>' + header.map((c) => `<th>${inline(c)}</th>`).join('') + '</tr>');
      i += 2;
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) {
        out.push('<tr>' + cells(lines[i]).map((c) => `<td>${inline(c)}</td>`).join('') + '</tr>');
        i++;
      }
      out.push('</table>');
      continue;
    }

    // Blockquote (possibly multi-line).
    if (/^\s*>\s?/.test(line)) {
      flushPara();
      const buf = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) { buf.push(lines[i].replace(/^\s*>\s?/, '')); i++; }
      out.push(`<blockquote>${inline(buf.join(' '))}</blockquote>`);
      continue;
    }

    // Bullet list.
    if (/^\s*[-*]\s+/.test(line)) {
      flushPara();
      out.push('<ul>');
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        out.push(`<li>${inline(lines[i].replace(/^\s*[-*]\s+/, ''))}</li>`); i++;
      }
      out.push('</ul>');
      continue;
    }

    // Numbered list.
    if (/^\s*\d+\.\s+/.test(line)) {
      flushPara();
      out.push('<ol>');
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        out.push(`<li>${inline(lines[i].replace(/^\s*\d+\.\s+/, ''))}</li>`); i++;
      }
      out.push('</ol>');
      continue;
    }

    para.push(line.trim());
    i++;
  }
  flushPara();
  return out.join('\n');
}

// Render a project Markdown document to a flat HTML page under site/,
// using the same bare style.css as every other page.
function buildMarkdownPage(srcMd, outName, title) {
  const body = mdToHtml(fs.readFileSync(srcMd, 'utf8'));
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<link rel="stylesheet" href="style.css">
</head>
<body>
<p><a href="index.html">&larr; Common Credo</a></p>
${body}
<hr>
<p><a href="index.html">Common Credo</a> &middot; this page is generated from
its Markdown source in the project by build-site.js.</p>
</body>
</html>
`;
  fs.writeFileSync(path.join(SITE, outName), html);
  console.log(`wrote site/${outName}`);
}

async function buildVendoredVerifier() {
  const vendorDir = path.join(SITE, 'verify', 'vendor');
  fs.mkdirSync(vendorDir, { recursive: true });

  // Bundle nostr-tools' pure + pool exports into one self-contained browser
  // ESM file. resolveDir points at verifier-tool/, which has nostr-tools
  // installed, so we don't need it installed at the repo root -- only esbuild.
  await esbuild.build({
    stdin: {
      contents: "export { verifyEvent } from 'nostr-tools/pure';\nexport { SimplePool } from 'nostr-tools/pool';\n",
      resolveDir: path.join(ROOT, 'verifier-tool'),
      loader: 'js',
    },
    bundle: true,
    format: 'esm',
    platform: 'browser',
    outfile: path.join(vendorDir, 'nostr-tools.js'),
    legalComments: 'none',
  });
  console.log('wrote site/verify/vendor/nostr-tools.js');

  // Derive the hosted page from the canonical standalone: the two esm.sh
  // import URLs point at the vendored bundle instead, and the comment that
  // explains the CDN choice is replaced so the hosted page's comments stay
  // accurate (it is vendored, not CDN-loaded).
  let html = fs.readFileSync(STANDALONE, 'utf8');
  html = html
    .replace(/\/\/ esm\.sh serves nostr-tools'[\s\S]*?already does -- not a new dependency this adds\./,
      "// nostr-tools is vendored locally by build-site.js (site/verify/vendor/nostr-tools.js),\n"
      + "// bundled self-contained from the same library core/lib/ uses in Node. The hosted\n"
      + "// site has no third-party runtime dependency; it only needs the public relays,\n"
      + "// same as any verification. The downloadable single-file standalone keeps a CDN\n"
      + "// import instead, so it stays one portable file.")
    .replace("import { verifyEvent } from 'https://esm.sh/nostr-tools@2.10.4/pure';", "import { verifyEvent } from './vendor/nostr-tools.js';")
    .replace("import { SimplePool } from 'https://esm.sh/nostr-tools@2.10.4/pool';", "import { SimplePool } from './vendor/nostr-tools.js';");

  if (/from\s+['"][^'"]*esm\.sh[^'"]*['"]/.test(html)) {
    throw new Error('build-site: an esm.sh import survived rewriting -- the standalone import lines may have changed; update build-site.js');
  }
  fs.writeFileSync(path.join(SITE, 'verify', 'index.html'), html);
  console.log('wrote site/verify/index.html (vendored, no CDN)');

  // The downloadable single-file standalone keeps its esm.sh import (its
  // whole value is being one portable file). Copied verbatim.
  fs.mkdirSync(path.join(SITE, 'downloads'), { recursive: true });
  fs.copyFileSync(STANDALONE, path.join(SITE, 'downloads', 'common-credo-verifier-standalone.html'));
  console.log('wrote site/downloads/common-credo-verifier-standalone.html');
}

async function main() {
  buildMarkdownPage(SPEC_MD, 'spec.html', 'Common Credo &mdash; Standard Specification v0.3');
  buildMarkdownPage(FOUNDATIONS_MD, 'foundations.html', 'Common Credo &mdash; Foundations and Lineage');
  await buildVendoredVerifier();
  console.log('site build complete.');
}

main().catch((e) => { console.error(e); process.exit(1); });
