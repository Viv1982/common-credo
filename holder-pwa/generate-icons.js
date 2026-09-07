'use strict';

// Generates the wallet's app icons as real PNGs, with no image-library
// dependency: a tiny PNG encoder (zlib for IDAT, a CRC32 table for the
// chunks) plus a per-pixel draw of a checkmark on the app's dark background.
// The checkmark sits well inside the maskable safe zone (the inner ~64%), so
// the single 512 icon serves as both "any" and "maskable". Run once to
// (re)generate src/icons/*.png; build.js copies them into site/wallet/.

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const BG = [27, 31, 36];      // #1b1f24, matches the app header
const FG = [244, 244, 242];   // #f4f4f2, the light "paper" tone

// --- CRC32 (PNG chunk checksums) ------------------------------------------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

// --- Geometry: distance from a point to a segment -------------------------
function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx, cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

// Checkmark in normalized [0,1] coordinates, two segments A->B->C.
const A = [0.30, 0.53], B = [0.44, 0.67], C = [0.72, 0.35];
const STROKE = 0.085; // half-thickness in normalized units

function drawIcon(size) {
  // Raw image: for each row a filter byte (0) then RGBA pixels.
  const raw = Buffer.alloc(size * (1 + size * 4));
  for (let y = 0; y < size; y++) {
    const rowStart = y * (1 + size * 4);
    raw[rowStart] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const nx = (x + 0.5) / size, ny = (y + 0.5) / size;
      const d = Math.min(
        distToSegment(nx, ny, A[0], A[1], B[0], B[1]),
        distToSegment(nx, ny, B[0], B[1], C[0], C[1])
      );
      // Anti-alias the edge over ~1 pixel width.
      const aa = 0.75 / size;
      const cov = Math.max(0, Math.min(1, (STROKE - d) / aa + 0.5));
      const r = Math.round(BG[0] + (FG[0] - BG[0]) * cov);
      const g = Math.round(BG[1] + (FG[1] - BG[1]) * cov);
      const b = Math.round(BG[2] + (FG[2] - BG[2]) * cov);
      const o = rowStart + 1 + x * 4;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = 255;
    }
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // colour type: RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

function main() {
  const outDir = path.join(__dirname, 'src', 'icons');
  fs.mkdirSync(outDir, { recursive: true });
  const targets = [
    ['icon-192.png', 192],
    ['icon-512.png', 512],
    ['apple-touch-icon-180.png', 180],
  ];
  for (const [name, size] of targets) {
    fs.writeFileSync(path.join(outDir, name), drawIcon(size));
    console.log(`wrote src/icons/${name} (${size}x${size})`);
  }
}

main();
