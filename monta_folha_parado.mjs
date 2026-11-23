// Junta as camadas do SW parado numa folha para editar (e separa de volta com --separa).
// Uso: node monta_folha_parado.mjs  |  node monta_folha_parado.mjs --separa folha_editada.png
import fs from 'node:fs'; import { encodePNG } from './pngenc.mjs'; import { decodePNG } from './pngdec.mjs';
const PARTES = ['contorno', 'pele', 'cabelo', 'camiseta', 'calca', 'sapato'], G = 4, dir = 'parado_sw_editar', V = process.argv.includes('--separa');
const P = PARTES.map(p => decodePNG(`personagem_camadas/${p}/parado/SW.png`)), W0 = P[0].w, H0 = P[0].h;
const n = PARTES.length + 1, W = n * (W0 + G) + G, H = H0 + 2 * G; // 1ª célula = composto (referência), depois cada parte
if (V) {
  const S = decodePNG(process.argv[process.argv.indexOf('--separa') + 1]);
  PARTES.forEach((p, i) => { const b = new Uint8Array(W0 * H0 * 4), ox = G + (i + 1) * (W0 + G); for (let y = 0; y < H0; y++) for (let x = 0; x < W0; x++) { const s = ((G + y) * S.w + ox + x) * 4, d = (y * W0 + x) * 4; if (S.data[s + 3] && !(S.data[s] === 0xb4 && S.data[s + 1] === 0xad && S.data[s + 2] === 0xa2)) b.set(S.data.slice(s, s + 4), d); }
    fs.mkdirSync(dir + '/separadas', { recursive: true }); fs.writeFileSync(`${dir}/separadas/${p}.png`, encodePNG(W0, H0, b)); });
  console.log('separadas em', dir + '/separadas'); process.exit();
}
const b = new Uint8Array(W * H * 4); for (let i = 0; i < W * H; i++) b.set([0xb4, 0xad, 0xa2, 255], i * 4);
const poe = (I, c) => { for (let y = 0; y < H0; y++) for (let x = 0; x < W0; x++) { const s = (y * W0 + x) * 4; if (!I.data[s + 3]) continue; const d = ((G + y) * W + G + c * (W0 + G) + x) * 4; b.set(I.data.slice(s, s + 4), d); } };
// composto: sapato, calça, camiseta, pele, cabelo, contorno por cima (ordem aproximada)
for (const p of ['sapato', 'calca', 'camiseta', 'pele', 'cabelo', 'contorno']) poe(P[PARTES.indexOf(p)], 0);
PARTES.forEach((p, i) => poe(P[i], i + 1));
fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(dir + '/folha_parado_SW.png', encodePNG(W, H, b));
fs.writeFileSync(dir + '/LEIA-ME.txt', `Folha do personagem parado, vista SW. Cada celula ${W0}x${H0}, espacamento ${G}px, fundo cinza. Da esquerda para a direita: composto (so referencia, nao e usado), ${PARTES.join(', ')}.\r\nPara separar de volta: node monta_folha_parado.mjs --separa <folha editada>.png\r\n`);
console.log(W + 'x' + H, 'celula', W0 + 'x' + H0);
