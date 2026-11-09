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
// verdes das folhagens: mantém só o brilho do pixel e pinta com a rampa de verdes do chão (#6c7f50 #7a8e5a #849766), para não destoar
const hx2 = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const RAMPA = [[0, '#3f4e30'], [.3, '#566a3f'], [.55, '#6c7f50'], [.78, '#7a8e5a'], [.92, '#849766'], [1, '#98ab78']].map(([t, h]) => [t, hx2(h)]);
function esverdeia(r, g, b) { const mx = Math.max(r, g, b), mn = Math.min(r, g, b); if (!(g >= r && g >= b && mx - mn > 12)) return [r, g, b];   // só o que é verde (flores, pedras, cogumelos e galhos ficam como estão)
  const Y = .3 * r + .59 * g + .11 * b, t = Math.max(0, Math.min(1, (Y - 45) / 110)); for (let i = 1; i < RAMPA.length; i++) if (t <= RAMPA[i][0]) { const [t0, c0] = RAMPA[i - 1], [t1, c1] = RAMPA[i], k = (t - t0) / (t1 - t0); return c0.map((v, j) => v + (c1[j] - v) * k); } return RAMPA[RAMPA.length - 1][1]; }
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
    if (a && a / m >= .5) { const q = (ty * tw + tx) * 4; let R2 = r / a, G2 = g / a, B2 = b / a; [R2, G2, B2] = esverdeia(R2, G2, B2); o[q] = R2; o[q + 1] = G2; o[q + 2] = B2; o[q + 3] = 255; } }
  return { nome, tw, th, o };
});
// 3b) grama média e baixa: só a parte de baixo dos tufos altos, com o corte irregular (as pontas das folhas já têm 1 px)
const hz = (x, s) => { let h = (x * 374761393 + s * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
for (const [nome, de, frac, seed, modo] of [['grama_media_1', 'grama_alta_1', .55, 1], ['grama_media_2', 'grama_alta_2', .5, 2], ['grama_baixa_1', 'grama_alta_4', .42, 4, 'achata'], ['grama_baixa_2', 'grama_alta_1', .36, 5, 'achata']]) {
  const src = itens.find(i => i.nome === de);
  if (modo === 'achata') {   // baixa: achata o tufo na vertical (as pontas continuam naturais, sem linha reta no topo)
    const th = Math.max(4, Math.round(src.th * frac)), o2 = new Uint8Array(src.tw * th * 4);
    for (let ty = 0; ty < th; ty++) for (let x = 0; x < src.tw; x++) { let a = 0, r = 0, gg = 0, b = 0, m = 0; for (let y = Math.floor(ty / frac); y < Math.min(src.th, Math.ceil((ty + 1) / frac)); y++) { const p = (y * src.tw + x) * 4; m++; if (src.o[p + 3]) { a++; r += src.o[p]; gg += src.o[p + 1]; b += src.o[p + 2]; } }
      if (a && a / m >= .34) o2.set([Math.round(r / a), Math.round(gg / a), Math.round(b / a), 255], (ty * src.tw + x) * 4); }
    itens.push({ nome, tw: src.tw, th, o: o2 }); continue; }
  const o = Uint8Array.from(src.o), corte = src.th - Math.round(src.th * frac);
  for (let x = 0; x < src.tw; x++) { const c = corte + Math.round((hz(x, seed) - .5) * 3); for (let y = 0; y < Math.min(src.th, c); y++) o[(y * src.tw + x) * 4 + 3] = 0; }
  let x0 = src.tw, x1 = -1, y0 = src.th, y1 = -1; for (let y = 0; y < src.th; y++) for (let x = 0; x < src.tw; x++) if (o[(y * src.tw + x) * 4 + 3]) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const tw = x1 - x0 + 1, th = y1 - y0 + 1, n2 = new Uint8Array(tw * th * 4); for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) n2.set(o.subarray(((y0 + y) * src.tw + x0 + x) * 4, ((y0 + y) * src.tw + x0 + x) * 4 + 4), (y * tw + x) * 4);
  itens.push({ nome, tw, th, o: n2 }); }
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
// embute as imagens em decoracao_dados.js (data URI): o editor lê os pixels para saber onde há arte (apagar/espalhar) e file:// bloqueia a leitura de PNG solto
const B64 = {}; for (const f of fs.readdirSync(OUT).filter(f => f.endsWith('.png') && !f.startsWith('_'))) B64[f.slice(0, -4)] = 'data:image/png;base64,' + fs.readFileSync(OUT + f).toString('base64');   // inclui também a grama média/baixa feita por código
fs.writeFileSync(new URL('./decoracao_dados.js', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'), '// gerado por decoracao_do_gemini.mjs\nconst DECO_B64 = ' + JSON.stringify(B64) + ';\n');
