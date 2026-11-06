// Pega a folha de uma skin gerada pelo Gemini (11 linhas × 8 colunas, mesma ordem de sprites_personagem.png),
// tira o fundo xadrez, reduz para a escala do jogo, alinha os pés e a cabeça e grava tudo organizado em skins/<nome>/.
// uso: node build_skin.mjs <folha.jpg> <nome> [paleta=16]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { encodePNG } from './pngenc.mjs';
const require = createRequire(import.meta.url);
const [, , inp, nome, K = '16'] = process.argv, k = +K;
const J = require('jpeg-js').decode(fs.readFileSync(inp), { useTArray: true }), W = J.width, H = J.height, D = J.data;
const COLS = 8, ROWS = 11, CW = W / COLS, CH = H / ROWS, OUT_W = 48, OUT_H = 64, ALTURA = 55; // personagem parado de frente = 55 px
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const px = (x, y) => { const i = (y * W + x) * 4; return [D[i], D[i + 1], D[i + 2]]; };
const sat = c => Math.max(...c) - Math.min(...c);
const lum = c => c[0] * .3 + c[1] * .59 + c[2] * .11;

// 1) por célula: fundo = cinza sem cor ligado à borda da célula (flood fill); sobra só o personagem
const cells = [];
for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
  const x0 = Math.round(c * CW), x1 = Math.round((c + 1) * CW), y0 = Math.round(r * CH), y1 = Math.round((r + 1) * CH), w = x1 - x0, h = y1 - y0;
  const bg = new Uint8Array(w * h), st = [];
  const isBg = (x, y) => { const p = px(x0 + x, y0 + y); return sat(p) < 22 && lum(p) > 150; };
  for (let x = 0; x < w; x++) st.push([x, 0], [x, h - 1]);
  for (let y = 0; y < h; y++) st.push([0, y], [w - 1, y]);
  while (st.length) { const [x, y] = st.pop(); if (x < 0 || y < 0 || x >= w || y >= h || bg[y * w + x] || !isBg(x, y)) continue; bg[y * w + x] = 1; st.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]); }
  // só o maior bloco (descarta sobras de outras células)
  const lab = new Int32Array(w * h).fill(-1), sz = [];
  for (let s = 0; s < w * h; s++) if (!bg[s] && lab[s] < 0) {
    const id = sz.length, q = [s]; lab[s] = id; let n = 0;
    while (q.length) { const p = q.pop(); n++; const x = p % w, y = (p / w) | 0; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const X = x + i, Y = y + j; if (X < 0 || Y < 0 || X >= w || Y >= h) continue; const t = Y * w + X; if (!bg[t] && lab[t] < 0) { lab[t] = id; q.push(t); } } }
    sz.push(n);
  }
  const keep = sz.indexOf(Math.max(...sz, 0)), alpha = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) alpha[i] = sz.length && lab[i] === keep && sz[keep] > 200 ? 1 : 0;
  cells.push({ r, c, x0, y0, w, h, alpha });
}
// 2) escala única: altura do personagem parado de frente (linha 0, coluna 0) -> 55 px
const c00 = cells[0]; let t0 = c00.h, b0 = 0;
for (let y = 0; y < c00.h; y++) for (let x = 0; x < c00.w; x++) if (c00.alpha[y * c00.w + x]) { t0 = Math.min(t0, y); b0 = Math.max(b0, y); }
const F = (b0 - t0 + 1) / ALTURA; console.log('fator de redução', F.toFixed(3), 'altura original', b0 - t0 + 1);
// 3) reduz cada célula por média de caixa
const frames = [];
for (const cell of cells) {
  const { w, h, alpha, x0, y0 } = cell; let mnx = w, mxx = 0, mny = h, mxy = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (alpha[y * w + x]) { mnx = Math.min(mnx, x); mxx = Math.max(mxx, x); mny = Math.min(mny, y); mxy = Math.max(mxy, y); }
  if (mxx < mnx) { frames.push(null); continue; }
  const ow = Math.ceil((mxx - mnx + 1) / F), oh = Math.ceil((mxy - mny + 1) / F), pix = [];
  for (let y = 0; y < oh; y++) for (let x = 0; x < ow; x++) {
    let rr = 0, gg = 0, bb = 0, n = 0, a = 0;
    for (let j = Math.floor(y * F); j < Math.floor((y + 1) * F); j++) for (let i = Math.floor(x * F); i < Math.floor((x + 1) * F); i++) { const X = mnx + i, Y = mny + j; if (X > mxx || Y > mxy) continue; a++; if (alpha[Y * w + X]) { const p = px(x0 + X, y0 + Y); rr += p[0]; gg += p[1]; bb += p[2]; n++; } }
    pix.push(n * 2 > a && n ? [rr / n, gg / n, bb / n] : null);
  }
  frames.push({ ow, oh, pix, r: cell.r, c: cell.c });
}
// 4) paleta única da skin (k-means): todos os quadros usam as mesmas cores
const pts = []; frames.forEach(f => f && f.pix.forEach(p => p && pts.push(p)));
const sorted = [...pts].sort((a, b) => lum(a) - lum(b));
let cen = Array.from({ length: k }, (_, i) => [...sorted[Math.floor((i + .5) / k * sorted.length)]]);
for (let it = 0; it < 25; it++) {
  const sum = cen.map(() => [0, 0, 0, 0]);
  for (const p of pts) { let bi = 0, bd = 1e9; cen.forEach((m, i) => { const d = dist(p, m); if (d < bd) { bd = d; bi = i; } }); const s = sum[bi]; s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; s[3]++; }
  cen = cen.map((m, i) => sum[i][3] ? [sum[i][0] / sum[i][3], sum[i][1] / sum[i][3], sum[i][2] / sum[i][3]] : m);
}
cen = cen.map(c => c.map(Math.round));
const nearest = p => { let bi = 0, bd = 1e9; cen.forEach((m, i) => { const d = dist(p, m); if (d < bd) { bd = d; bi = i; } }); return cen[bi]; };
// 5) alinha: centro da cabeça (10 linhas de cima) no meio da célula, ponto mais baixo (pé) na linha 62
const NAMES = ['parado', 'andar', 'andar', 'andar', 'andar', 'andar', 'correr', 'correr', 'correr', 'correr', 'correr'], VIEWS = ['S', 'SW', 'W', 'NW', 'N'];
const dirOut = path.join('skins', nome); fs.rmSync(dirOut, { recursive: true, force: true });
const SW_ = OUT_W * COLS, sheet = new Uint8Array(SW_ * OUT_H * ROWS * 4), report = [];
for (const f of frames) {
  if (!f) continue; const { ow, oh, pix, r, c } = f;
  let sx = 0, n = 0; for (let y = 0; y < Math.min(10, oh); y++) for (let x = 0; x < ow; x++) if (pix[y * ow + x]) { sx += x; n++; }
  const head = n ? sx / n : ow / 2, ox = Math.round(OUT_W / 2 - head), oy = OUT_H - 2 - oh;
  const fr = new Uint8Array(OUT_W * OUT_H * 4); let clip = false;
  for (let y = 0; y < oh; y++) for (let x = 0; x < ow; x++) {
    const p = pix[y * ow + x]; if (!p) continue; const X = ox + x, Y = oy + y;
    if (X < 0 || X >= OUT_W || Y < 0) { clip = true; continue; }
    const q = nearest(p), o = (Y * OUT_W + X) * 4; fr[o] = q[0]; fr[o + 1] = q[1]; fr[o + 2] = q[2]; fr[o + 3] = 255;
  }
  if (clip) report.push(`corte em linha ${r} col ${c}`);
  const anim = NAMES[r], vista = r === 0 ? VIEWS[c] : VIEWS[(r - 1) % 5], dir = r === 0 ? path.join(dirOut, anim) : path.join(dirOut, anim, vista);
  fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, r === 0 ? `${vista}.png` : `${c}.png`), encodePNG(OUT_W, OUT_H, fr));
  for (let y = 0; y < OUT_H; y++) for (let x = 0; x < OUT_W; x++) { const s = (y * OUT_W + x) * 4, d = ((r * OUT_H + y) * SW_ + c * OUT_W + x) * 4; for (let i = 0; i < 4; i++) sheet[d + i] = fr[s + i]; }
}
fs.writeFileSync(path.join(dirOut, `folha_${nome}.png`), encodePNG(SW_, OUT_H * ROWS, sheet));
const K3 = 3, W3 = SW_ * K3, H3 = OUT_H * ROWS * K3, pv = new Uint8Array(W3 * H3 * 4);
for (let y = 0; y < H3; y++) for (let x = 0; x < W3; x++) {
  const sx = (x / K3) | 0, sy = (y / K3) | 0, i = (sy * SW_ + sx) * 4, p = (y * W3 + x) * 4, a = sheet[i + 3], bgc = ((((sx / OUT_W) | 0) + ((sy / OUT_H) | 0)) & 1) ? 214 : 226;
  pv[p] = a ? sheet[i] : bgc; pv[p + 1] = a ? sheet[i + 1] : bgc; pv[p + 2] = a ? sheet[i + 2] : bgc; pv[p + 3] = 255;
}
fs.writeFileSync(path.join(dirOut, `folha_${nome}_3x.png`), encodePNG(W3, H3, pv));
console.log('paleta', cen.map(c => '#' + c.map(v => v.toString(16).padStart(2, '0')).join('')).join(' '));
console.log(report.length ? report.join('\n') : 'nenhum quadro cortado');
