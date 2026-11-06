// Postes de iluminação e de energia em pixel art (concreto, 4 tons), na escala do personagem. Usado por poste.html e praca.html.
const POSTE = (function () {
const hash = (x, y, s = 0) => { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5], bayer = (x, y) => BAY[(y & 3) * 4 + (x & 3)] / 15;
const OUT = '#362826';                                               // contorno marrom-escuro, como o personagem
const CON = ['#4f4b47', '#7a766e', '#a29d92', '#c7c2b4'];            // concreto: sombra, escuro, médio, luz
const MET = ['#3b3f45', '#5f656d', '#8b929a', '#b6bcc2'];            // metal
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));

function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); return { c, x, put: (px, py, col) => { x.fillStyle = col; x.fillRect(px | 0, py | 0, 1, 1); } }; }

// cilindro vertical de concreto: x central cx, de y0 (topo) a y1 (base), largura w(y)
function shaft(P, cx, y0, y1, w, pal, seed) {
  for (let y = y0; y <= y1; y++) {
    const hw = w(y) / 2;
    for (let x = Math.floor(cx - hw); x <= Math.ceil(cx + hw); x++) {
      const u = (x - cx) / hw; if (Math.abs(u) > 1.02) continue;
      if (u < -.9 || u > .9) { P.put(x, y, OUT); continue; }
      let t = u < -.5 ? 3 : u < -.05 ? 2 : u < .5 ? 1 : 0;
      const e = (bayer(x, y) - .5) * .5, uu = u + e * .5; t = uu < -.5 ? 3 : uu < -.05 ? 2 : uu < .5 ? 1 : 0;
      if (hash(x, y, seed) > .965 && t > 0) t--;                              // manchas
      if (y % 64 === 0 && u < .9) t = Math.max(0, t - 1);                       // emenda
      P.put(x, y, pal[t]);
    }
  }
}
function line(P, x0, y0, x1, y1, w, pal) {
  const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0)) * 2;
  for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t; for (let o = -w; o <= w; o++) P.put(x, y + o, o < -w * .3 ? pal[3] : o < w * .5 ? pal[2] : pal[1]); P.put(x, y - w - 1, OUT); P.put(x, y + w + 1, OUT); }
}
function box(P, x0, y0, w, h, pal) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const edge = x === 0 || y === 0 || x === w - 1 || y === h - 1; P.put(x0 + x, y0 + y, edge ? OUT : (y < h * .4 ? pal[3] : y < h * .75 ? pal[2] : pal[1])); }
}

// ---- poste de iluminação: fuste cônico, base mais larga, braço curvo e luminária ----
function lightPole() {
  const W = 120, H = 300, P = makeCanvas(W, H), cx = 30, top = 24, base = H - 6;
  // base
  for (let y = base - 10; y <= base; y++) for (let x = cx - 11; x <= cx + 11; x++) { const edge = x === cx - 11 || x === cx + 11 || y === base; P.put(x, y, edge ? OUT : (x < cx - 3 ? CON[3] : x < cx + 4 ? CON[2] : CON[1])); }
  shaft(P, cx, top, base - 11, y => 9 + (y - top) / (base - top) * 6, CON, 3);
  // braço: sobe e curva para a direita
  const pts = []; for (let i = 0; i <= 40; i++) { const t = i / 40; pts.push([cx + t * 62, top + 4 - Math.sin(t * Math.PI * .5) * 22 + t * t * 12]); }
  for (let i = 1; i < pts.length; i++) line(P, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], 2, MET);
  // luminária na ponta
  const lx = cx + 56, ly = pts[pts.length - 1][1] - 2;
  box(P, lx, ly, 34, 9, MET);
  for (let x = lx + 4; x < lx + 30; x++) P.put(x, ly + 9, OUT);
  for (let y = ly + 9; y < ly + 12; y++) for (let x = lx + 5; x < lx + 29; x++) P.put(x, y, y === ly + 11 ? OUT : (x < lx + 17 ? '#d8d2b0' : '#bdb78e'));   // lente (apagada de dia)
  box(P, lx + 12, ly - 4, 10, 4, MET);
  return { c: P.c, ax: cx, ay: base };
}

// ---- poste de energia: fuste mais fino, cruzeta com isoladores e fios ----
function powerPole() {
  const W = 200, H = 290, P = makeCanvas(W, H), cx = 100, top = 20, base = H - 6;
  for (let y = base - 8; y <= base; y++) for (let x = cx - 8; x <= cx + 8; x++) { const edge = x === cx - 8 || x === cx + 8 || y === base; P.put(x, y, edge ? OUT : (x < cx - 2 ? CON[3] : x < cx + 3 ? CON[2] : CON[1])); }
  shaft(P, cx, top, base - 9, y => 10 + (y - top) / (base - top) * 6, CON, 8);
  // cruzeta de madeira
  const WOOD = ['#4a2f23', '#6e4e39', '#8c6a4c', '#a98562'];
  for (const yy of [top + 10, top + 34]) { for (let y = yy; y < yy + 6; y++) for (let x = cx - 44; x <= cx + 44; x++) { const edge = y === yy + 5 || x === cx - 44 || x === cx + 44; P.put(x, y, edge ? OUT : (y < yy + 2 ? WOOD[3] : y < yy + 4 ? WOOD[2] : WOOD[1])); }
    for (const ix of [-38, -19, 19, 38]) { for (let y = yy - 7; y < yy; y++) for (let x = cx + ix - 2; x <= cx + ix + 2; x++) { const e = x === cx + ix - 2 || x === cx + ix + 2 || y === yy - 7; P.put(x, y, e ? OUT : (x < cx + ix ? '#e4e2d8' : '#b9bdbf')); } } }
  // fios: caem em curva até as bordas
  for (const [yy, off] of [[top + 3, 0], [top + 27, 0]]) for (const ix of [-38, -19, 19, 38]) { const dir = ix < 0 ? -1 : 1, x0 = cx + ix; for (let x = x0; dir > 0 ? x < W : x >= 0; x += dir) { const d = Math.abs(x - x0); P.put(x, yy + Math.round(d * d / 380), '#2b2321'); } }
  // caixa do transformador
  box(P, cx + 10, top + 56, 18, 26, MET);
  return { c: P.c, ax: cx, ay: base };
}

return { lightPole, powerPole };
})();
