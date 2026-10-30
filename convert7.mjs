// Converte a folha animada (GIF de 8 quadros, pixel de 4x4) em grades por direção/andamento
import fs from 'node:fs'; import { createRequire } from 'node:module';
const require = createRequire(import.meta.url); const { GifReader } = require('omggif');
const r = new GifReader(fs.readFileSync('sheet7.gif')), W = r.width, H = r.height, NF = 8, BS = +(process.env.BS || 2);
const frames = []; for (let i = 0; i < NF; i++) { const b = new Uint8Array(W * H * 4); r.decodeAndBlitFrameRGBA(i, b); frames.push(b); }
const BG = [140, 140, 140];
const at = (f, x, y) => { const i = (y * W + x) * 4; return [frames[f][i], frames[f][i + 1], frames[f][i + 2]]; };
const dist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
const SLOTS = { // nome: [caixa x0,y0,x1,y1]
  walkN: [18, 74, 65, 183], walkNW: [96, 74, 131, 181], walkW: [168, 74, 199, 181], walkSW: [58, 198, 99, 305], walkS: [126, 200, 173, 305],
  runN: [356, 76, 405, 189], runNW: [436, 80, 477, 185], runW: [514, 80, 559, 179], runSW: [442, 214, 493, 309], runS: [358, 210, 413, 309],
};

// caixa que contém o sprite inteiro em TODOS os quadros (componentes conectados por quadro)
function unionBox([bx0, by0, bx1, by1]) {
  let a = 1e9, b = 1e9, c = -1, d = -1;
  for (let f = 0; f < NF; f++) {
    const lab = new Int32Array(W * H); let n = 0;
    const fg = (x, y) => dist(at(f, x, y), BG) > 24;
    for (let y0 = by0 - 30; y0 <= by1 + 30; y0++) for (let x0 = bx0 - 30; x0 <= bx1 + 30; x0++) {
      if (x0 < 0 || y0 < 0 || x0 >= W || y0 >= H || lab[y0 * W + x0] || !fg(x0, y0)) continue;
      if (x0 < bx0 || x0 > bx1 || y0 < by0 || y0 > by1) continue; // semente dentro da caixa original
      n++; const st = [[x0, y0]]; lab[y0 * W + x0] = n;
      while (st.length) { const [cx, cy] = st.pop(); a = Math.min(a, cx); b = Math.min(b, cy); c = Math.max(c, cx); d = Math.max(d, cy);
        for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const X = cx + dx, Y = cy + dy; if (X < 0 || Y < 0 || X >= W || Y >= H || lab[Y * W + X] || !fg(X, Y)) continue; lab[Y * W + X] = n; st.push([X, Y]); } }
    }
  }
  return [a - 2, b - 2, c + 2, d + 2];
}
const cells = {};
for (const [name, [bx0, by0, bx1, by1]] of Object.entries(SLOTS)) {
  const [X0, Y0, X1, Y1] = unionBox([bx0, by0, bx1, by1]); console.log(name, "caixa", [bx0, by0, bx1, by1].join(), "->", [X0, Y0, X1, Y1].join());
  // fase da grade: a que mais gera blocos 4x4 uniformes
  let bp = [0, 0], bs = -1;
  for (let py = 0; py < BS; py++) for (let px = 0; px < BS; px++) { let s = 0; for (let f = 0; f < NF; f++) for (let y = Y0 + py; y + BS <= Y1; y += BS) for (let x = X0 + px; x + BS <= X1; x += BS) { const c = at(f, x, y); if (dist(c, at(f, x + BS - 1, y + BS - 1)) < 6 && dist(c, at(f, x + BS - 1, y)) < 6 && dist(c, at(f, x, y + BS - 1)) < 6) s++; } if (s > bs) { bs = s; bp = [px, py]; } }
  const [px, py] = bp, kx0 = Math.floor((X0 - px) / BS), kx1 = Math.floor((X1 - px) / BS), ky0 = Math.floor((Y0 - py) / BS), ky1 = Math.floor((Y1 - py) / BS);
  const per = [];
  for (let f = 0; f < NF; f++) { const g = []; for (let ky = ky0; ky <= ky1; ky++) { const row = []; for (let kx = kx0; kx <= kx1; kx++) { const c = at(f, px + kx * BS + (BS >> 1), py + ky * BS + (BS >> 1)); row.push(dist(c, BG) <= 24 ? null : c); } g.push(row); } per.push(g); }
  cells[name] = per; console.log(name, 'fase', bp, 'blocos uniformes', bs);
}
// paleta global
const T = 10, clusters = [], freq = new Map();
for (const per of Object.values(cells)) for (const g of per) for (const row of g) for (const c of row) if (c) { const k = c.join(','); freq.set(k, (freq.get(k) || 0) + 1); }
for (const [k] of [...freq.entries()].sort((a, b) => b[1] - a[1])) { const c = k.split(',').map(Number), n = freq.get(k); let f = null; for (const cl of clusters) if (dist(cl.c, c) <= T) { f = cl; break; } if (f) { f.n += n; f.sum = f.sum.map((v, i) => v + c[i] * n); f.c = f.sum.map(v => Math.round(v / f.n)); } else clusters.push({ c, n, sum: c.map(v => v * n) }); }
const CH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&*+-=?@^_~'; const pal = {}; clusters.forEach((cl, i) => pal[CH[i]] = '#' + cl.c.map(v => v.toString(16).padStart(2, '0')).join(''));
const idx = c => { let bi = 0, bd = 1e9; clusters.forEach((cl, i) => { const d = dist(cl.c, c); if (d < bd) { bd = d; bi = i; } }); return CH[bi]; };
const out = { pal, slots: {} };
for (const [name, per] of Object.entries(cells)) {
  const g8 = per.map(g => g.map(row => row.map(c => c ? idx(c) : '.')));
  // recorte comum a todos os quadros
  let t = 1e9, b = -1, l = 1e9, rr = -1; g8.forEach(g => g.forEach((row, y) => row.forEach((ch, x) => { if (ch !== '.') { t = Math.min(t, y); b = Math.max(b, y); l = Math.min(l, x); rr = Math.max(rr, x); } })));
  const fr = g8.map(g => g.slice(t, b + 1).map(row => row.slice(l, rr + 1).join('')));
  // quadro "parado": pés mais juntos (menor largura nas 5 últimas linhas)
  let idle = 0, bw = 1e9; fr.forEach((g, i) => { let mn = 1e9, mx = -1; g.slice(-5).forEach(s => { const a = s.search(/[^.]/); if (a >= 0) { mn = Math.min(mn, a); mx = Math.max(mx, s.length - 1 - [...s].reverse().findIndex(ch => ch !== '.')); } }); if (mx - mn < bw) { bw = mx - mn; idle = i; } });
  // x do corpo: média do centro da cabeça (primeiras 4 linhas) nos quadros
  let cxs = 0, nc = 0; fr.forEach(g => g.slice(0, 5).forEach(s => { const a = s.search(/[^.]/); if (a >= 0) { cxs += (a + s.length - 1 - [...s].reverse().findIndex(ch => ch !== '.')) / 2; nc++; } }));
  out.slots[name] = { w: fr[0][0].length, h: fr[0].length, cx: +(cxs / nc).toFixed(1), idle, frames: fr };
  console.log(name, out.slots[name].w, 'x', out.slots[name].h, 'cx', out.slots[name].cx, 'idle', idle);
}
console.log('cores', clusters.length);
fs.writeFileSync('sprites7.js', 'const SPR7 = ' + JSON.stringify(out) + ';\n');
