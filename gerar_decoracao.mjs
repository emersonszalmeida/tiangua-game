// Gera as decorações de chão (grama alta, flores, pedras, cogumelos, extras) em PIXEL ART de verdade,
// desenhadas por código com paleta fixa (nada de recorte de imagem). Saída: decoracao/*.png + decoracao/_conferencia.png
// uso: node gerar_decoracao.mjs
import fs from 'node:fs';
import { encodePNG } from './pngenc.mjs';
const OUT = new URL('./decoracao/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
fs.mkdirSync(OUT, { recursive: true });

// ---------- paleta (mesma família do chão: verdes #849766/#7a8e5a/#6c7f50, marrons da terra) ----------
const P = {
  g0: '#36442a', g1: '#445535', g2: '#566a3d', g3: '#6b8149', g4: '#86a063', g5: '#a3b883',
  y1: '#8a7a45', y2: '#a8925a', y3: '#c2ab70',
  ear1: '#a8905a', ear2: '#7e6a3c',
  b0: '#4a3626', b1: '#654c38', b2: '#745843', b3: '#8a6a4c', b4: '#a07e58', b5: '#b89a72',
  s0: '#4f4a45', s1: '#6b645c', s2: '#857c71', s3: '#a0968a', s4: '#b8ae9f',
  sb0: '#4a525c', sb1: '#66707c', sb2: '#828d99', sb3: '#9ea9b4',
  wh: '#f0ece0', wh2: '#cfc9b8', ye: '#e8c23a', ye2: '#f6dc70', ye3: '#b8901f',
  pu: '#8a6ab8', pu2: '#5f4590', pu3: '#b49ad8',
  rd: '#c23a2e', rd2: '#8f2420', rd3: '#e0604a', rdc: '#3a1a14',
  bl: '#5b8fd0', bl2: '#3d68a8', bl3: '#8cb4e8',
  cap: '#8a5a38', cap2: '#6a4028', cap3: '#aa7448',
  cream: '#d8c8a0', cream2: '#b8a67c', cream3: '#ece0c4',
  rcap: '#c8322c', rcap2: '#962420', rcap3: '#e85a4a',
  l1: '#a8622c', l2: '#7e4620', l3: '#c88040', l4: '#8f5a2a',
};
const rgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const hex = c => '#' + c.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const dark = (h, f) => hex(rgb(h).map(v => v * f));
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ---------- tela ----------
const novo = (w, h) => ({ w, h, d: new Array(w * h).fill(null) });
const set = (g, x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < g.w && y < g.h) g.d[y * g.w + x] = c; };
const get = (g, x, y) => (x < 0 || y < 0 || x >= g.w || y >= g.h) ? null : g.d[y * g.w + x];
function line(g, x0, y0, x1, y1, c) { x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1); const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy; for (;;) { set(g, x0, y0, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } } }
// contorno seletivo: pixel com vazio embaixo/à direita escurece mais; vazio em cima/à esquerda escurece pouco
function rim(g, fb = .62, fa = .82) { const c = g.d.slice(); for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) { const v = get(g, x, y); if (!v) continue; const low = !get(g, x, y + 1) || !get(g, x + 1, y), any = !get(g, x, y - 1) || !get(g, x - 1, y); if (low) c[y * g.w + x] = dark(v, fb); else if (any) c[y * g.w + x] = dark(v, fa); } g.d = c; }
// elipse com luz vinda de cima à esquerda; tons = [sombra, base, meio, claro]
function domo(g, cx, cy, rx, ry, tons, seed = 1, speck = .12, meia = false) {
  const r = rng(seed);
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
    const nx = (x - cx) / rx, ny = (y - cy) / ry; if (nx * nx + ny * ny > 1) continue; if (meia && y > cy) continue;
    const l = -(nx * .6 + ny * .8); let i = l > .5 ? 3 : l > .08 ? 2 : l > -.38 ? 1 : 0; const q = r(); if (q < speck) i = Math.max(0, i - 1); else if (q > 1 - speck / 2) i = Math.min(3, i + 1);
    set(g, x, y, tons[i]);
  }
}
function encher(g, frac = .4, gap = 2) { const y0 = Math.floor(g.h * (1 - frac)); for (let y = y0; y < g.h; y++) { let ult = -9; for (let x = 0; x < g.w; x++) { const v = get(g, x, y); if (v) { if (ult >= 0 && x - ult > 1 && x - ult <= gap + 1) for (let k = ult + 1; k < x; k++) set(g, k, y, y > g.h - 3 ? P.g0 : P.g1); ult = x; } } } }
const aparar = g => { let x0 = g.w, y0 = g.h, x1 = -1, y1 = -1; for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) if (get(g, x, y)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } const o = novo(x1 - x0 + 1, y1 - y0 + 1); for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) o.d[(y - y0) * o.w + x - x0] = get(g, x, y); return o; };

// ---------- folha de capim (lâmina afunilada) ----------
function lamina(g, bx, by, h, lean, curve, cols, grossa = false) {
  let px = bx, py = by;
  for (let k = 0; k < h; k++) { const t = h > 1 ? k / (h - 1) : 0, xx = Math.round(bx + lean * t + curve * t * t), yy = by - k, c = cols[Math.min(cols.length - 1, Math.floor(t * cols.length))];
    if (k) line(g, px, py, xx, yy, c); else set(g, xx, yy, c); if (grossa && t < .3) set(g, xx + 1, yy, cols[Math.min(cols.length - 1, Math.floor(t * cols.length) + 1)]); px = xx; py = yy; }
  return [Math.round(bx + lean + curve), by - h + 1];
}
function espiga(g, x, y, len = 4) { for (let e = 0; e < len; e++) { set(g, x, y - e, P.ear1); if (e > 0 && e < len - 1) set(g, x + 1, y - e, P.ear2); } set(g, x, y - len, P.ear2); }

function tufo(w, h, n, seed, { seco = false, espigas = 0, magro = false } = {}) {
  n = Math.round(n * 1.5); const g = novo(w, h + 6), r = rng(seed), half = (w - 1) / 2, base = g.h - 1, lam = [];
  for (let i = 0; i < n; i++) { const u = (i + .5) / n * 2 - 1 + (r() - .5) * .25, bh = Math.round(h * (.5 + .5 * (1 - Math.abs(u) ** 1.6)) * (.86 + .14 * r())); lam.push({ u, bx: Math.round(half + u * (half - 1.5)), bh, lean: u * half * (magro ? .35 : .55) + (r() - .5) * 1.6 }); }
  lam.sort((a, b) => Math.abs(b.u) - Math.abs(a.u));
  const tips = [];
  lam.forEach((l, i) => { const claro = i % 2, cols = seco && i % 3 === 0 ? [P.g1, P.y1, P.y2, P.y3] : claro ? [P.g1, P.g2, P.g3, P.g4, P.g5] : [P.g0, P.g1, P.g2, P.g3, P.g4]; tips.push([l, lamina(g, l.bx, base, l.bh, l.lean, l.lean * .6, cols, l.bh > 9)]); });
  const altos = tips.slice().sort((a, b) => a[1][1] - b[1][1]).slice(0, espigas); altos.forEach(([l, [tx, ty]]) => espiga(g, tx, ty - 1, 4));
  encher(g, .3, 1); for (let x = Math.floor(half - 3); x <= Math.ceil(half + 3); x++) set(g, x, base, P.g0);
  return aparar(g);
}

// ---------- flores ----------
const cab = {
  margarida(g, x, y) { for (const [dx, dy] of [[0, -2], [0, 2], [-2, 0], [2, 0]]) set(g, x + dx, y + dy, P.wh2); for (const [dx, dy] of [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]]) set(g, x + dx, y + dy, P.wh); set(g, x, y, P.ye); set(g, x + 1, y + 1, P.wh2); set(g, x, y + 1, P.wh2); },
  botao(g, x, y) { for (const [dx, dy, c] of [[-1, -1, P.ye2], [0, -1, P.ye], [1, -1, P.ye], [-1, 0, P.ye], [0, 0, P.ye2], [1, 0, P.ye], [-1, 1, P.ye3], [0, 1, P.ye3], [1, 1, P.ye3], [2, 0, P.ye3], [-2, 0, P.ye3]]) set(g, x + dx, y + dy, c); },
  papoula(g, x, y) { for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { if (Math.abs(dx) === 2 && Math.abs(dy) === 2) continue; const c = dy >= 1 || dx >= 2 ? P.rd2 : (dx <= -1 && dy <= -1) ? P.rd3 : P.rd; set(g, x + dx, y + dy, c); } set(g, x, y, P.rdc); },
  azul(g, x, y) { for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { if (Math.abs(dx) + Math.abs(dy) > 3) continue; const c = dy >= 1 || dx >= 2 ? P.bl2 : (dx <= -1 && dy <= 0) ? P.bl3 : P.bl; set(g, x + dx, y + dy, c); } set(g, x, y, P.ye2); },
  sino(g, x, y) { for (const [dx, dy, c] of [[-1, -1, P.pu3], [0, -1, P.pu], [1, -1, P.pu], [-1, 0, P.pu], [0, 0, P.pu], [1, 0, P.pu2], [-1, 1, P.pu2], [0, 1, P.pu2], [1, 1, P.pu2]]) set(g, x + dx, y + dy, c); },
  botao_pequeno(g, x, y) { set(g, x, y, P.rd); set(g, x + 1, y, P.rd2); set(g, x, y - 1, P.rd3); set(g, x, y + 1, P.rd2); },
};
function folhagem(g, cx, base, larg, alt, seed) { const r = rng(seed); for (let i = 0; i < 9; i++) { const u = (i / 8) * 2 - 1, h = Math.round(alt * (.55 + .45 * (1 - Math.abs(u))) * (.8 + .2 * r())); lamina(g, Math.round(cx + u * larg * .3), base, h, u * larg * .5, u * larg * .25, [P.g0, P.g1, P.g2, P.g3], true); } encher(g, .5, 2); for (let x = cx - 3; x <= cx + 3; x++) set(g, x, base, P.g0); }
function caule(g, x0, y0, x1, y1, seed) { line(g, x0, y0, x1, y1, P.g1); const mx = Math.round((x0 + x1) / 2), my = Math.round((y0 + y1) / 2), d = x1 >= x0 ? 1 : -1; set(g, mx + d, my, P.g3); set(g, mx + 2 * d, my - 1, P.g2); set(g, mx - d, my + 1, P.g3); set(g, mx - 2 * d, my + 1, P.g2); }
function planta(w, h, hastes, seed) {
  const g = novo(w, h), cx = Math.round(w / 2) - 1, base = h - 1; folhagem(g, cx, base, w, Math.round(h * .42), seed);
  for (const hs of hastes) { const [hx, hy, tipo] = hs; if (tipo === 'lavanda') { caule(g, cx + (hx - cx) * .3, base - 2, hx, hy + 6, seed); for (let k = 0; k < 8; k++) { const yy = hy + k, par = k % 2; set(g, hx, yy, k < 2 ? P.pu3 : par ? P.pu : P.pu2); if (k > 0 && k < 7) set(g, hx + (par ? 1 : -1), yy, par ? P.pu2 : P.pu); } set(g, hx, hy - 1, P.pu3); } else { caule(g, cx + (hx - cx) * .3, base - 2, hx, hy + 2, seed); cab[tipo](g, hx, hy); } }
  return aparar(g);
}

// ---------- pedras ----------
function pedra(w, h, tons, seed, speck = .06, musgo = false) { const g = novo(w, h), r = rng(seed); domo(g, (w - 1) / 2, (h - 1) / 2 + .5, w / 2, h / 2, tons, seed, speck); for (let x = 0; x < w; x++) { for (let y = 0; y < h; y++) { const v = get(g, x, y); if (v && r() < .025 && y < h - 2) set(g, x, y, tons[3]); } } if (musgo) for (let k = 0; k < Math.max(2, w >> 2); k++) { const x = Math.floor(r() * w), y = Math.floor(r() * h * .5); if (get(g, x, y)) set(g, x, y, r() < .5 ? P.g2 : P.g3); } rim(g, .6, .8); return g; }
function juntar(w, h, itens) { const g = novo(w, h); for (const [s, x, y] of itens) for (let j = 0; j < s.h; j++) for (let i = 0; i < s.w; i++) { const v = get(s, i, j); if (v) set(g, x + i, y + j, v); } return aparar(g); }

// ---------- cogumelos ----------
const COG = { marrom: { c: [P.cap2, P.cap, P.cap3, P.cap3], d: false }, vermelho: { c: [P.rcap2, P.rcap, P.rcap3, P.rcap3], d: true }, bege: { c: [P.cream2, P.cream, P.cream3, P.cream3], d: false } };
function cogu(g, cx, base, s, tipo, seed = 1) {
  const k = COG[tipo], r = rng(seed), capW = Math.max(5, Math.round(5.6 * s)), capH = Math.max(4, Math.round(4 * s)), stH = Math.max(3, Math.round(3.2 * s)), stW = Math.max(2, Math.round(1.5 * s));
  const capB = base - stH;
  for (let y = 0; y < stH; y++) for (let x = 0; x < stW; x++) set(g, Math.round(cx - stW / 2 + x + .01), base - y, x === stW - 1 ? P.cream2 : y === 0 ? P.cream2 : P.cream);
  for (let r2 = 0; r2 < capH; r2++) { const t = (capH - 1 - r2) / capH, hw = (capW / 2) * Math.sqrt(Math.max(0, 1 - t * t)), y = capB - (capH - 1) + r2;
    for (let x = Math.round(cx - hw); x <= Math.round(cx + hw - .01); x++) { let c = k.c[1]; const nx = (x - cx) / (capW / 2); if (r2 <= capH * .45 && nx < .05) c = k.c[2]; if (r2 === capH - 1 || nx > .62) c = k.c[0]; set(g, x, y, c); } }
  if (k.d) { const n = Math.max(1, Math.round(s * 1.6)); for (let i = 0; i < n; i++) { const x = Math.round(cx - capW / 4 + r() * capW / 2), y = capB - capH + 2 + Math.floor(r() * (capH - 2)); if (get(g, x, y) && get(g, x, y) !== P.rcap2) set(g, x, y, P.wh); } }
}
function cogumelo(w, h, itens, tipo, seed) { const g = novo(w, h); itens.sort((a, b) => a[2] - b[2]).forEach(([x, s, base, t], i) => cogu(g, x, base, s, t || tipo, seed + i)); return aparar(g); }

// ---------- extras ----------
function folha(g, x, y, c, dir = 1, tam = 5) { const w = tam, tons = [c[0], c[1], c[2], c[2]]; domo(g, x + (w - 1) / 2, y, w / 2, 1.6, tons, x * 7 + y, 0); for (let i = 1; i < w - 1; i++) if (get(g, x + i, y)) set(g, x + i, y, c[0]); }
function galho(w, h) { const g = novo(w, h); line(g, 1, h - 3, w - 2, 2, P.b1); line(g, 1, h - 4, w - 2, 1, P.b3); line(g, 6, h - 5, 9, h - 9, P.b2); line(g, 11, h - 7, 15, h - 10, P.b2); line(g, 14, 5, 17, 3, P.b2); set(g, 1, h - 3, P.b0); set(g, 2, h - 3, P.b0); return aparar(g); }
function trevo(w, h, seed) { const g = novo(w, h); const pts = [[4, 9], [10, 10], [15, 6], [7, 4], [13, 13]]; for (const [x, y] of pts) { for (const [dx, dy] of [[-3, 0], [1, 0], [-1, -2]]) { for (let j = 0; j < 2; j++) for (let i = 0; i < 3; i++) set(g, x + dx + i, y + dy + j, j ? (i === 2 ? P.g1 : P.g2) : (i === 0 ? P.g4 : P.g3)); } set(g, x, y + 1, P.g0); set(g, x, y + 2, P.g0); } return aparar(g); }

// ---------- monta tudo ----------
const S = {};
S.grama_alta_1 = tufo(16, 24, 8, 11, { espigas: 2 });
S.grama_alta_2 = tufo(22, 28, 12, 22, { espigas: 4 });
S.grama_alta_3 = tufo(20, 24, 11, 33, { seco: true, espigas: 3 });
S.grama_alta_4 = tufo(13, 24, 6, 44, { magro: true, espigas: 1 });
S.flor_margarida = planta(18, 18, [[4, 5, 'margarida'], [13, 4, 'margarida'], [9, 8, 'margarida']], 5);
S.flor_amarela = planta(17, 17, [[4, 6, 'botao'], [11, 4, 'botao'], [8, 8, 'botao'], [14, 8, 'botao']], 6);
S.flor_lavanda = planta(15, 17, [[3, 4, 'lavanda'], [7, 1, 'lavanda'], [11, 4, 'lavanda']], 7);
S.flor_papoula = planta(17, 17, [[4, 5, 'papoula'], [12, 4, 'papoula'], [8, 8, 'botao_pequeno']], 8);
S.flor_azul = planta(17, 18, [[4, 5, 'azul'], [11, 4, 'azul'], [8, 9, 'azul'], [14, 9, 'azul']], 9);
S.flor_mista = planta(17, 18, [[3, 7, 'botao'], [8, 4, 'margarida'], [13, 5, 'margarida'], [6, 9, 'sino'], [11, 9, 'sino']], 10);
S.flor_papoula_b = planta(17, 18, [[4, 4, 'papoula'], [11, 3, 'papoula'], [14, 8, 'botao_pequeno'], [8, 8, 'papoula']], 12);
S.flor_azul_b = planta(15, 17, [[4, 5, 'azul'], [11, 4, 'azul'], [8, 9, 'azul']], 13);
S.pedra_mini = pedra(4, 3, [P.b1, P.b2, P.b3, P.b4], 3, .1);
S.pedra_pequena = pedra(10, 8, [P.s1, P.s2, P.s3, P.s4], 4);
S.pedra_grande = pedra(16, 13, [P.b2, P.s1 === 0 ? P.s2 : '#80705e', '#9c8a76', '#b29e88'], 5, .07);
S.pedra_dupla = juntar(17, 13, [[pedra(11, 10, ['#6e5c4a', '#86735f', '#9c8a76', '#b29e88'], 6, .06), 0, 0], [pedra(6, 5, ['#6e5c4a', '#86735f', '#9c8a76', '#b29e88'], 7), 9, 7], [pedra(5, 4, ['#6e5c4a', '#86735f', '#9c8a76', '#b29e88'], 8), 4, 8]]);
S.pedra_chata = pedra(15, 7, [P.sb0, P.sb1, P.sb2, P.sb3], 9, .12);
S.pedra_trio = juntar(16, 12, [[pedra(8, 7, [P.s1, P.s2, P.s3, P.s4], 10, .06, true), 2, 0], [pedra(7, 6, [P.s0, P.s1, P.s2, P.s3], 11), 0, 5], [pedra(6, 5, [P.s1, P.s2, P.s3, P.s4], 12), 8, 6]]);
S.cogumelo_1 = cogumelo(9, 9, [[4, 1, 8]], 'marrom', 1);
S.cogumelo_2 = cogumelo(9, 9, [[4, 1, 8]], 'vermelho', 2);
S.cogumelo_3 = cogumelo(16, 14, [[5, 1.7, 11], [10, 1.2, 12], [3, 1, 13], [13, 1, 10]], 'marrom', 3);
S.cogumelo_4 = cogumelo(11, 10, [[5, 1.1, 9]], 'bege', 4);
S.cogumelo_5 = cogumelo(16, 12, [[4, 1.2, 10], [10, 1.5, 11], [8, .9, 7], [13, 1, 11]], 'vermelho', 5);
S.cogumelo_6 = cogumelo(11, 12, [[5, 1.5, 11]], 'marrom', 6);
S.cogumelo_7 = cogumelo(11, 12, [[5, 1.5, 11]], 'vermelho', 7);
S.cogumelo_8 = cogumelo(18, 16, [[6, 2, 13], [12, 1.4, 14], [3, 1.1, 15], [15, 1.1, 13]], 'marrom', 8);
S.cogumelo_9 = cogumelo(13, 12, [[6, 1.4, 11]], 'bege', 9);
S.cogumelo_10 = cogumelo(18, 14, [[5, 1.6, 11], [12, 1.9, 13], [9, 1, 7]], 'vermelho', 10);
S.folha_1 = (() => { const g = novo(8, 4); folha(g, 1, 2, [P.l2, P.l1, P.l3], 1, 6); return aparar(g); })();
S.folhas_monte = (() => { const g = novo(20, 11); folha(g, 1, 3, [P.l2, P.l1, P.l3], 1, 6); folha(g, 9, 2, [P.l4, P.l3, P.l1], 1, 5); folha(g, 4, 6, [P.l2, P.l4, P.l3], 1, 6); folha(g, 13, 7, [P.l2, P.l1, P.l3], 1, 6); folha(g, 8, 9, [P.l4, P.l1, P.l3], 1, 5); folha(g, 14, 4, [P.l4, P.l3, P.l1], 1, 4); return aparar(g); })();
S.galho = galho(21, 12);
S.trevo = trevo(18, 14, 4);

// ---------- grava ----------
const lista = Object.entries(S);
for (const [nome, g] of lista) { const d = new Uint8Array(g.w * g.h * 4); g.d.forEach((c, i) => { if (c) { const v = rgb(c); d.set([v[0], v[1], v[2], 255], i * 4); } }); fs.writeFileSync(OUT + nome + '.png', encodePNG(g.w, g.h, d)); }
// folha de conferência (zoom 5, sobre a cor da grama)
const Z = 5, W = 1100; let x = 8, y = 8, rh = 0; const pos = [];
for (const [nome, g] of lista) { if (x + g.w * Z > W - 8) { x = 8; y += rh + 10; rh = 0; } pos.push([g, x, y]); x += g.w * Z + 10; rh = Math.max(rh, g.h * Z); }
const H = y + rh + 8, im = new Uint8Array(W * H * 4); for (let i = 0; i < W * H; i++) im.set([0x84, 0x97, 0x66, 255], i * 4);
for (const [g, ox, oy] of pos) for (let j = 0; j < g.h * Z; j++) for (let i = 0; i < g.w * Z; i++) { const c = get(g, (i / Z) | 0, (j / Z) | 0); if (c) im.set([...rgb(c), 255], ((oy + j) * W + ox + i) * 4); }
fs.writeFileSync(OUT + '_conferencia.png', encodePNG(W, H, im));
console.log(lista.map(([n, g]) => n + ' ' + g.w + 'x' + g.h).join(', '));
