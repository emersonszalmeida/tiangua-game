import fs from 'node:fs'; import { createRequire } from 'node:module';
const require = createRequire(import.meta.url); const { GifReader } = require('omggif');
const r = new GifReader(fs.readFileSync('sheet8.gif')), W = r.width, H = r.height, buf = new Uint8Array(W * H * 4);
const fi = +process.argv[2]; for (let i = 0; i <= fi; i++) r.decodeAndBlitFrameRGBA(i, buf);
const px = (x, y) => { const i = (y * W + x) * 4; return [buf[i], buf[i + 1], buf[i + 2]]; };
const dist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
const [x0, y0, x1, y1] = [315, 220, 390, 388];
const cx = new Float64Array(W + 2), cy = new Float64Array(H + 2);
for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { if (dist(px(x, y), px(x + 1, y)) > 30) cx[x + 1]++; if (dist(px(x, y), px(x, y + 1)) > 30) cy[y + 1]++; }
const best = (arr, lo, hi) => { let res = []; for (let s = 2; s <= 6; s += 0.02) for (let ph = 0; ph < s; ph += .25) { let sc = 0, t = 0; for (let i = lo; i <= hi; i++) if (arr[i]) { let d = ((i - ph) % s + s) % s; d = Math.min(d, s - d); sc += arr[i] * (1 - Math.min(1, d / (s / 4))); t += arr[i]; } res.push({ s: +s.toFixed(2), ph, f: +(sc / t).toFixed(3) }); } return res.sort((a, b) => b.f - a.f).slice(0, 3); };
console.log('quadro', fi, 'x', JSON.stringify(best(cx, x0, x1)), 'y', JSON.stringify(best(cy, y0, y1)));
