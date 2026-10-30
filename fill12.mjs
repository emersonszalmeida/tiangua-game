import fs from 'node:fs'; import vm from 'node:vm';
const ctx = {}; vm.runInNewContext(fs.readFileSync('sprites7.js', 'utf8') + ';this.D=SPR7', ctx); const PAL = ctx.D.pal;
const hexRGB = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), dist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
const cells = JSON.parse(fs.readFileSync('cells12.json', 'utf8'));
const pal = Object.entries(PAL).map(([k, v]) => [k, hexRGB(v)]);
let g = cells.map(r => r.map(c => { if (!c || dist(c, [64, 64, 64]) < 10) return '.'; let bk = '?', bd = 1e9; for (const [k, v] of pal) { const d = dist(v, c); if (d < bd) { bd = d; bk = k; } } return bd < 12 ? bk : '?' + bk; }));
console.log(g.map((r, y) => String(y).padStart(2) + ' ' + r.map(c => c[0] === '?' ? '?' : c).join('')).join('\n'));
fs.writeFileSync('grid12.json', JSON.stringify(g));
// ---- preenche o que ficou vazado (regiões fechadas pelo contorno) ----
const H = g.length, Wd = g[0].length, at = (y, x) => (y >= 0 && x >= 0 && y < H && x < Wd) ? g[y][x] : '.';
const out = Array.from({ length: H }, () => Array(Wd).fill(false)), st = [];
for (let y = 0; y < H; y++) for (let x = 0; x < Wd; x++) if ((y === 0 || x === 0 || y === H - 1 || x === Wd - 1) && g[y][x] === '.') { out[y][x] = true; st.push([y, x]); }
while (st.length) { const [y, x] = st.pop(); for (const [dy, dx] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const Y = y + dy, X = x + dx; if (Y < 0 || X < 0 || Y >= H || X >= Wd || out[Y][X] || g[Y][X] !== '.') continue; out[Y][X] = true; st.push([Y, X]); } }
const lab = Array.from({ length: H }, () => Array(Wd).fill(0)); const comps = []; 
for (let y = 0; y < H; y++) for (let x = 0; x < Wd; x++) if (g[y][x] === '.' && !out[y][x] && !lab[y][x]) { const id = comps.length + 1, c = { id, cells: [] }, s2 = [[y, x]]; lab[y][x] = id; while (s2.length) { const [cy, cx] = s2.pop(); c.cells.push([cy, cx]); for (const [dy, dx] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const Y = cy + dy, X = cx + dx; if (Y < 0 || X < 0 || Y >= H || X >= Wd || lab[Y][X] || g[Y][X] !== '.' || out[Y][X]) continue; lab[Y][X] = id; s2.push([Y, X]); } } comps.push(c); }
comps.forEach(c => { const ys = c.cells.map(p => p[0]), xs = c.cells.map(p => p[1]); c.bb = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; console.log('vazio', c.id, 'células', c.cells.length, 'caixa x', c.bb[0], '-', c.bb[2], 'y', c.bb[1], '-', c.bb[3]); });
const COLOR = c => { const [x0, y0, x1, y1] = c.bb, cy = (y0 + y1) / 2; if (cy < 22) return 'B'; if (cy >= 43) return 'D'; if (x1 <= 12 && y0 >= 28) return 'C'; return 'A'; };
comps.forEach(c => { const k = COLOR(c); c.cells.forEach(([y, x]) => g[y][x] = k); });
let rows = g.map(r => r.map(c => c[0] === '?' ? c[1] : c).join(''));
let t = 0, b = rows.length - 1; while (/^\.*$/.test(rows[t])) t++; while (/^\.*$/.test(rows[b])) b--; rows = rows.slice(t, b + 1);
let l = 99, r = 0; rows.forEach(s => { const a = s.search(/[^.]/); if (a >= 0) { l = Math.min(l, a); r = Math.max(r, s.length - 1 - [...s].reverse().findIndex(c => c !== '.')); } }); rows = rows.map(s => s.slice(l, r + 1));
console.log('final', rows[0].length, 'x', rows.length); console.log(rows.map((s, i) => String(i).padStart(2) + ' ' + s).join('\n'));
fs.writeFileSync('idle12.js', 'const IDLE12 = ' + JSON.stringify({ w: rows[0].length, h: rows.length, cx: 12 - l, pal: PAL, rows }) + ';\n');
