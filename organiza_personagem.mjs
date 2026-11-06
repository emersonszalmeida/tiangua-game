// Exporta os sprites do personagem (sprites7.js + idles.js) para personagem/<animação>/<vista>/<quadro>.png,
// todos 48×64, pés centrados na coluna 24 e solo na linha 62. Também diz quais quadros são espelho de outros.
import fs from 'node:fs';
import path from 'node:path';
import { encodePNG } from './pngenc.mjs';
const SPR7 = new Function(fs.readFileSync('sprites7.js', 'utf8') + '; return SPR7;')();
const IDLES = new Function(fs.readFileSync('idles.js', 'utf8') + '; return IDLES;')();
const CW = 48, CH = 64, VIEWS = ['S', 'SW', 'W', 'NW', 'N'], out = 'personagem';
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const pal = Object.fromEntries(Object.entries(SPR7.pal).map(([k, v]) => [k, hex(v)]));
const place = (rows, w, h, cx) => { const buf = new Uint8Array(CW * CH * 4), ox = Math.round(CW / 2 - (cx + .5)), oy = CH - 2 - h;
  rows.forEach((line, y) => { for (let x = 0; x < line.length; x++) { const ch = line[x]; if (ch === '.') continue; const X = ox + x, Y = oy + y; if (X < 0 || X >= CW) throw new Error('corte'); const p = (Y * CW + X) * 4, c = pal[ch]; buf[p] = c[0]; buf[p + 1] = c[1]; buf[p + 2] = c[2]; buf[p + 3] = 255; } });
  return buf; };
const flip = b => { const o = new Uint8Array(b.length); for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) for (let i = 0; i < 4; i++) o[(y * CW + x) * 4 + i] = b[(y * CW + (CW - 1 - x)) * 4 + i]; return o; };
const same = (a, b) => { let diff = 0, tot = 0; for (let i = 0; i < a.length; i += 4) { const A = a[i + 3] > 0, B = b[i + 3] > 0; if (A || B) { tot++; if (A !== B || a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) diff++; } } return 1 - diff / tot; };
fs.rmSync(out, { recursive: true, force: true });
const save = (dir, name, buf) => { fs.mkdirSync(path.join(out, dir), { recursive: true }); fs.writeFileSync(path.join(out, dir, name + '.png'), encodePNG(CW, CH, buf)); };
for (const v of VIEWS) { const g = IDLES[v]; let s = 0, n = 0; g.rows.slice(-6).forEach(r => { for (let i = 0; i < r.length; i++) if (r[i] !== '.') { s += i; n++; } }); save('parado', v, place(g.rows, g.w, g.h, s / n)); }
for (const m of ['andar', 'correr']) for (const v of VIEWS) {
  const s = SPR7.slots[(m === 'andar' ? 'walk' : 'run') + v], fr = s.frames.map(f => place(f, s.w, s.h, s.cx));
  fr.forEach((b, i) => save(`${m}/${v}`, String(i), b));
  if (v === 'S' || v === 'N') { const pares = []; for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) { const q = same(flip(fr[i]), fr[j]); if (q > (m === "andar" ? .6 : .9)) pares.push(`${i}↔${j} (${Math.round(q * 100)}%)`); } console.log(m, v, 'quadros espelhados entre si:', pares.join(', ') || 'nenhum'); }
}
