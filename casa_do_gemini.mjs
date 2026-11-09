// Converte a folha de peças da cabana (Gemini, rodada 1) em peças na escala do jogo (losango 128x64).
// uso: node casa_do_gemini.mjs     lê arte_casa/pecas_gemini_rodada1.png  e grava arte_casa/pecas/*.png + arte_casa/pecas.json
import fs from 'node:fs';
import { decodePNG } from './pngdec.mjs';
import { encodePNG } from './pngenc.mjs';
const IM = decodePNG('./arte_casa/pecas_gemini_rodada1.png'), W = IM.w, H = IM.h, D = IM.data;
const BG = [205, 205, 205], eBg = (x, y) => { const p = (y * W + x) * 4; return Math.abs(D[p] - BG[0]) < 14 && Math.abs(D[p + 1] - BG[1]) < 14 && Math.abs(D[p + 2] - BG[2]) < 14; };
// peças = componentes conexos (8-conexos com folga de 2 px) ordenados de cima para baixo e da esquerda para a direita
const lab = new Int32Array(W * H).fill(-1), comps = [];
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (lab[y * W + x] >= 0 || eBg(x, y)) continue; const st = [[x, y]], id = comps.length; let x0 = x, x1 = x, y0 = y, y1 = y, n = 0; lab[y * W + x] = id;
  while (st.length) { const [a, b] = st.pop(); n++; x0 = Math.min(x0, a); x1 = Math.max(x1, a); y0 = Math.min(y0, b); y1 = Math.max(y1, b);
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const u = a + dx, v = b + dy; if (u < 0 || v < 0 || u >= W || v >= H || lab[v * W + u] >= 0 || eBg(u, v)) continue; lab[v * W + u] = id; st.push([u, v]); } }
  if (n > 400) comps.push({ id, x0, y0, x1, y1, w: x1 - x0 + 1, h: y1 - y0 + 1 }); }
comps.sort((a, b) => a.y0 - b.y0 || a.x0 - b.x0);
const piso = comps.filter(c => c.w > 200), E = piso[0].w / 2;   // E = largura de uma aresta do losango na folha (metade da largura do piso)
const S = 128 / piso[0].w;                                     // escala folha → jogo: o piso vira 128 px de largura
console.log('peças', comps.length, '· pisos', piso.length, '· aresta', E, '· escala', S.toFixed(3));
const Lw = Math.round(E);   // comprimento de um pedaço de parede = 1 aresta
// recorta uma peça da folha com máscara (sem o halo do fundo: tira 1 px de borda)
function recorta(c, filtro) { const w = c.w, h = c.h, o = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const X = c.x0 + x, Y = c.y0 + y; if (lab[Y * W + X] !== c.id || (filtro && !filtro(x, y))) continue;
    if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => X + dx < 0 || Y + dy < 0 || X + dx >= W || Y + dy >= H || eBg(X + dx, Y + dy))) continue;
    const p = (Y * W + X) * 4, q = (y * w + x) * 4; o[q] = D[p]; o[q + 1] = D[p + 1]; o[q + 2] = D[p + 2]; o[q + 3] = 255; }
  return { w, h, o }; }
function apara(im) { let x0 = im.w, y0 = im.h, x1 = -1, y1 = -1; for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) if (im.o[(y * im.w + x) * 4 + 3]) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const w = x1 - x0 + 1, h = y1 - y0 + 1, o = new Uint8Array(w * h * 4); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) o.set(im.o.subarray(((y0 + y) * im.w + x0 + x) * 4, ((y0 + y) * im.w + x0 + x) * 4 + 4), (y * w + x) * 4); return { w, h, o }; }
// reduz por média de área (só conta pixel opaco); opaco se cobertura >= .5
function reduz(im, s) { const w = Math.max(1, Math.round(im.w * s)), h = Math.max(1, Math.round(im.h * s)), o = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const xa = x / s, xb = (x + 1) / s, ya = y / s, yb = (y + 1) / s; let n = 0, tot = 0, r = 0, g = 0, b = 0;
    for (let v = Math.floor(ya); v < Math.min(im.h, Math.ceil(yb)); v++) for (let u = Math.floor(xa); u < Math.min(im.w, Math.ceil(xb)); u++) { const ww = (Math.min(xb, u + 1) - Math.max(xa, u)) * (Math.min(yb, v + 1) - Math.max(ya, v)); tot += ww; const p = (v * im.w + u) * 4; if (im.o[p + 3]) { n += ww; r += im.o[p] * ww; g += im.o[p + 1] * ww; b += im.o[p + 2] * ww; } }
    if (tot && n / tot >= .5) o.set([Math.round(r / n), Math.round(g / n), Math.round(b / n), 255], (y * w + x) * 4); }
  return { w, h, o }; }
const pecas = {};
// paredes: o pedaço tem 1 aresta de comprimento; a ponta com as pontas redondas das toras (a que o Gemini desenhou) fica de fora
// O Gemini mandou DOIS conjuntos (parede ↙, parede ↘, canto): o de cima (8 toras, canto com topo estranho) e o de baixo (6 toras). Usa-se o de BAIXO (SET=1 volta ao de cima).
const SET = +process.env.SET || 2, tres = comps.filter(c => c.w <= 200 && (c.y0 < 280) === (SET === 1)).sort((p, q) => p.x0 - q.x0);
const [wEsq, wDir, canto] = tres;   // da esquerda para a direita: "/" (↙), "\" (↘) e canto
{ const x1 = wEsq.w; pecas.parede_sw = reduz(apara(recorta(wEsq, x => x >= x1 - Lw)), S); }     // "/" : ponta redonda à esquerda → fica a direita
{ pecas.parede_se = reduz(apara(recorta(wDir, x => x < Lw)), S); }                                // "\" : ponta redonda à direita → fica a esquerda
{ const fonte = apara(recorta(canto)), L = []; for (let y = 0; y < fonte.h; y++) { let s = 0, n = 0; for (let x = 0; x < fonte.w; x++) { const p = (y * fonte.w + x) * 4; if (fonte.o[p + 3]) { s += .3 * fonte.o[p] + .59 * fonte.o[p + 1] + .11 * fonte.o[p + 2]; n++; } } L.push(n ? s / n : 0); }
  const am = y => { const i = Math.floor(y), f = y - i; return L[i] * (1 - f) + (L[i + 1] ?? L[i]) * f; }; let melhor = null;
  for (let p = 16; p <= 30; p += .05) { let e = 0, n = 0; for (let y = 30; y + p < fonte.h - 30; y++) { e += Math.abs(am(y) - am(y + p)); n++; } if (n && (!melhor || e / n < melhor.e)) melhor = { p, e: e / n }; }
  const Sc = 12 / melhor.p; console.log('canto: período das camadas na folha', melhor.p.toFixed(2), '→ escala', Sc.toFixed(3), '(parede usa', S.toFixed(3) + ')');
  pecas.cantoG = reduz(fonte, Sc); }
pecas.canto = reduz(apara(recorta(canto)), S);   // versão antiga (só para o teste), a final é montada em casa_toras.mjs
// pisos: só a face de cima (losango), sem a espessura da laje
piso.slice(0, 4).forEach((c, i) => { const cx = c.w / 2, cy = c.w / 4; pecas['pisoG_' + (i + 1)] = reduz(apara(recorta(c, (x, y) => Math.abs(x + .5 - cx) / cx + Math.abs(y + .5 - cy) / cy <= 1.03)), S); });
// largura exata para as peças encaixarem sem fresta: parede = 64 px (uma aresta do losango), piso = 128 px (o losango inteiro); estica por vizinho mais próximo (1 ou 2 colunas repetidas)
function largura(im, w2) { const o = new Uint8Array(w2 * im.h * 4); for (let y = 0; y < im.h; y++) for (let x = 0; x < w2; x++) { const u = Math.min(im.w - 1, Math.floor((x + .5) * im.w / w2)); o.set(im.o.subarray((y * im.w + u) * 4, (y * im.w + u) * 4 + 4), (y * w2 + x) * 4); } return { w: w2, h: im.h, o }; }
for (const n of Object.keys(pecas)) { if (n.startsWith('parede')) pecas[n] = largura(pecas[n], 64); else if (n.startsWith('piso')) pecas[n] = largura(pecas[n], 128); }
// inclinação exata de 2:1 (o Gemini desenha ~0,45): sem isso cada pedaço de parede desce 3 px a menos que a aresta do losango e a emenda faz degrau
function cisalha(im, sinal) { const topo = x => { for (let y = 0; y < im.h; y++) if (im.o[(y * im.w + x) * 4 + 3]) return y; return 0; };
  const m = (topo(im.w - 3) - topo(2)) / (im.w - 5), k = sinal * .5 - m, dys = Array.from({ length: im.w }, (_, x) => Math.round((x - 2) * k)), mn = Math.min(...dys), mx = Math.max(...dys), h2 = im.h + mx - mn, o = new Uint8Array(im.w * h2 * 4);
  for (let x = 0; x < im.w; x++) for (let y = 0; y < im.h; y++) { const q = ((y + dys[x] - mn) * im.w + x) * 4; o.set(im.o.subarray((y * im.w + x) * 4, (y * im.w + x) * 4 + 4), q); } return { w: im.w, h: h2, o }; }
pecas.parede_se = cisalha(pecas.parede_se, 1); pecas.parede_sw = cisalha(pecas.parede_sw, -1);
// pontas cheias: repete a coluna 2 (e a w-3) nas 2 colunas de cada ponta, só onde a coluna vizinha tem pixel; assim dois pedaços lado a lado se tocam sem fresta
for (const n of ['parede_se', 'parede_sw']) { const im = pecas[n], W2 = im.w;
  for (const [from, to] of [[2, [1, 0]], [W2 - 3, [W2 - 2, W2 - 1]]]) for (const x of to) for (let y = 0; y < im.h; y++) { if (im.o[(y * W2 + from) * 4 + 3]) im.o.set(im.o.subarray((y * W2 + from) * 4, (y * W2 + from) * 4 + 4), (y * W2 + x) * 4); } }
// o canto do Gemini sobra ~35 px acima da parede: tira 2 camadas de toras (25 linhas = 2 períodos do padrão) do meio, para ficar só um pouco mais alto que a parede
{ const c = pecas.canto, corte0 = +process.env.CANTO_CORTE0 || 40, n = +process.env.CANTO_CORTE || 25, h2 = c.h - n, o = new Uint8Array(c.w * h2 * 4); for (let y = 0; y < h2; y++) { const sy = y < corte0 ? y : y + n; o.set(c.o.subarray(sy * c.w * 4, (sy + 1) * c.w * 4), y * c.w * 4); } pecas.canto = { w: c.w, h: h2, o }; }
// paleta única (mediana de cor) para dar coerência
function paleta(px, n) { let cx = [px]; while (cx.length < n) { cx.sort((a, b) => b.length - a.length); const b = cx.shift(); if (b.length < 2) { cx.push(b); break; } const rg = [0, 1, 2].map(k => Math.max(...b.map(p => p[k])) - Math.min(...b.map(p => p[k]))), k = rg.indexOf(Math.max(...rg)); b.sort((p, q) => p[k] - q[k]); cx.push(b.slice(0, b.length >> 1), b.slice(b.length >> 1)); } return cx.map(b => [0, 1, 2].map(k => Math.round(b.reduce((s, p) => s + p[k], 0) / b.length))); }
const todos = []; for (const im of Object.values(pecas)) for (let i = 0; i < im.w * im.h; i++) if (im.o[i * 4 + 3]) todos.push([im.o[i * 4], im.o[i * 4 + 1], im.o[i * 4 + 2]]);
const PAL = paleta(todos, +process.env.CORES || 28);
const info = {}; fs.mkdirSync('./arte_casa/pecas', { recursive: true });
for (const [nome, im] of Object.entries(pecas)) { for (let i = 0; i < im.w * im.h; i++) if (im.o[i * 4 + 3]) { const c = [im.o[i * 4], im.o[i * 4 + 1], im.o[i * 4 + 2]]; let b = PAL[0], e = 1e9; for (const q of PAL) { const d = (q[0] - c[0]) ** 2 + (q[1] - c[1]) ** 2 + (q[2] - c[2]) ** 2; if (d < e) { e = d; b = q; } } im.o.set(b, i * 4); }
  fs.writeFileSync('./arte_casa/pecas/' + nome + '.png', encodePNG(im.w, im.h, im.o));
  // ponto de apoio: parede = pixel mais baixo da coluna da esquerda (início da linha de base); canto = meio da base; piso = ponta de cima
  let ax = 0, ay = 0; if (nome.startsWith('parede')) { let y = im.h - 1; while (y > 0 && !im.o[(y * im.w + 2) * 4 + 3]) y--; ay = y; ax = 2; } else if (nome === 'canto') { ax = Math.round(im.w / 2); ay = im.h - 1; }
  if (nome.startsWith('parede') || nome === 'canto') ay -= 4;   // assenta 4 px abaixo (ver NOTAS)
  info[nome] = { w: im.w, h: im.h, ax, ay }; console.log(nome, im.w + 'x' + im.h, 'apoio', ax, ay); }
fs.writeFileSync('./arte_casa/pecas.json', JSON.stringify(info));
