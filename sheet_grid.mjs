import { decodeJPG } from './jpgdec.mjs';
const im = decodeJPG(process.argv[2]), W = im.w, H = im.h;
const px = (x, y) => { const i = (y * W + x) * 4; return [im.data[i], im.data[i + 1], im.data[i + 2]]; };
const dist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
const regs = { frente: [184, 62, 476, 510], perfil: [653, 62, 835, 511], costas: [376, 572, 704, 1014] };
function best(arr, lo, hi, smin, smax) {
  let res = null;
  for (let s = smin; s <= smax; s += 0.02) for (let ph = 0; ph < s; ph += 0.25) {
    let score = 0, tot = 0;
    for (let i = lo; i <= hi; i++) if (arr[i]) { let d = ((i - ph) % s + s) % s; d = Math.min(d, s - d); score += arr[i] * (1 - Math.min(1, d / (s / 4))); tot += arr[i]; }
    const f = score / tot; if (!res || f > res.f) res = { s: +s.toFixed(2), ph, f: +f.toFixed(3) };
  }
  return res;
}
for (const [n, [x0, y0, x1, y1]] of Object.entries(regs)) {
  const cx = new Float64Array(W), cy = new Float64Array(H);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    if (x + 1 <= x1 && dist(px(x, y), px(x + 1, y)) > 50) cx[x + 1]++;
    if (y + 1 <= y1 && dist(px(x, y), px(x, y + 1)) > 50) cy[y + 1]++;
  }
  console.log(n, 'x', best(cx, x0, x1, 5, 14), 'y', best(cy, y0, y1, 5, 14));
}
