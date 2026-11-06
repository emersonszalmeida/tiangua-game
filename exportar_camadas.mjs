// Exporta cada parte do personagem em PNGs separados: personagem_camadas/<parte>/<animação>/<vista>/<quadro>.png
// (48×64, mesmos alinhamentos de personagem/). Somando as partes de um quadro volta o quadro original.
import fs from 'node:fs';
import path from 'node:path';
import { encodePNG } from './pngenc.mjs';
const SPR7 = new Function(fs.readFileSync('sprites7.js', 'utf8') + '; return SPR7;')();
const IDLES = new Function(fs.readFileSync('idles.js', 'utf8') + '; return IDLES;')();
const { CAMADAS, camadaDe } = new Function(fs.readFileSync('camadas.js', 'utf8') + '; return { CAMADAS, camadaDe };')();
const CW = 48, CH = 64, VIEWS = ['S', 'SW', 'W', 'NW', 'N'], out = 'personagem_camadas';
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), pal = Object.fromEntries(Object.entries(SPR7.pal).map(([k, v]) => [k, hex(v)]));
fs.rmSync(out, { recursive: true, force: true });
let n = 0;
function exporta(rows, w, h, cx, dir, nome) {
  const ox = Math.round(CW / 2 - (cx + .5)), oy = CH - 2 - h, bufs = Object.fromEntries(Object.keys(CAMADAS).map(k => [k, new Uint8Array(CW * CH * 4)]));
  rows.forEach((line, y) => { for (let x = 0; x < line.length; x++) { const ch = line[x]; if (ch === '.') continue; const b = bufs[camadaDe(ch)], p = ((oy + y) * CW + ox + x) * 4, c = pal[ch]; b[p] = c[0]; b[p + 1] = c[1]; b[p + 2] = c[2]; b[p + 3] = 255; } });
  for (const [k, b] of Object.entries(bufs)) { const d = path.join(out, k, dir); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, nome + '.png'), encodePNG(CW, CH, b)); n++; }
}
for (const v of VIEWS) { const g = IDLES[v]; let s = 0, c = 0; g.rows.slice(-6).forEach(r => { for (let i = 0; i < r.length; i++) if (r[i] !== '.') { s += i; c++; } }); exporta(g.rows, g.w, g.h, s / c, 'parado', v); }
for (const m of ['andar', 'correr']) for (const v of VIEWS) { const s = SPR7.slots[(m === 'andar' ? 'walk' : 'run') + v]; s.frames.forEach((f, i) => exporta(f, s.w, s.h, s.cx, `${m}/${v}`, String(i))); }
console.log(n, 'arquivos em', out);
