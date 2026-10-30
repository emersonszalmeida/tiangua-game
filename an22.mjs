import { decodePNG } from './pngdec.mjs';
const im = decodePNG('draw_E.png'), W = im.w, H = im.h; const px = (x, y) => { const i = (y * W + x) * 4; return [im.data[i], im.data[i + 1], im.data[i + 2], im.data[i + 3]]; };
console.log(W, H, 'cantos', px(2, 2), px(10, 2), px(2, 10), px(10, 10), px(W - 3, H - 3));
const f = new Map(); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const k = px(x, y).join(','); f.set(k, (f.get(k) || 0) + 1); }
console.log([...f.entries()].sort((a, b) => b[1] - a[1]).slice(0, 24).map(([k, n]) => k + ':' + n).join('  '));
const dist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
const cx = new Float64Array(W + 2), cy = new Float64Array(H + 2); for (let y = 0; y < H - 1; y++) for (let x = 0; x < W - 1; x++) { if (dist(px(x, y), px(x + 1, y)) > 25) cx[x + 1]++; if (dist(px(x, y), px(x, y + 1)) > 25) cy[y + 1]++; }
const best = (arr, lo, hi) => { const r = []; for (let s = 3; s <= 14; s += 0.01) for (let ph = 0; ph < s; ph += .25) { let sc = 0, t = 0; for (let i = lo; i <= hi; i++) if (arr[i]) { let d = ((i - ph) % s + s) % s; d = Math.min(d, s - d); sc += arr[i] * (1 - Math.min(1, d / (s / 4))); t += arr[i]; } r.push({ s: +s.toFixed(2), ph, f: +(sc / t).toFixed(3) }); } return r.sort((a, b) => b.f - a.f).slice(0, 3); };
console.log('x', JSON.stringify(best(cx, 4, W - 4))); console.log('y', JSON.stringify(best(cy, 4, H - 4)));
