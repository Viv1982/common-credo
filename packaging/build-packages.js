'use strict';

// Packages the issuer and holder tools into double-click executables, one
// per OS, and zips each (with a plain README) into site/downloads/.
//
// Pipeline, per tool:
//   1. esbuild bundles src/server.js + all its dependencies (express,
//      multer, nostr-tools, and the file:-linked common-credo-core) into a
//      single self-contained .cjs. This sidesteps pkg's module-tracing
//      quirks with the symlinked monorepo package -- pkg then only has to
//      embed one already-complete file.
//   2. @yao-pkg/pkg embeds the Node 22 runtime + that bundle into a native
//      executable per target. Node 22 specifically, not 18/20: nostr-tools'
//      SimplePool uses the global WebSocket, which only exists in Node 21+.
//   3. zip the executable with a README.txt into site/downloads/.
//
// Unsigned for v1 -- the README explains the one-time OS "unidentified
// developer" warning. macOS is the only target functionally tested on the
// build machine; Windows/Linux are cross-compiled by pkg and validated by
// running, on a real machine of that OS, before wide distribution.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const esbuild = require('esbuild');

const ROOT = path.join(__dirname, '..');
const BUILD = path.join(__dirname, 'build');
const DOWNLOADS = path.join(ROOT, 'site', 'downloads');

const TARGETS = [
  { os: 'mac', pkgTarget: 'node22-macos-x64', exeSuffix: '' },
  { os: 'windows', pkgTarget: 'node22-win-x64', exeSuffix: '.exe' },
  { os: 'linux', pkgTarget: 'node22-linux-x64', exeSuffix: '' },
];

const TOOLS = [
  { dir: 'issuer-tool', exeBase: 'common-credo-issuer-tool', downloadBase: 'common-credo-issuer-tool', port: 4173, dataDirName: 'common-credo-issuer-data', label: 'Common Credo issuer tool' },
  { dir: 'holder-tool', exeBase: 'common-credo-wallet', downloadBase: 'common-credo-wallet', port: 4174, dataDirName: 'common-credo-wallet-data', label: 'Common Credo wallet' },
];

function readme(tool, target) {
  const runLine = target.os === 'windows'
    ? `Double-click "${tool.exeBase}${target.exeSuffix}".`
    : target.os === 'mac'
      ? `Double-click "${tool.exeBase}". The first time, macOS will refuse because the program is not signed. Right-click it instead, choose "Open", then "Open" again in the dialog. You only do this once.`
      : `Run "${tool.exeBase}" (you may need to mark it executable first: chmod +x ${tool.exeBase}).`;
  const winWarn = target.os === 'windows'
    ? `\nThe first time you run it, Windows may show a blue "Windows protected your PC" box, because the program is not signed. Click "More info", then "Run anyway". You only do this once.\n`
    : '';
  return `${tool.label}
${'='.repeat(tool.label.length)}

${runLine}
${winWarn}
A small window opens and your web browser opens the tool automatically.
If the browser does not open on its own, go to:  http://localhost:${tool.port}

Your data (your key and records) is saved in a folder named
"${tool.dataDirName}" next to this program. Keep that folder. Back up your
key when the tool shows it to you -- there is no way to recover a lost key.

To stop the tool, close its window.

This is free, open-source software (AGPL-3.0). Source and the standard:
https://commoncredo.org  (or wherever this was published).
`;
}

function bundle(tool) {
  fs.mkdirSync(BUILD, { recursive: true });
  const outfile = path.join(BUILD, `${tool.dir}-app.cjs`);
  esbuild.buildSync({
    entryPoints: [path.join(ROOT, tool.dir, 'src', 'server.js')],
    bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    outfile,
    logLevel: 'warning',
  });
  return outfile;
}

function pkgTarget(bundleFile, tool, target) {
  const outExe = path.join(BUILD, `${tool.exeBase}-${target.os}${target.exeSuffix}`);
  execFileSync('npx', ['pkg', bundleFile, '--targets', target.pkgTarget, '--output', outExe], { stdio: 'inherit' });
  return outExe;
}

function zipUp(tool, target, exePath) {
  fs.mkdirSync(DOWNLOADS, { recursive: true });
  // Assemble a staging dir with the executable renamed to its friendly
  // name plus README.txt, then zip that.
  const stage = path.join(BUILD, `stage-${tool.downloadBase}-${target.os}`);
  fs.rmSync(stage, { recursive: true, force: true });
  fs.mkdirSync(stage, { recursive: true });
  const friendlyExe = path.join(stage, `${tool.exeBase}${target.exeSuffix}`);
  fs.copyFileSync(exePath, friendlyExe);
  if (target.os !== 'windows') fs.chmodSync(friendlyExe, 0o755);
  fs.writeFileSync(path.join(stage, 'README.txt'), readme(tool, target));

  const zipPath = path.join(DOWNLOADS, `${tool.downloadBase}-${target.os}.zip`);
  fs.rmSync(zipPath, { force: true });
  // Use the system `zip` (present on macOS/Linux). -j junks paths so the
  // zip has the exe + README at its root.
  execFileSync('zip', ['-j', zipPath, friendlyExe, path.join(stage, 'README.txt')], { stdio: 'inherit' });
  return zipPath;
}

function main() {
  const onlyOs = process.argv[2]; // optional: build a single OS, e.g. "mac"
  for (const tool of TOOLS) {
    console.log(`\n=== ${tool.label} ===`);
    const bundleFile = bundle(tool);
    for (const target of TARGETS) {
      if (onlyOs && target.os !== onlyOs) continue;
      console.log(`-- ${target.os}`);
      const exe = pkgTarget(bundleFile, tool, target);
      const zip = zipUp(tool, target, exe);
      console.log(`   -> ${path.relative(ROOT, zip)}`);
    }
  }
  console.log('\npackaging complete.');
}

main();
