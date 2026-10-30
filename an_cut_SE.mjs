import { decodePNG } from './pngdec.mjs';
const im = decodePNG('cut_SE.png'), W = im.w, H = im.h; const px = (x, y) => { const i = (y * W + x) * 4; return [im.data[i], im.data[i + 1], im.data[i + 2]]; };
const dist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
// pontuação: fração de bordas de cor (mudança forte) que caem perto de uma fronteira de grade
const ex = [], ey = [];
for (let y = 20; y < H - 20; y++) for (let x = 20; x < W - 20; x++) { const a = px(x, y); if (dist(a, px(x + 1, y)) > 60) ex.push(x + 1); if (dist(a, px(x, y + 1)) > 60) ey.push(y + 1); }
const score = (arr, s, ph) => { let ok = 0; for (const i of arr) { let d = ((i - ph) % s + s) % s; d = Math.min(d, s - d); if (d < 0.8) ok++; } return ok / arr.length; };
for (const [n, arr] of [['x', ex], ['y', ey]]) { const r = []; for (let s = 6; s <= 12; s += 0.01) for (let ph = 0; ph < s; ph += .2) r.push({ s: +s.toFixed(2), ph: +ph.toFixed(1), f: +score(arr, s, ph).toFixed(3) }); r.sort((a, b) => b.f - a.f); console.log(n, arr.length, JSON.stringify(r.slice(0, 6))); }
