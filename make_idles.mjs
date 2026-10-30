// Poses paradas: pernas retas e paralelas, pés lado a lado. Parte do quadro de andar mais "parado" de cada vista.
import fs from 'node:fs'; import vm from 'node:vm';
const ctx = {}; vm.runInNewContext(fs.readFileSync('sprites7.js', 'utf8') + ';this.D=SPR7;' + fs.readFileSync('idle12.js', 'utf8') + ';this.N=IDLE12', ctx); const D = ctx.D;
const grid = (slot, f) => D.slots[slot].frames[f].map(r => [...r]);
const setRow = (g, y, x0, s) => { for (let x = 0; x < g[y].length; x++) g[y][x] = '.'; [...s].forEach((c, i) => { g[y][x0 + i] = c; }); };
const out = {};
// ---- S (frente): a perna direita vira o espelho da esquerda (eixo no contorno central x=12) ----
{ const g = grid('walkS', 0); for (let y = 44; y <= 52; y++) { const L = g[y].slice(); for (let x = 13; x < g[y].length; x++) g[y][x] = '.'; for (let x = 0; x < 12; x++) if (L[x] !== '.') g[y][24 - x] = L[x]; if (y >= 50) g[y][12] = '.'; } out.S = g; }
// ---- N (costas): pés na mesma altura (espelha o pé direito no esquerdo, eixo x=11) ----
{ const g = grid('walkN', 4); for (let y = 51; y <= 54; y++) for (let x = 0; x < g[y].length; x++) g[y][x] = '.';
  const put = (y, x0, s) => [...s].forEach((c, i) => { g[y][x0 + i] = c; });
  put(51, 5, 'IKKKKI'); put(52, 6, 'IIII'); put(51, 12, 'IKKKKI'); put(52, 13, 'IIII'); for (let y = 43; y <= 50; y++) { /* pernas já simétricas */ } g[51][11] = '.'; out.N = g; }
// ---- W (perfil): pernas retas lado a lado, os dois pés juntos ----
{ const g = grid('walkW', 0); const row = (y, x0, str) => { for (let x = 0; x < g[y].length; x++) if (x >= 7) g[y][x] = '.'; [...str].forEach((c, i) => { g[y][x0 + i] = c; }); };
  for (let y = 45; y <= 50; y++) row(y, 9, 'EDDDDDDE');
  for (let y = 51; y <= 53; y++) for (let x = 0; x < g[y].length; x++) g[y][x] = '.';
  const put = (y, x0, str) => [...str].forEach((c, i) => { g[y][x0 + i] = c; });
  put(51, 8, 'IKKKKKNI'); put(52, 8, 'IIIIIIII'); out.W = g; }
// ---- SW (3/4 frente): pernas retas e paralelas, pés na mesma altura ----
{ const g = grid('walkSW', 0); const base = g[40].map((c, x) => x <= 19 ? c : '.'); for (let y = 41; y <= 49; y++) g[y] = base.slice();
  for (let y = 50; y <= 53; y++) for (let x = 0; x < g[y].length; x++) g[y][x] = '.';
  const put = (y, x0, s) => [...s].forEach((c, i) => { g[y][x0 + i] = c; });
  put(50, 8, 'IKKKNIIKKKKI'); put(51, 8, 'IKKKIIIKKKKI'.slice(0, 12)); put(52, 9, 'IIIII'); put(52, 14, 'IIIII'); out.SW = g; }
// ---- NW: o desenho do usuário com 1 linha a mais nas pernas (53 -> 54, como as outras vistas) ----
{ const rows = ctx.N.rows.slice(); rows.splice(44, 0, rows[44]); out.NW = rows.map(r => [...r]); }
// recortes feitos pelo usuário (convertidos por conv_cut.mjs) substituem as poses montadas
for (const [k, f] of [['S', 'cutS.json'], ['N', 'cutN.json'], ['W', 'cutW.json'], ['SW', 'cutSW.json']]) if (fs.existsSync(f)) { const rows = JSON.parse(fs.readFileSync(f, 'utf8')).rows.map(r => [...r]); // sapatos: marrom e contorno da folha (K e I), em vez do vermelho-escuro do cenário
    rows.slice(-5).forEach(r => r.forEach((c, i) => { if (c === 'S') r[i] = 'K'; else if (c === 'F') r[i] = 'I'; })); if (k === 'W' || k === 'SW') rows.forEach(r => r.reverse()); // os recortes olham para a direita (E / SE); os slots W e SW olham para a esquerda
    out[k] = rows; }
if (fs.existsSync('nw2_filled.json')) out.NW = JSON.parse(fs.readFileSync('nw2_filled.json', 'utf8')).rows.map(r => [...r]); // NW redesenhado pelo usuário
{ const NW_ALVO = 55; /* altura média do NW andando (53 a 57) */ while (out.NW.length < NW_ALVO) out.NW.splice(47, 0, out.NW[47].slice()); } // alonga as pernas repetindo linhas retas
{ const W_ALVO = 55; /* altura média do perfil andando (52 a 55) */ const w = out.W; while (w.length > W_ALVO) { let i = -1; for (let y = 40; y < w.length - 1; y++) if (w[y].join('') === w[y + 1].join('')) { i = y; break; } if (i < 0) break; w.splice(i, 1); } }
// N e SW também ficam em 55 (todas as paradas entre 54 e 55): tira linhas de perna repetidas
for (const k of ['N', 'SW', 'S']) { const a = out[k]; while (a.length > 55) { let i = -1; for (let y = 40; y < a.length - 1; y++) if (a[y].join('') === a[y + 1].join('')) { i = y; break; } if (i < 0) break; a.splice(i, 1); } }
// perfil: o pedacinho do outro sapato (acima do tornozelo) desce 1 pixel
{ const w = out.W; for (let y = 44; y <= 50; y++) { const i = w[y].join('').indexOf('IK'); if (i >= 0 && w[y][i + 2] === 'E') { const under = w[y + 1][i + 1] === 'I'; w[y][i] = '.'; w[y][i + 1] = '.'; if (under) w[y + 1][i + 1] = '.'; w[y + 1][i] = 'I'; w[y + 1][i + 1] = 'K'; if (under) w[y + 2][i + 1] = 'I'; break; } } }
// perfil: o E exatamente como o usuário ajustou (olha para a direita); o slot W olha para a esquerda, então é o espelho
if (fs.existsSync('drawE.json')) out.W = JSON.parse(fs.readFileSync('drawE.json', 'utf8')).rows.map(r => [...r].reverse());
const res = {}; for (const [k, g] of Object.entries(out)) { const rows = g.map(r => r.join('')); let t = 0, b = rows.length - 1; while (/^\.*$/.test(rows[t])) t++; while (/^\.*$/.test(rows[b])) b--; res[k] = { w: rows[0].length, h: b - t + 1, rows: rows.slice(t, b + 1) }; }
fs.writeFileSync('idles.js', 'const IDLES = ' + JSON.stringify({ pal: D.pal, ...res }) + ';\n');
for (const k of Object.keys(res)) console.log(k, res[k].w, 'x', res[k].h);
