import fs from 'node:fs'; import { createRequire } from 'node:module'; import { encodePNG } from './pngenc.mjs'; import { decodeJPG } from './jpgdec.mjs';
const require = createRequire(import.meta.url); const { GifReader } = require('omggif');
const r = new GifReader(fs.readFileSync('sheet8.gif')), W = r.width, H = r.height, N = r.numFrames();
const [x0, y0, x1, y1] = [285, 215, 405, 392], K = 2, OW = (x1 - x0) * K, OH = (y1 - y0) * K, buf = new Uint8Array(W * H * 4);
const save = (name, get, w, h) => { const o = new Uint8Array(w * h * 4); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const c = get(x, y), d = (y * w + x) * 4; o[d] = c[0]; o[d + 1] = c[1]; o[d + 2] = c[2]; o[d + 3] = 255; } fs.writeFileSync(name, encodePNG(w, h, o)); };
for (let i = 0; i < N; i++) { r.decodeAndBlitFrameRGBA(i, buf); save('frames8/f' + String(i).padStart(2, '0') + '.png', (x, y) => { const s = (((y0 + (y / K | 0)) * W) + x0 + (x / K | 0)) * 4; return [buf[s], buf[s + 1], buf[s + 2]]; }, OW, OH); }
const j = decodeJPG('sheet9.jpg'); const [a0, b0, a1, b1] = [830, 285, 935, 480]; save('frames8/cozinha.png', (x, y) => { const s = (((b0 + (y / K | 0)) * j.w) + a0 + (x / K | 0)) * 4; return [j.data[s], j.data[s + 1], j.data[s + 2]]; }, (a1 - a0) * K, (b1 - b0) * K);
console.log('ok', N);
