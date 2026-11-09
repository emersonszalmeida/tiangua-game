// Converte a folha de decorações do Gemini (arte_terreno/decoracoes_gemini_ref.png) em pixel art limpa:
// recorta cada item, tira o fundo cinza e a franja, reduz para a escala do jogo, trava numa paleta única
// (median cut) e deixa cada pixel duro. Saída: decoracao/*.png + decoracao/_conferencia.png
// uso: node decoracao_do_gemini.mjs [multiplicador de tamanho=1] [cores=14]
// fator de redução por categoria (o personagem tem ~40 px de altura; cogumelo e pedrinha precisam ser bem pequenos)
const FATOR = { grama: .2, flor: .2, pedra: .2, cogumelo: .2, folha: .2, folhas: .2, galho: .2, trevo: .2 };
import fs from 'node:fs';
import { decodePNG } from './pngdec.mjs';
import { encodePNG } from './pngenc.mjs';
const MULT = +process.argv[2] || 1, NCOR = +process.argv[3] || 14;
const OUT = new URL('./decoracao/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const SRC = new URL('./arte_terreno/decoracoes_gemini_ref.png', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
fs.mkdirSync(OUT, { recursive: true });
const { w, h, data } = decodePNG(SRC);
// 1) fundo = cinza claro sem cor
const isBg = i => { const r = data[i], g = data[i + 1], b = data[i + 2]; return Math.max(r, g, b) - Math.min(r, g, b) < 14 && (r + g + b) / 3 > 188; };
const mask = new Uint8Array(w * h); for (let k = 0; k < w * h; k++) mask[k] = isBg(k * 4) ? 0 : 1;
// 2) componentes (dilatação 2 px agrupa as partes de cada item)
const dil = new Uint8Array(w * h), R = 2;
for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (mask[y * w + x]) for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < w && yy < h) dil[yy * w + xx] = 1; }
const lab = new Int32Array(w * h), comps = []; let n = 0;
for (let s = 0; s < w * h; s++) if (dil[s] && !lab[s]) { n++; const st = [s]; lab[s] = n; let x0 = w, y0 = h, x1 = 0, y1 = 0, cnt = 0;
  while (st.length) { const p = st.pop(), x = p % w, y = (p / w) | 0; if (mask[p]) { cnt++; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < w && yy < h) { const q = yy * w + xx; if (dil[q] && !lab[q]) { lab[q] = n; st.push(q); } } } }
  if (cnt > 25) comps.push({ id: n, x0, y0, x1, y1 }); }
comps.sort((a, b) => (Math.round(a.y0 / 90) - Math.round(b.y0 / 90)) || a.x0 - b.x0);
// ordem na folha: grama ×4, flores ×8, pedras ×6, cogumelos ×10, extras ×4
const NOMES = ['grama_alta_1', 'grama_alta_2', 'grama_alta_3', 'grama_alta_4', 'flor_margarida', 'flor_amarela', 'flor_lavanda', 'flor_papoula', 'flor_azul', 'flor_mista', 'flor_papoula_b', 'flor_azul_b', 'pedra_mini', 'pedra_pequena', 'pedra_grande', 'pedra_dupla', 'pedra_chata', 'pedra_trio', 'cogumelo_1', 'cogumelo_2', 'cogumelo_3', 'cogumelo_4', 'cogumelo_5', 'cogumelo_6', 'cogumelo_7', 'cogumelo_8', 'cogumelo_9', 'cogumelo_10', 'folha_1', 'folhas_monte', 'galho', 'trevo'];
if (comps.length !== NOMES.length) throw new Error('esperava ' + NOMES.length + ' itens, achei ' + comps.length);
// 3) recorta, tira franja, reduz
const itens = comps.map((c, idx) => {
  const nome = NOMES[idx], FAT = FATOR[nome.split('_')[0]] * MULT, cw = c.x1 - c.x0 + 1, ch = c.y1 - c.y0 + 1, d = new Uint8Array(cw * ch * 4);
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) { const p = (c.y0 + y) * w + c.x0 + x; if (mask[p] && lab[p] === c.id) { d.set(data.subarray(p * 4, p * 4 + 4), (y * cw + x) * 4); d[(y * cw + x) * 4 + 3] = 255; } }
  const petalas = nome === 'flor_margarida' || nome === 'flor_mista';   // pétalas brancas: só tira o cinza do fundo, nunca o branco
  for (let pass = 0; pass < 2; pass++) { const kill = [];
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) { const p = (y * cw + x) * 4; if (!d[p + 3]) continue;
      let borda = false; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= cw || yy >= ch || !d[(yy * cw + xx) * 4 + 3]) borda = true; }
      if (!borda) continue; const r = d[p], g = d[p + 1], b = d[p + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b), av = (r + g + b) / 3;
      if (petalas ? false : (mx - mn < (pass ? 30 : 38) && av > (pass ? 168 : 150))) kill.push(p); }
    kill.forEach(p => d[p + 3] = 0); }
  const tw = Math.max(3, Math.round(cw * FAT)), th = Math.max(2, Math.round(ch * FAT)), o = new Uint8Array(tw * th * 4);
  for (let ty = 0; ty < th; ty++) for (let tx = 0; tx < tw; tx++) { let a = 0, r = 0, g = 0, b = 0, m = 0;
    for (let y = Math.floor(ty / FAT); y < Math.min(ch, Math.ceil((ty + 1) / FAT)); y++) for (let x = Math.floor(tx / FAT); x < Math.min(cw, Math.ceil((tx + 1) / FAT)); x++) { const p = (y * cw + x) * 4; m++; if (d[p + 3]) { a++; r += d[p]; g += d[p + 1]; b += d[p + 2]; } }
    if (a && a / m >= .5) { const q = (ty * tw + tx) * 4; let R2 = r / a, G2 = g / a, B2 = b / a; if (nome.startsWith('grama_alta')) { R2 *= .82; G2 *= .84; B2 *= .8; } o[q] = R2; o[q + 1] = G2; o[q + 2] = B2; o[q + 3] = 255; } }
  return { nome, tw, th, o };
});
// 4) paleta própria de cada item (median cut) e pixel duro: assim as cores vivas das flores e cogumelos não se perdem
function paleta(px, n) { let caixas = [px]; while (caixas.length < n) { caixas.sort((a, b) => b.length - a.length); const bx = caixas.shift(); if (bx.length < 2) { caixas.push(bx); break; }
    const ranges = [0, 1, 2].map(k => { let lo = 255, hi = 0; for (const p of bx) { lo = Math.min(lo, p[k]); hi = Math.max(hi, p[k]); } return hi - lo; }), k = ranges.indexOf(Math.max(...ranges));
    bx.sort((a, b) => a[k] - b[k]); const m = bx.length >> 1; caixas.push(bx.slice(0, m), bx.slice(m)); }
  return caixas.map(bx => [0, 1, 2].map(k => Math.round(bx.reduce((s, p) => s + p[k], 0) / bx.length))); }
for (const it of itens) { const px = []; for (let i = 0; i < it.tw * it.th; i++) if (it.o[i * 4 + 3]) px.push([it.o[i * 4], it.o[i * 4 + 1], it.o[i * 4 + 2]]);
  const PAL = paleta(px, NCOR), perto = (r, g, b) => { let bi = 0, bd = 1e9; PAL.forEach((c, i) => { const dd = (c[0] - r) ** 2 + (c[1] - g) ** 2 + (c[2] - b) ** 2; if (dd < bd) { bd = dd; bi = i; } }); return PAL[bi]; };
  for (let i = 0; i < it.tw * it.th; i++) if (it.o[i * 4 + 3]) { const c = perto(it.o[i * 4], it.o[i * 4 + 1], it.o[i * 4 + 2]); it.o[i * 4] = c[0]; it.o[i * 4 + 1] = c[1]; it.o[i * 4 + 2] = c[2]; }
  fs.writeFileSync(OUT + it.nome + '.png', encodePNG(it.tw, it.th, it.o)); }
// folha de conferência
const Z = 4, W = 1000; let x = 8, y = 8, rh = 0; const pos = [];
for (const it of itens) { if (x + it.tw * Z > W - 8) { x = 8; y += rh + 10; rh = 0; } pos.push([it, x, y]); x += it.tw * Z + 10; rh = Math.max(rh, it.th * Z); }
const H = y + rh + 8, im = new Uint8Array(W * H * 4); for (let i = 0; i < W * H; i++) im.set([0x84, 0x97, 0x66, 255], i * 4);
for (const [it, ox, oy] of pos) for (let j = 0; j < it.th * Z; j++) for (let i = 0; i < it.tw * Z; i++) { const p = (((j / Z) | 0) * it.tw + ((i / Z) | 0)) * 4; if (it.o[p + 3]) im.set(it.o.subarray(p, p + 4), ((oy + j) * W + ox + i) * 4); }
fs.writeFileSync(OUT + '_conferencia.png', encodePNG(W, H, im));
console.log(itens.length + ' itens, ' + NCOR + ' cores por item: ' + itens.map(i => i.nome + ' ' + i.tw + 'x' + i.th).join(', '));
