// Textura de asfalto (a mesma paleta, grão e manchas da antiga pista.js), gerada por código e que emenda em todas as bordas.
// 1 pixel da textura = 1 pixel de arte do jogo (1/PPM metro). Devolve um canvas S×S.
function fazTexturaAsfalto(S = 512) {
  const P = { a: ['#74787d', '#797d82', '#7e8287', '#84888c'], pin: '#92959a', pin2: '#65696e', ole: '#5a5d63', ole2: '#4c4f55', oleB: '#6e6a84', rem: '#696d72', rem2: '#5c6065', rac: '#4e5156' };
  const hash = (x, y, s = 0) => { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const sm = t => t * t * (3 - 2 * t);
  const pn = (x, y, N, seed) => { const c = S / N, fx = x / c, fy = y / c, ix = Math.floor(fx), iy = Math.floor(fy), tx = sm(fx - ix), ty = sm(fy - iy), L = (a, b) => hash(((a % N) + N) % N, ((b % N) + N) % N, seed * 31 + N); const a = L(ix, iy), b = L(ix + 1, iy), d = L(ix, iy + 1), e = L(ix + 1, iy + 1); return (a + (b - a) * tx) * (1 - ty) + (d + (e - d) * tx) * ty; };
  const cv = document.createElement('canvas'); cv.width = cv.height = S; const g = cv.getContext('2d');
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const n = pn(x, y, 32, 1) * .6 + pn(x, y, 64, 6) * .4, r = hash(x, y, 3);
    g.fillStyle = r > .975 ? P.pin : r < .02 ? P.pin2 : n < .3 ? P.a[0] : n < .6 ? P.a[1] : n < .78 ? P.a[2] : P.a[3]; g.fillRect(x, y, 1, 1);
  }
  const px = (x, y, c) => { g.fillStyle = c; g.fillRect(((x % S) + S) % S, ((y % S) + S) % S, 1, 1); };
  const oleo = (cx, cy, s) => { for (let y = -22; y <= 22; y++) for (let x = -34; x <= 34; x++) { const d = (x / 26) ** 2 + (y / 14) ** 2 + (hash(x, y, s) - .5) * .25; if (d < .35) px(cx + x, cy + y, hash(x, y, s + 1) > .94 ? P.oleB : P.ole2); else if (d < 1) px(cx + x, cy + y, P.ole); } };
  const remendo = (cx, cy, s) => { for (let y = -12; y <= 12; y++) for (let x = -20; x <= 20; x++) { const e = Math.abs(x) > 18 || Math.abs(y) > 10; px(cx + x, cy + y, e ? P.rem2 : hash(x, y, s) > .96 ? P.pin : P.rem); } };
  const rachadura = (cx, cy, s) => { let y = 0; for (let x = -45; x <= 45; x++) { y += (hash(x, 0, s) - .5) * 1.6; for (let k = -1; k <= 0; k++) px(cx + x, cy + Math.round(y) + k, P.rac); if (x > 5 && x < 30) px(cx + x, cy + Math.round(y) + Math.round((x - 5) * .55), P.rac); } };
  oleo(150, 120, 11); oleo(400, 330, 21); remendo(330, 90, 31); remendo(90, 380, 41); rachadura(250, 250, 5); rachadura(440, 460, 7); rachadura(70, 230, 9);
  return cv;
}

// Textura de tinta gasta (faixas): como na pista antiga, uns 12% dos pontos na cor mais escura e uns 3% furados, mostrando o asfalto por baixo.
function fazTexturaTinta(cor, cor2, S = 256) {
  const hash = (x, y, s = 0) => { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const cv = document.createElement('canvas'); cv.width = cv.height = S; const g = cv.getContext('2d');
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const r = hash(x, y, 9); if (r > .97) continue; g.fillStyle = r > .88 ? cor2 : cor; g.fillRect(x, y, 1, 1); }
  return cv;
}
