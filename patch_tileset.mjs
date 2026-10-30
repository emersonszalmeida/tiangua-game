// Reescala o tileset para losangos 128x64 (lado de 3 m, igual ao mapa) e corrige as cores das paredes
import fs from 'node:fs';
let s = fs.readFileSync('tileset.html', 'utf8');
const rep = (a, b) => { if (!s.includes(a)) throw new Error('não achei: ' + a.slice(0, 70)); s = s.replace(a, b); };
rep('Losango de 64×32 pixels.', 'Losango de 128×64 pixels (lado de 3 m, o mesmo do mapa; o personagem tem 55 pixels = 1,75 m).');
rep('const W = 64, H = 32;', 'const W = 128, H = 64;');
rep('const inDiamond = (x, y, ox = 0, oy = 0) => Math.abs(x - ox - 31.5) / 32 + Math.abs(y - oy - 15.5) / 16 <= 1;', 'const inDiamond = (x, y) => Math.abs(x - (W / 2 - .5)) / (W / 2) + Math.abs(y - (H / 2 - .5)) / (H / 2) <= 1;');
rep('const uv = (i, j) => [(i - 31.5) / 2 + (j - 15.5), -(i - 31.5) / 2 + (j - 15.5)];', 'const uv = (i, j) => [(i - (W / 2 - .5)) / 2 + (j - (H / 2 - .5)), -(i - (W / 2 - .5)) / 2 + (j - (H / 2 - .5))];');
rep('if (Math.abs(u) < 1.2 && ((Math.floor(v / 3) % 2) === 0)) return P.asfLine;', 'if (Math.abs(u) < 2.2 && ((Math.floor(v / 10) % 2) === 0)) return P.asfLine;');
rep('const a = ((u % 8) + 8) % 8, b = ((v % 8) + 8) % 8; if (a < 1 || b < 1) return P.calJ;', 'const a = ((u % 16) + 16) % 16, b = ((v % 16) + 16) % 16; if (a < 1.5 || b < 1.5) return P.calJ;');
rep('const a = Math.floor(u / 8), b = Math.floor(v / 8); const chk = (a + b) & 1; const e = ((u % 8) + 8) % 8, f = ((v % 8) + 8) % 8; if (e < 1 || f < 1) return P.pra2;', 'const a = Math.floor(u / 16), b = Math.floor(v / 16); const chk = (a + b) & 1; const e = ((u % 16) + 16) % 16, f = ((v % 16) + 16) % 16; if (e < 1.5 || f < 1.5) return P.pra2;');
const cut = (from, to, text) => { const a = s.indexOf(from), b = s.indexOf(to); if (a < 0 || b < 0) throw new Error('marcador: ' + from); s = s.slice(0, a) + text + s.slice(b); };
cut('function box(', 'const roofTop', `function box(hh, leftFn, rightFn, topFn, lineCol) {
  const c = mk(W, H + hh), x = c.getContext('2d'), hw = W / 2, hH = H / 2;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) if (inDiamond(i, j)) put(x, i, j, topFn(i, j));
  for (let i = 0; i < hw; i++) { const y0 = Math.round(hH + i / 2); for (let d = 0; d < hh; d++) put(x, i, y0 + d, leftFn(i, d)); }
  for (let i = hw; i < W; i++) { const y0 = Math.round(H - (i - hw) / 2); for (let d = 0; d < hh; d++) put(x, i, y0 + d, rightFn(i - hw, d)); }
  const o = lineCol || P.line;
  const edge = (x0, y0, x1, y1) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let k = 0; k <= n; k++) put(x, Math.round(x0 + (x1 - x0) * k / n), Math.round(y0 + (y1 - y0) * k / n), o); };
  edge(0, hH, hw - 1, 0); edge(hw, 0, W - 1, hH); edge(0, hH, hw - 1, H - 1); edge(hw, H - 1, W - 1, hH);
  edge(0, hH, 0, hH + hh); edge(W - 1, hH, W - 1, hH + hh); edge(hw - 1, H, hw - 1, H + hh - 1); edge(hw, H - 1, hw, H - 1 + hh);
  edge(0, hH + hh, hw - 1, H + hh - 1); edge(hw, H - 1 + hh, W - 1, hH + hh);
  return c;
}
`);
rep('const a = ((u % 5) + 5) % 5; return a < 1 ? c2', 'const a = ((u % 8) + 8) % 8; return a < 1.5 ? c2');
cut('function wall(', '// ---------- objetos', `function wall(base, shade, withWin, withDoor, hh) {
  return (isRight) => (u, d) => {
    const col = isRight ? base : shade;
    if (d < 4) return isRight ? shade : P.line;
    if (d > hh - 7) return P.calJ;
    if (withWin) { const wx = u >= 20 && u <= 44, wy = d >= 30 && d <= 62; if (wx && wy) { if (u <= 21 || u >= 43 || d <= 31 || d >= 61) return P.frame; if (u === 32 || u === 33) return P.frame2; return (d - 31 + u) % 10 < 3 ? P.glassL : (d < 46 ? P.glass2 : P.glass); } }
    if (withDoor) { const wx = u >= 20 && u <= 44, wy = d >= 28 && d <= hh - 7; if (wx && wy) { if (u <= 21 || u >= 43 || d <= 30) return P.frame; if (u === 40 && d >= 56 && d <= 58) return P.lamp; return u < 32 ? P.door : P.door2; } }
    return hash(u, d, isRight ? 5 : 9) > .97 ? (isRight ? shade : P.line2) : col;
  };
}
function house(base, shade, roof, kind) { const hh = 100, win = kind === 'win' || kind === 'both', door = kind === 'door' || kind === 'both'; return box(hh, wall(shade, shade, false, false, hh)(false), wall(base, shade, win, door, hh)(true), roofTop(roof[0], roof[1], roof[2])); }

`);
cut('function tree()', '// ---------- montagem', `function tree() {
  const TW = 112, TH = 176, c = mk(TW, TH), x = c.getContext('2d');
  for (let j = 92; j < 172; j++) for (let i = 48; i < 64; i++) { const e = i === 48 || i === 63; put(x, i, j, e ? P.line : (i < 56 ? P.trunk : P.trunk2)); }
  for (let i = 42; i < 70; i++) put(x, i, 172, P.line);
  const blobs = [[56, 56, 46], [30, 78, 28], [82, 78, 28], [56, 92, 26], [56, 30, 26]];
  for (let j = 0; j < 130; j++) for (let i = 0; i < TW; i++) { let inside = false; for (const [bx, by, br] of blobs) if ((i - bx) ** 2 + (j - by) ** 2 <= br * br) inside = true; if (!inside) continue; const light = (i - 40) + (j - 36) < 14 ? 0 : 1; const r = hash(i, j, 4), t = hash(Math.floor(i / 3), Math.floor(j / 3), 11); put(x, i, j, r > .93 ? P.leaf3 : light ? (t < .3 ? P.leaf4 : P.leaf2) : (t > .7 ? P.leaf3 : P.leaf1)); }
  const img = x.getImageData(0, 0, TW, TH), d = img.data, out = [];
  const A = (i, j) => (i < 0 || j < 0 || i >= TW || j >= 130) ? 0 : d[(j * TW + i) * 4 + 3];
  for (let j = 0; j < 130; j++) for (let i = 0; i < TW; i++) if (!A(i, j) && (A(i - 1, j) || A(i + 1, j) || A(i, j - 1) || A(i, j + 1))) out.push([i, j]);
  out.forEach(([i, j]) => put(x, i, j, P.line));
  return c;
}
function lamp() {
  const c = mk(24, 128), x = c.getContext('2d');
  for (let j = 26; j < 124; j++) { put(x, 10, j, P.line); put(x, 11, j, P.metal2); put(x, 12, j, P.metal); put(x, 13, j, P.line); }
  for (let i = 5; i < 19; i++) { put(x, i, 124, P.line); put(x, i, 123, P.metal); put(x, i, 122, P.metal); }
  for (let j = 4; j < 26; j++) for (let i = 4; i < 20; i++) { const e = j === 4 || j === 25 || i === 4 || i === 19; put(x, i, j, e ? P.line : (i < 12 ? P.lamp : '#e0c27a')); }
  return c;
}
function bench() {
  const c = mk(64, 40), x = c.getContext('2d');
  for (let i = 4; i < 60; i++) for (let j = 18; j < 24; j++) put(x, i, j, j === 18 || j === 23 ? P.line : P.brownL);
  for (let i = 4; i < 60; i++) for (let j = 6; j < 14; j++) put(x, i, j, j === 6 || j === 13 ? P.line : P.brown);
  for (const px of [8, 52]) for (let j = 24; j < 38; j++) { put(x, px, j, P.line); put(x, px + 1, j, P.metal2); put(x, px + 2, j, P.metal2); put(x, px + 3, j, P.line); }
  return c;
}

`);
cut('// ---------- teste: personagem', '</script>', `// ---------- teste: personagem ao lado das peças, na mesma escala ----------
(function demo() {
  const k = 2, cv = document.getElementById('demo'), x = cv.getContext('2d'); cv.width = 900; cv.height = 560; cv.style.width = cv.width + 'px'; x.imageSmoothingEnabled = false;
  x.fillStyle = '#2b2620'; x.fillRect(0, 0, cv.width, cv.height);
  const ox = 450, oy = 40;
  const tile = (c, gx, gy, up = 0) => x.drawImage(c, ox + (gx - gy) * 64 * k - 64 * k, oy + (gx + gy) * 32 * k - up * k, c.width * k, c.height * k);
  const g = { asf: groundTile(asphalt, 1), asfl: groundTile(asphaltLine, 2), cal: groundTile(sidewalk, 3), gra: groundTile(grass, 4), pra: groundTile(praca, 5) };
  for (let gy = -2; gy < 7; gy++) for (let gx = -2; gx < 7; gx++) { let t; if (gx + gy <= 1) t = (gx - gy) % 2 ? g.asfl : g.asf; else if (gx + gy === 2) t = g.cal; else if (gx >= 3 && gy >= 2) t = g.pra; else if (gx + gy < 6) t = g.cal; else t = g.gra; tile(t, gx, gy); }
  tile(house(P.wallB, P.wallB2, [P.tel1, P.tel2, P.tel3], 'both'), 2, -1, 100); tile(house(P.wallA, P.wallA2, [P.tel1, P.tel2, P.tel3], 'win'), 3, -1, 100);
  const S = IDLES.S, cs = mk(S.w, S.h), cx = cs.getContext('2d'); S.rows.forEach((r, y) => { for (let i = 0; i < r.length; i++) if (r[i] !== '.') put(cx, i, y, IDLES.pal[r[i]]); });
  x.drawImage(cs, 420, 300, S.w * k, S.h * k);
  x.drawImage(tree(), 600, 150, 112 * k, 176 * k); x.drawImage(lamp(), 360, 170, 24 * k, 128 * k); x.drawImage(bench(), 480, 330, 64 * k, 40 * k);
})();
`);
// miniaturas sem ampliar (as peças já são grandes)
s = s.replace(/add\('(ground|build|props)', (.+?), '([^']+)'(, 3)?\);/g, (m, id, expr, label) => "add('" + id + "', " + expr + ", '" + label + "', 1);");
fs.writeFileSync('tileset.html', s);
console.log('ok');
