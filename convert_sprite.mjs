// Converte a imagem de pixel art gerada por IA numa grade real (1 caractere por pixel)
import fs from 'node:fs';
import { decodePNG } from './pngdec.mjs';
const [file, out, limY = '680', thr = '34'] = process.argv.slice(2);
const im = decodePNG(file), W = im.w;
const BG = [105, 107, 106];
const px = (x, y) => { const i = (y * W + x) * 4; return [im.data[i], im.data[i + 1], im.data[i + 2]]; };
const dist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
const SX = 10.08, PHX = 10, SY = 10.08, PHY = 9.25, X0 = 392, Y0 = 219, X1 = 831, Y1 = +limY - 1;
const kx0 = Math.floor((X0 - PHX) / SX), kx1 = Math.floor((X1 - PHX) / SX), ky0 = Math.floor((Y0 - PHY) / SY), ky1 = Math.floor((Y1 - PHY) / SY);
const med = a => { a.sort((p, q) => p - q); return a[a.length >> 1]; };
const cells = [];
for (let ky = ky0; ky <= ky1; ky++) {
  const row = [];
  for (let kx = kx0; kx <= kx1; kx++) {
    const xa = Math.round(PHX + kx * SX + SX * .25), xb = Math.round(PHX + kx * SX + SX * .75), ya = Math.round(PHY + ky * SY + SY * .25), yb = Math.round(PHY + ky * SY + SY * .75);
    const R = [], G = [], B = [];
    for (let y = ya; y <= yb; y++) for (let x = xa; x <= xb; x++) { if (x < 0 || y < 0 || x >= W || y > Y1) continue; const c = px(x, y); R.push(c[0]); G.push(c[1]); B.push(c[2]); }
    row.push(R.length ? [med(R), med(G), med(B)] : BG);
  }
  cells.push(row);
}
// paleta por agrupamento guloso
const T = +thr, clusters = [];
const freq = new Map();
for (const row of cells) for (const c of row) if (dist(c, BG) > 24) { const k = c.join(','); freq.set(k, (freq.get(k) || 0) + 1); }
for (const [k] of [...freq.entries()].sort((a, b) => b[1] - a[1])) {
  const c = k.split(',').map(Number); let found = null;
  for (const cl of clusters) if (dist(cl.c, c) <= T) { found = cl; break; }
  if (found) { found.n += freq.get(k); found.sum = found.sum.map((v, i) => v + c[i] * freq.get(k)); found.c = found.sum.map(v => Math.round(v / found.n)); }
  else clusters.push({ c, n: freq.get(k), sum: c.map(v => v * freq.get(k)) });
}
const CH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const pal = {}; clusters.forEach((cl, i) => pal[CH[i]] = '#' + cl.c.map(v => v.toString(16).padStart(2, '0')).join(''));
const rows = cells.map(row => row.map(c => { if (dist(c, BG) <= 24) return '.'; let bi = 0, bd = 1e9; clusters.forEach((cl, i) => { const d = dist(cl.c, c); if (d < bd) { bd = d; bi = i; } }); return CH[bi]; }).join(''));
// recorta bordas vazias
let top = 0, bot = rows.length - 1; while (top < bot && /^\.*$/.test(rows[top])) top++; while (bot > top && /^\.*$/.test(rows[bot])) bot--;
let left = 99, right = 0; for (let y = top; y <= bot; y++) { const r = rows[y]; const l = r.search(/[^.]/); if (l >= 0) { left = Math.min(left, l); right = Math.max(right, r.length - 1 - [...r].reverse().findIndex(ch => ch !== '.')); } }
const grid = rows.slice(top, bot + 1).map(r => r.slice(left, right + 1));
console.log('grade', grid[0].length, 'x', grid.length, 'cores', clusters.length);
fs.writeFileSync(out, 'const SPRITE_REF = ' + JSON.stringify({ w: grid[0].length, h: grid.length, pal, rows: grid }) + ';\n');
