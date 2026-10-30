// Preenche as áreas vazias fechadas pelo contorno com a cor de fundo-de-região mais comum entre os vizinhos (A camisa, B cabelo, C pele, D calça)
import fs from 'node:fs';
const [inJson, outJson] = process.argv.slice(2);
const j = JSON.parse(fs.readFileSync(inJson, 'utf8')), g = j.rows.map(r => [...r]), H = g.length, Wd = g[0].length;
const out = Array.from({ length: H }, () => Array(Wd).fill(false)), st = [];
for (let y = 0; y < H; y++) for (let x = 0; x < Wd; x++) if ((y === 0 || x === 0 || y === H - 1 || x === Wd - 1) && g[y][x] === '.') { out[y][x] = true; st.push([y, x]); }
while (st.length) { const [y, x] = st.pop(); for (const [dy, dx] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const Y = y + dy, X = x + dx; if (Y < 0 || X < 0 || Y >= H || X >= Wd || out[Y][X] || g[Y][X] !== '.') continue; out[Y][X] = true; st.push([Y, X]); } }
const lab = Array.from({ length: H }, () => Array(Wd).fill(0)); let n = 0;
for (let y = 0; y < H; y++) for (let x = 0; x < Wd; x++) if (g[y][x] === '.' && !out[y][x] && !lab[y][x]) { const cells = [], s2 = [[y, x]]; lab[y][x] = ++n; const cnt = {};
  while (s2.length) { const [cy, cx] = s2.pop(); cells.push([cy, cx]); for (const [dy, dx] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const Y = cy + dy, X = cx + dx; if (Y < 0 || X < 0 || Y >= H || X >= Wd) continue; if (g[Y][X] === '.' && !out[Y][X]) { if (!lab[Y][X]) { lab[Y][X] = n; s2.push([Y, X]); } } else if ('ABCD'.includes(g[Y][X])) cnt[g[Y][X]] = (cnt[g[Y][X]] || 0) + 1; } }
  const best = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0]; const k = best ? best[0] : 'A'; console.log('vazio', n, cells.length, 'células ->', k, JSON.stringify(cnt)); cells.forEach(([cy, cx]) => g[cy][cx] = k); }
let rows = g.map(r => r.join('')); let t = 0, b = rows.length - 1; while (/^\.*$/.test(rows[t])) t++; while (/^\.*$/.test(rows[b])) b--; rows = rows.slice(t, b + 1);
let l = 99, r = 0; rows.forEach(s => { const a = s.search(/[^.]/); if (a >= 0) { l = Math.min(l, a); r = Math.max(r, s.length - 1 - [...s].reverse().findIndex(c => c !== '.')); } }); rows = rows.map(s => s.slice(l, r + 1));
fs.writeFileSync(outJson, JSON.stringify({ w: rows[0].length, h: rows.length, rows })); console.log('final', rows[0].length, 'x', rows.length);
