// Pega a folha que você editou e exportou do editor-pixel e devolve cada peça ao jogo.
// uso: node arvores_aplicar_edicoes.mjs <caminho do PNG exportado>
// Só as peças que mudaram viram "editadas à mão" (arvore_editadas/<nome>.png) e o gerador passa a respeitá-las.
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { decodePNG } from './pngdec.mjs';
import { encodePNG } from './pngenc.mjs';
const path = u => new URL(u, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const arq = process.argv[2]; if (!arq) { console.log('uso: node arvores_aplicar_edicoes.mjs <png exportado>'); process.exit(1); }
const OUT = path('./arvore_editadas/'), DIR = path('./arvore/'), lay = JSON.parse(fs.readFileSync(OUT + 'folha_layout.json', 'utf8'));
const im = decodePNG(arq);
if (im.w !== lay.largura || im.h !== lay.altura) { console.log('ATENÇÃO: a folha exportada tem ' + im.w + 'x' + im.h + ' e a original ' + lay.largura + 'x' + lay.altura + '. Mantenha o tamanho da tela do editor (não use "Tamanho da tela…").'); process.exit(1); }
// o PNG atual pode ter colunas/linhas vazias nas bordas: compara sempre a caixa de pixels com arte
function apara(im) { let x0 = im.w, y0 = im.h, x1 = -1, y1 = -1; for (let j = 0; j < im.h; j++) for (let i = 0; i < im.w; i++) if (im.data[(j * im.w + i) * 4 + 3]) { x0 = Math.min(x0, i); x1 = Math.max(x1, i); y0 = Math.min(y0, j); y1 = Math.max(y1, j); } const w = x1 - x0 + 1, h = y1 - y0 + 1, d = new Uint8Array(w * h * 4); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) d.set(im.data.subarray(((y0 + j) * im.w + x0 + i) * 4, ((y0 + j) * im.w + x0 + i) * 4 + 4), (j * w + i) * 4); return { w, h, data: d }; }
const mudou = [];
for (const [nome, L] of Object.entries(lay.itens)) {
  // recorta o quadro e apara para a caixa de pixels com arte (o ponto de apoio do tronco é recalculado depois pelo gerador)
  let x0 = L.w, y0 = L.h, x1 = -1, y1 = -1; const px = (i, j) => ((L.y + j) * im.w + L.x + i) * 4;
  for (let j = 0; j < L.h; j++) for (let i = 0; i < L.w; i++) if (im.data[px(i, j) + 3]) { x0 = Math.min(x0, i); x1 = Math.max(x1, i); y0 = Math.min(y0, j); y1 = Math.max(y1, j); }
  if (x1 < 0) { console.log('  ' + nome + ': ficou vazio, ignorado'); continue; }
  const w = x1 - x0 + 1, h = y1 - y0 + 1, o = new Uint8Array(w * h * 4);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const p = px(x0 + i, y0 + j); o.set([im.data[p], im.data[p + 1], im.data[p + 2], im.data[p + 3] ? 255 : 0], (j * w + i) * 4); }
  // igual ao que já está no jogo? então não mexe
  const atual = apara(decodePNG(DIR + nome + '.png')); let igual = atual.w === w && atual.h === h; if (igual) for (let i = 0; i < w * h; i++) { const a = atual.data[i * 4 + 3] > 0, b = o[i * 4 + 3] > 0; if (a !== b || (a && (atual.data[i * 4] !== o[i * 4] || atual.data[i * 4 + 1] !== o[i * 4 + 1] || atual.data[i * 4 + 2] !== o[i * 4 + 2]))) { igual = false; break; } }
  if (igual) continue;
  fs.writeFileSync(OUT + nome + '.png', encodePNG(w, h, o)); mudou.push(nome);
}
console.log(mudou.length ? 'peças editadas: ' + mudou.join(', ') : 'nenhuma peça mudou');
if (mudou.length) { const r = spawnSync(process.execPath, [path('./arvores_do_gemini.mjs')], { stdio: 'inherit' }); if (r.status) process.exit(r.status); console.log('jogo atualizado (arvore_dados.js e arvore/*.png). Recarregue o chao.html.'); }
