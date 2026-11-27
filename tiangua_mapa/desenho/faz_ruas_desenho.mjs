// desenho/grafo.json (esqueleto do traço de caneta, px da imagem retificada) -> desenho/ruas_desenho.js (mesmo formato de ruas_jogo.js), ruas nas 8 direções.
// uso: node desenho/faz_ruas_desenho.mjs [G=20 (metros reais, grade)] [tol=5]
import fs from 'node:fs';
const G = +(process.argv[2] || 20), TOL = +(process.argv[3] || 5), ESC = 3;
const gr = JSON.parse(fs.readFileSync('desenho/grafo.json', 'utf8')), esc = 1.786831150110245, ox = 2510.7418481904406, oy = 2003.26400322078;
const real0 = (x, y) => ({ x: (x * 2 - ox) / esc * ESC, z: (y * 2 - oy) / esc * ESC });
// giro: ângulo (módulo 45°) em que mais ruas, ponderadas pelo comprimento, ficam perto das 8 direções; gira o desenho inteiro em volta do centro dele
let sr = 0, si = 0, cx = 0, cz = 0, cn = 0;
for (const e of gr.arestas) { const n = e.p.length / 2, S = 7; for (let i = 0; i + S < n; i += S) { const A = real0(e.p[2 * i], e.p[2 * i + 1]), B = real0(e.p[2 * (i + S)], e.p[2 * (i + S) + 1]), dx = B.x - A.x, dz = B.z - A.z, L = Math.hypot(dx, dz), t = Math.atan2(dx, dz); if (L < 5) continue; sr += L * Math.cos(8 * t); si += L * Math.sin(8 * t); } for (let k = 0; k < e.p.length; k += 2) { const p = real0(e.p[k], e.p[k + 1]); cx += p.x; cz += p.z; cn++; } }
const GIRO = process.argv[4] && process.argv[4] !== 'auto' ? +process.argv[4] * Math.PI / 180 : Math.atan2(si, sr) / 8, CX = cx / cn, CZ = cz / cn, cs = Math.cos(-GIRO), sn = Math.sin(-GIRO);
console.log('giro aplicado: ' + (-GIRO * 180 / Math.PI).toFixed(1) + '°');
const real = (x, y) => { const p = real0(x, y), dx = p.x - CX, dz = p.z - CZ; return { x: CX + dx * cs - dz * sn, z: CZ + dx * sn + dz * cs }; };   // px da imagem (escala .5) -> metros "reais" (3x o do jogo)
const snapv = v => Math.round(v / G) * G, snap = p => ({ x: snapv(p.x), z: snapv(p.z) });
function dp(p, tol) { if (p.length < 3) return p; const a = p[0], b = p[p.length - 1], dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz) || 1; let im = 0, dm = -1; for (let i = 1; i < p.length - 1; i++) { const d = Math.abs((p[i].x - a.x) * dz - (p[i].z - a.z) * dx) / L; if (d > dm) { dm = d; im = i; } } if (dm <= tol) return [a, b]; return [...dp(p.slice(0, im + 1), tol).slice(0, -1), ...dp(p.slice(im), tol)]; }
const U = k => [Math.sin(k * Math.PI / 4), Math.cos(k * Math.PI / 4)];
function octi(a, b) {
  const dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz); if (L < .01) return [];
  const k0 = Math.round(Math.atan2(dx, dz) / (Math.PI / 4)), cand = [];
  for (const k1 of [k0, k0 + 1, k0 - 1]) for (const k2 of [k0, k0 + 1, k0 - 1]) { if (k1 === k2) continue; const [u1x, u1z] = U(k1), [u2x, u2z] = U(k2), det = u1x * u2z - u1z * u2x; if (Math.abs(det) < 1e-6) continue; const s = (dx * u2z - dz * u2x) / det, t = (u1x * dz - u1z * dx) / det; if (s >= -1e-6 && t >= -1e-6) cand.push({ k1, k2, s, t }); }
  if (!cand.length) return [{ x: b.x, z: b.z }];
  const k1 = cand.filter(c => c.k1 === k0).sort((p, q) => (p.s + p.t) - (q.s + q.t))[0] || cand[0];
  const [u1x, u1z] = U(k1.k1), [u2x, u2z] = U(k1.k2), h = k1.s / 2; if (k1.t < .5) return [{ x: b.x, z: b.z }];
  const p1 = { x: a.x + u1x * h, z: a.z + u1z * h }, p2 = { x: p1.x + u2x * k1.t, z: p1.z + u2z * k1.t };
  return [p1, p2, { x: b.x, z: b.z }];
}
const classe = w => w >= 8 ? ['primary', 11] : w >= 6 ? ['tertiary', 8] : ['residential', 6.5];
const out = [], vistos = new Set(); let np = 0;
for (const e of gr.arestas) {
  const pts = []; for (let k = 0; k < e.p.length; k += 2) pts.push(real(e.p[k], e.p[k + 1]));
  const A = snap(pts[0]), B = snap(pts[pts.length - 1]);
  const mid = dp(pts, TOL).map(snap); mid[0] = A; mid[mid.length - 1] = B;
  let path = [A]; for (let i = 1; i < mid.length; i++) path.push(...octi(mid[i - 1], mid[i]));
  const q = []; for (const p of path) { const r = [+(p.x / ESC).toFixed(2), +(p.z / ESC).toFixed(2)], l = q[q.length - 1]; if (!l || Math.hypot(r[0] - l[0], r[1] - l[1]) > .05) q.push(r); }
  if (q.length < 2) continue;
  const chave = JSON.stringify(q), inv = JSON.stringify([...q].reverse()); if (vistos.has(chave) || vistos.has(inv)) continue; vistos.add(chave);
  const [c, w] = classe(e.w); np += q.length; out.push({ c, w, p: q.flat() });
}
const lim = JSON.parse(JSON.stringify(eval('(()=>{' + fs.readFileSync('ruas_jogo.js', 'utf8') + ';return RUAS_LIM})()')));
fs.writeFileSync('desenho/ruas_desenho.js', '// GERADO por desenho/faz_ruas_desenho.mjs a partir do traço de caneta do dono (foto retificada). Escala 1/3, 8 direções.\nconst RUAS = ' + JSON.stringify(out) + ';\nconst RUAS_LIM = ' + JSON.stringify(lim) + ';\n');
const cont = {}; for (const r of out) cont[r.c] = (cont[r.c] || 0) + 1;
console.log('ruas:', out.length, 'pontos:', np, JSON.stringify(cont));
