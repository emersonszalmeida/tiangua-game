import fs from 'node:fs'; import { decodePNG } from './pngdec.mjs'; import { encodePNG } from './pngenc.mjs';
const [i, o, k] = process.argv.slice(2); const im = decodePNG(i), K = +k, W = im.w * K, H = im.h * K, d = new Uint8Array(W * H * 4);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const s = ((y / K | 0) * im.w + (x / K | 0)) * 4, t = (y * W + x) * 4; for (let c = 0; c < 4; c++) d[t + c] = im.data[s + c]; }
fs.writeFileSync(o, encodePNG(W, H, d));
