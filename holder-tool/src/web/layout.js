'use strict';

// AGPL-3.0 -- see LICENSE-AGPL-3.0. Plain server-rendered HTML, no
// templating-engine dependency -- same pattern as issuer-tool/src/web/layout.js.

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const STYLE = `
  :root { --ink:#1b1f24; --muted:#5b6470; --paper:#fbfaf7; --card:#fff; --line:#e4e0d8;
    --good:#1e7d4a; --good-bg:#e8f6ee; --bad:#b3261e; --bad-bg:#fbe9e7; --warn:#9a6400; --warn-bg:#fdf3d9;
    --accent:#6b3fa0; }
  * { box-sizing: border-box; }
  body { margin:0; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;
    background:var(--paper); color:var(--ink); line-height:1.5; }
  header { background:linear-gradient(180deg,#3a2354,#6b3fa0); color:#fff; padding:20px 28px; }
  header a { color:#fff; text-decoration:none; font-weight:700; }
  nav { display:flex; gap:18px; margin-top:8px; font-size:14px; flex-wrap:wrap; }
  nav a { color:#e6dcf5; text-decoration:none; }
  nav a:hover { text-decoration:underline; }
  main { max-width:760px; margin:32px auto; padding:0 24px 60px; }
  .card { background:var(--card); border:1px solid var(--line); border-radius:14px; padding:24px 26px; margin-bottom:22px; }
  h1 { font-size:22px; margin:0 0 6px; }
  h2 { font-size:17px; margin:0 0 12px; }
  p { font-size:14.5px; color:#34404d; }
  label { display:block; font-size:13px; font-weight:600; margin:14px 0 4px; color:#333; }
  input, select, textarea { width:100%; padding:8px 10px; border:1px solid var(--line); border-radius:8px; font-size:14px; font-family:inherit; }
  textarea { min-height:70px; }
  button, .btn { background:var(--accent); color:#fff; border:none; padding:10px 18px; border-radius:8px; font-size:14px;
    font-weight:600; cursor:pointer; margin-top:16px; display:inline-block; text-decoration:none; }
  button.secondary, .btn.secondary { background:#fff; color:var(--accent); border:1px solid var(--accent); }
  .badge { display:inline-block; font-size:12px; font-weight:700; padding:3px 10px; border-radius:999px; }
  .badge.good { background:var(--good-bg); color:var(--good); }
  .badge.bad { background:var(--bad-bg); color:var(--bad); }
  .badge.warn { background:var(--warn-bg); color:var(--warn); }
  .mono { font-family:"SF Mono",Menlo,Consolas,monospace; font-size:12.5px; word-break:break-all; background:#f5f5f2; padding:2px 6px; border-radius:4px; }
  table { width:100%; border-collapse:collapse; font-size:13.5px; }
  td, th { padding:8px 6px; border-bottom:1px solid var(--line); text-align:left; }
  .flash { padding:12px 16px; border-radius:10px; margin-bottom:18px; font-size:14px; }
  .flash.error { background:var(--bad-bg); color:var(--bad); }
  .flash.success { background:var(--good-bg); color:var(--good); }
  .warning-box { background:var(--warn-bg); border:1px solid #e8c368; border-radius:10px; padding:14px 16px; font-size:13.5px; color:#5c4310; margin:14px 0; }
  .checkbox-row { display:flex; align-items:flex-start; gap:8px; margin:10px 0; }
  .checkbox-row input { width:auto; margin-top:3px; }
`;

function page({ title, body, nav }) {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)} -- Common Credo Wallet</title>
<style>${STYLE}</style></head>
<body>
<header>
  <a href="/">Common Credo -- My Wallet</a>
  ${nav !== false ? `<nav>
    <a href="/wallet">My Records</a>
    <a href="/records/import">Import a Record</a>
    <a href="/bundle">Show a Bundle</a>
  </nav>` : ''}
</header>
<main>${body}</main>
</body></html>`;
}

function flash(query) {
  if (query.error) return `<div class="flash error">${escapeHtml(query.error)}</div>`;
  if (query.success) return `<div class="flash success">${escapeHtml(query.success)}</div>`;
  return '';
}

module.exports = { page, escapeHtml, flash };
