// ============================================================================================================
// EXTRATOR DAS PEÇAS DA CASA -> casa_pecas_dados.js (const PECAS, lido pelo chao.html) + uma PNG por peça em arte_casa/casa/pecas/<tipo>/
// Uso (na pasta do projeto):   node casa_pecas_extrai2.mjs            (lê arte_casa/casa/casa_folha_final.png)
// ÚNICA fonte: a folha final do dono (exportada do editor-pixel). Para mudar uma peça: ele redesenha, exporta a folha por cima desse arquivo, e este script regera tudo.
// Sistema de COLUNAS: só paredes soltas aparadas (62 px) + uma coluna por vértice; as paredes ↘ (x) começam no vértice e vão para a direita, as ↙ (y) começam no vértice e vão para a esquerda.
// Âncora (ax,ay) = ponto da peça que fica no vértice do piso; as posições (caixas exatas) são as da folha final de 2026-11-19.
// ============================================================================================================
import fs from 'node:fs';
import { decodePNG } from './pngdec.mjs';
import { encodePNG } from './pngenc.mjs';
const arq = process.argv[2] || 'arte_casa/casa/casa_folha_final.png', P = decodePNG(arq), saida = {}, DIR = 'arte_casa/casa/pecas';
fs.rmSync(DIR, { recursive: true, force: true });
const grupo = {};   // pasta -> [{nome,w,h,d}]
function recorta(pasta, nome, X0, Y0, w, h, ax, ay, bg) {
  const d = new Uint8Array(w * h * 4); let n = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = ((Y0 + y) * P.w + X0 + x) * 4, j = (y * w + x) * 4; if (bg(X0 + x, Y0 + y)) continue; d[j] = P.data[i]; d[j + 1] = P.data[i + 1]; d[j + 2] = P.data[i + 2]; d[j + 3] = 255; n++; }
  if (n < 30) throw new Error('peça vazia: ' + nome + ' (a folha mudou de lugar?)');
  const png = Buffer.from(encodePNG(w, h, d)); saida[nome] = { src: 'data:image/png;base64,' + png.toString('base64'), w, h, ax, ay };
  fs.mkdirSync(DIR + '/' + pasta, { recursive: true }); fs.writeFileSync(DIR + '/' + pasta + '/' + nome + '.png', png); (grupo[pasta] ||= []).push({ nome, w, h, d });
}
// A folha é uma GRADE de células (66 px de passo na horizontal, 127 na vertical; cada célula = 1 OBJETO, as partes dele sempre vão juntas), fundo azul (41,128,185) que vira transparente.
// Dentro da célula (interior de 64x125, origem em +1,+1 da borda) cada objeto fica no MESMO quadro, então a âncora é a mesma para todo o tipo:
//   quadro alto 62x123 em (1,1): âncora x -1,92 / y 63,92;  quadro médio 62x57 em (1,67): x -1,26 / y 63,26;  coluna alta 10x97 em (27,14) âncora 5,95;  coluna média 10x31 em (27,80) âncora 5,29.
const F123 = [1, 1, 62, 123], F57 = [1, 67, 62, 57], CA = [27, 14, 10, 97], CM = [27, 80, 10, 31];
const L = [];
// [pasta, nome, linha, coluna, quadro, ax, ay]
const add = (pasta, nome, r, c, q, ax, ay) => L.push([pasta, nome, r, c, q, ax, ay]);
const X = (pasta, nome, r, c, q, y) => add(pasta, nome, r, c, q, -1, q === F57 ? 26 : 92), Y = (pasta, nome, r, c, q) => add(pasta, nome, r, c, q, 63, q === F57 ? 26 : 92);
// 1) paredes retas: alta (A), média (M), média com o pedaço alto no começo (C)
X('1_paredes', 'x_A', 0, 0, F123); Y('1_paredes', 'y_A', 0, 1, F123); X('1_paredes', 'x_M', 0, 2, F57); Y('1_paredes', 'y_M', 0, 3, F57); X('1_paredes', 'x_C', 0, 4, F123); Y('1_paredes', 'y_C', 0, 5, F123);
// 2) colunas dos vértices (4 altas na linha 1, 4 médias na linha 2): ^ (RD), simétrica (O: V, T, cruz), < (RU), > (LD)
['RD', 'O', 'RU', 'LD'].forEach((t, k) => { add('2_colunas', 'C_' + t + '_A', 0, 6 + k, CA, 5, 95); add('2_colunas', 'C_' + t + '_M', 1, 6 + k, CM, 5, 29); });
// 3) porta alta: moldura vazia (linha 2) e os quadros 1 (fechada) a 5 (aberta); ↙ (y) linha 3, ↘ (x) linha 4
X('3_porta_alta', 'x_DA', 1, 0, F123); Y('3_porta_alta', 'y_DA', 1, 1, F123);
for (let k = 0; k < 5; k++) { Y('3_porta_alta', 'y_DA_f' + (k + 1), 2, k, F123); X('3_porta_alta', 'x_DA_f' + (k + 1), 3, k, F123); }
// 4) porta média animada (a porta da frente vira média com o personagem na sala): UM objeto por quadro (batentes + folha juntos); _DMB = só os batentes (= quadro 5)
X('4_porta_media', 'x_DMB', 1, 2, F57); Y('4_porta_media', 'y_DMB', 1, 3, F57);
for (let k = 0; k < 5; k++) { Y('4_porta_media', 'y_DMP_f' + (k + 1), 2, 5 + k, F57); X('4_porta_media', 'x_DMP_f' + (k + 1), 3, 5 + k, F57); }
// 5) porta média que começa encostada numa parede alta: o batente do começo vira a perna alta; _DMTB = só os batentes
X('5_porta_media_perna_alta', 'x_DMTB', 1, 4, F123); Y('5_porta_media_perna_alta', 'y_DMTB', 1, 5, F123);
for (let k = 0; k < 5; k++) { Y('5_porta_media_perna_alta', 'y_DMT_f' + (k + 1), 2, 10 + k, F123); X('5_porta_media_perna_alta', 'x_DMT_f' + (k + 1), 3, 10 + k, F123); }
const bg = (x, y) => { const i = (y * P.w + x) * 4; return !P.data[i + 3] || (P.data[i] === 41 && P.data[i + 1] === 128 && P.data[i + 2] === 185); };
for (const [pasta, nome, r, c, q, ax, ay] of L) {
  const X0 = 66 * c + 1, Y0 = 127 * r + 1; let [qx, qy, w, h] = q;
  if (q === F123 && r >= 2 && c >= 10) {   // objetos com perna alta: o topo da perna fica na linha 1 do quadro; se a célula estiver 1 px fora do lugar, acompanha (aviso)
    let top = 1e9; for (let y = 0; y < 125 && top === 1e9; y++) for (let x = nome[0] === 'x' ? 1 : 45; x < (nome[0] === 'x' ? 19 : 63); x++) if (!bg(X0 + x, Y0 + y)) { top = y; break; }
    if (top !== qy) { console.log('AVISO: ' + nome + ' está ' + (qy - top) + ' px fora do lugar na célula; corrigido na extração'); qy = top; } }
  recorta(pasta, nome, X0 + qx, Y0 + qy, w, h, ax, ay, bg);
}
// folha de conferência por pasta (peças lado a lado sobre fundo cinza, 1x) para abrir no editor
for (const [pasta, ps] of Object.entries(grupo)) {
  const FW = ps.reduce((s, p) => s + p.w + 8, 8), FH = Math.max(...ps.map(p => p.h)) + 16, f = new Uint8Array(FW * FH * 4); let cx = 8;
  for (const p of ps) { for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) { const i = (y * p.w + x) * 4, j = ((8 + y) * FW + cx + x) * 4; if (p.d[i + 3]) for (let c = 0; c < 4; c++) f[j + c] = p.d[i + c]; } cx += p.w + 8; }
  fs.writeFileSync(DIR + '/' + pasta + '/_folha.png', encodePNG(FW, FH, f)); }
fs.writeFileSync('casa_pecas_dados.js', '// gerado por casa_pecas_extrai2.mjs a partir da folha final do dono (arte_casa/casa/casa_folha_final.png): não editar à mão\nconst PECAS = ' + JSON.stringify(saida) + ';\n');
console.log(Object.keys(saida).length, 'peças;', Object.entries(grupo).map(([k, v]) => k + ' ' + v.length).join(' | '));
