// Converte uma árvore gerada por IA (fundo cinza chapado) em sprite na grade/paleta do jogo.
// uso: node convert_arvore.mjs <entrada.jpg|png> <saida.png> [fator=3] [cores=14] [bx by bw bh = recorte opcional]
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { encodePNG } from './pngenc.mjs';
const require = createRequire(import.meta.url);
const [, , inp, out, F = '3', K = '14', ...crop] = process.argv;
const f = +F, k = +K;
let im;
if (/\.jpe?g$/i.test(inp)) { const d = require('jpeg-js').decode(fs.readFileSync(inp), { useTArray: true }); im = { w: d.width, h: d.height, data: d.data }; }
else { const { decodePNG } = await import('./pngdec.mjs'); const d = decodePNG(inp); im = { w: d.w, h: d.h, data: d.data }; }
const { w: W, h: H, data } = im;
const px = (x, y) => { const i = (y * W + x) * 4; return [data[i], data[i + 1], data[i + 2]]; };
const bg = px(4, 4), dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

// 1) fundo: preenche a partir das bordas por cor parecida com o fundo
const alpha = new Uint8Array(W * H).fill(1), seen = new Uint8Array(W * H), st = [];
const isBg = (x, y) => { const c = px(x, y); return dist(c, bg) < 34 && Math.abs(c[0] - c[2]) < 24; };
for (let x = 0; x < W; x++) { st.push([x, 0], [x, H - 1]); } for (let y = 0; y < H; y++) { st.push([0, y], [W - 1, y]); }
while (st.length) { const [x, y] = st.pop(); if (x < 0 || y < 0 || x >= W || y >= H || seen[y * W + x]) continue; seen[y * W + x] = 1; if (!isBg(x, y)) continue; alpha[y * W + x] = 0; st.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]); }

// 1b) buracos de fundo dentro da copa (cinza claro e sem cor): não precisam estar ligados à borda
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (alpha[y * W + x] && isBg(x, y)) alpha[y * W + x] = 0;

// 2) tirar o losango de grama do pé da árvore (verde claro e borda marrom no fim da imagem), mantendo o tronco bege
const [cx0, cy0, cw, ch] = crop.map(Number);
if (crop.length === 4) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (x < cx0 || y < cy0 || x >= cx0 + cw || y >= cy0 + ch) alpha[y * W + x] = 0;
const grassY = H * .83, gx0 = +(process.env.TRONCO_X0 || 680), gx1 = +(process.env.TRONCO_X1 || 905);
for (let y = Math.floor(grassY); y < H; y++) for (let x = 0; x < W; x++) { const c = px(x, y); if (alpha[y * W + x] && ((c[1] > c[0] + 6 && c[1] > c[2] + 20) || x < gx0 || x > gx1)) alpha[y * W + x] = 0; }

// 2b) tira pixels soltos (sobras finas de contorno)
for (let it = 0; it < 3; it++) { const dl = []; for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) if (alpha[y * W + x]) { let n = 0; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if ((i || j) && alpha[(y + j) * W + x + i]) n++; if (n < 3) dl.push(y * W + x); } dl.forEach(i => alpha[i] = 0); }

// 3) recorte justo
let x0 = W, y0 = H, x1 = 0, y1 = 0;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (alpha[y * W + x]) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
const ow = Math.floor((x1 - x0 + 1) / f), oh = Math.floor((y1 - y0 + 1) / f);

// 4) reduz por média de caixa
const small = [];
for (let y = 0; y < oh; y++) for (let x = 0; x < ow; x++) {
  let r = 0, g = 0, b = 0, n = 0, a = 0;
  for (let j = 0; j < f; j++) for (let i = 0; i < f; i++) { const X = x0 + x * f + i, Y = y0 + y * f + j; if (alpha[Y * W + X]) { const c = px(X, Y); r += c[0]; g += c[1]; b += c[2]; n++; } a++; }
  small.push(n * 2 > a ? [r / n, g / n, b / n] : null);
}

// 5) paleta por k-means (sementes por quantil de brilho), depois troca cada pixel pela cor mais próxima
const pts = small.filter(Boolean), lum = c => c[0] * .3 + c[1] * .59 + c[2] * .11;
const sorted = [...pts].sort((a, b) => lum(a) - lum(b));
let cen = Array.from({ length: k }, (_, i) => [...sorted[Math.floor((i + .5) / k * sorted.length)]]);
for (let it = 0; it < 25; it++) {
  const sum = cen.map(() => [0, 0, 0, 0]);
  for (const c of pts) { let bi = 0, bd = 1e9; cen.forEach((m, i) => { const d = dist(c, m); if (d < bd) { bd = d; bi = i; } }); const s = sum[bi]; s[0] += c[0]; s[1] += c[1]; s[2] += c[2]; s[3]++; }
  cen = cen.map((m, i) => sum[i][3] ? [sum[i][0] / sum[i][3], sum[i][1] / sum[i][3], sum[i][2] / sum[i][3]] : m);
}
cen = cen.map(c => c.map(Math.round));
const o = new Uint8Array(ow * oh * 4);
small.forEach((c, i) => { if (!c) return; let bi = 0, bd = 1e9; cen.forEach((m, j) => { const d = dist(c, m); if (d < bd) { bd = d; bi = j; } }); o[i * 4] = cen[bi][0]; o[i * 4 + 1] = cen[bi][1]; o[i * 4 + 2] = cen[bi][2]; o[i * 4 + 3] = 255; });
fs.writeFileSync(out, encodePNG(ow, oh, o));
console.log(`${ow} x ${oh} px, ${k} cores:`, cen.map(c => '#' + c.map(v => v.toString(16).padStart(2, '0')).join('')).join(' '));
