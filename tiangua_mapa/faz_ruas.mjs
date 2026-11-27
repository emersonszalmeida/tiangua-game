// ruas_osm.json -> ruas_jogo.js: ruas do centro de Tianguá ADAPTADAS AO JOGO (só nas 8 direções do jogo: 0/45/90...).
// 1) gira a cidade inteira para o máximo de ruas ficar perto das 8 direções; 2) cada trecho entre cruzamentos vira um caminho "octilinear" (como mapa de metrô): pedaços retos nas 8 direções, mantendo o mesmo ponto de início e de fim, então os cruzamentos continuam ligados.
// Cidade encolhida: ESC = 1/3 do comprimento real; a LARGURA das ruas não encolhe. uso: node faz_ruas.mjs [escala=3] [giro=auto|graus]
import fs from 'node:fs';
const ESC = +(process.argv[2] || 3), j = JSON.parse(fs.readFileSync('ruas_osm.json', 'utf8')), LAT0 = -3.7325, LON0 = -40.9930, kx = 111320 * Math.cos(LAT0 * Math.PI / 180), ky = 110574;
const LARG = { motorway: 13, trunk: 13, primary: 11, secondary: 9, tertiary: 8, unclassified: 7, residential: 6.5, living_street: 5, service: 4, motorway_link: 6, trunk_link: 6, primary_link: 6, secondary_link: 6, tertiary_link: 6 };
const BOX = { x0: -2400, x1: 2450, z0: -2100, z1: 1550 }, PAD = 250;
const dentro = (x, z) => x >= BOX.x0 - PAD && x <= BOX.x1 + PAD && z >= BOX.z0 - PAD && z <= BOX.z1 + PAD;
// 0) vias -> trechos dentro da área (com os ids dos nós, para saber onde há cruzamento)
let vias = [];
for (const w of j.elements) { if (w.type !== 'way' || !w.geometry || !LARG[w.tags.highway]) continue; let run = [];
  w.geometry.forEach((p, i) => { const x = (p.lon - LON0) * kx, z = -(p.lat - LAT0) * ky; if (dentro(x, z)) run.push({ id: w.nodes[i], x, z }); else { if (run.length > 1) vias.push({ t: w.tags.highway, pts: run }); run = []; } });
  if (run.length > 1) vias.push({ t: w.tags.highway, pts: run }); }
// 1) giro: ângulo dominante das ruas módulo 45°
const argv3 = process.argv[3] || 'auto'; let gir;
if (argv3 === 'auto') { let sr = 0, si = 0; for (const v of vias) for (let i = 1; i < v.pts.length; i++) { const dx = v.pts[i].x - v.pts[i - 1].x, dz = v.pts[i].z - v.pts[i - 1].z, L = Math.hypot(dx, dz), a = Math.atan2(dx, dz); sr += L * Math.cos(8 * a); si += L * Math.sin(8 * a); } gir = Math.atan2(si, sr) / 8; } else gir = +argv3 * Math.PI / 180;
console.log('giro da cidade: ' + (-gir * 180 / Math.PI).toFixed(1) + '°');
const cs = Math.cos(-gir), sn = Math.sin(-gir), rot = (x, z) => [x * cs - z * sn, x * sn + z * cs];
for (const v of vias) for (const p of v.pts) [p.x, p.z] = rot(p.x, p.z);
// 1b) cada nó vai para a grade (G metros reais): ruas paralelas viram linhas retas e os pequenos desvios ficam menores que a largura da rua
const G = +(process.argv[4] || 20), snap = p => { p.x = Math.round(p.x / G) * G; p.z = Math.round(p.z / G) * G; };
// 2) cruzamentos = nós que aparecem em mais de uma via (ou pontas); cada via é cortada neles
const uso = new Map(); for (const v of vias) for (const p of v.pts) uso.set(p.id, (uso.get(p.id) || 0) + 1);
function dp(p, tol) { if (p.length < 3) return p; const a = p[0], b = p[p.length - 1], dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz) || 1; let im = 0, dm = -1; for (let i = 1; i < p.length - 1; i++) { const d = Math.abs((p[i].x - a.x) * dz - (p[i].z - a.z) * dx) / L; if (d > dm) { dm = d; im = i; } } if (dm <= tol) return [a, b]; return [...dp(p.slice(0, im + 1), tol).slice(0, -1), ...dp(p.slice(im), tol)]; }
const U = k => [Math.sin(k * Math.PI / 4), Math.cos(k * Math.PI / 4)];   // vetor unitário da direção k (0 = baixo da tela, 2 = direita...)
function octi(a, b) {   // caminho só nas 8 direções de a até b: metade do trecho na direção mais próxima, o resto na vizinha, e a outra metade de novo na mais próxima
  const dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz); if (L < .01) return [];
  const k0 = Math.round(Math.atan2(dx, dz) / (Math.PI / 4)), cand = [];
  for (const k1 of [k0, k0 + 1, k0 - 1]) for (const k2 of [k0, k0 + 1, k0 - 1]) { if (k1 === k2) continue; const [u1x, u1z] = U(k1), [u2x, u2z] = U(k2), det = u1x * u2z - u1z * u2x; if (Math.abs(det) < 1e-6) continue; const s = (dx * u2z - dz * u2x) / det, t = (u1x * dz - u1z * dx) / det; if (s >= -1e-6 && t >= -1e-6) cand.push({ k1, k2, s, t }); }
  if (!cand.length) return [{ x: b.x, z: b.z }];
  const k1 = cand.filter(c => c.k1 === k0).sort((p, q) => (p.s + p.t) - (q.s + q.t))[0] || cand[0];   // menor desvio: mais comprido na direção principal
  const [u1x, u1z] = U(k1.k1), [u2x, u2z] = U(k1.k2), h = k1.s / 2; if (k1.t < .5) return [{ x: b.x, z: b.z }];
  const p1 = { x: a.x + u1x * h, z: a.z + u1z * h }, p2 = { x: p1.x + u2x * k1.t, z: p1.z + u2z * k1.t };
  return [p1, p2, { x: b.x, z: b.z }];
}
const out = []; let np = 0, X0 = 1e9, X1 = -1e9, Z0 = 1e9, Z1 = -1e9;
for (const v of vias) {
  const cortes = [0]; for (let i = 1; i < v.pts.length - 1; i++) if (uso.get(v.pts[i].id) > 1) cortes.push(i); cortes.push(v.pts.length - 1);
  let path = [{ x: Math.round(v.pts[0].x / G) * G, z: Math.round(v.pts[0].z / G) * G }];
  for (let c = 1; c < cortes.length; c++) { const seg = dp(v.pts.slice(cortes[c - 1], cortes[c] + 1), 5).map(p => { const q = { x: p.x, z: p.z }; snap(q); return q; }); for (let i = 1; i < seg.length; i++) path.push(...octi(seg[i - 1], seg[i])); }
  const pts = []; for (const p of path) { const q = [+(p.x / ESC).toFixed(2), +(p.z / ESC).toFixed(2)]; const l = pts[pts.length - 1]; if (!l || Math.hypot(q[0] - l[0], q[1] - l[1]) > .05) pts.push(q); }
  if (pts.length < 2) continue; np += pts.length; for (const [x, z] of pts) { X0 = Math.min(X0, x); X1 = Math.max(X1, x); Z0 = Math.min(Z0, z); Z1 = Math.max(Z1, z); }
  out.push({ c: v.t.replace('_link', ''), w: LARG[v.t], p: pts.flat() });
}
const cantos = [[BOX.x0, BOX.z0], [BOX.x1, BOX.z0], [BOX.x0, BOX.z1], [BOX.x1, BOX.z1]].map(([x, z]) => rot(x, z)), lim = { x0: Math.max(X0, Math.min(...cantos.map(c => c[0])) / ESC), x1: Math.min(X1, Math.max(...cantos.map(c => c[0])) / ESC), z0: Math.max(Z0, Math.min(...cantos.map(c => c[1])) / ESC), z1: Math.min(Z1, Math.max(...cantos.map(c => c[1])) / ESC) };
fs.writeFileSync('ruas_jogo.js', '// GERADO por faz_ruas.mjs (escala 1/' + ESC + ', ruas endireitadas para as 8 direções). Fonte dos dados de rua: OpenStreetMap (ver NOTA.md sobre créditos)\nconst RUAS = ' + JSON.stringify(out) + ';\nconst RUAS_LIM = ' + JSON.stringify(lim) + ';\n');
console.log('ruas:', out.length, 'pontos:', np, 'limites (m do jogo):', JSON.stringify(lim, (k, v) => typeof v === 'number' ? Math.round(v) : v), Math.round(fs.statSync('ruas_jogo.js').size / 1024) + ' KB');
