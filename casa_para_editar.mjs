// Monta UMA folha PNG com os MÓDULOS da cabana para abrir no editor-pixel, desenhar à mão e exportar.
// Módulos: tora (o bastão que o dono desenhou, 69x41, com as pontas redondas; a parede é a tora empilhada com passo 9) e piso. A ponta redonda é parte da tora, não é peça separada.
// Cada módulo fica num quadro com o contexto em volta (as vizinhas repetidas, para ver como emenda). A moldura MAGENTA marca o módulo de verdade:
// só o que está DENTRO da moldura vale; o contexto em volta é só para olhar. Depois de exportar: node casa_aplicar_edicoes.mjs <png exportado>
// Saída: arte_casa/editadas/folha_para_editar.png, folha_layout.json e uma cópia em Downloads/casa_para_editar.png
import fs from 'node:fs';
import os from 'node:os';
import { decodePNG } from './pngdec.mjs';
import { encodePNG } from './pngenc.mjs';
const MOD = './arte_casa/modulos/', OUT = './arte_casa/editadas/', LARG = 520;
fs.mkdirSync(OUT, { recursive: true });
const ler = f => decodePNG(f), mod = (a, m) => ((a % m) + m) % m;
const itens = [
  { nome: 'tora', im: ler(MOD + 'tora.png'), mx: 40, my: 40 },
  { nome: 'piso', im: ler('./arte_casa/pecas/piso_1.png'), mx: 30, my: 34 },
];
const tora = itens[0].im, piso = itens[1].im;
const px = (im, x, y) => { if (x < 0 || y < 0 || x >= im.w || y >= im.h) return null; const p = (y * im.w + x) * 4; return im.data[p + 3] ? [im.data[p], im.data[p + 1], im.data[p + 2]] : null; };
// contexto: cor na posição (x,y) relativa ao módulo, fora dele. A parede é a tora empilhada (passo 9 para baixo); o pedaço seguinte começa 64 px à direita e 32 abaixo (a tora seguinte da mesma fila)
const CTX = {
  tora: (x, y) => { for (const [ox, oy] of [[0, 9], [0, -9], [0, 18], [0, -18], [0, 27], [0, -27], [64, 32], [-64, -32], [64, 41], [-64, -23], [64, 23], [-64, -41]]) { const c = px(tora, x - ox, y - oy); if (c) return c; } return null; },
  piso: (x, y) => { for (const [ox, oy] of [[-64, -32], [64, -32], [-64, 32], [64, 32], [0, -64], [0, 64], [-128, 0], [128, 0]]) { const c = px(piso, x - ox, y - oy); if (c) return c; } return null; },
};
let x = 0, y = 0, rh = 0; const lay = {};
for (const it of itens) { const w = it.im.w + 2 * it.mx + 2, h = it.im.h + 2 * it.my + 2; if (x + w > LARG) { x = 0; y += rh + 4; rh = 0; } lay[it.nome] = { x, y, w, h, ix: x + it.mx + 1, iy: y + it.my + 1, iw: it.im.w, ih: it.im.h }; x += w + 4; rh = Math.max(rh, h); }
const H = y + rh, out = new Uint8Array(LARG * H * 4), put = (X, Y, c) => out.set([c[0], c[1], c[2], 255], (Y * LARG + X) * 4);
for (const it of itens) { const L = lay[it.nome];
  for (let j = 0; j < L.h; j++) for (let i = 0; i < L.w; i++) { const rx = L.x + i - L.ix, ry = L.y + j - L.iy, dentro = rx >= 0 && ry >= 0 && rx < L.iw && ry < L.ih, borda = ((rx === -1 || rx === L.iw) && ry >= -1 && ry <= L.ih) || ((ry === -1 || ry === L.ih) && rx >= -1 && rx <= L.iw);
    let c = dentro ? px(it.im, rx, ry) : CTX[it.nome](rx, ry); if (borda) c = [255, 0, 255]; if (c) put(L.x + i, L.y + j, c); } }
fs.writeFileSync(OUT + 'folha_para_editar.png', encodePNG(LARG, H, out));
fs.writeFileSync(OUT + 'folha_layout.json', JSON.stringify({ largura: LARG, altura: H, itens: lay }, null, 1));
const dl = os.homedir() + '/Downloads/casa_para_editar.png'; fs.copyFileSync(OUT + 'folha_para_editar.png', dl);
console.log('folha ' + LARG + 'x' + H + ' com ' + itens.length + ' módulos → ' + dl);
