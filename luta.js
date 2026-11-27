// LUTA do jogo. Clique esquerdo = socar virado para onde clicou (clicando num personagem, vira exatamente para ele); Q = socar na direção atual. Lutadores são criados com LUTA.cria({x, y, dir, cor, hostil, morre}) pelas cenas. Bateu num, a gangue toda entra na briga.
// SÓ SE BATE EM INIMIGO: cada lutador tem `hostil`. Inimigo (gangue rival) leva golpe, revida e cai; civil não leva dano, não reage e o jogo avisa "não é seu inimigo".
//   Inimigo: 60 de vida; jab (quadro 3) tira 10, cruzado (quadro 5) tira 15. Depois de apanhar ele vai atrás de você (até LONGE casas) e soca: jab 6, cruzado 8 de J.vida. Sem vida: cai e renasce em 4 s.
//   Você zera a vida: cai, aparece "Você morreu" e o R (do jogo) recomeça.
// Usa globais do jogo: P (jogador), J (vida), hx, hy, M, K, cv, ctx, hsx, hsy, aviso().
const LUTA = (function () {
  const ALCANCE = .55, COS_MIN = .5, VIDA = 60, DANO = { 3: 10, 5: 15 }, DANO_NPC = { 3: 4, 5: 5 }, RENASCE_MS = 4000, LONGE = 2.6, ALERTA = 6, VEL = 1, PAUSA_MS = 2000, PROTEGIDO_MS = 2000, TURNO_MS = 500, ANEL = 1.3, PERTO = .9,   /* TURNO_MS: espera entre o fim de um ataque e o início do próximo; ANEL: distância em que rodeiam; PERTO: se você chega a menos disso, quem espera recua */ PUNCH_TOTAL = 85 * 9;
  const VET = { N: [0, -1], NE: [1, -1], E: [1, 0], SE: [1, 1], S: [0, 1], SW: [-1, 1], W: [-1, 0], NW: [-1, -1] };   // teclas na tela
  const DIRS8 = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'];
  // vetor da tela -> vetor em casas (mesma conta do movimento do jogo)
  function emCasas(dx, dy) { const n = Math.hypot(dx, dy) || 1, sx = dx / n, sy = dy / n * .5; return [(sx / 64 + sy / 32) / 2, (sy / 32 - sx / 64) / 2]; }
  function dirPara(ax, ay, bx, by) {   // direção na tela de a para b
    const sx = ((bx - by) - (ax - ay)) * 64, sy = ((bx + by) - (ax + ay)) * 32, k = Math.round(Math.atan2(sy * 2, sx) / (Math.PI / 4));
    return DIRS8[((k % 8) + 8) % 8];
  }
  function dirEstavel(atual, ax, ay, bx, by) {   // só troca de direção se o ângulo passar bem da fronteira (evita ficar pulando entre duas direções)
    const sx = ((bx - by) - (ax - ay)) * 64, sy = ((bx + by) - (ax + ay)) * 32, k = Math.atan2(sy * 2, sx) / (Math.PI / 4), c = DIRS8.indexOf(atual);
    if (c >= 0) { const df = (((k - c) % 8) + 8) % 8, e = Math.min(df, 8 - df); if (e < .8) return atual; }
    return DIRS8[((Math.round(k) % 8) + 8) % 8];
  }
  const novo = (hostil, dir) => ({ hostil, x: 0, y: 0, P: PERS.create(dir), vida: VIDA, morreuEm: 0, golpes: {}, t0: -1, ult: 0, proxAtaque: 0, tAtq: -1, golpesNpc: {}, posto: false });
  const todos = [], rivais = [];   // todos = quem existe; rivais = os hostis
  function cria(o) { const f = novo(o.hostil !== false, o.dir || 'S'); f.x = o.x; f.y = o.y; f.cor = o.cor || null; f.id = o.id || null; f.morre = o.morre || null; f.renasce = !!o.renasce; f.posto = true; todos.push(f); if (f.hostil) rivais.push(f); return f; }
  function limpa() { todos.length = 0; rivais.length = 0; atacante = null; }
  function provoca(now) { for (const r of rivais) if (vivo(r)) PERS.combate(r.P, now); }   // a gangue inteira entra na briga
  let atacante = null;
  const vivo = f => !f.P.dieT0;
  let golpeEm = -1e9, golpeDe = null, golpeAtq = -1;   // último golpe que te acertou; durante PROTEGIDO_MS (atordoado + um tempo livre) ninguém mais te acerta, a não ser o resto do mesmo combo
  let morteEm = 0, eraMorto = false, avisoEm = 0;
  // mx, my: ponto clicado em pixels do canvas do jogo; o personagem está sempre no centro dele
  function viraPara(mx, my) {
    const cx = cv.width / 2, cy = cv.height / 2;
    for (const b of todos) { const bsx = ((b.x - b.y) * 64 + M * 64 - hsx) * K + cx, bsy = ((b.x + b.y) * 32 - hsy) * K + cy - 32 * K; if (vivo(b) && Math.hypot(mx - bsx, my - bsy) < 38 * K) { P.dir = dirPara(hx, hy, b.x, b.y); return; } }   // clicou num personagem: encara ele
    const k = Math.round(Math.atan2((my - cy) * 2, mx - cx) / (Math.PI / 4)); P.dir = DIRS8[((k % 8) + 8) % 8];
  }
  function soco(now, mx, my) { if (J.morto || (typeof D !== 'undefined' && D.ativo) || (typeof CARROT !== 'undefined' && CARROT.ocupado())) return; if (P.punchT0 || P.hitT0 || P.dieT0) return; if (mx !== undefined) viraPara(mx, my); PERS.punch(P, now); }
  function naFrente(f) { const dx = f.x - hx, dy = f.y - hy, d = Math.hypot(dx, dy); if (d > ALCANCE) return null; const [fx, fy] = emCasas(...VET[P.dir]), fn = Math.hypot(fx, fy); return (dx * fx + dy * fy) / (d * fn || 1) < COS_MIN ? null : { dx, dy, d }; }
  let socoT0 = -1, golpes = {};
  function seuSoco(now) {   // cada golpe (jab, cruzado) acerta UM só: o mais perto dentro do alcance e do cone da frente
    if (!P.punchT0) return;
    if (socoT0 !== P.punchT0) { socoT0 = P.punchT0; golpes = {}; }
    const q = PERS.punchFrame(P);
    for (const k in DANO) {
      if (q < +k || golpes[k]) continue; golpes[k] = 1;
      let alvo = null, a = null;
      for (const f of todos) { if (!vivo(f)) continue; const r = naFrente(f); if (r && (!a || r.d < a.d)) { alvo = f; a = r; } }
      if (!alvo) continue;
      if (!alvo.hostil) { if (now - avisoEm > 2500) { avisoEm = now; aviso('Ele não é seu inimigo. Não vale a pena bater.'); } continue; }
      alvo.vida -= DANO[k]; alvo.P.dir = dirPara(alvo.x, alvo.y, hx, hy); alvo.x += a.dx / (a.d || 1) * .03; alvo.y += a.dy / (a.d || 1) * .03;   // empurrãozinho
      if (alvo.vida <= 0) { alvo.vida = 0; PERS.die(alvo.P, now); alvo.morreuEm = now; } else PERS.hit(alvo.P, now);
      for (const r of rivais) if (vivo(r) && Math.hypot(r.x - hx, r.y - hy) <= ALERTA) PERS.combate(r.P, now);   // quem apanha alerta a gangue: todos num raio de ALERTA casas vêm ajudar
    }
  }
  atacante = null; let proxTurno = 0, giro = 0, proxGiro = 0;   // atacante: só UM inimigo ataca por vez (a vez dele); os outros esperam rodeando
  function soltaVez(f, now) { atacante = null; if (f.atacou) f.ultAtaque = now; f.atacou = false; proxTurno = now + TURNO_MS * (.3 + Math.random() * 1.6); }   // o intervalo até o próximo varia (de 30% a 190% de TURNO_MS)
  function anda(f, tx, ty, vel, now, dt, encara) {   // anda até (tx,ty) sem sair de cima de ninguém; continua olhando para você
    const N = f.P, dx = tx - f.x, dy = ty - f.y, d = Math.hypot(dx, dy);
    if (f.andando ? d < .08 : d < .25) { f.andando = false; return false; }   /* só começa a andar se estiver a mais de .25 do ponto, e só para quando chegar perto (.08): sem liga-desliga tremendo */
    f.andando = true;
    const v = Math.min(d, vel * dt); f.x += dx / d * v; f.y += dy / d * v;
    for (const g of todos) { if (g === f || !vivo(g)) continue; const ex = f.x - g.x, ey = f.y - g.y, e = Math.hypot(ex, ey); if (e < .3 && e > 0) { f.x += ex / e * (.3 - e); f.y += ey / e * (.3 - e); } }
    PERS.step(N, 1, 0, false, now); encara(); return true;
  }
  const agressivo = (f, now) => f.P.combT0 && now - f.P.combT0 < 8000;
  function revida(f, now, dt) {   // true se está andando
    const N = f.P, dx = hx - f.x, dy = hy - f.y, d = Math.hypot(dx, dy);
    if (!f.hostil || N.dieT0 || J.morto || P.dieT0) return false;
    if (N.punchT0) {   // golpes em andamento
      if (f.tAtq !== N.punchT0) { f.tAtq = N.punchT0; f.golpesNpc = {}; }
      const q = PERS.punchFrame(N);
      for (const k in DANO_NPC) {
        if (q < +k || f.golpesNpc[k]) continue; f.golpesNpc[k] = 1;
        if (d > ALCANCE + .05) continue;
        const mesmoCombo = golpeDe === f && golpeAtq === N.punchT0;
        if (now - golpeEm < PROTEGIDO_MS && !mesmoCombo) continue;
        if (!mesmoCombo) { golpeEm = now; golpeDe = f; golpeAtq = N.punchT0; PERS.hit(P, now); }
        J.vida -= DANO_NPC[k];
        if (J.vida <= 0) { J.vida = 0; PERS.die(P, now); morteEm = now; }
      }
      return false;
    }
    if (atacante === f && (N.hitT0 || (f.atacou && !N.punchT0))) soltaVez(f, now);   // levou golpe ou terminou o ataque: passa a vez
    if (!agressivo(f, now) || N.hitT0 || d > ALERTA) return false;
    const encara = () => { N.dir = dirEstavel(N.dir, f.x, f.y, hx, hy); };
    if (atacante === f) {   // é a vez dele: vai até você e soca
      if (d > ALCANCE * .8) return anda(f, hx, hy, VEL, now, dt, encara);
      encara(); if (!f.atacou) { PERS.punch(N, now); f.atacou = true; f.proxAtaque = now + PAUSA_MS + PUNCH_TOTAL; }
      return false;
    }
    // espera a vez. Quem acabou de bater fica onde está (não recua nem volta para o círculo); os outros rodeiam você a ANEL e recuam se você chegar muito perto
    if (f.ultAtaque && now - f.ultAtaque < 4000 && d <= ANEL + .5) { N.dir = dirEstavel(N.dir, f.x, f.y, hx, hy); return false; }
    if (d < PERTO) { encara(); return anda(f, f.x - dx / d * 1, f.y - dy / d * 1, VEL * 1.3, now, dt, encara); }
    const a = f.slot + giro, tx = hx + Math.cos(a) * ANEL, ty = hy + Math.sin(a) * ANEL;
    encara(); return anda(f, tx, ty, VEL, now, dt, encara);
  }
  function desenhaCor(f, sx, sy) {   // mesmo recolorir da camiseta usado nos NPCs (desenhaNpc)
    NPCG.clearRect(0, 0, 200, 200); NPCG.save(); NPCG.translate(100, 170); PERS.draw(NPCG, f.P, 0, 0); NPCG.restore();
    const im = NPCG.getImageData(0, 0, 200, 200), p = im.data; for (let i = 0; i < p.length; i += 4) { if (!p[i + 3]) continue; for (let k = 0; k < 3; k++) { const o = CAMISA[k]; if (Math.abs(p[i] - o[0]) < 3 && Math.abs(p[i + 1] - o[1]) < 3 && Math.abs(p[i + 2] - o[2]) < 3) { p[i] = f.cor[k][0]; p[i + 1] = f.cor[k][1]; p[i + 2] = f.cor[k][2]; break; } } }
    NPCG.putImageData(im, 0, 0); ctx.drawImage(NPCCV, Math.round(sx - 100), Math.round(sy - 170));
  }
  function itens(now) {
    if (J.morto) eraMorto = true; else if (eraMorto) { eraMorto = false; PERS.revive(P); P.combT0 = 0; }   // o R do jogo recomeça: levanta todos
    if (P.dieT0 && !J.morto && now - morteEm > 1700) J.morto = true;   // deixa a queda aparecer antes da tela de morte
    // quem é o atacante da vez: o mais perto dos que estão em briga, livres e fora da pausa
    const briga = rivais.filter(r => vivo(r) && agressivo(r, now) && Math.hypot(r.x - hx, r.y - hy) <= ALERTA);
    briga.forEach((r, i) => { r.slot = i / briga.length * Math.PI * 2; });
    if (now >= proxGiro) { giro += .7; proxGiro = now + 3000; }   /* de tempos em tempos todos mudam de posição em volta de você (anda, para, olha), em vez de ficar girando sem parar */
    if (atacante && (!briga.includes(atacante) || !vivo(atacante))) soltaVez(atacante, now);
    if (!atacante && now >= proxTurno && !J.morto && !P.dieT0) { const livres = briga.filter(r => !r.P.hitT0 && now >= r.proxAtaque).sort((a, b) => Math.hypot(a.x - hx, a.y - hy) - Math.hypot(b.x - hx, b.y - hy)); if (livres[0]) { atacante = livres[0]; atacante.atacou = false; } }
    for (const f of todos) {
      const dt = Math.min(.05, f.ult ? (now - f.ult) / 1000 : 0); f.ult = now;
      if (!revida(f, now, dt)) PERS.step(f.P, 0, 0, false, now);
      if (f.P.dieT0 && !f.avisouMorte) { f.avisouMorte = true; if (f.morre) f.morre(f); }
      if (f.P.dieT0 && f.renasce && now - f.morreuEm > RENASCE_MS) { PERS.revive(f.P); f.vida = VIDA; f.avisouMorte = false; }
    }
    seuSoco(now);
    // sai da guarda quando o inimigo morre ou os dois se afastam
    const luta = rivais.some(r => vivo(r) && Math.hypot(r.x - hx, r.y - hy) <= LONGE);   /* a SUA guarda cai se todos estiverem a mais de LONGE */
    if (!luta) P.combT0 = 0;
    for (const r of rivais) if (!vivo(r) || Math.hypot(r.x - hx, r.y - hy) > ALERTA) r.P.combT0 = 0;
    return todos.map(f => ({ d: f.x + f.y, f: () => {
      const sx = (f.x - f.y) * 64 + M * 64, sy = (f.x + f.y) * 32;
      if (f.cor) desenhaCor(f, sx, sy); else PERS.draw(ctx, f.P, sx, sy);
      if (f.hostil && !f.P.dieT0) { const bx = Math.round(sx) - 10, by = Math.round(sy) - 70; ctx.fillStyle = '#000'; ctx.fillRect(bx - 1, by - 1, 22, 4); ctx.fillStyle = '#b3261e'; ctx.fillRect(bx, by, Math.round(20 * f.vida / VIDA), 2); }
    } }));
  }
  cv.addEventListener('mousedown', e => { if (e.button !== 0) return; const r = cv.getBoundingClientRect(); soco(performance.now(), (e.clientX - r.left) * cv.width / r.width, (e.clientY - r.top) * cv.height / r.height); });
  return { soco, itens, cria, limpa, provoca, todos, rivais, vivo };
})();
