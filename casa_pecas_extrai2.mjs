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
  x_A: [63, 50, 68, 126, 'c', 1, 93], y_A: [135, 49, 68, 126, 'c', 67, 93],
  RD_AA: [207, 9, 134, 128, 'c', 67, 95], LU_AA: [343, 46, 130, 127, 'c', 65, 125], RU_AA: [475, 10, 72, 158, 'c', 5, 125], LD_AA: [617, 46, 72, 158, 'c', 67, 125],
  // média
  x_M: [67, 242, 68, 60, 'c', 1, 27], y_M: [139, 272, 68, 60, 'c', 67, 27],
  RD_MM: [207, 205, 134, 62, 'c', 67, 29], LU_MM: [343, 242, 130, 61, 'c', 65, 59], RU_MM: [475, 206, 72, 92, 'c', 5, 59], LD_MM: [613, 242, 72, 92, 'c', 67, 59],
  // porta alta (DA)
  x_DA: [72, 612, 68, 126, 'c', 1, 93], y_DA: [144, 616, 68, 126, 'c', 67, 93],   /* y_DA foi redesenhada com 69 de largura; a coluna 0 só tem pontinhos soltos (3 pixels), então corto */
  // linha 3 (contornos): parede média com o pedaço alto no começo (x_C, y_C) e cantos com a frente média e o fundo alto; y_C: a versão nova tinha 2 colunas soltas à esquerda (6 pixels perdidos, os 'pontinhos'); o corpo da parede é o mesmo de antes (68 de largura), então corto essas 2 colunas
  x_C: [64, 400, 68, 126, 'c', 1, 93], y_C: [137, 414, 68, 126, 'c', 67, 93], LU_CC: [273, 372, 126, 126, 'c', 63, 124], RU_CC: [470, 371, 72, 158, 'c', 5, 125], LD_CC: [608, 405, 72, 158, 'c', 67, 125],
  // cantos com a porta alta no fundo e a frente média (PP) e com a porta alta + parede alta (DAA/ADA)
  LD_PP: [286, 579, 72, 158, 'c', 67, 125], RU_PP: [369, 577, 72, 158, 'c', 5, 125], LD_DAA: [566, 568, 72, 158, 'c', 67, 125], RU_ADA: [669, 570, 72, 158, 'c', 5, 125],
  // porta MÉDIA = só os dois batentes (20x36), âncora relativa ao vértice de INÍCIO da parede: _1 = batente do início, _2 = batente do fim (medido contra x_DA/y_DA: 84% iguais)
  x_DM1: [65, 791, 20, 36, 'c', 1, 27], x_DM2: [113, 815, 20, 36, 'c', -47, 3], y_DM1: [187, 792, 20, 36, 'c', 19, 27], y_DM2: [139, 816, 20, 36, 'c', 67, 3],
  // cantos V (LU) médios com porta numa das paredes: _DMM = braço L é porta (batente do fim + parede U), _MDM = braço U é porta (parede L + batente do fim); âncora no vértice (medida contra y_M/x_M)
  LU_DMM: [385, 789, 82, 61, 'c', 17, 59], LU_MDM: [605, 784, 82, 61, 'c', 65, 59],
  // cantos Λ (RD, fundo da sala) com alturas misturadas e porta média: nome = braço R (↘) depois braço D (↙); A = alta, M = média, DM = porta média (âncora medida contra as paredes soltas: 92-97% iguais)
  RD_AM: [16, 1143, 134, 128, 'c', 67, 95], RD_MA: [192, 1139, 134, 128, 'c', 67, 95], RD_DMA: [427, 1127, 86, 128, 'c', 67, 95], RD_ADM: [732, 1128, 86, 128, 'c', 19, 95],
  // cantos ^ altos com PORTA ALTA numa das paredes: _ADA = braço ↘ alto + ↙ porta; _DAA = ↘ porta + ↙ alto (âncora medida contra x_A/y_DA e x_DA/y_A: 98%)
  RD_ADA: [230, 1312, 134, 128, 'c', 67, 95], RD_DAA: [371, 1311, 134, 128, 'c', 67, 95] };
const saida = {};
for (const [nome, [x0, y0, w, h, eixo, cax, cay, filtro]] of Object.entries(LIB)) {
  const d = new Uint8Array(w * h * 4); let n = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = ((y0 + y) * S.w + (x0 + x)) * 4, j = (y * w + x) * 4; if (S.data[i + 3] === 0) continue; { const r = S.data[i], g = S.data[i + 1], bb = S.data[i + 2]; if (Math.max(r, g, bb) - Math.min(r, g, bb) > 110 && (r > 150 || g > 150 || bb > 150)) continue; }   /* cores de piso (verde, amarelo, laranja, azul, vermelho) não fazem parte da peça */ d[j] = S.data[i]; d[j + 1] = S.data[i + 1]; d[j + 2] = S.data[i + 2]; d[j + 3] = S.data[i + 3]; n++; }
  if (nome === 'y_DA') for (const [px, py] of [[47, 87], [47, 94], [47, 95]]) { const j = (py * w + px) * 4; if (d[j + 3]) { d[j + 3] = 0; n--; } }   /* pontinhos soltos na borda da abertura (a 1 coluna do vão) */
  if (n < 200) throw new Error('peça vazia: ' + nome + ' (a folha mudou de lugar?)');
  saida[nome] = { src: 'data:image/png;base64,' + Buffer.from(encodePNG(w, h, d)).toString('base64'), w, h, ax: eixo === 'c' ? cax : eixo === 'x' ? 1 : 67, ay: eixo === 'c' ? cay : h - 33 };
  console.log(nome.padEnd(5), w + 'x' + h, 'âncora', saida[nome].ax + ',' + saida[nome].ay, 'pixels', n);
}
// cantos com a parede alta no fundo e PORTA MÉDIA na frente (print 3x do editor: print_pecas_encontro.png): só a parte alta + o batente do começo da porta; o batente do fim é o x_DM2 / y_DM2 solto
// LD_ADM: > (L alta, D porta média); RU_DMA: < (R porta média, U alta); mesmas âncoras das peças _CC (a caixa é só a parte de cima, 70x134)
{ const P = decodePNG('arte_casa/exportado_2026-11-16/print_pecas_encontro.png');
  for (const [nome, X0, Y0, ax, ay] of [['LD_ADM', 381, 53, 65, 125], ['RU_DMA', 972, 53, 5, 125]]) {
    const w = 70, h = 134, d = new Uint8Array(w * h * 4); let n = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = ((Y0 + y * 3 + 1) * P.w + X0 + x * 3 + 1) * 4, r = P.data[i], g = P.data[i + 1], b = P.data[i + 2];
      if (b > 200 && r < 40) continue;   /* fundo azul do editor */
      if (Math.max(r, g, b) - Math.min(r, g, b) > 110 && (r > 150 || g > 150 || b > 150)) continue;   /* piso */
      const j = (y * w + x) * 4; d[j] = r; d[j + 1] = g; d[j + 2] = b; d[j + 3] = 255; n++; }
    saida[nome] = { src: 'data:image/png;base64,' + Buffer.from(encodePNG(w, h, d)).toString('base64'), w, h, ax, ay }; console.log(nome.padEnd(6), w + 'x' + h, 'âncora', ax + ',' + ay, 'pixels', n); } }
// porta ↙ alta ANIMADA (do dono: desenho19.png, porta de madeira com almofadas, linha de baixo; antes desenho18 = porta lisa): 5 quadros (1 fechada ... 5 aberta), mesma caixa e âncora do y_DA (68x126, 67,93); só o piso verde de apoio é tirado
{ const P = decodePNG('arte_casa/exportado_2026-11-17/desenho19.png');
  [[71, 885], [237, 880], [381, 898], [528, 897], [676, 896]].forEach(([X0, Y0], k) => { const w = 68, h = 126, d = new Uint8Array(w * h * 4); let n = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = ((Y0 + y) * P.w + X0 + x) * 4, r = P.data[i], g = P.data[i + 1], b = P.data[i + 2]; if (!P.data[i + 3]) continue; if (g > r + 25 && g > b + 40) continue; const j = (y * w + x) * 4; d[j] = r; d[j + 1] = g; d[j + 2] = b; d[j + 3] = 255; n++; }
    saida['y_DA_f' + (k + 1)] = { src: 'data:image/png;base64,' + Buffer.from(encodePNG(w, h, d)).toString('base64'), w, h, ax: 67, ay: 93 }; console.log(('y_DA_f' + (k + 1)).padEnd(8), w + 'x' + h, 'pixels', n); }); }
// porta ↘ alta ANIMADA (x_DA_f1..5): ESPELHO dos quadros da ↙. Medido nas peças do dono: a parede ↘ é o espelho exato da ↙ (forma 100%), só com luz diferente
// (cada tom ~14% mais claro: 181→205, 140→160, 94→110; a linha escura 47,38,34 não muda). Então: onde o quadro espelhado ainda é parede (pixel igual ao y_DA espelhado), usa a x_DA do dono;
// o resto (porta e batente de madeira) recebe a mesma luz da parede (×LUZ_X), menos o contorno escuro. LUZ_X=1 deixa a madeira igual à da ↙.
{ const LUZ_X = +(process.env.LUZ_X || 1.14);
  const dec = k => { const f = (process.env.TEMP || '.') + '/pe_' + k + '_' + process.pid + '.png'; fs.writeFileSync(f, Buffer.from(saida[k].src.split(',')[1], 'base64')); const im = decodePNG(f); fs.unlinkSync(f); return im; };
  const YB = dec('y_DA'), XB = dec('x_DA'), w = 68, h = 126;
  for (let k = 1; k <= 5; k++) { const F = dec('y_DA_f' + k), d = new Uint8Array(w * h * 4); let par = 0, mad = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + (w - 1 - x)) * 4, j = (y * w + x) * 4; if (!F.data[i + 3]) continue;
      const parede = YB.data[i + 3] && F.data[i] === YB.data[i] && F.data[i + 1] === YB.data[i + 1] && F.data[i + 2] === YB.data[i + 2];
      if (parede && XB.data[j + 3]) { for (let c = 0; c < 4; c++) d[j + c] = XB.data[j + c]; par++; continue; }
      const r = F.data[i], g = F.data[i + 1], b = F.data[i + 2], esc = r + g + b < 150;   /* contorno escuro (47,38,34 e vizinhos) fica igual, como na parede */
      d[j] = esc ? r : Math.min(255, Math.round(r * LUZ_X)); d[j + 1] = esc ? g : Math.min(255, Math.round(g * LUZ_X)); d[j + 2] = esc ? b : Math.min(255, Math.round(b * LUZ_X)); d[j + 3] = 255; mad++; }
    saida['x_DA_f' + k] = { src: 'data:image/png;base64,' + Buffer.from(encodePNG(w, h, d)).toString('base64'), w, h, ax: saida.x_DA.ax, ay: saida.x_DA.ay };
    console.log(('x_DA_f' + k).padEnd(8), w + 'x' + h, 'parede do dono', par, 'madeira com luz', mad); } }
fs.writeFileSync('casa_pecas_dados.js', '// gerado por casa_pecas_extrai2.mjs a partir da folha do dono (' + arq.split(/[\\/]/).pop() + '): não editar à mão\nconst PECAS = ' + JSON.stringify(saida) + ';\n');
