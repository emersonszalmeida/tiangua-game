// Converte um recorte feito pelo usuário (fundo xadrez, pixel grande e exato) em grade com a paleta da folha limpa
import fs from 'node:fs'; import vm from 'node:vm'; import { decodePNG } from './pngdec.mjs';
const ctx = {}; vm.runInNewContext(fs.readFileSync('sprites7.js', 'utf8') + ';this.D=SPR7', ctx); const PAL = ctx.D.pal;
const [file, outJson, S, PX, PY, mapFile] = process.argv.slice(2);
const im = decodePNG(file), W = im.w, H = im.h, cs = +S, px0 = +PX, py0 = +PY;
const px = (x, y) => { const i = (y * W + x) * 4; return [im.data[i], im.data[i + 1], im.data[i + 2]]; };
const med = a => { a.sort((p, q) => p - q); return a[a.length >> 1]; };
const hexRGB = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), dist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
const isBg = c => (c[0] === c[1] && c[1] === c[2]) && [76, 85, 160].includes(c[0]);
const nx = Math.floor((W - px0) / cs), ny = Math.floor((H - py0) / cs), a0 = Math.round(cs * .3), a1 = Math.round(cs * .7);
const cells = []; for (let ky = 0; ky < ny; ky++) { const row = []; for (let kx = 0; kx < nx; kx++) { const R = [], G = [], B = []; for (let y = a0; y <= a1; y++) for (let x = a0; x <= a1; x++) { const c = px(Math.round(px0 + kx * cs + x), Math.round(py0 + ky * cs + y)); R.push(c[0]); G.push(c[1]); B.push(c[2]); } const c = [med(R), med(G), med(B)]; row.push(isBg(c) ? null : c); } cells.push(row); }
const freq = new Map(); cells.forEach(r => r.forEach(c => { if (c) { const k = c.join(','); freq.set(k, (freq.get(k) || 0) + 1); } }));
const list = [...freq.entries()].sort((a, b) => b[1] - a[1]);
console.log('grade', nx, 'x', ny, 'cores:', list.map(([k, n]) => k + ':' + n).join('  '));
// junta cores muito parecidas (granulado do cenário) na mais frequente
const reps = []; const repOf = new Map(); for (const [k] of list) { const c = k.split(',').map(Number); let f = reps.find(r => dist(r.c, c) <= 24); if (!f) { f = { c, k }; reps.push(f); } repOf.set(k, f.k); }
console.log('grupos:', reps.map(r => r.k + ':' + list.filter(([k]) => repOf.get(k) === r.k).reduce((a, [, n]) => a + n, 0)).join('  '));
const map = mapFile && fs.existsSync(mapFile) ? JSON.parse(fs.readFileSync(mapFile, 'utf8')) : {};
const rows = cells.map(r => r.map(c => { if (!c) return '.'; const k = c.join(','); return map[repOf.get(k)] || '?'; }).join(''));
let t = 0, b = rows.length - 1; while (/^\.*$/.test(rows[t])) t++; while (/^\.*$/.test(rows[b])) b--; const rr = rows.slice(t, b + 1);
let l = 99, r2 = 0; rr.forEach(s => { const a = s.search(/[^.]/); if (a >= 0) { l = Math.min(l, a); r2 = Math.max(r2, s.length - 1 - [...s].reverse().findIndex(c => c !== '.')); } });
const g = rr.map(s => s.slice(l, r2 + 1)); console.log('recorte', g[0].length, 'x', g.length, 'sem mapa:', g.join('').split('?').length - 1);
fs.writeFileSync(outJson, JSON.stringify({ w: g[0].length, h: g.length, rows: g, colors: list.map(([k, n]) => [k, n]) }));
