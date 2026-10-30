// Converte um desenho do usuário que já usa as cores da folha: grade -> letras da paleta (cor mais próxima); bg = cinza uniforme
import fs from 'node:fs'; import vm from 'node:vm'; import { decodePNG } from './pngdec.mjs';
const ctx = {}; vm.runInNewContext(fs.readFileSync('sprites7.js', 'utf8') + ';this.D=SPR7', ctx); const PAL = ctx.D.pal;
const [file, outJson, S, PX, PY, bgv] = process.argv.slice(2);
const im = decodePNG(file), W = im.w, H = im.h, cs = +S, px0 = +PX, py0 = +PY, BGV = +bgv;
const px = (x, y) => { const i = (y * W + x) * 4; return [im.data[i], im.data[i + 1], im.data[i + 2]]; };
const med = a => { a.sort((p, q) => p - q); return a[a.length >> 1]; };
const hexRGB = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), dist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
const pal = Object.entries(PAL).map(([k, v]) => [k, hexRGB(v)]);
const nx = Math.floor((W - px0) / cs), ny = Math.floor((H - py0) / cs), a0 = Math.round(cs * .3), a1 = Math.round(cs * .7);
let bad = 0;
const g = []; for (let ky = 0; ky < ny; ky++) { let row = ''; for (let kx = 0; kx < nx; kx++) { const R = [], G = [], B = []; for (let y = a0; y <= a1; y++) for (let x = a0; x <= a1; x++) { const c = px(Math.round(px0 + kx * cs + x), Math.round(py0 + ky * cs + y)); R.push(c[0]); G.push(c[1]); B.push(c[2]); }
  const c = [med(R), med(G), med(B)]; if (dist(c, [BGV, BGV, BGV]) <= 12) { row += '.'; continue; } let bk = '?', bd = 1e9; for (const [k, v] of pal) { const d = dist(v, c); if (d < bd) { bd = d; bk = k; } } if (bd > 30) { bad++; console.log('cor sem par', c.join(','), 'melhor', bk, bd); } row += bk; } g.push(row); }
fs.writeFileSync(outJson, JSON.stringify({ w: nx, h: ny, rows: g })); console.log('grade', nx, 'x', ny, 'sem par', bad);
console.log(g.map((r, i) => String(i).padStart(2) + ' ' + r).join('\n'));
