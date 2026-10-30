// Converte um quadro do 8.gif (pixel exato de 3x3) em grade, tirando o cenário por cor + conectividade
import fs from 'node:fs'; import vm from 'node:vm'; import { createRequire } from 'node:module';
const require = createRequire(import.meta.url); const { GifReader } = require('omggif');
const ctx = {}; vm.runInNewContext(fs.readFileSync('sprites7.js', 'utf8') + ';this.D=SPR7', ctx); const PAL = ctx.D.pal;
const hexRGB = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), dist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
const pal = Object.entries(PAL).map(([k, v]) => [k, hexRGB(v)]);
const [fi, out, TH = '60'] = process.argv.slice(2);
const r = new GifReader(fs.readFileSync('sheet8.gif')), W = r.width, H = r.height, buf = new Uint8Array(W * H * 4); for (let i = 0; i <= +fi; i++) r.decodeAndBlitFrameRGBA(i, buf);
const px = (x, y) => { const i = (y * W + x) * 4; return [buf[i], buf[i + 1], buf[i + 2]]; };
const med = a => { a.sort((p, q) => p - q); return a[a.length >> 1]; };
const [X0, Y0, X1, Y1] = [300, 215, 405, 392], PX = 0, PY = 1, S = 3;
const kx0 = Math.ceil((X0 - PX) / S), kx1 = Math.floor((X1 - PX) / S) - 1, ky0 = Math.ceil((Y0 - PY) / S), ky1 = Math.floor((Y1 - PY) / S) - 1;
const cells = [];
for (let ky = ky0; ky <= ky1; ky++) { const row = []; for (let kx = kx0; kx <= kx1; kx++) { const R = [], G = [], B = []; for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const c = px(PX + kx * S + x, PY + ky * S + y); R.push(c[0]); G.push(c[1]); B.push(c[2]); } row.push([med(R), med(G), med(B)]); } cells.push(row); }
const nearest = c => { let bk = '.', bd = 1e9; for (const [k, v] of pal) { const d = dist(v, c); if (d < bd) { bd = d; bk = k; } } return [bk, bd]; };
const cand = cells.map(row => row.map(c => { const [k, d] = nearest(c); return d <= +TH ? k : '.'; }));
// componente conectado (8 vizinhos) que contém a maior parte do centro da imagem
const H2 = cand.length, W2 = cand[0].length, lab = Array.from({ length: H2 }, () => Array(W2).fill(0)); const comps = [];
for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) if (cand[y][x] !== '.' && !lab[y][x]) { const id = comps.length + 1, st = [[y, x]], cs = []; lab[y][x] = id; while (st.length) { const [cy, cx] = st.pop(); cs.push([cy, cx]); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const Y = cy + dy, X = cx + dx; if (Y < 0 || X < 0 || Y >= H2 || X >= W2 || lab[Y][X] || cand[Y][X] === '.') continue; lab[Y][X] = id; st.push([Y, X]); } } comps.push(cs); }
comps.sort((a, b) => b.length - a.length); const keep = comps[0];
const g = Array.from({ length: H2 }, () => Array(W2).fill('.')); keep.forEach(([y, x]) => g[y][x] = cand[y][x]);
let rows = g.map(r => r.join('')); let t = 0, b = rows.length - 1; while (/^\.*$/.test(rows[t])) t++; while (/^\.*$/.test(rows[b])) b--; rows = rows.slice(t, b + 1);
let l = 99, rr = 0; rows.forEach(s => { const a = s.search(/[^.]/); if (a >= 0) { l = Math.min(l, a); rr = Math.max(rr, s.length - 1 - [...s].reverse().findIndex(c => c !== '.')); } }); rows = rows.map(s => s.slice(l, rr + 1));
console.log('quadro', fi, 'grade', rows[0].length, 'x', rows.length, 'componentes', comps.length, 'maior', keep.length);
fs.writeFileSync(out, JSON.stringify({ w: rows[0].length, h: rows.length, rows }));
