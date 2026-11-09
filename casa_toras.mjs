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
function parede(sinal) {
  const Hr = CAPA.length + N * P, M = W, tot = Hr + 32, o = new Uint8Array(M * tot * 4);
  const dy = x => sinal > 0 ? (x + 1) >> 1 : 32 - ((x + 1) >> 1);   // degrau de 2:1 em pares de colunas; as duas pontas casam com a do vizinho
  for (let x = 0; x < M; x++) for (let y = 0; y < Hr; y++) { let i; if (y < CAPA.length) { i = CAPA[y]; const t = ruido(mod(x + 10, W), y, 6, 5); if (y === 1 || y === 2) i += t > .62 ? -1 : 0; } else { const k = Math.floor((y - CAPA.length) / P); i = tora(x, (y - CAPA.length) % P, k); }
    const c = RAMPA[Math.max(0, Math.min(6, i))], yy = y + dy(x); o.set([c[0], c[1], c[2], 255], (yy * M + x) * 4); }
  return { w: M, h: tot, o, baseY: Hr - 1 + dy(0) };
}
// CANTO: parte do canto do Gemini (cantoG.png, já na escala em que cada camada tem 12 linhas = passo das toras da parede). Uma camada do miolo é repetida:
// topo (tora de cima e as duas barras) + camada x Nc + base. Acha-se onde começa o padrão repetido comparando a camada com a seguinte.
function canto() {
  const G = decodePNG(D + 'cantoG.png'), w = G.w, h = G.h, linha = y => G.data.subarray(y * w * 4, (y + 1) * w * 4);
  const dif = (y1, y2) => { let e = 0; for (let x = 0; x < w * 4; x++) if (x % 4 !== 3) e += Math.abs(G.data[y1 * w * 4 + x] - G.data[y2 * w * 4 + x]); return e; };
  let a0 = 14, melhor = 1e18; for (let a = 14; a <= 34; a++) { let e = 0; for (let i = 0; i < P; i++) e += dif(a + i, a + P + i); if (e < melhor) { melhor = e; a0 = a; } }
  const m = Math.floor((h - a0) / P) - 1, B = h - a0 - P * m, Hw = CAPA.length + N * P, Nc = Math.max(1, Math.round((Hw + 4 - a0 - B) / P));
  const H = a0 + Nc * P + B, o = new Uint8Array(w * H * 4);
  let y = 0; const copia = (de, n) => { for (let i = 0; i < n; i++) { o.set(linha(de + i), (y + i) * w * 4); } y += n; };
  copia(0, a0); for (let k = 0; k < Nc; k++) copia(a0, P); copia(a0 + P * m, B);
  console.log('canto: topo', a0, 'linhas, camada', P, 'x', Nc, ', base', B, '→ altura', H, '(parede', Hw + ')');
  return { w, h: H, o, baseX: Math.round(w / 2), baseY: H - 1 };
}
const info = JSON.parse(fs.readFileSync('./arte_casa/pecas.json', 'utf8'));
for (const [nome, im] of [['parede_se', parede(1)], ['parede_sw', parede(-1)], ['canto', canto()]]) { fs.writeFileSync(D + nome + '.png', encodePNG(im.w, im.h, im.o));
  info[nome] = nome === 'canto' ? { w: im.w, h: im.h, ax: im.baseX, ay: im.baseY } : { w: im.w, h: im.h, ax: 0, ay: im.baseY }; console.log(nome, im.w + 'x' + im.h, 'apoio', info[nome].ax, info[nome].ay); }
fs.writeFileSync('./arte_casa/pecas.json', JSON.stringify(info));
