// CARRO do jogo (CARROT). As cenas colocam o carro com CARROT.poeEm(x, y, dir) e liberam com CARROT.disponivel = true.
// Dentro do carro: as teclas escolhem a direção NA TELA (W cima, S baixo, A esquerda, D direita, e diagonais), como o personagem; o carro vira na hora e acelera enquanto segura; Espaço freia; E com o carro quase parado = descer.
// E perto do carro (até LONGE_MAX casas) = o personagem ANDA até a porta do motorista e então entra (animação do Mixamo); E de novo = sai. E durante a caminhada cancela.
// Usa CARRO_B64 / CARRO_META (sprites_jogo.js). Globais do jogo: P, hx, hy, M, ctx, aviso().
const CARROT = (function () {
  const PPM = 65 / 1.76, AX = .58, AZ = .35, ENTRA_FIM = [-1.86, -.146], SAI_FIM = [1.48, -.10];   // metros no quadro do carro: banco; deslocamento do quadril ao longo do clipe de entrar (fim) e de sair (fim)
  const IM = {}, META = CARRO_META; for (const k in CARRO_B64) { IM[k] = new Image(); IM[k].src = CARRO_B64[k]; }
  const VET = { N: [0, -1], NE: [1, -1], E: [1, 0], SE: [1, 1], S: [0, 1], SW: [-1, 1], W: [-1, 0], NW: [-1, -1] };
  const ANG = Array.from({ length: 16 }, (_, i) => i * 22.5), TURNO_MS = 45, PERDA_PASSO = .88;   // 16 direções; tempo entre passos de giro; velocidade que sobra a cada passo
  const LONGE_MAX = 7, VEL = 1.2;   // casas; casas por segundo (mesma velocidade de andar do jogo)
  const REPETE_MS = 420, VMAX = 12, VRE = -4, ACEL_M = 6, FREIO = 14, ATRITO = 3.5, GIRO = 85, PASSO_RODA = .106;   // m/s, m/s, m/s², m/s², m/s², graus/s; metros por quadro de roda (18°)
  const c = { diagEm: 0, giroAnt: 0, tGiro: 0, v: 0, rumo: 0, dist: 0, ultD: 0, ult: 0, ini: 0, on: false, x: 0, y: 0, dir: 0, disp: false, amigoOn: false, re: false, estado: 'parado', t0: 0, am: { P: PERS.create('S'), est: 'fora', existe: false, x: 0, y: 0, t0: 0, rota: [], ini: 0, ult: 0, comJog: false } };   // am = amigo: fora | indo | entrando | dentro | saindo
  // metros no quadro do carro (x = lado do motorista, z = frente) -> casas do mapa, com o carro virado para a direção atual
  function emCasas(xc, zc) { const a = ANG[c.dir] * Math.PI / 180, xw = xc * Math.cos(a) + zc * Math.sin(a), zw = -xc * Math.sin(a) + zc * Math.cos(a), sx = xw * PPM, sy = zw * PPM * .5; return [(sx / 64 + sy / 32) / 2, (sy / 32 - sx / 64) / 2]; }
  // casas (relativas ao centro do carro) -> metros no quadro do carro (inverso de emCasas)
  function emMetros(ox, oy) { const sx = (ox - oy) * 64, sy = (ox + oy) * 32, xw = sx / PPM, zw = sy / (PPM * .5), a = ANG[c.dir] * Math.PI / 180; return [xw * Math.cos(a) - zw * Math.sin(a), xw * Math.sin(a) + zw * Math.cos(a)]; }
  // caixa do carro (com folga) que o personagem não atravessa
  const CX = 1.17 + .65, CZ = 2.75 + .65, dentro = (x, z) => Math.abs(x) < CX - .01 && Math.abs(z) < CZ - .01;
  const livre = (a, b) => { for (let i = 0; i <= 40; i++) { const u = i / 40; if (dentro(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u)) return false; } return true; };
  const comp = ps => ps.slice(1).reduce((t, p, i) => t + Math.hypot(p[0] - ps[i][0], p[1] - ps[i][1]), 0);
  function rotaAteAPorta(de, para) {   // pontos (metros, quadro do carro) para contornar o carro; usa 1 ou 2 cantos da caixa
    if (livre(de, para)) return [para];
    const cantos = [[CX, CZ], [CX, -CZ], [-CX, -CZ], [-CX, CZ]].map(p => [p[0] * 1.001, p[1] * 1.001]); let melhor = null;
    for (const a of cantos) { const r1 = [de, a, para]; if (livre(de, a) && livre(a, para) && (!melhor || comp(r1) < comp(melhor))) melhor = r1;
      for (const b of cantos) { if (a === b) continue; const r2 = [de, a, b, para]; if (livre(de, a) && livre(a, b) && livre(b, para) && (!melhor || comp(r2) < comp(melhor))) melhor = r2; } }
    return (melhor || [de, para]).slice(1);
  }
  // posição do personagem (metros no quadro do carro) no instante t (ms já aceleradas) do clipe: interpola entre os quadros
  function segue(nome, t) { const m = META[nome], ms = m.ms; let k = 0, acc = 0; for (; k < ms.length - 1; k++) { if (t < acc + ms[k]) break; acc += ms[k]; } const u = k >= ms.length - 1 ? 0 : Math.max(0, Math.min(1, (t - acc) / ms[k])), a = m.raiz[k], b = m.raiz[Math.min(ms.length - 1, k + 1)];
    const sg = c.pass ? -1 : 1, [ox, oy] = emCasas(sg * (a[0] + (b[0] - a[0]) * u), a[1] + (b[1] - a[1]) * u); hx = c.x + ox; hy = c.y + oy; }
  function viraNoFim() { const r = META.sair.raiz, a = r[r.length - 1], b = r[Math.max(0, r.length - 4)], dx = (a[0] - b[0]) * (c.pass ? -1 : 1), dz = a[1] - b[1], ang = ANG[c.dir] * Math.PI / 180, xw = dx * Math.cos(ang) + dz * Math.sin(ang), zw = -dx * Math.sin(ang) + dz * Math.cos(ang), k = Math.round(Math.atan2(zw, xw) / (Math.PI / 4)); P.dir = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'][((k % 8) + 8) % 8]; }
  // metros no mundo (x = direita da tela, z = para baixo) -> casas
  function emCasasMundo(xw, zw) { const sx = xw * PPM, sy = zw * PPM * .5; return [(sx / 64 + sy / 32) / 2, (sy / 32 - sx / 64) / 2]; }
  function pontoLivre(x, y) { try { return x > .3 && y > .3 && x < M - .3 && y < M - .3 && !objetos.some(o => bateArv(o, x, y)) && !bateParede(x, y) && !(typeof carroBloqueado === 'function' && carroBloqueado(x, y)); } catch (e) { return true; } }
  function carroLivre(x, y, a) {   // centro, frente e traseira (e os cantos da frente/traseira) do carro
    for (const [l, lado] of [[0, 0], [2.3, 0], [-2.3, 0], [2.0, .9], [2.0, -.9], [-2.0, .9], [-2.0, -.9]]) { const [ox, oy] = emCasasMundo(Math.sin(a) * l + Math.cos(a) * lado, Math.cos(a) * l - Math.sin(a) * lado); if (!pontoLivre(x + ox, y + oy)) return false; }
    return true;
  }
  const NOMES_DIR = ['S', 'SE', 'E', 'NE', 'N', 'NW', 'W', 'SW'];   // direções das teclas = linhas pares (0,2,4...) das folhas de 16   // na ordem das linhas das folhas
  function dirige(dt) {
    const sem = c.am.est === 'indo' || c.am.est === 'entrando' || c.am.est === 'saindo', dxx = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0), dyy = (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0), dx = sem ? 0 : dxx, dy = sem ? 0 : dyy, agora = performance.now();
    let acel = false, freia = !!keys.Space || sem;
    const passos = alvo => ((alvo - c.dir + 24) % 16) - 8;   // -8..7: passos de giro até o alvo (sinal = lado)
    const gira = f => { if (f !== 0 && agora - c.tGiro >= TURNO_MS) { c.tGiro = agora; c.lado = f > 0 ? 1 : -1; c.dir = (c.dir + c.lado + 16) % 16; c.rumo = ANG[c.dir]; c.v *= PERDA_PASSO; } c.alvo = c.dir; };
    if (dx || dy) {
      const nome = dy < 0 ? (dx < 0 ? 'NW' : dx > 0 ? 'NE' : 'N') : dy > 0 ? (dx < 0 ? 'SW' : dx > 0 ? 'SE' : 'S') : dx < 0 ? 'W' : 'E', atual = NOMES_DIR[(c.teclaAlvo || 0) / 2] || 'S';
      if (nome.length === 2) c.diagEm = agora;
      if (!(nome.length === 1 && atual.length === 2 && atual.includes(nome) && agora - c.diagEm < 150)) c.teclaAlvo = NOMES_DIR.indexOf(nome) * 2;   // soltar uma das duas teclas da diagonal quase junto não muda o alvo
      if (!c.re) {
        const f = passos(c.teclaAlvo);
        if (Math.abs(f) <= 4) { gira(f); acel = true; }   // tecla para a frente (até 90° de cada lado): vira e acelera
        else { freia = true; if (c.v <= .05) c.re = true; }   // tecla para trás: freia; parado e ainda apertando, passa a dar ré
      } else {
        const f = passos((c.teclaAlvo + 8) % 16);   // em ré o carro fica virado ao contrário da tecla
        if (Math.abs(f) <= 4) { gira(f); acel = true; }
        else { freia = true; if (c.v >= -.05) c.re = false; }   // tecla para a frente do carro: freia e depois segue em frente
      }
    } else if (Math.abs(c.v) < .05) c.re = false;
    if (acel) c.v = c.re ? Math.max(VRE, Math.min(0, c.v) - ACEL_M * .7 * dt) : Math.min(VMAX, Math.max(0, c.v) + ACEL_M * dt);
    else if (!freia) c.v = Math.sign(c.v) * Math.max(0, Math.abs(c.v) - ATRITO * dt);
    if (freia) c.v = Math.sign(c.v) * Math.max(0, Math.abs(c.v) - FREIO * dt);
    const a = ANG[c.dir] * Math.PI / 180, m = c.v * dt, [ox, oy] = emCasasMundo(Math.sin(a) * m, Math.cos(a) * m);
    if (carroLivre(c.x + ox, c.y + oy, a)) { c.x += ox; c.y += oy; c.dist += m; }
    else if (carroLivre(c.x + ox, c.y, a)) { c.x += ox; c.dist += m * .5; c.v *= .8; }
    else if (carroLivre(c.x, c.y + oy, a)) { c.y += oy; c.dist += m * .5; c.v *= .8; }
    else c.v = 0;
    if ((!acel) && Math.abs(c.v) < .05 && c.dir % 2) { c.dir = (c.dir + (c.lado || 1) + 16) % 16; c.alvo = c.dir; c.rumo = ANG[c.dir]; }   // parou: trava numa das 8 direções principais
    const [sx, sy] = emCasas(META.sair.raiz[0][0], META.sair.raiz[0][1]);    // o jogador (e a câmera) fica no banco do motorista; tudo em pixels inteiros para a câmera e o carro não tremerem um contra o outro
    const ex = (c.x - c.y) * 64 + M * 64, ey = (c.x + c.y) * 32;   // histerese: um ruído de 0,001 perto de x,5 não vira pulo de 1 pixel
    if (c.sx === undefined || Math.abs(ex - c.sx) > .75) c.sx = Math.round(ex);
    if (c.sy === undefined || Math.abs(ey - c.sy) > .75) c.sy = Math.round(ey);
    const ofx = Math.round((sx - sy) * 64), ofy = Math.round((sx + sy) * 32), ax = c.sx + ofx - M * 64, ay = c.sy + ofy;
    hx = (ax / 64 + ay / 32) / 2; hy = (ay / 32 - ax / 64) / 2;
  }
  // ---- amigo ----
  function facingFimAmigo() { const r = META.sairP.raiz, a = r[r.length - 1], b = r[Math.max(0, r.length - 4)], dx = -(a[0] - b[0]), dz = a[1] - b[1], ang = ANG[c.dir] * Math.PI / 180, xw = dx * Math.cos(ang) + dz * Math.sin(ang), zw = -dx * Math.sin(ang) + dz * Math.cos(ang), k = Math.round(Math.atan2(zw, xw) / (Math.PI / 4)); return ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'][((k % 8) + 8) % 8]; }
  function chamaAmigo(now) {
    const am = c.am;
    if (am.est === 'dentro') { am.est = 'saindo'; am.t0 = now; am.comJog = false; return; }
    if (am.est !== 'fora') return;
    if (!am.existe) { let p = null; for (const [mx, mz] of [[-6, -2], [-6, 2], [-5, 5], [-5, -5], [-8, 0], [6, 6], [6, -6]]) { const [ox, oy] = emCasas(mx, mz), x = c.x + ox, y = c.y + oy; if (pontoLivre(x, y)) { p = [x, y]; break; } } if (!p) { aviso('Sem espaço para o amigo'); return; } am.x = p[0]; am.y = p[1]; am.existe = true; }
    const de = emMetros(am.x - c.x, am.y - c.y);
    am.est = 'indo'; am.ini = now; am.ult = now; am.rota = rotaAteAPorta(de, [-META.entrarP.raiz[0][0], META.entrarP.raiz[0][1]]);
  }
  function atualizaAmigo(now) {
    const am = c.am;
    if (am.est === 'indo') {
      const dt = Math.min(.05, (now - am.ult) / 1000); am.ult = now;
      const alvoM = am.rota[0], [ox, oy] = emCasas(alvoM[0], alvoM[1]), tx = c.x + ox, ty = c.y + oy, dx = tx - am.x, dy = ty - am.y, d = Math.hypot(dx, dy), ultimo = am.rota.length === 1;
      if (d < .06) { if (!ultimo) am.rota.shift(); else { am.x = tx; am.y = ty; am.est = 'entrando'; am.t0 = now; } }
      else if (now - am.ini > 15000) { const [qx, qy] = emCasas(-META.entrarP.raiz[0][0], META.entrarP.raiz[0][1]); am.x = c.x + qx; am.y = c.y + qy; am.est = 'entrando'; am.t0 = now; }
      else {
        const sdx = ((tx - ty) - (am.x - am.y)) * 64, sdy = ((tx + ty) - (am.x + am.y)) * 32, k = Math.round(Math.atan2(sdy * 2, sdx) / (Math.PI / 4)), [kx, ky] = VET[['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'][((k % 8) + 8) % 8]];
        const v = Math.min(d, VEL * dt); am.x += dx / d * v; am.y += dy / d * v; PERS.step(am.P, kx, ky, false, now);
      }
    } else if (am.est === 'fora') PERS.step(am.P, 0, 0, false, now);
    if (am.est === 'entrando' && now - am.t0 > fim('entrarP') - 600) am.est = 'dentro';
    if (am.est === 'saindo' && now - am.t0 > fim('sairP') - 600) {
      const r = META.sairP.raiz, e = r[r.length - 1], [ox, oy] = emCasas(-e[0], e[1]); am.x = c.x + ox; am.y = c.y + oy; am.P.dir = facingFimAmigo(); am.est = 'fora'; PERS.step(am.P, 0, 0, false, now);
      if (am.comJog) { am.comJog = false; c.v = 0; c.re = false; c.estado = 'saindo'; c.t0 = now; }   // o amigo já desceu: agora é a sua vez
    }
  }
  function poe() {
    const [dx, dy] = VET[P.dir], n = Math.hypot(dx, dy * .5) || 1, sx = dx / n, sy = dy * .5 / n;
    const px = hx + (sx / 64 + sy / 32) / 2 * 110, py = hy + (sy / 32 - sx / 64) / 2 * 110, ang = ANG[c.dir] * Math.PI / 180;
    const procuraLivre = () => { let melhor = null, md = 1e9; for (let ox = -7; ox <= 7; ox += .5) for (let oy = -7; oy <= 7; oy += .5) { const d = ox * ox + oy * oy; if (d < md && carroLivre(px + ox, py + oy, ang)) { md = d; melhor = [px + ox, py + oy]; } } return melhor || [px, py]; };
    [c.x, c.y] = procuraLivre(); c.on = true; c.estado = 'parado';
  }
  const ACEL = 1.7, fim = (nome) => META[nome].ms.reduce((s, v) => s + v, 0) / ACEL;   // ACEL: as animações do Mixamo de entrar e sair são lentas (5,5 s); no jogo tocam 1,7x mais rápido
  function quadro(nome, t) { const ms = META[nome].ms; let k = 0, acc = 0; for (; k < ms.length - 1; k++) { if (t < acc + ms[k]) break; acc += ms[k]; } return k; }
  const ENTRA_MAX = 3.2;   // casas do centro do carro: de mais longe o E não pega o carro
  function perto() { return c.on && c.estado === 'parado' && c.disp && Math.hypot(hx - c.x, hy - c.y) <= ENTRA_MAX; }
  const ocupado = () => c.on && c.estado !== 'parado';
  function rotulo() { if (c.estado === 'dentro') return c.pass ? 'Descer do carro' : 'Descer do carro (carro parado)'; if (c.estado === 'indo') return 'Cancelar'; return perto() ? 'Entrar no carro' : ''; }
  function interage() {
    if (!c.on) return false; const now = performance.now();
    if (c.estado === 'parado') {
      if (!perto()) return false;
      c.estado = 'indo'; c.ini = now; c.ult = now; const de = emMetros(hx - c.x, hy - c.y); c.pass = de[0] < -.3; c.rota = rotaAteAPorta(de, [(c.pass ? -1 : 1) * META.entrar.raiz[0][0], META.entrar.raiz[0][1]]);   // anda até onde o clipe começa, do lado em que você está
    } else if (c.estado === 'indo') { c.estado = 'parado'; PERS.step(P, 0, 0, false, now); }
    else if (c.estado === 'dentro') { if (Math.abs(c.v) > 1.2 || c.dir % 2) { aviso('Pare o carro para descer'); return true; }
      if (!c.pass && (c.am.est === 'indo' || c.am.est === 'entrando' || c.am.est === 'saindo')) return true;
      if (!c.pass && c.am.est === 'dentro') { c.v = 0; c.am.est = 'saindo'; c.am.t0 = now; c.am.comJog = true; return true; }
      c.v = 0; c.re = false; c.estado = 'saindo'; c.t0 = now; }
    return true;
  }
  addEventListener('keydown', e => { if (e.repeat) return; if (e.code === 'KeyF' && c.amigoOn && c.on && c.estado === 'dentro' && !c.pass) { if (Math.abs(c.v) > 1.2 || c.dir % 2) aviso('Pare o carro primeiro'); else chamaAmigo(performance.now()); } });
  // a pé: não atravessa o carro estacionado
  function bate(x, y) { if (!c.on || c.estado === 'dentro') return false; const [mx, mz] = emMetros(x - c.x, y - c.y); return Math.abs(mx) < 1.0 && Math.abs(mz) < 2.35; }
  function poeEm(x, y, dir) { c.x = x; c.y = y; c.dir = ((dir | 0) % 16 + 16) % 16; c.v = 0; c.re = false; c.on = true; c.estado = 'parado'; api.escondido = false; }
  function reinicia() { c.on = false; c.estado = 'parado'; c.v = 0; c.re = false; c.disp = false; c.pass = false; api.escondido = false; c.am.est = 'fora'; c.am.existe = false; }
  function itens(now) {
    if (!c.on) return [];
    if (c.estado === 'indo') {
      const dt = Math.min(.05, (now - c.ult) / 1000); c.ult = now;
      const alvoM = c.rota[0], [ox, oy] = emCasas(alvoM[0], alvoM[1]), tx = c.x + ox, ty = c.y + oy, dx = tx - hx, dy = ty - hy, d = Math.hypot(dx, dy), ultimo = c.rota.length === 1;
      if (d < .06) { if (!ultimo) c.rota.shift(); else { hx = tx; hy = ty; c.estado = 'entrando'; c.t0 = now; api.escondido = true; } }
      else if (now - c.ini > 15000) { c.estado = 'parado'; aviso('Não consegui chegar até a porta'); }
      else {
        const sdx = ((tx - ty) - (hx - hy)) * 64, sdy = ((tx + ty) - (hx + hy)) * 32, k = Math.round(Math.atan2(sdy * 2, sdx) / (Math.PI / 4)), [kx, ky] = VET[['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'][((k % 8) + 8) % 8]];
        const v = Math.min(d, VEL * dt); hx += dx / d * v; hy += dy / d * v; c.interno = true; PERS.step(P, kx, ky, false, now); c.interno = false;
      }
    }
    if (c.estado === 'entrando' && now - c.t0 > fim('entrar') - 600) { c.estado = 'dentro'; c.rumo = ANG[c.dir]; c.alvo = c.dir; c.teclaAlvo = c.dir; c.re = false; c.v = 0; c.ultD = now; c.sx = undefined; c.sy = undefined; }
    atualizaAmigo(now);
    if (c.estado === 'dentro') { if (c.pass) segue('entrar', 1e9); else { const dt = Math.min(.05, (now - c.ultD) / 1000); c.ultD = now; dirige(dt); } }
    if (c.estado === 'saindo' && now - c.t0 > fim('sair') - 600) { segue('sair', 1e9); viraNoFim(); c.estado = 'parado'; api.escondido = false; }
    if (c.estado === 'entrando') segue('entrar', (now - c.t0) * ACEL); if (c.estado === 'saindo') segue('sair', (now - c.t0) * ACEL);
    const nome = c.estado === 'indo' ? 'parado' : c.estado === 'entrando' ? 'entrar' : c.estado === 'dentro' ? (c.pass ? 'entrar' : c.am.est === 'entrando' ? 'entrarP' : c.am.est === 'saindo' ? 'sairP' : c.am.est === 'dentro' ? 'dirigirP' : 'dirigir') : c.estado === 'saindo' ? 'sair' : 'parado', im = IM[nome], meta = META[nome];
    if (!im.complete || !im.naturalWidth) return [];
    const q = c.estado === 'parado' || c.estado === 'indo' ? 0 : c.estado === 'dentro' && !c.pass && (nome === 'entrarP' || nome === 'sairP') ? quadro(nome, (now - c.am.t0) * ACEL) : c.estado === 'dentro' && c.pass ? META.entrar.frames - 1 : c.estado === 'dentro' ? (c.dir === 0 ? 1 + (((Math.floor(c.dist / PASSO_RODA) % 3) + 3) % 3) : (((Math.floor(c.dist / PASSO_RODA) % 4) + 4) % 4)) : quadro(nome, (now - c.t0) * ACEL), esp = c.pass && (c.estado === 'entrando' || c.estado === 'saindo' || c.estado === 'dentro'), d = esp ? (16 - c.dir) % 16 : c.dir;   // passageiro: linha da direção oposta, desenhada invertida
    const am = c.am, amigo = (am.est === 'fora' || am.est === 'indo') && am.existe ? [{ d: am.x + am.y, f: () => PERS.draw(ctx, am.P, (am.x - am.y) * 64 + M * 64, (am.x + am.y) * 32) }] : [];
    return [...amigo, { d: c.x + c.y, f: () => {
      const dentro = c.estado === 'dentro' && c.sx !== undefined, sx = dentro ? c.sx : Math.round((c.x - c.y) * 64 + M * 64), sy = dentro ? c.sy : Math.round((c.x + c.y) * 32), [cw, ch] = meta.cell;
      ctx.fillStyle = 'rgba(20,20,24,.30)'; ctx.beginPath(); ctx.ellipse(sx, sy, 1.9 * 1.3 * PPM * .5 * 1.05, 1.9 * 1.3 * PPM * .25, 0, 0, Math.PI * 2); ctx.fill();
      ctx.save(); ctx.imageSmoothingEnabled = false; const lin = Math.round(d * meta.dirs.length / 16) * ch;
      if (esp) { ctx.translate(sx, sy); ctx.scale(-1, 1); ctx.drawImage(im, q * cw, lin, cw, ch, -Math.round(meta.anchor[0]), -Math.round(meta.anchor[1]), cw, ch); }
      else ctx.drawImage(im, q * cw, lin, cw, ch, sx - Math.round(meta.anchor[0]), sy - Math.round(meta.anchor[1]), cw, ch); ctx.restore();
    } }];
  }
  const api = { itens, escondido: false, estado: () => c.estado, car: c, interage, ocupado, rotulo, bate, poeEm, reinicia, set disponivel(v) { c.disp = !!v; }, get disponivel() { return c.disp; }, set amigoOn(v) { c.amigoOn = !!v; } };
  // enquanto entra, está dentro ou sai o personagem não aparece nem anda (ele está no desenho do carro)
  const desenha0 = PERS.draw, preso0 = PERS.preso, step0 = PERS.step;
  PERS.step = function (Pp, dx, dy, run, ts) { if (Pp === P && c.estado === 'indo' && !c.interno) { Pp.ts = ts; return; } return step0(Pp, dx, dy, run, ts); };
  PERS.draw = function (ctxx, Pp, x, y) { if (Pp === P && api.escondido) return; return desenha0(ctxx, Pp, x, y); };
  PERS.preso = function (Pp, ts) { return (Pp === P && c.on && c.estado !== 'parado') || preso0(Pp, ts); };
  return api;
})();
