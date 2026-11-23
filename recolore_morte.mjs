// Troca as cores do manequim (por parte) pelas cores originais do jogo. Uso: node recolore_morte.mjs entrada.png saida.png
import fs from 'node:fs';
import { encodePNG } from './pngenc.mjs'; import { decodePNG } from './pngdec.mjs';
const SPR7 = new Function(fs.readFileSync('sprites7.js', 'utf8') + '; return SPR7;')();
const { camadaDe } = new Function(fs.readFileSync('camadas.js', 'utf8') + '; return { camadaDe };')();
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), pal = Object.fromEntries(Object.entries(SPR7.pal).map(([k, v]) => [k, hex(v)]));
const COR = { pele: '#ff8fb8', cabelo: '#ffd21f', camiseta: '#2f9bff', calca: '#35d160', sapato: '#ff7a1a' };
const lum = c => .3 * c[0] + .59 * c[1] + .11 * c[2], maxLum = {};
for (const [ch, c] of Object.entries(pal)) { const k = camadaDe(ch); if (k !== 'contorno') maxLum[k] = Math.max(maxLum[k] || 0, lum(c)); }
const mapa = new Map(); // cor do manequim -> cor do jogo (a mais clara/representativa em caso de empate)
for (const [ch, c] of Object.entries(pal)) { const k = camadaDe(ch); if (k === 'contorno' || !COR[k]) continue; const f = Math.min(1, Math.max(.45, lum(c) / maxLum[k])); const m = hex(COR[k]).map(v => Math.round(v * f)); const key = m.join(','); if (!mapa.has(key)) mapa.set(key, c); }
const ent = [...mapa.keys()].map(k => [k.split(',').map(Number), mapa.get(k)]);
const [, , a, b] = process.argv, I = decodePNG(a), out = new Uint8Array(I.data), keep = new Map(); let troc = 0, sobra = 0;
for (let i = 0; i < I.w * I.h; i++) {
  if (!I.data[i * 4 + 3]) continue; const c = [I.data[i * 4], I.data[i * 4 + 1], I.data[i * 4 + 2]], k = c.join(',');
  let alvo = mapa.get(k);
  if (!alvo) { let best = 1e9, bc; for (const [m, g] of ent) { const d = (m[0] - c[0]) ** 2 + (m[1] - c[1]) ** 2 + (m[2] - c[2]) ** 2; if (d < best) { best = d; bc = g; } } if (best <= 40 * 40) alvo = bc; }
  if (alvo) { out.set(alvo, i * 4); troc++; } else { sobra++; keep.set(k, (keep.get(k) || 0) + 1); }
}
fs.writeFileSync(b, encodePNG(I.w, I.h, out)); console.log(I.w + 'x' + I.h, 'trocados', troc, 'mantidos', sobra, [...keep].slice(0, 12));
