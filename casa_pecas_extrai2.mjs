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
function recorta(pasta, nome, X0, Y0, w, h, ax, ay) {
  const d = new Uint8Array(w * h * 4); let n = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = ((Y0 + y) * P.w + X0 + x) * 4, j = (y * w + x) * 4; if (!P.data[i + 3]) continue; d[j] = P.data[i]; d[j + 1] = P.data[i + 1]; d[j + 2] = P.data[i + 2]; d[j + 3] = 255; n++; }
  if (n < 30) throw new Error('peça vazia: ' + nome + ' (a folha mudou de lugar?)');
  const png = Buffer.from(encodePNG(w, h, d)); saida[nome] = { src: 'data:image/png;base64,' + png.toString('base64'), w, h, ax, ay };
  fs.mkdirSync(DIR + '/' + pasta, { recursive: true }); fs.writeFileSync(DIR + '/' + pasta + '/' + nome + '.png', png); (grupo[pasta] ||= []).push({ nome, w, h, d });
}
// [pasta, nome, x, y, largura, altura, ax, ay]
const L = [];
const add = (pasta, nome, x, y, w, h, ax, ay) => L.push([pasta, nome, x, y, w, h, ax, ay]);
// 1) paredes retas: alta (A), média (M), média com o pedaço alto no começo (C)
add('1_paredes', 'x_A', 3, 3, 62, 123, -1, 92); add('1_paredes', 'y_A', 71, 3, 62, 123, 63, 92);
add('1_paredes', 'x_M', 142, 68, 62, 57, -1, 26); add('1_paredes', 'y_M', 206, 68, 62, 57, 63, 26);
add('1_paredes', 'x_C', 282, 2, 62, 123, -1, 92); add('1_paredes', 'y_C', 358, 2, 62, 123, 63, 92);
// 2) colunas dos vértices (4 altas, 4 médias): ^ (RD), simétrica (O: V, T, cruz), < (RU), > (LD)
for (const [t, x] of [['RD', 447], ['O', 464], ['RU', 487], ['LD', 511]]) { add('2_colunas', 'C_' + t + '_A', x, t === 'RD' ? 7 : t === 'O' ? 8 : 9, 10, 97, 5, 95); add('2_colunas', 'C_' + t + '_M', x, t === 'O' || t === 'RU' ? 112 : 111, 10, 31, 5, 29); }
// 3) porta alta: quadro de 1 (fechada) a 5 (aberta); ↙ (y) linha de cima, ↘ (x) linha de baixo
add('3_porta_alta', 'x_DA', 2, 129, 62, 123, -1, 92); add('3_porta_alta', 'y_DA', 68, 129, 62, 123, 63, 92);
[13, 89, 165, 241, 317].forEach((X, k) => add('3_porta_alta', 'y_DA_f' + (k + 1), X, 276, 62, 123, 63, 92));
[[10, 403], [87, 410], [163, 410], [239, 410], [315, 410]].forEach(([X, Y], k) => add('3_porta_alta', 'x_DA_f' + (k + 1), X, Y, 62, 123, -1, 92));
// 4) porta média animada (a porta vira média quando o personagem está na sala): _DMP_f1 = inteira; _DMP_f2..5 = folha com o batente do fim; _DMJ = batente do começo (igual nos quadros 2..5)
add('4_porta_media', 'y_DMP_f1', 447, 345, 62, 57, 63, 26); add('4_porta_media', 'x_DMP_f1', 443, 474, 62, 57, -1, 26);
[[523, 352, 43, 50, 19], [599, 356, 36, 46, 15], [675, 362, 24, 40, 9], [751, 368, 16, 34, 3]].forEach(([X, Y, w, h, ay], k) => add('4_porta_media', 'y_DMP_f' + (k + 2), X, Y, w, h, 63, ay));
[[539, 481, 43, 50, -20, 19], [622, 485, 36, 46, -27, 15], [710, 491, 24, 40, -39, 9], [794, 497, 16, 34, -47, 3]].forEach(([X, Y, w, h, ax, ay], k) => add('4_porta_media', 'x_DMP_f' + (k + 2), X, Y, w, h, ax, ay));
add('4_porta_media', 'y_DMJ', 567, 345, 18, 35, 19, 26); add('4_porta_media', 'x_DMJ', 520, 474, 18, 35, -1, 26);
// 5) porta média que começa encostada numa parede alta: _DMT_f1 = inteira com a perna alta; _DMTJ = perna alta (substitui o batente do começo); os quadros 2..5 da folha são os de 4_porta_media
add('5_porta_media_perna_alta', 'y_DMT_f1', 904, 262, 62, 123, 63, 92); add('5_porta_media_perna_alta', 'x_DMT_f1', 913, 417, 62, 123, -1, 92);
add('5_porta_media_perna_alta', 'y_DMTJ', 1024, 262, 18, 101, 19, 92); add('5_porta_media_perna_alta', 'x_DMTJ', 990, 417, 18, 101, -1, 92);
// 6) peças da folha sem uso no jogo ainda (o dono não explicou): 2º par de batentes (16x34) e as duas pernas altas soltas (18x101)
add('6_sem_uso', 'x_DM2', 188, 219, 16, 34, -47, 3); add('6_sem_uso', 'y_DM2', 218, 219, 16, 34, 63, 3);
add('6_sem_uso', 'x_DM1', 142, 196, 18, 35, -1, 26); add('6_sem_uso', 'y_DM1', 262, 196, 18, 35, 19, 26);
add('6_sem_uso', 'batente_b1', 332, 221, 16, 34, 0, 0); add('6_sem_uso', 'batente_b2', 362, 221, 16, 34, 0, 0);
add('6_sem_uso', 'perna_alta_1', 282, 129, 18, 101, 0, 0); add('6_sem_uso', 'perna_alta_2', 406, 132, 18, 101, 0, 0);
for (const a of L) recorta(...a);
// folha de conferência por pasta (peças lado a lado sobre fundo cinza, 1x) para abrir no editor
for (const [pasta, ps] of Object.entries(grupo)) {
  const FW = ps.reduce((s, p) => s + p.w + 8, 8), FH = Math.max(...ps.map(p => p.h)) + 16, f = new Uint8Array(FW * FH * 4); let cx = 8;
  for (const p of ps) { for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) { const i = (y * p.w + x) * 4, j = ((8 + y) * FW + cx + x) * 4; if (p.d[i + 3]) for (let c = 0; c < 4; c++) f[j + c] = p.d[i + c]; } cx += p.w + 8; }
  fs.writeFileSync(DIR + '/' + pasta + '/_folha.png', encodePNG(FW, FH, f)); }
fs.writeFileSync('casa_pecas_dados.js', '// gerado por casa_pecas_extrai2.mjs a partir da folha final do dono (arte_casa/casa/casa_folha_final.png): não editar à mão\nconst PECAS = ' + JSON.stringify(saida) + ';\n');
console.log(Object.keys(saida).length, 'peças;', Object.entries(grupo).map(([k, v]) => k + ' ' + v.length).join(' | '));
