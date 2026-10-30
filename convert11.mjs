// Converte o parado NW enviado pelo usuário (imagem suavizada, bloco ~3px) para grade, usando a paleta da folha limpa
import fs from 'node:fs'; import vm from 'node:vm'; import { decodePNG } from './pngdec.mjs';
const ctx = {}; vm.runInNewContext(fs.readFileSync('sprites7.js', 'utf8') + ';this.D=SPR7', ctx); const PAL = ctx.D.pal;
const im = decodePNG('idle11.png'), W = im.w, S = +(process.argv[2] || 3);
const px = (x, y) => { const i = (y * W + x) * 4; return [im.data[i], im.data[i + 1], im.data[i + 2]]; };
const dist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
const hexRGB = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const pal = Object.entries(PAL).map(([k, v]) => [k, hexRGB(v)]);
const neutral = c => Math.max(...c) - Math.min(...c) < 9, BGc = [133, 133, 133];
const [X0, Y0, X1, Y1] = [22, 10, 88, 183];
const med = a => { a.sort((p, q) => p - q); return a[a.length >> 1]; };
const grid = (phx, phy) => { const rows = [], nx = Math.ceil((X1 - X0 + 1) / S) + 1, ny = Math.ceil((Y1 - Y0 + 1) / S) + 1; let err = 0, cnt = 0;
  for (let ky = 0; ky < ny; ky++) { let row = ''; for (let kx = 0; kx < nx; kx++) {
    const xa = Math.round(X0 + phx + kx * S + S * .25), xb = Math.round(X0 + phx + kx * S + S * .75), ya = Math.round(Y0 + phy + ky * S + S * .25), yb = Math.round(Y0 + phy + ky * S + S * .75);
    const R = [], G = [], B = []; for (let y = ya; y <= yb; y++) for (let x = xa; x <= xb; x++) { if (x < 0 || y < 0 || x >= W || y >= im.h) continue; const c = px(x, y); R.push(c[0]); G.push(c[1]); B.push(c[2]); }
    if (!R.length) { row += '.'; continue; } const c = [med(R), med(G), med(B)];
    if (dist(c, BGc) <= 36 || neutral(c)) { row += '.'; continue; }
    let bk = '.', bd = 1e9; for (const [k, v] of pal) { const d = dist(v, c); if (d < bd) { bd = d; bk = k; } } row += bk; err += bd; cnt++; }
    rows.push(row); }
  return { rows, err: err / cnt }; };
let best = null; for (let py = 0; py < S; py += .5) for (let pxx = 0; pxx < S; pxx += .5) { const g = grid(pxx - S, py - S + 0); if (!best || g.err < best.err) best = { ...g, ph: [pxx, py] }; }
// limpeza: tira células soltas e troca cinzas de borda (mistura com o fundo) pela cor vizinha mais comum
{ const R = best.rows.map(r => [...r]), H = R.length, Wd = R[0].length, at = (y, x) => (y >= 0 && x >= 0 && y < H && x < Wd) ? R[y][x] : '.';
  const grayish = k => k !== '.' && dist(hexRGB(PAL[k]), BGc) < 70;
  const out = R.map(r => r.slice());
  for (let y = 0; y < H; y++) for (let x = 0; x < Wd; x++) { const k = R[y][x]; if (k === '.') continue;
    const n4 = [at(y - 1, x), at(y + 1, x), at(y, x - 1), at(y, x + 1)].filter(c => c !== '.');
    if (n4.length < 2) { out[y][x] = '.'; continue; }
    if ('TYL'.includes(k) && n4.length < 4) { const nb = [at(y - 1, x), at(y + 1, x), at(y, x - 1), at(y, x + 1), at(y - 1, x - 1), at(y + 1, x - 1), at(y - 1, x + 1), at(y + 1, x + 1)]; if (nb.includes('A') && !nb.includes('B')) out[y][x] = 'H'; else if (nb.includes('D') && !nb.includes('A')) out[y][x] = 'E'; } }
  best.rows = out.map(r => r.join('')); }
console.log('fase', best.ph, 'erro médio', best.err.toFixed(1));
let rows = best.rows; let t = 0, b = rows.length - 1; while (/^\.*$/.test(rows[t])) t++; while (/^\.*$/.test(rows[b])) b--; rows = rows.slice(t, b + 1);
let l = 99, r = 0; rows.forEach(s => { const a = s.search(/[^.]/); if (a >= 0) { l = Math.min(l, a); r = Math.max(r, s.length - 1 - [...s].reverse().findIndex(c => c !== '.')); } }); rows = rows.map(s => s.slice(l, r + 1));
console.log('grade', rows[0].length, 'x', rows.length); rows.forEach((s, i) => console.log(String(i).padStart(2), s));
fs.writeFileSync('idle11.js', 'const IDLE11 = ' + JSON.stringify({ w: rows[0].length, h: rows.length, pal: PAL, rows }) + ';\n');
