// Piso de tábuas que se encaixa em qualquer direção (gerado por código; as cores vêm do piso do Gemini em arte_casa/pecas/pisoG_1.png).
// uso: node casa_do_gemini.mjs && node casa_piso.mjs  →  arte_casa/pecas/piso_1.png (liso), piso_2.png (com 2 nós), piso_3.png (com mancha de uso)
// As tábuas correm no eixo ↘ (a) e têm 1/2 de losango de comprimento; juntas em posições fixas por tábua, então todos os pisos são iguais nas bordas e emendam sem linha.
import fs from 'node:fs';
import { decodePNG } from './pngdec.mjs';
import { encodePNG } from './pngenc.mjs';
const G = decodePNG('./arte_casa/pecas/pisoG_1.png'); const px = []; for (let i = 0; i < G.w * G.h; i++) if (G.data[i * 4 + 3]) px.push([G.data[i * 4], G.data[i * 4 + 1], G.data[i * 4 + 2]]);
const lum = c => .3 * c[0] + .59 * c[1] + .11 * c[2];
function paleta(p, n) { let cx = [p]; while (cx.length < n) { cx.sort((a, b) => b.length - a.length); const b = cx.shift(); if (b.length < 2) { cx.push(b); break; } const rg = [0, 1, 2].map(k => Math.max(...b.map(q => q[k])) - Math.min(...b.map(q => q[k]))), k = rg.indexOf(Math.max(...rg)); b.sort((q, r) => q[k] - r[k]); cx.push(b.slice(0, b.length >> 1), b.slice(b.length >> 1)); } return cx.map(b => [0, 1, 2].map(k => Math.round(b.reduce((s, q) => s + q[k], 0) / b.length))).sort((a, b) => lum(a) - lum(b)); }
const PAL = paleta(px, 7), LINHA = PAL[0], SOMBRA = PAL[1], TONS = PAL.slice(2);   // da mais escura (junta) às mais claras (tábua)
console.log('cores do piso:', PAL.map(c => c.join(',')).join(' | '));
const hash = (a, b) => { let h = (Math.imul(a + 7, 374761393) + Math.imul(b + 13, 668265263)) >>> 0; h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const NT = 6, CORTE = 2;   // 6 tábuas por losango; 2 pedaços de tábua por losango
function pixel(x, y, variante) {
  const u = (x + .5 - 64) / 64, v = (y + .5 - 32) / 32; if (Math.abs(u) + Math.abs(v) > 1.0) return null;
  const a = (u + v) / 2, b = (v - u) / 2, s = a + .5, t = b + .5;                         // s ao longo da tábua (↘), t atravessando as tábuas (0..1)
  const k = Math.min(NT - 1, Math.floor(t * NT)), fr = t * NT - k;                        // tábua k, posição dentro dela
  const junta = hash(k, 1), pos = (s * CORTE - junta * CORTE + 100) % 1, seg = Math.floor(s * CORTE - junta * CORTE + 100) % CORTE;   // posição dentro do pedaço
  let c = TONS[Math.floor(hash(k, 10 + seg) * TONS.length)];                              // cor do pedaço (igual em todos os pisos)
  const ve = hash(k * 31 + seg, Math.floor(s * 7)) < .22;                                 // veio: risco escuro fino, curto
  if (ve && fr > .35 && fr < .6) c = SOMBRA;
  if (fr < .15 || fr > .985) c = LINHA;                                                   // vão entre tábuas
  else if (fr < .3) c = TONS[Math.min(TONS.length - 1, TONS.indexOf(c) + 1)] || c;        // borda de cima um pouco mais clara
  if (pos < .035 && fr > .15) c = SOMBRA;                                                 // junta entre dois pedaços
  if (variante === 2) for (const [ka, sa] of [[1, .28], [4, .7]]) { const d = Math.hypot((s - sa) * 46, (k + .5 - ka - .5) * 0 + (t * NT - (ka + .5)) * 4.2); if (k === ka && d < 3.4) c = d > 2.2 ? SOMBRA : d > 1.2 ? LINHA : SOMBRA; }   // nó (só dentro da tábua)
  if (variante === 3) { const m = hash(Math.floor(s * 5) + 50, k + 50), cen = Math.hypot(s - .5, t - .5); if (cen < .3 && m < .6 && fr > .15) c = SOMBRA; }   // mancha de uso no meio, longe da borda
  return c;
}
fs.mkdirSync('./arte_casa/pecas', { recursive: true });
for (const [n, vv] of [[1, 1], [2, 2], [3, 3]]) { const o = new Uint8Array(128 * 64 * 4); for (let y = 0; y < 64; y++) for (let x = 0; x < 128; x++) { const c = pixel(x, y, vv); if (c) o.set([c[0], c[1], c[2], 255], (y * 128 + x) * 4); } fs.writeFileSync('./arte_casa/pecas/piso_' + n + '.png', encodePNG(128, 64, o)); }
console.log('ok');
