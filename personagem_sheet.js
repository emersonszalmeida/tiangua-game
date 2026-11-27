// Personagem principal e NPCs a partir das FOLHAS DE SPRITES geradas do modelo 3D (animacao3d/sprites/*.png + sprites_manifest.js).
// Mesma interface do personagem.js: create / step / draw. Extra: PERS.hit(P, ts) toca a animação de golpe na cabeça uma vez.
// Precisa de animacao3d/sprites_manifest.js (const SPRITES) e, de preferência, sprites_jogo.js (folhas embutidas) carregados antes.
const PERS = (function () {
  const WALK_MS = 90, RUN_MS = 70, DIRS = SPRITES.dirs, IMG = {}, ANIM = SPRITES.anims;
  const mapa = { idle: 'parado', walk: 'andar', run: 'correr', hit: 'dano', punch: 'jab', guard: 'luta', die: 'morrer' };
  for (const k in mapa) { const a = ANIM[mapa[k]], im = new Image(); im.src = (typeof SPRITES_B64 !== 'undefined' && SPRITES_B64[mapa[k]]) || 'animacao3d/' + a.arquivo; IMG[k] = im; }
  const tot = k => { const ms = ANIM[mapa[k]].ms; return ms.reduce((s, v) => s + v, 0); };
  const HIT_MS = (() => { const ms = ANIM.dano.ms; return ms.slice(0, -1).reduce((s, v) => s + v, 0) + ms[ms.length - 2]; })();   // o último quadro do dano guarda 1,5 s de pausa na folha; no jogo ele dura como o anterior
  const PUNCH_MS = 85, PUNCH_N = 9, DIE_ESC = .3, COMBATE_MS = 8000;   // guarda aberta por 8 s depois do último golpe dado ou recebido
  //   // DIE_ESC: a folha do morrer dura ~5 s (quadros de até 0,5 s, bom para ver; no jogo trava); no jogo cai em ~1,5 s
  //    // só os quadros 0-8 do jab (soco + cruzado), mais rápidos que na folha; o braço estica nos quadros 3 e 5
  function dirOf(dx, dy) { return dy < 0 ? (dx < 0 ? 'NW' : dx > 0 ? 'NE' : 'N') : dy > 0 ? (dx < 0 ? 'SW' : dx > 0 ? 'SE' : 'S') : dx < 0 ? 'W' : 'E'; }
  function create(dir) { return { dir: dir || 'S', t0: 0, diagAt: 0, moving: false, run: false, f: 0, off: Math.random() * 8000, combT0: 0, hitT0: 0, punchT0: 0, dieT0: 0, ts: 0 }; }
  function quadroDe(nome, t) { const ms = ANIM[mapa[nome]].ms, T = ms.reduce((s, v) => s + v, 0); t = ((t % T) + T) % T; let k = 0, acc = 0; for (; k < ms.length - 1; k++) { if (t < acc + ms[k]) break; acc += ms[k]; } return k; }
  // dx, dy: teclas na tela (-1/0/1); ts: tempo em ms
  function step(P, dx, dy, run, ts) {
    P.ts = ts; P.moving = !!(dx || dy); P.run = P.moving && run;
    if (!P.moving) { P.t0 = 0; P.f = 0; return; }
    const nd = dirOf(dx, dy); if (nd.length === 2) P.diagAt = ts;
    // soltar uma das duas teclas da diagonal quase junto não vira o personagem
    if (!(nd.length === 1 && P.dir.length === 2 && P.dir.includes(nd) && ts - P.diagAt < 150)) P.dir = nd;
    if (!P.t0) P.t0 = ts; P.f = Math.floor((ts - P.t0) / (P.run ? RUN_MS : WALK_MS)) % 8;
  }
  function combate(P, ts) { P.combT0 = ts; }
  function hit(P, ts) { if (P.dieT0) return; P.combT0 = ts; if (P.punchT0 && ts - P.punchT0 < PUNCH_MS * PUNCH_N) return; P.hitT0 = ts; P.punchT0 = 0; }   // quem está socando leva o dano mas não é interrompido: os dois podem se acertar ao mesmo tempo
  function punch(P, ts) { if (P.dieT0 || P.punchT0 || P.hitT0) return false; P.punchT0 = ts; P.combT0 = ts; return true; }
  function punchFrame(P) { return P.punchT0 ? Math.floor((P.ts - P.punchT0) / PUNCH_MS) : -1; }
  function preso(P, ts) { return !!(P.dieT0 || (P.punchT0 && ts - P.punchT0 < PUNCH_MS * PUNCH_N) || (P.hitT0 && ts - P.hitT0 < HIT_MS)); }   // soco, golpe recebido ou morte: não anda
  function die(P, ts) { if (!P.dieT0) { P.combT0 = 0; P.dieT0 = ts; P.hitT0 = 0; P.punchT0 = 0; } }
  function revive(P) { P.dieT0 = 0; P.hitT0 = 0; P.punchT0 = 0; }
  // desenha com os pés em (sx, sy), 1 pixel do desenho = 1 unidade do contexto
  function draw(ctx, P, sx, sy) {
    const emHit = P.hitT0 && P.ts - P.hitT0 < HIT_MS; if (!emHit) P.hitT0 = 0;
    const emPunch = !emHit && P.punchT0 && P.ts - P.punchT0 < PUNCH_MS * PUNCH_N; if (!emHit && !emPunch) P.punchT0 = 0;
    const nome = P.dieT0 ? 'die' : emHit ? 'hit' : emPunch ? 'punch' : P.moving ? (P.run ? 'run' : 'walk') : P.combT0 && P.ts - P.combT0 < COMBATE_MS ? 'guard' : 'idle', a = ANIM[mapa[nome]], im = IMG[nome], r = Math.max(0, DIRS.indexOf(P.dir));
    const k = P.dieT0 ? (() => { const ms = ANIM.morrer.ms; let t = (P.ts - P.dieT0) / DIE_ESC, q = 0; while (q < ms.length - 1 && t >= ms[q]) { t -= ms[q]; q++; } return q; })() : emPunch ? punchFrame(P) : emHit ? quadroDe('hit', P.ts - P.hitT0) : P.moving ? P.f : quadroDe(nome === 'guard' ? 'guard' : 'idle', P.ts + P.off);
    const bx = Math.round(sx), by = Math.round(sy);
    ctx.fillStyle = 'rgba(20,20,24,.30)';
    for (const [dy, hw] of [[-6, 5], [-5, 7], [-4, 8], [-3, 9], [-2, 9], [-1, 9], [0, 8], [1, 7], [2, 5]]) ctx.fillRect(bx - hw, by + dy, hw * 2 + 1, 1);
    if (!im.complete || !im.naturalWidth) return;
    const [cw, ch] = a.cell; ctx.save(); ctx.imageSmoothingEnabled = false;
    ctx.drawImage(im, k * cw, r * ch, cw, ch, bx - Math.round(a.anchor[0]), by - Math.round(a.anchor[1]), cw, ch); ctx.restore();
  }
  return { create, step, draw, combate, hit, preso, punch, punchFrame, die, revive };
})();
