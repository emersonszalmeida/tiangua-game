// Exporta as peças do chão em PNG: chao_tiles/base_<textura>.png (tile losango 128×64) e chao_tiles/transicoes_<material>.png (folha com todas as peças de encontro)
import fs from 'node:fs';
import { encodePNG } from './pngenc.mjs';
const { CHAO } = new Function(fs.readFileSync('chao.js', 'utf8') + '; return { CHAO };')();
const L = new Function(fs.readFileSync('chao_lib.js', 'utf8') + '; return { MATS, VIZ, normMask, pieceFor, PN };')();
const N = CHAO.n, PAL = CHAO.pal.map(h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)));
const tex = nm => { const s = CHAO.tex[nm]; return k => PAL[s.charCodeAt(k) - 65]; };
const out = 'chao_tiles'; fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out);
const TW = 128, TH = 64;
// desenha um tile losango: cor(u,v) devolve [r,g,b] ou null
function tile(buf, W, ox, oy, cor) {
  for (let sy = 0; sy < TH; sy++) for (let sx = 0; sx < TW; sx++) {
    const px = sx - 64, x = (px / 64 + (sy + .5) / 32) / 2, y = ((sy + .5) / 32 - px / 64) / 2; if (x < 0 || y < 0 || x >= 1 || y >= 1) continue;
    const c = cor(Math.floor(x * N), Math.floor(y * N)); if (!c) continue; const o = ((oy + sy) * W + ox + sx) * 4; buf[o] = c[0]; buf[o + 1] = c[1]; buf[o + 2] = c[2]; buf[o + 3] = 255;
  }
}
for (const nm of CHAO.nomes) { const t = tex(nm), b = new Uint8Array(TW * TH * 4); tile(b, TW, 0, 0, (u, v) => t(v * N + u)); fs.writeFileSync(`${out}/base_${nm}.png`, encodePNG(TW, TH, b)); }
const masks = [...new Set(Array.from({ length: 256 }, (_, m) => L.normMask(m)))].filter(m => m).sort((a, b) => a - b);
for (const [mat, d] of Object.entries(L.MATS)) {
  if (!d.borda) continue; const t = tex(d.prim), COLS = 8, ROWS = Math.ceil(masks.length / COLS), W = COLS * (TW + 4), H = ROWS * (TH + 4), b = new Uint8Array(W * H * 4);
  masks.forEach((m, i) => { const p = L.pieceFor(m); tile(b, W, (i % COLS) * (TW + 4) + 2, ((i / COLS) | 0) * (TH + 4) + 2, (u, v) => { const c = p[v * N + u]; if (!c) return null; const q = t(v * N + u), f = c === 2 ? .55 : 1; return [q[0] * f, q[1] * f, q[2] * f]; }); });
  fs.writeFileSync(`${out}/transicoes_${mat}.png`, encodePNG(W, H, b));
}
console.log('ok', CHAO.nomes.length, 'tiles base,', masks.length, 'peças de encontro por material');
