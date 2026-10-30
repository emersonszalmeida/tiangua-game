import { decodePNG } from './pngdec.mjs';
const im = decodePNG('draw12.png'), W = im.w, H = im.h;
const px = (x, y) => { const i = (y * W + x) * 4; return [im.data[i], im.data[i + 1], im.data[i + 2]]; };
const dist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
const cx = new Float64Array(W + 2), cy = new Float64Array(H + 2);
for (let y = 3; y < H - 3; y++) for (let x = 3; x < W - 3; x++) { if (dist(px(x, y), px(x + 1, y)) > 14) cx[x + 1]++; if (dist(px(x, y), px(x, y + 1)) > 14) cy[y + 1]++; }
const best = (arr, lo, hi) => { let r = null; for (let s = 9; s <= 16; s += 0.01) for (let ph = 0; ph < s; ph += .25) { let sc = 0, t = 0; for (let i = lo; i <= hi; i++) if (arr[i]) { let d = ((i - ph) % s + s) % s; d = Math.min(d, s - d); sc += arr[i] * (1 - Math.min(1, d / 2)); t += arr[i]; } const f = sc / t; if (!r || f > r.f) r = { s: +s.toFixed(2), ph, f: +f.toFixed(3) }; } return r; };
console.log('x', JSON.stringify(best(cx, 3, W - 3)), 'y', JSON.stringify(best(cy, 3, H - 3)));
const S = 13.27, PX = 12.75, PY = 8, med = a => { a.sort((p, q) => p - q); return a[a.length >> 1]; };
const kx0 = Math.floor((0 - PX) / S), ky0 = Math.floor((0 - PY) / S), nx = Math.ceil((W - PX) / S) - kx0, ny = Math.ceil((H - PY) / S) - ky0;
const cells = [];
for (let ky = 0; ky < ny; ky++) { const row = []; for (let kx = 0; kx < nx; kx++) { const x0 = PX + (kx + kx0) * S, y0 = PY + (ky + ky0) * S, R = [], G = [], B = [];
  for (let y = Math.round(y0 + S * .3); y <= Math.round(y0 + S * .7); y++) for (let x = Math.round(x0 + S * .3); x <= Math.round(x0 + S * .7); x++) { if (x < 0 || y < 0 || x >= W || y >= H) continue; const c = px(x, y); R.push(c[0]); G.push(c[1]); B.push(c[2]); }
  row.push(R.length ? [med(R), med(G), med(B)] : null); } cells.push(row); }
const freq = new Map(); cells.forEach(r => r.forEach(c => { if (c) { const k = c.join(','); freq.set(k, (freq.get(k) || 0) + 1); } }));
console.log('grade', nx, 'x', ny); console.log([...freq.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => k + ':' + n).join('  '));
import fs from 'node:fs'; fs.writeFileSync('cells12.json', JSON.stringify(cells));
