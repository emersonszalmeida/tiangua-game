import fs from 'node:fs'; import vm from 'node:vm'; import { createRequire } from 'node:module'; import { encodePNG } from './pngenc.mjs';
const require = createRequire(import.meta.url); const { GifReader } = require('omggif');
const ctx = {}; vm.runInNewContext(fs.readFileSync('sprites7.js', 'utf8') + ';this.D=SPR7', ctx); const D = ctx.D;
const r = new GifReader(fs.readFileSync('sheet7.gif')), W = r.width;
const fr = []; for (let i = 0; i < 8; i++) { const b = new Uint8Array(W * r.height * 4); r.decodeAndBlitFrameRGBA(i, b); fr.push(b); }
const hexRGB = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
// original walkS (126,200,173,305) vs convertido: lado a lado, 3x, quadros 0..7
const BS2 = +(process.env.BS||2); const name = process.argv[2] || 'walkS', box = JSON.parse(process.argv[3] || '[126,200,173,305]');
const s = D.slots[name], K = 3, CW = 64 * K, CH = 120 * K, OW = CW * 8, OH = CH * 2, o = new Uint8Array(OW * OH * 4).fill(140); for (let i = 3; i < o.length; i += 4) o[i] = 255;
for (let f = 0; f < 8; f++) {
  for (let y = 0; y < 116; y++) for (let x = 0; x < 60; x++) { const sx = box[0] - 6 + x, sy = box[1] - 6 + y, si = (sy * W + sx) * 4; for (let yy = 0; yy < K; yy++) for (let xx = 0; xx < K; xx++) { const d = ((y * K + yy) * OW + f * CW + x * K + xx) * 4; o[d] = fr[f][si]; o[d + 1] = fr[f][si + 1]; o[d + 2] = fr[f][si + 2]; } }
  const rows = s.frames[f]; rows.forEach((row, y) => { for (let i = 0; i < row.length; i++) if (row[i] !== '.') { const c = hexRGB(D.pal[row[i]]); for (let yy = 0; yy < BS2 * K; yy++) for (let xx = 0; xx < BS2 * K; xx++) { const d = ((CH + 10 + y * BS2 * K + yy) * OW + f * CW + 10 + i * BS2 * K + xx) * 4; if (d < o.length) { o[d] = c[0]; o[d + 1] = c[1]; o[d + 2] = c[2]; } } } });
}
fs.writeFileSync('fid7b_' + name + '.png', encodePNG(OW, OH, o));
