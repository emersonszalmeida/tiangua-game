// ============================================================================================================
// EXTRATOR DAS PEÇAS DA CASA -> casa_pecas_dados.js (const PECAS, lido pelo chao.html)
// Uso atual (rodar na pasta do projeto):
//   node casa_pecas_extrai2.mjs arte_casa/exportado_2026-11-16/desenho17.png
// Fontes:
//   - paredes/cantos/portas médias: a folha passada no argumento (desenho17.png, exportada do editor-pixel pelo dono)
//   - peças de encontro: arte_casa/exportado_2026-11-16/print_pecas_encontro.png
//   - porta alta ANIMADA (5 quadros): arte_casa/exportado_2026-11-17/desenho19.png (linha de baixo)
// Saídas:
//   - casa_pecas_dados.js (todas as peças embutidas em base64; não editar à mão)
//   - arte_casa/portas_animadas/*.png (os quadros das portas, para conferir/editar; ver o bloco das portas no fim)
// Para mudar uma peça: o dono redesenha no editor-pixel, exporta a folha, e o Claude acha as posições novas e roda este script.
// ============================================================================================================
// Folha do dono (era desenho (9).png, hoje desenho17.png): peças soltas em cima, montagens com piso embaixo. As montagens mostram o encaixe:
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
// PORTA ALTA ANIMADA nas duas paredes. A madeira que o dono pintou (desenho19) é a do lado ILUMINADO = parede ↘ (ele desenhou na ↙ por engano).
// Medido nas peças do dono: a parede ↘ é o espelho exato da ↙ (forma 100%), só com luz diferente (↘ ~14% mais clara: 181→205, 140→160, 94→110; a linha escura 47,38,34 não muda).
//  - ↘ (x_DA_f1..5): quadro espelhado; onde ainda é parede (pixel igual ao y_DA espelhado) usa a x_DA do dono; madeira com as cores do dono (×LUZ_X, padrão 1).
//  - ↙ (y_DA_f1..5): o desenho do dono no lugar; madeira CONTRA A LUZ (×LUZ_Y, padrão 1/1,14 = a mesma diferença das paredes); parede e contorno escuro ficam iguais.
{ const LUZ_X = +(process.env.LUZ_X || 1), LUZ_Y = +(process.env.LUZ_Y || 1 / 1.14);
  const dec = k => { const f = (process.env.TEMP || '.') + '/pe_' + k + '_' + process.pid + '.png'; fs.writeFileSync(f, Buffer.from(saida[k].src.split(',')[1], 'base64')); const im = decodePNG(f); fs.unlinkSync(f); return im; };
  const enc = (d, w, h) => 'data:image/png;base64,' + Buffer.from(encodePNG(w, h, d)).toString('base64');
  const luz = (d, j, r, g, b, f) => { const esc = r + g + b < 150;   /* contorno escuro (47,38,34 e vizinhos) fica igual, como na parede */
    d[j] = esc ? r : Math.min(255, Math.round(r * f)); d[j + 1] = esc ? g : Math.min(255, Math.round(g * f)); d[j + 2] = esc ? b : Math.min(255, Math.round(b * f)); d[j + 3] = 255; };
  const YB = dec('y_DA'), XB = dec('x_DA'), w = 68, h = 126;
  for (let k = 1; k <= 5; k++) { const F = dec('y_DA_f' + k), dx = new Uint8Array(w * h * 4), dy = new Uint8Array(w * h * 4); let mad = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; if (!F.data[i + 3]) continue;
      const r = F.data[i], g = F.data[i + 1], b = F.data[i + 2], parede = YB.data[i + 3] && r === YB.data[i] && g === YB.data[i + 1] && b === YB.data[i + 2];
      const j = (y * w + (w - 1 - x)) * 4;   /* posição espelhada (↘) */
      if (parede) { for (let c = 0; c < 4; c++) dy[i + c] = F.data[i + c]; if (XB.data[j + 3]) for (let c = 0; c < 4; c++) dx[j + c] = XB.data[j + c]; continue; }
      luz(dy, i, r, g, b, LUZ_Y); luz(dx, j, r, g, b, LUZ_X); mad++; }
    saida['y_DA_f' + k].src = enc(dy, w, h);
    saida['x_DA_f' + k] = { src: enc(dx, w, h), w, h, ax: saida.x_DA.ax, ay: saida.x_DA.ay };
    console.log('porta quadro ' + k + ': madeira ' + mad + ' px (↘ ×' + LUZ_X.toFixed(3) + ', ↙ ×' + LUZ_Y.toFixed(3) + ')'); } }
// PNGs das portas animadas, para o dono ver e editar no editor-pixel (em qualquer computador: vão para o GitHub)
//   arte_casa/portas_animadas/y_DA_f1..5.png (↙, contra a luz) e x_DA_f1..5.png (↘, iluminada); 68x126 cada, âncora no vértice (↙: 67,93; ↘: 1,93)
//   arte_casa/portas_animadas/_folha.png: os 10 quadros juntos em 1x (linha de cima ↙, de baixo ↘), fundo transparente
// ATENÇÃO: estes PNGs são SAÍDA (este script os sobrescreve). Para mudar a porta de verdade, edite o desenho19.png (a madeira da ↘)
// ou entregue o PNG editado ao Claude para virar a nova fonte.
{ const dir = 'arte_casa/portas_animadas'; fs.mkdirSync(dir, { recursive: true });
  const dec = k => { const f = (process.env.TEMP || '.') + '/pp_' + k + '_' + process.pid + '.png'; fs.writeFileSync(f, Buffer.from(saida[k].src.split(',')[1], 'base64')); const im = decodePNG(f); fs.unlinkSync(f); return im; };
  const cw = 76, ch = 134, FW = cw * 5, FH = ch * 2, folha = new Uint8Array(FW * FH * 4);
  ['y', 'x'].forEach((a, lin) => { for (let k = 1; k <= 5; k++) { const nome = a + '_DA_f' + k;
    fs.writeFileSync(dir + '/' + nome + '.png', Buffer.from(saida[nome].src.split(',')[1], 'base64'));
    const im = dec(nome); for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) { const i = (y * im.w + x) * 4, j = ((lin * ch + 4 + y) * FW + (k - 1) * cw + 4 + x) * 4; for (let c = 0; c < 4; c++) folha[j + c] = im.data[i + c]; } } });
  fs.writeFileSync(dir + '/_folha.png', encodePNG(FW, FH, folha)); console.log('PNGs das portas em', dir); }
// FOLHA 2026-11-18 (desenho19b.png): peças soltas do dono (22 = 8 paredes + 10 portas + 4 batentes) e 8 COLUNAS de canto (centros), alta e média. Substitui x_DA, y_DA e os 4 batentes (as portas animadas são idênticas às de desenho19) e cria C_<canto>_<A|M>.
// As colunas ficam sobre o piso colorido da folha, no vértice certo: RD = topo (^), LU = base (V), RU = esquerda (<), LD = direita (>). Âncora = vértice do canto inteiro de que a coluna é o miolo (calibrado: cada coluna encaixa 98,6-100% pixel a pixel no miolo de RD_AA, LU_AA, RU_AA, LD_AA, RD_MM, LU_MM, RU_MM, LD_MM).
{ const P = decodePNG('arte_casa/exportado_2026-11-18/desenho19b.png');
  const recorta = (nome, X0, Y0, w, h, ax, ay) => { const d = new Uint8Array(w * h * 4); let n = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = ((Y0 + y) * P.w + X0 + x) * 4, r = P.data[i], g = P.data[i + 1], b = P.data[i + 2], j = (y * w + x) * 4; if (!P.data[i + 3]) continue; if (Math.max(r, g, b) - Math.min(r, g, b) > 110 && (r > 150 || g > 150 || b > 150)) continue; d[j] = r; d[j + 1] = g; d[j + 2] = b; d[j + 3] = 255; n++; }
    if (n < 30) throw new Error('peça vazia: ' + nome); saida[nome] = { src: 'data:image/png;base64,' + Buffer.from(encodePNG(w, h, d)).toString('base64'), w, h, ax, ay }; console.log(nome.padEnd(8), w + 'x' + h, 'âncora', ax + ',' + ay, 'pixels', n); };
  const ant = n => saida[n];   // mantém as âncoras que já funcionavam
  for (const [nome, X0, Y0] of [['x_DA', 2, 130], ['y_DA', 72, 130]]) recorta(nome, X0, Y0, 68, 126, ant(nome).ax, ant(nome).ay);
  for (const [nome, X0, Y0] of [['x_DM1', 142, 196], ['y_DM1', 260, 196], ['x_DM2', 190, 220], ['y_DM2', 212, 220]]) recorta(nome, X0, Y0, 20, 36, ant(nome).ax, ant(nome).ay);
  for (const [nome, X0, Y0, w, h, ax, ay] of [['C_RD_A', 583, 11, 10, 99, 5, 95], ['C_LU_A', 583, 137, 10, 99, 5, 97], ['C_RU_A', 457, 76, 6, 97, 5, 95], ['C_LD_A', 713, 76, 6, 97, 1, 95],
    ['C_RD_M', 785, 109, 10, 33, 5, 29], ['C_LU_M', 785, 171, 10, 33, 5, 31], ['C_RU_M', 723, 142, 6, 31, 5, 29], ['C_LD_M', 851, 142, 6, 31, 1, 29]]) recorta(nome, X0, Y0, w, h, ax, ay); }
// ------------------------------------------------------------------------------------------------------------
// FOLHA 2026-11-18 (desenho21.png, versão final do desenho20): SISTEMA DE COLUNAS do dono. Em cada vértice de parede entra uma COLUNA (pilar de 10 px),
// e as paredes soltas foram APARADAS nas duas pontas (62 px de largura em vez de 68), deixando um vão de 2 px no vértice que a coluna cobre.
// As peças aparadas entram com o sufixo _n (x_A_n, y_DA_f3_n ...) e só são usadas no modo coluna do chao.html (?centro); sem ele tudo continua como antes.
// POSIÇÃO (montagens do dono na própria folha, em 823..1340 x 390..578: um canto ^ e um canto V sobre piso 2x2, com o vão vermelho no vértice):
//   vértice do piso = (borda esquerda do piso 2x2 + 128, linha da ponta esquerda + 0,5), a mesma régua que dá as âncoras antigas do desenho17.
//   ↘ (x): âncora -1,92;  ↙ (y): âncora 63,92. CONFERIDO no jogo (2026-11-18): a mesma cena das montagens (piso 2x2, canto ^ e V) renderizada no chao.html bate 100% com a folha, paredes e bordas do piso.
//   Demais peças: casadas pixel a pixel com essas (100% iguais na base): médias -1,26 / 63,26; batentes -1,26 / 19,26 (começo) e -47,3 / 63,3 (fim);
//   portas altas e os 5 quadros animados: as mesmas da parede alta (-1,92 / 63,92); x_C / y_C (média com o pedaço alto): -1,92 / 63,92.
// COLUNAS (3 altas 10x97 e 3 médias 10x31, na mesma ordem; print do dono com os 4 pilares no losango): 1ª = C_O (simétrica) nos vértices ^ e V
//   (e em T, cruz, ponta solta e parede reta), 2ª = C_RU no canto <, 3ª = C_LD no canto >. Âncora no vértice: 5,95 (alta) e 5,29 (média).
// Peças da folha que NÃO são lidas: o 2º jogo de batentes (332..378,221), as perninhas com batente (282,129 e 406,132), as montagens e os pisos de teste.
{ const P = decodePNG('arte_casa/exportado_2026-11-18/desenho21.png');
  const recorta = (nome, X0, Y0, w, h, ax, ay) => { const d = new Uint8Array(w * h * 4); let n = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = ((Y0 + y) * P.w + X0 + x) * 4, r = P.data[i], g = P.data[i + 1], b = P.data[i + 2], j = (y * w + x) * 4; if (!P.data[i + 3]) continue; if (Math.max(r, g, b) - Math.min(r, g, b) > 110 && (r > 150 || g > 150 || b > 150)) continue; d[j] = r; d[j + 1] = g; d[j + 2] = b; d[j + 3] = 255; n++; }
    if (n < 30) throw new Error('peça vazia: ' + nome + ' (a folha desenho21 mudou de lugar?)'); saida[nome] = { src: 'data:image/png;base64,' + Buffer.from(encodePNG(w, h, d)).toString('base64'), w, h, ax, ay }; console.log(nome.padEnd(10), w + 'x' + h, 'âncora', ax + ',' + ay, 'pixels', n); };
  // [nome, x, y, largura, altura, ax, ay] (caixa = contorno exato da peça na folha)
  for (const a of [['x_A_n', 3, 3, 62, 123, -1, 92], ['y_A_n', 71, 3, 62, 123, 63, 92], ['x_C_n', 282, 2, 62, 123, -1, 92], ['y_C_n', 358, 2, 62, 123, 63, 92],
    ['x_M_n', 142, 68, 62, 57, -1, 26], ['y_M_n', 206, 68, 62, 57, 63, 26], ['x_DA_n', 2, 129, 62, 123, -1, 92], ['y_DA_n', 68, 129, 62, 123, 63, 92],
    ['x_DM1_n', 142, 196, 18, 35, -1, 26], ['y_DM1_n', 262, 196, 18, 35, 19, 26], ['x_DM2_n', 188, 219, 16, 34, -47, 3], ['y_DM2_n', 218, 219, 16, 34, 63, 3],
    ['C_O_A', 523, 241, 10, 97, 5, 95], ['C_RU_A', 546, 242, 10, 97, 5, 95], ['C_LD_A', 570, 242, 10, 97, 5, 95],
    ['C_O_M', 523, 345, 10, 31, 5, 29], ['C_RU_M', 546, 345, 10, 31, 5, 29], ['C_LD_M', 570, 344, 10, 31, 5, 29]]) recorta(...a);
  // portas altas animadas (linha de cima = ↙ contra a luz, linha de baixo = ↘), quadros 1 (fechada) .. 5 (aberta)
  [898, 974, 1050, 1126, 1202].forEach((X0, k) => recorta('y_DA_f' + (k + 1) + '_n', X0, 25, 62, 123, 63, 92));
  [[895, 152], [972, 159], [1048, 159], [1124, 159], [1200, 159]].forEach(([X0, Y0], k) => recorta('x_DA_f' + (k + 1) + '_n', X0, Y0, 62, 123, -1, 92));
  for (const k of ['C_RD_A', 'C_LU_A', 'C_RD_M', 'C_LU_M']) delete saida[k];   // colunas do protótipo de 19b substituídas pela C_O
  // PILAR DO CANTO ^ (RD), criado pelo dono depois do desenho21 (print pilares_print_2026-11-18.png, 1º da esquerda, alto e médio): reduzido do print 6x para 1x
  //   (o mesmo método reproduz os outros pilares do print 100% iguais aos da folha). Mesmo contorno da C_O, então mesma âncora. O V continua com a C_O.
  for (const [nome, arq, ay] of [['C_RD_A', 'pilar_topo_alto', 95], ['C_RD_M', 'pilar_topo_medio', 29]]) { const im = decodePNG('arte_casa/exportado_2026-11-18/' + arq + '.png');
    saida[nome] = { src: 'data:image/png;base64,' + Buffer.from(encodePNG(im.w, im.h, im.data)).toString('base64'), w: im.w, h: im.h, ax: 5, ay }; console.log(nome.padEnd(10), im.w + 'x' + im.h, 'âncora 5,' + ay); }
}
fs.writeFileSync('casa_pecas_dados.js', '// gerado por casa_pecas_extrai2.mjs a partir da folha do dono (' + arq.split(/[\\/]/).pop() + '): não editar à mão\nconst PECAS = ' + JSON.stringify(saida) + ';\n');
