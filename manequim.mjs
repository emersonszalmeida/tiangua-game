// Manequim do personagem: o mesmo corpo/quadros do personagem, com cada parte numa cor diferente para identificar.
// Gera manequim/ (na pasta do jogo): folhas por animação (linhas = vistas, colunas = quadros) + quadros soltos 48×64.
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
import { encodePNG } from './pngenc.mjs';
const SPR7 = new Function(fs.readFileSync('sprites7.js', 'utf8') + '; return SPR7;')();
const IDLES = new Function(fs.readFileSync('idles.js', 'utf8') + '; return IDLES;')();
const { camadaDe } = new Function(fs.readFileSync('camadas.js', 'utf8') + '; return { camadaDe };')();
const CW = 48, CH = 64, VIEWS = ['S', 'SW', 'W', 'NW', 'N'], out = 'manequim';
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), pal = Object.fromEntries(Object.entries(SPR7.pal).map(([k, v]) => [k, hex(v)]));
// cada parte numa cor bem diferente (para identificar); o sombreado original de cada parte é mantido
const COR = { pele: '#ff8fb8', cabelo: '#ffd21f', camiseta: '#2f9bff', calca: '#35d160', sapato: '#ff7a1a' };
const lum = c => .3 * c[0] + .59 * c[1] + .11 * c[2], maxLum = {};
for (const [ch, c] of Object.entries(pal)) { const k = camadaDe(ch); if (k !== 'contorno') maxLum[k] = Math.max(maxLum[k] || 0, lum(c)); }
const corDe = ch => { const k = camadaDe(ch); if (k === 'contorno') return pal[ch]; const f = Math.min(1, Math.max(.45, lum(pal[ch]) / maxLum[k])); return hex(COR[k] || '#a3a3a3').map(v => Math.round(v * f)); };
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
function quadro(rows, h, cx) {
  const ox = Math.round(CW / 2 - (cx + .5)), oy = CH - 2 - h, b = new Uint8Array(CW * CH * 4);
  rows.forEach((line, y) => { for (let x = 0; x < line.length; x++) { const ch = line[x]; if (ch === '.') continue; const c = corDe(ch), p = ((oy + y) * CW + ox + x) * 4; b[p] = c[0]; b[p + 1] = c[1]; b[p + 2] = c[2]; b[p + 3] = 255; } });
  return b;
}
const anims = { parado: Object.fromEntries(VIEWS.map(v => { const g = IDLES[v]; let s = 0, c = 0; g.rows.slice(-6).forEach(r => { for (let i = 0; i < r.length; i++) if (r[i] !== '.') { s += i; c++; } }); return [v, [quadro(g.rows, g.h, s / c)]]; })) };
for (const m of ['andar', 'correr']) anims[m] = Object.fromEntries(VIEWS.map(v => { const s = SPR7.slots[(m === 'andar' ? 'walk' : 'run') + v]; return [v, s.frames.map(f => quadro(f, s.h, s.cx))]; }));
const G = 2, fundo = [0xb4, 0xad, 0xa2];
for (const [nome, vs] of Object.entries(anims)) {
  const cols = Math.max(...Object.values(vs).map(a => a.length)), W = cols * (CW + G) + G, H = VIEWS.length * (CH + G) + G, sh = new Uint8Array(W * H * 4);
  for (let i = 0; i < W * H; i++) { sh[i * 4] = fundo[0]; sh[i * 4 + 1] = fundo[1]; sh[i * 4 + 2] = fundo[2]; sh[i * 4 + 3] = 255; }
  VIEWS.forEach((v, r) => vs[v].forEach((q, c) => { for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) { const s = (y * CW + x) * 4; if (!q[s + 3]) continue; const d = ((G + r * (CH + G) + y) * W + G + c * (CW + G) + x) * 4; sh[d] = q[s]; sh[d + 1] = q[s + 1]; sh[d + 2] = q[s + 2]; sh[d + 3] = 255; }
    const dir = path.join(out, 'quadros', nome, v); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, c + '.png'), encodePNG(CW, CH, q)); }));
  fs.writeFileSync(path.join(out, 'manequim_' + nome + '.png'), encodePNG(W, H, sh));
}
fs.writeFileSync(path.join(out, 'LEIA-ME.txt'), 'Manequim 48x64 (pes a 2 px da borda de baixo). Linhas da folha, de cima para baixo: S, SW, W, NW, N. As vistas SE, E e NE sao as de SW, W e NW espelhadas na horizontal. Cores: pele rosa #ff8fb8, cabelo amarelo #ffd21f, camiseta azul #2f9bff, calca verde #35d160, sapato laranja #ff7a1a; contorno com a cor original; o sombreado original de cada parte foi mantido.\r\n');
console.log('ok', out);
