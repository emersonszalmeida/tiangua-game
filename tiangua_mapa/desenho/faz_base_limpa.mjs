// Base LIMPA de ruas a partir do traço de caneta: acha as ruas retas (vertical, horizontal e as duas diagonais de 45°), estica cada uma de ponta a ponta e liga nos cruzamentos (T). Não copia a cidade: só a ideia do desenho.
// uso: node desenho/faz_base_limpa.mjs [giro=auto|graus] [sep=7] [grade=4]
import fs from 'node:fs';
const gr = JSON.parse(fs.readFileSync('desenho/grafo.json', 'utf8')), esc = 1.786831150110245, ox = 2510.7418481904406, oy = 2003.26400322078;
const SEP = +(process.argv[3] || 16), SNAP = +(process.argv[4] || 6), GAP = +(process.argv[5] || 40), MINL = +(process.argv[6] || 30), MINC = 22, JOIN = +(process.argv[7] || 20);
// 1) giro que alinha mais ruas com as 8 direções (usa cordas de ~10 px do traço)
let sr = 0, si = 0, cx = 0, cy = 0, cn = 0;
for (const e of gr.arestas) { const n = e.p.length / 2, S = 5; for (let i = 0; i + S < n; i += S) { const dx = e.p[2 * (i + S)] - e.p[2 * i], dy = e.p[2 * (i + S) + 1] - e.p[2 * i + 1], L = Math.hypot(dx, dy); if (L < 4) continue; const t = Math.atan2(dx, dy); sr += L * Math.cos(8 * t); si += L * Math.sin(8 * t); } for (let k = 0; k < e.p.length; k += 2) { cx += e.p[k]; cy += e.p[k + 1]; cn++; } }
cx /= cn; cy /= cn;
const GIRO = process.argv[2] && process.argv[2] !== 'auto' ? +process.argv[2] * Math.PI / 180 : Math.atan2(si, sr) / 8, cs = Math.cos(-GIRO), sn = Math.sin(-GIRO);
console.log('giro aplicado: ' + (-GIRO * 180 / Math.PI).toFixed(1) + '°');
const rot = (x, y) => { const dx = x - cx, dy = y - cy; return [cx + dx * cs - dy * sn, cy + dx * sn + dy * cs]; };
// classe da direção: 0 vertical, 1 diagonal "\", 2 horizontal, 3 diagonal "/"
const eixo = [(x, y) => [y, x], (x, y) => [(x + y) / Math.SQRT2, (x - y) / Math.SQRT2], (x, y) => [x, y], (x, y) => [(y - x) / Math.SQRT2, (x + y) / Math.SQRT2]];   // [ao longo, perpendicular]
const volta = [(a, p) => [p, a], (a, p) => [(a + p) / Math.SQRT2, (a - p) / Math.SQRT2], (a, p) => [a, p], (a, p) => [(p - a) / Math.SQRT2, (p + a) / Math.SQRT2]];
function dp(p, tol) { if (p.length < 3) return p; const A = p[0], B = p[p.length - 1], dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1; let im = 0, dm = -1; for (let i = 1; i < p.length - 1; i++) { const d = Math.abs((p[i][0] - A[0]) * dy - (p[i][1] - A[1]) * dx) / L; if (d > dm) { dm = d; im = i; } } if (dm <= tol) return [A, B]; return [...dp(p.slice(0, im + 1), tol).slice(0, -1), ...dp(p.slice(im), tol)]; }
// 2) cada edge do traço vira pedaços retos; cada pedaço é endireitado para a direção mais próxima (se não for torto demais)
const pecas = [[], [], [], []];
for (const e of gr.arestas) { const path = []; for (let k = 0; k < e.p.length; k += 2) path.push(rot(e.p[k], e.p[k + 1])); const v = dp(path, 3.5);
  for (let i = 1; i < v.length; i++) { const dx = v[i][0] - v[i - 1][0], dy = v[i][1] - v[i - 1][1], L = Math.hypot(dx, dy); if (L < 6) continue; const t = ((Math.atan2(dx, dy) % Math.PI) + Math.PI) % Math.PI, k = Math.round(t / (Math.PI / 4)), dev = Math.abs(t - k * Math.PI / 4); if (dev > 20 * Math.PI / 180) continue; const c = k % 4, [a0, p0] = eixo[c](v[i - 1][0], v[i - 1][1]), [a1, p1] = eixo[c](v[i][0], v[i][1]); pecas[c].push({ a0: Math.min(a0, a1), a1: Math.max(a0, a1), p: (p0 + p1) / 2, L, w: e.w }); } }
// 3) peças da mesma direção e quase na mesma linha viram UMA rua reta, de ponta a ponta
const segs = [];
for (let c = 0; c < 4; c++) {
  const ps = pecas[c].sort((u, v) => u.p - v.p), grupos = [];
  for (const q of ps) { const g = grupos[grupos.length - 1]; if (g && q.p - g.pmin <= SEP) { g.m.push(q); } else grupos.push({ pmin: q.p, m: [q] }); }
  for (const g of grupos) { const m = g.m.sort((u, v) => u.a0 - v.a0); let cur = null;
    const fecha = () => { if (cur && cur.a1 - cur.a0 >= MINL) { let sp = 0, sl = 0, sw = 0; for (const q of cur.q) { sp += q.p * q.L; sl += q.L; sw += q.w * q.L; } segs.push({ c, p: Math.round(sp / sl / SNAP) * SNAP, a0: cur.a0, a1: cur.a1, w: sw / sl }); } };
    for (const q of m) { if (cur && q.a0 - cur.a1 <= GAP) { cur.a1 = Math.max(cur.a1, q.a1); cur.q.push(q); } else { fecha(); cur = { a0: q.a0, a1: q.a1, q: [q] }; } } fecha(); }
}
// cruzamentos em T: cada ponta anda até a rua vizinha mais próxima (perpendicular ou diagonal) se estiver a menos de JOIN px
const pt = (s, a) => volta[s.c](a, s.p);
const inter = (s, r) => { // interseção das retas s e r em (x,y); null se paralelas
  const d = k => k === 0 ? [0, 1] : k === 1 ? [Math.SQRT1_2, Math.SQRT1_2] : k === 2 ? [1, 0] : [-Math.SQRT1_2, Math.SQRT1_2];
  const A = pt(s, 0), B = pt(r, 0), u = d(s.c), v = d(r.c), det = u[0] * v[1] - u[1] * v[0]; if (Math.abs(det) < 1e-6) return null;
  const t = ((B[0] - A[0]) * v[1] - (B[1] - A[1]) * v[0]) / det; return [A[0] + u[0] * t, A[1] + u[1] * t, t]; };
const dentroSeg = (r, x, y, folga) => { const [a] = eixo[r.c](x, y); return a >= r.a0 - folga && a <= r.a1 + folga; };
for (const s of segs) for (const fim of ['a0', 'a1']) { const [ex, ey] = pt(s, s[fim]); let best = null;
  for (const r of segs) { if (r === s || r.c === s.c) continue; const I = inter(s, r); if (!I) continue; const d = Math.hypot(I[0] - ex, I[1] - ey); if (d > JOIN || !dentroSeg(r, I[0], I[1], JOIN)) continue; if (!best || d < best.d) best = { d, I }; }
  if (best) { const [a] = eixo[s.c](best.I[0], best.I[1]); s[fim] = a; } }
// pontas soltas que quase se tocam: liga com caminho nas 8 direções
const U = k => [Math.sin(k * Math.PI / 4), Math.cos(k * Math.PI / 4)];
function octi(a, b) { const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz); if (L < .01) return []; const k0 = Math.round(Math.atan2(dx, dz) / (Math.PI / 4)), cand = [];
  for (const k1 of [k0, k0 + 1, k0 - 1]) for (const k2 of [k0, k0 + 1, k0 - 1]) { if (k1 === k2) continue; const [u1x, u1z] = U(k1), [u2x, u2z] = U(k2), det = u1x * u2z - u1z * u2x; if (Math.abs(det) < 1e-6) continue; const s1 = (dx * u2z - dz * u2x) / det, t = (u1x * dz - u1z * dx) / det; if (s1 >= -1e-6 && t >= -1e-6) cand.push({ k1, k2, s: s1, t }); }
  if (!cand.length) return [b]; const c = cand.filter(q => q.k1 === k0).sort((p, q) => (p.s + p.t) - (q.s + q.t))[0] || cand[0]; const [u1x, u1z] = U(c.k1), [u2x, u2z] = U(c.k2), h = c.s / 2; const p1 = [a[0] + u1x * h, a[1] + u1z * h]; return [p1, [p1[0] + u2x * c.t, p1[1] + u2z * c.t], b]; }
const livre = (s, fim) => { const [x, y] = pt(s, s[fim]); for (const r of segs) { if (r === s) continue; const [a, p] = eixo[r.c](x, y); if (Math.abs(p - r.p) < 3 && a >= r.a0 - 3 && a <= r.a1 + 3) return null; } return [x, y]; };
const pontas = []; for (const s of segs) for (const fim of ['a0', 'a1']) { const q = livre(s, fim); if (q) pontas.push({ s, q }); }
const extra = []; const usado = new Set();
for (let i = 0; i < pontas.length; i++) for (let j = i + 1; j < pontas.length; j++) { const A = pontas[i], B = pontas[j]; if (A.s === B.s || usado.has(i) || usado.has(j)) continue; const d = Math.hypot(A.q[0] - B.q[0], A.q[1] - B.q[1]); if (d > 30 || d < 1) continue; usado.add(i); usado.add(j); extra.push({ w: Math.max(A.s.w, B.s.w), p: [A.q, ...octi(A.q, B.q)] }); }
// saída: px da imagem (girada) -> metros do jogo
const inv = (x, y) => [x, y];
const g = (x, y) => { const [X, Y] = inv(x, y); return [+((2 * X - ox) / esc).toFixed(2), +((2 * Y - oy) / esc).toFixed(2)]; };
const classe = w => w >= 8 ? ['primary', 11] : w >= 6 ? ['tertiary', 8] : ['residential', 6.5];
const out = [];
for (const s of segs) { const [c, w] = classe(s.w); out.push({ c, w, p: [...g(...pt(s, s.a0)), ...g(...pt(s, s.a1))] }); }
for (const e of extra) { const [c, w] = classe(e.w); out.push({ c, w, p: e.p.flatMap(q => g(q[0], q[1])) }); }
const lim = eval('(()=>{' + fs.readFileSync('ruas_jogo.js', 'utf8') + ';return RUAS_LIM})()');
fs.writeFileSync('desenho/ruas_base.js', '// GERADO por desenho/faz_base_limpa.mjs: base limpa de ruas retas a partir do traço de caneta (não é cópia de nenhuma cidade).\nconst RUAS = ' + JSON.stringify(out) + ';\nconst RUAS_LIM = ' + JSON.stringify(lim) + ';\n');
const cont = {}; for (const r of out) cont[r.c] = (cont[r.c] || 0) + 1; console.log('ruas:', out.length, 'retas:', segs.length, 'ligações:', extra.length, JSON.stringify(cont));
