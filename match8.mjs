import fs from 'node:fs'; import vm from 'node:vm'; import { createRequire } from 'node:module';
const require = createRequire(import.meta.url); const { GifReader } = require('omggif');
const ctx = {}; vm.runInNewContext(fs.readFileSync('sprites7.js', 'utf8') + ';this.D=SPR7', ctx); const D = ctx.D;
const hexRGB = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), dist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
const r = new GifReader(fs.readFileSync('sheet8.gif')), W = r.width, H = r.height, buf = new Uint8Array(W * H * 4);
const frames8 = {}; for (let i = 0; i <= 28; i++) { r.decodeAndBlitFrameRGBA(i, buf); if ([1, 16, 28].includes(i)) frames8[i] = buf.slice(); }
const med = a => { a.sort((p, q) => p - q); return a[a.length >> 1]; };
const cell = (b, kx, ky) => { const R = [], G = [], B = []; for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) { const i = ((1 + ky * 3 + y) * W + kx * 3 + x) * 4; R.push(b[i]); G.push(b[i + 1]); B.push(b[i + 2]); } return [med(R), med(G), med(B)]; };
for (const [fi, slot] of [[1, 'walkS'], [16, 'walkW'], [28, 'walkN']]) {
  let best = null;
  for (let f = 0; f < 8; f++) { const rows = D.slots[slot].frames[f]; const fg = []; rows.forEach((s, y) => [...s].forEach((c, x) => { if (c !== '.') fg.push([x, y, hexRGB(D.pal[c])]); }));
    for (let oy = 66; oy <= 86; oy++) for (let ox = 98; ox <= 128; ox++) { let ok = 0; for (const [x, y, col] of fg) { const c = cell(frames8[fi], ox + x, oy + y); if (dist(c, col) < 60) ok++; } const sc = ok / fg.length; if (!best || sc > best.sc) best = { f, ox, oy, sc: +sc.toFixed(3) }; } }
  console.log('quadro', fi, 'melhor com', slot, JSON.stringify(best));
}
