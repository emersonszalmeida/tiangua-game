// Monta UMA folha PNG com todas as árvores/arbustos atuais (arvore/*.png), cada um no seu quadro com margem,
// para abrir no editor-pixel (Abrir PNG), editar à mão e exportar. Depois: node arvores_aplicar_edicoes.mjs <png exportado>
// Saída: arvore_editadas/folha_para_editar.png, arvore_editadas/folha_layout.json e uma cópia em Downloads/arvores_para_editar.png
import fs from 'node:fs';
import os from 'node:os';
import { decodePNG } from './pngdec.mjs';
import { encodePNG } from './pngenc.mjs';
const path = u => new URL(u, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const DIR = path('./arvore/'), OUT = path('./arvore_editadas/'), M = 12, LARG = 900;   // M = margem do quadro (dá espaço para desenhar um pouco além da peça)
fs.mkdirSync(OUT, { recursive: true });
const nomes = fs.readdirSync(DIR).filter(f => f.endsWith('.png') && !f.startsWith('_')).map(f => f.slice(0, -4));
nomes.sort((a, b) => (b.startsWith('arvore_') - a.startsWith('arvore_')) || a.localeCompare(b));
const ims = Object.fromEntries(nomes.map(n => [n, decodePNG(DIR + n + '.png')]));
// prateleiras: cada quadro = peça + margem dos 4 lados
let x = 0, y = 0, rh = 0; const lay = {};
for (const n of nomes) { const { w, h } = ims[n], cw = w + 2 * M, ch = h + 2 * M; if (x + cw > LARG) { x = 0; y += rh; rh = 0; } lay[n] = { x, y, w: cw, h: ch, ix: x + M, iy: y + M, iw: w, ih: h }; x += cw; rh = Math.max(rh, ch); }
const H = y + rh, out = new Uint8Array(LARG * H * 4);
for (const n of nomes) { const { w, h, data } = ims[n], L = lay[n]; for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) out.set(data.subarray((j * w + i) * 4, (j * w + i) * 4 + 4), ((L.iy + j) * LARG + L.ix + i) * 4); }
fs.writeFileSync(OUT + 'folha_para_editar.png', encodePNG(LARG, H, out));
fs.writeFileSync(OUT + 'folha_layout.json', JSON.stringify({ largura: LARG, altura: H, margem: M, itens: lay }, null, 1));
const dl = os.homedir() + '/Downloads/arvores_para_editar.png'; fs.copyFileSync(OUT + 'folha_para_editar.png', dl);
console.log('folha ' + LARG + 'x' + H + ' com ' + nomes.length + ' peças → ' + dl);
