// Usa a imagem do usuário como está (sem regravar em grade): só tira o fundo cinza e a sombra
import fs from 'node:fs'; import { decodePNG } from './pngdec.mjs'; import { encodePNG } from './pngenc.mjs';
const im = decodePNG('idle11.png'), W = im.w, H = im.h;
const px = (x, y) => { const i = (y * W + x) * 4; return [im.data[i], im.data[i + 1], im.data[i + 2]]; };
const dist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
const neutral = c => Math.max(...c) - Math.min(...c) < 9;
const keep = (x, y) => { if (x < 12 || y < 4 || x > 100) return false; const c = px(x, y); return dist(c, [133, 133, 133]) > 36 && !neutral(c); };
let x0 = W, y0 = H, x1 = 0, y1 = 0; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (keep(x, y)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
const w = x1 - x0 + 1, h = y1 - y0 + 1, o = new Uint8Array(w * h * 4);
for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const sx = x0 + x, sy = y0 + y, d = (y * w + x) * 4; if (keep(sx, sy)) { const c = px(sx, sy); o[d] = c[0]; o[d + 1] = c[1]; o[d + 2] = c[2]; o[d + 3] = 255; } }
let sum = 0, n = 0; for (let y = h - 28; y < h; y++) for (let x = 0; x < w; x++) if (o[(y * w + x) * 4 + 3]) { sum += x; n++; }
fs.writeFileSync('idle11_cut.png', encodePNG(w, h, o)); console.log(JSON.stringify({ w, h, cx: +(sum / n).toFixed(1), x0, y0 }));
