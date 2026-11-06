// Terreno novo (grama baixa + terra) para o editor da cabana (chao.html).
// A terra fica embaixo; por cima vai so a grama, com a borda calculada a partir dos vizinhos (5x5):
// terra ocupa a celula inteira, cantos arredondados por fora e por dentro. Vizinho de outro material = borda reta.
// Usa: M, MAP (de chao.html), GRAMA_B64 (terreno_dados.js). Orientacao: A = cx, B = -cy.
const TERR = { ready: false, cv: null, render() { } };
(function () {
  const RR = 20, GN = 5 * RR, RAD = .46;
  const IMGT = {}; let GTD = null, GIMG = null, pend = 10;
  const done = () => { if (!--pend) { TERR.ready = true; TERR.render(); } };
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { const im = new Image(); im.onload = im.onerror = done; im.src = 'terreno/terra_' + i + '_' + j + '.png'; IMGT[i + ',' + j] = im; }
  { const g = new Image(); g.onload = () => { const c = document.createElement('canvas'); c.width = 128; c.height = 64; const x = c.getContext('2d'); x.drawImage(g, 0, 0); GTD = x.getImageData(0, 0, 128, 64).data; GIMG = g; done(); }; g.onerror = done; g.src = GRAMA_B64; }
  const hash = (x, y, s) => { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const vn = (x, y, s) => { const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy); return hash(ix, iy, s) * (1 - u) * (1 - v) + hash(ix + 1, iy, s) * u * (1 - v) + hash(ix, iy + 1, s) * (1 - u) * v + hash(ix + 1, iy + 1, s) * u * v; };
  const wobble = (a, b) => (vn(a * 9, b * 9, 6) - .5) * .035;
  // distancia euclidiana exata (Felzenszwalb), em celulas, limitada a cap
  const INF = 1e20, V = new Int32Array(GN), Z = new Float64Array(GN + 1), FF = new Float64Array(GN), DD = new Float64Array(GN);
  function edt1(n) { let k = 0; V[0] = 0; Z[0] = -INF; Z[1] = INF;
    for (let q = 1; q < n; q++) { let sx; for (;;) { const p = V[k]; sx = ((FF[q] + q * q) - (FF[p] + p * p)) / (2 * q - 2 * p); if (sx <= Z[k]) k--; else break; } k++; V[k] = q; Z[k] = sx; Z[k + 1] = INF; }
    k = 0; for (let q = 0; q < n; q++) { while (Z[k + 1] < q) k++; const p = V[k]; DD[q] = (q - p) * (q - p) + FF[p]; } }
  function dtSet(inSet, cap) {
    const g = new Float64Array(GN * GN), out = new Float32Array(GN * GN);
    for (let y = 0; y < GN; y++) { for (let x = 0; x < GN; x++) FF[x] = inSet[y * GN + x] ? 0 : INF; edt1(GN); for (let x = 0; x < GN; x++) g[y * GN + x] = DD[x]; }
    for (let x = 0; x < GN; x++) { for (let y = 0; y < GN; y++) FF[y] = g[y * GN + x]; edt1(GN); for (let y = 0; y < GN; y++) out[y * GN + x] = Math.min(cap, Math.sqrt(DD[y]) / RR); }
    return out; }
  const FIELDS = new Map();
  function fieldFor(key, flags) {   // flags[(da+2)*5+(db+2)] = 1 se for terra
    if (FIELDS.has(key)) return FIELDS.get(key);
    const E = new Uint8Array(GN * GN);
    for (let iy = 0; iy < GN; iy++) for (let ix = 0; ix < GN; ix++) { const u = -2.5 + (ix + .5) / RR, v = -2.5 + (iy + .5) / RR; let d = 99;
      for (let da = -2; da <= 2; da++) for (let db = -2; db <= 2; db++) if (!flags[(da + 2) * 5 + db + 2]) { const ex = Math.max(Math.abs(u - da) - .5, 0), ey = Math.max(Math.abs(v - db) - .5, 0); d = Math.min(d, Math.hypot(ex, ey)); }
      E[iy * GN + ix] = d >= RAD ? 1 : 0; }
    const dE = dtSet(E, 1.05), E2 = new Uint8Array(GN * GN); for (let k = 0; k < GN * GN; k++) E2[k] = dE[k] >= 2 * RAD ? 1 : 0;
    const dE2 = dtSet(E2, RAD + .3), f = new Float32Array(GN * GN); for (let k = 0; k < GN * GN; k++) f[k] = dE2[k] - RAD;
    FIELDS.set(key, f); return f; }
  const sample = (f, u, v) => { const gx = Math.max(0, Math.min(GN - 1.001, (u + 2.5) * RR - .5)), gy = Math.max(0, Math.min(GN - 1.001, (v + 2.5) * RR - .5)), x0 = Math.floor(gx), y0 = Math.floor(gy), fx = gx - x0, fy = gy - y0;
    return f[y0 * GN + x0] * (1 - fx) * (1 - fy) + f[y0 * GN + x0 + 1] * fx * (1 - fy) + f[(y0 + 1) * GN + x0] * (1 - fx) * fy + f[(y0 + 1) * GN + x0 + 1] * fx * fy; };
  const hx = s => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
  const BL1 = hx('#849766'), BL2 = hx('#7a8e5a'), BD = hx('#6c7f50'), SH1 = hx('#654c38'), SH2 = hx('#7e6148');
  const mix = (a, b, t) => [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)];
  // 1 = terra nova, 0 = grama baixa, null = outro material (ou fora do mapa)
  const kindOf = (cx, cy) => { if (cx < 0 || cy < 0 || cx >= M || cy >= M) return null; const m = MAP[cy][cx]; return m === 'terra_nova' ? 1 : m === 'grama_baixa' ? 0 : null; };
  const PIECES = new Map();
  function pieceCanvas(cx, cy, own) {
    const A = cx, B = -cy, flags = new Uint8Array(25); let nd = 0;
    for (let da = -2; da <= 2; da++) for (let db = -2; db <= 2; db++) { const k = kindOf(cx + da, cy - db), v = k === null ? own : k; flags[(da + 2) * 5 + db + 2] = v; nd += v; }
    if (nd === 0) return GIMG; if (nd === 25) return null;
    const key = flags.join(''), ck = A + ',' + B + ':' + key, hit = PIECES.get(ck); if (hit !== undefined) return hit;
    const f = fieldFor(key, flags), cv = document.createElement('canvas'); cv.width = 128; cv.height = 64; const cx2 = cv.getContext('2d'), im = cx2.createImageData(128, 64), D = im.data;
    const fld = (x, y) => { const dx = (x + .5 - 64) / 64, dy = (y + .5 - 32) / 32, u = (dx + dy) / 2, v = (dx - dy) / 2; return sample(f, u, v) + wobble(A + u, B + v) > 0 ? 2 : 1; };
    let any = false;
    for (let y = 0; y < 64; y++) for (let x = 0; x < 128; x++) { const dx = (x + .5 - 64) / 64, dy = (y + .5 - 32) / 32; if (Math.abs(dx) + Math.abs(dy) >= 1) continue; const o = (y * 128 + x) * 4, m = fld(x, y), probe = (a, b) => fld(x + a, y + b);
      const col = x & 63, h0 = hash(col, 1, 91), len = 1 + Math.floor(hash(col, 2, 92) * 3);
      if (m === 1) { let c = [GTD[o], GTD[o + 1], GTD[o + 2]]; let kDn = 0; for (let k = 1; k <= 4; k++) if (probe(0, k) === 2) { kDn = k; break; }
        if (kDn && kDn <= len) { if (h0 > .45) c = kDn >= len ? BL1 : BL2; else if (h0 < .15) c = BD; } D[o] = c[0]; D[o + 1] = c[1]; D[o + 2] = c[2]; D[o + 3] = 255; any = true; }
      else { let kUp = 0; for (let k = 1; k <= 5; k++) if (probe(0, -k) === 1) { kUp = k; break; }
        if (kUp) { const w = [0, .78, .62, .44, .27, .13][kUp], s = kUp <= 2 ? mix(SH1, SH2, .45) : SH2; D[o] = s[0]; D[o + 1] = s[1]; D[o + 2] = s[2]; D[o + 3] = Math.round(w * 255); any = true; continue; }
        let kDn = 0; for (let k = 1; k <= 4; k++) if (probe(0, k) === 1) { kDn = k; break; }
        if (kDn && kDn <= len && h0 > .35) { const b = kDn === len ? BL1 : BL2; D[o] = b[0]; D[o + 1] = b[1]; D[o + 2] = b[2]; D[o + 3] = 255; any = true; } } }
    cx2.putImageData(im, 0, 0); const out = any ? cv : null; PIECES.set(ck, out); return out; }
  TERR.render = function () { if (!TERR.ready || TERR.q) return; TERR.q = true; requestAnimationFrame(() => { TERR.q = false; TERR.draw(); }); };
  TERR.draw = function () {
    if (!TERR.cv) { TERR.cv = document.createElement('canvas'); TERR.cv.width = (M + M) * 64; TERR.cv.height = (M + M) * 32; }
    const c = TERR.cv.getContext('2d'); c.clearRect(0, 0, TERR.cv.width, TERR.cv.height);
    const cells = []; for (let cy = 0; cy < M; cy++) for (let cx = 0; cx < M; cx++) if (kindOf(cx, cy) !== null) cells.push([cx, cy]);
    cells.sort((p, q) => (p[0] + p[1]) - (q[0] + q[1]));
    const at = (cx, cy) => [M * 64 + (cx - cy) * 64 - 64, (cx + cy) * 32];
    for (const [cx, cy] of cells) { const [x, y] = at(cx, cy); c.drawImage(IMGT[(cx % 3) + ',' + (((-cy) % 3) + 3) % 3], x, y); }          // camada de baixo: terra
    for (const [cx, cy] of cells) { const p = pieceCanvas(cx, cy, kindOf(cx, cy)); if (p) { const [x, y] = at(cx, cy); c.drawImage(p, x, y); } }   // camada de cima: so a grama
  };
})();
