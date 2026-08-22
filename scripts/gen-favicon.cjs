/**
 * Generate a real multi-size favicon.ico from public/logo.png.
 * Pure Node (zlib + manual PNG decode/encode) — no dependencies.
 * Output: public/favicon.ico containing PNG-embedded 16/32/48/256 sizes.
 */
const fs = require('fs');
const zlib = require('zlib');

/* ---------------------------- CRC32 (PNG) ---------------------------- */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

/* ---------------------------- PNG decode ---------------------------- */
const decodePng = (buf) => {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('Not a PNG');
  let width = 0, height = 0, bitDepth = 0, colorType = 0, interlace = 0;
  const idat = [];
  let off = 8;
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      interlace = data[12];
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
    off += 12 + len;
  }
  if (colorType !== 6 || bitDepth !== 8 || interlace !== 0) {
    throw new Error(`Unsupported PNG format: colorType=${colorType} bitDepth=${bitDepth} interlace=${interlace}`);
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * 4;
  const px = Buffer.alloc(width * height * 4);
  const paeth = (a, b, c) => {
    const p = a + b - c;
    const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
  };
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const row = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const out = px.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? px.subarray((y - 1) * stride, y * stride) : null;
    for (let x = 0; x < stride; x++) {
      const a = x >= 4 ? out[x - 4] : 0;
      const b = prev ? prev[x] : 0;
      const c = x >= 4 && prev ? prev[x - 4] : 0;
      let v = row[x];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) v += paeth(a, b, c);
      out[x] = v & 0xff;
    }
  }
  return { width, height, px };
};

/* ---------------------------- Bilinear resize ---------------------------- */
const resizeRgba = (src, sw, sh, dw, dh) => {
  const out = Buffer.alloc(dw * dh * 4);
  const sx = sw / dw, sy = sh / dh;
  for (let y = 0; y < dh; y++) {
    const srcY = y * sy;
    const y0 = Math.floor(srcY), y1 = Math.min(sh - 1, y0 + 1);
    const fy = srcY - y0;
    for (let x = 0; x < dw; x++) {
      const srcX = x * sx;
      const x0 = Math.floor(srcX), x1 = Math.min(sw - 1, x0 + 1);
      const fx = srcX - x0;
      for (let c = 0; c < 4; c++) {
        const p00 = src[(y0 * sw + x0) * 4 + c];
        const p10 = src[(y0 * sw + x1) * 4 + c];
        const p01 = src[(y1 * sw + x0) * 4 + c];
        const p11 = src[(y1 * sw + x1) * 4 + c];
        const top = p00 + (p10 - p00) * fx;
        const bot = p01 + (p11 - p01) * fx;
        out[(y * dw + x) * 4 + c] = Math.round(top + (bot - top) * fy);
      }
    }
  }
  return out;
};

/* ---------------------------- PNG encode ---------------------------- */
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
};

const encodePng = (px, w, h) => {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const stride = w * 4;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0; // filter None
    px.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
};

/* ---------------------------- ICO container ---------------------------- */
const buildIco = (sizes, pngs) => {
  const count = sizes.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(count, 4);
  const entries = [];
  let offset = 6 + count * 16;
  for (let i = 0; i < count; i++) {
    const e = Buffer.alloc(16);
    e[0] = sizes[i] >= 256 ? 0 : sizes[i]; // 0 means 256
    e[1] = sizes[i] >= 256 ? 0 : sizes[i];
    e[2] = 0; // palette
    e[3] = 0;
    e.writeUInt16LE(1, 4); // planes
    e.writeUInt16LE(32, 6); // bpp
    e.writeUInt32LE(pngs[i].length, 8);
    e.writeUInt32LE(offset, 12);
    entries.push(e);
    offset += pngs[i].length;
  }
  return Buffer.concat([header, ...entries, ...pngs]);
};

/* ------------------------------ main ------------------------------ */
const src = fs.readFileSync('public/logo.png');
const { width, height, px } = decodePng(src);
console.log(`Source: ${width}x${height}`);

const sizes = [16, 32, 48, 256];
const pngs = sizes.map((s) => {
  const small = resizeRgba(px, width, height, s, s);
  return encodePng(small, s, s);
});
const ico = buildIco(sizes, pngs);
fs.writeFileSync('public/favicon.ico', ico);
console.log(`Wrote public/favicon.ico (${ico.length} bytes, sizes: ${sizes.join(', ')})`);
