// Parede da cabana pelo MODELO DO DONO (arte_casa/conceito_dono.png, desenho de 2026-11-09): a TORA é UMA peça só (bastão inclinado 2:1 com as duas pontas
// arredondadas, desenhado por ele) e a parede é essa tora empilhada com passo de 9 px. Nada de disco separado: a ponta redonda faz parte da tora.
// Só as CORES são do Claude: contorno vermelho -> marrom-escuro, faixa escura de baixo -> sombra, corpo -> marrom com luz em cima.
// A parede ↘ (parede_se) é a tora como ele desenhou; a ↙ (parede_sw) é a tora espelhada. Mesmo N de toras em todas.
// uso: node casa_piso.mjs && node casa_toras.mjs      N=9 node casa_toras.mjs deixa a parede mais alta
// Módulo desenhável (folha do editor, casa_para_editar.mjs): "tora" (já colorida). Se existir arte_casa/editadas/tora.png, vale o desenho/cores do dono.
import fs from 'node:fs';
import { decodePNG } from './pngdec.mjs';
import { encodePNG } from './pngenc.mjs';
const D = './arte_casa/pecas/', EDIT = './arte_casa/editadas/', N = +process.env.N || 8, PASSO = 9;
// cores da cabana (as do Gemini): do arquivo parede_gemini.png
if (!fs.existsSync(D + 'parede_gemini.png')) fs.copyFileSync(D + 'parede_se.png', D + 'parede_gemini.png');
const src = decodePNG(D + 'parede_gemini.png'), cnt = new Set();
for (let i = 0; i < src.w * src.h; i++) if (src.data[i * 4 + 3]) cnt.add([src.data[i * 4], src.data[i * 4 + 1], src.data[i * 4 + 2]].join());
const lum = c => .3 * c[0] + .59 * c[1] + .11 * c[2], cores = [...cnt].map(k => k.split(',').map(Number)).sort((a, b) => lum(a) - lum(b));
const perto = (r, g, b) => { let bst = cores[0], e = 1e9; for (const c of cores) { const d = (c[0] - r) ** 2 + (c[1] - g) ** 2 + (c[2] - b) ** 2; if (d < e) { e = d; bst = c; } } return bst; };
const R = { borda: perto(66, 44, 33), escuro: perto(82, 55, 39), sombra: perto(99, 74, 59), meioEsc: perto(112, 86, 66), meio: perto(128, 101, 79), luz: perto(143, 117, 95), brilho: perto(156, 128, 104) };
// 1) a tora do dono: o bastão solto no desenho (região x 226..300, y 132..180); papéis pelas cores do desenho dele
const dono = decodePNG('./arte_casa/conceito_dono.png'), X0 = 226, Y0 = 132, X1 = 300, Y1 = 180;
const PAPEL = { '192,57,43': 'A', '121,95,77': 'B', '81,57,44': 'H' };   // A contorno, B corpo, H faixa escura
let bx0 = 1e9, by0 = 1e9, bx1 = -1, by1 = -1; const papelBruto = (x, y) => { const p = (y * dono.w + x) * 4; return dono.data[p + 3] ? PAPEL[[dono.data[p], dono.data[p + 1], dono.data[p + 2]].join()] || null : null; };
// só a tora: preenche a partir de um pixel dela (260,150), assim não entra pedaço da parede/do chão que esteja na mesma região
const NA = new Set(), pilha = [[260, 150]]; while (pilha.length) { const [x, y] = pilha.pop(), k = x + ',' + y; if (NA.has(k) || x < X0 || x > X1 || y < Y0 || y > Y1 || !papelBruto(x, y)) continue; NA.add(k); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) pilha.push([x + dx, y + dy]); }
for (const k of NA) { const [x, y] = k.split(',').map(Number); bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x); by0 = Math.min(by0, y); by1 = Math.max(by1, y); }
const papel = (x, y) => NA.has(x + ',' + y) ? papelBruto(x, y) : null;
const RW = bx1 - bx0 + 1, RH = by1 - by0 + 1, ROLE = []; for (let y = 0; y < RH; y++) { ROLE.push([]); for (let x = 0; x < RW; x++) ROLE[y].push(papel(bx0 + x, by0 + y)); }
// 2) cores: regra por coluna (contorno de cima, 2 linhas de luz, corpo, faixa de sombra embaixo, contorno de baixo)
function colore() {
  const o = new Uint8Array(RW * RH * 4);
  for (let x = 0; x < RW; x++) { let top = -1; for (let y = 0; y < RH; y++) if (ROLE[y][x]) { top = y; break; } if (top < 0) continue; let bot = top; for (let y = top; y < RH; y++) if (ROLE[y][x]) bot = y;
    for (let y = top; y <= bot; y++) { const r = ROLE[y][x]; if (!r) continue; const d = y - top, corpoAlt = bot - top; let c;
      if (r === 'A') c = R.borda; else if (r === 'H') c = R.sombra; else c = d <= 2 ? R.luz : d <= 3 ? R.meio : (bot - y) <= 5 ? R.meioEsc : R.meio;
      o.set([c[0], c[1], c[2], 255], (y * RW + x) * 4); } }
  return o;
}
const E_TORA = fs.existsSync(EDIT + 'tora.png') ? decodePNG(EDIT + 'tora.png') : null;
const tora = E_TORA ? { w: E_TORA.w, h: E_TORA.h, o: E_TORA.data } : { w: RW, h: RH, o: colore() };
fs.mkdirSync('./arte_casa/modulos', { recursive: true });
fs.writeFileSync('./arte_casa/modulos/tora.png', encodePNG(RW, RH, colore()));   // ponto de partida da folha do editor (sempre a versão gerada)
for (const n of ['capa', 'disco', 'canto_topo', 'canto_camada', 'canto_base']) fs.rmSync('./arte_casa/modulos/' + n + '.png', { force: true });
// 3) empilha N toras (passo 9): as de baixo por cima das de cima (o contorno de baixo de uma coincide com o de cima da seguinte)
const espelha = im => { const o = new Uint8Array(im.w * im.h * 4); for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) o.set(im.o.subarray((y * im.w + x) * 4, (y * im.w + x) * 4 + 4), (y * im.w + (im.w - 1 - x)) * 4); return { w: im.w, h: im.h, o }; };
function empilha(t) { const h = t.h + (N - 1) * PASSO, o = new Uint8Array(t.w * h * 4);
  for (let k = 0; k < N; k++) for (let y = 0; y < t.h; y++) for (let x = 0; x < t.w; x++) { const p = (y * t.w + x) * 4; if (t.o[p + 3]) o.set(t.o.subarray(p, p + 4), ((y + k * PASSO) * t.w + x) * 4); }
  return { w: t.w, h, o }; }
// ponto de apoio: o pixel mais baixo da coluna xa da última tora (contorno de baixo) fica sobre a aresta do losango
const XA = 4;
function apoio(im) { let y = im.h - 1; while (y > 0 && !im.o[(y * im.w + XA) * 4 + 3]) y--; return { ax: XA, ay: y }; }
const info = JSON.parse(fs.readFileSync('./arte_casa/pecas.json', 'utf8'));
const se = empilha(tora), sw = espelha(se);
for (const [nome, im] of [['parede_se', se], ['parede_sw', sw]]) { fs.writeFileSync(D + nome + '.png', encodePNG(im.w, im.h, im.o)); const a = apoio(im); info[nome] = { w: im.w, h: im.h, ...a }; console.log(nome, im.w + 'x' + im.h, 'apoio', a.ax, a.ay); }
for (const n of ['ponta_se', 'ponta_sw', 'canto']) { fs.rmSync(D + n + '.png', { force: true }); delete info[n]; }
fs.writeFileSync('./arte_casa/pecas.json', JSON.stringify(info));
console.log('tora do dono: ' + RW + 'x' + RH + ' px · parede = ' + N + ' toras (passo ' + PASSO + ') · altura ' + (RH + (N - 1) * PASSO) + ' px (parede ↘ ' + se.h + ')');
