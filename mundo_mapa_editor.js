// Editor da casa (oficina + quarto): posicionar móveis e personagens. F2 liga/desliga.
// Mouse: clique num móvel/personagem e arraste. R gira o carro. C duplica o móvel. Delete apaga o móvel. Alt = sem encaixe na grade.
// As posições ficam salvas no navegador (localStorage) na hora; "Baixar casa_layout.js" gera o arquivo para guardar no projeto.
// Usa os globais do jogo: MOVEIS, INTER, cv, ctx, K, M, hsx, hsy, sxm, sym, window.EDITA (o jogo para o relógio e as interações enquanto ele está ligado).
const CASA_EDIT = (() => {
  const KEY = 'mundo_mapa_layout_v1';
  let reg = [], sel = null, drag = null, painel = null, info = null, lista = null, grade = true, extrasN = 0, modo = null;   // modo: 'moveis' | 'paredes' | null
  // ---- a casa em si (paredes, piso e cantos): editada com as ferramentas do chao.html; salva no navegador a cada mudança ----
  const CKEY = 'mundo_mapa_casa_v1';
  const casaAtual = () => ({ paredes, pisos: [...pisos], cantos, dentro: [...(window.DENTRO || [])] });
  function salvaCasa() { try { localStorage.setItem(CKEY, JSON.stringify(casaAtual())); } catch (e) { } }
  function casaSalva() { try { const s = localStorage.getItem(CKEY); if (s) return JSON.parse(s); } catch (e) { } return typeof CASA_LAYOUT !== 'undefined' && CASA_LAYOUT && CASA_LAYOUT.casa ? CASA_LAYOUT.casa : null; }
  function carregaCasa() {   // troca a casa padrão pela que o dono refez (se houver)
    window.DENTRO = new Set(); const C = casaSalva(); if (!C) return false;
    window.DENTRO = new Set(C.dentro || (typeof CASA_LAYOUT !== 'undefined' && CASA_LAYOUT && CASA_LAYOUT.casa && CASA_LAYOUT.casa.dentro) || []);   // piso de dentro da casa: só nele as paredes de frente baixam
    paredes = (C.paredes || []).filter(p => (p.a === 'x' || p.a === 'y') && p.c >= 0 && p.c <= M && p.n >= 0 && p.n < M && ['high', 'mid', 'door', 'low'].includes(p.k));
    paredes.forEach(q => { if (q.r !== 'b' && q.r !== 'f') { const r = papelNovo(q.a, q.c, q.n); if (r) q.r = r; else delete q.r; } });
    pisos = new Set(C.pisos || []); cantos = (C.cantos || []).filter(c => c && typeof c.p === 'string' && c.x >= 0 && c.y >= 0 && c.x <= M && c.y <= M); return true;
  }
  const arred = v => Math.round(v * 100) / 100;
  // onde o jogador nasce: se a casa foi refeita e o ponto original ficou fora do piso, vai para a célula de piso mais próxima que esteja livre de móveis e paredes
  function nascer(def) {
    const livre = (x, y) => !bateMovel(x, y) && !bateParede(x, y);
    if (pisos.has(Math.floor(def.x) + ',' + Math.floor(def.y)) && livre(def.x, def.y)) return def;
    let melhor = null, md = 1e9; for (const k of pisos) { const [cx, cy] = k.split(',').map(Number), x = cx + .5, y = cy + .5, d = Math.hypot(x - def.x, y - def.y); if (d < md && livre(x, y)) { md = d; melhor = { x, y }; } }
    return melhor || def;
  }
  const salvo = () => { try { const s = localStorage.getItem(KEY); if (s) return JSON.parse(s); } catch (e) { } return typeof CASA_LAYOUT !== 'undefined' && CASA_LAYOUT ? CASA_LAYOUT : null; };
  const chave = (m, i) => { const it = INTER.find(a => a.m === m); return i + '|' + (it ? it.rot : ''); };
  const nome = r => { const t = r.key.split('|')[1]; return r.clone ? 'Cópia: ' + (reg.find(q => q.key === r.clone) ? nome(reg.find(q => q.key === r.clone)) : '') : t || 'Peça ' + (+r.key.split('|')[0] + 1); };
  function mover(m, x, y) { const dx = x - m.x, dy = y - m.y; m.x = x; m.y = y; if (m.luz) { m.luz.x = x + .15; m.luz.y = y + .15; } for (const a of INTER) if (a.m === m) { a.x += dx; a.y += dy; } }
  // móvel que invade a espessura de uma parede é empurrado para o lado mais curto (peças que ficam na parede, como o aviso, não entram: bloq === false)
  const FOLGA = .07;   // distância mínima entre o móvel e a parede (o desenho da parede é mais grosso que a caixa de colisão)
  function foraDaParede(m) {
    if (m.luz) return; if (m.bloq === false) { colaNaParede(m); return; }
    for (let it = 0; it < 6; it++) { let mexeu = false;
      for (const [a0, b0, c0, d0] of rectsP) { const a = a0 - FOLGA, b = b0 - FOLGA, c = c0 + FOLGA, d = d0 + FOLGA, ox = Math.min(m.x + m.w, c) - Math.max(m.x, a), oy = Math.min(m.y + m.d, d) - Math.max(m.y, b); if (ox > .001 && oy > .001) { if (ox < oy) mover(m, arred(m.x + ((m.x + m.w / 2) < (a + c) / 2 ? -ox : ox)), m.y); else mover(m, m.x, arred(m.y + ((m.y + m.d / 2) < (b + d) / 2 ? -oy : oy))); mexeu = true; } }
      if (!mexeu) break; }
  }
  // peça de parede (o aviso): encosta na face da parede mais próxima, do lado do piso (de preferência o de dentro), e vira para ficar na direção da parede
  function colaNaParede(m) {
    const cx = m.x + m.w / 2, cy = m.y + m.d / 2; let melhor = null, bd = .6;
    for (const [a, b, c, d] of rectsP) { if (Math.max(c - a, d - b) < .5) continue; const dist = Math.hypot(Math.max(a - cx, 0, cx - c), Math.max(b - cy, 0, cy - d)); if (dist < bd) { bd = dist; melhor = { a, b, c, d, h: (c - a) > (d - b) }; } }
    if (!melhor) return; const { a, b, c, d, h } = melhor;
    if (h && m.d > m.w) gira90(m); else if (!h && m.w > m.d) gira90(m);
    const piso = (x, y) => { const k = Math.floor(x) + ',' + Math.floor(y); return (window.DENTRO && window.DENTRO.size ? window.DENTRO.has(k) : pisos.has(k)) ? 1 : 0; };
    const mais = h ? piso(cx, d + .3) : piso(c + .3, cy), menos = h ? piso(cx, b - .3) : piso(a - .3, cy), ladoMais = mais === menos ? (h ? cy > (b + d) / 2 : cx > (a + c) / 2) : !!mais;
    if (h) mover(m, m.x, arred(ladoMais ? d : b - m.d)); else mover(m, arred(ladoMais ? c : a - m.w), m.y);
  }
  // a caixa de colisão do carro acompanha a direção: retângulo de 1,9 × 0,9 blocos girado, e o menor retângulo reto que o contém (mantém o centro)
  function refaz(m) {
    if (!m.carro) return; const cx = m.x + m.w / 2, cy = m.y + m.d / 2, f = (m.dir * 22.5 - 45) * Math.PI / 180, L = 1.9, W = .9, c = Math.abs(Math.cos(f)), s = Math.abs(Math.sin(f));
    m.w = arred(L * c + W * s); m.d = arred(L * s + W * c); mover(m, arred(cx - m.w / 2), arred(cy - m.d / 2));
  }
  // gira 90° uma peça de caixas: troca largura e profundidade (e os detalhes pintados), mantendo o centro no mesmo lugar
  function gira90(m) {
    const cx = m.x + m.w / 2, cy = m.y + m.d / 2; [m.w, m.d] = [m.d, m.w];
    m.partes = m.partes.map(p => { const q = Object.assign({}, p, { dx: p.dy || 0, dy: p.dx || 0, w: p.d, d: p.w, cv: null }); if (p.det) q.det = (g, pr, o) => p.det(g, (u, v, z) => pr(v, u, z), o); return q; });
    m.rot = !m.rot; mover(m, arred(cx - m.w / 2), arred(cy - m.d / 2));
  }
  function apaga(r) { const i = MOVEIS.indexOf(r.m); if (i >= 0) MOVEIS.splice(i, 1); for (let k = INTER.length - 1; k >= 0; k--) if (INTER[k].m === r.m) INTER.splice(k, 1); r.apagado = true; if (sel === r) sel = null; }
  function clona(r, x, y) { const m = Object.assign({}, r.m, { x, y, partes: r.m.partes.map(p => Object.assign({}, p)) }); MOVEIS.push(m); const c = { m, key: 'c' + (++extrasN), clone: r.clone || r.key, x0: x, y0: y }; reg.push(c); return c; }
  // chamada depois de montar os móveis: guarda os originais e aplica o que o dono já arrumou
  function aplica() {
    reg = MOVEIS.map((m, i) => ({ m, key: chave(m, i), x0: m.x, y0: m.y, dir0: m.dir, rot0: !!m.rot }));
    LUZES.forEach((L, i) => { const m = { x: L.x - .15, y: L.y - .15, w: .3, d: .3, npc: true, luz: L, altura: L.z }; reg.push({ m, key: 'L' + i + '|Luz ' + (i + 1) + (i === 0 ? ' (quarto)' : ''), x0: m.x, y0: m.y, rot0: false }); });
    sel = null; extrasN = 0;
    const L = salvo(); if (!L) return;
    for (const r of reg) { const s = L.itens && L.itens[r.key]; if (!s) continue; if (s.rot && !r.m.npc) gira90(r.m);
      if (r.m.carro) { if (s.dir !== undefined) r.m.dir = s.dir; if (s.v) { refaz(r.m); mover(r.m, s.x, s.y); } else { mover(r.m, s.x, s.y); refaz(r.m); } }   // sem v: arquivo antigo (x, y da caixa de 0,9 × 1,9); v = 2: x, y da caixa já girada
      else { mover(r.m, s.x, s.y); if (s.dir !== undefined && r.m.dir !== undefined) r.m.dir = s.dir; } }
    for (const k of L.removidos || []) { const r = reg.find(q => q.key === k); if (r && !r.m.npc) apaga(r); }
    for (const e of L.extras || []) { const r = reg.find(q => q.key === e.src); if (r && !r.m.npc) { const c = clona(r, e.x, e.y); if (e.rot) gira90(c.m); mover(c.m, e.x, e.y); } }
    for (const r of reg) if (!r.apagado) foraDaParede(r.m);   // arruma o que ficou dentro de parede
  }
  function layout() {
    const L = { itens: {}, removidos: [], extras: [] };
    for (const r of reg) { if (r.clone) { if (!r.apagado) { const e = { src: r.clone, x: arred(r.m.x), y: arred(r.m.y) }; if (r.m.rot) e.rot = 1; L.extras.push(e); } continue; } if (r.apagado) { L.removidos.push(r.key); continue; } if (Math.abs(r.m.x - r.x0) > 1e-6 || Math.abs(r.m.y - r.y0) > 1e-6 || r.m.dir !== r.dir0 || !!r.m.rot !== r.rot0) { const s = { x: arred(r.m.x), y: arred(r.m.y) }; if (r.m.dir !== undefined) s.dir = r.m.dir; if (r.m.rot) s.rot = 1; if (r.m.carro) s.v = 2; L.itens[r.key] = s; } }
    return L;
  }
  const salva = () => { try { localStorage.setItem(KEY, JSON.stringify(layout())); } catch (e) { } };
  // ---- mouse -> mundo ----
  const motor = e => [hsx + (e.clientX - cv.width / 2) / K, hsy + (e.clientY - cv.height / 2) / K];
  const tile = (ex, ey) => { const a = (ex - M * 64) / 64, b = ey / 32; return [(a + b) / 2, (b - a) / 2]; };
  const alturaDe = m => m.altura ? m.altura : m.npc ? 70 : Math.max(8, ...m.partes.map(p => (p.z0 || 0) + p.h));
  function pega(e) {
    const [ex, ey] = motor(e); let melhor = null, md = 1e9;
    for (const r of reg) { if (r.apagado || (r.m.ativo && !r.m.ativo())) continue; const m = r.m, H = alturaDe(m);
      for (const k of [0, H * .5, H]) { const [tx, ty] = tile(ex, ey + k); if (tx > m.x - .15 && tx < m.x + m.w + .15 && ty > m.y - .15 && ty < m.y + m.d + .15) { const d = Math.hypot(tx - (m.x + m.w / 2), ty - (m.y + m.d / 2)) + k / 200; if (d < md) { md = d; melhor = r; } break; } } }
    return melhor;
  }
  addEventListener('keydown', e => { if (window.EDITA && (/^Digit/.test(e.code) || ['KeyE', 'KeyQ', 'Space', 'Enter'].includes(e.code))) e.stopImmediatePropagation(); }, true);   // com o editor aberto essas teclas do jogo não fazem nada
  addEventListener('pointerdown', e => { if (!window.EDITA || modo !== 'moveis' || e.target !== cv || e.button !== 0) return; const r = pega(e); sel = r; if (r) { const [ex, ey] = motor(e); drag = { r, ex, ey, x: r.m.x, y: r.m.y }; } atualiza(); });
  addEventListener('pointermove', e => { if (!window.EDITA || modo !== 'moveis' || !drag) return; const [ex, ey] = motor(e), da = (ex - drag.ex) / 64, db = (ey - drag.ey) / 32; let nx = drag.x + (da + db) / 2, ny = drag.y + (db - da) / 2; if (!e.altKey) { nx = Math.round(nx * 4) / 4; ny = Math.round(ny * 4) / 4; } mover(drag.r.m, arred(nx), arred(ny)); foraDaParede(drag.r.m); atualiza(true); });
  addEventListener('pointerup', () => { if (drag) { drag = null; salva(); } });
  // ---- pintar / apagar as marcas de "dentro" (o chao.html não conhece essa ferramenta) ----
  let pintaD = false;
  const celulaDe = e => { const gx = (e.clientX - cv.width / 2) / K + hsx - M * 64, gy = (e.clientY - cv.height / 2) / K + hsy; return [Math.floor((gx / 64 + gy / 32) / 2), Math.floor((gy / 32 - gx / 64) / 2)]; };
  function pintaDentro(e) { const [cx, cy] = celulaDe(e), o = Math.floor((larg - 1) / 2); for (let j = 0; j < larg; j++) for (let k = 0; k < larg; k++) { const key = (cx - o + k) + ',' + (cy - o + j); if (ferr.t === 'dentro') { if (pisos.has(key)) window.DENTRO.add(key); } else window.DENTRO.delete(key); } salvaCasa(); }
  addEventListener('pointerdown', e => { if (window.EDITA && modo === 'paredes' && e.target === cv && e.button === 0 && (ferr.t === 'dentro' || ferr.t === 'tiradentro')) { pintaD = true; pintaDentro(e); } });
  addEventListener('pointermove', e => { if (pintaD) pintaDentro(e); }); addEventListener('pointerup', () => { pintaD = false; });
  // ---- teclas ----
  addEventListener('keydown', e => {
    if (e.code === 'F2') { e.preventDefault(); liga(!window.EDITA); return; }
    if (!window.EDITA || e.repeat) return;
    if (e.code === 'Escape') { liga(false); return; }
    if (modo !== 'moveis') return;
    if (e.code === 'Delete' || e.code === 'Backspace') { e.preventDefault(); apagaSel(); }
    else if (e.code === 'KeyR') gira(e.shiftKey ? -1 : 1);
    else if (e.code === 'KeyC') duplica();
    else if (e.code === 'Escape') liga(false);
  });
  function apagaSel() { if (!sel || sel.m.npc) return; apaga(sel); salva(); atualiza(); }
  function duplica() { if (!sel || sel.m.npc) return; sel = clona(sel, arred(sel.m.x + 1), arred(sel.m.y + 1)); foraDaParede(sel.m); salva(); atualiza(); }
  function gira(p) { if (!sel) return; if (sel.m.dir !== undefined) { sel.m.dir = (sel.m.dir + p + 16) % 16; refaz(sel.m); foraDaParede(sel.m); } else if (!sel.m.npc) { gira90(sel.m); foraDaParede(sel.m); } else return; salva(); atualiza(); }
  // ---- painel ----
  function cria() {
    painel = document.createElement('div'); painel.style.cssText = 'position:fixed;right:10px;top:50px;width:250px;max-height:calc(100% - 70px);overflow:auto;background:rgba(20,16,12,.92);border:2px solid #5a4630;border-radius:8px;padding:10px;font:13px system-ui;color:#eee;z-index:20;display:none';
    painel.innerHTML = '<b style="color:#ffd76a">Editor da casa</b> <span style="color:#9a8a76">(F2 fecha)</span><div id="ce_dica" style="margin:6px 0;color:#bbb;line-height:1.4">Clique num móvel ou personagem e arraste. Alt = sem encaixe. R gira (o carro de 22,5° em 22,5°; os móveis 90°), C duplica, Delete apaga. Dá para andar com WASD para ver outros cantos.</div><div id="ce_info" style="margin:6px 0;color:#9fd"></div><div id="ce_acoes" style="display:grid;grid-template-columns:1fr 1fr;gap:4px"></div><div id="ce_lista" style="margin-top:8px;display:grid;gap:3px"></div><div id="ce_msg" style="margin-top:6px;color:#9fd;font-size:12px"></div>';
    document.body.appendChild(painel); info = painel.querySelector('#ce_info'); lista = painel.querySelector('#ce_lista');
    const abas = document.createElement('div'); abas.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:4px;margin:6px 0'; abas.innerHTML = '<button id="ce_am" style="padding:5px;border-radius:4px;border:1px solid #5a4630;background:#5a4630;color:#eee;cursor:pointer;font:12px system-ui">Móveis</button><button id="ce_ap" style="padding:5px;border-radius:4px;border:1px solid #5a4630;background:#2b2118;color:#eee;cursor:pointer;font:12px system-ui">Paredes e piso</button>';
    painel.insertBefore(abas, painel.children[1]); abas.querySelector('#ce_ap').onclick = ev => { ev.stopPropagation(); setModo('paredes'); };
    const bt = (t, f) => { const b = document.createElement('button'); b.textContent = t; b.style.cssText = 'background:#3a3028;color:#eee;border:1px solid #5a4630;border-radius:4px;padding:5px;cursor:pointer;font:12px system-ui'; b.onclick = ev => { ev.stopPropagation(); f(); }; painel.querySelector('#ce_acoes').appendChild(b); return b; };
    bt('Duplicar (C)', duplica); bt('Apagar (Del)', apagaSel); bt('Girar (R)', () => gira(1)); bt('Grade', () => { grade = !grade; });
    bt('Baixar casa_layout.js', baixa); bt('Restaurar padrão', () => { if (confirm('Voltar todos os móveis e personagens às posições originais?')) { try { localStorage.removeItem(KEY); } catch (e) { } location.reload(); } });
  }
  function atualiza(leve) {
    if (!painel) return; const m = sel && sel.m;
    info.textContent = m ? nome(sel) + ' — x ' + arred(m.x) + ', y ' + arred(m.y) + (m.dir !== undefined ? ', direção ' + m.dir : '') : 'Nada selecionado';
    if (leve) return; lista.innerHTML = '';
    for (const r of reg) { if (r.apagado) continue; const b = document.createElement('button'); b.textContent = nome(r) + (r.m.luz ? ' (luz)' : r.m.npc ? ' (personagem)' : ''); b.style.cssText = 'text-align:left;background:' + (r === sel ? '#5a4630' : '#2b2118') + ';color:#eee;border:1px solid #5a4630;border-radius:4px;padding:4px 6px;cursor:pointer;font:12px system-ui'; b.onclick = ev => { ev.stopPropagation(); sel = r; atualiza(); }; lista.appendChild(b); }
  }
  // ---- modo "Paredes e piso": usa as ferramentas de casa do chao.html (pintaMouse / tratarCasa) ----
  function painelParedes() {
    const pn = document.getElementById('painel'); pn.style.top = '50px'; pn.style.display = '';
    const cantosLista = typeof PECAS === 'undefined' ? [] : Object.keys(PECAS).filter(n => /^(LU|RD|RU|LD)_/.test(n));
    const bt = (t, id, img, nome) => '<button data-t="' + t + '" data-id="' + id + '" class="' + (ferr.t === t && ferr.id === id ? 'on' : '') + '"><img src="' + img + '">' + nome + '</button>';
    pn.innerHTML = '<b style="color:#ffd76a">Editor da casa</b> <span style="color:#9a8a76">(F2 fecha)</span><div class="g" style="margin-top:6px"><button id="ce_vm">← Móveis</button><button id="ce_vp" class="on">Paredes e piso</button></div>' +
      '<h4>Paredes e piso</h4><div class="g">' + bt('parede', 'high', CASA.prev('high'), 'Parede alta') + bt('parede', 'mid', (typeof PECAS !== 'undefined' && PECAS.x_M ? PECAS.x_M.src : CASA.prev('high')), 'Parede média') + bt('parede', 'door', CASA.prev('door'), 'Parede com porta') + bt('parede', 'low', CASA.prev('low'), 'Parede baixa') + bt('piso', 'piso', CASA.prev('piso'), 'Piso') + bt('apagap', 'x', 'terreno/terra_0_0.png', 'Tirar parede') + bt('tirapiso', 'x', 'terreno/terra_0_0.png', 'Tirar piso') + '</div>' +
      '<h4>Dentro da casa (as paredes de frente baixam quando você está aqui)</h4><div class="g">' + bt('dentro', 'x', CASA.prev('piso'), 'Marcar dentro') + bt('tiradentro', 'x', 'terreno/terra_0_0.png', 'Tirar marca') + '<button id="ce_dt">Marcar todo o piso</button><button id="ce_dl">Limpar marcas</button></div><div style="font-size:11px;color:#bbb;margin-top:3px">As células marcadas ficam em verde-água. Sem nenhuma marca, só salas totalmente fechadas baixam as paredes.</div>' +
      '<h4>Pincel do piso</h4><div class="g">' + [1, 2, 3].map(w => '<button data-w="' + w + '" class="' + (larg === w ? 'on' : '') + '">' + w + '×' + w + '</button>').join('') + '</div>' +
      (cantosLista.length ? '<h4>Cantos (escolha a peça e clique no vértice)</h4><div class="g">' + cantosLista.map(n => bt('canto', n, PECAS[n].src, n.replace('_', ' '))).join('') + bt('tiracanto', 'x', 'terreno/terra_0_0.png', 'Tirar canto') + '</div>' : '') +
      '<div class="acoes"><button id="ce_bx">Baixar casa_layout.js</button><button id="ce_rc">Casa original</button></div><div id="msg"></div>' +
      '<div style="margin-top:6px;font-size:11px;color:#bbb">Clique perto da aresta onde quer a parede (arraste para fazer uma fileira); os pilares aparecem sozinhos nas pontas e nos encontros. Botão direito apaga a parede mais perto. O piso usa o pincel 1×1, 2×2 ou 3×3. Os cantos escolhem a peça do vértice. Dá para andar com WASD e dar zoom com a roda. T mostra a grade. Tudo fica guardado neste navegador.</div>';
    pn.querySelectorAll('[data-w]').forEach(b => b.onclick = () => { larg = +b.dataset.w; painelParedes(); });
    pn.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { ferr = { t: b.dataset.t, id: b.dataset.id }; painelParedes(); });
    pn.querySelector('#ce_dt').onclick = () => { window.DENTRO = new Set(pisos); salvaCasa(); }; pn.querySelector('#ce_dl').onclick = () => { window.DENTRO = new Set(); salvaCasa(); };
    pn.querySelector('#ce_vm').onclick = () => setModo('moveis'); pn.querySelector('#ce_bx').onclick = baixa;
    pn.querySelector('#ce_rc').onclick = () => { if (confirm('Voltar as paredes, o piso e os cantos para a casa original?')) { try { localStorage.removeItem(CKEY); } catch (e) { } location.reload(); } };
  }
  function setModo(m) {
    modo = m; sel = null; drag = null;
    if (m === 'paredes') { editar = true; grade = true; if (!ferr || !['parede', 'apagap', 'piso', 'tirapiso', 'canto', 'tiracanto', 'dentro', 'tiradentro'].includes(ferr.t)) ferr = { t: 'parede', id: 'high' }; painel.style.display = 'none'; painelParedes(); }
    else { editar = false; grade = false; document.getElementById('painel').style.display = 'none'; painel.style.display = ''; atualiza(); }
  }
  function baixa() {
    const txt = '// GERADO pelo editor da casa (F2 em mundo_mapa.html). Posições dos móveis e personagens e a planta da casa; guarde este arquivo na pasta do jogo.\nconst CASA_LAYOUT = ' + JSON.stringify(Object.assign(layout(), { casa: casaAtual() }), null, 1) + ';\n';
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'text/javascript' })); a.download = 'casa_layout.js'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    painel.querySelector('#ce_msg').textContent = 'Arquivo baixado.'; const m2 = document.getElementById('msg'); if (m2) m2.textContent = 'Arquivo baixado (pasta Downloads).';
  }
  function liga(v) {
    if (v && D.ativo) return; window.EDITA = v; if (!painel) cria();
    if (v) { setModo('moveis'); painel.style.display = ''; } else { modo = null; editar = false; grade = false; painel.style.display = 'none'; document.getElementById('painel').style.display = 'none'; sel = null; drag = null; salva(); }
  }
  // ---- desenho no mundo (entra na lista de itens da cena quando o editor está ligado) ----
  function overlay() {
    if (modo === 'paredes') return [{ d: 1e6, f: () => { ctx.save(); ctx.fillStyle = 'rgba(60,210,180,.3)'; for (const k of window.DENTRO || []) { const [x, y] = k.split(',').map(Number); ctx.beginPath(); ctx.moveTo(sxm(x, y), sym(x, y)); ctx.lineTo(sxm(x + 1, y), sym(x + 1, y)); ctx.lineTo(sxm(x + 1, y + 1), sym(x + 1, y + 1)); ctx.lineTo(sxm(x, y + 1), sym(x, y + 1)); ctx.closePath(); ctx.fill(); } ctx.restore(); } }];
    if (modo !== 'moveis') return [];
    const f = () => {
      ctx.save(); ctx.lineWidth = 1 / K * 1.2;
      if (grade) { ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); for (let x = 3; x <= 19; x++) { ctx.moveTo(sxm(x, 8), sym(x, 8)); ctx.lineTo(sxm(x, 18), sym(x, 18)); } for (let y = 8; y <= 18; y++) { ctx.moveTo(sxm(3, y), sym(3, y)); ctx.lineTo(sxm(19, y), sym(19, y)); } ctx.stroke(); }
      for (const r of reg) { if (r.m.luz) { const L = r.m.luz, X = Math.round(sxm(L.x, L.y)), Y = Math.round(sym(L.x, L.y)) - L.z; ctx.fillStyle = '#ffd76a'; ctx.beginPath(); ctx.arc(X, Y, 5, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(255,215,106,.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(X, Y + L.z); ctx.stroke(); }
        if (r.apagado || (r.m.ativo && !r.m.ativo())) continue; const m = r.m, s = r === sel; ctx.strokeStyle = s ? '#ffd76a' : 'rgba(120,200,255,.55)'; ctx.lineWidth = (s ? 2.5 : 1) / K * 1.4; ctx.beginPath(); ctx.moveTo(sxm(m.x, m.y), sym(m.x, m.y)); ctx.lineTo(sxm(m.x + m.w, m.y), sym(m.x + m.w, m.y)); ctx.lineTo(sxm(m.x + m.w, m.y + m.d), sym(m.x + m.w, m.y + m.d)); ctx.lineTo(sxm(m.x, m.y + m.d), sym(m.x, m.y + m.d)); ctx.closePath(); ctx.stroke(); }
      ctx.restore();
    };
    return [{ d: 1e6, f }];
  }
  return { aplica, overlay, liga, salvaCasa, carregaCasa, nascer };
})();

// ordem de desenho: móvel encostado numa parede é desenhado depois dela quando está na frente dela (e antes quando está atrás), senão a parede "come" a ponta do móvel
function ajustaMuro(m, d) {
  if (m.luz) return d;
  for (const p of paredes) { const key = p.n + .5 + p.c;
    if (p.a === 'x') { if (m.x < p.n + 1 - .02 && m.x + m.w > p.n + .02) { if (m.y >= p.c - .02 && m.y < p.c + 1.5) d = Math.max(d, key + .02); else if (m.y + m.d <= p.c + .02 && m.y + m.d > p.c - 1.5) d = Math.min(d, key - .02); } }
    else if (m.y < p.n + 1 - .02 && m.y + m.d > p.n + .02) { if (m.x >= p.c - .02 && m.x < p.c + 1.5) d = Math.max(d, key + .02); else if (m.x + m.w <= p.c + .02 && m.x + m.w > p.c - 1.5) d = Math.min(d, key - .02); }
  }
  return d;
}
// fora de casa? (piso marcado como "dentro"; sem marcas, a regra antiga: depois do portão leste)
function foraDeCasa() { return window.DENTRO && window.DENTRO.size ? !window.DENTRO.has(Math.floor(hx) + ',' + Math.floor(hy)) : hx > 16.4; }
// a luz de uma lâmpada só ilumina o cômodo em que ela está: chão e faces de dentro das paredes que a câmera enxerga (fundos e esquerda); a face de fora das paredes da frente e da direita é apagada do brilho
let LUZ_CV = null;
function LUZ_PINTA(L, grad, x, y, s, W, H) {
  const c0x = Math.floor(L.x), c0y = Math.floor(L.y); if (!pisos.has(c0x + ',' + c0y)) return;
  const m = new Set(paredes.map(p => p.a + '|' + p.c + '|' + p.n)), sala = new Set([c0x + ',' + c0y]), fila = [[c0x, c0y]];
  const passa = (cx, cy, dx, dy) => !(dx === 1 ? m.has('y|' + (cx + 1) + '|' + cy) : dx === -1 ? m.has('y|' + cx + '|' + cy) : dy === 1 ? m.has('x|' + (cy + 1) + '|' + cx) : m.has('x|' + cy + '|' + cx));
  while (fila.length) { const [cx, cy] = fila.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = (cx + dx) + ',' + (cy + dy); if (passa(cx, cy, dx, dy) && pisos.has(k) && !sala.has(k)) { sala.add(k); fila.push([cx + dx, cy + dy]); } } }
  if (!LUZ_CV) LUZ_CV = document.createElement('canvas'); if (LUZ_CV.width !== W || LUZ_CV.height !== H) { LUZ_CV.width = W; LUZ_CV.height = H; }
  const o = LUZ_CV.getContext('2d'); o.setTransform(1, 0, 0, 1, 0, 0); o.globalCompositeOperation = 'source-over'; o.clearRect(0, 0, W, H);
  const X = (px, py) => W / 2 + (sxm(px, py) - hsx) * K, Y = (px, py) => H / 2 + (sym(px, py) - hsy) * K;
  const altDe = p => ((window.ALT_PAREDE && window.ALT_PAREDE.get(p.a + '|' + p.c + '|' + p.n)) || 93) * K;   // altura que a parede tem desenhada agora (alta, cortada ou baixa)
  const quad = (p, h) => { const [x0, y0, x1, y1] = p.a === 'x' ? [p.n, p.c, p.n + 1, p.c] : [p.c, p.n, p.c, p.n + 1]; o.moveTo(X(x0, y0), Y(x0, y0)); o.lineTo(X(x1, y1), Y(x1, y1)); o.lineTo(X(x1, y1), Y(x1, y1) - h); o.lineTo(X(x0, y0), Y(x0, y0) - h); o.closePath(); };
  o.save(); o.beginPath();
  for (const k of sala) { const [cx, cy] = k.split(',').map(Number); o.moveTo(X(cx, cy), Y(cx, cy)); o.lineTo(X(cx + 1, cy), Y(cx + 1, cy)); o.lineTo(X(cx + 1, cy + 1), Y(cx + 1, cy + 1)); o.lineTo(X(cx, cy + 1), Y(cx, cy + 1)); o.closePath(); }
  const mais = p => p.a === 'x' ? sala.has(p.n + ',' + p.c) : sala.has(p.c + ',' + p.n), menos = p => p.a === 'x' ? sala.has(p.n + ',' + (p.c - 1)) : sala.has((p.c - 1) + ',' + p.n);
  for (const p of paredes) if (mais(p)) quad(p, altDe(p));   // faces de dentro que aparecem (lado + da parede é a sala)
  o.clip(); o.fillStyle = grad; o.fillRect(x, y, s, s); o.restore();
  o.globalCompositeOperation = 'destination-out'; o.fillStyle = '#000'; o.beginPath();
  for (const p of paredes) if (menos(p) && !mais(p)) quad(p, altDe(p));   // faces de fora das paredes da frente/direita da sala: cobrem o chão que está atrás delas
  o.fill(); ctx.drawImage(LUZ_CV, 0, 0);
}
