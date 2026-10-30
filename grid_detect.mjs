// Descobre o tamanho do "pixel" da imagem gerada por IA e converte para uma grade
import { decodePNG } from './pngdec.mjs';
const im = decodePNG(process.argv[2]);
const BG = [105, 107, 106], W = im.w, H = im.h;
const px = (x, y) => { const i = (y * W + x) * 4; return [im.data[i], im.data[i + 1], im.data[i + 2]]; };
const dist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
const isCyan = c => c[2] > 180 && c[0] < 140;
const LIMY = +process.argv[3] || 680; // só acima da linha ciano
let x0 = W, x1 = 0, y0 = H, y1 = 0;
for (let y = 0; y < LIMY; y++) for (let x = 0; x < W; x++) if (dist(px(x, y), BG) > 30) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
console.log('bbox', x0, y0, x1, y1, 'tam', x1 - x0 + 1, 'x', y1 - y0 + 1);
// posições de mudança forte
const cx = new Float64Array(W), cy = new Float64Array(H);
for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
  if (x + 1 <= x1 && dist(px(x, y), px(x + 1, y)) > 60) cx[x + 1]++;
  if (y + 1 <= y1 && dist(px(x, y), px(x, y + 1)) > 60) cy[y + 1]++;
}
function best(arr, lo, hi) {
  let res = null;
  for (let s = 5; s <= 16; s += 0.02) for (let ph = 0; ph < s; ph += 0.25) {
    let score = 0, tot = 0;
    for (let i = lo; i <= hi; i++) if (arr[i]) { let d = ((i - ph) % s + s) % s; d = Math.min(d, s - d); score += arr[i] * (1 - Math.min(1, d / (s / 4))); tot += arr[i]; }
    const f = score / tot; if (!res || f > res.f) res = { s, ph, f };
  }
  return res;
}
console.log('x:', best(cx, x0, x1), ' y:', best(cy, y0, y1));
