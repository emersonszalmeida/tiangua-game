// junta em TAMANHO REAL (1x, pixel = pixel) desenho17 + print_cantos_porta (ampliado 4x) + print_pecas_encontro (ampliado 3x) + portas_animadas/_folha
// os dois prints são reduzidos ao tamanho original (1 pixel do desenho = bloco KxK do print, conferido bloco a bloco); o fundo do editor (xadrez cinza / azul) vira transparente
import fs from 'node:fs';
import { decodePNG } from './pngdec.mjs';
import { encodePNG } from './pngenc.mjs';
const A = 'arte_casa/', G = 20;
function reduz(S, k) { const oy = 2, w = Math.floor(S.w / k), h = Math.floor((S.h - oy) / k), d = new Uint8Array(w * h * 4); let ruim = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const c = ((oy + y * k + (k >> 1)) * S.w + x * k + (k >> 1)) * 4; let ok = true;
    for (let v = 0; v < k && ok; v++) for (let u = 0; u < k; u++) { const i = ((oy + y * k + v) * S.w + x * k + u) * 4; if (S.data[i] !== S.data[c] || S.data[i + 1] !== S.data[c + 1] || S.data[i + 2] !== S.data[c + 2] || S.data[i + 3] !== S.data[c + 3]) { ok = false; break; } }
    if (!ok) ruim++;
    const r = S.data[c], g = S.data[c + 1], b = S.data[c + 2], a = S.data[c + 3], j = (y * w + x) * 4;
    const fundo = (b > 200 && r < 40) || (Math.abs(r - g) < 6 && Math.abs(g - b) < 6 && r > 150);
    if (fundo || !a) continue; d[j] = r; d[j + 1] = g; d[j + 2] = b; d[j + 3] = 255; }
  return { w, h, data: d, ruim }; }
const d17 = decodePNG(A + 'exportado_2026-11-16/desenho17.png'), fo = decodePNG(A + 'portas_animadas/_folha.png');
const cp = reduz(decodePNG(A + 'exportado_2026-11-16/print_cantos_porta.png'), 4), pe = reduz(decodePNG(A + 'exportado_2026-11-16/print_pecas_encontro.png'), 3);
console.log('blocos que não eram uniformes: cantos_porta', cp.ruim, 'pecas_encontro', pe.ruim);
const L = [['exportado_2026-11-16/desenho17.png', d17, 0, 0], ['exportado_2026-11-16/print_cantos_porta.png (4x -> 1x)', cp, d17.w + G, 0], ['exportado_2026-11-16/print_pecas_encontro.png (3x -> 1x)', pe, d17.w + G, cp.h + G], ['portas_animadas/_folha.png', fo, 0, d17.h + G]];
const W = Math.max(...L.map(([, S, X]) => X + S.w)), H = Math.max(...L.map(([, S, , Y]) => Y + S.h)), d = new Uint8Array(W * H * 4), log = [];
for (const [n, S, X, Y] of L) { for (let y = 0; y < S.h; y++) for (let x = 0; x < S.w; x++) { const i = (y * S.w + x) * 4, j = ((Y + y) * W + X + x) * 4; if (!S.data[i + 3]) continue; for (let c = 0; c < 4; c++) d[j + c] = S.data[i + c]; } log.push(n + ' @' + X + ',' + Y + ' ' + S.w + 'x' + S.h); }
fs.writeFileSync(A + 'folha_junta.png', encodePNG(W, H, d)); fs.writeFileSync(A + 'folha_junta.txt', 'Folha ' + W + 'x' + H + ', tamanho real (1 pixel = 1 pixel), fundo transparente (arquivo @x,y largura x altura):\n' + log.join('\n') + '\n'); console.log(W + 'x' + H + '\n' + log.join('\n'));
