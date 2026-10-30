// Parado NW: corpo/braços do quadro 0 do andar NW, pernas retas e paralelas (pés lado a lado, sem passo)
import fs from 'node:fs'; import vm from 'node:vm';
const ctx = {}; vm.runInNewContext(fs.readFileSync('sprites7.js', 'utf8') + ';this.D=SPR7', ctx); const D = ctx.D;
const src = D.slots.walkNW.frames[0].map(r => [...r]), W = D.slots.walkNW.w;
const g = src.map(r => r.slice());
const shiftRow = (row, from, to, dx) => { // move trecho [from,to] da linha original por dx
  const seg = src[row].slice(from, to + 1); for (let x = from; x <= to; x++) g[row][x] = '.';
  seg.forEach((ch, i) => { if (ch !== '.') g[row][from + i + dx] = ch; });
};
// pernas: linhas 47-50 repetem o molde da linha 46 (esquerda x9-16, direita x16-21)
for (let y = 47; y <= 50; y++) g[y] = src[46].slice();
// pés: pé esquerdo desloca 2 à esquerda, direito 1
for (let y = 51; y <= 53; y++) { g[y] = Array(W).fill('.'); }
const put = (y, x0, s) => [...s].forEach((c, i) => { if (c !== '.') g[y][x0 + i] = c; });
// pé esquerdo (original x11..16) -> x9..14 ; pé direito (original x17..21) -> x16..20
put(51, 9, 'IKKKNI'); put(52, 9, 'IKNNNII'); put(53, 9, 'IIIII');
put(51, 16, 'IDDKI'); put(52, 16, 'IIKKKI'.slice(0, 6)); put(53, 17, 'III');
const rows = g.map(r => r.join(''));
fs.writeFileSync('idle_nw.js', 'const IDLE_NW = ' + JSON.stringify({ w: W, h: rows.length, pal: D.pal, rows }) + ';\n');
rows.slice(36).forEach((r, i) => console.log(String(i + 36).padStart(2), r));
