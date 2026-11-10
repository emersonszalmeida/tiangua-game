// Lê a folha de peças de parede/canto desenhada pelo dono (várias peças soltas num PNG transparente) e gera casa_pecas_dados.js:
//   PECAS[nome] = { src: dataURL, w, h, ax, ay }   (ax,ay = onde fica o vértice da peça dentro da imagem)
// Cada peça é reconhecida pelo FORMATO (silhueta) comparado com o que o jogo desenhava antes (cantos_todos/*/base.png): não depende da posição na folha.
// uso: node casa_pecas_extrai.mjs [folha.png = arte_casa/exportado_2026-11-10/desenho7.png]
import fs from 'node:fs';
import { decodePNG } from './pngdec.mjs';
import { encodePNG } from './pngenc.mjs';
const arq = process.argv[2] || 'arte_casa/exportado_2026-11-10/desenho7.png', S = decodePNG(arq);
// 1) peças soltas = componentes conexos (tolerância de 2 px); a montagem de exemplo (grande) e o piso são ignorados
const lab = new Int32Array(S.w * S.h), comps = []; let n = 0; const al = (x, y) => S.data[(y * S.w + x) * 4 + 3] > 0;
for (let y = 0; y < S.h; y++) for (let x = 0; x < S.w; x++) { if (!al(x, y) || lab[y * S.w + x]) continue; n++; const st = [[x, y]], px = []; lab[y * S.w + x] = n;
  while (st.length) { const [a, c] = st.pop(); px.push([a, c]); for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const X = a + dx, Y = c + dy; if (X < 0 || Y < 0 || X >= S.w || Y >= S.h || lab[Y * S.w + X] || !al(X, Y)) continue; lab[Y * S.w + X] = n; st.push([X, Y]); } }
  let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1; for (const [a, c] of px) { x0 = Math.min(x0, a); y0 = Math.min(y0, c); x1 = Math.max(x1, a); y1 = Math.max(y1, c); }
  comps.push({ px, x0, y0, w: x1 - x0 + 1, h: y1 - y0 + 1 }); }
comps.sort((p, q) => p.y0 - q.y0 || p.x0 - q.x0);
const sil = c => { const m = new Set(); for (const [a, b] of c.px) m.add((a - c.x0) + ',' + (b - c.y0)); return m; };
// 2) formatos de referência: o que o jogo desenhava (alta A / média M) para cada situação
const QUERO = { 'fundo_R__RA': 'x_A', 'fundo_D__DA': 'y_A', 'fundo_R__RM': 'x_M', 'fundo_D__DM': 'y_M',
  'canto_LU__LA_UA': 'LU_AA', 'canto_LU__LM_UM': 'LU_MM', 'canto_RD__RA_DA': 'RD_AA', 'canto_RD__RM_DM': 'RD_MM',
  'canto_RU__RA_UA': 'RU_AA', 'canto_RU__RM_UM': 'RU_MM', 'canto_RU__RM_UA': 'RU_MA', 'canto_LD__LA_DA': 'LD_AA', 'canto_LD__LM_DM': 'LD_MM', 'canto_LD__LA_DM': 'LD_AM' };
const frames = [];
for (const f of ['uniformes', 'mistos']) { const g = decodePNG('cantos_todos/' + f + '/base.png'), L = JSON.parse(fs.readFileSync('cantos_todos/' + f + '/folha_layout.json', 'utf8'));
  for (const [nome, l] of Object.entries(L.itens)) { if (!QUERO[nome]) continue; const m = new Set(); let x0 = 1e9, y0 = 1e9;
    for (let y = l.y; y < l.y + l.hh; y++) for (let x = l.x; x < l.x + l.w; x++) if (g.data[(y * g.w + x) * 4 + 3] > 0) { m.add((x - l.x) + ',' + (y - l.y)); x0 = Math.min(x0, x - l.x); y0 = Math.min(y0, y - l.y); }
    frames.push({ nome: QUERO[nome], m, x0, y0, vx: l.vx - l.x, vy: l.vy - l.y }); } }
const achados = {}, sobras = [];
comps.forEach((c, i) => { if (c.w > 200 || c.w * c.h < 3000 && false) return; const s = sil(c); let melhor = null;
  for (const f of frames) for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { let it = 0; for (const k of s) { const [a, b] = k.split(',').map(Number); if (f.m.has((a + f.x0 + dx) + ',' + (b + f.y0 + dy))) it++; } const iou = it / (s.size + f.m.size - it); if (!melhor || iou > melhor.iou) melhor = { iou, f, dx, dy }; }
  if (melhor.iou >= .8) { const nome = melhor.f.nome; if (achados[nome]) { console.log('AVISO: duas peças parecem ser ' + nome); } achados[nome] = { c, ax: melhor.f.vx - melhor.f.x0 - melhor.dx, ay: melhor.f.vy - melhor.f.y0 - melhor.dy, iou: melhor.iou }; } else sobras.push(c); });
// 3) peças com perna (parede média com a perninha alta numa ponta): contêm uma peça média inteira + colunas altas; a âncora vem da peça média
const PERNAS = [['x_M', 'x_M_perna'], ['y_M', 'y_M_perna'], ['LU_MM', 'LU_MM_pernas']];
for (const [base, nome] of PERNAS) { const b = achados[base]; if (!b) continue; const bs = sil(b.c); let melhor = null;
  for (const c of sobras) { if (c.w !== b.c.w || c.h <= b.c.h) continue; const cs = sil(c);
    for (let dy = 0; dy <= c.h - b.c.h; dy++) for (let dx = -2; dx <= 2; dx++) { let it = 0; for (const k of bs) { const [a, q] = k.split(',').map(Number); if (cs.has((a + dx) + ',' + (q + dy))) it++; } const cov = it / bs.size; if (!melhor || cov > melhor.cov) melhor = { cov, c, dx, dy }; } }
  if (melhor && melhor.cov >= .9) achados[nome] = { c: melhor.c, ax: b.ax + melhor.dx, ay: b.ay + melhor.dy, iou: melhor.cov }; }
// âncoras das paredes soltas: o vértice de uma ↘ fica no canto superior esquerdo (ax=0) e o de uma ↙ no superior direito (ax=largura); a base da peça fica 33 px abaixo do vértice
for (const [n, o] of Object.entries(achados)) if (/^(x|y)_(A|M)$/.test(n)) { o.ax = n[0] === 'x' ? 0 : o.c.w; o.ay = o.c.h - 33; }
for (const n of ['x_M_perna', 'y_M_perna']) if (achados[n]) { const b = achados[n[0] + '_M'], o = achados[n]; o.ax = b.ax; o.ay = b.ay + (o.c.h - b.c.h); }
// 3a) portas: a porta alta é uma parede alta com vão (cabe dentro da silhueta da parede alta); a porta média são 4 batentes pequenos (20x36), 2 por sentido, que cabem dentro da parede média
const jaUsada = c => Object.values(achados).some(o => o.c === c);
for (const c of sobras) { if (jaUsada(c) || c.w !== 68 || c.h !== 126) continue; const s = sil(c); let melhor = null;
  for (const e of ['x', 'y']) { const b = achados[e + '_A']; if (!b) continue; const bs = sil(b.c); let it = 0; for (const q of s) if (bs.has(q)) it++; const cov = it / s.size; if (!melhor || cov > melhor.cov) melhor = { cov, e }; }
  if (melhor && melhor.cov > .9) achados[melhor.e + '_DA'] = { c, ax: melhor.e === 'x' ? 0 : c.w, ay: c.h - 33, iou: melhor.cov }; }
const corDe = c => { const m = new Map(); for (const [a, b] of c.px) { const i = (b * S.w + a) * 4; m.set((a - c.x0) + ',' + (b - c.y0), S.data[i] + ',' + S.data[i + 1] + ',' + S.data[i + 2]); } return m; };
for (const c of sobras) { if (jaUsada(c) || c.w !== 20 || c.h !== 36) continue; const s = corDe(c); let melhor = null;
  for (const e of ['x', 'y']) { const b = achados[e + '_M']; if (!b) continue; const bs = corDe(b.c);
    for (let dy = 0; dy <= b.c.h - c.h; dy++) for (let dx = 0; dx <= b.c.w - c.w; dx++) { let it = 0; for (const [q, cor] of s) { const [a, bb] = q.split(',').map(Number); if (bs.get((a + dx) + ',' + (bb + dy)) === cor) it++; } const cov = it / s.size; if (!melhor || cov > melhor.cov) melhor = { cov, e, dx, dy, b }; } }
  if (melhor && melhor.cov > .8) { const lado = melhor.dx < 24 ? 'ini' : 'fim'; if (!achados[melhor.e + '_DM_' + lado] || achados[melhor.e + '_DM_' + lado].iou < melhor.cov) achados[melhor.e + '_DM_' + lado] = { c, ax: melhor.b.ax - melhor.dx, ay: melhor.b.ay - melhor.dy, iou: melhor.cov }; } else console.log('batente sem par', c.x0, c.y0, melhor && melhor.cov.toFixed(2)); }
// batentes que sobraram (um por ponta de porta média): vão para o lado que ainda está vazio, no encaixe de maior semelhança de cor
{ const slots = ['x_DM_ini', 'x_DM_fim', 'y_DM_ini', 'y_DM_fim'].filter(n => !achados[n]);
  for (const c of sobras) { if (jaUsada(c) || c.w !== 20 || c.h !== 36) continue; const s = corDe(c); let melhor = null;
    for (const sl of slots) { if (achados[sl]) continue; const e = sl[0], lado = sl.endsWith('ini') ? 0 : 1, b = achados[e + '_M']; const bs = corDe(b.c);
      for (let dy = 0; dy <= b.c.h - c.h; dy++) for (let dx = lado ? 36 : 0; dx <= (lado ? b.c.w - c.w : 12); dx++) { let it = 0; for (const [q, cor] of s) { const [a, bb] = q.split(',').map(Number); if (bs.get((a + dx) + ',' + (bb + dy)) === cor) it++; } const cov = it / s.size; if (!melhor || cov > melhor.cov) melhor = { cov, sl, dx, dy, b }; } }
    if (melhor && melhor.cov > .5) { achados[melhor.sl] = { c, ax: melhor.b.ax - melhor.dx, ay: melhor.b.ay - melhor.dy, iou: melhor.cov }; console.log('batente extra →', melhor.sl, 'dx', melhor.dx, 'dy', melhor.dy, melhor.cov.toFixed(2)); } } }
// 3b) âncoras recalibradas: o vértice de uma parede ↘ fica no canto superior esquerdo (ax=0) e o de uma ↙ no superior direito (ax=largura); a base da peça fica 33 px abaixo do vértice
// as peças compostas (canto com dois braços) devem conter as duas paredes soltas colocadas a 64 px / 32 px do vértice: o vértice é onde isso encaixa melhor
const BR = { LU: [['x', -64, -32], ['y', 64, -32]], RD: [['x', 0, 0], ['y', 0, 0]], RU: [['x', 0, 0], ['y', 64, -32]], LD: [['x', -64, -32], ['y', 0, 0]] };
const pixelsDe = (c) => { const m = new Set(); for (const [a, b] of c.px) m.add((a - c.x0) + ',' + (b - c.y0)); return m; };
for (const [nome, o] of Object.entries(achados)) { const m = /^(LU|RD|RU|LD)_([AM])([AM])(_pernas)?$/.exec(nome); if (!m) continue; const [, par, h1, h2] = m, alvo = pixelsDe(o.c); let melhor = null;
  for (let ay = 20; ay < o.c.h; ay++) for (let ax = 0; ax <= o.c.w; ax++) { let tot = 0, ok = 0;
    BR[par].forEach(([eixo, dx, dy], i) => { const s = achados[eixo + '_' + (i ? h2 : h1)]; const sm = pixelsDe(s.c); for (const k2 of sm) { const [a, b] = k2.split(',').map(Number); tot++; if (alvo.has((a + ax + dx - s.ax) + ',' + (b + ay + dy - s.ay))) ok++; } });
    const cov = ok / tot; if (!melhor || cov > melhor.cov) melhor = { cov, ax, ay }; }
  console.log('encaixe', nome.padEnd(13), 'vértice', melhor.ax + ',' + melhor.ay, '(antes ' + o.ax + ',' + o.ay + ') cobertura', melhor.cov.toFixed(2)); o.ax = melhor.ax; o.ay = melhor.ay; }
// 4) gravar
const saida = {};
for (const [nome, o] of Object.entries(achados)) { const { c } = o, d = new Uint8Array(c.w * c.h * 4); for (const [a, b] of c.px) { const i = (b * S.w + a) * 4, j = ((b - c.y0) * c.w + (a - c.x0)) * 4; d[j] = S.data[i]; d[j + 1] = S.data[i + 1]; d[j + 2] = S.data[i + 2]; d[j + 3] = S.data[i + 3]; }
  // tileset: o ajuste fino (medido pela linha escura do topo e pela borda do piso) fica na ÂNCORA da peça; o jogo só encaixa a peça no piso, sem regra extra
  const AJ = { RU: [-1, -1], LU: [-1, -1], RD: [-1, -2], LD: [1, -1] }, aj = AJ[nome.slice(0, 2)];
  const ax2 = aj ? o.ax - aj[0] : o.ax, ay2 = aj ? o.ay - aj[1] : o.ay + 1;
  saida[nome] = { src: 'data:image/png;base64,' + Buffer.from(encodePNG(c.w, c.h, d)).toString('base64'), w: c.w, h: c.h, ax: ax2, ay: ay2 };
  console.log(nome.padEnd(13), c.w + 'x' + c.h, 'âncora', o.ax + ',' + o.ay, 'semelhança', o.iou.toFixed(2)); }
fs.writeFileSync('casa_pecas_dados.js', '// gerado por casa_pecas_extrai.mjs a partir da folha do dono (' + arq + '): não editar à mão\nconst PECAS = ' + JSON.stringify(saida) + ';\n');
const ignoradas = sobras.filter(c => !Object.values(achados).some(o => o.c === c)).map(c => c.w + 'x' + c.h + '@' + c.x0 + ',' + c.y0); console.log('peças sem uso (baixas, piso etc.):', ignoradas.join(' · '));
