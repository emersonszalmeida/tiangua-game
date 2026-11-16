// Folha nova do dono (desenho (9).png): peças soltas em cima, montagens com piso embaixo. As montagens mostram o encaixe:
//   a parede ↘ (x) começa no vértice e vai para a direita; a parede ↙ (y) começa no vértice e vai para a esquerda.
//   Medido nas montagens: x_A tem o vértice a 1 px da borda esquerda e a parede y_A a 67 px; a base fica 33 px acima da borda de baixo da peça (ay = altura - 33).
// uso: node casa_pecas_extrai2.mjs "caminho/desenho (9).png"
import fs from 'node:fs';
import { decodePNG } from './pngdec.mjs';
import { encodePNG } from './pngenc.mjs';
const arq = process.argv[2], S = decodePNG(arq);
// peças da biblioteca: [x, y, largura, altura] na folha, e se é parede ↘ (x) ou ↙ (y)
const LIB = {
  // alta
  x_A: [67, 46, 68, 126, 'c', 1, 93], y_A: [137, 46, 68, 126, 'c', 67, 93],
  RD_AA: [207, 9, 134, 128, 'c', 67, 95], LU_AA: [343, 46, 130, 127, 'c', 65, 125], RU_AA: [475, 10, 72, 158, 'c', 5, 125], LD_AA: [617, 46, 72, 158, 'c', 67, 125],
  // média
  x_M: [67, 242, 68, 60, 'c', 1, 27], y_M: [137, 242, 68, 60, 'c', 67, 27],
  RD_MM: [207, 205, 134, 62, 'c', 67, 29], LU_MM: [343, 242, 130, 61, 'c', 65, 59], RU_MM: [475, 206, 72, 92, 'c', 5, 59], LD_MM: [613, 242, 72, 92, 'c', 67, 59],
  // porta alta (DA)
  x_DA: [72, 612, 68, 126, 'c', 1, 93], y_DA: [143, 612, 68, 126, 'c', 67, 93],
  // linha 3 (contornos) e porta em canto: ainda sem uso no jogo
  x_C: [65, 406, 68, 126, 'c', 1, 93], y_C: [135, 406, 68, 126, 'c', 67, 93], LU_CC: [273, 372, 126, 126, 'c', 63, 124], RU_CC: [470, 371, 72, 158, 'c', 5, 125], LD_CC: [608, 405, 72, 158, 'c', 67, 125],
  RU_PP: [286, 579, 72, 158, 'c', 5, 125], LD_PP: [366, 577, 72, 158, 'c', 67, 125] };
const saida = {};
for (const [nome, [x0, y0, w, h, eixo, cax, cay, filtro]] of Object.entries(LIB)) {
  const d = new Uint8Array(w * h * 4); let n = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = ((y0 + y) * S.w + (x0 + x)) * 4, j = (y * w + x) * 4; if (S.data[i + 3] === 0) continue; { const r = S.data[i], g = S.data[i + 1], bb = S.data[i + 2]; if (Math.max(r, g, bb) - Math.min(r, g, bb) > 110 && (r > 150 || g > 150 || bb > 150)) continue; }   /* cores de piso (verde, amarelo, laranja, azul, vermelho) não fazem parte da peça */ d[j] = S.data[i]; d[j + 1] = S.data[i + 1]; d[j + 2] = S.data[i + 2]; d[j + 3] = S.data[i + 3]; n++; }
  if (n < 200) throw new Error('peça vazia: ' + nome + ' (a folha mudou de lugar?)');
  saida[nome] = { src: 'data:image/png;base64,' + Buffer.from(encodePNG(w, h, d)).toString('base64'), w, h, ax: eixo === 'c' ? cax : eixo === 'x' ? 1 : 67, ay: eixo === 'c' ? cay : h - 33 };
  console.log(nome.padEnd(5), w + 'x' + h, 'âncora', saida[nome].ax + ',' + saida[nome].ay, 'pixels', n);
}
// cantos com PORTA na parede de trás (o dono mandou só um print ampliado 4x do editor: print_cantos_porta.png); amostra 1 pixel a cada 4, mesma caixa 72x158 e âncora do < e > altos
// LD_DAA: > com a parede L (↘ de trás) sendo porta; RU_ADA: < com a parede U (↙ de trás) sendo porta
{ const P = decodePNG('arte_casa/exportado_2026-11-16/print_cantos_porta.png');
  for (const [nome, X0, Y0, ax, ay] of [['LD_DAA', 254, 40, 67, 125], ['RU_ADA', 666, 48, 5, 125]]) {
    const w = 72, h = 158, d = new Uint8Array(w * h * 4); let n = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = ((Y0 + y * 4 + 2) * P.w + X0 + x * 4 + 2) * 4, r = P.data[i], g = P.data[i + 1], b = P.data[i + 2];
      if (Math.abs(r - g) < 8 && Math.abs(g - b) < 8 && r > 150) continue;   /* quadriculado de fundo */
      if (Math.max(r, g, b) - Math.min(r, g, b) > 110 && (r > 150 || g > 150 || b > 150)) continue;   /* piso */
      const j = (y * w + x) * 4; d[j] = r; d[j + 1] = g; d[j + 2] = b; d[j + 3] = 255; n++; }
    saida[nome] = { src: 'data:image/png;base64,' + Buffer.from(encodePNG(w, h, d)).toString('base64'), w, h, ax, ay }; console.log(nome.padEnd(6), w + 'x' + h, 'âncora', ax + ',' + ay, 'pixels', n); } }
fs.writeFileSync('casa_pecas_dados.js', '// gerado por casa_pecas_extrai2.mjs a partir da folha do dono (' + arq.split(/[\\/]/).pop() + '): não editar à mão\nconst PECAS = ' + JSON.stringify(saida) + ';\n');
