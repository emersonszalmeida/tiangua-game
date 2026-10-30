import { decodeGIF } from './gifdec.mjs';
const im = decodeGIF('sheet7.gif'), W = im.w, H = im.h;
const px = (x, y) => { const i = (y * W + x) * 4; return [im.data[i], im.data[i + 1], im.data[i + 2]]; };
const dist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
const boxes = [[18,74,65,183],[96,74,131,181],[168,74,199,181],[270,74,309,189],[356,76,405,189],[436,80,477,185],[514,80,559,179],[58,198,99,305],[126,200,173,305],[358,210,413,309],[260,212,307,327],[520,212,573,309],[442,214,493,309]];
for (const [k, [x0, y0, x1, y1]] of boxes.entries()) {
  const cx = new Float64Array(W), cy = new Float64Array(H);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { if (dist(px(x, y), px(x + 1, y)) > 12) cx[x + 1]++; if (dist(px(x, y), px(x, y + 1)) > 12) cy[y + 1]++; }
  const best = (arr, lo, hi) => { let r = null; for (let s = 3; s <= 9; s += 0.02) for (let ph = 0; ph < s; ph += .25) { let sc = 0, t = 0; for (let i = lo; i <= hi; i++) if (arr[i]) { let d = ((i - ph) % s + s) % s; d = Math.min(d, s - d); sc += arr[i] * (1 - Math.min(1, d / (s / 4))); t += arr[i]; } const f = sc / t; if (!r || f > r.f) r = { s: +s.toFixed(2), ph, f: +f.toFixed(3) }; } return r; };
  console.log(k, 'x', JSON.stringify(best(cx, x0, x1)), 'y', JSON.stringify(best(cy, y0, y1)));
}
