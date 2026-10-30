// Converte a folha (frente/perfil/costas) gerada por IA em grades de pixels com paleta compartilhada
import fs from 'node:fs';
import { decodeJPG } from './jpgdec.mjs';
const [file, out, thr = '34'] = process.argv.slice(2);
const im = decodeJPG(file), W = im.w;
const BG = [102, 102, 102];
const px = (x, y) => { const i = (y * W + x) * 4; return [im.data[i], im.data[i + 1], im.data[i + 2]]; };
const dist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
const med = a => { a.sort((p, q) => p - q); return a[a.length >> 1]; };
const VIEWS = {
  frente: { box: [184, 62, 476, 510], sx: 10.06, phx: 4.75, sy: 9.98, phy: 3 },
  perfil: { box: [653, 62, 835, 511], sx: 10.1, phx: 7, sy: 10, phy: 3 },
  costas: { box: [376, 572, 704, 1014], sx: 10.56, phx: 7.75, sy: 10.42, phy: 7.25 },
};
const cellsOf = v => {
  const [x0, y0, x1, y1] = v.box, rows = [];
  const kx0 = Math.floor((x0 - v.phx) / v.sx), kx1 = Math.floor((x1 - v.phx) / v.sx), ky0 = Math.floor((y0 - v.phy) / v.sy), ky1 = Math.floor((y1 - v.phy) / v.sy);
  for (let ky = ky0; ky <= ky1; ky++) {
    const row = [];
    for (let kx = kx0; kx <= kx1; kx++) {
      const xa = Math.round(v.phx + kx * v.sx + v.sx * .25), xb = Math.round(v.phx + kx * v.sx + v.sx * .75), ya = Math.round(v.phy + ky * v.sy + v.sy * .25), yb = Math.round(v.phy + ky * v.sy + v.sy * .75);
      const R = [], G = [], B = [];
      for (let y = ya; y <= yb; y++) for (let x = xa; x <= xb; x++) { const c = px(x, y); R.push(c[0]); G.push(c[1]); B.push(c[2]); }
      row.push([med(R), med(G), med(B)]);
    }
    rows.push(row);
  }
  return rows;
};
const all = {}; for (const [n, v] of Object.entries(VIEWS)) all[n] = cellsOf(v);
const T = +thr, clusters = [], freq = new Map();
for (const rows of Object.values(all)) for (const row of rows) for (const c of row) if (dist(c, BG) > 40) { const k = c.join(','); freq.set(k, (freq.get(k) || 0) + 1); }
for (const [k] of [...freq.entries()].sort((a, b) => b[1] - a[1])) {
  const c = k.split(',').map(Number), n = freq.get(k); let f = null;
  for (const cl of clusters) if (dist(cl.c, c) <= T) { f = cl; break; }
  if (f) { f.n += n; f.sum = f.sum.map((v, i) => v + c[i] * n); f.c = f.sum.map(v => Math.round(v / f.n)); } else clusters.push({ c, n, sum: c.map(v => v * n) });
}
const CH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const pal = {}; clusters.forEach((cl, i) => pal[CH[i]] = '#' + cl.c.map(v => v.toString(16).padStart(2, '0')).join(''));
const res = {};
for (const [n, cells] of Object.entries(all)) {
  const rows = cells.map(row => row.map(c => { if (dist(c, BG) <= 40) return '.'; let bi = 0, bd = 1e9; clusters.forEach((cl, i) => { const d = dist(cl.c, c); if (d < bd) { bd = d; bi = i; } }); return CH[bi]; }).join(''));
  let top = 0, bot = rows.length - 1; while (top < bot && /^\.*$/.test(rows[top])) top++; while (bot > top && /^\.*$/.test(rows[bot])) bot--;
  let l = 999, r = 0; for (let y = top; y <= bot; y++) { const s = rows[y]; const a = s.search(/[^.]/); if (a >= 0) { l = Math.min(l, a); r = Math.max(r, s.length - 1 - [...s].reverse().findIndex(ch => ch !== '.')); } }
  const g = rows.slice(top, bot + 1).map(s => s.slice(l, r + 1));
  res[n] = { w: g[0].length, h: g.length, rows: g };
  console.log(n, g[0].length, 'x', g.length);
}
console.log('cores', clusters.length);
fs.writeFileSync(out, 'const SPRITE_SET = ' + JSON.stringify({ pal, ...res }) + ';\n');
