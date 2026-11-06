// Personagem principal (camiseta verde): sprites de andar/correr (sprites7.js) + poses paradas (idles.js).
// Precisa de sprites7.js e idles.js carregados antes. Usado pelo mapa (index.html).
const PERS = (function () {
  const D = SPR7, WALK_MS = 90, RUN_MS = 70;
  // poses paradas de cada vista; cx = centro dos pés
  for (const v of ['S', 'N', 'W', 'SW', 'NW']) { const g = IDLES[v], bot = g.rows.slice(-6); let sum = 0, n = 0; bot.forEach(r => { for (let i = 0; i < r.length; i++) if (r[i] !== '.') { sum += i; n++; } });
    D.slots['idle' + v] = { w: g.w, h: g.h, cx: sum / n, idle: 0, frames: [g.rows] }; }
  const cache = new Map();
  function frameCanvas(slot, f) {
    const k = slot + f; if (cache.has(k)) return cache.get(k);
    const s = D.slots[slot], rows = s.frames[f], c = document.createElement('canvas'); c.width = s.w; c.height = s.h; const x = c.getContext('2d');
    rows.forEach((r, y) => { for (let i = 0; i < r.length; i++) { const ch = r[i]; if (ch !== '.') { x.fillStyle = D.pal[ch]; x.fillRect(i, y, 1, 1); } } });
    cache.set(k, c); return c;
  }
  // direção -> [vista desenhada, espelhar?]
  const VIEW = { N: ['N', 0], NE: ['NW', 1], E: ['W', 1], SE: ['SW', 1], S: ['S', 0], SW: ['SW', 0], W: ['W', 0], NW: ['NW', 0] };
  function dirOf(dx, dy) { return dy < 0 ? (dx < 0 ? 'NW' : dx > 0 ? 'NE' : 'N') : dy > 0 ? (dx < 0 ? 'SW' : dx > 0 ? 'SE' : 'S') : dx < 0 ? 'W' : 'E'; }

  // estado: dir, t0 (início do passo), diagAt (última vez em diagonal)
  function create(dir) { return { dir: dir || 'S', t0: 0, diagAt: 0, moving: false, run: false, f: 0 }; }
  // dx, dy: teclas na tela (-1/0/1); ts: tempo em ms
  function step(P, dx, dy, run, ts) {
    P.moving = !!(dx || dy); P.run = P.moving && run;
    if (!P.moving) { P.t0 = 0; P.f = 0; return; }
    const nd = dirOf(dx, dy); if (nd.length === 2) P.diagAt = ts;
    // soltar uma das duas teclas da diagonal quase junto não vira o personagem
    if (!(nd.length === 1 && P.dir.length === 2 && P.dir.includes(nd) && ts - P.diagAt < 150)) P.dir = nd;
    if (!P.t0) P.t0 = ts; P.f = Math.floor((ts - P.t0) / (P.run ? RUN_MS : WALK_MS)) % 8;
  }
  // desenha com os pés em (sx, sy), 1 pixel do desenho = 1 unidade do contexto
  function draw(ctx, P, sx, sy) {
    const [view, flip] = VIEW[P.dir], slot = P.moving ? (P.run ? 'run' : 'walk') + view : 'idle' + view, s = D.slots[slot], img = frameCanvas(slot, P.moving ? P.f : 0);
    const ax = Math.round(s.cx + .5);
    // sombra: oval de pixels, de um tom só, cinza neutro, centrada nos pés e passando 2 px abaixo deles
    const bx = Math.round(sx), by = Math.round(sy);
    ctx.fillStyle = 'rgba(20,20,24,.30)';
    for (const [dy, hw] of [[-6, 5], [-5, 7], [-4, 8], [-3, 9], [-2, 9], [-1, 9], [0, 8], [1, 7], [2, 5]]) ctx.fillRect(bx - hw, by + dy, hw * 2 + 1, 1);
    ctx.save(); ctx.imageSmoothingEnabled = false; ctx.translate(Math.round(sx), Math.round(sy)); if (flip) ctx.scale(-1, 1);
    ctx.drawImage(img, -ax, -s.h); ctx.restore();
  }
  return { create, step, draw };
})();
