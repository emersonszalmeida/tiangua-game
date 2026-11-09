// Parede e canto da cabana MONTADOS A PARTIR DE UMA TORA SÓ (ideia do dono): desenha-se uma tora bem feita (comprimento = 1 aresta do losango = 64 px,
// repete sem emenda) e a parede é essa tora empilhada; o canto é uma camada de pontas de toras empilhada. As cores são as do Gemini (arte_casa/pecas/pisoG... e parede do Gemini).
// uso: node casa_do_gemini.mjs && node casa_toras.mjs    (esta etapa sobrescreve parede_se, parede_sw e canto)   N=7 toras de altura por padrão
import fs from 'node:fs';
import { decodePNG } from './pngdec.mjs';
import { encodePNG } from './pngenc.mjs';
const D = './arte_casa/pecas/', N = +process.env.N || 7, P = 12, W = 64;   // N toras, cada uma com 12 linhas de altura, 64 de comprimento
// rampa de cores = cores reais da parede do Gemini (escuras → claras), do arquivo antes de sobrescrever
const src = fs.existsSync(D + 'parede_gemini.png') ? decodePNG(D + 'parede_gemini.png') : decodePNG(D + 'parede_se.png');
if (!fs.existsSync(D + 'parede_gemini.png')) fs.copyFileSync(D + 'parede_se.png', D + 'parede_gemini.png');
const cnt = new Map(); for (let i = 0; i < src.w * src.h; i++) if (src.data[i * 4 + 3]) { const k = [src.data[i * 4], src.data[i * 4 + 1], src.data[i * 4 + 2]].join(); cnt.set(k, (cnt.get(k) || 0) + 1); }
const lum = c => .3 * c[0] + .59 * c[1] + .11 * c[2], cores = [...cnt.entries()].map(([k, n]) => ({ c: k.split(',').map(Number), n })).sort((a, b) => lum(a.c) - lum(b.c));
const perto = (r, g, b) => { let bst = cores[0].c, e = 1e9; for (const { c } of cores) { const d = (c[0] - r) ** 2 + (c[1] - g) ** 2 + (c[2] - b) ** 2; if (d < e) { e = d; bst = c; } } return bst; };
const R = { borda: perto(66, 44, 33), escuro: perto(82, 55, 39), sombra: perto(99, 74, 59), meioEsc: perto(112, 86, 66), meio: perto(128, 101, 79), luz: perto(143, 117, 95), brilho: perto(156, 128, 104) };
const RAMPA = [R.borda, R.escuro, R.sombra, R.meioEsc, R.meio, R.luz, R.brilho];   // índice 0..6
const hash = (a, b) => { let h = (Math.imul(a + 7, 374761393) + Math.imul(b + 13, 668265263)) >>> 0; h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const mod = (a, m) => ((a % m) + m) % m;
// ruído periódico no comprimento (período 64): sem emenda entre dois pedaços de parede
const ruido = (x, y, esc, sd) => { const gx = x / esc, x0 = Math.floor(gx), f = gx - x0, s = f * f * (3 - 2 * f), n = Math.round(W / esc), a = hash(mod(x0, n), y + sd * 97), b = hash(mod(x0 + 1, n), y + sd * 97); return a * (1 - s) + b * s; };
// perfil de uma tora (12 linhas): linha 0 = vão escuro entre toras; luz em cima, sombra embaixo
const PERFIL = [0, 5, 6, 5, 5, 4, 4, 3, 3, 2, 2, 1];   // índice da rampa por linha
function tora(x, y, j) {   // pixel (índice da rampa) da tora j na coluna x, linha y (0..11)
  const xs = mod(x + j * 21, W);   // cada tora usa o mesmo desenho, deslocado no comprimento (o desenho é periódico)
  let i = PERFIL[y];
  const veio = ruido(xs, y, 5, 1) + ruido(xs, y, 2, 2) * .4;           // veios longos horizontais
  if (y >= 2 && y <= 10) { if (veio > 1.02) i -= 1; else if (veio < .38) i += 1; }
  if (y >= 2 && y <= 9 && hash(Math.floor(xs / 7), y * 3 + 1) > .965) i -= 2;       // rachadura curta escura
  const nodoX = mod(18 + j * 29, W); if (Math.abs(xs - nodoX) < 3 && y >= 4 && y <= 8 && (Math.abs(xs - nodoX) + Math.abs(y - 6)) <= 3) i = (Math.abs(xs - nodoX) + Math.abs(y - 6)) <= 1 ? 1 : 2;   // um nó pequeno
  return Math.max(0, Math.min(6, i));
}
// tampa da parede (face de cima, mais clara), 5 linhas
const CAPA = [0, 6, 6, 5, 3];
// MÓDULOS desenháveis (a folha do editor, casa_para_editar.mjs): tora, capa, canto_topo, canto_camada, canto_base. Se existir arte_casa/editadas/<nome>.png (desenho do dono), vale ele.
const EDIT = './arte_casa/editadas/', ed = n => fs.existsSync(EDIT + n + '.png') ? decodePNG(EDIT + n + '.png') : null;
const E_TORA = ed('tora'), E_CAPA = ed('capa');
const pxIm = (im, x, y) => { const p = (y * im.w + x) * 4; return im.data[p + 3] ? [im.data[p], im.data[p + 1], im.data[p + 2]] : R.borda; };
function corTora(x, y, j) { return E_TORA ? pxIm(E_TORA, mod(x + j * 21, W), y) : RAMPA[tora(x, y, j)]; }   // a mesma tora, deslocada no comprimento a cada camada (o desenho é periódico)
function corCapa(x, y) { if (E_CAPA) return pxIm(E_CAPA, x, y); let i = CAPA[y]; const t = ruido(mod(x + 10, W), y, 6, 5); if (y === 1 || y === 2) i += t > .62 ? -1 : 0; return RAMPA[Math.max(0, Math.min(6, i))]; }
function parede(sinal) {
  const Hr = CAPA.length + N * P, M = W, tot = Hr + 32, o = new Uint8Array(M * tot * 4);
  const dy = x => sinal > 0 ? (x + 1) >> 1 : 32 - ((x + 1) >> 1);   // degrau de 2:1 em pares de colunas; as duas pontas casam com a do vizinho
  for (let x = 0; x < M; x++) for (let y = 0; y < Hr; y++) { const c = y < CAPA.length ? corCapa(x, y) : corTora(x, (y - CAPA.length) % P, Math.floor((y - CAPA.length) / P)); o.set([c[0], c[1], c[2], 255], ((y + dy(x)) * M + x) * 4); }
  return { w: M, h: tot, o, baseY: Hr - 1 + dy(0) };
}
// CANTO: topo + camada x Nc + base. Os 3 pedaços vêm do canto do Gemini (cantoG.png, escala em que cada camada tem 12 linhas = passo das toras) ou do desenho do dono.
const rec = (im, y0, y1) => ({ w: im.w, h: y1 - y0, data: im.data.slice(y0 * im.w * 4, y1 * im.w * 4) });
function partesCanto() {
  const G = decodePNG(D + 'cantoG.png'), w = G.w, h = G.h, dif = (y1, y2) => { let e = 0; for (let x = 0; x < w * 4; x++) if (x % 4 !== 3) e += Math.abs(G.data[y1 * w * 4 + x] - G.data[y2 * w * 4 + x]); return e; };
  let a0 = 14, melhor = 1e18; for (let a = 14; a <= 34; a++) { let e = 0; for (let i = 0; i < P; i++) e += dif(a + i, a + P + i); if (e < melhor) { melhor = e; a0 = a; } }
  const m = Math.floor((h - a0) / P) - 1;
  return { topo: ed('canto_topo') || rec(G, 0, a0), camada: ed('canto_camada') || rec(G, a0, a0 + P), base: ed('canto_base') || rec(G, a0 + P * m, h), geradas: { topo: rec(G, 0, a0), camada: rec(G, a0, a0 + P), base: rec(G, a0 + P * m, h) } };
}
function canto() {
  const { topo, camada, base } = partesCanto(), w = topo.w, Hw = CAPA.length + N * P, Nc = Math.max(1, Math.round((Hw + 4 - topo.h - base.h) / P)), H = topo.h + Nc * camada.h + base.h, o = new Uint8Array(w * H * 4);
  let y = 0; const cola = im => { o.set(im.data, y * w * 4); y += im.h; }; cola(topo); for (let k = 0; k < Nc; k++) cola(camada); cola(base);
  console.log('canto: topo', topo.h, 'linhas, camada', camada.h, 'x', Nc, ', base', base.h, '→ altura', H, '(parede', Hw + ')');
  return { w, h: H, o, baseX: Math.round(w / 2), baseY: H - 1 };
}
// grava os módulos como estão agora (ponto de partida da folha do editor)
fs.mkdirSync('./arte_casa/modulos', { recursive: true });
{ const t = new Uint8Array(W * P * 4), c = new Uint8Array(W * CAPA.length * 4); for (let y = 0; y < P; y++) for (let x = 0; x < W; x++) { const k = corTora(x, y, 0); t.set([k[0], k[1], k[2], 255], (y * W + x) * 4); } for (let y = 0; y < CAPA.length; y++) for (let x = 0; x < W; x++) { const k = corCapa(x, y); c.set([k[0], k[1], k[2], 255], (y * W + x) * 4); }
  fs.writeFileSync('./arte_casa/modulos/tora.png', encodePNG(W, P, t)); fs.writeFileSync('./arte_casa/modulos/capa.png', encodePNG(W, CAPA.length, c));
  const pc = partesCanto().geradas; for (const [n, im] of Object.entries(pc)) fs.writeFileSync('./arte_casa/modulos/canto_' + n + '.png', encodePNG(im.w, im.h, im.data)); }
const info = JSON.parse(fs.readFileSync('./arte_casa/pecas.json', 'utf8'));
for (const [nome, im] of [['parede_se', parede(1)], ['parede_sw', parede(-1)], ['canto', canto()]]) { fs.writeFileSync(D + nome + '.png', encodePNG(im.w, im.h, im.o));
  info[nome] = nome === 'canto' ? { w: im.w, h: im.h, ax: im.baseX, ay: im.baseY } : { w: im.w, h: im.h, ax: 0, ay: im.baseY }; console.log(nome, im.w + 'x' + im.h, 'apoio', info[nome].ax, info[nome].ay); }
fs.writeFileSync('./arte_casa/pecas.json', JSON.stringify(info));
