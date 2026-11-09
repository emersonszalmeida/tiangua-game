// Converte a folha de árvores do Gemini (arte_terreno/arvores_gemini_ref.png) em pixel art limpa para o editor:
// recorta, tira o fundo cinza (inclusive a franja), reduz, ajusta o verde à rampa do chão, trava a paleta por item e deixa o pixel duro.
// Saída: arvore/*.png, arvore/_conferencia.png e arvore_dados.js (imagens embutidas + ponto de apoio do tronco).
// uso: node arvores_do_gemini.mjs [multiplicador de tamanho=1] [cores por item=22]
import fs from 'node:fs';
import { decodePNG } from './pngdec.mjs';
import { encodePNG } from './pngenc.mjs';
const MULT = +process.argv[2] || 1, NCOR = +process.argv[3] || 22;
const NCOR_ARV = +process.env.CORES_ARVORE || 56, CONTORNO = process.env.CONTORNO || '0', SOBRETOM = +process.env.SOBRETOM || .87;   // CONTORNO: '0' (nenhum, padrão) · 'tom' (sobretom na borda) · 'fora' (linha escura de 1 px por fora) · '0' (nenhum)   // árvores: bem mais cores (degradê suave do tronco) e contorno de 1 px
const path = u => new URL(u, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const OUT = path('./arvore/'), SRC = path('./arte_terreno/arvores_gemini_ref.png');
fs.mkdirSync(OUT, { recursive: true });
// itens da folha, na ordem em que o recorte os acha (linha a linha, da esquerda para a direita).
// tipo 'arvore' = objeto de célula inteira (bloqueia, 2x) · 'deco' = decoração livre (não bloqueia, 1x)
const ITENS = [
  ['arvore_carvalho', 'Carvalho', 'arvore', .9], ['arvore_curva', 'Árvore torta', 'arvore', .9],
  ['arvore_pinheiro', 'Pinheiro', 'arvore', .9], ['arvore_fina', 'Árvore fina', 'arvore', .9], ['arvore_seca', 'Árvore seca', 'arvore', .9],
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
// franja cinza-clara na borda das árvores (mistura do fundo com a folha): pixel de borda claro e quase sem cor sai; 2 passadas
for (const it of itens) if (it.tipo === 'arvore') for (let pass = 0; pass < 2; pass++) { const kill = [];
  for (let y = 0; y < it.th; y++) for (let x = 0; x < it.tw; x++) { const p = (y * it.tw + x) * 4; if (!it.o[p + 3]) continue;
    let borda = false; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= it.tw || yy >= it.th || !it.o[(yy * it.tw + xx) * 4 + 3]) borda = true; }
    if (!borda) continue; const r = it.o[p], gg = it.o[p + 1], b = it.o[p + 2], sat = Math.max(r, gg, b) - Math.min(r, gg, b); if (sat < 34 && (r + gg + b) / 3 > 150) kill.push(p); }
  kill.forEach(p => it.o[p + 3] = 0); }
// musgo no tronco e cinza dentro da copa
const isVerde = (r, gg, b) => gg >= r && gg >= b && Math.max(r, gg, b) - Math.min(r, gg, b) > 12;
for (const it of itens) if (it.tipo === 'arvore') {
  const W2 = it.tw, H2 = it.th, op = i => it.o[i * 4 + 3], cor = i => [it.o[i * 4], it.o[i * 4 + 1], it.o[i * 4 + 2]], Y = c => .3 * c[0] + .59 * c[1] + .11 * c[2];
  // (a) manchas verdes pequenas cercadas de marrom (musgo do tronco) viram marrom de tronco, mantendo o brilho de cada pixel
  const comp = new Int32Array(W2 * H2); let nc = 0;
  for (let s = 0; s < W2 * H2; s++) { if (!op(s) || comp[s] || !isVerde(...cor(s))) continue; nc++; const pil = [s], px = []; comp[s] = nc;
    while (pil.length) { const p = pil.pop(); px.push(p); const x = p % W2, y = (p / W2) | 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W2 || yy >= H2) continue; const q = yy * W2 + xx; if (op(q) && !comp[q] && isVerde(...cor(q))) { comp[q] = nc; pil.push(q); } } }
    if (px.length > 700) continue;   // copa (grande) não é musgo
    let nb = 0, nt = 0, br = [0, 0, 0]; const vistos = new Set();
    for (const p of px) { const x = p % W2, y = (p / W2) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, yy = y + dy, q = yy * W2 + xx; if (xx < 0 || yy < 0 || xx >= W2 || yy >= H2 || !op(q)) { nt++; continue; } if (comp[q] === nc) continue; if (isVerde(...cor(q))) continue; if (!vistos.has(q)) { vistos.add(q); nb++; const c = cor(q); br[0] += c[0]; br[1] += c[1]; br[2] += c[2]; } } }
    if (nb >= 6 && nt <= .15 * (nb + nt)) { const bm = br.map(v => v / nb), by = Y(bm); for (const p of px) { const c = cor(p), k = Math.max(.75, Math.min(1.3, Y(c) / Math.max(1, by))); it.o[p * 4] = Math.round(bm[0] * k); it.o[p * 4 + 1] = Math.round(bm[1] * k); it.o[p * 4 + 2] = Math.round(bm[2] * k); } } }
  // (b) pixel claro e sem cor no meio da folhagem (cinza solto) vira verde-claro de folha
  const copia = it.o.slice();
  for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) { const p = y * W2 + x; if (!copia[p * 4 + 3]) continue; const r = copia[p * 4], gg = copia[p * 4 + 1], b = copia[p * 4 + 2], sat = Math.max(r, gg, b) - Math.min(r, gg, b); if (!(sat < 30 && (r + gg + b) / 3 > 140)) continue;
    let nv = 0, sr = 0, sg = 0, sb = 0; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = x + dx, yy = y + dy; if ((!dx && !dy) || xx < 0 || yy < 0 || xx >= W2 || yy >= H2) continue; const q = yy * W2 + xx; if (copia[q * 4 + 3] && isVerde(copia[q * 4], copia[q * 4 + 1], copia[q * 4 + 2])) { nv++; sr += copia[q * 4]; sg += copia[q * 4 + 1]; sb += copia[q * 4 + 2]; } }
    if (nv >= 6) { it.o[p * 4] = Math.round(sr / nv * 1.04); it.o[p * 4 + 1] = Math.round(sg / nv * 1.04); it.o[p * 4 + 2] = Math.round(sb / nv * 1.04); } }
}
// pixel que não é verde mas está cercado de verde (borda escura/acinzentada da folha) é folha: vira a média dos verdes vizinhos.
// Sem isso, o casamento de cores logo abaixo o jogaria para os marrons do toco (pontinhos marrons/laranja na borda da copa).
for (const it of itens) if (it.tipo === 'arvore') for (let rodada = 0; rodada < 2; rodada++) {
  const cp = it.o.slice(), vd = (r, gg, b) => gg >= r && gg >= b && Math.max(r, gg, b) - Math.min(r, gg, b) > 12;
  for (let y = 0; y < it.th; y++) for (let x = 0; x < it.tw; x++) { const p = (y * it.tw + x) * 4; if (!cp[p + 3] || vd(cp[p], cp[p + 1], cp[p + 2])) continue;
    let nv = 0, nn = 0, sr = 0, sg = 0, sb = 0; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = x + dx, yy = y + dy; if ((!dx && !dy) || xx < 0 || yy < 0 || xx >= it.tw || yy >= it.th) continue; const q = (yy * it.tw + xx) * 4; if (!cp[q + 3]) continue; if (vd(cp[q], cp[q + 1], cp[q + 2])) { nv++; sr += cp[q]; sg += cp[q + 1]; sb += cp[q + 2]; } else nn++; }
    const bord = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const xx = x + dx, yy = y + dy; return xx < 0 || yy < 0 || xx >= it.tw || yy >= it.th || !cp[(yy * it.tw + xx) * 4 + 3]; });   // na ponta da folha há poucos vizinhos: exige menos
    if (bord ? (nv >= 2 && nv > nn) : (nv >= 5 && nv > 1.6 * nn)) { it.o[p] = Math.round(sr / nv * .94); it.o[p + 1] = Math.round(sg / nv * .94); it.o[p + 2] = Math.round(sb / nv * .94); } }
}
// tocos marrons minúsculos (até 14 px, 8-conexos) colados na folhagem: ponta de galho que sobrou na borda; saem
for (const it of itens) if (it.tipo === 'arvore') { const vd = (r, gg, b) => gg >= r && gg >= b && Math.max(r, gg, b) - Math.min(r, gg, b) > 12, W3 = it.tw, H3 = it.th, vis = new Uint8Array(W3 * H3), op = i => it.o[i * 4 + 3] > 0, verde = i => vd(it.o[i * 4], it.o[i * 4 + 1], it.o[i * 4 + 2]);
  for (let s = 0; s < W3 * H3; s++) { if (!op(s) || vis[s] || verde(s)) continue; const comp = [s], pil = [s]; vis[s] = 1; let toca = false;
    while (pil.length) { const p = pil.pop(), x = p % W3, y = (p / W3) | 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if ((!dx && !dy) || xx < 0 || yy < 0 || xx >= W3 || yy >= H3) continue; const q = yy * W3 + xx; if (!op(q)) continue; if (verde(q)) { toca = true; continue; } if (!vis[q]) { vis[q] = 1; comp.push(q); pil.push(q); } } }
    if (comp.length <= 14 && toca) comp.forEach(q => it.o[q * 4 + 3] = 0); } }
// pontinhas de 1-2 px que não são verdes, encostam na folhagem e quase não têm vizinho marrom: sobra de borda, saem (1 passada)
for (const it of itens) if (it.tipo === 'arvore') for (let rod = 0; rod < 2; rod++) { const cp = it.o.slice(), vd = (r, gg, b) => gg >= r && gg >= b && Math.max(r, gg, b) - Math.min(r, gg, b) > 12, tem = (x, y) => x >= 0 && y >= 0 && x < it.tw && y < it.th && cp[(y * it.tw + x) * 4 + 3] > 0;
  for (let y = 0; y < it.th; y++) for (let x = 0; x < it.tw; x++) { const p = (y * it.tw + x) * 4; if (!cp[p + 3] || vd(cp[p], cp[p + 1], cp[p + 2])) continue; let vazios = 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!tem(x + dx, y + dy)) vazios++; if (vazios < 2) continue;
    let verdes = 0, outros = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if ((!dx && !dy) || !tem(x + dx, y + dy)) continue; const q = ((y + dy) * it.tw + x + dx) * 4; if (vd(cp[q], cp[q + 1], cp[q + 2])) verdes++; else outros++; }
    if (verdes >= 1 && outros <= 2) it.o[p + 3] = 0;
    else if (verdes >= 1 && outros <= 3) { let sr = 0, sg = 0, sb = 0, n = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if ((!dx && !dy) || !tem(x + dx, y + dy)) continue; const q = ((y + dy) * it.tw + x + dx) * 4; if (vd(cp[q], cp[q + 1], cp[q + 2])) { sr += cp[q]; sg += cp[q + 1]; sb += cp[q + 2]; n++; } } if (n) { it.o[p] = Math.round(sr / n * .94); it.o[p + 1] = Math.round(sg / n * .94); it.o[p + 2] = Math.round(sb / n * .94); } } } }
// cores das árvores = cores do arbusto (verde) e do toco/tronco (marrom), que são as que encaixam no cenário:
// casamento de histograma por brilho (o claro/escuro continua na mesma ordem, mas os tons passam a ser os do arbusto e do toco).
// As árvores são tratadas juntas (o pinheiro continua mais escuro que o carvalho, etc.).
if (process.env.CORES_DO_CENARIO !== '0') {
  const Yc = (r, gg, b) => .3 * r + .59 * gg + .11 * b, verdeCl = (r, gg, b) => gg >= r && gg >= b && Math.max(r, gg, b) - Math.min(r, gg, b) > 12;
  const alvo = (nomes, quer) => { const L = []; for (const it of itens) if (nomes.includes(it.nome)) for (let i = 0; i < it.tw * it.th; i++) if (it.o[i * 4 + 3]) { const c = [it.o[i * 4], it.o[i * 4 + 1], it.o[i * 4 + 2]]; if (quer === undefined || verdeCl(...c) === quer) L.push(c); } return L.sort((a, b) => Yc(...a) - Yc(...b)); };
  const alvoVerde0 = alvo(['arbusto', 'arbusto_b'], true), alvoVerde = alvoVerde0.slice(0, Math.floor(alvoVerde0.length * (+process.env.CLARO_MAX || .88))), alvoMarrom = alvo(['toco', 'toco_b', 'tronco', 'tronco_b'], false);
  const arv = itens.filter(it => it.tipo === 'arvore');
  for (const itA of arv) { const pool = { v: [], m: [] };
  { const it = itA, ii = 0; for (let i = 0; i < it.tw * it.th; i++) if (it.o[i * 4 + 3]) { const c = [it.o[i * 4], it.o[i * 4 + 1], it.o[i * 4 + 2]]; (verdeCl(...c) ? pool.v : pool.m).push([Yc(...c), ii, i]); } }
  for (const [lista, tgt] of [[pool.v, alvoVerde], [pool.m, alvoMarrom]]) { lista.sort((a, b) => a[0] - b[0]); const n = lista.length; if (!tgt.length) continue;
    lista.forEach(([, ii, i], k) => { const c = tgt[Math.min(tgt.length - 1, Math.floor(k / n * tgt.length))], o = itA.o; o[i * 4] = c[0]; o[i * 4 + 1] = c[1]; o[i * 4 + 2] = c[2]; }); } }
}
// APRENDIDO COM A EDIÇÃO DO DONO (2026-11-09, ver NOTAS.md): na madeira (tronco/galhos) o pixel de borda bem mais claro que o interior é a
// franja do desenho original e o dono sempre a tira. Regra: pixel de madeira com vizinho 4 vazio, mais claro que a média do interior
// (não-borda, 5x5) em > .12 e que o do 3x3 em > .08 → sai. Contra o gabarito do dono: ~78% de acerto, pega ~59% do que ele tirou (depois, 2ª parte: escurece a borda restante).
if (process.env.FRANJA_MADEIRA !== '0') for (const it of itens) if (it.tipo === 'arvore') {
  const W5 = it.tw, H5 = it.th, op = (x, y) => x >= 0 && y >= 0 && x < W5 && y < H5 && it.o[(y * W5 + x) * 4 + 3] > 0, cor = (x, y) => { const p = (y * W5 + x) * 4; return [it.o[p], it.o[p + 1], it.o[p + 2]]; };
  const verd = c => c[1] >= c[0] && c[1] >= c[2] && Math.max(...c) - Math.min(...c) > 12, Yl = c => (.3 * c[0] + .59 * c[1] + .11 * c[2]) / 255;
  const bd = (x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !op(x + dx, y + dy)), tirar = [];
  for (let y = 0; y < H5; y++) for (let x = 0; x < W5; x++) { if (!op(x, y) || verd(cor(x, y)) || !bd(x, y)) continue; let n2 = 0, s2 = 0, n1 = 0, s1 = 0;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { if ((!dx && !dy) || !op(x + dx, y + dy) || bd(x + dx, y + dy) || verd(cor(x + dx, y + dy))) continue; const yy = Yl(cor(x + dx, y + dy)); n2++; s2 += yy; if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) { n1++; s1 += yy; } }
    if (n2 && n1) { const yp = Yl(cor(x, y)); if (yp - s2 / n2 > .12 && yp - s1 / n1 > .08) tirar.push([x, y]); } }
  tirar.forEach(([x, y]) => it.o[(y * W5 + x) * 4 + 3] = 0);
  // 2ª parte do que o dono fez: o que sobrou na borda da madeira nunca fica mais claro que o interior (borda = um tom abaixo do tronco).
  // Medido no trabalho dele: desvio do brilho da borda caiu de ~.12 para ~.05 e o p90 de +.2 para ~+.02. Aqui: se ΔBrilho > +.02 (o dono deixa até ~+.02), escurece até (interior - .01), mantendo a cor.
  const esc = [];
  for (let y = 0; y < H5; y++) for (let x = 0; x < W5; x++) { if (!op(x, y) || verd(cor(x, y)) || !bd(x, y)) continue; let n = 0, s = 0;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { if ((!dx && !dy) || !op(x + dx, y + dy) || bd(x + dx, y + dy) || verd(cor(x + dx, y + dy))) continue; n++; s += Yl(cor(x + dx, y + dy)); }
    if (n >= 3) { const c = cor(x, y), yp = Yl(c), alvo = s / n - .01; if (yp - s / n > .02 && yp > 0) { const f = Math.max(.55, Math.min(1, alvo / yp)); esc.push([x, y, c.map(v => Math.round(v * f))]); } } }
  esc.forEach(([x, y, c]) => { const p = (y * W5 + x) * 4; it.o[p] = c[0]; it.o[p + 1] = c[1]; it.o[p + 2] = c[2]; });
}
// peças editadas à mão (no editor-pixel, via arvores_aplicar_edicoes.mjs): ficam em arvore_editadas/<nome>.png e valem no lugar do que o gerador faria
const EDIT = process.env.EDIT_DIR || path('./arvore_editadas/');   // EDIT_DIR=<pasta inexistente> ignora as peças editadas (para testar o gerador sozinho)
for (const it of itens) { const fe = EDIT + it.nome + '.png'; if (fs.existsSync(fe)) { const im = decodePNG(fe); it.o = Uint8Array.from(im.data); it.tw = im.w; it.th = im.h; it.fixa = true; console.log('  (editada à mão) ' + it.nome); } }
const dados = {};
for (const it of itens) { if (!it.fixa) { const px = []; for (let i = 0; i < it.tw * it.th; i++) if (it.o[i * 4 + 3]) px.push([it.o[i * 4], it.o[i * 4 + 1], it.o[i * 4 + 2]]);
  const PAL = paleta(px, it.tipo === 'arvore' ? NCOR_ARV : NCOR), perto = (r, g, b) => { let bi = 0, bd = 1e9; PAL.forEach((c, i) => { const dd = (c[0] - r) ** 2 + (c[1] - g) ** 2 + (c[2] - b) ** 2; if (dd < bd) { bd = dd; bi = i; } }); return PAL[bi]; };
  for (let i = 0; i < it.tw * it.th; i++) if (it.o[i * 4 + 3]) { const c = perto(it.o[i * 4], it.o[i * 4 + 1], it.o[i * 4 + 2]); it.o[i * 4] = c[0]; it.o[i * 4 + 1] = c[1]; it.o[i * 4 + 2] = c[2]; }
  if (CONTORNO === 'tom' && it.tipo === 'arvore') {   // sobretom: o pixel de borda (que tem vazio ao lado) vira um tom mais escuro da própria cor, calculado direto da cor do pixel (não da paleta: o verde escuro achava um marrom como "mais próximo"); o tamanho da árvore não muda
    const orig = it.o.slice(), vaz = (x, y) => x < 0 || y < 0 || x >= it.tw || y >= it.th || !orig[(y * it.tw + x) * 4 + 3];
    for (let y = 0; y < it.th; y++) for (let x = 0; x < it.tw; x++) { const p = (y * it.tw + x) * 4; if (!orig[p + 3]) continue; if (!(vaz(x - 1, y) || vaz(x + 1, y) || vaz(x, y - 1) || vaz(x, y + 1))) continue;
      const baixo = vaz(x, y + 1) || vaz(x + 1, y), f = baixo ? SOBRETOM * .94 : SOBRETOM;
      let nv = 0, nm = 0, sr = 0, sg = 0, sb = 0;   // vizinhos 5x5: quantos são verde de folha e quantos são marrom/outros
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { if (!dx && !dy) continue; const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= it.tw || yy >= it.th) continue; const q = (yy * it.tw + xx) * 4; if (!orig[q + 3]) continue; const r2 = orig[q], g2 = orig[q + 1], b2 = orig[q + 2];
        if (g2 >= r2 && g2 >= b2 && Math.max(r2, g2, b2) - Math.min(r2, g2, b2) > 12) { nv++; sr += r2; sg += g2; sb += b2; } else nm++; }
      const copa = nv >= 5 && nv > 2 * nm, c = copa ? [sr / nv * f, sg / nv * f, sb / nv * f] : [orig[p] * f, orig[p + 1] * f, orig[p + 2] * f]; it.o[p] = Math.round(c[0]); it.o[p + 1] = Math.round(c[1]); it.o[p + 2] = Math.round(c[2]); } }
  if (CONTORNO === 'fora' && it.tipo === 'arvore') {   // contorno de 1 px: tom escuro da cor do pixel vizinho (marrom-escuro no tronco, verde-escuro na copa)
    const tw2 = it.tw + 2, th2 = it.th + 2, o2 = new Uint8Array(tw2 * th2 * 4);
    for (let y = 0; y < it.th; y++) for (let x = 0; x < it.tw; x++) o2.set(it.o.subarray((y * it.tw + x) * 4, (y * it.tw + x) * 4 + 4), ((y + 1) * tw2 + x + 1) * 4);
    const orig = o2.slice();   // lê só da imagem original, senão o contorno vira vizinho e se espalha
    for (let y = 0; y < th2; y++) for (let x = 0; x < tw2; x++) { if (orig[(y * tw2 + x) * 4 + 3]) continue; let viz = null, lum = 1e9;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= tw2 || yy >= th2) continue; const p = (yy * tw2 + xx) * 4; if (orig[p + 3] === 255) { const l = orig[p] + orig[p + 1] + orig[p + 2]; if (l < lum) { lum = l; viz = [orig[p], orig[p + 1], orig[p + 2]]; } } }
      if (viz) o2.set([Math.round(viz[0] * .42), Math.round(viz[1] * .42), Math.round(viz[2] * .42), 255], (y * tw2 + x) * 4); }
    it.o = o2; it.tw = tw2; it.th = th2; }
  } const png = encodePNG(it.tw, it.th, it.o); fs.writeFileSync(OUT + it.nome + '.png', png);
  // ponto de apoio do tronco: base da última linha com arte, centro das 3 últimas linhas
  let yb = it.th - 1; while (yb > 0 && ![...Array(it.tw).keys()].some(x => it.o[(yb * it.tw + x) * 4 + 3])) yb--;
  let sx = 0, sn = 0; for (let y = Math.max(0, yb - 2); y <= yb; y++) for (let x = 0; x < it.tw; x++) if (it.o[(y * it.tw + x) * 4 + 3]) { sx += x + .5; sn++; }
  const brown = (x, y) => { const p = (y * it.tw + x) * 4; return it.o[p + 3] && !(it.o[p + 1] >= it.o[p] && it.o[p + 1] >= it.o[p + 2] && Math.max(it.o[p], it.o[p + 1], it.o[p + 2]) - Math.min(it.o[p], it.o[p + 1], it.o[p + 2]) > 12); };
  const lar = []; let sxm = 0, nxm = 0; for (let y = Math.max(0, yb - 23); y <= Math.max(0, yb - 4); y++) { let n = 0; for (let x = 0; x < it.tw; x++) if (brown(x, y)) { n++; if (y >= yb - 16) { sxm += x + .5; nxm++; } } if (n) lar.push(n); } lar.sort((a, b) => a - b);
  // colisão só no miolo da base do tronco: centro = centro do marrom nas linhas yb-16..yb-4 (a ponta das raízes fica mais baixo), raio = meia largura do trecho mais estreito (30%)
  const raio = Math.round(Math.max(.1, (lar[Math.floor(lar.length * .3)] || 10) / 2 / 90) * 100) / 100, ox = Math.round(((nxm ? sxm / nxm : sx / sn) - Math.round(sx / sn * 2) / 2) * 2) / 2, oy = 4 - 10;
  const Hp = Math.max(8, Math.min(30, Math.round((lar[Math.floor(lar.length * .3)] || 20) * .5))), pl = [], pr = []; let ul = null, ur = null;
  for (let y = yb - Hp; y <= yb; y++) { let a = -1, b = -1; for (let x = 0; x < it.tw; x++) if (brown(x, y)) { if (a < 0) a = x; b = x; } if (a >= 0) { ul = a; ur = b; } pl.push(ul === null ? 0 : ul - 1); pr.push(ur === null ? -1 : ur + 2); }   // pegada = do marrom mais à esquerda ao mais à direita de cada linha (raízes inclusas)
  dados[it.nome] = { pe: { y0: yb - Hp, l: pl, r: pr }, raio, ox, oy, nome: it.rotulo, tipo: it.tipo, src: 'data:image/png;base64,' + png.toString('base64'), cx: Math.round(sx / sn * 2) / 2, by: yb, w: it.tw, h: it.th, esc: it.tipo === 'arvore' ? 1 : undefined };
}
fs.writeFileSync(path('./arvore_dados.js'), '// gerado por arvores_do_gemini.mjs\nconst ARV_DADOS = ' + JSON.stringify(dados) + ';\n');
// folha de conferência (zoom 3)
const Z = 3, W = 1000; let x = 8, y = 8, rh = 0; const pos = [];
for (const it of itens) { if (x + it.tw * Z > W - 8) { x = 8; y += rh + 10; rh = 0; } pos.push([it, x, y]); x += it.tw * Z + 10; rh = Math.max(rh, it.th * Z); }
const H = y + rh + 8, im = new Uint8Array(W * H * 4); for (let i = 0; i < W * H; i++) im.set([0x84, 0x97, 0x66, 255], i * 4);
for (const [it, ox, oy] of pos) for (let j = 0; j < it.th * Z; j++) for (let i = 0; i < it.tw * Z; i++) { const p = (((j / Z) | 0) * it.tw + ((i / Z) | 0)) * 4; if (it.o[p + 3]) im.set(it.o.subarray(p, p + 4), ((oy + j) * W + ox + i) * 4); }
fs.writeFileSync(OUT + '_conferencia.png', encodePNG(W, H, im));
console.log(itens.map(i => i.nome + ' ' + i.tw + 'x' + i.th).join(', '));
