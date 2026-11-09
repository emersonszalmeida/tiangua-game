// Pega a folha que você editou e exportou do editor-pixel e guarda cada módulo alterado em arte_casa/editadas/<nome>.png; depois remonta as peças.
// uso: node casa_aplicar_edicoes.mjs <caminho do PNG exportado>      (só vale o que está DENTRO da moldura magenta de cada módulo)
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { decodePNG } from './pngdec.mjs';
import { encodePNG } from './pngenc.mjs';
const arq = process.argv[2]; if (!arq) { console.log('uso: node casa_aplicar_edicoes.mjs <png exportado>'); process.exit(1); }
const OUT = './arte_casa/editadas/', MOD = './arte_casa/modulos/', lay = JSON.parse(fs.readFileSync(OUT + 'folha_layout.json', 'utf8')), im = decodePNG(arq);
if (im.w !== lay.largura || im.h !== lay.altura) { console.log('ATENÇÃO: a folha exportada tem ' + im.w + 'x' + im.h + ' e a original ' + lay.largura + 'x' + lay.altura + '. Mantenha o tamanho da tela do editor.'); process.exit(1); }
const mudou = [];
for (const [nome, L] of Object.entries(lay.itens)) {
  const fonte = decodePNG(nome === 'piso' ? './arte_casa/pecas/piso_1.png' : MOD + nome + '.png'), o = new Uint8Array(L.iw * L.ih * 4); let igual = true, vazio = true;
  for (let j = 0; j < L.ih; j++) for (let i = 0; i < L.iw; i++) { const p = ((L.iy + j) * im.w + L.ix + i) * 4, q = (j * L.iw + i) * 4, a = im.data[p + 3] > 0; if (a) { vazio = false; o.set([im.data[p], im.data[p + 1], im.data[p + 2], 255], q); }
    const f = (j * fonte.w + i) * 4, b = fonte.data[f + 3] > 0; if (a !== b || (a && (im.data[p] !== fonte.data[f] || im.data[p + 1] !== fonte.data[f + 1] || im.data[p + 2] !== fonte.data[f + 2]))) igual = false; }
  if (vazio) { console.log('  ' + nome + ': ficou vazio, ignorado'); continue; }
  if (igual) continue;
  fs.writeFileSync(OUT + nome + '.png', encodePNG(L.iw, L.ih, o)); mudou.push(nome);
}
console.log(mudou.length ? 'módulos editados: ' + mudou.join(', ') : 'nenhum módulo mudou');
if (mudou.length) { for (const s of ['casa_piso.mjs', 'casa_toras.mjs']) { const r = spawnSync(process.execPath, [s], { stdio: 'inherit' }); if (r.status) process.exit(r.status); } console.log('peças remontadas em arte_casa/pecas. Abra casa_pecas.html.'); }
