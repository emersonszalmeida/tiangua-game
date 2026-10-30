import { decodePNG } from './pngdec.mjs';
const im = decodePNG('idle11.png'), W = im.w, H = im.h;
const px = (x, y) => { const i = (y * W + x) * 4; return [im.data[i], im.data[i + 1], im.data[i + 2]]; };
const dist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
const neutral = c => Math.max(...c) - Math.min(...c) < 9;
let x0 = W, y0 = H, x1 = 0, y1 = 0;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const c = px(x, y); if (dist(c, [133, 133, 133]) > 40 && !neutral(c)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } }
console.log('bbox', x0, y0, x1, y1, x1 - x0 + 1, 'x', y1 - y0 + 1);
const cx = new Float64Array(W + 2), cy = new Float64Array(H + 2);
for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { if (dist(px(x, y), px(x + 1, y)) > 20) cx[x + 1]++; if (dist(px(x, y), px(x, y + 1)) > 20) cy[y + 1]++; }
const best = (arr, lo, hi) => { let r = []; for (let s = 2; s <= 6; s += 0.01) for (let ph = 0; ph < s; ph += .1) { let sc = 0, t = 0; for (let i = lo; i <= hi; i++) if (arr[i]) { let d = ((i - ph) % s + s) % s; d = Math.min(d, s - d); sc += arr[i] * (1 - Math.min(1, d / (s / 4))); t += arr[i]; } r.push({ s: +s.toFixed(2), ph: +ph.toFixed(1), f: sc / t }); } return r.sort((a, b) => b.f - a.f).slice(0, 4); };
console.log('x', JSON.stringify(best(cx, x0, x1))); console.log('y', JSON.stringify(best(cy, y0, y1)));
