// Folha de chão do Gemini (24 blocos isométricos) -> texturas quadradas 64×64 que se repetem sem emenda.
// Para cada bloco: acha o losango da face de cima, descarta contorno e lateral, desfaz a perspectiva (losango -> quadrado),
// emenda as bordas por troca pontilhada com a própria textura deslocada, e reduz tudo a uma paleta única.
// uso: node build_chao.mjs <folha.jpg>   ->  chao/<nome>.png, chao/folha_chao.png, chao/folha_chao_2x.png, chao.js
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { encodePNG } from './pngenc.mjs';
const require = createRequire(import.meta.url);
const [, , inp] = process.argv;
const J = require('jpeg-js').decode(fs.readFileSync(inp), { useTArray: true }), JW = J.width, H = 890, D = J.data;
const px = (x, y) => { x = Math.max(0, Math.min(JW - 1, x)); y = Math.max(0, Math.min(J.height - 1, y)); const i = (y * JW + x) * 4; return [D[i], D[i + 1], D[i + 2]]; };
const isBg = (x, y) => { const p = px(x, y); return Math.abs(p[0] - 137) < 12 && Math.abs(p[1] - 137) < 12 && Math.abs(p[2] - 137) < 12; };
const NAMES = ['grama_normal', 'grama_alta', 'grama_flores', 'grama_folhas', 'grama_normal_b', 'grama_alta_b', 'grama_flores_b', 'grama_folhas_b', 'terra_lisa', 'terra_pedras', 'terra_pegadas', 'terra_raizes', 'floresta_folhas', 'floresta_agulhas', 'floresta_musgo', 'floresta_cogumelos', 'cascalho', 'pedras', 'laje', 'lama_seca', 'lama_umida', 'pocas', 'madeira_clara', 'madeira_escura'];
// 1) blocos = grupos de pixels que não são fundo (só a parte de cima da folha, até y=890)
const lab = new Int32Array(JW * H).fill(-1), comps = [];
for (let s = 0; s < JW * H; s++) { const x0 = s % JW, y0 = (s / JW) | 0; if (lab[s] >= 0 || isBg(x0, y0)) continue; const id = comps.length, q = [s]; lab[s] = id; let n = 0, a = JW, b = 0, c = H, d = 0;
  while (q.length) { const p = q.pop(); n++; const x = p % JW, y = (p / JW) | 0; a = Math.min(a, x); b = Math.max(b, x); c = Math.min(c, y); d = Math.max(d, y);
    for (const [i, j] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + i, Y = y + j; if (X < 0 || Y < 0 || X >= JW || Y >= H) continue; const t = Y * JW + X; if (lab[t] < 0 && !isBg(X, Y)) { lab[t] = id; q.push(t); } } }
  comps.push({ n, x0: a, x1: b, y0: c, y1: d }); }
const big = comps.filter(c => c.n > 3000).sort((p, q) => Math.abs(p.y0 - q.y0) > 40 ? p.y0 - q.y0 : p.x0 - q.x0);
if (big.length !== NAMES.length) throw new Error(`esperava ${NAMES.length} blocos, achei ${big.length}`);
// 2) cada bloco -> quadrado N×N (sem emenda ainda)
const N = 64, INSET = .9, raw = [];
big.forEach(c => {
  const w = c.x1 - c.x0 + 1, hf = w / 4; let sy = 0, n = 0; for (let y = c.y0; y <= c.y1; y++) if (!isBg(c.x0 + 1, y)) { sy += y; n++; }   // vértice da esquerda
  const cx = c.x0 + (w - 1) / 2, cy = n ? sy / n : c.y0 + hf, tex = [];
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const u = (i + .5) / N, v = (j + .5) / N, X = cx + (u - v) * (w / 2) * INSET, Y = cy + (u + v - 1) * hf * INSET, x = Math.floor(X), y = Math.floor(Y), fx = X - x, fy = Y - y, a = px(x, y), b = px(x + 1, y), cc = px(x, y + 1), d = px(x + 1, y + 1);
    tex.push([0, 1, 2].map(k => (a[k] * (1 - fx) + b[k] * fx) * (1 - fy) + (cc[k] * (1 - fx) + d[k] * fx) * fy));
  }
  raw.push(tex);
});
// 3) emenda: perto das bordas usa a textura deslocada meia volta (escolha pontilhada, para manter pixels nítidos)
const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
const seam = tex => tex.map((p, k) => {
  const i = k % N, j = (k / N) | 0, u = (i + .5) / N, v = (j + .5) / N, wx = Math.min(1, Math.min(u, 1 - u) * 5), wy = Math.min(1, Math.min(v, 1 - v) * 5), wgt = wx * wy;
  const th = (BAYER[j % 4][i % 4] + .5) / 16;
  return wgt > th ? p : tex[((j + N / 2) % N) * N + (i + N / 2) % N];
});
const sm = raw.map(seam);
// 4) paleta única (k-means) para todas as texturas
const K = 32, dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]), lum = c => c[0] * .3 + c[1] * .59 + c[2] * .11;
const pts = []; sm.forEach(t => t.forEach((p, k) => { if (k % 2 === 0) pts.push(p); }));
const sorted = [...pts].sort((a, b) => lum(a) - lum(b)); let cen = Array.from({ length: K }, (_, i) => [...sorted[Math.floor((i + .5) / K * sorted.length)]]);
for (let it = 0; it < 20; it++) { const sum = cen.map(() => [0, 0, 0, 0]); for (const p of pts) { let bi = 0, bd = 1e9; cen.forEach((m, i) => { const d = dist(p, m); if (d < bd) { bd = d; bi = i; } }); const s = sum[bi]; s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; s[3]++; } cen = cen.map((m, i) => sum[i][3] ? [sum[i][0] / sum[i][3], sum[i][1] / sum[i][3], sum[i][2] / sum[i][3]] : m); }
cen = cen.map(c => c.map(Math.round));
const idx = tex => tex.map(p => { let bi = 0, bd = 1e9; cen.forEach((m, i) => { const d = dist(p, m); if (d < bd) { bd = d; bi = i; } }); return bi; });
const out = sm.map(idx);
// 5) grava
fs.rmSync('chao', { recursive: true, force: true }); fs.mkdirSync('chao');
const png = ix => { const b = new Uint8Array(N * N * 4); ix.forEach((c, k) => { b[k * 4] = cen[c][0]; b[k * 4 + 1] = cen[c][1]; b[k * 4 + 2] = cen[c][2]; b[k * 4 + 3] = 255; }); return b; };
out.forEach((ix, n) => fs.writeFileSync(`chao/${NAMES[n]}.png`, encodePNG(N, N, png(ix))));
// folha de conferência: cada textura repetida 2×2, 6 colunas
const COLS = 6, ROWS = Math.ceil(NAMES.length / COLS), CELL = N * 2 + 4, SW = CELL * COLS, SH = CELL * ROWS, sheet = new Uint8Array(SW * SH * 4).fill(40);
out.forEach((ix, n) => { const ox = (n % COLS) * CELL + 2, oy = ((n / COLS) | 0) * CELL + 2, b = png(ix); for (let y = 0; y < N * 2; y++) for (let x = 0; x < N * 2; x++) { const s = ((y % N) * N + (x % N)) * 4, d = ((oy + y) * SW + ox + x) * 4; sheet[d] = b[s]; sheet[d + 1] = b[s + 1]; sheet[d + 2] = b[s + 2]; sheet[d + 3] = 255; } });
fs.writeFileSync('chao/folha_chao.png', encodePNG(SW, SH, sheet));
// dados para as páginas
const hex = c => '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
fs.writeFileSync('chao.js', `// gerado por build_chao.mjs: texturas de chão ${N}×${N}, sem emenda; tex[nome] = ${N * N} índices (letras) da paleta pal\nconst CHAO = ${JSON.stringify({ n: N, pal: cen.map(hex), nomes: NAMES, tex: Object.fromEntries(NAMES.map((nm, i) => [nm, out[i].map(c => String.fromCharCode(65 + c)).join('')])) })};\n`);
console.log('ok', NAMES.length, 'texturas,', K, 'cores');
