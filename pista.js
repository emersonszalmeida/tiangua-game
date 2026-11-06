// Peças de asfalto (losango 128×64) geradas por código; usadas por pista.html e index.html.
const PISTA = (function () {
// ---------- peças de asfalto (losango 128×64, mesma escala do tileset e do personagem) ----------
const P = {
  asf0: '#74787d', asf1: '#797d82', asf2: '#7e8287', asf3: '#84888c', // escuro → claro (tons próximos: o asfalto é quase liso)
  pin: '#92959a', pin2: '#65696e',                                     // pedrinhas
  fai: '#f0ebdd', fai2: '#d0cbbd',                                     // faixa (tinta e tinta gasta)
  ole: '#5a5d63', ole2: '#4c4f55', oleB: '#6e6a84',                    // mancha de óleo
  rem: '#696d72', rem2: '#5c6065',                                     // remendo
  rac: '#4e5156',                                                      // rachadura
};
const W = 128, H = 64;
const hash = (x, y, s = 0) => { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
const inDiamond = (i, j) => Math.abs(i - (W / 2 - .5)) / (W / 2) + Math.abs(j - (H / 2 - .5)) / (H / 2) <= 1;
// coordenadas "do chão": u ao longo do eixo ↘, v ao longo do eixo ↙, de -32 a 32 dentro do losango.
// Uma peça ao lado soma 64 em u (ou v), então tudo que é função de (u mod 64, v mod 64) emenda sem costura.
const uv = (i, j) => [(i - (W / 2 - .5)) / 2 + (j - (H / 2 - .5)), -(i - (W / 2 - .5)) / 2 + (j - (H / 2 - .5))];

// ruído periódico em 64: os pontos da grade na borda usam sempre a mesma semente,
// só o miolo muda entre variações; assim qualquer variação encaixa em qualquer outra
const sm = t => t * t * (3 - 2 * t);
function pnoise(u, v, N, seed) {
  const c = 64 / N, fu = (u + 32) / c, fv = (v + 32) / c, iu = Math.floor(fu), iv = Math.floor(fv), tu = sm(fu - iu), tv = sm(fv - iv);
  const L = (a, b) => { a = ((a % N) + N) % N; b = ((b % N) + N) % N; return hash(a, b, (a === 0 || b === 0) ? 77 + N : seed * 31 + N); };
  const a = L(iu, iv), b = L(iu + 1, iv), d = L(iu, iv + 1), e = L(iu + 1, iv + 1);
  return (a + (b - a) * tu) * (1 - tv) + (d + (e - d) * tu) * tv;
}
function asphalt(u, v, seed, i, j) {
  const n = pnoise(u, v, 4, seed) * .6 + pnoise(u, v, 8, seed + 5) * .4;
  const r = hash(Math.floor((u + 32) * 2) & 127, Math.floor(v + 32) & 63, 3); // grão: depende só de (u,v), então também emenda
  if (r > .975) return P.pin; if (r < .02) return P.pin2;
  return n < .3 ? P.asf0 : n < .6 ? P.asf1 : n < .78 ? P.asf2 : P.asf3;
}
function groundTile(fn) { const c = mk(W, H), x = c.getContext('2d'); for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) if (inDiamond(i, j)) { const [u, v] = uv(i, j); x.fillStyle = fn(u, v, i, j); x.fillRect(i, j, 1, 1); } return c; }

const plain = seed => (u, v) => asphalt(u, v, seed);
// faixa tracejada no meio da peça; 'v' gira para o outro eixo
const dashed = (axis, seed) => (u, v) => {
  const [a, b] = axis === 'u' ? [u, v] : [v, u], k = ((a + 32) % 64 + 64) % 64;
  if (Math.abs(b) <= 2.5 && k >= 14 && k < 46) { const r = hash(Math.floor(a * 2), Math.floor(b * 2), 9); return r > .97 ? asphalt(u, v, seed) : r > .88 ? P.fai2 : P.fai; }
  return asphalt(u, v, seed);
};
const oil = seed => (u, v) => {
  const d = (u / 13) ** 2 + ((v - 3) / 8) ** 2 + (hash(Math.floor(u), Math.floor(v), 4) - .5) * .25;
  if (d < .35) return hash(Math.floor(u * 2), Math.floor(v), 6) > .94 ? P.oleB : P.ole2;
  if (d < 1) return P.ole;
  return asphalt(u, v, seed);
};
const patch = seed => (u, v) => {
  const a = Math.abs(u + 2), b = Math.abs(v - 1);
  if (a < 17 && b < 11) return (a > 15.5 || b > 9.5) ? P.rem2 : (hash(Math.floor(u * 2), Math.floor(v), 8) > .96 ? P.pin : P.rem);
  return asphalt(u, v, seed);
};
const crack = seed => {
  // caminho aleatório ao longo de u (fica longe das bordas para não cortar na emenda)
  const path = {}; let v0 = -4; for (let u = -22; u <= 22; u++) { v0 += (hash(u, 0, seed) - .5) * 1.6; path[u] = v0; }
  const br = {}; let v1 = path[4]; for (let u = 4; u <= 16; u++) { v1 += .55 + (hash(u, 1, seed) - .5); br[u] = v1; }
  return (u, v) => {
    const k = Math.round(u);
    if (path[k] !== undefined && Math.abs(v - path[k]) < .8) return P.rac;
    if (br[k] !== undefined && Math.abs(v - br[k]) < .6) return P.rac;
    return asphalt(u, v, seed);
  };
};

const T = {
  a1: groundTile(plain(1)), a2: groundTile(plain(2)), a3: groundTile(plain(3)), a4: groundTile(plain(4)),
  fu: groundTile(dashed('u', 1)), fv: groundTile(dashed('v', 2)),
  oleo: groundTile(oil(3)), rem: groundTile(patch(4)), rac: groundTile(crack(2)),
};

const plains = [T.a1, T.a2, T.a3, T.a4];
// peça para o tile (x, y) do mapa: asfalto liso na maior parte, com óleo/remendo/rachadura espalhados; tracejado no meio das ruas de 1 tile
function tileFor(x, y, isRoad) {
  const r = hash(x, y, 12);
  const ex = isRoad(x - 1, y) && isRoad(x + 1, y), ey = isRoad(x, y - 1) && isRoad(x, y + 1);
  if (ex && !ey && !isRoad(x, y - 1) && !isRoad(x, y + 1)) return T.fu;
  if (ey && !ex && !isRoad(x - 1, y) && !isRoad(x + 1, y)) return T.fv;
  if (r > .95) return T.oleo; if (r > .91) return T.rem; if (r > .86) return T.rac;
  return plains[(hash(x, y, 13) * 4) | 0];
}

// ---- rua com borda reta: cada pixel da tela decide se é rua pela distância até o eixo da via (em tiles), em vez de usar tiles inteiros ----
const pixFn = { oil: oil(3), patch: patch(4), crack: crack(2), plain: [1, 2, 3, 4].map(plain) };
function colorAt(tx, ty, u, v) {            // cor do asfalto na peça (tx, ty), no ponto (u, v) do chão da peça (-32 a 32)
  const r = hash(tx, ty, 12);
  const f = r > .95 ? pixFn.oil : r > .91 ? pixFn.patch : r > .86 ? pixFn.crack : pixFn.plain[(hash(tx, ty, 13) * 4) | 0];
  return f(u, v);
}
const CELL = 8;
function roadIndex(segs) {                  // segs: [x1, y1, x2, y2, meia-largura] em tiles; devolve grade de busca
  const cells = new Map();
  for (const sg of segs) {
    const r = sg[4], x0 = Math.floor((Math.min(sg[0], sg[2]) - r) / CELL), x1 = Math.floor((Math.max(sg[0], sg[2]) + r) / CELL), y0 = Math.floor((Math.min(sg[1], sg[3]) - r) / CELL), y1 = Math.floor((Math.max(sg[1], sg[3]) + r) / CELL);
    for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) { const k = cx + ',' + cy; (cells.get(k) || cells.set(k, []).get(k)).push(sg); }
  }
  return cells;
}
const onRoad = (cells, x, y) => {
  const list = cells.get(Math.floor(x / CELL) + ',' + Math.floor(y / CELL)); if (!list) return false;
  for (const [x1, y1, x2, y2, r] of list) {
    const dx = x2 - x1, dy = y2 - y1, L = dx * dx + dy * dy, t = L ? Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / L)) : 0, ex = x1 + dx * t - x, ey = y1 + dy * t - y;
    if (ex * ex + ey * ey <= r * r) return true;
  }
  return false;
};
// pedaço quadrado (S×S px) do chão visto na tela, começando em (sx0, sy0); a tela é a mesma do mapa: sx = (x - y) * 64, sy = (x + y) * 32
const EDGE = '#5b5f65';
function roadChunk(cells, sx0, sy0, S) {
  const c = mk(S, S), g = c.getContext('2d'), im = g.createImageData(S, S), N = S + 2, mask = new Uint8Array(N * N);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const sx = sx0 + i - 1 + .5, sy = sy0 + j - 1 + .5; mask[j * N + i] = onRoad(cells, (sx / 64 + sy / 32) / 2, (sy / 32 - sx / 64) / 2) ? 1 : 0; }
  const ed = [0x5b, 0x5f, 0x65];
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
    if (!mask[(j + 1) * N + i + 1]) continue;
    const sx = sx0 + i + .5, sy = sy0 + j + .5, x = (sx / 64 + sy / 32) / 2, y = (sy / 32 - sx / 64) / 2, tx = Math.floor(x), ty = Math.floor(y);
    const edge = !mask[(j + 1) * N + i] || !mask[(j + 1) * N + i + 2] || !mask[j * N + i + 1] || !mask[(j + 2) * N + i + 1];
    const col = edge ? EDGE : colorAt(tx, ty, (x - tx - .5) * 64, (y - ty - .5) * 64), k = (j * S + i) * 4;
    im.data[k] = parseInt(col.slice(1, 3), 16); im.data[k + 1] = parseInt(col.slice(3, 5), 16); im.data[k + 2] = parseInt(col.slice(5, 7), 16); im.data[k + 3] = 255;
  }
  g.putImageData(im, 0, 0); return c;
}
return { T, W, H, hash, mk, tileFor, roadIndex, roadChunk, colorAt };
})();
