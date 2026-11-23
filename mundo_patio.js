// ---------- Pátio da zona industrial: corre noturno de furtividade + bicos pontuais ----------
// Inserido entre mundo_bloco.js e mundo_cena.js. O pátio fica ao sul, a oeste da rua lateral (células x 3..16, y 24..30).
// Entradas: portão a leste (x=17, y 28..29) e uma fresta no muro do norte (x 4..5), por um corredor estreito entre a casa e o muro (os "dutos").
const WP = [[15.4, 25.8], [8.4, 25.8], [8.4, 30.2], [15.4, 30.2]];   // ronda do vigia em volta do bloco de paletes
const PAT_DIRS = [[-1, 0.05], [1, 0.15], [0.05, -1], [1, 0.15]];     // olhar da patota: oeste, leste, norte, leste
const Z = { v: { x: 15.4, y: 25.8, i: 1, fx: -1, fy: 0, pausa: 0, inv: null, mov: false }, p: { x: 6.8, y: 27.8, fx: -1, fy: 0.05, t: 0, k: 0 }, det: 0, latas: [] };
const missaoZ = () => J.f.z === 'ir' || J.f.z === 'volta';
const dirTela = (vx, vy) => { const sx = vx - vy, sy = vx + vy, a = Math.abs(sx), b = Math.abs(sy); return [a < .4 * b ? 0 : Math.sign(sx), b < .4 * a ? 0 : Math.sign(sy)]; };
function viraNpc(id, vx, vy) { const [dx, dy] = dirTela(vx, vy); NPCP[id].dir = dy < 0 ? (dx < 0 ? 'NW' : dx > 0 ? 'NE' : 'N') : dy > 0 ? (dx < 0 ? 'SW' : dx > 0 ? 'SE' : 'S') : dx < 0 ? 'W' : 'E'; }
const bloqVisao = (x, y) => rectsP.some(([a, b, c, d]) => x > a && x < c && y > b && y < d) || MOVEIS.some(m => m.cobre && x > m.x && x < m.x + m.w && y > m.y && y < m.y + m.d);
function semObstaculo(x0, y0, x1, y1) { const d = Math.hypot(x1 - x0, y1 - y0), n = Math.ceil(d / .07); for (let i = 1; i < n; i++) { const t = i / n; if (bloqVisao(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t)) return false; } return true; }
const vigias = () => [{ x: Z.v.x, y: Z.v.y, fx: Z.v.fx, fy: Z.v.fy, range: 4.2 + (J.f.visto ? 1 : 0), half: 36 }, { x: Z.p.x, y: Z.p.y, fx: Z.p.fx, fy: Z.p.fy, range: 3.8 + (J.f.visto ? 1 : 0), half: 42 }];
function enxerga(w) {
  const dx = hx - w.x, dy = hy - w.y, d = Math.hypot(dx, dy); if (d > w.range) return false;
  const perto = d < 1.0;
  if (!perto) { const c = (dx * w.fx + dy * w.fy) / (d * Math.hypot(w.fx, w.fy)); if (c < Math.cos(w.half * Math.PI / 180)) return false; }
  return semObstaculo(w.x, w.y, hx, hy);
}
function irParaVia(v, tx, ty, sp, dt) { const dx = tx - v.x, dy = ty - v.y, d = Math.hypot(dx, dy); if (d < .001) return d; const s = Math.min(d, sp * dt); v.x += dx / d * s; v.y += dy / d * s; v.fx = dx / d; v.fy = dy / d; v.mov = true; return d - s; }
function investiga(x, y, t) {
  const v = Z.v; let via = 0, bd = 1e9; WP.forEach((p, k) => { const d = Math.hypot(p[0] - x, p[1] - y); if (d < bd) { bd = d; via = k; } });
  v.inv = { x, y, t, via }; v.pausa = 0;
}
function patioTick(dt) {
  const v = Z.v, p = Z.p, f = J.f;
  // vigia
  v.mov = false;
  if (v.inv) {
    if (v.inv.via != null) { const [tx, ty] = WP[v.inv.via]; if (irParaVia(v, tx, ty, 2.1, dt) < .1) { v.i = (v.inv.via + 1) % 4; v.inv.via = null; } }
    else if (irParaVia(v, v.inv.x, v.inv.y, 2.1, dt) < .15) { v.mov = false; v.inv.t -= dt; if (v.inv.t <= 0) { let b = 0, bd = 1e9; WP.forEach((q, k) => { const d = Math.hypot(q[0] - v.x, q[1] - v.y); if (d < bd) { bd = d; b = k; } }); v.inv = null; v.i = b; v.pausa = .6; } }
  } else if (v.pausa > 0) v.pausa -= dt;
  else { const [tx, ty] = WP[v.i]; if (irParaVia(v, tx, ty, 1.15, dt) < .05) { v.i = (v.i + 1) % 4; v.pausa = .9; } }
  // patota: troca a direção do olhar a cada 2,8 s
  p.t += dt; if (p.t >= 2.8) { p.t = 0; p.k = (p.k + 1) % PAT_DIRS.length; [p.fx, p.fy] = PAT_DIRS[p.k]; }
  if (!missaoZ() || J.morto) { Z.det = 0; return; }
  // latas: pisar chama o vigia
  for (const l of Z.latas) { l.cd = Math.max(0, (l.cd || 0) - dt); if (!l.cd && Math.hypot(hx - l.x, hy - l.y) < .5) { l.cd = 6; f.ruido = 1; investiga(l.x, l.y, 6); aviso('Uma lata rola e faz barulho.'); } }
  // visão
  if (vigias().some(enxerga)) { Z.det += dt; if (Z.det >= .55) detectado(); } else Z.det = Math.max(0, Z.det - dt * .8);
}
function detectado() {
  Z.det = 0; Z.v.inv = null; Z.v.pausa = 1; J.f.visto = 1; J.vida = Math.max(5, J.vida - 20);
  dlgSeq([['Vigia', 'Ei! Você aí! Parado!'], ['', 'O vigia te agarra pelo colarinho e te joga pra fora do portão. Você cai de mau jeito. A cara ficou marcada naquele setor.']], () => { hx = 17.7; hy = 28.6; desenhaHud(true); });
}
// ---- desenho: o cone de visão no chão (barrado por parede e carga) ----
function patioDesenha(now) {
  if (!missaoZ()) return [];
  return [{ d: -2, f: () => {
    for (const w of vigias()) {
      const ang = Math.atan2(w.fy, w.fx), H = w.half * Math.PI / 180, pts = [[w.x, w.y]];
      for (let k = 0; k <= 14; k++) { const a = ang - H + 2 * H * k / 14; let r = .2; while (r < w.range && !bloqVisao(w.x + Math.cos(a) * r, w.y + Math.sin(a) * r)) r += .15; pts.push([w.x + Math.cos(a) * r, w.y + Math.sin(a) * r]); }
      ctx.beginPath(); pts.forEach(([x, y], k) => k ? ctx.lineTo(sxm(x, y), sym(x, y)) : ctx.moveTo(sxm(x, y), sym(x, y))); ctx.closePath();
      ctx.fillStyle = Z.det > 0 ? 'rgba(255,70,50,.40)' : 'rgba(255,225,110,.30)'; ctx.fill();
    }
  } }];
}
// ---- terreno e paredes ----
function patioMapa(par, reta, reserva) {
  reta(3, 24, 16, 30);   // chão de terra batida do pátio
  reta(4, 23, 17, 23);   // corredor entre a casa e o muro (os dutos)
  for (let n = 3; n <= 16; n++) { if (n !== 4) par('x', 24, n, 'mid'); par('x', 31, n, 'mid'); }
  for (let n = 24; n <= 30; n++) { par('y', 3, n, 'mid'); if (n !== 28) par('y', 17, n, 'mid'); }
  reserva(3, 23, 16, 30);
}
// ---- móveis, luzes, latas, NPCs e achados ----
function patioMoveis(movel, liga) {
  Z.latas = [{ x: 12.2, y: 30.3 }, { x: 6.2, y: 25.4 }, { x: 15.2, y: 29.0 }];
  const caixaDet = (g, pr, o) => { lin(g, '#58402a', pr(.1, .1, o.zt), pr(.7, .1, o.zt)); };
  const palete = (x, y, w, d, h) => movel({ x, y, w, d, cobre: true, partes: [{ w, d, h, cores: COR.caixa, det: caixaDet }] });
  movel({ x: 10.6, y: 27.3, w: 3.0, d: 1.7, cobre: true, partes: [{ w: 3.0, d: 1.7, h: 34, cores: COR.caixa, det: caixaDet }, { dx: .3, dy: .2, w: 1.5, d: 1.2, h: 22, z0: 34, cores: ['#b8905a', '#9a7348', '#7c5b38'] }] });
  palete(14.6, 27.0, .8, .8, 26); palete(5.3, 26.1, .7, .7, 22); palete(9.0, 28.0, .6, .6, 20); palete(15.0, 30.0, .6, .6, 24);
  const tonel = movel({ x: 4.2, y: 30.0, w: .55, d: .55, cobre: true, partes: [{ w: .55, d: .55, h: 28, cores: ['#7a3b32', '#5e2c25', '#47211c'] }] });
  const prat = movel({ x: 3.2, y: 28.0, w: .8, d: 1.5, cobre: true, partes: [{ w: .8, d: 1.5, h: 46, cores: COR.ferro, det: (g, pr, o) => { ret(g, '#6fa3c4', ...pr(.2, .5, o.zt - 10), 4, 3); } }] });
  liga(prat, 4.6, 28.8, 1.5, 'Pegar o módulo da prateleira', () => {
    const f = J.f, h = (J.t / 60) % 24;
    if (!(h >= 18 || h < 5)) return dlgSeq([['', 'Tem gente demais no pátio: carregadores, caminhão. Só vale a pena à noite.']]);
    if (!daItem('modulo')) return; f.z = 'volta'; desenhaHud(true);
    dlgSeq([['', 'Entre uma caixa e outra, preso numa prateleira de ferro: o módulo fora de linha, embrulhado em plástico bolha. Você guarda sem fazer barulho.'], ['', 'Agora é voltar até o Tadeu sem ninguém ver.']]);
  }, () => J.f.z === 'ir');
  const pilha = movel({ x: 15.6, y: 24.5, w: .6, d: .6, bloq: false, partes: [{ w: .6, d: .6, h: 14, cores: ['#9a9aa2', '#7b7b83', '#5c5c63'] }] });
  liga(pilha, 15.9, 25.2, 1.4, 'Chutar a pilha de latas', () => {
    J.f.distrator = 1; investiga(7.4, 25.3, 9);
    dlgSeq([['', 'Você chuta a pilha. As latas desabam do outro lado do pátio com um estrondo. O vigia vira a cabeça e vai conferir.']]);
  }, () => J.f.z === 'ir');
  for (const l of Z.latas) movel({ x: l.x - .12, y: l.y - .12, w: .24, d: .24, bloq: false, partes: [{ w: .24, d: .24, h: 6, cores: ['#aab0b8', '#868b93', '#6a6e75'] }] });
  LUZES.push({ x: 16.3, y: 27.2, z: 80, r: 200 }, { x: 6.5, y: 26.6, z: 80, r: 200 }, { x: 11.7, y: 30.7, z: 80, r: 190 });
  // vigia e patota
  const vig = { get x() { return Z.v.x - .25; }, get y() { return Z.v.y - .25; }, w: .5, d: .5, bloq: false, npc: true, desenha: now => { viraNpc('vigia', Z.v.fx, Z.v.fy); const [mx, my] = Z.v.mov ? dirTela(Z.v.fx, Z.v.fy) : [0, 0]; desenhaNpc('vigia', Z.v.x, Z.v.y, [hexRgb('#c9c3a0'), hexRgb('#5c5a44'), hexRgb('#968f6e')], now, mx, my); } }; MOVEIS.push(vig);
  const pat = { x: Z.p.x - .25, y: Z.p.y - .25, w: .5, d: .5, bloq: true, npc: true, desenha: now => { viraNpc('patota', Z.p.fx, Z.p.fy); desenhaNpc('patota', Z.p.x, Z.p.y, [hexRgb('#6a6f78'), hexRgb('#2c2f35'), hexRgb('#4b4f57')], now); } }; MOVEIS.push(pat);
  // achados na rua (cada um só uma vez)
  const achado = (id, x, y, valor, rot, txt) => { const m = movel({ x, y, w: .18, d: .18, bloq: false, partes: [{ w: .18, d: .18, h: 2, cores: ['#f2d36b', '#c9a43a', '#9a7a22'] }], ativo: () => !J.f['ach_' + id] }); liga(m, x + .1, y + .1, 1.2, rot, () => { J.f['ach_' + id] = 1; J.grana += valor; desenhaHud(true); aviso('+ R$ ' + valor); dlgSeq([['', txt]]); }, () => !J.f['ach_' + id]); };
  achado('a1', 19.2, 20.6, 6, 'Pegar o que brilha na sarjeta', 'Seis reais em moedas, grudadas de lama na beira da sarjeta. Alguém deixou cair e nem voltou.');
  achado('a2', 14.7, 9.0, 10, 'Pegar a cédula dobrada', 'Uma cédula dobrada em quatro, presa atrás do poste. R$ 10. Dinheiro de alguém, mas já virou da rua.');
  achado('a3', 8.4, 28.4, 8, 'Pegar os trocados no chão', 'Trocados espalhados na terra do pátio, entre palete e palete. R$ 8. Nem o vigia se deu ao trabalho de pegar.');
}
