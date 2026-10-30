import fs from 'node:fs'; import { createRequire } from 'node:module'; import { encodePNG } from './pngenc.mjs'; import { decodeJPG } from './jpgdec.mjs';
const require = createRequire(import.meta.url); const { GifReader } = require('omggif');
const r = new GifReader(fs.readFileSync('sheet8.gif')), W = r.width, H = r.height, buf = new Uint8Array(W * H * 4);
const save = (name, get, w, h, K) => { const o = new Uint8Array(w * K * h * K * 4); for (let y = 0; y < h * K; y++) for (let x = 0; x < w * K; x++) { const c = get((x / K) | 0, (y / K) | 0), d = (y * w * K + x) * 4; o[d] = c[0]; o[d + 1] = c[1]; o[d + 2] = c[2]; o[d + 3] = 255; } fs.writeFileSync(name + (K > 1 ? '_x' + K : '') + '.png', encodePNG(w * K, h * K, o)); };
const gif = [['S_frente_quadro01', 1], ['E_perfil_quadro16', 16], ['N_costas_quadro28', 28]];
const frames = {}; for (let i = 0; i <= 28; i++) { r.decodeAndBlitFrameRGBA(i, buf); if (gif.some(g => g[1] === i)) frames[i] = buf.slice(); }
const [x0, y0, x1, y1] = [309, 217, 396, 391];
for (const [n, f] of gif) for (const K of [1, 4]) save('para_recortar/' + n, (x, y) => { const s = ((y0 + y) * W + x0 + x) * 4; return [frames[f][s], frames[f][s + 1], frames[f][s + 2]]; }, x1 - x0, y1 - y0, K);
const j = decodeJPG('sheet9.jpg'), [a0, b0, a1, b1] = [836, 292, 928, 474];
for (const K of [1, 4]) save('para_recortar/SE_cozinha', (x, y) => { const s = ((b0 + y) * j.w + a0 + x) * 4; return [j.data[s], j.data[s + 1], j.data[s + 2]]; }, a1 - a0, b1 - b0, K);
console.log('ok');
