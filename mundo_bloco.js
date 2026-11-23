// ---------- MUNDO: sobrevivência (fase 1) ----------
// Bloco inserido em mundo.html por faz_mundo.mjs. Tudo daqui é novo; o resto do arquivo é o motor da cabana (chao.html).
const SLOTS = 8, PILHA = 5, SAVE_KEY = 'mundo_v2';
// ---- itens (ícones desenhados por código; o dono refina depois no editor) ----
const PAL = { k: '#2a2433', w: '#f4efe6', b: '#5fb4ee', B: '#3a82c4', c: '#d9483a', s: '#c4cad2', S: '#8d95a1', R: '#c8473a', Y: '#f2c14e', g: '#4f9a3a', r: '#d63b36', o: '#d99a4e', O: '#a8692b', n: '#7a4a22', h: '#ffd9d6', p: '#e8788a' };
const ITENS = {
  chave: { nome: 'Chave de roda', vida: 0, texto: 'Pesada e engraxada. Boa de segurar quando a conversa azeda.', g: ['.kkkk.......', 'ksSSsk......', 'kSkkSkkkkkk.', 'ksSSsSssSSsk', '.kkkkkkkkkk.'] },
  caixa: { nome: 'Caixa de peças', vida: 0, texto: 'A caixa lacrada do Tadeu. É para o Seu Valdir.', g: ['kkkkkkkkkk', 'koooooooOk', 'kooYYYYooOk', 'koooooooOk', 'kooooooooOk', 'kOOOOOOOOOk', 'kkkkkkkkkk'] },
  analgesico: { nome: 'Analgésico', vida: 15, g: ['.kkkkkkkk.', 'kwwwwwwwwk', 'kwppwwppwk', 'kwppwwppwk', 'kwwwwwwwwk', 'kwppwwppwk', 'kwppwwppwk', 'kwwwwwwwwk', '.kkkkkkkk.'] },
  bateria: { nome: 'Bateria usada', vida: 0, texto: 'Pesada, suja de graxa, ainda com um pouco de carga. É para o Tadeu recondicionar.', g: ['..kk..kk..', '..kRk.kSk.', 'kkkkkkkkkk', 'kSSSSSSSSk', 'kSkkSSkkSk', 'kSSSSSSSSk', 'kkkkkkkkkk'] },
  curativo: { nome: 'Kit de curativo', vida: 30, g: ['kkkkkkkkkk', 'kwwwwwwwwk', 'kwwwRRwwwk', 'kwwwRRwwwk', 'kwRRRRRRwk', 'kwRRRRRRwk', 'kwwwRRwwwk', 'kwwwRRwwwk', 'kwwwwwwwwk', 'kkkkkkkkkk'] },
};
const ICONE = {};
function icone(t) {
  if (ICONE[t]) return ICONE[t]; const g = ITENS[t].g, w = Math.max(...g.map(l => l.length)), c = document.createElement('canvas'); c.width = w; c.height = g.length; const x = c.getContext('2d');
  g.forEach((l, j) => { for (let i = 0; i < l.length; i++) { const k = l[i]; if (k !== '.' && PAL[k]) { x.fillStyle = PAL[k]; x.fillRect(i + Math.floor((w - l.length) / 2), j, 1, 1); } } });
  c.url = c.toDataURL(); return ICONE[t] = c;
}
// ---- estado do jogador ----
const T_INICIO = 4 * 60 + 30;   // terça-feira, 04h30 (minutos desde terça 00h)
const J = { vida: 100, grana: 0, divida: 480, t: T_INICIO, inv: [], pegos: {}, morto: false, q: 'inicio', f: {} };
let SPAWN = { x: 11.5, y: 21.5 }, ITENS_MUNDO = [];
// ---- bairro gerado por código ----
function rng(s) { return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function geraBairro() {
  const rnd = rng(20261119), longe = Array.from({ length: M }, () => Array(M).fill(true)), livre = Array.from({ length: M }, () => Array(M).fill(true)), pw = new Map(), pegaCel = [];
  for (let y = 0; y < M; y++) for (let x = 0; x < M; x++) MAP[y][x] = 'grama_baixa';
  objetos = []; paredes = []; pisos = new Set(); ITENS_MUNDO = [];
  const terra = (x, y) => { if (x >= 0 && y >= 0 && x < M && y < M) { MAP[y][x] = 'terra_nova'; livre[y][x] = false; } };
  const reta = (x0, y0, x1, y1) => { for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) terra(x, y); };
  reta(15, 0, 16, M - 1); reta(0, 15, M - 1, 16);   // as duas ruas (2 de largura) cruzando o mapa
  const par = (a, c, n, k) => pw.set(a + '|' + c + '|' + n, { a, c, n, k });
  const casa = (x0, y0, w, h, lado, n, cam) => {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) { pisos.add(x + ',' + y); pegaCel.push([x, y, x0 + '_' + y0]); }
    for (let y = y0 - 3; y <= y0 + h + 2; y++) for (let x = x0 - 3; x <= x0 + w + 2; x++) if (x >= 0 && y >= 0 && x < M && y < M) { longe[y][x] = false; if (x >= x0 - 1 && x <= x0 + w && y >= y0 - 1 && y <= y0 + h) livre[y][x] = false; }
    for (let i = 0; i < w; i++) { par('x', y0, x0 + i, 'high'); par('x', y0 + h, x0 + i, 'high'); }
    for (let j = 0; j < h; j++) { par('y', x0, y0 + j, 'high'); par('y', x0 + w, y0 + j, 'high'); }
    if (lado === 'N') par('x', y0, n, 'door'); else if (lado === 'S') par('x', y0 + h, n, 'door'); else if (lado === 'W') par('y', x0, n, 'door'); else par('y', x0 + w, n, 'door');
    if (cam) reta(...cam);
  };
  casa(3, 9, 5, 4, 'S', 5, [5, 13, 5, 14]);
  casa(9, 3, 4, 4, 'E', 5, [13, 5, 14, 5]);
  casa(19, 9, 5, 4, 'S', 21, [21, 13, 21, 14]); par('y', 21, 9, 'high'); par('y', 21, 10, 'door'); par('y', 21, 11, 'high'); par('y', 21, 12, 'high');   // divisória interna com porta
  casa(19, 3, 4, 4, 'W', 5, [17, 5, 18, 5]);
  casa(9, 18, 4, 5, 'E', 19, [13, 19, 14, 19]);   // a CASA DO JOGADOR: a casa de teste do dono (4x5 com quartinho 2x2)
  par('x', 20, 9, 'high'); par('x', 20, 10, 'high'); par('y', 11, 18, 'door'); par('y', 11, 19, 'high');
  casa(3, 24, 5, 4, 'E', 26, [8, 26, 14, 26]);
  casa(19, 19, 4, 4, 'W', 21, [17, 21, 18, 21]);
  casa(19, 25, 5, 4, 'W', 27, [17, 27, 18, 27]);
  paredes = [...pw.values()]; recalcParedes();
  // árvores, arbustos e enfeites do chão
  const arv = [], pesos = []; for (const k of Object.keys(OBJS)) { if (OBJS[k].deco) continue; if (/^(arvore\d|n_arvore_)/.test(k)) { arv.push(k); pesos.push(3); } else if (/^n_(arbusto|samambaia|toco)/.test(k)) { arv.push(k); pesos.push(1); } }
  const soma = pesos.reduce((a, b) => a + b, 0), sorteia = () => { let r = rnd() * soma; for (let i = 0; i < arv.length; i++) { r -= pesos[i]; if (r <= 0) return arv[i]; } return arv[0]; };
  const enf = ['d_grama_alta_1', 'd_grama_alta_2', 'd_grama_media_1', 'd_grama_media_2', 'd_flor_margarida', 'd_flor_amarela', 'd_pedra_pequena', 'd_folha_1', 'd_trevo'].filter(k => OBJS[k]);
  const arvOcup = new Set();
  for (let y = 0; y < M; y++) for (let x = 0; x < M; x++) { if (!livre[y][x] || !longe[y][x] || MAP[y][x] !== 'grama_baixa') continue; const borda = x < 2 || y < 2 || x >= M - 2 || y >= M - 2; if (rnd() < (borda ? .5 : .045) && !(Math.abs(x - SPAWN.x) < 2 && Math.abs(y - SPAWN.y) < 2)) { objetos.push({ x, y, id: sorteia() }); arvOcup.add(x + ',' + y); } }
  for (let y = 0; y < M; y++) for (let x = 0; x < M; x++) { if (!livre[y][x] || arvOcup.has(x + ',' + y) || MAP[y][x] !== 'grama_baixa') continue; if (rnd() < .22 && enf.length) objetos.push({ x: Math.round((x + .15 + rnd() * .7) * 100) / 100, y: Math.round((y + .15 + rnd() * .7) * 100) / 100, id: enf[Math.floor(rnd() * enf.length)], f: 1 }); }
  // itens: dentro das casas (mais comida/água) e espalhados pela grama (mais maçã)
  let nid = 0; const poe = (t, x, y) => ITENS_MUNDO.push({ id: nid++, t, x, y });
  poe('curativo', 12.5, 20.5);   // um curativo na casa do jogador
  const dentro = ['curativo'];
  const porCasa = {}; for (const c of pegaCel) (porCasa[c[2]] = porCasa[c[2]] || []).push(c);
  for (const [k, cs] of Object.entries(porCasa)) { const n = k === '9_18' ? 0 : 1, usados = new Set(); for (let i = 0; i < n; i++) { const c = cs[Math.floor(rnd() * cs.length)]; if (usados.has(c[0] + ',' + c[1])) continue; usados.add(c[0] + ',' + c[1]); poe(dentro[Math.floor(rnd() * dentro.length)], c[0] + .3 + rnd() * .4, c[1] + .3 + rnd() * .4); } }
  const fora = ['curativo']; let t = 0;
  while (t < 4) { const x = Math.floor(rnd() * M), y = Math.floor(rnd() * M); if (!livre[y][x] || arvOcup.has(x + ',' + y) || MAP[y][x] !== 'grama_baixa') continue; poe(fora[Math.floor(rnd() * fora.length)], x + .3 + rnd() * .4, y + .3 + rnd() * .4); t++; }
  TERR.render();
}
// ---- jogo ----
const el = id => document.getElementById(id);
function aviso(t) { const a = el('aviso'); a.textContent = t; a.style.opacity = 1; clearTimeout(aviso.t); aviso.t = setTimeout(() => a.style.opacity = 0, 2200); }
function salva() { try { localStorage.setItem(SAVE_KEY, JSON.stringify({ vida: J.vida, grana: J.grana, divida: J.divida, t: J.t, inv: J.inv, pegos: J.pegos, q: J.q, f: J.f, hx, hy, morto: J.morto })); } catch (e) { } }
function carrega() { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); if (!s) return; Object.assign(J, { vida: s.vida, grana: s.grana || 0, divida: typeof s.divida === 'number' ? s.divida : 480, t: typeof s.t === 'number' ? s.t : T_INICIO, inv: s.inv || [], pegos: s.pegos || {}, q: s.q || 'inicio', f: s.f || {}, morto: !!s.morto }); if (typeof s.hx === 'number') { hx = s.hx; hy = s.hy; } } catch (e) { } }
function novoJogo() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { } Object.assign(J, { vida: 100, grana: 0, divida: 480, t: T_INICIO, inv: [], pegos: {}, morto: false, q: 'inicio', f: {} }); hx = SPAWN.x; hy = SPAWN.y; salva(); desenhaHud(true); iniciaCena(); }
function itemPerto() { let b = null, bd = .9; for (const it of ITENS_MUNDO) { if (J.pegos[it.id]) continue; const d = Math.hypot(hx - it.x, hy - it.y); if (d < bd) { bd = d; b = it; } } return b; }
function pegar() {
  if (J.morto) return; const it = itemPerto(); if (!it) return;
  let s = J.inv.find(q => q.t === it.t && q.n < PILHA); if (!s) { if (J.inv.length >= SLOTS) { aviso('Mochila cheia'); return; } s = { t: it.t, n: 0 }; J.inv.push(s); }
  s.n++; J.pegos[it.id] = 1; aviso('Pegou: ' + ITENS[it.t].nome); salva(); desenhaHud(true);
}
function usa(i) {
  if (J.morto) return; const s = J.inv[i]; if (!s) return; const d = ITENS[s.t]; if (d.texto) { aviso(d.texto); return; }
  if (d.vida && J.vida >= 100) { aviso('Você já está com a vida cheia'); return; }
  J.vida = Math.min(100, J.vida + d.vida);
  if (--s.n <= 0) J.inv.splice(i, 1); aviso('Usou: ' + d.nome); salva(); desenhaHud(true);
}
let hudSig = '';
function desenhaHud(forca) {
  const f = Math.round, p = itemPerto(), ia = !p && typeof interPerto === 'function' ? interPerto() : null, rot = p ? 'Pegar ' + ITENS[p.t].nome : ia ? ia.rot : '', obj = typeof objetivo === 'function' ? objetivo() : '';
  const hrs = typeof horaTxt === 'function' ? horaTxt() : '', sig = [f(J.vida), J.grana, J.divida, hrs, J.morto, JSON.stringify(J.inv), rot, obj, !!J.f.aviso, typeof D !== 'undefined' && D.ativo].join('|'); if (!forca && sig === hudSig) return; hudSig = sig;
  el('b_vida').style.width = Math.max(0, J.vida) + '%'; el('t_vida').textContent = f(J.vida); el('r_vida').className = 'barra' + (J.vida < 25 ? ' baixo' : '');
  el('grana').textContent = 'R$ ' + J.grana + (J.f.aviso ? '  ·  dívida R$ ' + J.divida : ''); el('hora').textContent = hrs; el('obj').textContent = obj;
  el('inv').innerHTML = Array.from({ length: SLOTS }, (_, i) => { const s = J.inv[i]; return '<div class="slot' + (s ? ' cheio' : '') + '" data-i="' + i + '"><span class="n">' + (i + 1) + '</span>' + (s ? '<img src="' + icone(s.t).url + '" style="width:' + icone(s.t).width * 3 + 'px"><span class="q">' + (s.n > 1 ? s.n : '') + '</span>' : '') + '</div>'; }).join('');
  el('inv').querySelectorAll('.slot').forEach(e => e.onclick = () => usa(+e.dataset.i));
  const dlgAberto = typeof D !== 'undefined' && D.ativo; el('dica').style.display = rot && !J.morto && !dlgAberto ? '' : 'none'; el('dica').textContent = 'E · ' + rot;
  el('morte').style.display = J.morto ? '' : 'none';
}
let tSave = 0;
function jogoTick(dt) {
  if (J.morto || (typeof D !== 'undefined' && D.ativo)) { for (const k of ['KeyD', 'KeyA', 'KeyW', 'KeyS', 'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown']) keys[k] = false; }
  if (J.morto) { desenhaHud(); return; }
  if (J.vida < 100) J.vida = Math.min(100, J.vida + dt * .3);
  if (typeof cenaTick === 'function') cenaTick(dt);
  desenhaHud(); tSave += dt; if (tSave > 2) { tSave = 0; salva(); }
}
function desenhaItem(it, now) {
  const sx = (it.x - it.y) * 64 + M * 64, sy = (it.x + it.y) * 32, ic = icone(it.t), bob = Math.sin(now / 400 + it.id) * 1.5, perto = Math.hypot(hx - it.x, hy - it.y) < .9;
  ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(sx, sy, 9, 4.5, 0, 0, 7); ctx.fill();
  if (perto) { ctx.fillStyle = 'rgba(255,230,120,.28)'; ctx.beginPath(); ctx.ellipse(sx, sy, 15, 7.5, 0, 0, 7); ctx.fill(); }
  ctx.drawImage(ic, Math.round(sx - ic.width), Math.round(sy - ic.height * 2 - 3 + bob), ic.width * 2, ic.height * 2);
}
