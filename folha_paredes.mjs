// junta todas as paredes, portas animadas e cantos do casa_pecas_dados.js numa folha só (1x, fundo transparente)
import fs from 'node:fs';
import { decodePNG } from './pngdec.mjs';
import { encodePNG } from './pngenc.mjs';
const src = fs.readFileSync('casa_pecas_dados.js', 'utf8').replace('const PECAS', 'globalThis.PECAS'); (0, eval)(src);
const L = [
  ['x_A','y_A','x_DA','y_DA','x_C','y_C'],
  ['x_DA_f1','x_DA_f2','x_DA_f3','x_DA_f4','x_DA_f5'],
  ['y_DA_f1','y_DA_f2','y_DA_f3','y_DA_f4','y_DA_f5'],
  ['x_M','y_M','x_DM1','x_DM2','y_DM1','y_DM2'],
  ['RD_AA','LU_AA','RU_AA','LD_AA','RU_CC','LD_CC'],
  ['RD_AM','RD_MA','RD_DMA','RD_ADM','RD_ADA','RD_DAA'],
  ['LU_CC','LD_PP','RU_PP','LD_DAA','RU_ADA','LD_ADM','RU_DMA'],
  ['RD_MM','LU_MM','RU_MM','LD_MM','LU_DMM','LU_MDM']];
const G = 16, linhas = L.map(r => r.map(n => { const p = PECAS[n]; if (!p) throw new Error(n); return { n, p, img: (fs.writeFileSync('_tmp_p.png', Buffer.from(p.src.split(',')[1], 'base64')), decodePNG('_tmp_p.png')) }; }));
const W = Math.max(...linhas.map(r => r.reduce((s, c) => s + c.p.w + G, G))), H = linhas.reduce((s, r) => s + Math.max(...r.map(c => c.p.h)) + G, G);
const d = new Uint8Array(W * H * 4); let y0 = G; const mapa = [];
for (const r of linhas) { let x0 = G; const hh = Math.max(...r.map(c => c.p.h));
  for (const c of r) { const { w, h } = c.p, I = c.img; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; if (!I.data[i + 3]) continue; const j = ((y0 + y) * W + x0 + x) * 4; d[j] = I.data[i]; d[j + 1] = I.data[i + 1]; d[j + 2] = I.data[i + 2]; d[j + 3] = 255; } mapa.push(c.n + ' @' + x0 + ',' + y0 + ' ' + w + 'x' + h); x0 += w + G; }
  y0 += hh + G; }
fs.writeFileSync('arte_casa/folha_paredes_portas.png', encodePNG(W, H, d));
fs.writeFileSync('arte_casa/folha_paredes_portas.txt', 'Folha ' + W + 'x' + H + ' (nome @x,y largura x altura), linha por linha:\n' + mapa.join('\n') + '\n');
console.log(W + 'x' + H, mapa.length, 'peças');
// ---- linha extra: peças com porta MÉDIA já montadas com o batente solto que o jogo coloca ao lado (senão parecem incompletas) ----
// [peça do canto, batente solto, deslocamento do batente em relação ao vértice do canto (dx, dy)]
const MONT = [['RD_DMA', 'x_DM2', 0, 0], ['RD_ADM', 'y_DM2', 0, 0], ['RU_DMA', 'x_DM2', 0, 0], ['LD_ADM', 'y_DM2', 0, 0], ['LU_DMM', 'x_DM1', -64, -32], ['LU_MDM', 'y_DM1', 64, -32]];
const img = n => { const p = PECAS[n]; fs.writeFileSync('_tmp_p.png', Buffer.from(p.src.split(',')[1], 'base64')); return { p, I: decodePNG('_tmp_p.png') }; };
const base = decodePNG('arte_casa/folha_paredes_portas.png'), cmp = [];
for (const [cn, bn, dx, dy] of MONT) { const c = img(cn), b = img(bn); const bx = c.p.ax + dx - b.p.ax, by = c.p.ay + dy - b.p.ay; const mx = Math.min(0, bx), my = Math.min(0, by), w = Math.max(c.p.w, bx + b.p.w) - mx, h = Math.max(c.p.h, by + b.p.h) - my; const o = new Uint8Array(w * h * 4);
  for (const [P, ox, oy] of [[c, -mx, -my], [b, bx - mx, by - my]]) for (let y = 0; y < P.p.h; y++) for (let x = 0; x < P.p.w; x++) { const i = (y * P.p.w + x) * 4; if (!P.I.data[i + 3]) continue; const j = ((oy + y) * w + ox + x) * 4; o[j] = P.I.data[i]; o[j + 1] = P.I.data[i + 1]; o[j + 2] = P.I.data[i + 2]; o[j + 3] = 255; }
  cmp.push({ n: cn + '+' + bn, w, h, o }); }
fs.rmSync('_tmp_p.png', { force: true });
const W2 = Math.max(base.w, cmp.reduce((s, c) => s + c.w + G, G)), H2 = base.h + Math.max(...cmp.map(c => c.h)) + G, d2 = new Uint8Array(W2 * H2 * 4);
for (let y = 0; y < base.h; y++) for (let x = 0; x < base.w; x++) { const i = (y * base.w + x) * 4, j = (y * W2 + x) * 4; for (let k = 0; k < 4; k++) d2[j + k] = base.data[i + k]; }
let xx = G; const extra = [];
for (const c of cmp) { for (let y = 0; y < c.h; y++) for (let x = 0; x < c.w; x++) { const i = (y * c.w + x) * 4; if (!c.o[i + 3]) continue; const j = ((base.h + y) * W2 + xx + x) * 4; for (let k = 0; k < 4; k++) d2[j + k] = c.o[i + k]; } extra.push(c.n + ' @' + xx + ',' + base.h + ' ' + c.w + 'x' + c.h); xx += c.w + G; }
fs.writeFileSync('arte_casa/folha_paredes_portas.png', encodePNG(W2, H2, d2));
fs.appendFileSync('arte_casa/folha_paredes_portas.txt', '\nÚltima linha: canto + batente solto já montados (como o jogo desenha); a folha tem ' + W2 + 'x' + H2 + ':\n' + extra.join('\n') + '\n');
console.log(W2 + 'x' + H2, extra.length, 'montadas');
