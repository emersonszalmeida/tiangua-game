import fs from 'node:fs'; import { createRequire } from 'node:module'; import { encodePNG } from './pngenc.mjs';
const require = createRequire(import.meta.url); const { GifReader } = require('omggif');
const r = new GifReader(fs.readFileSync('sheet8.gif')), W = r.width, H = r.height, N = r.numFrames();
const [x0, y0, x1, y1] = [305, 215, 400, 390], step = +process.argv[2] || 4, K = 1, cols = 28;
const idx = []; for (let i = 0; i < N; i += step) idx.push(i);
const CW = (x1 - x0) * K + 6, CH = (y1 - y0) * K + 6, rows = Math.ceil(idx.length / cols), OW = CW * cols, OH = CH * rows, o = new Uint8Array(OW * OH * 4).fill(40); for (let i = 3; i < o.length; i += 4) o[i] = 255;
const buf = new Uint8Array(W * H * 4);
let li = 0;
for (let i = 0; i < N; i++) { r.decodeAndBlitFrameRGBA(i, buf); // blit acumula sobre buffer (disposal tratado pela lib)
  if (i !== idx[li]) continue; const c = li % cols, rw = Math.floor(li / cols); li++;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const s = (y * W + x) * 4; for (let yy = 0; yy < K; yy++) for (let xx = 0; xx < K; xx++) { const d = ((rw * CH + 3 + (y - y0) * K + yy) * OW + c * CW + 3 + (x - x0) * K + xx) * 4; o[d] = buf[s]; o[d + 1] = buf[s + 1]; o[d + 2] = buf[s + 2]; } } }
fs.writeFileSync('mont8b.png', encodePNG(OW, OH, o)); console.log(idx.length, OW, OH);
