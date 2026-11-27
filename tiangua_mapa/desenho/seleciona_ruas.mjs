// Escolhe, entre as ruas reais adaptadas (ruas_jogo.js), as que o traço de caneta cobre. Não deforma nenhuma rua: só decide quais ficam.
// uso: node desenho/seleciona_ruas.mjs [tol_px=9] [cobertura=.6] [vao_m=30]
import fs from 'node:fs';
const TOL = +(process.argv[2] || 9), COB = +(process.argv[3] || .6), VAO = +(process.argv[4] || 30);
const gr = JSON.parse(fs.readFileSync('desenho/grafo.json', 'utf8')), esc = 1.786831150110245, ox = 2510.7418481904406, oy = 2003.26400322078;
const { RUAS, RUAS_LIM } = eval('(()=>{' + fs.readFileSync('ruas_jogo.js', 'utf8') + ';return {RUAS,RUAS_LIM}})()');
const W = 2480, H = 1754, N = W * H;
// raster do esqueleto + distância (chanfro)
const D = new Float32Array(N).fill(1e4); const pen = []; 
for (const e of gr.arestas) for (let k = 0; k < e.p.length; k += 2) { const x = Math.round(e.p[k]), y = Math.round(e.p[k + 1]); if (x >= 0 && y >= 0 && x < W && y < H) { D[y * W + x] = 0; pen.push([x, y]); } }
for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const i = y * W + x; D[i] = Math.min(D[i], D[i - 1] + 1, D[i - W] + 1, D[i - W - 1] + 1.414, D[i - W + 1] + 1.414); }
for (let y = H - 2; y > 0; y--) for (let x = W - 2; x > 0; x--) { const i = y * W + x; D[i] = Math.min(D[i], D[i + 1] + 1, D[i + W] + 1, D[i + W + 1] + 1.414, D[i + W - 1] + 1.414); }
const px = (x, z) => [(x * esc + ox) * .5, (z * esc + oy) * .5];
const dist = (X, Y, sx, sy) => { const x = Math.round(X + sx), y = Math.round(Y + sy); return x < 1 || y < 1 || x >= W - 1 || y >= H - 1 ? 1e4 : D[y * W + x]; };
// amostras de cada rua a cada ~2 px de imagem (~2,2 m do jogo)
const amostra = []; // por rua, por trecho: lista de [X,Y]
for (const r of RUAS) { const segs = []; for (let i = 2; i < r.p.length; i += 2) { const a = px(r.p[i - 2], r.p[i - 1]), b = px(r.p[i], r.p[i + 1]), L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(2, Math.round(L / 2)), s = []; for (let t = 0; t <= n; t++) s.push([a[0] + (b[0] - a[0]) * t / n, a[1] + (b[1] - a[1]) * t / n]); segs.push({ s, L }); } amostra.push(segs); }
// deslocamento global (a foto/mão pode estar alguns px fora): procura o que mais cobre
let best = [0, 0, -1];
for (let sy = -10; sy <= 10; sy += 1) for (let sx = -10; sx <= 10; sx += 1) { let ok = 0, tot = 0; for (let ri = 0; ri < RUAS.length; ri += 3) for (const sg of amostra[ri]) for (let q = 0; q < sg.s.length; q += 3) { tot++; if (dist(sg.s[q][0], sg.s[q][1], sx, sy) <= TOL) ok++; } if (ok > best[2]) best = [sx, sy, ok]; }
console.log('deslocamento ótimo (px):', best[0], best[1]);
const [SX, SY] = best;
// cada ponto da caneta reivindica só a amostra de rua real mais próxima (dentro da tolerância): ruas paralelas coladas não ficam as duas
const CEL = 12, hash = new Map(), flat = [];
RUAS.forEach((r, ri) => amostra[ri].forEach((sg, si) => sg.s.forEach((p, q) => { const id = flat.length; flat.push([ri, si, q, p[0] + SX, p[1] + SY]); const k = Math.floor((p[0] + SX) / CEL) + ',' + Math.floor((p[1] + SY) / CEL); (hash.get(k) || hash.set(k, []).get(k)).push(id); })));
const reiv = new Uint8Array(flat.length);
for (const [x, y] of pen) { let bd = TOL, bi = -1; const cx = Math.floor(x / CEL), cy = Math.floor(y / CEL); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) for (const id of hash.get((cx + dx) + ',' + (cy + dy)) || []) { const d = Math.hypot(flat[id][3] - x, flat[id][4] - y); if (d < bd) { bd = d; bi = id; } } if (bi >= 0) reiv[bi] = 1; }
const cob = amostra.map(sg => sg.map(x => new Uint8Array(x.s.length))); flat.forEach((f, id) => { if (reiv[id]) cob[f[0]][f[1]][f[2]] = 1; });
const out = []; let totSeg = 0, mantidos = 0; const KEEP = [];
RUAS.forEach((r, ri) => {
  const segs = amostra[ri], keep = segs.map((sg, si) => { const c = cob[ri][si], n = c.length; let ok = 0; for (let q = 0; q < n; q++) { let hit = 0; for (let d = -4; d <= 4 && !hit; d++) if (c[q + d]) hit = 1; ok += hit; } return ok / n >= COB; });
  const mpp = 1 / (esc * .5);
  for (let i = 0; i < keep.length; i++) if (!keep[i]) { let j = i, len = 0; while (j < keep.length && !keep[j]) { len += segs[j].L * mpp; j++; } if (i > 0 && j < keep.length && len <= VAO) for (let k = i; k < j; k++) keep[k] = true; i = j; }
  KEEP[ri] = keep;
});
// linhas quase iguais (pistas coladas, ruas sobrepostas): fica a mais larga; a outra some onde estiver 70% dentro de 4 px dela
const occ = new Map(), OC = 4, ordem = RUAS.map((r, i) => i).sort((a, b) => RUAS[b].w - RUAS[a].w);
if (process.argv[5] === 'dedup') for (const ri of ordem) { const adds = []; amostra[ri].forEach((sg, si) => { if (!KEEP[ri][si]) return; let dup = 0; for (const [X, Y] of sg.s) { const cx = Math.floor(X / OC), cy = Math.floor(Y / OC); let hit = 0; for (let dy = -1; dy <= 1 && !hit; dy++) for (let dx = -1; dx <= 1 && !hit; dx++) { const l = occ.get((cx + dx) + ',' + (cy + dy)); if (l && l.some(o => o !== ri)) hit = 1; } dup += hit; } if (dup / sg.s.length >= .7) KEEP[ri][si] = false; else adds.push(sg); }); for (const sg of adds) for (const [X, Y] of sg.s) { const k = Math.floor(X / OC) + ',' + Math.floor(Y / OC); (occ.get(k) || occ.set(k, []).get(k)).push(ri); } }
RUAS.forEach((r, ri) => {
  const segs = amostra[ri], keep = KEEP[ri];
  totSeg += keep.length; let run = null;
  for (let i = 0; i < keep.length; i++) { const a = [r.p[2 * i], r.p[2 * i + 1]], b = [r.p[2 * i + 2], r.p[2 * i + 3]]; if (keep[i]) { mantidos++; if (!run) run = [a[0], a[1]]; run.push(b[0], b[1]); } else if (run) { out.push({ c: r.c, w: r.w, p: run }); run = null; } }
  if (run) out.push({ c: r.c, w: r.w, p: run });
});
const comp = p => { let L = 0; for (let i = 2; i < p.length; i += 2) L += Math.hypot(p[i] - p[i - 2], p[i + 1] - p[i - 1]); return L; };
for (let i = out.length - 1; i >= 0; i--) if (comp(out[i].p) < 12) out.splice(i, 1);   // pedacinhos soltos
// buracos ENTRE duas ruas diferentes (a rua real acaba, a caneta continua): liga as pontas se a caneta passa entre elas
const U = k => [Math.sin(k * Math.PI / 4), Math.cos(k * Math.PI / 4)];
function octi(a, b) { const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz); if (L < .01) return [];
  const k0 = Math.round(Math.atan2(dx, dz) / (Math.PI / 4)), cand = [];
  for (const k1 of [k0, k0 + 1, k0 - 1]) for (const k2 of [k0, k0 + 1, k0 - 1]) { if (k1 === k2) continue; const [u1x, u1z] = U(k1), [u2x, u2z] = U(k2), det = u1x * u2z - u1z * u2x; if (Math.abs(det) < 1e-6) continue; const s1 = (dx * u2z - dz * u2x) / det, t = (u1x * dz - u1z * dx) / det; if (s1 >= -1e-6 && t >= -1e-6) cand.push({ k1, k2, s: s1, t }); }
  if (!cand.length) return [b]; const c = cand.filter(q => q.k1 === k0).sort((p, q) => (p.s + p.t) - (q.s + q.t))[0] || cand[0]; const [u1x, u1z] = U(c.k1), [u2x, u2z] = U(c.k2), h = c.s / 2;
  const p1 = [a[0] + u1x * h, a[1] + u1z * h]; return [p1, [p1[0] + u2x * c.t, p1[1] + u2z * c.t], b]; }
const dSeg = (x, y, ax, ay, bx, by) => { const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1e-9, t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / L2)); return Math.hypot(x - ax - t * dx, y - ay - t * dy); };
const solta = (ri, x, y) => { for (let j = 0; j < out.length; j++) { if (j === ri) continue; const p = out[j].p; for (let i = 2; i < p.length; i += 2) if (dSeg(x, y, p[i - 2], p[i - 1], p[i], p[i + 1]) < 3) return false; } return true; };   // ponta solta = nenhuma outra rua encosta nela
const pontas = []; out.forEach((r, i) => { for (const [x, y] of [[r.p[0], r.p[1]], [r.p[r.p.length - 2], r.p[r.p.length - 1]]]) if (solta(i, x, y)) pontas.push([i, x, y]); });
const GAPMAX = +(process.argv[6] || 45); let lig = 0;
for (let a = 0; a < pontas.length; a++) for (let b = a + 1; b < pontas.length; b++) { const A = pontas[a], B = pontas[b]; if (A[0] === B[0]) continue; const d = Math.hypot(A[1] - B[1], A[2] - B[2]); if (d < 2.5 || d > GAPMAX) continue;
  // algum outro ponto já liga os dois? (outra ponta a < 2.5 m de cada um)
  let jaLiga = false; for (const o of out) { const e = [[o.p[0], o.p[1]], [o.p[o.p.length - 2], o.p[o.p.length - 1]]]; if (e.some(q => Math.hypot(q[0] - A[1], q[1] - A[2]) < 2.5) && e.some(q => Math.hypot(q[0] - B[1], q[1] - B[2]) < 2.5)) { jaLiga = true; break; } } if (jaLiga) continue;
  const pa = px(A[1], A[2]), pb = px(B[1], B[2]); let ok = 0, n = Math.max(3, Math.round(Math.hypot(pb[0] - pa[0], pb[1] - pa[1]) / 2)); for (let t = 0; t <= n; t++) { if (dist(pa[0] + (pb[0] - pa[0]) * t / n, pa[1] + (pb[1] - pa[1]) * t / n, SX, SY) <= TOL + 2) ok++; }
  if (ok / (n + 1) < .85) continue; const w = Math.max(out[A[0]].w, out[B[0]].w), c = out[A[0]].w >= out[B[0]].w ? out[A[0]].c : out[B[0]].c; const pts = [[A[1], A[2]], ...octi([A[1], A[2]], [B[1], B[2]])]; out.push({ c, w, p: pts.flat().map(v => +v.toFixed(2)) }); lig++; }
console.log('buracos ligados:', lig);
// traço de caneta que NÃO tem rua real por baixo (rua que você inventou): conta e lista onde
const R = RUAS.flatMap(r => { const s = []; for (let i = 2; i < r.p.length; i += 2) { const a = px(r.p[i - 2], r.p[i - 1]), b = px(r.p[i], r.p[i + 1]), n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 2)); for (let t = 0; t <= n; t++) s.push([a[0] + (b[0] - a[0]) * t / n, a[1] + (b[1] - a[1]) * t / n]); } return s; });
const DR = new Float32Array(N).fill(1e4); for (const [X, Y] of R) { const x = Math.round(X + SX), y = Math.round(Y + SY); if (x >= 0 && y >= 0 && x < W && y < H) DR[y * W + x] = 0; }
for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const i = y * W + x; DR[i] = Math.min(DR[i], DR[i - 1] + 1, DR[i - W] + 1, DR[i - W - 1] + 1.414, DR[i - W + 1] + 1.414); }
for (let y = H - 2; y > 0; y--) for (let x = W - 2; x > 0; x--) { const i = y * W + x; DR[i] = Math.min(DR[i], DR[i + 1] + 1, DR[i + W] + 1, DR[i + W + 1] + 1.414, DR[i + W - 1] + 1.414); }
let sem = 0; const semPts = []; for (const [x, y] of pen) if (DR[y * W + x] > TOL + 3) { sem++; if (semPts.length < 4000) semPts.push([x, y]); }
console.log('trechos reais mantidos:', mantidos, 'de', totSeg, '| ruas resultantes:', out.length, '| px de caneta sem rua real por baixo:', sem, 'de', pen.length);
fs.writeFileSync('desenho/ruas_desenho.js', '// GERADO por desenho/seleciona_ruas.mjs: ruas reais adaptadas (ruas_jogo.js) que o traço de caneta do dono cobre. Escala 1/3, 8 direções.\nconst RUAS = ' + JSON.stringify(out) + ';\nconst RUAS_LIM = ' + JSON.stringify(RUAS_LIM) + ';\n');
fs.writeFileSync('desenho/desl.js', 'const DESL=' + JSON.stringify([SX, SY]) + ';');
fs.writeFileSync('desenho/sem_rua.json', JSON.stringify(semPts));
