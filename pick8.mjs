import fs from 'node:fs'; import { createRequire } from 'node:module'; import { encodePNG } from './pngenc.mjs'; import { decodeJPG } from './jpgdec.mjs';
const require = createRequire(import.meta.url); const { GifReader } = require('omggif');
const r = new GifReader(fs.readFileSync('sheet8.gif')), W = r.width, H = r.height;
const want = process.argv.slice(2).map(Number), [x0, y0, x1, y1] = [305, 215, 400, 390], K = 3;
const CW = (x1 - x0) * K + 8, CH = (y1 - y0) * K + 8, OW = CW * (want.length + 1), OH = CH, o = new Uint8Array(OW * OH * 4).fill(30); for (let i = 3; i < o.length; i += 4) o[i] = 255;
const buf = new Uint8Array(W * H * 4); let wi = 0;
for (let i = 0; i <= Math.max(...want); i++) { r.decodeAndBlitFrameRGBA(i, buf); if (i !== want[wi]) continue; const c = wi++;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const s = (y * W + x) * 4; for (let yy = 0; yy < K; yy++) for (let xx = 0; xx < K; xx++) { const d = ((4 + (y - y0) * K + yy) * OW + c * CW + 4 + (x - x0) * K + xx) * 4; o[d] = buf[s]; o[d + 1] = buf[s + 1]; o[d + 2] = buf[s + 2]; } } }
// 9.jpg: personagem da cozinha
const j = decodeJPG('sheet9.jpg'); const [a0, b0, a1, b1] = [835, 290, 930, 475]; const c = want.length;
for (let y = b0; y < b1; y++) for (let x = a0; x < a1; x++) { const s = (y * j.w + x) * 4; for (let yy = 0; yy < 2; yy++) for (let xx = 0; xx < 2; xx++) { const d = ((4 + (y - b0) * 2 + yy) * OW + c * CW + 4 + (x - a0) * 2 + xx) * 4; o[d] = j.data[s]; o[d + 1] = j.data[s + 1]; o[d + 2] = j.data[s + 2]; } }
fs.writeFileSync('pick8_a.png', encodePNG(OW, OH, o));
