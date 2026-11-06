// Peças de transição do chão (usado por chao.html e exportar_chao.mjs).
// Cada material tem uma prioridade: o material de maior prioridade "invade" o vizinho de menor, com borda irregular e contorno escuro.
// Uma peça depende só de quais dos 8 vizinhos são do material invasor (máscara de 8 bits), então se repete: no máximo 47 peças por material.
const MATS = {
  grama: { prio: 0, prim: 'grama_normal', borda: 0 },
  terra: { prio: 1, prim: 'terra_lisa', borda: 1 },
  floresta: { prio: 2, prim: 'floresta_folhas', borda: 1 },
  lama: { prio: 3, prim: 'lama_umida', borda: 1 },
  cascalho: { prio: 4, prim: 'cascalho', borda: 1 },
  madeira: { prio: 5, prim: 'madeira_clara', borda: 0 },   // borda reta, sem invadir
};
const VIZ = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];   // bit i da máscara = vizinho VIZ[i]
const bitViz = (dx, dy) => 1 << VIZ.findIndex(v => v[0] === dx && v[1] === dy);
// diagonal não muda a peça quando um dos dois vizinhos ao lado dela já é do material
function normMask(m) {
  let o = m;
  for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) if (m & (bitViz(dx, 0) | bitViz(0, dy))) o &= ~bitViz(dx, dy);
  return o;
}
const hz = (i, j, s) => { let h = (i * 374761393 + j * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
// ruído que se repete a cada 1 tile (a borda de uma peça continua na peça do lado)
function ruidoP(u, v, P, s) {
  const x = u * P, y = v * P, i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy), h = (a, b) => hz(((a % P) + P) % P, ((b % P) + P) % P, s);
  return (h(i, j) * (1 - sx) + h(i + 1, j) * sx) * (1 - sy) + (h(i, j + 1) * (1 - sx) + h(i + 1, j + 1) * sx) * sy;
}
const PN = 64, PIECES = {};
// 0 = transparente, 1 = preenchimento (textura do material), 2 = contorno
function pieceFor(mask) {
  if (PIECES[mask]) return PIECES[mask];
  const out = new Uint8Array(PN * PN);
  if (mask) for (let j = 0; j < PN; j++) for (let i = 0; i < PN; i++) {
    const u = (i + .5) / PN, v = (j + .5) / PN; let d = 1e9;
    VIZ.forEach(([dx, dy], k) => { if (!(mask & (1 << k))) return; const ex = Math.max(dx - u, 0, u - dx - 1), ey = Math.max(dy - v, 0, v - dy - 1); d = Math.min(d, Math.hypot(ex, ey)); });
    const r = .2 + (ruidoP(u, v, 4, 11) - .5) * .17 + (hz(i, j, 12) - .5) * .02;
    if (d < r) out[j * PN + i] = d > r - .024 ? 2 : 1;
  }
  return PIECES[mask] = out;
}
