// Pega a folha dos cantos que o dono desenhou no editor-pixel e guarda cada peça (só os pixels que ele pintou diferente da folha original, dentro da moldura).
// uso: node cantos_aplicar_edicoes.mjs <png exportado>     → cantos_editar/pecas/<situação>.png e cantos_dados.js (usado por chao.html)
import fs from 'node:fs';
import { decodePNG } from './pngdec.mjs';
import { encodePNG } from './pngenc.mjs';
const arq = process.argv[2]; if (!arq) { console.log('uso: node cantos_aplicar_edicoes.mjs <png exportado>'); process.exit(1); }
const D = './cantos_editar/', B = decodePNG(D + 'base.png'), E = decodePNG(arq), lay = JSON.parse(fs.readFileSync(D + 'folha_layout.json', 'utf8'));
if (B.w !== E.w || B.h !== E.h) { console.log('ATENÇÃO: a folha exportada tem ' + E.w + 'x' + E.h + ' e a original ' + B.w + 'x' + B.h + '. Não mude o tamanho da tela.'); process.exit(1); }
fs.mkdirSync(D + 'pecas', { recursive: true });
const dados = {}; const px = (im, x, y) => { const p = (y * im.w + x) * 4; return [im.data[p], im.data[p + 1], im.data[p + 2], im.data[p + 3]]; };
for (const [nome, L] of Object.entries(lay.itens)) {
  const o = new Uint8Array(L.fw * L.fh * 4); let n = 0, apagados = 0;
  for (let y = 0; y < L.fh; y++) for (let x = 0; x < L.fw; x++) { const a = px(B, L.fx + x, L.fy + y), b = px(E, L.fx + x, L.fy + y);
    if (b[3] > 0 && (!a[3] || a[0] !== b[0] || a[1] !== b[1] || a[2] !== b[2])) { o.set([b[0], b[1], b[2], 255], (y * L.fw + x) * 4); n++; } else if (a[3] > 0 && !b[3]) apagados++; }
  if (apagados) console.log('  ' + nome + ': ' + apagados + ' pixel(s) apagado(s) não valem (a peça só pinta por cima)');
  if (!n) { console.log(nome.padEnd(10), 'sem mudança'); fs.rmSync(D + 'pecas/' + nome + '.png', { force: true }); continue; }
  const png = encodePNG(L.fw, L.fh, o); fs.writeFileSync(D + 'pecas/' + nome + '.png', png);
  dados[nome] = { src: 'data:image/png;base64,' + png.toString('base64'), w: L.fw, h: L.fh, ax: L.vx - L.fx, ay: L.vy - L.fy, flags: L.flags }; console.log(nome.padEnd(10), n + ' pixels pintados');
}
fs.writeFileSync('./cantos_dados.js', '// gerado por cantos_aplicar_edicoes.mjs: peças únicas dos cantos/pontas desenhadas pelo dono (só os pixels pintados; ax,ay = o vértice dentro da imagem; desenhadas para a parede ALTA)\nconst CANTOS = ' + JSON.stringify(dados) + ';\n');
console.log('cantos_dados.js: ' + Object.keys(dados).length + ' situações');
