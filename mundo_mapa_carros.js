// Carros no mapa grande: vaga do carro de dirigir (na rua em frente ao portão da oficina), velocidade por tipo de chão, e o carro vermelho estacionado dentro da oficina.
// Precisa de MT (mundo_mapa_terreno.js), MAPACHAO, RUAS, CARRO_B64 / CARRO_META (sprites_jogo.js).
MT.tile = (x, z) => [10.5 + ((x - MT.X0) + (z - MT.Z0)) / (2 * MT.TM), 13 + ((z - MT.Z0) - (x - MT.X0)) / (2 * MT.TM)];   // plano (m) -> tiles do jogo
MT.noAsfaltoCasas = (tx, ty) => MAPACHAO.noAsfalto(...MT.plano(tx, ty));   // true = em cima do asfalto
// vaga: na rua mais próxima do portão (tile 18,13), na faixa do lado do portão, virado no sentido dessa faixa (mão direita). Devolve [tx, ty, dir16].
MT.vaga = () => {
  const [px, pz] = MT.plano(18.5, 13.5); let b = null;
  for (const r of RUAS) for (let i = 2; i < r.p.length; i += 2) { const ax = r.p[i - 2], az = r.p[i - 1], dx = r.p[i] - ax, dz = r.p[i + 1] - az, L2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / L2)), qx = ax + dx * t, qz = az + dz * t, d = Math.hypot(px - qx, pz - qz); if (!b || d < b.d) b = { d, qx, qz, w: r.w, dx, dz }; }
  const L = Math.hypot(b.dx, b.dz), nx = -b.dz / L, nz = b.dx / L, s = ((px - b.qx) * nx + (pz - b.qz) * nz) >= 0 ? 1 : -1, vx = nx * s, vz = nz * s;   // v: do eixo da rua para o lado do portão
  const off = Math.min(b.w / 4 + .3, b.w / 2 - 1.3), x = b.qx + vx * off, z = b.qz + vz * off, hx = vz, hz = -vx;   // rumo com a faixa à direita
  const dir = (((Math.round(Math.atan2(hx, hz) / (Math.PI / 8)) % 16) + 16) % 16), [tx, ty] = MT.tile(x, z); return [Math.round(tx * 100) / 100, Math.round(ty * 100) / 100, dir];
};
// carro vermelho: a mesma folha do carro parado, com o azul da lataria virando vermelho (a cabine escura e as rodas ficam como estão)
const CARRO_VERM = (() => {
  let im = null, cv = null;   // a folha (sprites_jogo.js) só existe depois que a página carrega: começa a usar no primeiro desenho
  const recolore = () => { const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; const g = c.getContext('2d'); g.drawImage(im, 0, 0); const d = g.getImageData(0, 0, c.width, c.height), p = d.data;
    for (let i = 0; i < p.length; i += 4) { if (!p[i + 3]) continue; const r = p[i] / 255, gg = p[i + 1] / 255, b = p[i + 2] / 255, mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), l = (mx + mn) / 2, dl = mx - mn; if (dl < .07 || b < mx - 1e-6 || l < .22) continue;   // só tons azulados claros
      const s = l > .5 ? dl / (2 - mx - mn) : dl / (mx + mn), nr = Math.min(1, l * 1 + s * .35), tom = 1 - Math.min(1, s * 1.4 + .15);   // vermelho: mantém o brilho, satura
      const R = Math.min(1, l + (1 - l) * s * .9 + .04), G = Math.max(0, l * (1 - s * 1.35) * .8), B = Math.max(0, l * (1 - s * 1.2) * .78);
      p[i] = Math.round(R * 255); p[i + 1] = Math.round(G * 255); p[i + 2] = Math.round(B * 255); }
    g.putImageData(d, 0, 0); return c; };
  return { desenha(ctx, tx, ty, dir) { if (!im) { im = new Image(); im.src = CARRO_B64.parado; } if (!im.complete || !im.naturalWidth) return; if (!cv) cv = recolore(); const meta = CARRO_META.parado, [cw, ch] = meta.cell, sx = Math.round((tx - ty) * 64 + M * 64), sy = Math.round((tx + ty) * 32), lin = Math.round(dir * meta.dirs.length / 16) * ch;
    ctx.fillStyle = 'rgba(20,20,24,.30)'; ctx.beginPath(); ctx.ellipse(sx, sy, 1.9 * 1.3 * MAPACHAO.PPM * .5 * 1.05, 1.9 * 1.3 * MAPACHAO.PPM * .25, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(cv, 0, lin, cw, ch, sx - Math.round(meta.anchor[0]), sy - Math.round(meta.anchor[1]), cw, ch); ctx.restore(); } };
})();
