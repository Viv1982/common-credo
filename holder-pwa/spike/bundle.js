var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod2) => function __require() {
  return mod2 || (0, cb[__getOwnPropNames(cb)[0]])((mod2 = { exports: {} }).exports, mod2), mod2.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod2, isNodeMode, target) => (target = mod2 != null ? __create(__getProtoOf(mod2)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod2 || !mod2.__esModule ? __defProp(target, "default", { value: mod2, enumerable: true }) : target,
  mod2
));
var __toCommonJS = (mod2) => __copyProps(__defProp({}, "__esModule", { value: true }), mod2);

// core/node_modules/@noble/hashes/utils.js
var utils_exports = {};
__export(utils_exports, {
  abytes: () => abytes,
  aexists: () => aexists,
  ahash: () => ahash,
  anumber: () => anumber,
  aoutput: () => aoutput,
  asyncLoop: () => asyncLoop,
  byteSwap: () => byteSwap,
  byteSwap32: () => byteSwap32,
  bytesToHex: () => bytesToHex,
  checkOpts: () => checkOpts,
  clean: () => clean,
  concatBytes: () => concatBytes,
  createHasher: () => createHasher,
  createView: () => createView,
  hexToBytes: () => hexToBytes,
  isBytes: () => isBytes,
  isLE: () => isLE,
  kdfInputToBytes: () => kdfInputToBytes,
  nextTick: () => nextTick,
  oidNist: () => oidNist,
  randomBytes: () => randomBytes,
  rotl: () => rotl,
  rotr: () => rotr,
  swap32IfBE: () => swap32IfBE,
  swap8IfBE: () => swap8IfBE,
  u32: () => u32,
  u8: () => u8,
  utf8ToBytes: () => utf8ToBytes
});
function isBytes(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
}
function anumber(n, title = "") {
  if (!Number.isSafeInteger(n) || n < 0) {
    const prefix = title && `"${title}" `;
    throw new Error(`${prefix}expected integer >= 0, got ${n}`);
  }
}
function abytes(value, length, title = "") {
  const bytes = isBytes(value);
  const len = value?.length;
  const needsLen = length !== void 0;
  if (!bytes || needsLen && len !== length) {
    const prefix = title && `"${title}" `;
    const ofLen = needsLen ? ` of length ${length}` : "";
    const got = bytes ? `length=${len}` : `type=${typeof value}`;
    throw new Error(prefix + "expected Uint8Array" + ofLen + ", got " + got);
  }
  return value;
}
function ahash(h) {
  if (typeof h !== "function" || typeof h.create !== "function")
    throw new Error("Hash must wrapped by utils.createHasher");
  anumber(h.outputLen);
  anumber(h.blockLen);
}
function aexists(instance, checkFinished = true) {
  if (instance.destroyed)
    throw new Error("Hash instance has been destroyed");
  if (checkFinished && instance.finished)
    throw new Error("Hash#digest() has already been called");
}
function aoutput(out, instance) {
  abytes(out, void 0, "digestInto() output");
  const min = instance.outputLen;
  if (out.length < min) {
    throw new Error('"digestInto() output" expected to be of length >=' + min);
  }
}
function u8(arr) {
  return new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
}
function u32(arr) {
  return new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
}
function clean(...arrays) {
  for (let i2 = 0; i2 < arrays.length; i2++) {
    arrays[i2].fill(0);
  }
}
function createView(arr) {
  return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
}
function rotr(word, shift) {
  return word << 32 - shift | word >>> shift;
}
function rotl(word, shift) {
  return word << shift | word >>> 32 - shift >>> 0;
}
function byteSwap(word) {
  return word << 24 & 4278190080 | word << 8 & 16711680 | word >>> 8 & 65280 | word >>> 24 & 255;
}
function byteSwap32(arr) {
  for (let i2 = 0; i2 < arr.length; i2++) {
    arr[i2] = byteSwap(arr[i2]);
  }
  return arr;
}
function bytesToHex(bytes) {
  abytes(bytes);
  if (hasHexBuiltin)
    return bytes.toHex();
  let hex = "";
  for (let i2 = 0; i2 < bytes.length; i2++) {
    hex += hexes[bytes[i2]];
  }
  return hex;
}
function asciiToBase16(ch) {
  if (ch >= asciis._0 && ch <= asciis._9)
    return ch - asciis._0;
  if (ch >= asciis.A && ch <= asciis.F)
    return ch - (asciis.A - 10);
  if (ch >= asciis.a && ch <= asciis.f)
    return ch - (asciis.a - 10);
  return;
}
function hexToBytes(hex) {
  if (typeof hex !== "string")
    throw new Error("hex string expected, got " + typeof hex);
  if (hasHexBuiltin)
    return Uint8Array.fromHex(hex);
  const hl = hex.length;
  const al = hl / 2;
  if (hl % 2)
    throw new Error("hex string expected, got unpadded hex of length " + hl);
  const array = new Uint8Array(al);
  for (let ai = 0, hi = 0; ai < al; ai++, hi += 2) {
    const n1 = asciiToBase16(hex.charCodeAt(hi));
    const n2 = asciiToBase16(hex.charCodeAt(hi + 1));
    if (n1 === void 0 || n2 === void 0) {
      const char = hex[hi] + hex[hi + 1];
      throw new Error('hex string expected, got non-hex character "' + char + '" at index ' + hi);
    }
    array[ai] = n1 * 16 + n2;
  }
  return array;
}
async function asyncLoop(iters, tick, cb) {
  let ts = Date.now();
  for (let i2 = 0; i2 < iters; i2++) {
    cb(i2);
    const diff = Date.now() - ts;
    if (diff >= 0 && diff < tick)
      continue;
    await nextTick();
    ts += diff;
  }
}
function utf8ToBytes(str) {
  if (typeof str !== "string")
    throw new Error("string expected");
  return new Uint8Array(new TextEncoder().encode(str));
}
function kdfInputToBytes(data, errorTitle = "") {
  if (typeof data === "string")
    return utf8ToBytes(data);
  return abytes(data, void 0, errorTitle);
}
function concatBytes(...arrays) {
  let sum = 0;
  for (let i2 = 0; i2 < arrays.length; i2++) {
    const a = arrays[i2];
    abytes(a);
    sum += a.length;
  }
  const res = new Uint8Array(sum);
  for (let i2 = 0, pad = 0; i2 < arrays.length; i2++) {
    const a = arrays[i2];
    res.set(a, pad);
    pad += a.length;
  }
  return res;
}
function checkOpts(defaults, opts) {
  if (opts !== void 0 && {}.toString.call(opts) !== "[object Object]")
    throw new Error("options must be object or undefined");
  const merged = Object.assign(defaults, opts);
  return merged;
}
function createHasher(hashCons, info = {}) {
  const hashC = (msg, opts) => hashCons(opts).update(msg).digest();
  const tmp = hashCons(void 0);
  hashC.outputLen = tmp.outputLen;
  hashC.blockLen = tmp.blockLen;
  hashC.create = (opts) => hashCons(opts);
  Object.assign(hashC, info);
  return Object.freeze(hashC);
}
function randomBytes(bytesLength = 32) {
  const cr = typeof globalThis === "object" ? globalThis.crypto : null;
  if (typeof cr?.getRandomValues !== "function")
    throw new Error("crypto.getRandomValues must be defined");
  return cr.getRandomValues(new Uint8Array(bytesLength));
}
var isLE, swap8IfBE, swap32IfBE, hasHexBuiltin, hexes, asciis, nextTick, oidNist;
var init_utils = __esm({
  "core/node_modules/@noble/hashes/utils.js"() {
    isLE = /* @__PURE__ */ (() => new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68)();
    swap8IfBE = isLE ? (n) => n : (n) => byteSwap(n);
    swap32IfBE = isLE ? (u) => u : byteSwap32;
    hasHexBuiltin = /* @__PURE__ */ (() => (
      // @ts-ignore
      typeof Uint8Array.from([]).toHex === "function" && typeof Uint8Array.fromHex === "function"
    ))();
    hexes = /* @__PURE__ */ Array.from({ length: 256 }, (_, i2) => i2.toString(16).padStart(2, "0"));
    asciis = { _0: 48, _9: 57, A: 65, F: 70, a: 97, f: 102 };
    nextTick = async () => {
    };
    oidNist = (suffix) => ({
      oid: Uint8Array.from([6, 9, 96, 134, 72, 1, 101, 3, 4, 2, suffix])
    });
  }
});

// core/node_modules/@noble/hashes/_md.js
function Chi(a, b, c) {
  return a & b ^ ~a & c;
}
function Maj(a, b, c) {
  return a & b ^ a & c ^ b & c;
}
var HashMD, SHA256_IV, SHA224_IV, SHA384_IV, SHA512_IV;
var init_md = __esm({
  "core/node_modules/@noble/hashes/_md.js"() {
    init_utils();
    HashMD = class {
      blockLen;
      outputLen;
      padOffset;
      isLE;
      // For partial updates less than block size
      buffer;
      view;
      finished = false;
      length = 0;
      pos = 0;
      destroyed = false;
      constructor(blockLen, outputLen, padOffset, isLE2) {
        this.blockLen = blockLen;
        this.outputLen = outputLen;
        this.padOffset = padOffset;
        this.isLE = isLE2;
        this.buffer = new Uint8Array(blockLen);
        this.view = createView(this.buffer);
      }
      update(data) {
        aexists(this);
        abytes(data);
        const { view, buffer, blockLen } = this;
        const len = data.length;
        for (let pos = 0; pos < len; ) {
          const take = Math.min(blockLen - this.pos, len - pos);
          if (take === blockLen) {
            const dataView = createView(data);
            for (; blockLen <= len - pos; pos += blockLen)
              this.process(dataView, pos);
            continue;
          }
          buffer.set(data.subarray(pos, pos + take), this.pos);
          this.pos += take;
          pos += take;
          if (this.pos === blockLen) {
            this.process(view, 0);
            this.pos = 0;
          }
        }
        this.length += data.length;
        this.roundClean();
        return this;
      }
      digestInto(out) {
        aexists(this);
        aoutput(out, this);
        this.finished = true;
        const { buffer, view, blockLen, isLE: isLE2 } = this;
        let { pos } = this;
        buffer[pos++] = 128;
        clean(this.buffer.subarray(pos));
        if (this.padOffset > blockLen - pos) {
          this.process(view, 0);
          pos = 0;
        }
        for (let i2 = pos; i2 < blockLen; i2++)
          buffer[i2] = 0;
        view.setBigUint64(blockLen - 8, BigInt(this.length * 8), isLE2);
        this.process(view, 0);
        const oview = createView(out);
        const len = this.outputLen;
        if (len % 4)
          throw new Error("_sha2: outputLen must be aligned to 32bit");
        const outLen = len / 4;
        const state = this.get();
        if (outLen > state.length)
          throw new Error("_sha2: outputLen bigger than state");
        for (let i2 = 0; i2 < outLen; i2++)
          oview.setUint32(4 * i2, state[i2], isLE2);
      }
      digest() {
        const { buffer, outputLen } = this;
        this.digestInto(buffer);
        const res = buffer.slice(0, outputLen);
        this.destroy();
        return res;
      }
      _cloneInto(to) {
        to ||= new this.constructor();
        to.set(...this.get());
        const { blockLen, buffer, length, finished, destroyed, pos } = this;
        to.destroyed = destroyed;
        to.finished = finished;
        to.length = length;
        to.pos = pos;
        if (length % blockLen)
          to.buffer.set(buffer);
        return to;
      }
      clone() {
        return this._cloneInto();
      }
    };
    SHA256_IV = /* @__PURE__ */ Uint32Array.from([
      1779033703,
      3144134277,
      1013904242,
      2773480762,
      1359893119,
      2600822924,
      528734635,
      1541459225
    ]);
    SHA224_IV = /* @__PURE__ */ Uint32Array.from([
      3238371032,
      914150663,
      812702999,
      4144912697,
      4290775857,
      1750603025,
      1694076839,
      3204075428
    ]);
    SHA384_IV = /* @__PURE__ */ Uint32Array.from([
      3418070365,
      3238371032,
      1654270250,
      914150663,
      2438529370,
      812702999,
      355462360,
      4144912697,
      1731405415,
      4290775857,
      2394180231,
      1750603025,
      3675008525,
      1694076839,
      1203062813,
      3204075428
    ]);
    SHA512_IV = /* @__PURE__ */ Uint32Array.from([
      1779033703,
      4089235720,
      3144134277,
      2227873595,
      1013904242,
      4271175723,
      2773480762,
      1595750129,
      1359893119,
      2917565137,
      2600822924,
      725511199,
      528734635,
      4215389547,
      1541459225,
      327033209
    ]);
  }
});

// core/node_modules/@noble/hashes/_u64.js
function fromBig(n, le = false) {
  if (le)
    return { h: Number(n & U32_MASK64), l: Number(n >> _32n & U32_MASK64) };
  return { h: Number(n >> _32n & U32_MASK64) | 0, l: Number(n & U32_MASK64) | 0 };
}
function split(lst, le = false) {
  const len = lst.length;
  let Ah = new Uint32Array(len);
  let Al = new Uint32Array(len);
  for (let i2 = 0; i2 < len; i2++) {
    const { h, l } = fromBig(lst[i2], le);
    [Ah[i2], Al[i2]] = [h, l];
  }
  return [Ah, Al];
}
function add(Ah, Al, Bh, Bl) {
  const l = (Al >>> 0) + (Bl >>> 0);
  return { h: Ah + Bh + (l / 2 ** 32 | 0) | 0, l: l | 0 };
}
var U32_MASK64, _32n, shrSH, shrSL, rotrSH, rotrSL, rotrBH, rotrBL, add3L, add3H, add4L, add4H, add5L, add5H;
var init_u64 = __esm({
  "core/node_modules/@noble/hashes/_u64.js"() {
    U32_MASK64 = /* @__PURE__ */ BigInt(2 ** 32 - 1);
    _32n = /* @__PURE__ */ BigInt(32);
    shrSH = (h, _l, s) => h >>> s;
    shrSL = (h, l, s) => h << 32 - s | l >>> s;
    rotrSH = (h, l, s) => h >>> s | l << 32 - s;
    rotrSL = (h, l, s) => h << 32 - s | l >>> s;
    rotrBH = (h, l, s) => h << 64 - s | l >>> s - 32;
    rotrBL = (h, l, s) => h >>> s - 32 | l << 64 - s;
    add3L = (Al, Bl, Cl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0);
    add3H = (low, Ah, Bh, Ch) => Ah + Bh + Ch + (low / 2 ** 32 | 0) | 0;
    add4L = (Al, Bl, Cl, Dl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0);
    add4H = (low, Ah, Bh, Ch, Dh) => Ah + Bh + Ch + Dh + (low / 2 ** 32 | 0) | 0;
    add5L = (Al, Bl, Cl, Dl, El) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0) + (El >>> 0);
    add5H = (low, Ah, Bh, Ch, Dh, Eh) => Ah + Bh + Ch + Dh + Eh + (low / 2 ** 32 | 0) | 0;
  }
});

// core/node_modules/@noble/hashes/sha2.js
var sha2_exports = {};
__export(sha2_exports, {
  _SHA224: () => _SHA224,
  _SHA256: () => _SHA256,
  _SHA384: () => _SHA384,
  _SHA512: () => _SHA512,
  _SHA512_224: () => _SHA512_224,
  _SHA512_256: () => _SHA512_256,
  sha224: () => sha224,
  sha256: () => sha256,
  sha384: () => sha384,
  sha512: () => sha512,
  sha512_224: () => sha512_224,
  sha512_256: () => sha512_256
});
var SHA256_K, SHA256_W, SHA2_32B, _SHA256, _SHA224, K512, SHA512_Kh, SHA512_Kl, SHA512_W_H, SHA512_W_L, SHA2_64B, _SHA512, _SHA384, T224_IV, T256_IV, _SHA512_224, _SHA512_256, sha256, sha224, sha512, sha384, sha512_256, sha512_224;
var init_sha2 = __esm({
  "core/node_modules/@noble/hashes/sha2.js"() {
    init_md();
    init_u64();
    init_utils();
    SHA256_K = /* @__PURE__ */ Uint32Array.from([
      1116352408,
      1899447441,
      3049323471,
      3921009573,
      961987163,
      1508970993,
      2453635748,
      2870763221,
      3624381080,
      310598401,
      607225278,
      1426881987,
      1925078388,
      2162078206,
      2614888103,
      3248222580,
      3835390401,
      4022224774,
      264347078,
      604807628,
      770255983,
      1249150122,
      1555081692,
      1996064986,
      2554220882,
      2821834349,
      2952996808,
      3210313671,
      3336571891,
      3584528711,
      113926993,
      338241895,
      666307205,
      773529912,
      1294757372,
      1396182291,
      1695183700,
      1986661051,
      2177026350,
      2456956037,
      2730485921,
      2820302411,
      3259730800,
      3345764771,
      3516065817,
      3600352804,
      4094571909,
      275423344,
      430227734,
      506948616,
      659060556,
      883997877,
      958139571,
      1322822218,
      1537002063,
      1747873779,
      1955562222,
      2024104815,
      2227730452,
      2361852424,
      2428436474,
      2756734187,
      3204031479,
      3329325298
    ]);
    SHA256_W = /* @__PURE__ */ new Uint32Array(64);
    SHA2_32B = class extends HashMD {
      constructor(outputLen) {
        super(64, outputLen, 8, false);
      }
      get() {
        const { A, B, C, D, E, F, G, H } = this;
        return [A, B, C, D, E, F, G, H];
      }
      // prettier-ignore
      set(A, B, C, D, E, F, G, H) {
        this.A = A | 0;
        this.B = B | 0;
        this.C = C | 0;
        this.D = D | 0;
        this.E = E | 0;
        this.F = F | 0;
        this.G = G | 0;
        this.H = H | 0;
      }
      process(view, offset) {
        for (let i2 = 0; i2 < 16; i2++, offset += 4)
          SHA256_W[i2] = view.getUint32(offset, false);
        for (let i2 = 16; i2 < 64; i2++) {
          const W15 = SHA256_W[i2 - 15];
          const W2 = SHA256_W[i2 - 2];
          const s0 = rotr(W15, 7) ^ rotr(W15, 18) ^ W15 >>> 3;
          const s1 = rotr(W2, 17) ^ rotr(W2, 19) ^ W2 >>> 10;
          SHA256_W[i2] = s1 + SHA256_W[i2 - 7] + s0 + SHA256_W[i2 - 16] | 0;
        }
        let { A, B, C, D, E, F, G, H } = this;
        for (let i2 = 0; i2 < 64; i2++) {
          const sigma1 = rotr(E, 6) ^ rotr(E, 11) ^ rotr(E, 25);
          const T1 = H + sigma1 + Chi(E, F, G) + SHA256_K[i2] + SHA256_W[i2] | 0;
          const sigma0 = rotr(A, 2) ^ rotr(A, 13) ^ rotr(A, 22);
          const T2 = sigma0 + Maj(A, B, C) | 0;
          H = G;
          G = F;
          F = E;
          E = D + T1 | 0;
          D = C;
          C = B;
          B = A;
          A = T1 + T2 | 0;
        }
        A = A + this.A | 0;
        B = B + this.B | 0;
        C = C + this.C | 0;
        D = D + this.D | 0;
        E = E + this.E | 0;
        F = F + this.F | 0;
        G = G + this.G | 0;
        H = H + this.H | 0;
        this.set(A, B, C, D, E, F, G, H);
      }
      roundClean() {
        clean(SHA256_W);
      }
      destroy() {
        this.set(0, 0, 0, 0, 0, 0, 0, 0);
        clean(this.buffer);
      }
    };
    _SHA256 = class extends SHA2_32B {
      // We cannot use array here since array allows indexing by variable
      // which means optimizer/compiler cannot use registers.
      A = SHA256_IV[0] | 0;
      B = SHA256_IV[1] | 0;
      C = SHA256_IV[2] | 0;
      D = SHA256_IV[3] | 0;
      E = SHA256_IV[4] | 0;
      F = SHA256_IV[5] | 0;
      G = SHA256_IV[6] | 0;
      H = SHA256_IV[7] | 0;
      constructor() {
        super(32);
      }
    };
    _SHA224 = class extends SHA2_32B {
      A = SHA224_IV[0] | 0;
      B = SHA224_IV[1] | 0;
      C = SHA224_IV[2] | 0;
      D = SHA224_IV[3] | 0;
      E = SHA224_IV[4] | 0;
      F = SHA224_IV[5] | 0;
      G = SHA224_IV[6] | 0;
      H = SHA224_IV[7] | 0;
      constructor() {
        super(28);
      }
    };
    K512 = /* @__PURE__ */ (() => split([
      "0x428a2f98d728ae22",
      "0x7137449123ef65cd",
      "0xb5c0fbcfec4d3b2f",
      "0xe9b5dba58189dbbc",
      "0x3956c25bf348b538",
      "0x59f111f1b605d019",
      "0x923f82a4af194f9b",
      "0xab1c5ed5da6d8118",
      "0xd807aa98a3030242",
      "0x12835b0145706fbe",
      "0x243185be4ee4b28c",
      "0x550c7dc3d5ffb4e2",
      "0x72be5d74f27b896f",
      "0x80deb1fe3b1696b1",
      "0x9bdc06a725c71235",
      "0xc19bf174cf692694",
      "0xe49b69c19ef14ad2",
      "0xefbe4786384f25e3",
      "0x0fc19dc68b8cd5b5",
      "0x240ca1cc77ac9c65",
      "0x2de92c6f592b0275",
      "0x4a7484aa6ea6e483",
      "0x5cb0a9dcbd41fbd4",
      "0x76f988da831153b5",
      "0x983e5152ee66dfab",
      "0xa831c66d2db43210",
      "0xb00327c898fb213f",
      "0xbf597fc7beef0ee4",
      "0xc6e00bf33da88fc2",
      "0xd5a79147930aa725",
      "0x06ca6351e003826f",
      "0x142929670a0e6e70",
      "0x27b70a8546d22ffc",
      "0x2e1b21385c26c926",
      "0x4d2c6dfc5ac42aed",
      "0x53380d139d95b3df",
      "0x650a73548baf63de",
      "0x766a0abb3c77b2a8",
      "0x81c2c92e47edaee6",
      "0x92722c851482353b",
      "0xa2bfe8a14cf10364",
      "0xa81a664bbc423001",
      "0xc24b8b70d0f89791",
      "0xc76c51a30654be30",
      "0xd192e819d6ef5218",
      "0xd69906245565a910",
      "0xf40e35855771202a",
      "0x106aa07032bbd1b8",
      "0x19a4c116b8d2d0c8",
      "0x1e376c085141ab53",
      "0x2748774cdf8eeb99",
      "0x34b0bcb5e19b48a8",
      "0x391c0cb3c5c95a63",
      "0x4ed8aa4ae3418acb",
      "0x5b9cca4f7763e373",
      "0x682e6ff3d6b2b8a3",
      "0x748f82ee5defb2fc",
      "0x78a5636f43172f60",
      "0x84c87814a1f0ab72",
      "0x8cc702081a6439ec",
      "0x90befffa23631e28",
      "0xa4506cebde82bde9",
      "0xbef9a3f7b2c67915",
      "0xc67178f2e372532b",
      "0xca273eceea26619c",
      "0xd186b8c721c0c207",
      "0xeada7dd6cde0eb1e",
      "0xf57d4f7fee6ed178",
      "0x06f067aa72176fba",
      "0x0a637dc5a2c898a6",
      "0x113f9804bef90dae",
      "0x1b710b35131c471b",
      "0x28db77f523047d84",
      "0x32caab7b40c72493",
      "0x3c9ebe0a15c9bebc",
      "0x431d67c49c100d4c",
      "0x4cc5d4becb3e42b6",
      "0x597f299cfc657e2a",
      "0x5fcb6fab3ad6faec",
      "0x6c44198c4a475817"
    ].map((n) => BigInt(n))))();
    SHA512_Kh = /* @__PURE__ */ (() => K512[0])();
    SHA512_Kl = /* @__PURE__ */ (() => K512[1])();
    SHA512_W_H = /* @__PURE__ */ new Uint32Array(80);
    SHA512_W_L = /* @__PURE__ */ new Uint32Array(80);
    SHA2_64B = class extends HashMD {
      constructor(outputLen) {
        super(128, outputLen, 16, false);
      }
      // prettier-ignore
      get() {
        const { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
        return [Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl];
      }
      // prettier-ignore
      set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl) {
        this.Ah = Ah | 0;
        this.Al = Al | 0;
        this.Bh = Bh | 0;
        this.Bl = Bl | 0;
        this.Ch = Ch | 0;
        this.Cl = Cl | 0;
        this.Dh = Dh | 0;
        this.Dl = Dl | 0;
        this.Eh = Eh | 0;
        this.El = El | 0;
        this.Fh = Fh | 0;
        this.Fl = Fl | 0;
        this.Gh = Gh | 0;
        this.Gl = Gl | 0;
        this.Hh = Hh | 0;
        this.Hl = Hl | 0;
      }
      process(view, offset) {
        for (let i2 = 0; i2 < 16; i2++, offset += 4) {
          SHA512_W_H[i2] = view.getUint32(offset);
          SHA512_W_L[i2] = view.getUint32(offset += 4);
        }
        for (let i2 = 16; i2 < 80; i2++) {
          const W15h = SHA512_W_H[i2 - 15] | 0;
          const W15l = SHA512_W_L[i2 - 15] | 0;
          const s0h = rotrSH(W15h, W15l, 1) ^ rotrSH(W15h, W15l, 8) ^ shrSH(W15h, W15l, 7);
          const s0l = rotrSL(W15h, W15l, 1) ^ rotrSL(W15h, W15l, 8) ^ shrSL(W15h, W15l, 7);
          const W2h = SHA512_W_H[i2 - 2] | 0;
          const W2l = SHA512_W_L[i2 - 2] | 0;
          const s1h = rotrSH(W2h, W2l, 19) ^ rotrBH(W2h, W2l, 61) ^ shrSH(W2h, W2l, 6);
          const s1l = rotrSL(W2h, W2l, 19) ^ rotrBL(W2h, W2l, 61) ^ shrSL(W2h, W2l, 6);
          const SUMl = add4L(s0l, s1l, SHA512_W_L[i2 - 7], SHA512_W_L[i2 - 16]);
          const SUMh = add4H(SUMl, s0h, s1h, SHA512_W_H[i2 - 7], SHA512_W_H[i2 - 16]);
          SHA512_W_H[i2] = SUMh | 0;
          SHA512_W_L[i2] = SUMl | 0;
        }
        let { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
        for (let i2 = 0; i2 < 80; i2++) {
          const sigma1h = rotrSH(Eh, El, 14) ^ rotrSH(Eh, El, 18) ^ rotrBH(Eh, El, 41);
          const sigma1l = rotrSL(Eh, El, 14) ^ rotrSL(Eh, El, 18) ^ rotrBL(Eh, El, 41);
          const CHIh = Eh & Fh ^ ~Eh & Gh;
          const CHIl = El & Fl ^ ~El & Gl;
          const T1ll = add5L(Hl, sigma1l, CHIl, SHA512_Kl[i2], SHA512_W_L[i2]);
          const T1h = add5H(T1ll, Hh, sigma1h, CHIh, SHA512_Kh[i2], SHA512_W_H[i2]);
          const T1l = T1ll | 0;
          const sigma0h = rotrSH(Ah, Al, 28) ^ rotrBH(Ah, Al, 34) ^ rotrBH(Ah, Al, 39);
          const sigma0l = rotrSL(Ah, Al, 28) ^ rotrBL(Ah, Al, 34) ^ rotrBL(Ah, Al, 39);
          const MAJh = Ah & Bh ^ Ah & Ch ^ Bh & Ch;
          const MAJl = Al & Bl ^ Al & Cl ^ Bl & Cl;
          Hh = Gh | 0;
          Hl = Gl | 0;
          Gh = Fh | 0;
          Gl = Fl | 0;
          Fh = Eh | 0;
          Fl = El | 0;
          ({ h: Eh, l: El } = add(Dh | 0, Dl | 0, T1h | 0, T1l | 0));
          Dh = Ch | 0;
          Dl = Cl | 0;
          Ch = Bh | 0;
          Cl = Bl | 0;
          Bh = Ah | 0;
          Bl = Al | 0;
          const All = add3L(T1l, sigma0l, MAJl);
          Ah = add3H(All, T1h, sigma0h, MAJh);
          Al = All | 0;
        }
        ({ h: Ah, l: Al } = add(this.Ah | 0, this.Al | 0, Ah | 0, Al | 0));
        ({ h: Bh, l: Bl } = add(this.Bh | 0, this.Bl | 0, Bh | 0, Bl | 0));
        ({ h: Ch, l: Cl } = add(this.Ch | 0, this.Cl | 0, Ch | 0, Cl | 0));
        ({ h: Dh, l: Dl } = add(this.Dh | 0, this.Dl | 0, Dh | 0, Dl | 0));
        ({ h: Eh, l: El } = add(this.Eh | 0, this.El | 0, Eh | 0, El | 0));
        ({ h: Fh, l: Fl } = add(this.Fh | 0, this.Fl | 0, Fh | 0, Fl | 0));
        ({ h: Gh, l: Gl } = add(this.Gh | 0, this.Gl | 0, Gh | 0, Gl | 0));
        ({ h: Hh, l: Hl } = add(this.Hh | 0, this.Hl | 0, Hh | 0, Hl | 0));
        this.set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl);
      }
      roundClean() {
        clean(SHA512_W_H, SHA512_W_L);
      }
      destroy() {
        clean(this.buffer);
        this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
      }
    };
    _SHA512 = class extends SHA2_64B {
      Ah = SHA512_IV[0] | 0;
      Al = SHA512_IV[1] | 0;
      Bh = SHA512_IV[2] | 0;
      Bl = SHA512_IV[3] | 0;
      Ch = SHA512_IV[4] | 0;
      Cl = SHA512_IV[5] | 0;
      Dh = SHA512_IV[6] | 0;
      Dl = SHA512_IV[7] | 0;
      Eh = SHA512_IV[8] | 0;
      El = SHA512_IV[9] | 0;
      Fh = SHA512_IV[10] | 0;
      Fl = SHA512_IV[11] | 0;
      Gh = SHA512_IV[12] | 0;
      Gl = SHA512_IV[13] | 0;
      Hh = SHA512_IV[14] | 0;
      Hl = SHA512_IV[15] | 0;
      constructor() {
        super(64);
      }
    };
    _SHA384 = class extends SHA2_64B {
      Ah = SHA384_IV[0] | 0;
      Al = SHA384_IV[1] | 0;
      Bh = SHA384_IV[2] | 0;
      Bl = SHA384_IV[3] | 0;
      Ch = SHA384_IV[4] | 0;
      Cl = SHA384_IV[5] | 0;
      Dh = SHA384_IV[6] | 0;
      Dl = SHA384_IV[7] | 0;
      Eh = SHA384_IV[8] | 0;
      El = SHA384_IV[9] | 0;
      Fh = SHA384_IV[10] | 0;
      Fl = SHA384_IV[11] | 0;
      Gh = SHA384_IV[12] | 0;
      Gl = SHA384_IV[13] | 0;
      Hh = SHA384_IV[14] | 0;
      Hl = SHA384_IV[15] | 0;
      constructor() {
        super(48);
      }
    };
    T224_IV = /* @__PURE__ */ Uint32Array.from([
      2352822216,
      424955298,
      1944164710,
      2312950998,
      502970286,
      855612546,
      1738396948,
      1479516111,
      258812777,
      2077511080,
      2011393907,
      79989058,
      1067287976,
      1780299464,
      286451373,
      2446758561
    ]);
    T256_IV = /* @__PURE__ */ Uint32Array.from([
      573645204,
      4230739756,
      2673172387,
      3360449730,
      596883563,
      1867755857,
      2520282905,
      1497426621,
      2519219938,
      2827943907,
      3193839141,
      1401305490,
      721525244,
      746961066,
      246885852,
      2177182882
    ]);
    _SHA512_224 = class extends SHA2_64B {
      Ah = T224_IV[0] | 0;
      Al = T224_IV[1] | 0;
      Bh = T224_IV[2] | 0;
      Bl = T224_IV[3] | 0;
      Ch = T224_IV[4] | 0;
      Cl = T224_IV[5] | 0;
      Dh = T224_IV[6] | 0;
      Dl = T224_IV[7] | 0;
      Eh = T224_IV[8] | 0;
      El = T224_IV[9] | 0;
      Fh = T224_IV[10] | 0;
      Fl = T224_IV[11] | 0;
      Gh = T224_IV[12] | 0;
      Gl = T224_IV[13] | 0;
      Hh = T224_IV[14] | 0;
      Hl = T224_IV[15] | 0;
      constructor() {
        super(28);
      }
    };
    _SHA512_256 = class extends SHA2_64B {
      Ah = T256_IV[0] | 0;
      Al = T256_IV[1] | 0;
      Bh = T256_IV[2] | 0;
      Bl = T256_IV[3] | 0;
      Ch = T256_IV[4] | 0;
      Cl = T256_IV[5] | 0;
      Dh = T256_IV[6] | 0;
      Dl = T256_IV[7] | 0;
      Eh = T256_IV[8] | 0;
      El = T256_IV[9] | 0;
      Fh = T256_IV[10] | 0;
      Fl = T256_IV[11] | 0;
      Gh = T256_IV[12] | 0;
      Gl = T256_IV[13] | 0;
      Hh = T256_IV[14] | 0;
      Hl = T256_IV[15] | 0;
      constructor() {
        super(32);
      }
    };
    sha256 = /* @__PURE__ */ createHasher(
      () => new _SHA256(),
      /* @__PURE__ */ oidNist(1)
    );
    sha224 = /* @__PURE__ */ createHasher(
      () => new _SHA224(),
      /* @__PURE__ */ oidNist(4)
    );
    sha512 = /* @__PURE__ */ createHasher(
      () => new _SHA512(),
      /* @__PURE__ */ oidNist(3)
    );
    sha384 = /* @__PURE__ */ createHasher(
      () => new _SHA384(),
      /* @__PURE__ */ oidNist(2)
    );
    sha512_256 = /* @__PURE__ */ createHasher(
      () => new _SHA512_256(),
      /* @__PURE__ */ oidNist(6)
    );
    sha512_224 = /* @__PURE__ */ createHasher(
      () => new _SHA512_224(),
      /* @__PURE__ */ oidNist(5)
    );
  }
});

// core/node_modules/@noble/curves/utils.js
function abool(value, title = "") {
  if (typeof value !== "boolean") {
    const prefix = title && `"${title}" `;
    throw new Error(prefix + "expected boolean, got type=" + typeof value);
  }
  return value;
}
function abignumber(n) {
  if (typeof n === "bigint") {
    if (!isPosBig(n))
      throw new Error("positive bigint expected, got " + n);
  } else
    anumber(n);
  return n;
}
function asafenumber(value, title = "") {
  if (!Number.isSafeInteger(value)) {
    const prefix = title && `"${title}" `;
    throw new Error(prefix + "expected safe integer, got type=" + typeof value);
  }
}
function numberToHexUnpadded(num2) {
  const hex = abignumber(num2).toString(16);
  return hex.length & 1 ? "0" + hex : hex;
}
function hexToNumber(hex) {
  if (typeof hex !== "string")
    throw new Error("hex string expected, got " + typeof hex);
  return hex === "" ? _0n : BigInt("0x" + hex);
}
function bytesToNumberBE(bytes) {
  return hexToNumber(bytesToHex(bytes));
}
function bytesToNumberLE(bytes) {
  return hexToNumber(bytesToHex(copyBytes(abytes(bytes)).reverse()));
}
function numberToBytesBE(n, len) {
  anumber(len);
  n = abignumber(n);
  const res = hexToBytes(n.toString(16).padStart(len * 2, "0"));
  if (res.length !== len)
    throw new Error("number too large");
  return res;
}
function numberToBytesLE(n, len) {
  return numberToBytesBE(n, len).reverse();
}
function copyBytes(bytes) {
  return Uint8Array.from(bytes);
}
function asciiToBytes(ascii) {
  return Uint8Array.from(ascii, (c, i2) => {
    const charCode = c.charCodeAt(0);
    if (c.length !== 1 || charCode > 127) {
      throw new Error(`string contains non-ASCII character "${ascii[i2]}" with code ${charCode} at position ${i2}`);
    }
    return charCode;
  });
}
function inRange(n, min, max) {
  return isPosBig(n) && isPosBig(min) && isPosBig(max) && min <= n && n < max;
}
function aInRange(title, n, min, max) {
  if (!inRange(n, min, max))
    throw new Error("expected valid " + title + ": " + min + " <= n < " + max + ", got " + n);
}
function bitLen(n) {
  let len;
  for (len = 0; n > _0n; n >>= _1n, len += 1)
    ;
  return len;
}
function createHmacDrbg(hashLen, qByteLen, hmacFn) {
  anumber(hashLen, "hashLen");
  anumber(qByteLen, "qByteLen");
  if (typeof hmacFn !== "function")
    throw new Error("hmacFn must be a function");
  const u8n = (len) => new Uint8Array(len);
  const NULL = Uint8Array.of();
  const byte0 = Uint8Array.of(0);
  const byte1 = Uint8Array.of(1);
  const _maxDrbgIters = 1e3;
  let v = u8n(hashLen);
  let k = u8n(hashLen);
  let i2 = 0;
  const reset = () => {
    v.fill(1);
    k.fill(0);
    i2 = 0;
  };
  const h = (...msgs) => hmacFn(k, concatBytes(v, ...msgs));
  const reseed = (seed = NULL) => {
    k = h(byte0, seed);
    v = h();
    if (seed.length === 0)
      return;
    k = h(byte1, seed);
    v = h();
  };
  const gen = () => {
    if (i2++ >= _maxDrbgIters)
      throw new Error("drbg: tried max amount of iterations");
    let len = 0;
    const out = [];
    while (len < qByteLen) {
      v = h();
      const sl = v.slice();
      out.push(sl);
      len += v.length;
    }
    return concatBytes(...out);
  };
  const genUntil = (seed, pred) => {
    reset();
    reseed(seed);
    let res = void 0;
    while (!(res = pred(gen())))
      reseed();
    reset();
    return res;
  };
  return genUntil;
}
function validateObject(object, fields = {}, optFields = {}) {
  if (!object || typeof object !== "object")
    throw new Error("expected valid options object");
  function checkField(fieldName, expectedType, isOpt) {
    const val = object[fieldName];
    if (isOpt && val === void 0)
      return;
    const current = typeof val;
    if (current !== expectedType || val === null)
      throw new Error(`param "${fieldName}" is invalid: expected ${expectedType}, got ${current}`);
  }
  const iter = (f, isOpt) => Object.entries(f).forEach(([k, v]) => checkField(k, v, isOpt));
  iter(fields, false);
  iter(optFields, true);
}
function memoized(fn) {
  const map = /* @__PURE__ */ new WeakMap();
  return (arg, ...args) => {
    const val = map.get(arg);
    if (val !== void 0)
      return val;
    const computed = fn(arg, ...args);
    map.set(arg, computed);
    return computed;
  };
}
var _0n, _1n, isPosBig, bitMask;
var init_utils2 = __esm({
  "core/node_modules/@noble/curves/utils.js"() {
    init_utils();
    init_utils();
    _0n = /* @__PURE__ */ BigInt(0);
    _1n = /* @__PURE__ */ BigInt(1);
    isPosBig = (n) => typeof n === "bigint" && _0n <= n;
    bitMask = (n) => (_1n << BigInt(n)) - _1n;
  }
});

// core/node_modules/@noble/curves/abstract/modular.js
function mod(a, b) {
  const result = a % b;
  return result >= _0n2 ? result : b + result;
}
function pow2(x, power, modulo) {
  let res = x;
  while (power-- > _0n2) {
    res *= res;
    res %= modulo;
  }
  return res;
}
function invert(number, modulo) {
  if (number === _0n2)
    throw new Error("invert: expected non-zero number");
  if (modulo <= _0n2)
    throw new Error("invert: expected positive modulus, got " + modulo);
  let a = mod(number, modulo);
  let b = modulo;
  let x = _0n2, y = _1n2, u = _1n2, v = _0n2;
  while (a !== _0n2) {
    const q = b / a;
    const r = b % a;
    const m = x - u * q;
    const n = y - v * q;
    b = a, a = r, x = u, y = v, u = m, v = n;
  }
  const gcd = b;
  if (gcd !== _1n2)
    throw new Error("invert: does not exist");
  return mod(x, modulo);
}
function assertIsSquare(Fp, root, n) {
  if (!Fp.eql(Fp.sqr(root), n))
    throw new Error("Cannot find square root");
}
function sqrt3mod4(Fp, n) {
  const p1div4 = (Fp.ORDER + _1n2) / _4n;
  const root = Fp.pow(n, p1div4);
  assertIsSquare(Fp, root, n);
  return root;
}
function sqrt5mod8(Fp, n) {
  const p5div8 = (Fp.ORDER - _5n) / _8n;
  const n2 = Fp.mul(n, _2n);
  const v = Fp.pow(n2, p5div8);
  const nv = Fp.mul(n, v);
  const i2 = Fp.mul(Fp.mul(nv, _2n), v);
  const root = Fp.mul(nv, Fp.sub(i2, Fp.ONE));
  assertIsSquare(Fp, root, n);
  return root;
}
function sqrt9mod16(P) {
  const Fp_ = Field(P);
  const tn = tonelliShanks(P);
  const c1 = tn(Fp_, Fp_.neg(Fp_.ONE));
  const c2 = tn(Fp_, c1);
  const c3 = tn(Fp_, Fp_.neg(c1));
  const c4 = (P + _7n) / _16n;
  return (Fp, n) => {
    let tv1 = Fp.pow(n, c4);
    let tv2 = Fp.mul(tv1, c1);
    const tv3 = Fp.mul(tv1, c2);
    const tv4 = Fp.mul(tv1, c3);
    const e1 = Fp.eql(Fp.sqr(tv2), n);
    const e2 = Fp.eql(Fp.sqr(tv3), n);
    tv1 = Fp.cmov(tv1, tv2, e1);
    tv2 = Fp.cmov(tv4, tv3, e2);
    const e3 = Fp.eql(Fp.sqr(tv2), n);
    const root = Fp.cmov(tv1, tv2, e3);
    assertIsSquare(Fp, root, n);
    return root;
  };
}
function tonelliShanks(P) {
  if (P < _3n)
    throw new Error("sqrt is not defined for small field");
  let Q = P - _1n2;
  let S = 0;
  while (Q % _2n === _0n2) {
    Q /= _2n;
    S++;
  }
  let Z = _2n;
  const _Fp = Field(P);
  while (FpLegendre(_Fp, Z) === 1) {
    if (Z++ > 1e3)
      throw new Error("Cannot find square root: probably non-prime P");
  }
  if (S === 1)
    return sqrt3mod4;
  let cc = _Fp.pow(Z, Q);
  const Q1div2 = (Q + _1n2) / _2n;
  return function tonelliSlow(Fp, n) {
    if (Fp.is0(n))
      return n;
    if (FpLegendre(Fp, n) !== 1)
      throw new Error("Cannot find square root");
    let M = S;
    let c = Fp.mul(Fp.ONE, cc);
    let t = Fp.pow(n, Q);
    let R = Fp.pow(n, Q1div2);
    while (!Fp.eql(t, Fp.ONE)) {
      if (Fp.is0(t))
        return Fp.ZERO;
      let i2 = 1;
      let t_tmp = Fp.sqr(t);
      while (!Fp.eql(t_tmp, Fp.ONE)) {
        i2++;
        t_tmp = Fp.sqr(t_tmp);
        if (i2 === M)
          throw new Error("Cannot find square root");
      }
      const exponent = _1n2 << BigInt(M - i2 - 1);
      const b = Fp.pow(c, exponent);
      M = i2;
      c = Fp.sqr(b);
      t = Fp.mul(t, c);
      R = Fp.mul(R, b);
    }
    return R;
  };
}
function FpSqrt(P) {
  if (P % _4n === _3n)
    return sqrt3mod4;
  if (P % _8n === _5n)
    return sqrt5mod8;
  if (P % _16n === _9n)
    return sqrt9mod16(P);
  return tonelliShanks(P);
}
function validateField(field) {
  const initial = {
    ORDER: "bigint",
    BYTES: "number",
    BITS: "number"
  };
  const opts = FIELD_FIELDS.reduce((map, val) => {
    map[val] = "function";
    return map;
  }, initial);
  validateObject(field, opts);
  return field;
}
function FpPow(Fp, num2, power) {
  if (power < _0n2)
    throw new Error("invalid exponent, negatives unsupported");
  if (power === _0n2)
    return Fp.ONE;
  if (power === _1n2)
    return num2;
  let p = Fp.ONE;
  let d = num2;
  while (power > _0n2) {
    if (power & _1n2)
      p = Fp.mul(p, d);
    d = Fp.sqr(d);
    power >>= _1n2;
  }
  return p;
}
function FpInvertBatch(Fp, nums, passZero = false) {
  const inverted = new Array(nums.length).fill(passZero ? Fp.ZERO : void 0);
  const multipliedAcc = nums.reduce((acc, num2, i2) => {
    if (Fp.is0(num2))
      return acc;
    inverted[i2] = acc;
    return Fp.mul(acc, num2);
  }, Fp.ONE);
  const invertedAcc = Fp.inv(multipliedAcc);
  nums.reduceRight((acc, num2, i2) => {
    if (Fp.is0(num2))
      return acc;
    inverted[i2] = Fp.mul(acc, inverted[i2]);
    return Fp.mul(acc, num2);
  }, invertedAcc);
  return inverted;
}
function FpLegendre(Fp, n) {
  const p1mod2 = (Fp.ORDER - _1n2) / _2n;
  const powered = Fp.pow(n, p1mod2);
  const yes = Fp.eql(powered, Fp.ONE);
  const zero = Fp.eql(powered, Fp.ZERO);
  const no = Fp.eql(powered, Fp.neg(Fp.ONE));
  if (!yes && !zero && !no)
    throw new Error("invalid Legendre symbol result");
  return yes ? 1 : zero ? 0 : -1;
}
function nLength(n, nBitLength) {
  if (nBitLength !== void 0)
    anumber(nBitLength);
  const _nBitLength = nBitLength !== void 0 ? nBitLength : n.toString(2).length;
  const nByteLength = Math.ceil(_nBitLength / 8);
  return { nBitLength: _nBitLength, nByteLength };
}
function Field(ORDER, opts = {}) {
  return new _Field(ORDER, opts);
}
function getFieldBytesLength(fieldOrder) {
  if (typeof fieldOrder !== "bigint")
    throw new Error("field order must be bigint");
  const bitLength = fieldOrder.toString(2).length;
  return Math.ceil(bitLength / 8);
}
function getMinHashLength(fieldOrder) {
  const length = getFieldBytesLength(fieldOrder);
  return length + Math.ceil(length / 2);
}
function mapHashToField(key, fieldOrder, isLE2 = false) {
  abytes(key);
  const len = key.length;
  const fieldLen = getFieldBytesLength(fieldOrder);
  const minLen = getMinHashLength(fieldOrder);
  if (len < 16 || len < minLen || len > 1024)
    throw new Error("expected " + minLen + "-1024 bytes of input, got " + len);
  const num2 = isLE2 ? bytesToNumberLE(key) : bytesToNumberBE(key);
  const reduced = mod(num2, fieldOrder - _1n2) + _1n2;
  return isLE2 ? numberToBytesLE(reduced, fieldLen) : numberToBytesBE(reduced, fieldLen);
}
var _0n2, _1n2, _2n, _3n, _4n, _5n, _7n, _8n, _9n, _16n, FIELD_FIELDS, _Field;
var init_modular = __esm({
  "core/node_modules/@noble/curves/abstract/modular.js"() {
    init_utils2();
    _0n2 = /* @__PURE__ */ BigInt(0);
    _1n2 = /* @__PURE__ */ BigInt(1);
    _2n = /* @__PURE__ */ BigInt(2);
    _3n = /* @__PURE__ */ BigInt(3);
    _4n = /* @__PURE__ */ BigInt(4);
    _5n = /* @__PURE__ */ BigInt(5);
    _7n = /* @__PURE__ */ BigInt(7);
    _8n = /* @__PURE__ */ BigInt(8);
    _9n = /* @__PURE__ */ BigInt(9);
    _16n = /* @__PURE__ */ BigInt(16);
    FIELD_FIELDS = [
      "create",
      "isValid",
      "is0",
      "neg",
      "inv",
      "sqrt",
      "sqr",
      "eql",
      "add",
      "sub",
      "mul",
      "pow",
      "div",
      "addN",
      "subN",
      "mulN",
      "sqrN"
    ];
    _Field = class {
      ORDER;
      BITS;
      BYTES;
      isLE;
      ZERO = _0n2;
      ONE = _1n2;
      _lengths;
      _sqrt;
      // cached sqrt
      _mod;
      constructor(ORDER, opts = {}) {
        if (ORDER <= _0n2)
          throw new Error("invalid field: expected ORDER > 0, got " + ORDER);
        let _nbitLength = void 0;
        this.isLE = false;
        if (opts != null && typeof opts === "object") {
          if (typeof opts.BITS === "number")
            _nbitLength = opts.BITS;
          if (typeof opts.sqrt === "function")
            this.sqrt = opts.sqrt;
          if (typeof opts.isLE === "boolean")
            this.isLE = opts.isLE;
          if (opts.allowedLengths)
            this._lengths = opts.allowedLengths?.slice();
          if (typeof opts.modFromBytes === "boolean")
            this._mod = opts.modFromBytes;
        }
        const { nBitLength, nByteLength } = nLength(ORDER, _nbitLength);
        if (nByteLength > 2048)
          throw new Error("invalid field: expected ORDER of <= 2048 bytes");
        this.ORDER = ORDER;
        this.BITS = nBitLength;
        this.BYTES = nByteLength;
        this._sqrt = void 0;
        Object.preventExtensions(this);
      }
      create(num2) {
        return mod(num2, this.ORDER);
      }
      isValid(num2) {
        if (typeof num2 !== "bigint")
          throw new Error("invalid field element: expected bigint, got " + typeof num2);
        return _0n2 <= num2 && num2 < this.ORDER;
      }
      is0(num2) {
        return num2 === _0n2;
      }
      // is valid and invertible
      isValidNot0(num2) {
        return !this.is0(num2) && this.isValid(num2);
      }
      isOdd(num2) {
        return (num2 & _1n2) === _1n2;
      }
      neg(num2) {
        return mod(-num2, this.ORDER);
      }
      eql(lhs, rhs) {
        return lhs === rhs;
      }
      sqr(num2) {
        return mod(num2 * num2, this.ORDER);
      }
      add(lhs, rhs) {
        return mod(lhs + rhs, this.ORDER);
      }
      sub(lhs, rhs) {
        return mod(lhs - rhs, this.ORDER);
      }
      mul(lhs, rhs) {
        return mod(lhs * rhs, this.ORDER);
      }
      pow(num2, power) {
        return FpPow(this, num2, power);
      }
      div(lhs, rhs) {
        return mod(lhs * invert(rhs, this.ORDER), this.ORDER);
      }
      // Same as above, but doesn't normalize
      sqrN(num2) {
        return num2 * num2;
      }
      addN(lhs, rhs) {
        return lhs + rhs;
      }
      subN(lhs, rhs) {
        return lhs - rhs;
      }
      mulN(lhs, rhs) {
        return lhs * rhs;
      }
      inv(num2) {
        return invert(num2, this.ORDER);
      }
      sqrt(num2) {
        if (!this._sqrt)
          this._sqrt = FpSqrt(this.ORDER);
        return this._sqrt(this, num2);
      }
      toBytes(num2) {
        return this.isLE ? numberToBytesLE(num2, this.BYTES) : numberToBytesBE(num2, this.BYTES);
      }
      fromBytes(bytes, skipValidation = false) {
        abytes(bytes);
        const { _lengths: allowedLengths, BYTES, isLE: isLE2, ORDER, _mod: modFromBytes } = this;
        if (allowedLengths) {
          if (!allowedLengths.includes(bytes.length) || bytes.length > BYTES) {
            throw new Error("Field.fromBytes: expected " + allowedLengths + " bytes, got " + bytes.length);
          }
          const padded = new Uint8Array(BYTES);
          padded.set(bytes, isLE2 ? 0 : padded.length - bytes.length);
          bytes = padded;
        }
        if (bytes.length !== BYTES)
          throw new Error("Field.fromBytes: expected " + BYTES + " bytes, got " + bytes.length);
        let scalar = isLE2 ? bytesToNumberLE(bytes) : bytesToNumberBE(bytes);
        if (modFromBytes)
          scalar = mod(scalar, ORDER);
        if (!skipValidation) {
          if (!this.isValid(scalar))
            throw new Error("invalid field element: outside of range 0..ORDER");
        }
        return scalar;
      }
      // TODO: we don't need it here, move out to separate fn
      invertBatch(lst) {
        return FpInvertBatch(this, lst);
      }
      // We can't move this out because Fp6, Fp12 implement it
      // and it's unclear what to return in there.
      cmov(a, b, condition) {
        return condition ? b : a;
      }
    };
  }
});

// core/node_modules/@noble/curves/abstract/curve.js
function negateCt(condition, item) {
  const neg = item.negate();
  return condition ? neg : item;
}
function normalizeZ(c, points) {
  const invertedZs = FpInvertBatch(c.Fp, points.map((p) => p.Z));
  return points.map((p, i2) => c.fromAffine(p.toAffine(invertedZs[i2])));
}
function validateW(W, bits) {
  if (!Number.isSafeInteger(W) || W <= 0 || W > bits)
    throw new Error("invalid window size, expected [1.." + bits + "], got W=" + W);
}
function calcWOpts(W, scalarBits) {
  validateW(W, scalarBits);
  const windows = Math.ceil(scalarBits / W) + 1;
  const windowSize = 2 ** (W - 1);
  const maxNumber = 2 ** W;
  const mask = bitMask(W);
  const shiftBy = BigInt(W);
  return { windows, windowSize, mask, maxNumber, shiftBy };
}
function calcOffsets(n, window, wOpts) {
  const { windowSize, mask, maxNumber, shiftBy } = wOpts;
  let wbits = Number(n & mask);
  let nextN = n >> shiftBy;
  if (wbits > windowSize) {
    wbits -= maxNumber;
    nextN += _1n3;
  }
  const offsetStart = window * windowSize;
  const offset = offsetStart + Math.abs(wbits) - 1;
  const isZero = wbits === 0;
  const isNeg = wbits < 0;
  const isNegF = window % 2 !== 0;
  const offsetF = offsetStart;
  return { nextN, offset, isZero, isNeg, isNegF, offsetF };
}
function getW(P) {
  return pointWindowSizes.get(P) || 1;
}
function assert0(n) {
  if (n !== _0n3)
    throw new Error("invalid wNAF");
}
function mulEndoUnsafe(Point, point, k1, k2) {
  let acc = point;
  let p1 = Point.ZERO;
  let p2 = Point.ZERO;
  while (k1 > _0n3 || k2 > _0n3) {
    if (k1 & _1n3)
      p1 = p1.add(acc);
    if (k2 & _1n3)
      p2 = p2.add(acc);
    acc = acc.double();
    k1 >>= _1n3;
    k2 >>= _1n3;
  }
  return { p1, p2 };
}
function createField(order, field, isLE2) {
  if (field) {
    if (field.ORDER !== order)
      throw new Error("Field.ORDER must match order: Fp == p, Fn == n");
    validateField(field);
    return field;
  } else {
    return Field(order, { isLE: isLE2 });
  }
}
function createCurveFields(type, CURVE, curveOpts = {}, FpFnLE) {
  if (FpFnLE === void 0)
    FpFnLE = type === "edwards";
  if (!CURVE || typeof CURVE !== "object")
    throw new Error(`expected valid ${type} CURVE object`);
  for (const p of ["p", "n", "h"]) {
    const val = CURVE[p];
    if (!(typeof val === "bigint" && val > _0n3))
      throw new Error(`CURVE.${p} must be positive bigint`);
  }
  const Fp = createField(CURVE.p, curveOpts.Fp, FpFnLE);
  const Fn = createField(CURVE.n, curveOpts.Fn, FpFnLE);
  const _b = type === "weierstrass" ? "b" : "d";
  const params = ["Gx", "Gy", "a", _b];
  for (const p of params) {
    if (!Fp.isValid(CURVE[p]))
      throw new Error(`CURVE.${p} must be valid field element of CURVE.Fp`);
  }
  CURVE = Object.freeze(Object.assign({}, CURVE));
  return { CURVE, Fp, Fn };
}
function createKeygen(randomSecretKey, getPublicKey2) {
  return function keygen(seed) {
    const secretKey = randomSecretKey(seed);
    return { secretKey, publicKey: getPublicKey2(secretKey) };
  };
}
var _0n3, _1n3, pointPrecomputes, pointWindowSizes, wNAF;
var init_curve = __esm({
  "core/node_modules/@noble/curves/abstract/curve.js"() {
    init_utils2();
    init_modular();
    _0n3 = /* @__PURE__ */ BigInt(0);
    _1n3 = /* @__PURE__ */ BigInt(1);
    pointPrecomputes = /* @__PURE__ */ new WeakMap();
    pointWindowSizes = /* @__PURE__ */ new WeakMap();
    wNAF = class {
      BASE;
      ZERO;
      Fn;
      bits;
      // Parametrized with a given Point class (not individual point)
      constructor(Point, bits) {
        this.BASE = Point.BASE;
        this.ZERO = Point.ZERO;
        this.Fn = Point.Fn;
        this.bits = bits;
      }
      // non-const time multiplication ladder
      _unsafeLadder(elm, n, p = this.ZERO) {
        let d = elm;
        while (n > _0n3) {
          if (n & _1n3)
            p = p.add(d);
          d = d.double();
          n >>= _1n3;
        }
        return p;
      }
      /**
       * Creates a wNAF precomputation window. Used for caching.
       * Default window size is set by `utils.precompute()` and is equal to 8.
       * Number of precomputed points depends on the curve size:
       * 2^(𝑊−1) * (Math.ceil(𝑛 / 𝑊) + 1), where:
       * - 𝑊 is the window size
       * - 𝑛 is the bitlength of the curve order.
       * For a 256-bit curve and window size 8, the number of precomputed points is 128 * 33 = 4224.
       * @param point Point instance
       * @param W window size
       * @returns precomputed point tables flattened to a single array
       */
      precomputeWindow(point, W) {
        const { windows, windowSize } = calcWOpts(W, this.bits);
        const points = [];
        let p = point;
        let base = p;
        for (let window = 0; window < windows; window++) {
          base = p;
          points.push(base);
          for (let i2 = 1; i2 < windowSize; i2++) {
            base = base.add(p);
            points.push(base);
          }
          p = base.double();
        }
        return points;
      }
      /**
       * Implements ec multiplication using precomputed tables and w-ary non-adjacent form.
       * More compact implementation:
       * https://github.com/paulmillr/noble-secp256k1/blob/47cb1669b6e506ad66b35fe7d76132ae97465da2/index.ts#L502-L541
       * @returns real and fake (for const-time) points
       */
      wNAF(W, precomputes, n) {
        if (!this.Fn.isValid(n))
          throw new Error("invalid scalar");
        let p = this.ZERO;
        let f = this.BASE;
        const wo = calcWOpts(W, this.bits);
        for (let window = 0; window < wo.windows; window++) {
          const { nextN, offset, isZero, isNeg, isNegF, offsetF } = calcOffsets(n, window, wo);
          n = nextN;
          if (isZero) {
            f = f.add(negateCt(isNegF, precomputes[offsetF]));
          } else {
            p = p.add(negateCt(isNeg, precomputes[offset]));
          }
        }
        assert0(n);
        return { p, f };
      }
      /**
       * Implements ec unsafe (non const-time) multiplication using precomputed tables and w-ary non-adjacent form.
       * @param acc accumulator point to add result of multiplication
       * @returns point
       */
      wNAFUnsafe(W, precomputes, n, acc = this.ZERO) {
        const wo = calcWOpts(W, this.bits);
        for (let window = 0; window < wo.windows; window++) {
          if (n === _0n3)
            break;
          const { nextN, offset, isZero, isNeg } = calcOffsets(n, window, wo);
          n = nextN;
          if (isZero) {
            continue;
          } else {
            const item = precomputes[offset];
            acc = acc.add(isNeg ? item.negate() : item);
          }
        }
        assert0(n);
        return acc;
      }
      getPrecomputes(W, point, transform) {
        let comp = pointPrecomputes.get(point);
        if (!comp) {
          comp = this.precomputeWindow(point, W);
          if (W !== 1) {
            if (typeof transform === "function")
              comp = transform(comp);
            pointPrecomputes.set(point, comp);
          }
        }
        return comp;
      }
      cached(point, scalar, transform) {
        const W = getW(point);
        return this.wNAF(W, this.getPrecomputes(W, point, transform), scalar);
      }
      unsafe(point, scalar, transform, prev) {
        const W = getW(point);
        if (W === 1)
          return this._unsafeLadder(point, scalar, prev);
        return this.wNAFUnsafe(W, this.getPrecomputes(W, point, transform), scalar, prev);
      }
      // We calculate precomputes for elliptic curve point multiplication
      // using windowed method. This specifies window size and
      // stores precomputed values. Usually only base point would be precomputed.
      createCache(P, W) {
        validateW(W, this.bits);
        pointWindowSizes.set(P, W);
        pointPrecomputes.delete(P);
      }
      hasCache(elm) {
        return getW(elm) !== 1;
      }
    };
  }
});

// core/node_modules/@noble/curves/abstract/hash-to-curve.js
function i2osp(value, length) {
  asafenumber(value);
  asafenumber(length);
  if (value < 0 || value >= 1 << 8 * length)
    throw new Error("invalid I2OSP input: " + value);
  const res = Array.from({ length }).fill(0);
  for (let i2 = length - 1; i2 >= 0; i2--) {
    res[i2] = value & 255;
    value >>>= 8;
  }
  return new Uint8Array(res);
}
function strxor(a, b) {
  const arr = new Uint8Array(a.length);
  for (let i2 = 0; i2 < a.length; i2++) {
    arr[i2] = a[i2] ^ b[i2];
  }
  return arr;
}
function normDST(DST) {
  if (!isBytes(DST) && typeof DST !== "string")
    throw new Error("DST must be Uint8Array or ascii string");
  return typeof DST === "string" ? asciiToBytes(DST) : DST;
}
function expand_message_xmd(msg, DST, lenInBytes, H) {
  abytes(msg);
  asafenumber(lenInBytes);
  DST = normDST(DST);
  if (DST.length > 255)
    DST = H(concatBytes(asciiToBytes("H2C-OVERSIZE-DST-"), DST));
  const { outputLen: b_in_bytes, blockLen: r_in_bytes } = H;
  const ell = Math.ceil(lenInBytes / b_in_bytes);
  if (lenInBytes > 65535 || ell > 255)
    throw new Error("expand_message_xmd: invalid lenInBytes");
  const DST_prime = concatBytes(DST, i2osp(DST.length, 1));
  const Z_pad = i2osp(0, r_in_bytes);
  const l_i_b_str = i2osp(lenInBytes, 2);
  const b = new Array(ell);
  const b_0 = H(concatBytes(Z_pad, msg, l_i_b_str, i2osp(0, 1), DST_prime));
  b[0] = H(concatBytes(b_0, i2osp(1, 1), DST_prime));
  for (let i2 = 1; i2 <= ell; i2++) {
    const args = [strxor(b_0, b[i2 - 1]), i2osp(i2 + 1, 1), DST_prime];
    b[i2] = H(concatBytes(...args));
  }
  const pseudo_random_bytes = concatBytes(...b);
  return pseudo_random_bytes.slice(0, lenInBytes);
}
function expand_message_xof(msg, DST, lenInBytes, k, H) {
  abytes(msg);
  asafenumber(lenInBytes);
  DST = normDST(DST);
  if (DST.length > 255) {
    const dkLen = Math.ceil(2 * k / 8);
    DST = H.create({ dkLen }).update(asciiToBytes("H2C-OVERSIZE-DST-")).update(DST).digest();
  }
  if (lenInBytes > 65535 || DST.length > 255)
    throw new Error("expand_message_xof: invalid lenInBytes");
  return H.create({ dkLen: lenInBytes }).update(msg).update(i2osp(lenInBytes, 2)).update(DST).update(i2osp(DST.length, 1)).digest();
}
function hash_to_field(msg, count, options) {
  validateObject(options, {
    p: "bigint",
    m: "number",
    k: "number",
    hash: "function"
  });
  const { p, k, m, hash, expand, DST } = options;
  asafenumber(hash.outputLen, "valid hash");
  abytes(msg);
  asafenumber(count);
  const log2p = p.toString(2).length;
  const L = Math.ceil((log2p + k) / 8);
  const len_in_bytes = count * m * L;
  let prb;
  if (expand === "xmd") {
    prb = expand_message_xmd(msg, DST, len_in_bytes, hash);
  } else if (expand === "xof") {
    prb = expand_message_xof(msg, DST, len_in_bytes, k, hash);
  } else if (expand === "_internal_pass") {
    prb = msg;
  } else {
    throw new Error('expand must be "xmd" or "xof"');
  }
  const u = new Array(count);
  for (let i2 = 0; i2 < count; i2++) {
    const e = new Array(m);
    for (let j = 0; j < m; j++) {
      const elm_offset = L * (j + i2 * m);
      const tv = prb.subarray(elm_offset, elm_offset + L);
      e[j] = mod(os2ip(tv), p);
    }
    u[i2] = e;
  }
  return u;
}
function isogenyMap(field, map) {
  const coeff = map.map((i2) => Array.from(i2).reverse());
  return (x, y) => {
    const [xn, xd, yn, yd] = coeff.map((val) => val.reduce((acc, i2) => field.add(field.mul(acc, x), i2)));
    const [xd_inv, yd_inv] = FpInvertBatch(field, [xd, yd], true);
    x = field.mul(xn, xd_inv);
    y = field.mul(y, field.mul(yn, yd_inv));
    return { x, y };
  };
}
function createHasher2(Point, mapToCurve, defaults) {
  if (typeof mapToCurve !== "function")
    throw new Error("mapToCurve() must be defined");
  function map(num2) {
    return Point.fromAffine(mapToCurve(num2));
  }
  function clear(initial) {
    const P = initial.clearCofactor();
    if (P.equals(Point.ZERO))
      return Point.ZERO;
    P.assertValidity();
    return P;
  }
  return {
    defaults: Object.freeze(defaults),
    Point,
    hashToCurve(msg, options) {
      const opts = Object.assign({}, defaults, options);
      const u = hash_to_field(msg, 2, opts);
      const u0 = map(u[0]);
      const u1 = map(u[1]);
      return clear(u0.add(u1));
    },
    encodeToCurve(msg, options) {
      const optsDst = defaults.encodeDST ? { DST: defaults.encodeDST } : {};
      const opts = Object.assign({}, defaults, optsDst, options);
      const u = hash_to_field(msg, 1, opts);
      const u0 = map(u[0]);
      return clear(u0);
    },
    /** See {@link H2CHasher} */
    mapToCurve(scalars) {
      if (defaults.m === 1) {
        if (typeof scalars !== "bigint")
          throw new Error("expected bigint (m=1)");
        return clear(map([scalars]));
      }
      if (!Array.isArray(scalars))
        throw new Error("expected array of bigints");
      for (const i2 of scalars)
        if (typeof i2 !== "bigint")
          throw new Error("expected array of bigints");
      return clear(map(scalars));
    },
    // hash_to_scalar can produce 0: https://www.rfc-editor.org/errata/eid8393
    // RFC 9380, draft-irtf-cfrg-bbs-signatures-08
    hashToScalar(msg, options) {
      const N = Point.Fn.ORDER;
      const opts = Object.assign({}, defaults, { p: N, m: 1, DST: _DST_scalar }, options);
      return hash_to_field(msg, 1, opts)[0][0];
    }
  };
}
var os2ip, _DST_scalar;
var init_hash_to_curve = __esm({
  "core/node_modules/@noble/curves/abstract/hash-to-curve.js"() {
    init_utils2();
    init_modular();
    os2ip = bytesToNumberBE;
    _DST_scalar = asciiToBytes("HashToScalar-");
  }
});

// core/node_modules/@noble/hashes/hmac.js
var _HMAC, hmac;
var init_hmac = __esm({
  "core/node_modules/@noble/hashes/hmac.js"() {
    init_utils();
    _HMAC = class {
      oHash;
      iHash;
      blockLen;
      outputLen;
      finished = false;
      destroyed = false;
      constructor(hash, key) {
        ahash(hash);
        abytes(key, void 0, "key");
        this.iHash = hash.create();
        if (typeof this.iHash.update !== "function")
          throw new Error("Expected instance of class which extends utils.Hash");
        this.blockLen = this.iHash.blockLen;
        this.outputLen = this.iHash.outputLen;
        const blockLen = this.blockLen;
        const pad = new Uint8Array(blockLen);
        pad.set(key.length > blockLen ? hash.create().update(key).digest() : key);
        for (let i2 = 0; i2 < pad.length; i2++)
          pad[i2] ^= 54;
        this.iHash.update(pad);
        this.oHash = hash.create();
        for (let i2 = 0; i2 < pad.length; i2++)
          pad[i2] ^= 54 ^ 92;
        this.oHash.update(pad);
        clean(pad);
      }
      update(buf) {
        aexists(this);
        this.iHash.update(buf);
        return this;
      }
      digestInto(out) {
        aexists(this);
        abytes(out, this.outputLen, "output");
        this.finished = true;
        this.iHash.digestInto(out);
        this.oHash.update(out);
        this.oHash.digestInto(out);
        this.destroy();
      }
      digest() {
        const out = new Uint8Array(this.oHash.outputLen);
        this.digestInto(out);
        return out;
      }
      _cloneInto(to) {
        to ||= Object.create(Object.getPrototypeOf(this), {});
        const { oHash, iHash, finished, destroyed, blockLen, outputLen } = this;
        to = to;
        to.finished = finished;
        to.destroyed = destroyed;
        to.blockLen = blockLen;
        to.outputLen = outputLen;
        to.oHash = oHash._cloneInto(to.oHash);
        to.iHash = iHash._cloneInto(to.iHash);
        return to;
      }
      clone() {
        return this._cloneInto();
      }
      destroy() {
        this.destroyed = true;
        this.oHash.destroy();
        this.iHash.destroy();
      }
    };
    hmac = (hash, key, message) => new _HMAC(hash, key).update(message).digest();
    hmac.create = (hash, key) => new _HMAC(hash, key);
  }
});

// core/node_modules/@noble/curves/abstract/weierstrass.js
function _splitEndoScalar(k, basis, n) {
  const [[a1, b1], [a2, b2]] = basis;
  const c1 = divNearest(b2 * k, n);
  const c2 = divNearest(-b1 * k, n);
  let k1 = k - c1 * a1 - c2 * a2;
  let k2 = -c1 * b1 - c2 * b2;
  const k1neg = k1 < _0n4;
  const k2neg = k2 < _0n4;
  if (k1neg)
    k1 = -k1;
  if (k2neg)
    k2 = -k2;
  const MAX_NUM = bitMask(Math.ceil(bitLen(n) / 2)) + _1n4;
  if (k1 < _0n4 || k1 >= MAX_NUM || k2 < _0n4 || k2 >= MAX_NUM) {
    throw new Error("splitScalar (endomorphism): failed, k=" + k);
  }
  return { k1neg, k1, k2neg, k2 };
}
function validateSigFormat(format) {
  if (!["compact", "recovered", "der"].includes(format))
    throw new Error('Signature format must be "compact", "recovered", or "der"');
  return format;
}
function validateSigOpts(opts, def) {
  const optsn = {};
  for (let optName of Object.keys(def)) {
    optsn[optName] = opts[optName] === void 0 ? def[optName] : opts[optName];
  }
  abool(optsn.lowS, "lowS");
  abool(optsn.prehash, "prehash");
  if (optsn.format !== void 0)
    validateSigFormat(optsn.format);
  return optsn;
}
function weierstrass(params, extraOpts = {}) {
  const validated = createCurveFields("weierstrass", params, extraOpts);
  const { Fp, Fn } = validated;
  let CURVE = validated.CURVE;
  const { h: cofactor, n: CURVE_ORDER } = CURVE;
  validateObject(extraOpts, {}, {
    allowInfinityPoint: "boolean",
    clearCofactor: "function",
    isTorsionFree: "function",
    fromBytes: "function",
    toBytes: "function",
    endo: "object"
  });
  const { endo } = extraOpts;
  if (endo) {
    if (!Fp.is0(CURVE.a) || typeof endo.beta !== "bigint" || !Array.isArray(endo.basises)) {
      throw new Error('invalid endo: expected "beta": bigint and "basises": array');
    }
  }
  const lengths = getWLengths(Fp, Fn);
  function assertCompressionIsSupported() {
    if (!Fp.isOdd)
      throw new Error("compression is not supported: Field does not have .isOdd()");
  }
  function pointToBytes2(_c, point, isCompressed) {
    const { x, y } = point.toAffine();
    const bx = Fp.toBytes(x);
    abool(isCompressed, "isCompressed");
    if (isCompressed) {
      assertCompressionIsSupported();
      const hasEvenY = !Fp.isOdd(y);
      return concatBytes(pprefix(hasEvenY), bx);
    } else {
      return concatBytes(Uint8Array.of(4), bx, Fp.toBytes(y));
    }
  }
  function pointFromBytes(bytes) {
    abytes(bytes, void 0, "Point");
    const { publicKey: comp, publicKeyUncompressed: uncomp } = lengths;
    const length = bytes.length;
    const head = bytes[0];
    const tail = bytes.subarray(1);
    if (length === comp && (head === 2 || head === 3)) {
      const x = Fp.fromBytes(tail);
      if (!Fp.isValid(x))
        throw new Error("bad point: is not on curve, wrong x");
      const y2 = weierstrassEquation(x);
      let y;
      try {
        y = Fp.sqrt(y2);
      } catch (sqrtError) {
        const err = sqrtError instanceof Error ? ": " + sqrtError.message : "";
        throw new Error("bad point: is not on curve, sqrt error" + err);
      }
      assertCompressionIsSupported();
      const evenY = Fp.isOdd(y);
      const evenH = (head & 1) === 1;
      if (evenH !== evenY)
        y = Fp.neg(y);
      return { x, y };
    } else if (length === uncomp && head === 4) {
      const L = Fp.BYTES;
      const x = Fp.fromBytes(tail.subarray(0, L));
      const y = Fp.fromBytes(tail.subarray(L, L * 2));
      if (!isValidXY(x, y))
        throw new Error("bad point: is not on curve");
      return { x, y };
    } else {
      throw new Error(`bad point: got length ${length}, expected compressed=${comp} or uncompressed=${uncomp}`);
    }
  }
  const encodePoint = extraOpts.toBytes || pointToBytes2;
  const decodePoint = extraOpts.fromBytes || pointFromBytes;
  function weierstrassEquation(x) {
    const x2 = Fp.sqr(x);
    const x3 = Fp.mul(x2, x);
    return Fp.add(Fp.add(x3, Fp.mul(x, CURVE.a)), CURVE.b);
  }
  function isValidXY(x, y) {
    const left = Fp.sqr(y);
    const right = weierstrassEquation(x);
    return Fp.eql(left, right);
  }
  if (!isValidXY(CURVE.Gx, CURVE.Gy))
    throw new Error("bad curve params: generator point");
  const _4a3 = Fp.mul(Fp.pow(CURVE.a, _3n2), _4n2);
  const _27b2 = Fp.mul(Fp.sqr(CURVE.b), BigInt(27));
  if (Fp.is0(Fp.add(_4a3, _27b2)))
    throw new Error("bad curve params: a or b");
  function acoord(title, n, banZero = false) {
    if (!Fp.isValid(n) || banZero && Fp.is0(n))
      throw new Error(`bad point coordinate ${title}`);
    return n;
  }
  function aprjpoint(other) {
    if (!(other instanceof Point))
      throw new Error("Weierstrass Point expected");
  }
  function splitEndoScalarN(k) {
    if (!endo || !endo.basises)
      throw new Error("no endo");
    return _splitEndoScalar(k, endo.basises, Fn.ORDER);
  }
  const toAffineMemo = memoized((p, iz) => {
    const { X, Y, Z } = p;
    if (Fp.eql(Z, Fp.ONE))
      return { x: X, y: Y };
    const is0 = p.is0();
    if (iz == null)
      iz = is0 ? Fp.ONE : Fp.inv(Z);
    const x = Fp.mul(X, iz);
    const y = Fp.mul(Y, iz);
    const zz = Fp.mul(Z, iz);
    if (is0)
      return { x: Fp.ZERO, y: Fp.ZERO };
    if (!Fp.eql(zz, Fp.ONE))
      throw new Error("invZ was invalid");
    return { x, y };
  });
  const assertValidMemo = memoized((p) => {
    if (p.is0()) {
      if (extraOpts.allowInfinityPoint && !Fp.is0(p.Y))
        return;
      throw new Error("bad point: ZERO");
    }
    const { x, y } = p.toAffine();
    if (!Fp.isValid(x) || !Fp.isValid(y))
      throw new Error("bad point: x or y not field elements");
    if (!isValidXY(x, y))
      throw new Error("bad point: equation left != right");
    if (!p.isTorsionFree())
      throw new Error("bad point: not in prime-order subgroup");
    return true;
  });
  function finishEndo(endoBeta, k1p, k2p, k1neg, k2neg) {
    k2p = new Point(Fp.mul(k2p.X, endoBeta), k2p.Y, k2p.Z);
    k1p = negateCt(k1neg, k1p);
    k2p = negateCt(k2neg, k2p);
    return k1p.add(k2p);
  }
  class Point {
    // base / generator point
    static BASE = new Point(CURVE.Gx, CURVE.Gy, Fp.ONE);
    // zero / infinity / identity point
    static ZERO = new Point(Fp.ZERO, Fp.ONE, Fp.ZERO);
    // 0, 1, 0
    // math field
    static Fp = Fp;
    // scalar field
    static Fn = Fn;
    X;
    Y;
    Z;
    /** Does NOT validate if the point is valid. Use `.assertValidity()`. */
    constructor(X, Y, Z) {
      this.X = acoord("x", X);
      this.Y = acoord("y", Y, true);
      this.Z = acoord("z", Z);
      Object.freeze(this);
    }
    static CURVE() {
      return CURVE;
    }
    /** Does NOT validate if the point is valid. Use `.assertValidity()`. */
    static fromAffine(p) {
      const { x, y } = p || {};
      if (!p || !Fp.isValid(x) || !Fp.isValid(y))
        throw new Error("invalid affine point");
      if (p instanceof Point)
        throw new Error("projective point not allowed");
      if (Fp.is0(x) && Fp.is0(y))
        return Point.ZERO;
      return new Point(x, y, Fp.ONE);
    }
    static fromBytes(bytes) {
      const P = Point.fromAffine(decodePoint(abytes(bytes, void 0, "point")));
      P.assertValidity();
      return P;
    }
    static fromHex(hex) {
      return Point.fromBytes(hexToBytes(hex));
    }
    get x() {
      return this.toAffine().x;
    }
    get y() {
      return this.toAffine().y;
    }
    /**
     *
     * @param windowSize
     * @param isLazy true will defer table computation until the first multiplication
     * @returns
     */
    precompute(windowSize = 8, isLazy = true) {
      wnaf.createCache(this, windowSize);
      if (!isLazy)
        this.multiply(_3n2);
      return this;
    }
    // TODO: return `this`
    /** A point on curve is valid if it conforms to equation. */
    assertValidity() {
      assertValidMemo(this);
    }
    hasEvenY() {
      const { y } = this.toAffine();
      if (!Fp.isOdd)
        throw new Error("Field doesn't support isOdd");
      return !Fp.isOdd(y);
    }
    /** Compare one point to another. */
    equals(other) {
      aprjpoint(other);
      const { X: X1, Y: Y1, Z: Z1 } = this;
      const { X: X2, Y: Y2, Z: Z2 } = other;
      const U1 = Fp.eql(Fp.mul(X1, Z2), Fp.mul(X2, Z1));
      const U2 = Fp.eql(Fp.mul(Y1, Z2), Fp.mul(Y2, Z1));
      return U1 && U2;
    }
    /** Flips point to one corresponding to (x, -y) in Affine coordinates. */
    negate() {
      return new Point(this.X, Fp.neg(this.Y), this.Z);
    }
    // Renes-Costello-Batina exception-free doubling formula.
    // There is 30% faster Jacobian formula, but it is not complete.
    // https://eprint.iacr.org/2015/1060, algorithm 3
    // Cost: 8M + 3S + 3*a + 2*b3 + 15add.
    double() {
      const { a, b } = CURVE;
      const b3 = Fp.mul(b, _3n2);
      const { X: X1, Y: Y1, Z: Z1 } = this;
      let X3 = Fp.ZERO, Y3 = Fp.ZERO, Z3 = Fp.ZERO;
      let t0 = Fp.mul(X1, X1);
      let t1 = Fp.mul(Y1, Y1);
      let t2 = Fp.mul(Z1, Z1);
      let t3 = Fp.mul(X1, Y1);
      t3 = Fp.add(t3, t3);
      Z3 = Fp.mul(X1, Z1);
      Z3 = Fp.add(Z3, Z3);
      X3 = Fp.mul(a, Z3);
      Y3 = Fp.mul(b3, t2);
      Y3 = Fp.add(X3, Y3);
      X3 = Fp.sub(t1, Y3);
      Y3 = Fp.add(t1, Y3);
      Y3 = Fp.mul(X3, Y3);
      X3 = Fp.mul(t3, X3);
      Z3 = Fp.mul(b3, Z3);
      t2 = Fp.mul(a, t2);
      t3 = Fp.sub(t0, t2);
      t3 = Fp.mul(a, t3);
      t3 = Fp.add(t3, Z3);
      Z3 = Fp.add(t0, t0);
      t0 = Fp.add(Z3, t0);
      t0 = Fp.add(t0, t2);
      t0 = Fp.mul(t0, t3);
      Y3 = Fp.add(Y3, t0);
      t2 = Fp.mul(Y1, Z1);
      t2 = Fp.add(t2, t2);
      t0 = Fp.mul(t2, t3);
      X3 = Fp.sub(X3, t0);
      Z3 = Fp.mul(t2, t1);
      Z3 = Fp.add(Z3, Z3);
      Z3 = Fp.add(Z3, Z3);
      return new Point(X3, Y3, Z3);
    }
    // Renes-Costello-Batina exception-free addition formula.
    // There is 30% faster Jacobian formula, but it is not complete.
    // https://eprint.iacr.org/2015/1060, algorithm 1
    // Cost: 12M + 0S + 3*a + 3*b3 + 23add.
    add(other) {
      aprjpoint(other);
      const { X: X1, Y: Y1, Z: Z1 } = this;
      const { X: X2, Y: Y2, Z: Z2 } = other;
      let X3 = Fp.ZERO, Y3 = Fp.ZERO, Z3 = Fp.ZERO;
      const a = CURVE.a;
      const b3 = Fp.mul(CURVE.b, _3n2);
      let t0 = Fp.mul(X1, X2);
      let t1 = Fp.mul(Y1, Y2);
      let t2 = Fp.mul(Z1, Z2);
      let t3 = Fp.add(X1, Y1);
      let t4 = Fp.add(X2, Y2);
      t3 = Fp.mul(t3, t4);
      t4 = Fp.add(t0, t1);
      t3 = Fp.sub(t3, t4);
      t4 = Fp.add(X1, Z1);
      let t5 = Fp.add(X2, Z2);
      t4 = Fp.mul(t4, t5);
      t5 = Fp.add(t0, t2);
      t4 = Fp.sub(t4, t5);
      t5 = Fp.add(Y1, Z1);
      X3 = Fp.add(Y2, Z2);
      t5 = Fp.mul(t5, X3);
      X3 = Fp.add(t1, t2);
      t5 = Fp.sub(t5, X3);
      Z3 = Fp.mul(a, t4);
      X3 = Fp.mul(b3, t2);
      Z3 = Fp.add(X3, Z3);
      X3 = Fp.sub(t1, Z3);
      Z3 = Fp.add(t1, Z3);
      Y3 = Fp.mul(X3, Z3);
      t1 = Fp.add(t0, t0);
      t1 = Fp.add(t1, t0);
      t2 = Fp.mul(a, t2);
      t4 = Fp.mul(b3, t4);
      t1 = Fp.add(t1, t2);
      t2 = Fp.sub(t0, t2);
      t2 = Fp.mul(a, t2);
      t4 = Fp.add(t4, t2);
      t0 = Fp.mul(t1, t4);
      Y3 = Fp.add(Y3, t0);
      t0 = Fp.mul(t5, t4);
      X3 = Fp.mul(t3, X3);
      X3 = Fp.sub(X3, t0);
      t0 = Fp.mul(t3, t1);
      Z3 = Fp.mul(t5, Z3);
      Z3 = Fp.add(Z3, t0);
      return new Point(X3, Y3, Z3);
    }
    subtract(other) {
      return this.add(other.negate());
    }
    is0() {
      return this.equals(Point.ZERO);
    }
    /**
     * Constant time multiplication.
     * Uses wNAF method. Windowed method may be 10% faster,
     * but takes 2x longer to generate and consumes 2x memory.
     * Uses precomputes when available.
     * Uses endomorphism for Koblitz curves.
     * @param scalar by which the point would be multiplied
     * @returns New point
     */
    multiply(scalar) {
      const { endo: endo2 } = extraOpts;
      if (!Fn.isValidNot0(scalar))
        throw new Error("invalid scalar: out of range");
      let point, fake;
      const mul = (n) => wnaf.cached(this, n, (p) => normalizeZ(Point, p));
      if (endo2) {
        const { k1neg, k1, k2neg, k2 } = splitEndoScalarN(scalar);
        const { p: k1p, f: k1f } = mul(k1);
        const { p: k2p, f: k2f } = mul(k2);
        fake = k1f.add(k2f);
        point = finishEndo(endo2.beta, k1p, k2p, k1neg, k2neg);
      } else {
        const { p, f } = mul(scalar);
        point = p;
        fake = f;
      }
      return normalizeZ(Point, [point, fake])[0];
    }
    /**
     * Non-constant-time multiplication. Uses double-and-add algorithm.
     * It's faster, but should only be used when you don't care about
     * an exposed secret key e.g. sig verification, which works over *public* keys.
     */
    multiplyUnsafe(sc) {
      const { endo: endo2 } = extraOpts;
      const p = this;
      if (!Fn.isValid(sc))
        throw new Error("invalid scalar: out of range");
      if (sc === _0n4 || p.is0())
        return Point.ZERO;
      if (sc === _1n4)
        return p;
      if (wnaf.hasCache(this))
        return this.multiply(sc);
      if (endo2) {
        const { k1neg, k1, k2neg, k2 } = splitEndoScalarN(sc);
        const { p1, p2 } = mulEndoUnsafe(Point, p, k1, k2);
        return finishEndo(endo2.beta, p1, p2, k1neg, k2neg);
      } else {
        return wnaf.unsafe(p, sc);
      }
    }
    /**
     * Converts Projective point to affine (x, y) coordinates.
     * @param invertedZ Z^-1 (inverted zero) - optional, precomputation is useful for invertBatch
     */
    toAffine(invertedZ) {
      return toAffineMemo(this, invertedZ);
    }
    /**
     * Checks whether Point is free of torsion elements (is in prime subgroup).
     * Always torsion-free for cofactor=1 curves.
     */
    isTorsionFree() {
      const { isTorsionFree } = extraOpts;
      if (cofactor === _1n4)
        return true;
      if (isTorsionFree)
        return isTorsionFree(Point, this);
      return wnaf.unsafe(this, CURVE_ORDER).is0();
    }
    clearCofactor() {
      const { clearCofactor } = extraOpts;
      if (cofactor === _1n4)
        return this;
      if (clearCofactor)
        return clearCofactor(Point, this);
      return this.multiplyUnsafe(cofactor);
    }
    isSmallOrder() {
      return this.multiplyUnsafe(cofactor).is0();
    }
    toBytes(isCompressed = true) {
      abool(isCompressed, "isCompressed");
      this.assertValidity();
      return encodePoint(Point, this, isCompressed);
    }
    toHex(isCompressed = true) {
      return bytesToHex(this.toBytes(isCompressed));
    }
    toString() {
      return `<Point ${this.is0() ? "ZERO" : this.toHex()}>`;
    }
  }
  const bits = Fn.BITS;
  const wnaf = new wNAF(Point, extraOpts.endo ? Math.ceil(bits / 2) : bits);
  Point.BASE.precompute(8);
  return Point;
}
function pprefix(hasEvenY) {
  return Uint8Array.of(hasEvenY ? 2 : 3);
}
function SWUFpSqrtRatio(Fp, Z) {
  const q = Fp.ORDER;
  let l = _0n4;
  for (let o = q - _1n4; o % _2n2 === _0n4; o /= _2n2)
    l += _1n4;
  const c1 = l;
  const _2n_pow_c1_1 = _2n2 << c1 - _1n4 - _1n4;
  const _2n_pow_c1 = _2n_pow_c1_1 * _2n2;
  const c2 = (q - _1n4) / _2n_pow_c1;
  const c3 = (c2 - _1n4) / _2n2;
  const c4 = _2n_pow_c1 - _1n4;
  const c5 = _2n_pow_c1_1;
  const c6 = Fp.pow(Z, c2);
  const c7 = Fp.pow(Z, (c2 + _1n4) / _2n2);
  let sqrtRatio = (u, v) => {
    let tv1 = c6;
    let tv2 = Fp.pow(v, c4);
    let tv3 = Fp.sqr(tv2);
    tv3 = Fp.mul(tv3, v);
    let tv5 = Fp.mul(u, tv3);
    tv5 = Fp.pow(tv5, c3);
    tv5 = Fp.mul(tv5, tv2);
    tv2 = Fp.mul(tv5, v);
    tv3 = Fp.mul(tv5, u);
    let tv4 = Fp.mul(tv3, tv2);
    tv5 = Fp.pow(tv4, c5);
    let isQR = Fp.eql(tv5, Fp.ONE);
    tv2 = Fp.mul(tv3, c7);
    tv5 = Fp.mul(tv4, tv1);
    tv3 = Fp.cmov(tv2, tv3, isQR);
    tv4 = Fp.cmov(tv5, tv4, isQR);
    for (let i2 = c1; i2 > _1n4; i2--) {
      let tv52 = i2 - _2n2;
      tv52 = _2n2 << tv52 - _1n4;
      let tvv5 = Fp.pow(tv4, tv52);
      const e1 = Fp.eql(tvv5, Fp.ONE);
      tv2 = Fp.mul(tv3, tv1);
      tv1 = Fp.mul(tv1, tv1);
      tvv5 = Fp.mul(tv4, tv1);
      tv3 = Fp.cmov(tv2, tv3, e1);
      tv4 = Fp.cmov(tvv5, tv4, e1);
    }
    return { isValid: isQR, value: tv3 };
  };
  if (Fp.ORDER % _4n2 === _3n2) {
    const c12 = (Fp.ORDER - _3n2) / _4n2;
    const c22 = Fp.sqrt(Fp.neg(Z));
    sqrtRatio = (u, v) => {
      let tv1 = Fp.sqr(v);
      const tv2 = Fp.mul(u, v);
      tv1 = Fp.mul(tv1, tv2);
      let y1 = Fp.pow(tv1, c12);
      y1 = Fp.mul(y1, tv2);
      const y2 = Fp.mul(y1, c22);
      const tv3 = Fp.mul(Fp.sqr(y1), v);
      const isQR = Fp.eql(tv3, u);
      let y = Fp.cmov(y2, y1, isQR);
      return { isValid: isQR, value: y };
    };
  }
  return sqrtRatio;
}
function mapToCurveSimpleSWU(Fp, opts) {
  validateField(Fp);
  const { A, B, Z } = opts;
  if (!Fp.isValid(A) || !Fp.isValid(B) || !Fp.isValid(Z))
    throw new Error("mapToCurveSimpleSWU: invalid opts");
  const sqrtRatio = SWUFpSqrtRatio(Fp, Z);
  if (!Fp.isOdd)
    throw new Error("Field does not have .isOdd()");
  return (u) => {
    let tv1, tv2, tv3, tv4, tv5, tv6, x, y;
    tv1 = Fp.sqr(u);
    tv1 = Fp.mul(tv1, Z);
    tv2 = Fp.sqr(tv1);
    tv2 = Fp.add(tv2, tv1);
    tv3 = Fp.add(tv2, Fp.ONE);
    tv3 = Fp.mul(tv3, B);
    tv4 = Fp.cmov(Z, Fp.neg(tv2), !Fp.eql(tv2, Fp.ZERO));
    tv4 = Fp.mul(tv4, A);
    tv2 = Fp.sqr(tv3);
    tv6 = Fp.sqr(tv4);
    tv5 = Fp.mul(tv6, A);
    tv2 = Fp.add(tv2, tv5);
    tv2 = Fp.mul(tv2, tv3);
    tv6 = Fp.mul(tv6, tv4);
    tv5 = Fp.mul(tv6, B);
    tv2 = Fp.add(tv2, tv5);
    x = Fp.mul(tv1, tv3);
    const { isValid, value } = sqrtRatio(tv2, tv6);
    y = Fp.mul(tv1, u);
    y = Fp.mul(y, value);
    x = Fp.cmov(x, tv3, isValid);
    y = Fp.cmov(y, value, isValid);
    const e1 = Fp.isOdd(u) === Fp.isOdd(y);
    y = Fp.cmov(Fp.neg(y), y, e1);
    const tv4_inv = FpInvertBatch(Fp, [tv4], true)[0];
    x = Fp.mul(x, tv4_inv);
    return { x, y };
  };
}
function getWLengths(Fp, Fn) {
  return {
    secretKey: Fn.BYTES,
    publicKey: 1 + Fp.BYTES,
    publicKeyUncompressed: 1 + 2 * Fp.BYTES,
    publicKeyHasPrefix: true,
    signature: 2 * Fn.BYTES
  };
}
function ecdh(Point, ecdhOpts = {}) {
  const { Fn } = Point;
  const randomBytes_ = ecdhOpts.randomBytes || randomBytes;
  const lengths = Object.assign(getWLengths(Point.Fp, Fn), { seed: getMinHashLength(Fn.ORDER) });
  function isValidSecretKey(secretKey) {
    try {
      const num2 = Fn.fromBytes(secretKey);
      return Fn.isValidNot0(num2);
    } catch (error) {
      return false;
    }
  }
  function isValidPublicKey(publicKey, isCompressed) {
    const { publicKey: comp, publicKeyUncompressed } = lengths;
    try {
      const l = publicKey.length;
      if (isCompressed === true && l !== comp)
        return false;
      if (isCompressed === false && l !== publicKeyUncompressed)
        return false;
      return !!Point.fromBytes(publicKey);
    } catch (error) {
      return false;
    }
  }
  function randomSecretKey(seed = randomBytes_(lengths.seed)) {
    return mapHashToField(abytes(seed, lengths.seed, "seed"), Fn.ORDER);
  }
  function getPublicKey2(secretKey, isCompressed = true) {
    return Point.BASE.multiply(Fn.fromBytes(secretKey)).toBytes(isCompressed);
  }
  function isProbPub(item) {
    const { secretKey, publicKey, publicKeyUncompressed } = lengths;
    if (!isBytes(item))
      return void 0;
    if ("_lengths" in Fn && Fn._lengths || secretKey === publicKey)
      return void 0;
    const l = abytes(item, void 0, "key").length;
    return l === publicKey || l === publicKeyUncompressed;
  }
  function getSharedSecret(secretKeyA, publicKeyB, isCompressed = true) {
    if (isProbPub(secretKeyA) === true)
      throw new Error("first arg must be private key");
    if (isProbPub(publicKeyB) === false)
      throw new Error("second arg must be public key");
    const s = Fn.fromBytes(secretKeyA);
    const b = Point.fromBytes(publicKeyB);
    return b.multiply(s).toBytes(isCompressed);
  }
  const utils = {
    isValidSecretKey,
    isValidPublicKey,
    randomSecretKey
  };
  const keygen = createKeygen(randomSecretKey, getPublicKey2);
  return Object.freeze({ getPublicKey: getPublicKey2, getSharedSecret, keygen, Point, utils, lengths });
}
function ecdsa(Point, hash, ecdsaOpts = {}) {
  ahash(hash);
  validateObject(ecdsaOpts, {}, {
    hmac: "function",
    lowS: "boolean",
    randomBytes: "function",
    bits2int: "function",
    bits2int_modN: "function"
  });
  ecdsaOpts = Object.assign({}, ecdsaOpts);
  const randomBytes2 = ecdsaOpts.randomBytes || randomBytes;
  const hmac2 = ecdsaOpts.hmac || ((key, msg) => hmac(hash, key, msg));
  const { Fp, Fn } = Point;
  const { ORDER: CURVE_ORDER, BITS: fnBits } = Fn;
  const { keygen, getPublicKey: getPublicKey2, getSharedSecret, utils, lengths } = ecdh(Point, ecdsaOpts);
  const defaultSigOpts = {
    prehash: true,
    lowS: typeof ecdsaOpts.lowS === "boolean" ? ecdsaOpts.lowS : true,
    format: "compact",
    extraEntropy: false
  };
  const hasLargeCofactor = CURVE_ORDER * _2n2 < Fp.ORDER;
  function isBiggerThanHalfOrder(number) {
    const HALF = CURVE_ORDER >> _1n4;
    return number > HALF;
  }
  function validateRS(title, num2) {
    if (!Fn.isValidNot0(num2))
      throw new Error(`invalid signature ${title}: out of range 1..Point.Fn.ORDER`);
    return num2;
  }
  function assertSmallCofactor() {
    if (hasLargeCofactor)
      throw new Error('"recovered" sig type is not supported for cofactor >2 curves');
  }
  function validateSigLength(bytes, format) {
    validateSigFormat(format);
    const size = lengths.signature;
    const sizer = format === "compact" ? size : format === "recovered" ? size + 1 : void 0;
    return abytes(bytes, sizer);
  }
  class Signature {
    r;
    s;
    recovery;
    constructor(r, s, recovery) {
      this.r = validateRS("r", r);
      this.s = validateRS("s", s);
      if (recovery != null) {
        assertSmallCofactor();
        if (![0, 1, 2, 3].includes(recovery))
          throw new Error("invalid recovery id");
        this.recovery = recovery;
      }
      Object.freeze(this);
    }
    static fromBytes(bytes, format = defaultSigOpts.format) {
      validateSigLength(bytes, format);
      let recid;
      if (format === "der") {
        const { r: r2, s: s2 } = DER.toSig(abytes(bytes));
        return new Signature(r2, s2);
      }
      if (format === "recovered") {
        recid = bytes[0];
        format = "compact";
        bytes = bytes.subarray(1);
      }
      const L = lengths.signature / 2;
      const r = bytes.subarray(0, L);
      const s = bytes.subarray(L, L * 2);
      return new Signature(Fn.fromBytes(r), Fn.fromBytes(s), recid);
    }
    static fromHex(hex, format) {
      return this.fromBytes(hexToBytes(hex), format);
    }
    assertRecovery() {
      const { recovery } = this;
      if (recovery == null)
        throw new Error("invalid recovery id: must be present");
      return recovery;
    }
    addRecoveryBit(recovery) {
      return new Signature(this.r, this.s, recovery);
    }
    recoverPublicKey(messageHash) {
      const { r, s } = this;
      const recovery = this.assertRecovery();
      const radj = recovery === 2 || recovery === 3 ? r + CURVE_ORDER : r;
      if (!Fp.isValid(radj))
        throw new Error("invalid recovery id: sig.r+curve.n != R.x");
      const x = Fp.toBytes(radj);
      const R = Point.fromBytes(concatBytes(pprefix((recovery & 1) === 0), x));
      const ir = Fn.inv(radj);
      const h = bits2int_modN(abytes(messageHash, void 0, "msgHash"));
      const u1 = Fn.create(-h * ir);
      const u2 = Fn.create(s * ir);
      const Q = Point.BASE.multiplyUnsafe(u1).add(R.multiplyUnsafe(u2));
      if (Q.is0())
        throw new Error("invalid recovery: point at infinify");
      Q.assertValidity();
      return Q;
    }
    // Signatures should be low-s, to prevent malleability.
    hasHighS() {
      return isBiggerThanHalfOrder(this.s);
    }
    toBytes(format = defaultSigOpts.format) {
      validateSigFormat(format);
      if (format === "der")
        return hexToBytes(DER.hexFromSig(this));
      const { r, s } = this;
      const rb = Fn.toBytes(r);
      const sb = Fn.toBytes(s);
      if (format === "recovered") {
        assertSmallCofactor();
        return concatBytes(Uint8Array.of(this.assertRecovery()), rb, sb);
      }
      return concatBytes(rb, sb);
    }
    toHex(format) {
      return bytesToHex(this.toBytes(format));
    }
  }
  const bits2int = ecdsaOpts.bits2int || function bits2int_def(bytes) {
    if (bytes.length > 8192)
      throw new Error("input is too large");
    const num2 = bytesToNumberBE(bytes);
    const delta = bytes.length * 8 - fnBits;
    return delta > 0 ? num2 >> BigInt(delta) : num2;
  };
  const bits2int_modN = ecdsaOpts.bits2int_modN || function bits2int_modN_def(bytes) {
    return Fn.create(bits2int(bytes));
  };
  const ORDER_MASK = bitMask(fnBits);
  function int2octets(num2) {
    aInRange("num < 2^" + fnBits, num2, _0n4, ORDER_MASK);
    return Fn.toBytes(num2);
  }
  function validateMsgAndHash(message, prehash) {
    abytes(message, void 0, "message");
    return prehash ? abytes(hash(message), void 0, "prehashed message") : message;
  }
  function prepSig(message, secretKey, opts) {
    const { lowS, prehash, extraEntropy } = validateSigOpts(opts, defaultSigOpts);
    message = validateMsgAndHash(message, prehash);
    const h1int = bits2int_modN(message);
    const d = Fn.fromBytes(secretKey);
    if (!Fn.isValidNot0(d))
      throw new Error("invalid private key");
    const seedArgs = [int2octets(d), int2octets(h1int)];
    if (extraEntropy != null && extraEntropy !== false) {
      const e = extraEntropy === true ? randomBytes2(lengths.secretKey) : extraEntropy;
      seedArgs.push(abytes(e, void 0, "extraEntropy"));
    }
    const seed = concatBytes(...seedArgs);
    const m = h1int;
    function k2sig(kBytes) {
      const k = bits2int(kBytes);
      if (!Fn.isValidNot0(k))
        return;
      const ik = Fn.inv(k);
      const q = Point.BASE.multiply(k).toAffine();
      const r = Fn.create(q.x);
      if (r === _0n4)
        return;
      const s = Fn.create(ik * Fn.create(m + r * d));
      if (s === _0n4)
        return;
      let recovery = (q.x === r ? 0 : 2) | Number(q.y & _1n4);
      let normS = s;
      if (lowS && isBiggerThanHalfOrder(s)) {
        normS = Fn.neg(s);
        recovery ^= 1;
      }
      return new Signature(r, normS, hasLargeCofactor ? void 0 : recovery);
    }
    return { seed, k2sig };
  }
  function sign(message, secretKey, opts = {}) {
    const { seed, k2sig } = prepSig(message, secretKey, opts);
    const drbg = createHmacDrbg(hash.outputLen, Fn.BYTES, hmac2);
    const sig = drbg(seed, k2sig);
    return sig.toBytes(opts.format);
  }
  function verify(signature, message, publicKey, opts = {}) {
    const { lowS, prehash, format } = validateSigOpts(opts, defaultSigOpts);
    publicKey = abytes(publicKey, void 0, "publicKey");
    message = validateMsgAndHash(message, prehash);
    if (!isBytes(signature)) {
      const end = signature instanceof Signature ? ", use sig.toBytes()" : "";
      throw new Error("verify expects Uint8Array signature" + end);
    }
    validateSigLength(signature, format);
    try {
      const sig = Signature.fromBytes(signature, format);
      const P = Point.fromBytes(publicKey);
      if (lowS && sig.hasHighS())
        return false;
      const { r, s } = sig;
      const h = bits2int_modN(message);
      const is = Fn.inv(s);
      const u1 = Fn.create(h * is);
      const u2 = Fn.create(r * is);
      const R = Point.BASE.multiplyUnsafe(u1).add(P.multiplyUnsafe(u2));
      if (R.is0())
        return false;
      const v = Fn.create(R.x);
      return v === r;
    } catch (e) {
      return false;
    }
  }
  function recoverPublicKey(signature, message, opts = {}) {
    const { prehash } = validateSigOpts(opts, defaultSigOpts);
    message = validateMsgAndHash(message, prehash);
    return Signature.fromBytes(signature, "recovered").recoverPublicKey(message).toBytes();
  }
  return Object.freeze({
    keygen,
    getPublicKey: getPublicKey2,
    getSharedSecret,
    utils,
    lengths,
    Point,
    sign,
    verify,
    recoverPublicKey,
    Signature,
    hash
  });
}
var divNearest, DERErr, DER, _0n4, _1n4, _2n2, _3n2, _4n2;
var init_weierstrass = __esm({
  "core/node_modules/@noble/curves/abstract/weierstrass.js"() {
    init_hmac();
    init_utils();
    init_utils2();
    init_curve();
    init_modular();
    divNearest = (num2, den) => (num2 + (num2 >= 0 ? den : -den) / _2n2) / den;
    DERErr = class extends Error {
      constructor(m = "") {
        super(m);
      }
    };
    DER = {
      // asn.1 DER encoding utils
      Err: DERErr,
      // Basic building block is TLV (Tag-Length-Value)
      _tlv: {
        encode: (tag, data) => {
          const { Err: E } = DER;
          if (tag < 0 || tag > 256)
            throw new E("tlv.encode: wrong tag");
          if (data.length & 1)
            throw new E("tlv.encode: unpadded data");
          const dataLen = data.length / 2;
          const len = numberToHexUnpadded(dataLen);
          if (len.length / 2 & 128)
            throw new E("tlv.encode: long form length too big");
          const lenLen = dataLen > 127 ? numberToHexUnpadded(len.length / 2 | 128) : "";
          const t = numberToHexUnpadded(tag);
          return t + lenLen + len + data;
        },
        // v - value, l - left bytes (unparsed)
        decode(tag, data) {
          const { Err: E } = DER;
          let pos = 0;
          if (tag < 0 || tag > 256)
            throw new E("tlv.encode: wrong tag");
          if (data.length < 2 || data[pos++] !== tag)
            throw new E("tlv.decode: wrong tlv");
          const first = data[pos++];
          const isLong = !!(first & 128);
          let length = 0;
          if (!isLong)
            length = first;
          else {
            const lenLen = first & 127;
            if (!lenLen)
              throw new E("tlv.decode(long): indefinite length not supported");
            if (lenLen > 4)
              throw new E("tlv.decode(long): byte length is too big");
            const lengthBytes = data.subarray(pos, pos + lenLen);
            if (lengthBytes.length !== lenLen)
              throw new E("tlv.decode: length bytes not complete");
            if (lengthBytes[0] === 0)
              throw new E("tlv.decode(long): zero leftmost byte");
            for (const b of lengthBytes)
              length = length << 8 | b;
            pos += lenLen;
            if (length < 128)
              throw new E("tlv.decode(long): not minimal encoding");
          }
          const v = data.subarray(pos, pos + length);
          if (v.length !== length)
            throw new E("tlv.decode: wrong value length");
          return { v, l: data.subarray(pos + length) };
        }
      },
      // https://crypto.stackexchange.com/a/57734 Leftmost bit of first byte is 'negative' flag,
      // since we always use positive integers here. It must always be empty:
      // - add zero byte if exists
      // - if next byte doesn't have a flag, leading zero is not allowed (minimal encoding)
      _int: {
        encode(num2) {
          const { Err: E } = DER;
          if (num2 < _0n4)
            throw new E("integer: negative integers are not allowed");
          let hex = numberToHexUnpadded(num2);
          if (Number.parseInt(hex[0], 16) & 8)
            hex = "00" + hex;
          if (hex.length & 1)
            throw new E("unexpected DER parsing assertion: unpadded hex");
          return hex;
        },
        decode(data) {
          const { Err: E } = DER;
          if (data[0] & 128)
            throw new E("invalid signature integer: negative");
          if (data[0] === 0 && !(data[1] & 128))
            throw new E("invalid signature integer: unnecessary leading zero");
          return bytesToNumberBE(data);
        }
      },
      toSig(bytes) {
        const { Err: E, _int: int, _tlv: tlv } = DER;
        const data = abytes(bytes, void 0, "signature");
        const { v: seqBytes, l: seqLeftBytes } = tlv.decode(48, data);
        if (seqLeftBytes.length)
          throw new E("invalid signature: left bytes after parsing");
        const { v: rBytes, l: rLeftBytes } = tlv.decode(2, seqBytes);
        const { v: sBytes, l: sLeftBytes } = tlv.decode(2, rLeftBytes);
        if (sLeftBytes.length)
          throw new E("invalid signature: left bytes after parsing");
        return { r: int.decode(rBytes), s: int.decode(sBytes) };
      },
      hexFromSig(sig) {
        const { _tlv: tlv, _int: int } = DER;
        const rs = tlv.encode(2, int.encode(sig.r));
        const ss = tlv.encode(2, int.encode(sig.s));
        const seq = rs + ss;
        return tlv.encode(48, seq);
      }
    };
    _0n4 = BigInt(0);
    _1n4 = BigInt(1);
    _2n2 = BigInt(2);
    _3n2 = BigInt(3);
    _4n2 = BigInt(4);
  }
});

// core/node_modules/@noble/curves/secp256k1.js
var secp256k1_exports = {};
__export(secp256k1_exports, {
  schnorr: () => schnorr,
  secp256k1: () => secp256k1,
  secp256k1_hasher: () => secp256k1_hasher
});
function sqrtMod(y) {
  const P = secp256k1_CURVE.p;
  const _3n3 = BigInt(3), _6n = BigInt(6), _11n = BigInt(11), _22n = BigInt(22);
  const _23n = BigInt(23), _44n = BigInt(44), _88n = BigInt(88);
  const b2 = y * y * y % P;
  const b3 = b2 * b2 * y % P;
  const b6 = pow2(b3, _3n3, P) * b3 % P;
  const b9 = pow2(b6, _3n3, P) * b3 % P;
  const b11 = pow2(b9, _2n3, P) * b2 % P;
  const b22 = pow2(b11, _11n, P) * b11 % P;
  const b44 = pow2(b22, _22n, P) * b22 % P;
  const b88 = pow2(b44, _44n, P) * b44 % P;
  const b176 = pow2(b88, _88n, P) * b88 % P;
  const b220 = pow2(b176, _44n, P) * b44 % P;
  const b223 = pow2(b220, _3n3, P) * b3 % P;
  const t1 = pow2(b223, _23n, P) * b22 % P;
  const t2 = pow2(t1, _6n, P) * b2 % P;
  const root = pow2(t2, _2n3, P);
  if (!Fpk1.eql(Fpk1.sqr(root), y))
    throw new Error("Cannot find square root");
  return root;
}
function taggedHash(tag, ...messages) {
  let tagP = TAGGED_HASH_PREFIXES[tag];
  if (tagP === void 0) {
    const tagH = sha256(asciiToBytes(tag));
    tagP = concatBytes(tagH, tagH);
    TAGGED_HASH_PREFIXES[tag] = tagP;
  }
  return sha256(concatBytes(tagP, ...messages));
}
function schnorrGetExtPubKey(priv) {
  const { Fn, BASE } = Pointk1;
  const d_ = Fn.fromBytes(priv);
  const p = BASE.multiply(d_);
  const scalar = hasEven(p.y) ? d_ : Fn.neg(d_);
  return { scalar, bytes: pointToBytes(p) };
}
function lift_x(x) {
  const Fp = Fpk1;
  if (!Fp.isValidNot0(x))
    throw new Error("invalid x: Fail if x \u2265 p");
  const xx = Fp.create(x * x);
  const c = Fp.create(xx * x + BigInt(7));
  let y = Fp.sqrt(c);
  if (!hasEven(y))
    y = Fp.neg(y);
  const p = Pointk1.fromAffine({ x, y });
  p.assertValidity();
  return p;
}
function challenge(...args) {
  return Pointk1.Fn.create(num(taggedHash("BIP0340/challenge", ...args)));
}
function schnorrGetPublicKey(secretKey) {
  return schnorrGetExtPubKey(secretKey).bytes;
}
function schnorrSign(message, secretKey, auxRand = randomBytes(32)) {
  const { Fn } = Pointk1;
  const m = abytes(message, void 0, "message");
  const { bytes: px, scalar: d } = schnorrGetExtPubKey(secretKey);
  const a = abytes(auxRand, 32, "auxRand");
  const t = Fn.toBytes(d ^ num(taggedHash("BIP0340/aux", a)));
  const rand = taggedHash("BIP0340/nonce", t, px, m);
  const { bytes: rx, scalar: k } = schnorrGetExtPubKey(rand);
  const e = challenge(rx, px, m);
  const sig = new Uint8Array(64);
  sig.set(rx, 0);
  sig.set(Fn.toBytes(Fn.create(k + e * d)), 32);
  if (!schnorrVerify(sig, m, px))
    throw new Error("sign: Invalid signature produced");
  return sig;
}
function schnorrVerify(signature, message, publicKey) {
  const { Fp, Fn, BASE } = Pointk1;
  const sig = abytes(signature, 64, "signature");
  const m = abytes(message, void 0, "message");
  const pub = abytes(publicKey, 32, "publicKey");
  try {
    const P = lift_x(num(pub));
    const r = num(sig.subarray(0, 32));
    if (!Fp.isValidNot0(r))
      return false;
    const s = num(sig.subarray(32, 64));
    if (!Fn.isValidNot0(s))
      return false;
    const e = challenge(Fn.toBytes(r), pointToBytes(P), m);
    const R = BASE.multiplyUnsafe(s).add(P.multiplyUnsafe(Fn.neg(e)));
    const { x, y } = R.toAffine();
    if (R.is0() || !hasEven(y) || x !== r)
      return false;
    return true;
  } catch (error) {
    return false;
  }
}
var secp256k1_CURVE, secp256k1_ENDO, _0n5, _2n3, Fpk1, Pointk1, secp256k1, TAGGED_HASH_PREFIXES, pointToBytes, hasEven, num, schnorr, isoMap, mapSWU, secp256k1_hasher;
var init_secp256k1 = __esm({
  "core/node_modules/@noble/curves/secp256k1.js"() {
    init_sha2();
    init_utils();
    init_curve();
    init_hash_to_curve();
    init_modular();
    init_weierstrass();
    init_utils2();
    secp256k1_CURVE = {
      p: BigInt("0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f"),
      n: BigInt("0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141"),
      h: BigInt(1),
      a: BigInt(0),
      b: BigInt(7),
      Gx: BigInt("0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798"),
      Gy: BigInt("0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8")
    };
    secp256k1_ENDO = {
      beta: BigInt("0x7ae96a2b657c07106e64479eac3434e99cf0497512f58995c1396c28719501ee"),
      basises: [
        [BigInt("0x3086d221a7d46bcde86c90e49284eb15"), -BigInt("0xe4437ed6010e88286f547fa90abfe4c3")],
        [BigInt("0x114ca50f7a8e2f3f657c1108d9d44cfd8"), BigInt("0x3086d221a7d46bcde86c90e49284eb15")]
      ]
    };
    _0n5 = /* @__PURE__ */ BigInt(0);
    _2n3 = /* @__PURE__ */ BigInt(2);
    Fpk1 = Field(secp256k1_CURVE.p, { sqrt: sqrtMod });
    Pointk1 = /* @__PURE__ */ weierstrass(secp256k1_CURVE, {
      Fp: Fpk1,
      endo: secp256k1_ENDO
    });
    secp256k1 = /* @__PURE__ */ ecdsa(Pointk1, sha256);
    TAGGED_HASH_PREFIXES = {};
    pointToBytes = (point) => point.toBytes(true).slice(1);
    hasEven = (y) => y % _2n3 === _0n5;
    num = bytesToNumberBE;
    schnorr = /* @__PURE__ */ (() => {
      const size = 32;
      const seedLength = 48;
      const randomSecretKey = (seed = randomBytes(seedLength)) => {
        return mapHashToField(seed, secp256k1_CURVE.n);
      };
      return {
        keygen: createKeygen(randomSecretKey, schnorrGetPublicKey),
        getPublicKey: schnorrGetPublicKey,
        sign: schnorrSign,
        verify: schnorrVerify,
        Point: Pointk1,
        utils: {
          randomSecretKey,
          taggedHash,
          lift_x,
          pointToBytes
        },
        lengths: {
          secretKey: size,
          publicKey: size,
          publicKeyHasPrefix: false,
          signature: size * 2,
          seed: seedLength
        }
      };
    })();
    isoMap = /* @__PURE__ */ (() => isogenyMap(Fpk1, [
      // xNum
      [
        "0x8e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38daaaaa8c7",
        "0x7d3d4c80bc321d5b9f315cea7fd44c5d595d2fc0bf63b92dfff1044f17c6581",
        "0x534c328d23f234e6e2a413deca25caece4506144037c40314ecbd0b53d9dd262",
        "0x8e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38daaaaa88c"
      ],
      // xDen
      [
        "0xd35771193d94918a9ca34ccbb7b640dd86cd409542f8487d9fe6b745781eb49b",
        "0xedadc6f64383dc1df7c4b2d51b54225406d36b641f5e41bbc52a56612a8c6d14",
        "0x0000000000000000000000000000000000000000000000000000000000000001"
        // LAST 1
      ],
      // yNum
      [
        "0x4bda12f684bda12f684bda12f684bda12f684bda12f684bda12f684b8e38e23c",
        "0xc75e0c32d5cb7c0fa9d0a54b12a0a6d5647ab046d686da6fdffc90fc201d71a3",
        "0x29a6194691f91a73715209ef6512e576722830a201be2018a765e85a9ecee931",
        "0x2f684bda12f684bda12f684bda12f684bda12f684bda12f684bda12f38e38d84"
      ],
      // yDen
      [
        "0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffff93b",
        "0x7a06534bb8bdb49fd5e9e6632722c2989467c1bfc8e8d978dfb425d2685c2573",
        "0x6484aa716545ca2cf3a70c3fa8fe337e0a3d21162f0d6299a7bf8192bfd2a76f",
        "0x0000000000000000000000000000000000000000000000000000000000000001"
        // LAST 1
      ]
    ].map((i2) => i2.map((j) => BigInt(j)))))();
    mapSWU = /* @__PURE__ */ (() => mapToCurveSimpleSWU(Fpk1, {
      A: BigInt("0x3f8731abdd661adca08a5558f0f5d272e953d363cb6f0e5d405447c01a444533"),
      B: BigInt("1771"),
      Z: Fpk1.create(BigInt("-11"))
    }))();
    secp256k1_hasher = /* @__PURE__ */ (() => createHasher2(Pointk1, (scalars) => {
      const { x, y } = mapSWU(Fpk1.create(scalars[0]));
      return isoMap(x, y);
    }, {
      DST: "secp256k1_XMD:SHA-256_SSWU_RO_",
      encodeDST: "secp256k1_XMD:SHA-256_SSWU_NU_",
      p: Fpk1.ORDER,
      m: 1,
      k: 128,
      expand: "xmd",
      hash: sha256
    }))();
  }
});

// core/node_modules/@noble/hashes/pbkdf2.js
function pbkdf2Init(hash, _password, _salt, _opts) {
  ahash(hash);
  const opts = checkOpts({ dkLen: 32, asyncTick: 10 }, _opts);
  const { c, dkLen, asyncTick } = opts;
  anumber(c, "c");
  anumber(dkLen, "dkLen");
  anumber(asyncTick, "asyncTick");
  if (c < 1)
    throw new Error("iterations (c) must be >= 1");
  const password = kdfInputToBytes(_password, "password");
  const salt = kdfInputToBytes(_salt, "salt");
  const DK = new Uint8Array(dkLen);
  const PRF = hmac.create(hash, password);
  const PRFSalt = PRF._cloneInto().update(salt);
  return { c, dkLen, asyncTick, DK, PRF, PRFSalt };
}
function pbkdf2Output(PRF, PRFSalt, DK, prfW, u) {
  PRF.destroy();
  PRFSalt.destroy();
  if (prfW)
    prfW.destroy();
  clean(u);
  return DK;
}
function pbkdf2(hash, password, salt, opts) {
  const { c, dkLen, DK, PRF, PRFSalt } = pbkdf2Init(hash, password, salt, opts);
  let prfW;
  const arr = new Uint8Array(4);
  const view = createView(arr);
  const u = new Uint8Array(PRF.outputLen);
  for (let ti = 1, pos = 0; pos < dkLen; ti++, pos += PRF.outputLen) {
    const Ti = DK.subarray(pos, pos + PRF.outputLen);
    view.setInt32(0, ti, false);
    (prfW = PRFSalt._cloneInto(prfW)).update(arr).digestInto(u);
    Ti.set(u.subarray(0, Ti.length));
    for (let ui = 1; ui < c; ui++) {
      PRF._cloneInto(prfW).update(u).digestInto(u);
      for (let i2 = 0; i2 < Ti.length; i2++)
        Ti[i2] ^= u[i2];
    }
  }
  return pbkdf2Output(PRF, PRFSalt, DK, prfW, u);
}
var init_pbkdf2 = __esm({
  "core/node_modules/@noble/hashes/pbkdf2.js"() {
    init_hmac();
    init_utils();
  }
});

// core/node_modules/@noble/hashes/scrypt.js
var scrypt_exports = {};
__export(scrypt_exports, {
  scrypt: () => scrypt,
  scryptAsync: () => scryptAsync
});
function XorAndSalsa(prev, pi, input, ii, out, oi) {
  let y00 = prev[pi++] ^ input[ii++], y01 = prev[pi++] ^ input[ii++];
  let y02 = prev[pi++] ^ input[ii++], y03 = prev[pi++] ^ input[ii++];
  let y04 = prev[pi++] ^ input[ii++], y05 = prev[pi++] ^ input[ii++];
  let y06 = prev[pi++] ^ input[ii++], y07 = prev[pi++] ^ input[ii++];
  let y08 = prev[pi++] ^ input[ii++], y09 = prev[pi++] ^ input[ii++];
  let y10 = prev[pi++] ^ input[ii++], y11 = prev[pi++] ^ input[ii++];
  let y12 = prev[pi++] ^ input[ii++], y13 = prev[pi++] ^ input[ii++];
  let y14 = prev[pi++] ^ input[ii++], y15 = prev[pi++] ^ input[ii++];
  let x00 = y00, x01 = y01, x02 = y02, x03 = y03, x04 = y04, x05 = y05, x06 = y06, x07 = y07, x08 = y08, x09 = y09, x10 = y10, x11 = y11, x12 = y12, x13 = y13, x14 = y14, x15 = y15;
  for (let i2 = 0; i2 < 8; i2 += 2) {
    x04 ^= rotl(x00 + x12 | 0, 7);
    x08 ^= rotl(x04 + x00 | 0, 9);
    x12 ^= rotl(x08 + x04 | 0, 13);
    x00 ^= rotl(x12 + x08 | 0, 18);
    x09 ^= rotl(x05 + x01 | 0, 7);
    x13 ^= rotl(x09 + x05 | 0, 9);
    x01 ^= rotl(x13 + x09 | 0, 13);
    x05 ^= rotl(x01 + x13 | 0, 18);
    x14 ^= rotl(x10 + x06 | 0, 7);
    x02 ^= rotl(x14 + x10 | 0, 9);
    x06 ^= rotl(x02 + x14 | 0, 13);
    x10 ^= rotl(x06 + x02 | 0, 18);
    x03 ^= rotl(x15 + x11 | 0, 7);
    x07 ^= rotl(x03 + x15 | 0, 9);
    x11 ^= rotl(x07 + x03 | 0, 13);
    x15 ^= rotl(x11 + x07 | 0, 18);
    x01 ^= rotl(x00 + x03 | 0, 7);
    x02 ^= rotl(x01 + x00 | 0, 9);
    x03 ^= rotl(x02 + x01 | 0, 13);
    x00 ^= rotl(x03 + x02 | 0, 18);
    x06 ^= rotl(x05 + x04 | 0, 7);
    x07 ^= rotl(x06 + x05 | 0, 9);
    x04 ^= rotl(x07 + x06 | 0, 13);
    x05 ^= rotl(x04 + x07 | 0, 18);
    x11 ^= rotl(x10 + x09 | 0, 7);
    x08 ^= rotl(x11 + x10 | 0, 9);
    x09 ^= rotl(x08 + x11 | 0, 13);
    x10 ^= rotl(x09 + x08 | 0, 18);
    x12 ^= rotl(x15 + x14 | 0, 7);
    x13 ^= rotl(x12 + x15 | 0, 9);
    x14 ^= rotl(x13 + x12 | 0, 13);
    x15 ^= rotl(x14 + x13 | 0, 18);
  }
  out[oi++] = y00 + x00 | 0;
  out[oi++] = y01 + x01 | 0;
  out[oi++] = y02 + x02 | 0;
  out[oi++] = y03 + x03 | 0;
  out[oi++] = y04 + x04 | 0;
  out[oi++] = y05 + x05 | 0;
  out[oi++] = y06 + x06 | 0;
  out[oi++] = y07 + x07 | 0;
  out[oi++] = y08 + x08 | 0;
  out[oi++] = y09 + x09 | 0;
  out[oi++] = y10 + x10 | 0;
  out[oi++] = y11 + x11 | 0;
  out[oi++] = y12 + x12 | 0;
  out[oi++] = y13 + x13 | 0;
  out[oi++] = y14 + x14 | 0;
  out[oi++] = y15 + x15 | 0;
}
function BlockMix(input, ii, out, oi, r) {
  let head = oi + 0;
  let tail = oi + 16 * r;
  for (let i2 = 0; i2 < 16; i2++)
    out[tail + i2] = input[ii + (2 * r - 1) * 16 + i2];
  for (let i2 = 0; i2 < r; i2++, head += 16, ii += 16) {
    XorAndSalsa(out, tail, input, ii, out, head);
    if (i2 > 0)
      tail += 16;
    XorAndSalsa(out, head, input, ii += 16, out, tail);
  }
}
function scryptInit(password, salt, _opts) {
  const opts = checkOpts({
    dkLen: 32,
    asyncTick: 10,
    maxmem: 1024 ** 3 + 1024
  }, _opts);
  const { N, r, p, dkLen, asyncTick, maxmem, onProgress } = opts;
  anumber(N, "N");
  anumber(r, "r");
  anumber(p, "p");
  anumber(dkLen, "dkLen");
  anumber(asyncTick, "asyncTick");
  anumber(maxmem, "maxmem");
  if (onProgress !== void 0 && typeof onProgress !== "function")
    throw new Error("progressCb must be a function");
  const blockSize = 128 * r;
  const blockSize32 = blockSize / 4;
  const pow32 = Math.pow(2, 32);
  if (N <= 1 || (N & N - 1) !== 0 || N > pow32)
    throw new Error('"N" expected a power of 2, and 2^1 <= N <= 2^32');
  if (p < 1 || p > (pow32 - 1) * 32 / blockSize)
    throw new Error('"p" expected integer 1..((2^32 - 1) * 32) / (128 * r)');
  if (dkLen < 1 || dkLen > (pow32 - 1) * 32)
    throw new Error('"dkLen" expected integer 1..(2^32 - 1) * 32');
  const memUsed = blockSize * (N + p);
  if (memUsed > maxmem)
    throw new Error('"maxmem" limit was hit, expected 128*r*(N+p) <= "maxmem"=' + maxmem);
  const B = pbkdf2(sha256, password, salt, { c: 1, dkLen: blockSize * p });
  const B32 = u32(B);
  const V = u32(new Uint8Array(blockSize * N));
  const tmp = u32(new Uint8Array(blockSize));
  let blockMixCb = () => {
  };
  if (onProgress) {
    const totalBlockMix = 2 * N * p;
    const callbackPer = Math.max(Math.floor(totalBlockMix / 1e4), 1);
    let blockMixCnt = 0;
    blockMixCb = () => {
      blockMixCnt++;
      if (onProgress && (!(blockMixCnt % callbackPer) || blockMixCnt === totalBlockMix))
        onProgress(blockMixCnt / totalBlockMix);
    };
  }
  return { N, r, p, dkLen, blockSize32, V, B32, B, tmp, blockMixCb, asyncTick };
}
function scryptOutput(password, dkLen, B, V, tmp) {
  const res = pbkdf2(sha256, password, B, { c: 1, dkLen });
  clean(B, V, tmp);
  return res;
}
function scrypt(password, salt, opts) {
  const { N, r, p, dkLen, blockSize32, V, B32, B, tmp, blockMixCb } = scryptInit(password, salt, opts);
  swap32IfBE(B32);
  for (let pi = 0; pi < p; pi++) {
    const Pi = blockSize32 * pi;
    for (let i2 = 0; i2 < blockSize32; i2++)
      V[i2] = B32[Pi + i2];
    for (let i2 = 0, pos = 0; i2 < N - 1; i2++) {
      BlockMix(V, pos, V, pos += blockSize32, r);
      blockMixCb();
    }
    BlockMix(V, (N - 1) * blockSize32, B32, Pi, r);
    blockMixCb();
    for (let i2 = 0; i2 < N; i2++) {
      const j = (B32[Pi + blockSize32 - 16] & N - 1) >>> 0;
      for (let k = 0; k < blockSize32; k++)
        tmp[k] = B32[Pi + k] ^ V[j * blockSize32 + k];
      BlockMix(tmp, 0, B32, Pi, r);
      blockMixCb();
    }
  }
  swap32IfBE(B32);
  return scryptOutput(password, dkLen, B, V, tmp);
}
async function scryptAsync(password, salt, opts) {
  const { N, r, p, dkLen, blockSize32, V, B32, B, tmp, blockMixCb, asyncTick } = scryptInit(password, salt, opts);
  swap32IfBE(B32);
  for (let pi = 0; pi < p; pi++) {
    const Pi = blockSize32 * pi;
    for (let i2 = 0; i2 < blockSize32; i2++)
      V[i2] = B32[Pi + i2];
    let pos = 0;
    await asyncLoop(N - 1, asyncTick, () => {
      BlockMix(V, pos, V, pos += blockSize32, r);
      blockMixCb();
    });
    BlockMix(V, (N - 1) * blockSize32, B32, Pi, r);
    blockMixCb();
    await asyncLoop(N, asyncTick, () => {
      const j = (B32[Pi + blockSize32 - 16] & N - 1) >>> 0;
      for (let k = 0; k < blockSize32; k++)
        tmp[k] = B32[Pi + k] ^ V[j * blockSize32 + k];
      BlockMix(tmp, 0, B32, Pi, r);
      blockMixCb();
    });
  }
  swap32IfBE(B32);
  return scryptOutput(password, dkLen, B, V, tmp);
}
var init_scrypt = __esm({
  "core/node_modules/@noble/hashes/scrypt.js"() {
    init_pbkdf2();
    init_sha2();
    init_utils();
  }
});

// core/lib/keyFormat.js
var require_keyFormat = __commonJS({
  "core/lib/keyFormat.js"(exports, module) {
    "use strict";
    var PAYLOAD_VERSION = 1;
    var ALGORITHM = "aes-256-gcm";
    var KDF = "scrypt";
    var SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 };
    var KEY_BYTES = 32;
    var SALT_BYTES = 16;
    var IV_BYTES = 12;
    var AUTH_TAG_BYTES = 16;
    function bytesToHex2(bytes) {
      let hex = "";
      for (let i2 = 0; i2 < bytes.length; i2++) {
        hex += bytes[i2].toString(16).padStart(2, "0");
      }
      return hex;
    }
    function hexToBytes2(hex) {
      if (typeof hex !== "string" || hex.length % 2 !== 0) {
        throw new Error("invalid hex string");
      }
      const out = new Uint8Array(hex.length / 2);
      for (let i2 = 0; i2 < out.length; i2++) {
        const byte = parseInt(hex.substr(i2 * 2, 2), 16);
        if (Number.isNaN(byte)) throw new Error("invalid hex string");
        out[i2] = byte;
      }
      return out;
    }
    function concatBytes2(a, b) {
      const out = new Uint8Array(a.length + b.length);
      out.set(a, 0);
      out.set(b, a.length);
      return out;
    }
    function buildPayload({ salt, iv, authTag, ciphertext }) {
      return {
        version: PAYLOAD_VERSION,
        algorithm: ALGORITHM,
        kdf: KDF,
        salt: bytesToHex2(salt),
        iv: bytesToHex2(iv),
        authTag: bytesToHex2(authTag),
        ciphertext: bytesToHex2(ciphertext)
      };
    }
    function parsePayload(payload) {
      if (!payload || typeof payload !== "object") {
        throw new Error("key file is not a Common Credo key payload.");
      }
      if (payload.version !== PAYLOAD_VERSION) {
        throw new Error(`unsupported key file version: ${payload.version}`);
      }
      if (payload.algorithm !== ALGORITHM || payload.kdf !== KDF) {
        throw new Error("key file uses an unexpected algorithm or KDF.");
      }
      for (const field of ["salt", "iv", "authTag", "ciphertext"]) {
        if (typeof payload[field] !== "string") {
          throw new Error(`key file is missing the "${field}" field.`);
        }
      }
      return {
        salt: hexToBytes2(payload.salt),
        iv: hexToBytes2(payload.iv),
        authTag: hexToBytes2(payload.authTag),
        ciphertext: hexToBytes2(payload.ciphertext)
      };
    }
    module.exports = {
      PAYLOAD_VERSION,
      ALGORITHM,
      KDF,
      SCRYPT_PARAMS,
      KEY_BYTES,
      SALT_BYTES,
      IV_BYTES,
      AUTH_TAG_BYTES,
      bytesToHex: bytesToHex2,
      hexToBytes: hexToBytes2,
      concatBytes: concatBytes2,
      buildPayload,
      parsePayload
    };
  }
});

// core/lib/keyCrypto.web.js
var require_keyCrypto_web = __commonJS({
  "core/lib/keyCrypto.web.js"(exports, module) {
    "use strict";
    var { scryptAsync: scryptAsync2 } = (init_scrypt(), __toCommonJS(scrypt_exports));
    var {
      SCRYPT_PARAMS,
      KEY_BYTES,
      SALT_BYTES,
      IV_BYTES,
      AUTH_TAG_BYTES,
      buildPayload,
      parsePayload,
      concatBytes: concatBytes2
    } = require_keyFormat();
    function subtle() {
      const c = globalThis.crypto;
      if (!c || !c.subtle) {
        throw new Error("WebCrypto (crypto.subtle) is unavailable in this environment.");
      }
      return c.subtle;
    }
    function randomBytes2(n) {
      const out = new Uint8Array(n);
      globalThis.crypto.getRandomValues(out);
      return out;
    }
    async function deriveKey(password, salt) {
      const pw = new TextEncoder().encode(password);
      return scryptAsync2(pw, salt, {
        N: SCRYPT_PARAMS.N,
        r: SCRYPT_PARAMS.r,
        p: SCRYPT_PARAMS.p,
        dkLen: KEY_BYTES
      });
    }
    async function importAesKey(rawKeyBytes) {
      return subtle().importKey("raw", rawKeyBytes, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
    }
    async function encryptSecretKey2(secretKey, password) {
      const salt = randomBytes2(SALT_BYTES);
      const iv = randomBytes2(IV_BYTES);
      const aesKey = await importAesKey(await deriveKey(password, salt));
      const sealed = new Uint8Array(
        await subtle().encrypt({ name: "AES-GCM", iv }, aesKey, new Uint8Array(secretKey))
      );
      const ciphertext = sealed.slice(0, sealed.length - AUTH_TAG_BYTES);
      const authTag = sealed.slice(sealed.length - AUTH_TAG_BYTES);
      return buildPayload({ salt, iv, authTag, ciphertext });
    }
    async function decryptSecretKey2(payload, password) {
      const { salt, iv, authTag, ciphertext } = parsePayload(payload);
      const aesKey = await importAesKey(await deriveKey(password, salt));
      const sealed = concatBytes2(ciphertext, authTag);
      let plain;
      try {
        plain = await subtle().decrypt({ name: "AES-GCM", iv }, aesKey, sealed);
      } catch (e) {
        throw new Error("Wrong password, or key file is corrupted.");
      }
      return new Uint8Array(plain);
    }
    function isSupported() {
      return !!(globalThis.crypto && globalThis.crypto.subtle && globalThis.crypto.getRandomValues);
    }
    module.exports = { encryptSecretKey: encryptSecretKey2, decryptSecretKey: decryptSecretKey2, isSupported };
  }
});

// core/node_modules/nostr-tools/lib/cjs/pure.js
var require_pure = __commonJS({
  "core/node_modules/nostr-tools/lib/cjs/pure.js"(exports, module) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod2) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod2);
    var pure_exports = {};
    __export2(pure_exports, {
      finalizeEvent: () => finalizeEvent2,
      generateSecretKey: () => generateSecretKey2,
      getEventHash: () => getEventHash2,
      getPublicKey: () => getPublicKey2,
      serializeEvent: () => serializeEvent2,
      sortEvents: () => sortEvents,
      validateEvent: () => validateEvent2,
      verifiedSymbol: () => verifiedSymbol2,
      verifyEvent: () => verifyEvent2
    });
    module.exports = __toCommonJS2(pure_exports);
    var import_secp256k12 = (init_secp256k1(), __toCommonJS(secp256k1_exports));
    var import_utils32 = (init_utils(), __toCommonJS(utils_exports));
    var import_utils16 = (init_utils(), __toCommonJS(utils_exports));
    var utf8Decoder2 = new TextDecoder("utf-8");
    var utf8Encoder2 = new TextEncoder();
    function isHex322(input) {
      for (let i22 = 0; i22 < 64; i22++) {
        let cc = input.charCodeAt(i22);
        if (isNaN(cc) || cc < 48 || cc > 102 || cc > 57 && cc < 97) {
          return false;
        }
      }
      return true;
    }
    var verifiedSymbol2 = Symbol("verified");
    var isRecord2 = (obj) => obj instanceof Object;
    function validateEvent2(event) {
      if (!isRecord2(event))
        return false;
      if (typeof event.kind !== "number")
        return false;
      if (typeof event.content !== "string")
        return false;
      if (typeof event.created_at !== "number")
        return false;
      if (typeof event.pubkey !== "string")
        return false;
      if (!isHex322(event.pubkey))
        return false;
      if (!Array.isArray(event.tags))
        return false;
      for (let i22 = 0; i22 < event.tags.length; i22++) {
        let tag = event.tags[i22];
        if (!Array.isArray(tag))
          return false;
        for (let j = 0; j < tag.length; j++) {
          if (typeof tag[j] !== "string")
            return false;
        }
      }
      return true;
    }
    function sortEvents(events) {
      return events.sort((a, b) => {
        if (a.created_at !== b.created_at) {
          return b.created_at - a.created_at;
        }
        return a.id.localeCompare(b.id);
      });
    }
    var import_sha24 = (init_sha2(), __toCommonJS(sha2_exports));
    var JS2 = class {
      generateSecretKey() {
        return import_secp256k12.schnorr.utils.randomSecretKey();
      }
      getPublicKey(secretKey) {
        return (0, import_utils32.bytesToHex)(import_secp256k12.schnorr.getPublicKey(secretKey));
      }
      finalizeEvent(t, secretKey) {
        const event = t;
        event.pubkey = (0, import_utils32.bytesToHex)(import_secp256k12.schnorr.getPublicKey(secretKey));
        event.id = getEventHash2(event);
        event.sig = (0, import_utils32.bytesToHex)(import_secp256k12.schnorr.sign((0, import_utils32.hexToBytes)(getEventHash2(event)), secretKey));
        event[verifiedSymbol2] = true;
        return event;
      }
      verifyEvent(event) {
        if (typeof event[verifiedSymbol2] === "boolean")
          return event[verifiedSymbol2];
        try {
          const hash = getEventHash2(event);
          if (hash !== event.id) {
            event[verifiedSymbol2] = false;
            return false;
          }
          const valid = import_secp256k12.schnorr.verify((0, import_utils32.hexToBytes)(event.sig), (0, import_utils32.hexToBytes)(hash), (0, import_utils32.hexToBytes)(event.pubkey));
          event[verifiedSymbol2] = valid;
          return valid;
        } catch (err) {
          event[verifiedSymbol2] = false;
          return false;
        }
      }
    };
    function serializeEvent2(evt) {
      if (!validateEvent2(evt))
        throw new Error("can't serialize event with wrong or missing properties");
      return JSON.stringify([0, evt.pubkey, evt.created_at, evt.kind, evt.tags, evt.content]);
    }
    function getEventHash2(event) {
      let eventHash = (0, import_sha24.sha256)(utf8Encoder2.encode(serializeEvent2(event)));
      return (0, import_utils32.bytesToHex)(eventHash);
    }
    var i2 = new JS2();
    var generateSecretKey2 = i2.generateSecretKey;
    var getPublicKey2 = i2.getPublicKey;
    var finalizeEvent2 = i2.finalizeEvent;
    var verifyEvent2 = i2.verifyEvent;
  }
});

// core/lib/claimTypes.js
var require_claimTypes = __commonJS({
  "core/lib/claimTypes.js"(exports, module) {
    "use strict";
    var CORE_CLAIM_TYPES = {
      loan_repaid: { creditJudgement: true },
      loan_defaulted: { creditJudgement: true },
      trade_credit_honoured: { creditJudgement: true },
      trade_credit_defaulted: { creditJudgement: true },
      supplier_payments_record: { creditJudgement: true },
      savings_record: { creditJudgement: false },
      membership_good_standing: { creditJudgement: false },
      registration_licence_fact: { creditJudgement: false },
      character_vouch: { creditJudgement: false }
    };
    var HOLDER_IDENTITY_ANCHOR_TYPES = ["national_id", "company_registration", "phone_number", "community_register"];
    var VOUCH_TYPES = ["saw_money_move", "knows_character"];
    var OUTCOME_POLARITY = ["positive", "negative", "neutral"];
    module.exports = { CORE_CLAIM_TYPES, HOLDER_IDENTITY_ANCHOR_TYPES, VOUCH_TYPES, OUTCOME_POLARITY };
  }
});

// core/lib/anchor.js
var require_anchor = __commonJS({
  "core/lib/anchor.js"(exports, module) {
    "use strict";
    var ISSUER_ANCHOR_LADDER = [
      { rung: 1, id: "national_business_registration", label: "National business registration (ABN, GSTIN, BIN, NIB, or local equivalent)" },
      { rung: 2, id: "tax_vat_id", label: "Tax / VAT / GST identifier" },
      { rung: 3, id: "cooperative_ngo_registration", label: "Cooperative, NGO, or association registration certificate" },
      { rung: 4, id: "bank_account", label: "Bank account held in the entity's name" },
      { rung: 5, id: "mobile_money_account", label: "Mobile-money account held in the entity's name" },
      { rung: 6, id: "verified_physical_address", label: "Verified physical address registered with local government" }
    ];
    var ANCHOR_BY_ID = Object.fromEntries(ISSUER_ANCHOR_LADDER.map((a) => [a.id, a]));
    function isValidAnchorId(id) {
      return Object.prototype.hasOwnProperty.call(ANCHOR_BY_ID, id);
    }
    function validateIssuerAnchor(anchor) {
      if (!anchor || typeof anchor !== "object") {
        throw new Error("issuer anchor is required (Spec D7 -- no anonymous issuers)");
      }
      if (!isValidAnchorId(anchor.type)) {
        throw new Error(`issuer anchor type must be one of: ${ISSUER_ANCHOR_LADDER.map((a) => a.id).join(", ")}`);
      }
      if (!anchor.country) {
        throw new Error("issuer anchor needs a declared country");
      }
      if (!anchor.value) {
        throw new Error("issuer anchor needs a declared value (the registration/account/address identifier itself)");
      }
      return true;
    }
    module.exports = { ISSUER_ANCHOR_LADDER, ANCHOR_BY_ID, isValidAnchorId, validateIssuerAnchor };
  }
});

// core/lib/record.js
var require_record = __commonJS({
  "core/lib/record.js"(exports, module) {
    "use strict";
    var { finalizeEvent: finalizeEvent2, getPublicKey: getPublicKey2, verifyEvent: verifyEvent2 } = require_pure();
    var { CORE_CLAIM_TYPES, HOLDER_IDENTITY_ANCHOR_TYPES, VOUCH_TYPES, OUTCOME_POLARITY } = require_claimTypes();
    var { validateIssuerAnchor } = require_anchor();
    var RECORD_KIND = 3388;
    var CC_VERSION = "0.3";
    function assert(cond, msg) {
      if (!cond) throw new Error("Record rejected -- " + msg);
    }
    function buildRecordContent(fields, issuerPublicKeyHex) {
      const { issuer, subject, claim, vouchType, stake, claimTypeExtension } = fields;
      assert(issuer && issuer.name && issuer.orgType && issuer.location, "named issuer needs name, orgType, and location");
      validateIssuerAnchor(issuer.anchor);
      assert(subject && subject.reference, "subject reference is required");
      assert(
        subject && HOLDER_IDENTITY_ANCHOR_TYPES.includes(subject.identityAnchorType),
        `holder identity anchor must be declared as one of: ${HOLDER_IDENTITY_ANCHOR_TYPES.join(", ")}`
      );
      let claimTypeInfo;
      if (claimTypeExtension) {
        assert(claim && claim.claimType, "extension claim needs a claimType label");
        claimTypeInfo = { creditJudgement: !!claimTypeExtension.creditJudgement };
      } else {
        assert(
          claim && CORE_CLAIM_TYPES[claim.claimType],
          `claimType must be a core type (${Object.keys(CORE_CLAIM_TYPES).join(", ")}) or declared as a regional extension`
        );
        claimTypeInfo = CORE_CLAIM_TYPES[claim.claimType];
      }
      assert(claim.period, "claim needs a period");
      assert(
        claim.outcome && OUTCOME_POLARITY.includes(claim.outcome.polarity),
        `claim outcome needs a polarity: ${OUTCOME_POLARITY.join(", ")}`
      );
      assert(VOUCH_TYPES.includes(vouchType), `vouchType must be one of: ${VOUCH_TYPES.join(", ")}`);
      assert(stake && stake.type, "stake field is required (financial, reputational, or none)");
      assert(["financial", "reputational", "none"].includes(stake.type), "stake.type invalid");
      if (stake.type === "none") {
        assert(stake.declaredProfile, "zero stake requires a declared issuer profile (Spec D3)");
      }
      const flags = [];
      if (stake.type === "none" && claimTypeInfo.creditJudgement) {
        flags.push("ZERO_STAKE_CREDIT_JUDGEMENT: unbacked credit vouch, price near zero (Spec D3)");
      }
      return {
        ccVersion: CC_VERSION,
        issuer: {
          name: issuer.name,
          orgType: issuer.orgType,
          location: issuer.location,
          publicKey: issuerPublicKeyHex,
          anchor: issuer.anchor
        },
        subject: {
          reference: subject.reference,
          identityAnchorType: subject.identityAnchorType,
          identityAnchorValue: subject.identityAnchorValue || null
        },
        claim: {
          claimType: claim.claimType,
          isRegionalExtension: !!claimTypeExtension,
          amount: claim.amount != null ? claim.amount : null,
          period: claim.period,
          outcome: claim.outcome
        },
        vouchType,
        stake: {
          type: stake.type,
          description: stake.description || null,
          declaredProfile: stake.declaredProfile || null
        },
        // 8. Revocation pointer -- never a fixed relay URL (see NOSTR-KINDS.md);
        // resolved at verification time via the issuer's NIP-65 relay list.
        revocationPointer: { issuerPubkey: issuerPublicKeyHex, kind: 30300, dTag: "cc-cancellation-list" },
        flags
      };
    }
    function createRecord2(fields, issuerSecretKey, holderPubkeyHex) {
      const issuerPublicKeyHex = getPublicKey2(issuerSecretKey);
      const content = buildRecordContent(fields, issuerPublicKeyHex);
      const tags = [
        ["claim", content.claim.claimType],
        ["polarity", content.claim.outcome.polarity]
      ];
      if (holderPubkeyHex) tags.unshift(["p", holderPubkeyHex]);
      const template = {
        kind: RECORD_KIND,
        created_at: Math.floor(Date.now() / 1e3),
        // 7. Dates -- single source of truth, see NOSTR-KINDS.md
        tags,
        content: JSON.stringify(content)
      };
      return finalizeEvent2(template, issuerSecretKey);
    }
    function recordIsStructurallySealed(record) {
      return verifyEvent2(record);
    }
    function parseRecordContent(record) {
      return JSON.parse(record.content);
    }
    module.exports = {
      RECORD_KIND,
      CC_VERSION,
      buildRecordContent,
      createRecord: createRecord2,
      recordIsStructurallySealed,
      parseRecordContent
    };
  }
});

// core/node_modules/nostr-tools/lib/cjs/pool.js
var require_pool = __commonJS({
  "core/node_modules/nostr-tools/lib/cjs/pool.js"(exports, module) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod2) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod2);
    var pool_exports = {};
    __export2(pool_exports, {
      AbstractSimplePool: () => AbstractSimplePool,
      SimplePool: () => SimplePool,
      useWebSocketImplementation: () => useWebSocketImplementation
    });
    module.exports = __toCommonJS2(pool_exports);
    var import_secp256k12 = (init_secp256k1(), __toCommonJS(secp256k1_exports));
    var import_utils32 = (init_utils(), __toCommonJS(utils_exports));
    var import_utils16 = (init_utils(), __toCommonJS(utils_exports));
    var utf8Decoder2 = new TextDecoder("utf-8");
    var utf8Encoder2 = new TextEncoder();
    function normalizeURL(url) {
      try {
        if (url.indexOf("://") === -1)
          url = "wss://" + url;
        let p = new URL(url);
        if (p.protocol === "http:")
          p.protocol = "ws:";
        else if (p.protocol === "https:")
          p.protocol = "wss:";
        p.pathname = p.pathname.replace(/\/+/g, "/");
        if (p.pathname.endsWith("/"))
          p.pathname = p.pathname.slice(0, -1);
        if (p.port === "80" && p.protocol === "ws:" || p.port === "443" && p.protocol === "wss:")
          p.port = "";
        p.searchParams.sort();
        p.hash = "";
        return p.toString();
      } catch (e) {
        throw new Error(`Invalid URL: ${url}`);
      }
    }
    function isHex322(input) {
      for (let i22 = 0; i22 < 64; i22++) {
        let cc = input.charCodeAt(i22);
        if (isNaN(cc) || cc < 48 || cc > 102 || cc > 57 && cc < 97) {
          return false;
        }
      }
      return true;
    }
    var verifiedSymbol2 = Symbol("verified");
    var isRecord2 = (obj) => obj instanceof Object;
    function validateEvent2(event) {
      if (!isRecord2(event))
        return false;
      if (typeof event.kind !== "number")
        return false;
      if (typeof event.content !== "string")
        return false;
      if (typeof event.created_at !== "number")
        return false;
      if (typeof event.pubkey !== "string")
        return false;
      if (!isHex322(event.pubkey))
        return false;
      if (!Array.isArray(event.tags))
        return false;
      for (let i22 = 0; i22 < event.tags.length; i22++) {
        let tag = event.tags[i22];
        if (!Array.isArray(tag))
          return false;
        for (let j = 0; j < tag.length; j++) {
          if (typeof tag[j] !== "string")
            return false;
        }
      }
      return true;
    }
    var import_sha24 = (init_sha2(), __toCommonJS(sha2_exports));
    var JS2 = class {
      generateSecretKey() {
        return import_secp256k12.schnorr.utils.randomSecretKey();
      }
      getPublicKey(secretKey) {
        return (0, import_utils32.bytesToHex)(import_secp256k12.schnorr.getPublicKey(secretKey));
      }
      finalizeEvent(t, secretKey) {
        const event = t;
        event.pubkey = (0, import_utils32.bytesToHex)(import_secp256k12.schnorr.getPublicKey(secretKey));
        event.id = getEventHash2(event);
        event.sig = (0, import_utils32.bytesToHex)(import_secp256k12.schnorr.sign((0, import_utils32.hexToBytes)(getEventHash2(event)), secretKey));
        event[verifiedSymbol2] = true;
        return event;
      }
      verifyEvent(event) {
        if (typeof event[verifiedSymbol2] === "boolean")
          return event[verifiedSymbol2];
        try {
          const hash = getEventHash2(event);
          if (hash !== event.id) {
            event[verifiedSymbol2] = false;
            return false;
          }
          const valid = import_secp256k12.schnorr.verify((0, import_utils32.hexToBytes)(event.sig), (0, import_utils32.hexToBytes)(hash), (0, import_utils32.hexToBytes)(event.pubkey));
          event[verifiedSymbol2] = valid;
          return valid;
        } catch (err) {
          event[verifiedSymbol2] = false;
          return false;
        }
      }
    };
    function serializeEvent2(evt) {
      if (!validateEvent2(evt))
        throw new Error("can't serialize event with wrong or missing properties");
      return JSON.stringify([0, evt.pubkey, evt.created_at, evt.kind, evt.tags, evt.content]);
    }
    function getEventHash2(event) {
      let eventHash = (0, import_sha24.sha256)(utf8Encoder2.encode(serializeEvent2(event)));
      return (0, import_utils32.bytesToHex)(eventHash);
    }
    var i2 = new JS2();
    var generateSecretKey2 = i2.generateSecretKey;
    var getPublicKey2 = i2.getPublicKey;
    var finalizeEvent2 = i2.finalizeEvent;
    var verifyEvent2 = i2.verifyEvent;
    var ClientAuth = 22242;
    function matchFilter(filter, event) {
      if (filter.ids && filter.ids.indexOf(event.id) === -1) {
        return false;
      }
      if (filter.kinds && filter.kinds.indexOf(event.kind) === -1) {
        return false;
      }
      if (filter.authors && filter.authors.indexOf(event.pubkey) === -1) {
        return false;
      }
      for (let f in filter) {
        if (f[0] === "#") {
          let tagName = f.slice(1);
          let values = filter[`#${tagName}`];
          if (values && !event.tags.find(([t, v]) => t === f.slice(1) && values.indexOf(v) !== -1))
            return false;
        }
      }
      if (filter.since && event.created_at < filter.since)
        return false;
      if (filter.until && event.created_at > filter.until)
        return false;
      return true;
    }
    function matchFilters(filters, event) {
      for (let i22 = 0; i22 < filters.length; i22++) {
        if (matchFilter(filters[i22], event)) {
          return true;
        }
      }
      return false;
    }
    function getHex64(json, field) {
      let len = field.length + 3;
      let idx = json.indexOf(`"${field}":`) + len;
      let s = json.slice(idx).indexOf(`"`) + idx + 1;
      return json.slice(s, s + 64);
    }
    function getSubscriptionId(json) {
      let idx = json.slice(0, 22).indexOf(`"EVENT"`);
      if (idx === -1)
        return null;
      let pstart = json.slice(idx + 7 + 1).indexOf(`"`);
      if (pstart === -1)
        return null;
      let start = idx + 7 + 1 + pstart;
      let pend = json.slice(start + 1, 80).indexOf(`"`);
      if (pend === -1)
        return null;
      let end = start + 1 + pend;
      return json.slice(start + 1, end);
    }
    function makeAuthEvent(relayURL, challenge2) {
      return {
        kind: ClientAuth,
        created_at: Math.floor(Date.now() / 1e3),
        tags: [
          ["relay", relayURL],
          ["challenge", challenge2]
        ],
        content: ""
      };
    }
    var SendingOnClosedConnection = class extends Error {
      constructor(message, relay) {
        super(`Tried to send message '${message} on a closed connection to ${relay}.`);
        this.name = "SendingOnClosedConnection";
      }
    };
    var AbstractRelay = class {
      url;
      _connected = false;
      onclose = null;
      onnotice = (msg) => console.debug(`NOTICE from ${this.url}: ${msg}`);
      onauth;
      baseEoseTimeout = 4400;
      publishTimeout = 4400;
      pingFrequency = 29e3;
      pingTimeout = 2e4;
      resubscribeBackoff = [1e4, 1e4, 1e4, 2e4, 2e4, 3e4, 6e4];
      openSubs = /* @__PURE__ */ new Map();
      enablePing;
      enableReconnect;
      idleTimeout = 0;
      idleSince = Date.now();
      ongoingOperations = 0;
      reconnectTimeoutHandle;
      pingIntervalHandle;
      reconnectAttempts = 0;
      skipReconnection = false;
      idleTimeoutHandle;
      connectionPromise;
      openCountRequests = /* @__PURE__ */ new Map();
      openEventPublishes = /* @__PURE__ */ new Map();
      ws;
      challenge;
      authPromise;
      serial = 0;
      verifyEvent;
      _WebSocket;
      constructor(url, opts) {
        this.url = normalizeURL(url);
        this.verifyEvent = opts.verifyEvent;
        this._WebSocket = opts.websocketImplementation || WebSocket;
        this.enablePing = opts.enablePing;
        this.enableReconnect = opts.enableReconnect || false;
        if (opts.idleTimeout)
          this.idleTimeout = opts.idleTimeout;
      }
      static async connect(url, opts) {
        const relay = new AbstractRelay(url, opts);
        await relay.connect(opts);
        return relay;
      }
      closeAllSubscriptions(reason) {
        for (let [_, sub] of this.openSubs) {
          sub.close(reason);
        }
        this.openSubs.clear();
        for (let [_, ep] of this.openEventPublishes) {
          ep.reject(new Error(reason));
        }
        this.openEventPublishes.clear();
        for (let [_, cr] of this.openCountRequests) {
          cr.reject(new Error(reason));
        }
        this.openCountRequests.clear();
      }
      get connected() {
        return this._connected;
      }
      clearIdleTimeout() {
        if (this.idleTimeoutHandle) {
          clearTimeout(this.idleTimeoutHandle);
          this.idleTimeoutHandle = void 0;
        }
      }
      scheduleIdleClose() {
        this.clearIdleTimeout();
        if (this.idleTimeout > 0) {
          this.idleTimeoutHandle = setTimeout(() => {
            if (this.ongoingOperations === 0 && this.idleSince) {
              this.close();
            }
          }, this.idleTimeout);
        }
      }
      async reconnect() {
        const backoff = this.resubscribeBackoff[Math.min(this.reconnectAttempts, this.resubscribeBackoff.length - 1)];
        this.reconnectAttempts++;
        this.reconnectTimeoutHandle = setTimeout(async () => {
          try {
            await this.connect();
          } catch (err) {
          }
        }, backoff);
      }
      handleHardClose(reason) {
        if (this.ws) {
          this.ws.onopen = null;
          this.ws.onerror = null;
          this.ws.onclose = null;
        }
        if (this.pingIntervalHandle) {
          clearInterval(this.pingIntervalHandle);
          this.pingIntervalHandle = void 0;
        }
        this._connected = false;
        this.connectionPromise = void 0;
        this.idleSince = void 0;
        this.clearIdleTimeout();
        if (this.enableReconnect && !this.skipReconnection) {
          this.reconnect();
        } else {
          this.onclose?.();
          this.closeAllSubscriptions(reason);
        }
      }
      async connect(opts) {
        let connectionTimeoutHandle;
        if (this.connectionPromise)
          return this.connectionPromise;
        this.challenge = void 0;
        this.authPromise = void 0;
        this.skipReconnection = false;
        this.connectionPromise = new Promise((resolve, reject) => {
          if (opts?.timeout) {
            connectionTimeoutHandle = setTimeout(() => {
              reject("connection timed out");
              this.connectionPromise = void 0;
              if (this.reconnectAttempts === 0) {
                this.skipReconnection = true;
              }
              this.handleHardClose("relay connection timed out");
            }, opts.timeout);
          }
          if (opts?.abort) {
            opts.abort.onabort = reject;
          }
          try {
            this.ws = new this._WebSocket(this.url);
          } catch (err) {
            clearTimeout(connectionTimeoutHandle);
            reject(err);
            return;
          }
          this.ws.onopen = () => {
            if (this.reconnectTimeoutHandle) {
              clearTimeout(this.reconnectTimeoutHandle);
              this.reconnectTimeoutHandle = void 0;
            }
            clearTimeout(connectionTimeoutHandle);
            this._connected = true;
            const isReconnection = this.reconnectAttempts > 0;
            this.reconnectAttempts = 0;
            for (const sub of this.openSubs.values()) {
              sub.eosed = false;
              if (isReconnection) {
                for (let f = 0; f < sub.filters.length; f++) {
                  if (sub.lastEmitted) {
                    sub.filters[f].since = sub.lastEmitted + 1;
                  }
                }
              }
              sub.fire();
            }
            if (this.enablePing) {
              this.pingIntervalHandle = setInterval(() => this.pingpong(), this.pingFrequency);
            }
            resolve();
          };
          this.ws.onerror = () => {
            clearTimeout(connectionTimeoutHandle);
            reject("connection failed");
            this.connectionPromise = void 0;
            if (this.reconnectAttempts === 0) {
              this.skipReconnection = true;
            }
            this.handleHardClose("relay connection failed");
          };
          this.ws.onclose = (ev) => {
            clearTimeout(connectionTimeoutHandle);
            reject(ev.message || "websocket closed");
            this.handleHardClose("relay connection closed");
          };
          this.ws.onmessage = this._onmessage.bind(this);
        });
        return this.connectionPromise;
      }
      waitForPingPong() {
        return new Promise((resolve) => {
          ;
          this.ws.once("pong", () => resolve(true));
          this.ws.ping();
        });
      }
      waitForDummyReq() {
        return new Promise((resolve, reject) => {
          if (!this.connectionPromise)
            return reject(new Error(`no connection to ${this.url}, can't ping`));
          try {
            const sub = this.subscribe(
              [{ ids: ["aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"], limit: 0 }],
              {
                label: "<forced-ping>",
                oneose: () => {
                  resolve(true);
                  sub.close();
                },
                onclose() {
                  resolve(true);
                },
                eoseTimeout: this.pingTimeout + 1e3
              }
            );
          } catch (err) {
            reject(err);
          }
        });
      }
      async pingpong() {
        if (this.ws?.readyState === 1) {
          const result = await Promise.any([
            this.ws && this.ws.ping && this.ws.once ? this.waitForPingPong() : this.waitForDummyReq(),
            new Promise((res) => setTimeout(() => res(false), this.pingTimeout))
          ]);
          if (!result) {
            if (this.ws?.readyState === this._WebSocket.OPEN) {
              this.ws?.close();
            }
          }
        }
      }
      async send(message) {
        if (!this.connectionPromise)
          throw new SendingOnClosedConnection(message, this.url);
        this.connectionPromise.then(() => {
          this.ws?.send(message);
        });
      }
      async auth(signAuthEvent) {
        const challenge2 = this.challenge;
        if (!challenge2)
          throw new Error("can't perform auth, no challenge was received");
        if (this.authPromise)
          return this.authPromise;
        this.authPromise = new Promise(async (resolve, reject) => {
          try {
            let evt = await signAuthEvent(makeAuthEvent(this.url, challenge2));
            let timeout = setTimeout(() => {
              let ep = this.openEventPublishes.get(evt.id);
              if (ep) {
                ep.reject(new Error("auth timed out"));
                this.openEventPublishes.delete(evt.id);
              }
            }, this.publishTimeout);
            this.openEventPublishes.set(evt.id, { resolve, reject, timeout });
            this.send('["AUTH",' + JSON.stringify(evt) + "]");
          } catch (err) {
            console.warn("subscribe auth function failed:", err);
          }
        });
        return this.authPromise;
      }
      async publish(event) {
        this.idleSince = void 0;
        this.clearIdleTimeout();
        this.ongoingOperations++;
        const ret = new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            const ep = this.openEventPublishes.get(event.id);
            if (ep) {
              ep.reject(new Error("publish timed out"));
              this.openEventPublishes.delete(event.id);
            }
          }, this.publishTimeout);
          this.openEventPublishes.set(event.id, { resolve, reject, timeout });
        });
        try {
          await this.send('["EVENT",' + JSON.stringify(event) + "]");
        } catch (err) {
          const ep = this.openEventPublishes.get(event.id);
          if (ep) {
            ep.reject(err);
            this.openEventPublishes.delete(event.id);
          }
        }
        this.ongoingOperations--;
        if (this.ongoingOperations === 0) {
          this.idleSince = Date.now();
          this.scheduleIdleClose();
        }
        return ret;
      }
      async count(filters, params) {
        return (await this.countWithHLL(filters, params)).count;
      }
      async countWithHLL(filters, params) {
        this.serial++;
        const id = params?.id || "count:" + this.serial;
        const ret = new Promise((resolve, reject) => {
          this.openCountRequests.set(id, { resolve, reject });
        });
        try {
          await this.send('["COUNT","' + id + '",' + JSON.stringify(filters).substring(1));
        } catch (err) {
          const cr = this.openCountRequests.get(id);
          if (cr) {
            cr.reject(err);
            this.openCountRequests.delete(id);
          }
        }
        return ret;
      }
      subscribe(filters, params) {
        if (params.label !== "<forced-ping>") {
          this.idleSince = void 0;
          this.clearIdleTimeout();
          this.ongoingOperations++;
        }
        const sub = this.prepareSubscription(filters, params);
        sub.fire();
        if (params.abort) {
          params.abort.onabort = () => sub.close(String(params.abort.reason || "<aborted>"));
        }
        return sub;
      }
      prepareSubscription(filters, params) {
        this.serial++;
        const id = params.id || (params.label ? params.label + ":" : "sub:") + this.serial;
        const sub = new Subscription(this, id, filters, params);
        this.openSubs.set(id, sub);
        return sub;
      }
      close() {
        this.skipReconnection = true;
        if (this.reconnectTimeoutHandle) {
          clearTimeout(this.reconnectTimeoutHandle);
          this.reconnectTimeoutHandle = void 0;
        }
        if (this.pingIntervalHandle) {
          clearInterval(this.pingIntervalHandle);
          this.pingIntervalHandle = void 0;
        }
        this.closeAllSubscriptions("relay connection closed by us");
        this._connected = false;
        this.connectionPromise = void 0;
        this.idleSince = void 0;
        this.clearIdleTimeout();
        this.onclose?.();
        if (this.ws) {
          this.ws.onopen = null;
          this.ws.onerror = null;
          this.ws.onclose = null;
          if (this.ws.readyState !== this._WebSocket.CLOSING && this.ws.readyState !== this._WebSocket.CLOSED) {
            this.ws.close();
          }
        }
      }
      _onmessage(ev) {
        const json = ev.data;
        if (!json) {
          return;
        }
        const subid = getSubscriptionId(json);
        if (subid) {
          const so = this.openSubs.get(subid);
          if (!so) {
            return;
          }
          const id = getHex64(json, "id");
          const alreadyHave = so.alreadyHaveEvent?.(id);
          so.receivedEvent?.(this, id);
          if (alreadyHave) {
            return;
          }
        }
        try {
          let data = JSON.parse(json);
          switch (data[0]) {
            case "EVENT": {
              const so = this.openSubs.get(data[1]);
              const event = data[2];
              if (matchFilters(so.filters, event) && this.verifyEvent(event, this.url)) {
                so.onevent(event);
              } else {
                so.oninvalidevent?.(event);
              }
              if (!so.lastEmitted || so.lastEmitted < event.created_at)
                so.lastEmitted = event.created_at;
              return;
            }
            case "COUNT": {
              const id = data[1];
              const payload = data[2];
              const cr = this.openCountRequests.get(id);
              if (cr) {
                cr.resolve(payload);
                this.openCountRequests.delete(id);
              }
              return;
            }
            case "EOSE": {
              const so = this.openSubs.get(data[1]);
              if (!so)
                return;
              so.receivedEose();
              return;
            }
            case "OK": {
              const id = data[1];
              const ok = data[2];
              const reason = data[3];
              const ep = this.openEventPublishes.get(id);
              if (ep) {
                clearTimeout(ep.timeout);
                if (ok)
                  ep.resolve(reason);
                else
                  ep.reject(new Error(reason));
                this.openEventPublishes.delete(id);
              }
              return;
            }
            case "CLOSED": {
              const id = data[1];
              const so = this.openSubs.get(id);
              if (!so) {
                const cr = this.openCountRequests.get(id);
                if (cr) {
                  cr.reject(new Error(data[2]));
                  this.openCountRequests.delete(id);
                }
                return;
              }
              so.closed = true;
              so.close(data[2]);
              return;
            }
            case "NOTICE": {
              this.onnotice(data[1]);
              return;
            }
            case "AUTH": {
              this.challenge = data[1];
              if (this.onauth) {
                this.auth(this.onauth).catch((err) => {
                  if (!(err instanceof SendingOnClosedConnection)) {
                    throw err;
                  }
                });
              }
              return;
            }
            default: {
              const so = this.openSubs.get(data[1]);
              so?.oncustom?.(data);
              return;
            }
          }
        } catch (err) {
          try {
            const [_, __, event] = JSON.parse(json);
            console.warn(`[nostr] relay ${this.url} error processing message:`, err, event);
          } catch (_) {
            console.warn(`[nostr] relay ${this.url} error processing message:`, err);
          }
          return;
        }
      }
    };
    var Subscription = class {
      relay;
      id;
      lastEmitted;
      closed = false;
      eosed = false;
      filters;
      alreadyHaveEvent;
      receivedEvent;
      onevent;
      oninvalidevent;
      oneose;
      onclose;
      oncustom;
      eoseTimeout;
      eoseTimeoutHandle;
      constructor(relay, id, filters, params) {
        if (filters.length === 0)
          throw new Error("subscription can't be created with zero filters");
        this.relay = relay;
        this.filters = filters;
        this.id = id;
        this.alreadyHaveEvent = params.alreadyHaveEvent;
        this.receivedEvent = params.receivedEvent;
        this.eoseTimeout = params.eoseTimeout || relay.baseEoseTimeout;
        this.oneose = params.oneose;
        this.onclose = params.onclose;
        this.oninvalidevent = params.oninvalidevent;
        this.onevent = params.onevent || ((event) => {
          console.warn(
            `onevent() callback not defined for subscription '${this.id}' in relay ${this.relay.url}. event received:`,
            event
          );
        });
      }
      fire() {
        this.relay.send('["REQ","' + this.id + '",' + JSON.stringify(this.filters).substring(1));
        this.eoseTimeoutHandle = setTimeout(this.receivedEose.bind(this), this.eoseTimeout);
      }
      receivedEose() {
        if (this.eosed)
          return;
        clearTimeout(this.eoseTimeoutHandle);
        this.eosed = true;
        this.oneose?.();
      }
      close(reason = "closed by caller") {
        if (!this.closed && this.relay.connected) {
          try {
            this.relay.send('["CLOSE",' + JSON.stringify(this.id) + "]");
          } catch (err) {
            if (err instanceof SendingOnClosedConnection) {
            } else {
              throw err;
            }
          }
          this.closed = true;
        }
        this.relay.openSubs.delete(this.id);
        this.relay.ongoingOperations--;
        if (this.relay.ongoingOperations === 0) {
          this.relay.idleSince = Date.now();
          this.relay.scheduleIdleClose();
        }
        this.onclose?.(reason);
      }
    };
    var import_sha222 = (init_sha2(), __toCommonJS(sha2_exports));
    var import_utils62 = (init_utils(), __toCommonJS(utils_exports));
    var M = 256;
    var HLL_HEX_LENGTH = M * 2;
    var utf8Encoder22 = new TextEncoder();
    function getCountManyFilter(target, directive) {
      switch (directive) {
        case "reactions":
          return { "#e": [target], kinds: [7] };
        case "reposts":
          return { "#e": [target], kinds: [6] };
        case "quotes":
          return { "#q": [target], kinds: [1, 1111] };
        case "replies":
          return { "#e": [target], kinds: [1] };
        case "comments":
          return { "#E": [target], kinds: [1111] };
        case "followers":
          return { "#p": [target], kinds: [3] };
      }
    }
    function newHll() {
      return new Uint8Array(M);
    }
    function hllDecode(hex) {
      if (hex.length !== HLL_HEX_LENGTH || !/^[0-9a-f]+$/.test(hex))
        return void 0;
      const registers = new Uint8Array(M);
      for (let i22 = 0; i22 < M; i22++) {
        registers[i22] = parseInt(hex.slice(i22 * 2, i22 * 2 + 2), 16);
      }
      return registers;
    }
    function hllEncode(registers) {
      if (registers.length !== M)
        throw new Error(`invalid number of registers ${registers.length}`);
      let hex = "";
      for (let i22 = 0; i22 < M; i22++) {
        hex += registers[i22].toString(16).padStart(2, "0");
      }
      return hex;
    }
    function mergeHll(target, source) {
      if (target.length === 0)
        target = newHll();
      if (target.length !== M)
        throw new Error(`invalid number of registers ${target.length}`);
      if (source.length !== M)
        throw new Error(`invalid number of registers ${source.length}`);
      for (let i22 = 0; i22 < M; i22++) {
        if (source[i22] > target[i22])
          target[i22] = source[i22];
      }
      return target;
    }
    var AbstractSimplePool = class {
      relays = /* @__PURE__ */ new Map();
      seenOn = /* @__PURE__ */ new Map();
      trackRelays = false;
      verifyEvent;
      enablePing;
      enableReconnect;
      idleTimeout = 2e4;
      automaticallyAuth;
      onRelayConnectionFailure;
      onRelayConnectionSuccess;
      allowConnectingToRelay;
      maxWaitForConnection;
      _WebSocket;
      constructor(opts) {
        this.verifyEvent = opts.verifyEvent;
        this._WebSocket = opts.websocketImplementation;
        this.enablePing = opts.enablePing;
        this.enableReconnect = opts.enableReconnect || false;
        if (opts.idleTimeout)
          this.idleTimeout = opts.idleTimeout;
        this.automaticallyAuth = opts.automaticallyAuth;
        this.onRelayConnectionFailure = opts.onRelayConnectionFailure;
        this.onRelayConnectionSuccess = opts.onRelayConnectionSuccess;
        this.allowConnectingToRelay = opts.allowConnectingToRelay;
        this.maxWaitForConnection = opts.maxWaitForConnection || 3e3;
      }
      async ensureRelay(url, params) {
        url = normalizeURL(url);
        let relay = this.relays.get(url);
        if (!relay) {
          relay = new AbstractRelay(url, {
            verifyEvent: this.verifyEvent,
            websocketImplementation: this._WebSocket,
            enablePing: this.enablePing,
            enableReconnect: this.enableReconnect,
            idleTimeout: this.idleTimeout
          });
          relay.onclose = () => {
            this.relays.delete(url);
          };
          this.relays.set(url, relay);
        }
        if (this.automaticallyAuth) {
          const authSignerFn = this.automaticallyAuth(url);
          if (authSignerFn) {
            relay.onauth = authSignerFn;
          }
        }
        try {
          await relay.connect({
            timeout: params?.connectionTimeout,
            abort: params?.abort
          });
        } catch (err) {
          this.relays.delete(url);
          throw err;
        }
        return relay;
      }
      close(relays) {
        relays.map(normalizeURL).forEach((url) => {
          this.relays.get(url)?.close();
          this.relays.delete(url);
        });
      }
      subscribe(relays, filter, params) {
        const request = [];
        const uniqUrls = [];
        for (let i22 = 0; i22 < relays.length; i22++) {
          const url = normalizeURL(relays[i22]);
          if (!request.find((r) => r.url === url)) {
            if (uniqUrls.indexOf(url) === -1) {
              uniqUrls.push(url);
              request.push({ url, filter });
            }
          }
        }
        return this.subscribeMap(request, params);
      }
      subscribeMany(relays, filter, params) {
        return this.subscribe(relays, filter, params);
      }
      subscribeMap(requests, params) {
        const grouped = /* @__PURE__ */ new Map();
        for (const req of requests) {
          const { url, filter } = req;
          if (!grouped.has(url))
            grouped.set(url, []);
          grouped.get(url).push(filter);
        }
        const groupedRequests = Array.from(grouped.entries()).map(([url, filters]) => ({ url, filters }));
        if (this.trackRelays) {
          params.receivedEvent = (relay, id) => {
            let set = this.seenOn.get(id);
            if (!set) {
              set = /* @__PURE__ */ new Set();
              this.seenOn.set(id, set);
            }
            set.add(relay);
          };
        }
        const _knownIds = /* @__PURE__ */ new Set();
        const subs = [];
        const eosesReceived = [];
        let handleEose = (i22) => {
          if (eosesReceived[i22])
            return;
          eosesReceived[i22] = true;
          if (eosesReceived.filter((a) => a).length === groupedRequests.length) {
            params.oneose?.();
            handleEose = () => {
            };
          }
        };
        const closesReceived = [];
        let handleClose = (i22, url, reason) => {
          if (closesReceived[i22])
            return;
          handleEose(i22);
          closesReceived[i22] = { url, reason };
          if (closesReceived.filter((a) => a).length === groupedRequests.length) {
            params.onclose?.(closesReceived);
            handleClose = () => {
            };
          }
        };
        const localAlreadyHaveEventHandler = (id) => {
          if (params.alreadyHaveEvent?.(id)) {
            return true;
          }
          const have = _knownIds.has(id);
          _knownIds.add(id);
          return have;
        };
        const allOpened = Promise.all(
          groupedRequests.map(async ({ url, filters }, i22) => {
            if (this.allowConnectingToRelay?.(url, ["read", filters]) === false) {
              handleClose(i22, url, "connection skipped by allowConnectingToRelay");
              return;
            }
            let relay;
            try {
              relay = await this.ensureRelay(url, {
                connectionTimeout: this.maxWaitForConnection < (params.maxWait || 0) ? Math.max(params.maxWait * 0.8, params.maxWait - 1e3) : this.maxWaitForConnection,
                abort: params.abort
              });
            } catch (err) {
              this.onRelayConnectionFailure?.(url);
              handleClose(i22, url, err?.message || String(err));
              return;
            }
            this.onRelayConnectionSuccess?.(url);
            let subscription = relay.subscribe(filters, {
              ...params,
              oneose: () => handleEose(i22),
              onclose: (reason) => {
                if (reason.startsWith("auth-required: ") && params.onauth) {
                  relay.auth(params.onauth).then(() => {
                    relay.subscribe(filters, {
                      ...params,
                      oneose: () => handleEose(i22),
                      onclose: (reason2) => {
                        handleClose(i22, url, reason2);
                      },
                      alreadyHaveEvent: localAlreadyHaveEventHandler,
                      eoseTimeout: params.maxWait,
                      abort: params.abort
                    });
                  }).catch((err) => {
                    handleClose(i22, url, `auth was required and attempted, but failed with: ${err}`);
                  });
                } else {
                  handleClose(i22, url, reason);
                }
              },
              alreadyHaveEvent: localAlreadyHaveEventHandler,
              eoseTimeout: params.maxWait,
              abort: params.abort
            });
            subs.push(subscription);
          })
        );
        return {
          async close(reason) {
            await allOpened;
            subs.forEach((sub) => {
              sub.close(reason);
            });
          }
        };
      }
      subscribeEose(relays, filter, params) {
        let subcloser;
        subcloser = this.subscribe(relays, filter, {
          ...params,
          oneose() {
            const reason = "closed automatically on eose";
            if (subcloser)
              subcloser.close(reason);
            else
              params.onclose?.(relays.map((url) => ({ url, reason })));
          }
        });
        return subcloser;
      }
      subscribeManyEose(relays, filter, params) {
        return this.subscribeEose(relays, filter, params);
      }
      async querySync(relays, filter, params) {
        return new Promise(async (resolve) => {
          const events = [];
          this.subscribeEose(relays, filter, {
            ...params,
            onevent(event) {
              events.push(event);
            },
            onclose(_) {
              resolve(events);
            }
          });
        });
      }
      async get(relays, filter, params) {
        filter.limit = 1;
        const events = await this.querySync(relays, filter, params);
        events.sort((a, b) => b.created_at - a.created_at);
        return events[0] || null;
      }
      async countMany(relays, target, directive, params) {
        const filter = getCountManyFilter(target, directive);
        const urls = [];
        for (let i22 = 0; i22 < relays.length; i22++) {
          const url = normalizeURL(relays[i22]);
          if (urls.indexOf(url) === -1)
            urls.push(url);
        }
        const responses = await Promise.all(
          urls.map(async (url) => {
            if (this.allowConnectingToRelay?.(url, ["read", [filter]]) === false)
              return null;
            let relay;
            try {
              relay = await this.ensureRelay(url, {
                connectionTimeout: this.maxWaitForConnection < (params?.maxWait || 0) ? Math.max(params.maxWait * 0.8, params.maxWait - 1e3) : this.maxWaitForConnection,
                abort: params?.abort
              });
            } catch (err) {
              this.onRelayConnectionFailure?.(url);
              return null;
            }
            this.onRelayConnectionSuccess?.(url);
            return relay.countWithHLL([filter], { id: params?.id }).catch(() => null);
          })
        );
        let count = 0;
        let hll;
        for (const response of responses) {
          if (!response)
            continue;
          if (response.count > count)
            count = response.count;
          if (!response.hll || response.hll.length !== 512)
            continue;
          const registers = hllDecode(response.hll);
          if (!registers)
            continue;
          hll = mergeHll(hll || new Uint8Array(0), registers);
        }
        return hll ? { count, hll: hllEncode(hll) } : { count };
      }
      publish(relays, event, params) {
        return relays.map(normalizeURL).map(async (url, i22, arr) => {
          if (arr.indexOf(url) !== i22) {
            return Promise.reject("duplicate url");
          }
          if (this.allowConnectingToRelay?.(url, ["write", event]) === false) {
            return Promise.reject("connection skipped by allowConnectingToRelay");
          }
          let r;
          try {
            r = await this.ensureRelay(url, {
              connectionTimeout: this.maxWaitForConnection < (params?.maxWait || 0) ? Math.max(params.maxWait * 0.8, params.maxWait - 1e3) : this.maxWaitForConnection,
              abort: params?.abort
            });
          } catch (err) {
            this.onRelayConnectionFailure?.(url);
            return String("connection failure: " + String(err));
          }
          return r.publish(event).catch(async (err) => {
            if (err instanceof Error && err.message.startsWith("auth-required: ") && params?.onauth) {
              await r.auth(params.onauth);
              return r.publish(event);
            }
            throw err;
          }).then((reason) => {
            if (this.trackRelays) {
              let set = this.seenOn.get(event.id);
              if (!set) {
                set = /* @__PURE__ */ new Set();
                this.seenOn.set(event.id, set);
              }
              set.add(r);
            }
            return reason;
          });
        });
      }
      listConnectionStatus() {
        const map = /* @__PURE__ */ new Map();
        this.relays.forEach((relay, url) => map.set(url, relay.connected));
        return map;
      }
      destroy() {
        this.relays.forEach((conn) => conn.close());
        this.relays = /* @__PURE__ */ new Map();
      }
      pruneIdleRelays(idleThresholdMs = 1e4) {
        const prunedUrls = [];
        for (const [url, relay] of this.relays) {
          if (relay.idleSince && Date.now() - relay.idleSince >= idleThresholdMs) {
            this.relays.delete(url);
            prunedUrls.push(url);
            relay.close();
          }
        }
        return prunedUrls;
      }
    };
    var _WebSocket;
    try {
      _WebSocket = WebSocket;
    } catch {
    }
    function useWebSocketImplementation(websocketImplementation) {
      _WebSocket = websocketImplementation;
    }
    var SimplePool = class extends AbstractSimplePool {
      constructor(options) {
        super({ verifyEvent: verifyEvent2, websocketImplementation: _WebSocket, maxWaitForConnection: 3e3, ...options });
      }
    };
  }
});

// core/lib/relay.js
var require_relay = __commonJS({
  "core/lib/relay.js"(exports, module) {
    "use strict";
    var { SimplePool } = require_pool();
    var DEFAULT_RELAYS2 = ["wss://nos.lol", "wss://relay.primal.net"];
    var DEFAULT_PUBLISH_TIMEOUT_MS = 8e3;
    var DEFAULT_QUERY_TIMEOUT_MS = 8e3;
    function createPool2() {
      return new SimplePool();
    }
    async function publishWithQuorum(pool, event, relayUrls, opts) {
      opts = opts || {};
      const relays = relayUrls && relayUrls.length ? relayUrls : DEFAULT_RELAYS2;
      const quorum = opts.quorum || Math.min(2, relays.length);
      const maxWait = opts.maxWait || DEFAULT_PUBLISH_TIMEOUT_MS;
      const attempts = pool.publish(relays, event, { maxWait });
      const results = await Promise.allSettled(attempts);
      const succeeded = [];
      const failed = [];
      results.forEach((r, i2) => {
        if (r.status === "fulfilled") succeeded.push(relays[i2]);
        else failed.push({ url: relays[i2], reason: r.reason && r.reason.message ? r.reason.message : String(r.reason) });
      });
      return {
        ok: succeeded.length >= quorum,
        quorum,
        succeeded,
        failed
      };
    }
    async function fetchLatestAddressable(pool, relayUrls, { pubkey, kind, dTag }, opts) {
      opts = opts || {};
      const relays = relayUrls && relayUrls.length ? relayUrls : DEFAULT_RELAYS2;
      const filter = { kinds: [kind], authors: [pubkey] };
      if (dTag) filter["#d"] = [dTag];
      const events = await pool.querySync(relays, filter, { maxWait: opts.maxWait || DEFAULT_QUERY_TIMEOUT_MS });
      if (!events.length) return null;
      return events.reduce((latest, e) => e.created_at > latest.created_at ? e : latest);
    }
    module.exports = { DEFAULT_RELAYS: DEFAULT_RELAYS2, createPool: createPool2, publishWithQuorum, fetchLatestAddressable };
  }
});

// core/lib/holderActions.js
var require_holderActions = __commonJS({
  "core/lib/holderActions.js"(exports, module) {
    "use strict";
    var { finalizeEvent: finalizeEvent2, getPublicKey: getPublicKey2 } = require_pure();
    var { publishWithQuorum, fetchLatestAddressable } = require_relay();
    var DISPUTE_KIND = 30301;
    var WITHDRAWAL_KIND = 30303;
    var DISPUTE_CATEGORIES = ["cancellation_factually_wrong", "cancellation_retaliatory", "record_never_authorised"];
    function disputeDTag(recordId) {
      return "cc-dispute-" + recordId;
    }
    function withdrawalDTag(recordId) {
      return "cc-withdrawal-" + recordId;
    }
    function assert(cond, msg) {
      if (!cond) throw new Error("Rejected -- " + msg);
    }
    function buildDisputeEvent(recordId, category, detail, holderSecretKey, notBefore) {
      assert(recordId, "recordId is required");
      assert(DISPUTE_CATEGORIES.includes(category), `category must be one of: ${DISPUTE_CATEGORIES.join(", ")}`);
      const candidate = Math.floor(Date.now() / 1e3);
      const template = {
        kind: DISPUTE_KIND,
        created_at: notBefore != null && notBefore >= candidate ? notBefore + 1 : candidate,
        tags: [["d", disputeDTag(recordId)]],
        content: JSON.stringify({ recordId, category, detail: detail || null, disputedAt: (/* @__PURE__ */ new Date()).toISOString() })
      };
      return finalizeEvent2(template, holderSecretKey);
    }
    function buildWithdrawalEvent(recordId, reason, holderSecretKey, notBefore) {
      assert(recordId, "recordId is required");
      assert(reason, "a withdrawal must state a reason (same visibility principle as Spec Part IV.1)");
      const candidate = Math.floor(Date.now() / 1e3);
      const template = {
        kind: WITHDRAWAL_KIND,
        created_at: notBefore != null && notBefore >= candidate ? notBefore + 1 : candidate,
        tags: [["d", withdrawalDTag(recordId)]],
        content: JSON.stringify({ recordId, reason, withdrawnAt: (/* @__PURE__ */ new Date()).toISOString() })
      };
      return finalizeEvent2(template, holderSecretKey);
    }
    async function publishDispute2(pool, holderSecretKey, recordId, category, detail, relayUrls) {
      const holderPubkey = getPublicKey2(holderSecretKey);
      const existing = await fetchLatestAddressable(pool, relayUrls, { pubkey: holderPubkey, kind: DISPUTE_KIND, dTag: disputeDTag(recordId) });
      const event = buildDisputeEvent(recordId, category, detail, holderSecretKey, existing && existing.created_at);
      const publishResult = await publishWithQuorum(pool, event, relayUrls);
      return { event, publishResult };
    }
    async function publishWithdrawal2(pool, holderSecretKey, recordId, reason, relayUrls) {
      const holderPubkey = getPublicKey2(holderSecretKey);
      const existing = await fetchLatestAddressable(pool, relayUrls, { pubkey: holderPubkey, kind: WITHDRAWAL_KIND, dTag: withdrawalDTag(recordId) });
      const event = buildWithdrawalEvent(recordId, reason, holderSecretKey, existing && existing.created_at);
      const publishResult = await publishWithQuorum(pool, event, relayUrls);
      return { event, publishResult };
    }
    async function fetchDispute2(pool, holderPubkeyHex, recordId, relayUrls) {
      const event = await fetchLatestAddressable(pool, relayUrls, { pubkey: holderPubkeyHex, kind: DISPUTE_KIND, dTag: disputeDTag(recordId) });
      if (!event) return null;
      return JSON.parse(event.content);
    }
    async function fetchWithdrawal2(pool, holderPubkeyHex, recordId, relayUrls) {
      const event = await fetchLatestAddressable(pool, relayUrls, { pubkey: holderPubkeyHex, kind: WITHDRAWAL_KIND, dTag: withdrawalDTag(recordId) });
      if (!event) return null;
      return JSON.parse(event.content);
    }
    module.exports = {
      DISPUTE_KIND,
      WITHDRAWAL_KIND,
      DISPUTE_CATEGORIES,
      disputeDTag,
      withdrawalDTag,
      buildDisputeEvent,
      buildWithdrawalEvent,
      publishDispute: publishDispute2,
      publishWithdrawal: publishWithdrawal2,
      fetchDispute: fetchDispute2,
      fetchWithdrawal: fetchWithdrawal2
    };
  }
});

// core/lib/cancellationListRead.js
var require_cancellationListRead = __commonJS({
  "core/lib/cancellationListRead.js"(exports, module) {
    "use strict";
    var { finalizeEvent: finalizeEvent2 } = require_pure();
    var { publishWithQuorum, fetchLatestAddressable } = require_relay();
    var LIST_KIND = 30300;
    var D_TAG = "cc-cancellation-list";
    function buildListEvent(entries, secretKey, createdAt) {
      const template = {
        kind: LIST_KIND,
        created_at: createdAt || Math.floor(Date.now() / 1e3),
        tags: [["d", D_TAG]],
        content: JSON.stringify({ entries })
      };
      return finalizeEvent2(template, secretKey);
    }
    async function fetchList(pool, issuerPubkey, relayUrls) {
      const event = await fetchLatestAddressable(pool, relayUrls, { pubkey: issuerPubkey, kind: LIST_KIND, dTag: D_TAG });
      if (!event) return { event: null, entries: [] };
      return { event, entries: JSON.parse(event.content).entries };
    }
    async function publishList(pool, secretKey, entries, relayUrls, notBefore) {
      const candidate = Math.floor(Date.now() / 1e3);
      const createdAt = notBefore != null && notBefore >= candidate ? notBefore + 1 : candidate;
      const event = buildListEvent(entries, secretKey, createdAt);
      const publishResult = await publishWithQuorum(pool, event, relayUrls);
      return { event, publishResult };
    }
    async function initializeList(pool, secretKey, relayUrls) {
      return publishList(pool, secretKey, [], relayUrls);
    }
    function upsertEntry(entries, recordId, patch) {
      const idx = entries.findIndex((e) => e.recordId === recordId);
      if (idx === -1) entries.push(Object.assign({ recordId }, patch));
      else entries[idx] = Object.assign({}, entries[idx], patch);
      return entries;
    }
    module.exports = { LIST_KIND, D_TAG, buildListEvent, fetchList, publishList, initializeList, upsertEntry };
  }
});

// core/lib/verify.js
var require_verify = __commonJS({
  "core/lib/verify.js"(exports, module) {
    "use strict";
    var { verifyEvent: verifyEvent2 } = require_pure();
    var cancellationList = require_cancellationListRead();
    var holderActions = require_holderActions();
    function checkGenuine(record) {
      const structurallySealed = verifyEvent2(record);
      return { structurallySealed, genuine: structurallySealed };
    }
    async function checkStillValid(pool, record, relayUrls, holderPubkeyHex) {
      let content, issuerPubkey;
      try {
        content = JSON.parse(record.content);
        issuerPubkey = content.revocationPointer.issuerPubkey;
        if (!issuerPubkey) throw new Error("missing revocationPointer.issuerPubkey");
      } catch (e) {
        return { checked: false, status: "unverifiable", reason: "record content is unreadable -- cannot determine which issuer to check", cancellation: null, dispute: null, withdrawal: null, holderChecksCompleted: false };
      }
      const recordId = record.id;
      const [{ event: listEvent, entries }, disputeContent, withdrawalContent] = await Promise.all([
        cancellationList.fetchList(pool, issuerPubkey, relayUrls),
        holderPubkeyHex ? holderActions.fetchDispute(pool, holderPubkeyHex, recordId, relayUrls) : Promise.resolve(null),
        holderPubkeyHex ? holderActions.fetchWithdrawal(pool, holderPubkeyHex, recordId, relayUrls) : Promise.resolve(null)
      ]);
      const holderChecksCompleted = !!holderPubkeyHex;
      const withdrawal = withdrawalContent ? { reason: withdrawalContent.reason, withdrawnAt: withdrawalContent.withdrawnAt } : null;
      const dispute = disputeContent ? { category: disputeContent.category, detail: disputeContent.detail, disputedAt: disputeContent.disputedAt } : null;
      if (withdrawal) {
        return { checked: true, status: "withdrawn_by_holder", cancellation: null, dispute, withdrawal, holderChecksCompleted };
      }
      if (!listEvent) {
        return { checked: false, status: "unverifiable", reason: "dead issuer: no cancellation list found at all", cancellation: null, dispute, withdrawal: null, holderChecksCompleted };
      }
      const entry = entries.find((e) => e.recordId === recordId);
      if (!entry) {
        return { checked: true, status: "valid", cancellation: null, dispute, withdrawal: null, holderChecksCompleted };
      }
      return {
        checked: true,
        status: "cancelled",
        cancellation: { reason: entry.reason, cancelledBy: entry.cancelledBy, cancelledAt: entry.cancelledAt },
        dispute,
        withdrawal: null,
        holderChecksCompleted
      };
    }
    async function verifyRecord2(pool, record, relayUrls, holderPubkeyHex) {
      const check1 = checkGenuine(record);
      const check2 = await checkStillValid(pool, record, relayUrls, holderPubkeyHex);
      return {
        recordId: record.id,
        check1,
        check2,
        overall: !check1.genuine ? "not_genuine" : check2.status
      };
    }
    module.exports = { checkGenuine, checkStillValid, verifyRecord: verifyRecord2 };
  }
});

// core/node_modules/nostr-tools/lib/esm/pure.js
init_secp256k1();
init_utils();
init_sha2();
var utf8Decoder = new TextDecoder("utf-8");
var utf8Encoder = new TextEncoder();
function isHex32(input) {
  for (let i2 = 0; i2 < 64; i2++) {
    let cc = input.charCodeAt(i2);
    if (isNaN(cc) || cc < 48 || cc > 102 || cc > 57 && cc < 97) {
      return false;
    }
  }
  return true;
}
var verifiedSymbol = Symbol("verified");
var isRecord = (obj) => obj instanceof Object;
function validateEvent(event) {
  if (!isRecord(event))
    return false;
  if (typeof event.kind !== "number")
    return false;
  if (typeof event.content !== "string")
    return false;
  if (typeof event.created_at !== "number")
    return false;
  if (typeof event.pubkey !== "string")
    return false;
  if (!isHex32(event.pubkey))
    return false;
  if (!Array.isArray(event.tags))
    return false;
  for (let i2 = 0; i2 < event.tags.length; i2++) {
    let tag = event.tags[i2];
    if (!Array.isArray(tag))
      return false;
    for (let j = 0; j < tag.length; j++) {
      if (typeof tag[j] !== "string")
        return false;
    }
  }
  return true;
}
var JS = class {
  generateSecretKey() {
    return schnorr.utils.randomSecretKey();
  }
  getPublicKey(secretKey) {
    return bytesToHex(schnorr.getPublicKey(secretKey));
  }
  finalizeEvent(t, secretKey) {
    const event = t;
    event.pubkey = bytesToHex(schnorr.getPublicKey(secretKey));
    event.id = getEventHash(event);
    event.sig = bytesToHex(schnorr.sign(hexToBytes(getEventHash(event)), secretKey));
    event[verifiedSymbol] = true;
    return event;
  }
  verifyEvent(event) {
    if (typeof event[verifiedSymbol] === "boolean")
      return event[verifiedSymbol];
    try {
      const hash = getEventHash(event);
      if (hash !== event.id) {
        event[verifiedSymbol] = false;
        return false;
      }
      const valid = schnorr.verify(hexToBytes(event.sig), hexToBytes(hash), hexToBytes(event.pubkey));
      event[verifiedSymbol] = valid;
      return valid;
    } catch (err) {
      event[verifiedSymbol] = false;
      return false;
    }
  }
};
function serializeEvent(evt) {
  if (!validateEvent(evt))
    throw new Error("can't serialize event with wrong or missing properties");
  return JSON.stringify([0, evt.pubkey, evt.created_at, evt.kind, evt.tags, evt.content]);
}
function getEventHash(event) {
  let eventHash = sha256(utf8Encoder.encode(serializeEvent(event)));
  return bytesToHex(eventHash);
}
var i = new JS();
var generateSecretKey = i.generateSecretKey;
var getPublicKey = i.getPublicKey;
var finalizeEvent = i.finalizeEvent;
var verifyEvent = i.verifyEvent;

// holder-pwa/spike/entry.js
var import_keyCrypto_web = __toESM(require_keyCrypto_web());
var import_record = __toESM(require_record());
var import_holderActions = __toESM(require_holderActions());
var import_verify = __toESM(require_verify());
var import_relay = __toESM(require_relay());
var export_DEFAULT_RELAYS = import_relay.DEFAULT_RELAYS;
var export_createPool = import_relay.createPool;
var export_createRecord = import_record.createRecord;
var export_decryptSecretKey = import_keyCrypto_web.decryptSecretKey;
var export_encryptSecretKey = import_keyCrypto_web.encryptSecretKey;
var export_fetchDispute = import_holderActions.fetchDispute;
var export_fetchWithdrawal = import_holderActions.fetchWithdrawal;
var export_publishDispute = import_holderActions.publishDispute;
var export_publishWithdrawal = import_holderActions.publishWithdrawal;
var export_verifyRecord = import_verify.verifyRecord;
var export_webCryptoSupported = import_keyCrypto_web.isSupported;
export {
  export_DEFAULT_RELAYS as DEFAULT_RELAYS,
  export_createPool as createPool,
  export_createRecord as createRecord,
  export_decryptSecretKey as decryptSecretKey,
  export_encryptSecretKey as encryptSecretKey,
  export_fetchDispute as fetchDispute,
  export_fetchWithdrawal as fetchWithdrawal,
  generateSecretKey,
  getPublicKey,
  export_publishDispute as publishDispute,
  export_publishWithdrawal as publishWithdrawal,
  export_verifyRecord as verifyRecord,
  export_webCryptoSupported as webCryptoSupported
};
