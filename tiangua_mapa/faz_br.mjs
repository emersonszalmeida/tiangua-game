// ruas_jogo.js -> ruas_jogo_br.js: a BR (as duas pistas separadas do mapa real) vira UMA via de 4 pistas (2 por mão) no eixo do meio. ruas_jogo.js não é alterado.
import fs from 'node:fs';
const { RUAS, RUAS_LIM } = eval('(()=>{' + fs.readFileSync('ruas_jogo.js', 'utf8') + ';return {RUAS,RUAS_LIM}})()');
const BR = new Set([397, 782, 783, 847, 852, 853, 854, 855, 857, 858, 859, 861, 862, 863, 864, 865, 866, 867, 868, 870, 872, 891, 892, 919]);
const BIN = 4, pts = [];   // amostras de 1 m em todas as pistas da BR
for (const i of BR) { const p = RUAS[i].p; for (let k = 2; k < p.length; k += 2) { const dx = p[k] - p[k - 2], dz = p[k + 1] - p[k - 1], n = Math.max(1, Math.ceil(Math.hypot(dx, dz))); for (let t = 0; t <= n; t++) pts.push([p[k - 2] + dx * t / n, p[k - 1] + dz * t / n]); } }
const z0 = Math.min(...pts.map(q => q[1])), z1 = Math.max(...pts.map(q => q[1])), NB = Math.ceil((z1 - z0) / BIN) + 1, sx = new Float64Array(NB), nn = new Float64Array(NB);
for (const [x, z] of pts) { const b = Math.round((z - z0) / BIN); sx[b] += x; nn[b]++; }
let cl = []; for (let b = 0; b < NB; b++) if (nn[b]) cl.push([sx[b] / nn[b], z0 + b * BIN]);
// suaviza (média móvel curta) e simplifica
cl = cl.map((q, i) => { let s = 0, c = 0; for (let d = -2; d <= 2; d++) if (cl[i + d]) { s += cl[i + d][0]; c++; } return [s / c, q[1]]; });
function dp(p, tol) { if (p.length < 3) return p; const A = p[0], B = p[p.length - 1], dx = B[0] - A[0], dz = B[1] - A[1], L = Math.hypot(dx, dz) || 1; let im = 0, dm = -1; for (let i = 1; i < p.length - 1; i++) { const d = Math.abs((p[i][0] - A[0]) * dz - (p[i][1] - A[1]) * dx) / L; if (d > dm) { dm = d; im = i; } } if (dm <= tol) return [A, B]; return [...dp(p.slice(0, im + 1), tol).slice(0, -1), ...dp(p.slice(im), tol)]; }
const U = k => [Math.sin(k * Math.PI / 4), Math.cos(k * Math.PI / 4)];
function octi(a, b) { const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz); if (L < .01) return []; const k0 = Math.round(Math.atan2(dx, dz) / (Math.PI / 4)), cand = [];
  for (const k1 of [k0, k0 + 1, k0 - 1]) for (const k2 of [k0, k0 + 1, k0 - 1]) { if (k1 === k2) continue; const [u1x, u1z] = U(k1), [u2x, u2z] = U(k2), det = u1x * u2z - u1z * u2x; if (Math.abs(det) < 1e-6) continue; const s = (dx * u2z - dz * u2x) / det, t = (u1x * dz - u1z * dx) / det; if (s >= -1e-6 && t >= -1e-6) cand.push({ k1, k2, s, t }); }
  if (!cand.length) return [b]; const c = cand.filter(q => q.k1 === k0).sort((p, q) => (p.s + p.t) - (q.s + q.t))[0] || cand[0]; const [u1x, u1z] = U(c.k1), [u2x, u2z] = U(c.k2), h = c.s / 2; const p1 = [a[0] + u1x * h, a[1] + u1z * h]; return [p1, [p1[0] + u2x * c.t, p1[1] + u2z * c.t], b]; }
const sn = q => [Math.round(q[0] / (20 / 3)) * (20 / 3), Math.round(q[1] / (20 / 3)) * (20 / 3)];
const v = dp(cl, 7).map(sn); let path = [v[0]]; for (let i = 1; i < v.length; i++) path.push(...octi(v[i - 1], v[i]));
const eixo = []; for (const q of path) { const l = eixo[eixo.length - 1]; if (!l || Math.hypot(q[0] - l[0], q[1] - l[1]) > .05) eixo.push([+q[0].toFixed(2), +q[1].toFixed(2)]); }
// BR: pistas de 3,5 m -> 4 pistas = 14 m
const out = RUAS.filter((r, i) => !BR.has(i)); out.push({ c: 'trunk', w: 14, br: 1, p: eixo.flat() });
fs.writeFileSync('ruas_jogo_br.js', '// GERADO por faz_br.mjs: ruas_jogo.js com a BR como uma via só de 4 pistas (br:1). Escala 1/3.\nconst RUAS = ' + JSON.stringify(out) + ';\nconst RUAS_LIM = ' + JSON.stringify(RUAS_LIM) + ';\n');
console.log('BR: pontos do eixo', eixo.length, 'z', Math.round(z0), '->', Math.round(z1), '| ruas total', out.length);
