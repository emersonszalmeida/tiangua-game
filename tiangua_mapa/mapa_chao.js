// Chão do mapa grande: ruas com asfalto texturizado, faixas de tinta gasta e a BR de 4 pistas. Usado por mapa_grande.html (carro) e pelo jogo a pé.
// Precisa de: RUAS (ruas_mapa.js), fazTexturaAsfalto / fazTexturaTinta (asfalto_tex.js).
// MAPACHAO.desenha(ctx, x0, x1, z0, z1): com o ctx já transformado (1 unidade = 1 metro do plano, eixo z esticado 2:1 como na tela), desenha as ruas que aparecem na janela [x0..x1] × [z0..z1] (em metros).
const MAPACHAO = (function () {
const PPM = 65 / 1.76, _c2d = document.createElement('canvas').getContext('2d');
// ---- encontros de ruas: onde uma rua termina encostada no meio de outra, o ponto vira vértice das duas; as faixas são interrompidas dentro da rua que cruza ----
{ const fins = []; RUAS.forEach((r, ri) => { const n = r.p.length; fins.push([ri, r.p[0], r.p[1]], [ri, r.p[n - 2], r.p[n - 1]]); });
  RUAS.forEach((A, ai) => { let p = A.p; for (const [bi, x, z] of fins) { if (bi === ai) continue; let ja = false; for (let j = 0; j < p.length; j += 2) if (Math.abs(p[j] - x) < .01 && Math.abs(p[j + 1] - z) < .01) { ja = true; break; } if (ja) continue;
    for (let j = 2; j < p.length; j += 2) { const ax = p[j - 2], az = p[j - 1], dx = p[j] - ax, dz = p[j + 1] - az, t = ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1); if (t > .001 && t < .999 && Math.hypot(x - ax - dx * t, z - az - dz * t) < .05) { p = p.slice(0, j).concat([x, z], p.slice(j)); break; } } } A.p = p; }); }
const NOS = new Map(); RUAS.forEach((r, ri) => { const n = r.p.length / 2; for (let i = 0; i < n; i++) { const k = r.p[2 * i].toFixed(2) + ',' + r.p[2 * i + 1].toFixed(2); (NOS.get(k) || NOS.set(k, []).get(k)).push({ ri, i, n }); } });
// linha da rua ri (pts = eixo ou paralela a distância d do eixo), sem os trechos que caem dentro das ruas que se encontram com ela.
// tipo: 'centro' (tracejado das ruas comuns), 'amarela' (só onde a outra rua atravessa), 'lado' (tracejado e bordas da BR: só do lado em que a outra rua entra)
function linhaCortada(ri, pts, d, tipo, gap) {
  const p = RUAS[ri].p, n = p.length / 2, cum = [0], iv = []; for (let i = 1; i < n; i++) cum[i] = cum[i - 1] + Math.hypot(pts[2 * i] - pts[2 * i - 2], pts[2 * i + 1] - pts[2 * i - 1]);
  for (let i = 0; i < n; i++) {
    const lst = NOS.get(p[2 * i].toFixed(2) + ',' + p[2 * i + 1].toFixed(2)); if (!lst || lst.length < 2) continue;
    if (tipo === 'centro' && lst.length === 2 && lst.every(o => o.i === 0 || o.i === o.n - 1)) continue;   // só a continuação da mesma rua em outro pedaço
    const a = i ? i - 1 : 0, b = i < n - 1 ? i + 1 : n - 1; let tx = p[2 * b] - p[2 * a], tz = p[2 * b + 1] - p[2 * a + 1]; const Lt = Math.hypot(tx, tz) || 1; tx /= Lt; tz /= Lt; const nx = -tz, nz = tx, fim = i === 0 || i === n - 1;
    for (const o of lst) {
      if (o.ri === ri) continue; const q = RUAS[o.ri].p, atrav = o.i > 0 && o.i < o.n - 1;
      if (tipo === 'centro' && !fim && !atrav) continue; if (tipo === 'amarela' && !atrav) continue;
      for (const nb of [o.i - 1, o.i + 1]) { if (nb < 0 || nb >= o.n) continue;
        let ux = q[2 * nb] - p[2 * i], uz = q[2 * nb + 1] - p[2 * i + 1]; const Lu = Math.hypot(ux, uz); if (Lu < .01) continue; ux /= Lu; uz /= Lu;
        const un = ux * nx + uz * nz, ut = ux * tx + uz * tz; if (d && !atrav && un * d <= 0) continue;
        const s0 = d && Math.abs(un) > .3 ? d * ut / un : 0, h = RUAS[o.ri].w / (2 * Math.max(.4, Math.abs(un))) + gap; iv.push([cum[i] + s0 - h, cum[i] + s0 + h]);
      } } }
  iv.sort((x, y) => x[0] - y[0]); const L = cum[n - 1], mant = []; let at = 0; for (const [s, e] of iv) { if (s > at) mant.push([at, Math.min(s, L)]); at = Math.max(at, e); } if (at < L) mant.push([at, L]);
  const ponto = s => { let j = 1; while (j < n - 1 && cum[j] < s) j++; const t = (s - cum[j - 1]) / ((cum[j] - cum[j - 1]) || 1); return [pts[2 * j - 2] + (pts[2 * j] - pts[2 * j - 2]) * t, pts[2 * j - 1] + (pts[2 * j + 1] - pts[2 * j - 1]) * t]; };
  const path = new Path2D(); for (const [s, e] of mant) { if (e - s < 1.2) continue; const A = ponto(s); path.moveTo(A[0], A[1]); for (let j = 0; j < n; j++) if (cum[j] > s && cum[j] < e) path.lineTo(pts[2 * j], pts[2 * j + 1]); const B = ponto(e); path.lineTo(B[0], B[1]); } return path;
}
const ASF = _c2d.createPattern(fazTexturaAsfalto(), 'repeat'); ASF.setTransform(new DOMMatrix().scale(1 / PPM, 2 / PPM));   // asfalto com textura, preso ao chão, 1 pixel de arte = 2×2 px de tela
const tinta = (a, b) => { const q = _c2d.createPattern(fazTexturaTinta(a, b), 'repeat'); q.setTransform(new DOMMatrix().scale(1 / PPM, 2 / PPM)); return q; }, TBR = tinta('#f0ebdd', '#d0cbbd'), TAM = tinta('#e0bf32', '#b99a26');   // tinta gasta das faixas
const vias = RUAS.map(r => { const p = new Path2D(); let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (let i = 0; i < r.p.length; i += 2) { const x = r.p[i], z = r.p[i + 1]; i ? p.lineTo(x, z) : p.moveTo(x, z); x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); } return { r, p, x0, x1, z0, z1 }; });
// BR: 4 pistas (2 por mão). Linhas: dupla amarela no meio, tracejadas brancas entre as pistas de cada mão, contínuas brancas nas bordas
function deslocada(p, d) { const n = p.length / 2, q = []; for (let i = 0; i < n; i++) { const a = i ? i - 1 : 0, b = i < n - 1 ? i + 1 : n - 1; let tx = p[2 * b] - p[2 * a], tz = p[2 * b + 1] - p[2 * a + 1]; const L = Math.hypot(tx, tz) || 1; tx /= L; tz /= L;
    let k = 1; if (i && i < n - 1) { const ux = p[2 * i] - p[2 * i - 2], uz = p[2 * i + 1] - p[2 * i - 1], vx = p[2 * i + 2] - p[2 * i], vz = p[2 * i + 3] - p[2 * i + 1], lu = Math.hypot(ux, uz) || 1, lv = Math.hypot(vx, vz) || 1, cs = (ux * vx + uz * vz) / (lu * lv); k = 1 / Math.max(.5, Math.sqrt((1 + cs) / 2)); }
    q.push(p[2 * i] - tz * d * k, p[2 * i + 1] + tx * d * k); } return q; }
const caminho = pts => { const p = new Path2D(); for (let i = 0; i < pts.length; i += 2) i ? p.lineTo(pts[i], pts[i + 1]) : p.moveTo(pts[i], pts[i + 1]); return p; };
for (const v of vias) if (v.r.br) { const w = v.r.w, f = d => caminho(deslocada(v.r.p, d)); const ri = vias.indexOf(v), g = (d, tipo) => linhaCortada(ri, deslocada(v.r.p, d), d, tipo, .35); v.lin = { amarela: [g(-.22, 'amarela'), g(.22, 'amarela')], tracej: [g(-w / 4, 'lado'), g(w / 4, 'lado')], borda: [g(-(w / 2 - .45), 'lado'), g(w / 2 - .45, 'lado')] }; }
vias.forEach((v, ri) => { if (!v.r.br) v.cl = linhaCortada(ri, v.r.p, 0, 'centro', .6); });
const CEL = 32, grade = new Map();
for (const v of vias) { const p = v.r.p; for (let i = 2; i < p.length; i += 2) { const a = [p[i - 2], p[i - 1], p[i], p[i + 1], v.r.w]; const gx0 = Math.floor(Math.min(a[0], a[2]) / CEL) - 1, gx1 = Math.floor(Math.max(a[0], a[2]) / CEL) + 1, gz0 = Math.floor(Math.min(a[1], a[3]) / CEL) - 1, gz1 = Math.floor(Math.max(a[1], a[3]) / CEL) + 1; for (let gx = gx0; gx <= gx1; gx++) for (let gz = gz0; gz <= gz1; gz++) { const k = gx + ',' + gz; (grade.get(k) || grade.set(k, []).get(k)).push(a); } } }
function noAsfalto(x, z) { const l = grade.get(Math.floor(x / CEL) + ',' + Math.floor(z / CEL)); if (!l) return false; for (const [ax, az, bx, bz, w] of l) { const dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1))), d = Math.hypot(x - ax - dx * t, z - az - dz * t); if (d <= w / 2 + .3) return true; } return false; }
function desenha(ctx, vx0, vx1, vz0, vz1) {
  ctx.imageSmoothingEnabled = false;
  const vis = vias.filter(v => v.x1 >= vx0 && v.x0 <= vx1 && v.z1 >= vz0 && v.z0 <= vz1);
  ctx.save(); ctx.lineCap = ctx.lineJoin = 'round';
  for (const v of vis) { ctx.strokeStyle = '#5b5f65'; ctx.lineWidth = v.r.w + .8; ctx.stroke(v.p); }
  for (const v of vis) { ctx.strokeStyle = ASF; ctx.lineWidth = v.r.w; ctx.stroke(v.p); }
  ctx.lineCap = 'butt'; ctx.setLineDash([2.5, 3.5]);
  for (const v of vis) { if (v.lin) continue; ctx.strokeStyle = TBR; ctx.lineWidth = .25; ctx.stroke(v.cl); }
  // a BR por cima dos cruzamentos: asfalto de novo e depois as linhas das 4 pistas
  ctx.setLineDash([]); ctx.lineCap = 'round';
  for (const v of vis) if (v.lin) { ctx.strokeStyle = ASF; ctx.lineWidth = v.r.w; ctx.stroke(v.p); }
  ctx.lineCap = 'butt';
  for (const v of vis) if (v.lin) { ctx.lineWidth = .22; ctx.strokeStyle = TBR; for (const p of v.lin.borda) ctx.stroke(p); ctx.strokeStyle = TAM; for (const p of v.lin.amarela) ctx.stroke(p); }
  ctx.setLineDash([2.5, 3.5]);
  for (const v of vis) if (v.lin) { ctx.lineWidth = .22; ctx.strokeStyle = TBR; for (const p of v.lin.tracej) ctx.stroke(p); }
  ctx.restore(); ctx.setLineDash([]);
}
// folga (m) do ponto até a borda do asfalto da rua mais próxima: negativo = em cima da rua; 99 = nenhuma rua por perto (só vê ruas a até ~30 m)
function distBorda(x, z) { const l = grade.get(Math.floor(x / CEL) + ',' + Math.floor(z / CEL)); if (!l) return 99; let m = 99; for (const [ax, az, bx, bz, w] of l) { const dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1))); m = Math.min(m, Math.hypot(x - ax - dx * t, z - az - dz * t) - w / 2); } return m; }
return { vias, noAsfalto, distBorda, desenha, PPM };
})();
