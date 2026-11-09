// Converte a folha de árvores do Gemini (arte_terreno/arvores_gemini_ref.png) em pixel art limpa para o editor:
// recorta, tira o fundo cinza (inclusive a franja), reduz, ajusta o verde à rampa do chão, trava a paleta por item e deixa o pixel duro.
// Saída: arvore/*.png, arvore/_conferencia.png e arvore_dados.js (imagens embutidas + ponto de apoio do tronco).
// uso: node arvores_do_gemini.mjs [multiplicador de tamanho=1] [cores por item=22]
import fs from 'node:fs';
import { decodePNG } from './pngdec.mjs';
import { encodePNG } from './pngenc.mjs';
const MULT = +process.argv[2] || 1, NCOR = +process.argv[3] || 22;
const NCOR_ARV = +process.env.CORES_ARVORE || 56, CONTORNO = process.env.CONTORNO || 'tom', SOBRETOM = +process.env.SOBRETOM || .76;   // CONTORNO: 'tom' (sobretom na borda, padrão) · 'fora' (linha escura de 1 px por fora) · '0' (nenhum)   // árvores: bem mais cores (degradê suave do tronco) e contorno de 1 px
const path = u => new URL(u, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const OUT = path('./arvore/'), SRC = path('./arte_terreno/arvores_gemini_ref.png');
fs.mkdirSync(OUT, { recursive: true });
// itens da folha, na ordem em que o recorte os acha (linha a linha, da esquerda para a direita).
// tipo 'arvore' = objeto de célula inteira (bloqueia, 2x) · 'deco' = decoração livre (não bloqueia, 1x)
const ITENS = [
  ['arvore_carvalho', 'Carvalho', 'arvore', .45], ['arvore_curva', 'Árvore torta', 'arvore', .45],
  ['arvore_pinheiro', 'Pinheiro', 'arvore', .45], ['arvore_fina', 'Árvore fina', 'arvore', .45], ['arvore_seca', 'Árvore seca', 'arvore', .45],
  ['arbusto', 'Arbusto', 'deco', .4], ['arbusto_flores', 'Arbusto com flores', 'deco', .4], ['samambaia', 'Samambaia', 'deco', .4], ['toco', 'Toco', 'deco', .4], ['tronco', 'Tronco caído', 'deco', .4],
  ['arbusto_b', 'Arbusto 2', 'deco', .4], ['arbusto_flores_b', 'Arbusto com flores 2', 'deco', .4], ['samambaia_b', 'Samambaia 2', 'deco', .4], ['toco_b', 'Toco 2', 'deco', .4], ['tronco_b', 'Tronco caído 2', 'deco', .4],
];
const { w, h, data } = decodePNG(SRC);
const gray = i => { const r = data[i], g = data[i + 1], b = data[i + 2]; return Math.max(r, g, b) - Math.min(r, g, b) < 14 && (r + g + b) / 3 > 188; };
// fundo = cinza claro ligado à borda da imagem (cinza claro DENTRO de um item, como pétala branca, é do item)
const bg = new Uint8Array(w * h), st = [];
const empurra = (x, y) => { const p = y * w + x; if (!bg[p] && gray(p * 4)) { bg[p] = 1; st.push(p); } };
for (let x = 0; x < w; x++) { empurra(x, 0); empurra(x, h - 1); } for (let y = 0; y < h; y++) { empurra(0, y); empurra(w - 1, y); }
while (st.length) { const p = st.pop(), x = p % w, y = (p / w) | 0; if (x > 0) empurra(x - 1, y); if (x < w - 1) empurra(x + 1, y); if (y > 0) empurra(x, y - 1); if (y < h - 1) empurra(x, y + 1); }
// retalhos de fundo presos entre galhos: cinza claro liso e GRANDE (>120 px) que o fluxo da borda não alcançou também é fundo (pétala branca é pequena e fica)
{ const vis = new Uint8Array(w * h); for (let s = 0; s < w * h; s++) if (!bg[s] && !vis[s] && gray(s * 4)) { const comp = [s], q = [s]; vis[s] = 1; while (q.length) { const p = q.pop(), x = p % w, y = (p / w) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < w && yy < h) { const k = yy * w + xx; if (!vis[k] && !bg[k] && gray(k * 4)) { vis[k] = 1; comp.push(k); q.push(k); } } } } if (comp.length > 120) comp.forEach(k => bg[k] = 1); } }
// o fundo da folha tem blocos de cinza diferentes: o que sobra de cinza liso bem claro fora dos itens também sai (grandes manchas conexas)
const mask = new Uint8Array(w * h); for (let k = 0; k < w * h; k++) mask[k] = bg[k] ? 0 : 1;
// componentes
const dil = new Uint8Array(w * h), R = 2;
for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (mask[y * w + x]) for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < w && yy < h) dil[yy * w + xx] = 1; }
const lab = new Int32Array(w * h), comps = []; let n = 0;
for (let s = 0; s < w * h; s++) if (dil[s] && !lab[s]) { n++; const stk = [s]; lab[s] = n; let x0 = w, y0 = h, x1 = 0, y1 = 0, cnt = 0;
  while (stk.length) { const p = stk.pop(), x = p % w, y = (p / w) | 0; if (mask[p]) { cnt++; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < w && yy < h) { const q = yy * w + xx; if (dil[q] && !lab[q]) { lab[q] = n; stk.push(q); } } } }
  if (cnt > 60) comps.push({ id: n, x0, y0, x1, y1 }); }
comps.sort((a, b) => (Math.round(a.y0 / 90) - Math.round(b.y0 / 90)) || a.x0 - b.x0);
if (comps.length !== ITENS.length) throw new Error('esperava ' + ITENS.length + ' itens, achei ' + comps.length + ': ' + comps.map(c => `${c.x0},${c.y0} ${c.x1 - c.x0 + 1}x${c.y1 - c.y0 + 1}`).join(' | '));
// verde do chão: mantém o brilho e repinta o que é verde com a rampa (#6c7f50 #7a8e5a #849766)
const hx2 = hh => [parseInt(hh.slice(1, 3), 16), parseInt(hh.slice(3, 5), 16), parseInt(hh.slice(5, 7), 16)];
const RAMPA = [[0, '#3a4a2c'], [.3, '#4f6339'], [.55, '#6c7f50'], [.78, '#7a8e5a'], [.92, '#849766'], [1, '#98ab78']].map(([t, hh]) => [t, hx2(hh)]);
function esverdeia(r, g, b) { const mx = Math.max(r, g, b), mn = Math.min(r, g, b); if (!(g >= r && g >= b && mx - mn > 12)) return [r, g, b];
  const Y = .3 * r + .59 * g + .11 * b, t = Math.max(0, Math.min(1, (Y - 35) / 120)); for (let i = 1; i < RAMPA.length; i++) if (t <= RAMPA[i][0]) { const [t0, c0] = RAMPA[i - 1], [t1, c1] = RAMPA[i], k = (t - t0) / (t1 - t0); return c0.map((v, j) => v + (c1[j] - v) * k); } return RAMPA[RAMPA.length - 1][1]; }
const itens = comps.map((c, idx) => {
  const [nome, rotulo, tipo, fat0] = ITENS[idx], FAT = fat0 * MULT, cw = c.x1 - c.x0 + 1, ch = c.y1 - c.y0 + 1, d = new Uint8Array(cw * ch * 4);
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) { const p = (c.y0 + y) * w + c.x0 + x; if (mask[p] && lab[p] === c.id) { d.set(data.subarray(p * 4, p * 4 + 4), (y * cw + x) * 4); d[(y * cw + x) * 4 + 3] = 255; } }
  const LIMPA = process.env.LIMPA || 'c';   // a = sem limpeza extra · c = só cinza liso claro · b = cinza e quase-cinza
  if (LIMPA !== 'a' && ['arvore_curva', 'arvore_fina'].includes(nome)) for (let i = 0; i < cw * ch; i++) { const r = d[i * 4], gg = d[i * 4 + 1], b = d[i * 4 + 2], sat = Math.max(r, gg, b) - Math.min(r, gg, b), av = (r + gg + b) / 3; if (d[i * 4 + 3] && (LIMPA === 'b' ? sat < 26 && av > 158 : sat < 14 && av > 188)) d[i * 4 + 3] = 0; }   // cinza claro sem cor = fundo que ficou entre as folhas (só nestas duas árvores: nas outras os tons claros da copa são folha)
  if (!nome.startsWith('arbusto_flores')) for (let pass = 0; pass < 1; pass++) { const kill = [];   // franja clara (as flores brancas do arbusto ficam)
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) { const p = (y * cw + x) * 4; if (!d[p + 3]) continue; let borda = false; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= cw || yy >= ch || !d[(yy * cw + xx) * 4 + 3]) borda = true; }
      if (!borda) continue; const r = d[p], g = d[p + 1], b = d[p + 2]; if (Math.max(r, g, b) - Math.min(r, g, b) < 34 && (r + g + b) / 3 > 150) kill.push(p); }
    kill.forEach(p => d[p + 3] = 0); }
  const tw = Math.max(3, Math.round(cw * FAT)), th = Math.max(3, Math.round(ch * FAT)), o = new Uint8Array(tw * th * 4);
  for (let ty = 0; ty < th; ty++) for (let tx = 0; tx < tw; tx++) { let a = 0, r = 0, g = 0, b = 0, m = 0;
    for (let y = Math.floor(ty / FAT); y < Math.min(ch, Math.ceil((ty + 1) / FAT)); y++) for (let x = Math.floor(tx / FAT); x < Math.min(cw, Math.ceil((tx + 1) / FAT)); x++) { const p = (y * cw + x) * 4; m++; if (d[p + 3]) { a++; r += d[p]; g += d[p + 1]; b += d[p + 2]; } }
    if (a && a / m >= .5) { const q = (ty * tw + tx) * 4, [R2, G2, B2] = esverdeia(r / a, g / a, b / a); o[q] = R2; o[q + 1] = G2; o[q + 2] = B2; o[q + 3] = 255; } }
  return { nome, rotulo, tipo, tw, th, o };
});
// paleta própria por item (median cut), pixel duro
function paleta(px, n) { let caixas = [px]; while (caixas.length < n) { caixas.sort((a, b) => b.length - a.length); const bx = caixas.shift(); if (bx.length < 2) { caixas.push(bx); break; }
    const ranges = [0, 1, 2].map(k => { let lo = 255, hi = 0; for (const p of bx) { lo = Math.min(lo, p[k]); hi = Math.max(hi, p[k]); } return hi - lo; }), k = ranges.indexOf(Math.max(...ranges));
    bx.sort((a, b) => a[k] - b[k]); const m = bx.length >> 1; caixas.push(bx.slice(0, m), bx.slice(m)); }
  return caixas.map(bx => [0, 1, 2].map(k => Math.round(bx.reduce((s, p) => s + p[k], 0) / bx.length))); }
const dados = {};
for (const it of itens) { const px = []; for (let i = 0; i < it.tw * it.th; i++) if (it.o[i * 4 + 3]) px.push([it.o[i * 4], it.o[i * 4 + 1], it.o[i * 4 + 2]]);
  const PAL = paleta(px, it.tipo === 'arvore' ? NCOR_ARV : NCOR), perto = (r, g, b) => { let bi = 0, bd = 1e9; PAL.forEach((c, i) => { const dd = (c[0] - r) ** 2 + (c[1] - g) ** 2 + (c[2] - b) ** 2; if (dd < bd) { bd = dd; bi = i; } }); return PAL[bi]; };
  for (let i = 0; i < it.tw * it.th; i++) if (it.o[i * 4 + 3]) { const c = perto(it.o[i * 4], it.o[i * 4 + 1], it.o[i * 4 + 2]); it.o[i * 4] = c[0]; it.o[i * 4 + 1] = c[1]; it.o[i * 4 + 2] = c[2]; }
  if (CONTORNO === 'tom' && it.tipo === 'arvore') {   // sobretom: o pixel de borda (que tem vazio ao lado) vira um tom mais escuro da própria cor, calculado direto da cor do pixel (não da paleta: o verde escuro achava um marrom como "mais próximo"); o tamanho da árvore não muda
    const orig = it.o.slice(), vaz = (x, y) => x < 0 || y < 0 || x >= it.tw || y >= it.th || !orig[(y * it.tw + x) * 4 + 3];
    for (let y = 0; y < it.th; y++) for (let x = 0; x < it.tw; x++) { const p = (y * it.tw + x) * 4; if (!orig[p + 3]) continue; if (!(vaz(x - 1, y) || vaz(x + 1, y) || vaz(x, y - 1) || vaz(x, y + 1))) continue;
      const baixo = vaz(x, y + 1) || vaz(x + 1, y), f = baixo ? SOBRETOM * .9 : SOBRETOM, c = [orig[p] * f, orig[p + 1] * f, orig[p + 2] * f]; it.o[p] = Math.round(c[0]); it.o[p + 1] = Math.round(c[1]); it.o[p + 2] = Math.round(c[2]); } }
  if (CONTORNO === 'fora' && it.tipo === 'arvore') {   // contorno de 1 px: tom escuro da cor do pixel vizinho (marrom-escuro no tronco, verde-escuro na copa)
    const tw2 = it.tw + 2, th2 = it.th + 2, o2 = new Uint8Array(tw2 * th2 * 4);
    for (let y = 0; y < it.th; y++) for (let x = 0; x < it.tw; x++) o2.set(it.o.subarray((y * it.tw + x) * 4, (y * it.tw + x) * 4 + 4), ((y + 1) * tw2 + x + 1) * 4);
    const orig = o2.slice();   // lê só da imagem original, senão o contorno vira vizinho e se espalha
    for (let y = 0; y < th2; y++) for (let x = 0; x < tw2; x++) { if (orig[(y * tw2 + x) * 4 + 3]) continue; let viz = null, lum = 1e9;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= tw2 || yy >= th2) continue; const p = (yy * tw2 + xx) * 4; if (orig[p + 3] === 255) { const l = orig[p] + orig[p + 1] + orig[p + 2]; if (l < lum) { lum = l; viz = [orig[p], orig[p + 1], orig[p + 2]]; } } }
      if (viz) o2.set([Math.round(viz[0] * .42), Math.round(viz[1] * .42), Math.round(viz[2] * .42), 255], (y * tw2 + x) * 4); }
    it.o = o2; it.tw = tw2; it.th = th2; }
  const png = encodePNG(it.tw, it.th, it.o); fs.writeFileSync(OUT + it.nome + '.png', png);
  // ponto de apoio do tronco: base da última linha com arte, centro das 3 últimas linhas
  let yb = it.th - 1; while (yb > 0 && ![...Array(it.tw).keys()].some(x => it.o[(yb * it.tw + x) * 4 + 3])) yb--;
  let sx = 0, sn = 0; for (let y = Math.max(0, yb - 2); y <= yb; y++) for (let x = 0; x < it.tw; x++) if (it.o[(y * it.tw + x) * 4 + 3]) { sx += x + .5; sn++; }
  dados[it.nome] = { nome: it.rotulo, tipo: it.tipo, src: 'data:image/png;base64,' + png.toString('base64'), cx: Math.round(sx / sn * 2) / 2, by: yb, w: it.tw, h: it.th };
}
fs.writeFileSync(path('./arvore_dados.js'), '// gerado por arvores_do_gemini.mjs\nconst ARV_DADOS = ' + JSON.stringify(dados) + ';\n');
// folha de conferência (zoom 3)
const Z = 3, W = 1000; let x = 8, y = 8, rh = 0; const pos = [];
for (const it of itens) { if (x + it.tw * Z > W - 8) { x = 8; y += rh + 10; rh = 0; } pos.push([it, x, y]); x += it.tw * Z + 10; rh = Math.max(rh, it.th * Z); }
const H = y + rh + 8, im = new Uint8Array(W * H * 4); for (let i = 0; i < W * H; i++) im.set([0x84, 0x97, 0x66, 255], i * 4);
for (const [it, ox, oy] of pos) for (let j = 0; j < it.th * Z; j++) for (let i = 0; i < it.tw * Z; i++) { const p = (((j / Z) | 0) * it.tw + ((i / Z) | 0)) * 4; if (it.o[p + 3]) im.set(it.o.subarray(p, p + 4), ((oy + j) * W + ox + i) * 4); }
fs.writeFileSync(OUT + '_conferencia.png', encodePNG(W, H, im));
console.log(itens.map(i => i.nome + ' ' + i.tw + 'x' + i.th).join(', '));
