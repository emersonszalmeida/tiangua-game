// Parede da cabana pelo CONCEITO DO DONO (desenho de 2026-11-09): uma TORA fina (cilindro de 9 px de altura, 64 de comprimento = 1 aresta do losango) empilhada
// N=8 vezes + tampa de 5 linhas = 77 px de parede (a altura que ele marcou com as linhas azuis). Nas pontas livres aparece a coluna de DISCOS (a ponta redonda das toras).
// Onde duas paredes se encontram não há poste: elas só se encostam. (A versão com canto grosso do Gemini ficou em casa_toras_v1_canto.mjs.)
// uso: node casa_do_gemini.mjs && node casa_piso.mjs && node casa_toras.mjs      N=9 node casa_toras.mjs deixa a parede mais alta
// Módulos desenháveis (folha do editor, casa_para_editar.mjs): tora, capa, disco. Se existir arte_casa/editadas/<nome>.png, vale o desenho do dono.
import fs from 'node:fs';
import { decodePNG } from './pngdec.mjs';
import { encodePNG } from './pngenc.mjs';
const D = './arte_casa/pecas/', EDIT = './arte_casa/editadas/', N = +process.env.N || 8, P = 9, W = 64, DW = 6;   // N toras de P=9 linhas; disco de ponta com DW=6 de largura
if (!fs.existsSync(D + 'parede_gemini.png')) fs.copyFileSync(D + 'parede_se.png', D + 'parede_gemini.png');
const src = decodePNG(D + 'parede_gemini.png'), cnt = new Map();
for (let i = 0; i < src.w * src.h; i++) if (src.data[i * 4 + 3]) { const k = [src.data[i * 4], src.data[i * 4 + 1], src.data[i * 4 + 2]].join(); cnt.set(k, (cnt.get(k) || 0) + 1); }
const lum = c => .3 * c[0] + .59 * c[1] + .11 * c[2], cores = [...cnt.keys()].map(k => k.split(',').map(Number)).sort((a, b) => lum(a) - lum(b));
const perto = (r, g, b) => { let bst = cores[0], e = 1e9; for (const c of cores) { const d = (c[0] - r) ** 2 + (c[1] - g) ** 2 + (c[2] - b) ** 2; if (d < e) { e = d; bst = c; } } return bst; };
const R = { borda: perto(66, 44, 33), escuro: perto(82, 55, 39), sombra: perto(99, 74, 59), meioEsc: perto(112, 86, 66), meio: perto(128, 101, 79), luz: perto(143, 117, 95), brilho: perto(156, 128, 104) };
const RAMPA = [R.borda, R.escuro, R.sombra, R.meioEsc, R.meio, R.luz, R.brilho];
const hash = (a, b) => { let h = (Math.imul(a + 7, 374761393) + Math.imul(b + 13, 668265263)) >>> 0; h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const mod = (a, m) => ((a % m) + m) % m;
const ruido = (x, y, esc, sd) => { const gx = x / esc, x0 = Math.floor(gx), f = gx - x0, s = f * f * (3 - 2 * f), n = Math.round(W / esc), a = hash(mod(x0, n), y + sd * 97), b = hash(mod(x0 + 1, n), y + sd * 97); return a * (1 - s) + b * s; };   // periódico em 64
const ed = n => fs.existsSync(EDIT + n + '.png') ? decodePNG(EDIT + n + '.png') : null, E_TORA = ed('tora'), E_CAPA = ed('capa'), E_DISCO = ed('disco');
const pxIm = (im, x, y) => { const p = (y * im.w + x) * 4; return im.data[p + 3] ? [im.data[p], im.data[p + 1], im.data[p + 2]] : R.borda; };
// tora fina: contorno escuro em cima e embaixo, corpo marrom com a parte de cima um pouco mais clara, veio fino
const PERFIL = [0, 5, 5, 4, 4, 3, 3, 2, 1];
function corTora(x, y, j) {
  if (E_TORA) return pxIm(E_TORA, mod(x + j * 21, W), y);
  const xs = mod(x + j * 21, W); let i = PERFIL[y]; const veio = ruido(xs, y, 6, 1);
  if (y >= 2 && y <= 7) { if (veio > .8) i -= 1; else if (veio < .2) i += 1; }
  if (y >= 2 && y <= 7 && hash(Math.floor(xs / 8), y * 3 + j) > .97) i -= 2;
  const nx = mod(14 + j * 29, W); if (xs === nx && y === 4) i = 1;   // um nó
  return RAMPA[Math.max(0, Math.min(6, i))];
}
const CAPA = [0, 6, 5, 4, 2];   // tampa: a face de cima da tora mais alta (linha clara) e a sombra da frente
function corCapa(x, y) { if (E_CAPA) return pxIm(E_CAPA, x, y); let i = CAPA[y]; if (y === 1 && ruido(mod(x + 10, W), y, 7, 5) > .62) i -= 1; return RAMPA[Math.max(0, Math.min(6, i))]; }
// disco: a ponta redonda de uma tora (6 de largura x 9 de altura): contorno, face clara em cima/esquerda, anel
const DISCO = ['.0000.', '012210', '021110', '011111', '011211', '011111', '012110', '001100', '.0000.'];   // 0 contorno, 1 face, 2 anel
function corDisco(x, y) {
  if (E_DISCO) { const p = (y * E_DISCO.w + x) * 4; return E_DISCO.data[p + 3] ? [E_DISCO.data[p], E_DISCO.data[p + 1], E_DISCO.data[p + 2]] : null; }
  const c = DISCO[y][x]; if (c === '.') return null; return c === '0' ? R.borda : c === '2' ? R.sombra : (x + y < 6 ? R.luz : R.meio);
}
const dy = (x, sinal) => sinal > 0 ? (x + 1) >> 1 : 32 - ((x + 1) >> 1);   // degrau 2:1 em pares de colunas (par ímpar->par: as pontas de dois pedaços casam)
function parede(sinal) {
  const Hr = CAPA.length + N * P, tot = Hr + 32, o = new Uint8Array(W * tot * 4);
  for (let x = 0; x < W; x++) for (let y = 0; y < Hr; y++) { const c = y < CAPA.length ? corCapa(x, y) : corTora(x, (y - CAPA.length) % P, Math.floor((y - CAPA.length) / P)); o.set([c[0], c[1], c[2], 255], ((y + dy(x, sinal)) * W + x) * 4); }
  return { w: W, h: tot, o, ax: 0, ay: Hr - 1 + dy(0, sinal) };
}
// ponta: coluna de N discos na ponta mais perto da câmera. "/" (sw): à esquerda do x=0; "\" (se): à direita do x=63. Mesma altura e mesma âncora da parede.
function ponta(sinal) {
  const Hr = CAPA.length + N * P, tot = Hr + 32, o = new Uint8Array(DW * tot * 4), x0 = sinal > 0 ? W - 1 : 0, off = dy(x0, sinal);
  for (let k = 0; k < N; k++) for (let y = 0; y < P; y++) for (let x = 0; x < DW; x++) { const c = corDisco(x, y); if (!c) continue; const yy = CAPA.length + k * P + y + off; o.set([c[0], c[1], c[2], 255], (yy * DW + x) * 4); }
  return { w: DW, h: tot, o, ax: sinal > 0 ? -W : DW, ay: Hr - 1 + dy(0, sinal) };   // ax: onde fica o canto esquerdo da ponta em relação ao ponto de apoio da parede
}
// módulos como estão agora (ponto de partida da folha do editor)
fs.mkdirSync('./arte_casa/modulos', { recursive: true });
{
  const mk = (w, h, f) => { const o = new Uint8Array(w * h * 4); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const c = f(x, y); if (c) o.set([c[0], c[1], c[2], 255], (y * w + x) * 4); } return o; };
  fs.writeFileSync('./arte_casa/modulos/tora.png', encodePNG(W, P, mk(W, P, (x, y) => corTora(x, y, 0))));
  fs.writeFileSync('./arte_casa/modulos/capa.png', encodePNG(W, CAPA.length, mk(W, CAPA.length, corCapa)));
  fs.writeFileSync('./arte_casa/modulos/disco.png', encodePNG(DW, P, mk(DW, P, corDisco)));
  for (const n of ['canto_topo', 'canto_camada', 'canto_base']) fs.rmSync('./arte_casa/modulos/' + n + '.png', { force: true });
}
const info = JSON.parse(fs.readFileSync('./arte_casa/pecas.json', 'utf8'));
for (const [nome, im] of [['parede_se', parede(1)], ['parede_sw', parede(-1)], ['ponta_se', ponta(1)], ['ponta_sw', ponta(-1)]]) {
  fs.writeFileSync(D + nome + '.png', encodePNG(im.w, im.h, im.o)); info[nome] = { w: im.w, h: im.h, ax: im.ax, ay: im.ay }; console.log(nome, im.w + 'x' + im.h, 'apoio', im.ax, im.ay);
}
fs.rmSync(D + 'canto.png', { force: true }); delete info.canto;
fs.writeFileSync('./arte_casa/pecas.json', JSON.stringify(info));
console.log('parede: tampa ' + CAPA.length + ' + ' + N + ' toras x ' + P + ' = ' + (CAPA.length + N * P) + ' px');
