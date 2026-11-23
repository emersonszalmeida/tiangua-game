// ---------- CENA 01: o quarto nos fundos da oficina (RPG urbano, pé no chão) ----------
// Inserido em mundo.html por faz_mundo.mjs, depois de mundo_bloco.js. Móveis e personagens são caixas isométricas pintadas por código (arte provisória; o dono desenha as de verdade depois).
// Coordenadas: mundo em células (x ↘, y ↙). Quarto = x 5..8, y 10..13 · oficina = x 8..16, y 10..16 · portão no lado leste (x=16, y 13..14) · rua lateral = x 18..20.
let MOVEIS = [], INTER = [], LUZES = [];
let D = { ativo: false };
const sxm = (x, y) => (x - y) * 64 + M * 64, sym = (x, y) => (x + y) * 32;
const hash2 = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const hexRgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
// ---- caixa isométrica em pixels (sem serrilhado): topo, face de frente-esquerda (+y) e frente-direita (+x), contorno escuro e um grão leve ----
function caixaCanvas(w, d, h, z0, cores, det) {
  const zt = z0 + h, W = Math.ceil((w + d) * 64) + 3, H = Math.ceil((w + d) * 32 + zt) + 4, ox = Math.ceil(d * 64) + 1, oy = zt + 1;
  const pr = (a, b, z) => [Math.round(ox + (a - b) * 64), Math.round(oy + (a + b) * 32 - z)];
  const quad = pts => (x, y) => { let pos = 0, neg = 0; for (let i = 0; i < 4; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % 4], c = (x2 - x1) * (y - y1) - (y2 - y1) * (x - x1); if (c > 0) pos++; else if (c < 0) neg++; } return !(pos && neg); };
  const faces = [quad([pr(0, 0, zt), pr(w, 0, zt), pr(w, d, zt), pr(0, d, zt)]), quad([pr(0, d, zt), pr(w, d, zt), pr(w, d, z0), pr(0, d, z0)]), quad([pr(w, 0, zt), pr(w, d, zt), pr(w, d, z0), pr(w, 0, z0)])];
  const mapa = new Uint8Array(W * H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) for (let k = 0; k < 3; k++) if (faces[k](x + .5, y + .5)) { mapa[y * W + x] = k + 1; break; }
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), im = g.createImageData(W, H), rgb = cores.map(hexRgb);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const f = mapa[y * W + x]; if (!f) continue; const borda = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => !mapa[(y + b) * W + x + a]); const m = borda ? .45 : 1 + (hash2(x, y) - .5) * .12, o = (y * W + x) * 4, col = rgb[f - 1]; im.data[o] = col[0] * m; im.data[o + 1] = col[1] * m; im.data[o + 2] = col[2] * m; im.data[o + 3] = 255; }
  g.putImageData(im, 0, 0); if (det) det(g, pr, { w, d, h, z0, zt });
  return { c, ox, oy };
}
const ret = (g, cor, x, y, w = 1, h = 1) => { g.fillStyle = cor; g.fillRect(Math.round(x), Math.round(y), w, h); };
const lin = (g, cor, p, q) => { const n = Math.max(Math.abs(q[0] - p[0]), Math.abs(q[1] - p[1])) || 1; for (let i = 0; i <= n; i++) ret(g, cor, p[0] + (q[0] - p[0]) * i / n, p[1] + (q[1] - p[1]) * i / n); };
// móvel = vários blocos desenhados na ordem dada, tudo com uma só profundidade; x,y = canto de trás; w,d = área que bloqueia
function movel(def) { const m = Object.assign({ bloq: true, partes: [] }, def); MOVEIS.push(m); return m; }
function desenhaMovel(m) { for (const p of m.partes) { p.cv = p.cv || caixaCanvas(p.w, p.d, p.h, p.z0 || 0, p.cores, p.det); const X = sxm(m.x + (p.dx || 0), m.y + (p.dy || 0)), Y = sym(m.x + (p.dx || 0), m.y + (p.dy || 0)); ctx.drawImage(p.cv.c, Math.round(X - p.cv.ox), Math.round(Y - p.cv.oy)); } }
const dMovel = m => { const base = m.x + m.y + (m.w + m.d) / 2; if (hx > m.x - 1.3 && hx < m.x + m.w + 1.3 && hy > m.y - 1.3 && hy < m.y + m.d + 1.3) return (hx >= m.x + m.w || hy >= m.y + m.d) ? hx + hy - .01 : hx + hy + .01; return base; };
const bateMovel = (x, y) => MOVEIS.some(m => m.bloq && (!m.ativo || m.ativo()) && x + RP > m.x && x - RP < m.x + m.w && y + RP > m.y && y - RP < m.y + m.d);
// ---- personagens (o mesmo boneco do jogador, com a camiseta pintada de outra cor) ----
const NPCCV = document.createElement('canvas'); NPCCV.width = 200; NPCCV.height = 200; const NPCG = NPCCV.getContext('2d', { willReadFrequently: true });
const CAMISA = [hexRgb('#9c9873'), hexRgb('#4b4936'), hexRgb('#8c7d67')];   // camiseta do boneco (miolo, contorno, sombra): trocadas por outra cor em cada personagem
const NPCP = { zeca: PERS.create('SE'), neide: PERS.create('SW'), osmar: PERS.create('SE'), valdir: PERS.create('SW'), tadeu: PERS.create('SW'), g1: PERS.create('SE'), g2: PERS.create('S') };
function desenhaNpc(id, x, y, cor, now) {
  NPCG.clearRect(0, 0, 200, 200); NPCG.save(); NPCG.translate(100, 170); PERS.step(NPCP[id], 0, 0, false, now); PERS.draw(NPCG, NPCP[id], 0, 0); NPCG.restore();
  const im = NPCG.getImageData(0, 0, 200, 200), p = im.data; for (let i = 0; i < p.length; i += 4) { if (!p[i + 3]) continue; for (let k = 0; k < 3; k++) { const o = CAMISA[k]; if (Math.abs(p[i] - o[0]) < 3 && Math.abs(p[i + 1] - o[1]) < 3 && Math.abs(p[i + 2] - o[2]) < 3) { p[i] = cor[k][0]; p[i + 1] = cor[k][1]; p[i + 2] = cor[k][2]; break; } } }
  NPCG.putImageData(im, 0, 0); ctx.drawImage(NPCCV, Math.round(sxm(x, y) - 100), Math.round(sym(x, y) - 170));
}
// ---- diálogo ----
function dlg(quem, txt, ops, fim) { D = { ativo: true, quem, txt, ops: ops || null, fim, n: 0 }; el('dlg').style.display = ''; el('dq').textContent = quem || ''; el('dq').style.display = quem ? '' : 'none'; el('dt').textContent = ''; el('dt').className = quem ? '' : 'narra'; el('dops').innerHTML = ''; el('dc').style.display = 'none'; desenhaHud(true); }
function fecha() { D = { ativo: false }; el('dlg').style.display = 'none'; desenhaHud(true); salva(); }
function dlgSeq(linhas, fim) { let i = 0; const passo = () => { if (i >= linhas.length) { fecha(); if (fim) fim(); return; } const [q, t] = linhas[i++]; dlg(q, t, null, passo); }; passo(); }
function avanca() { if (!D.ativo || D.trab) return; if (D.n < D.txt.length) { D.n = D.txt.length; mostraDlg(); return; } if (D.ops) return; const f = D.fim; fecha(); if (f) f(); }
function escolhe(i) { if (!D.ativo || D.n < D.txt.length || !D.ops) return; const o = D.ops[i]; if (!o || o.off) return; const cur = D; o.f(); if (D === cur) fecha(); }
function mostraDlg() {
  el('dt').textContent = D.txt.slice(0, Math.floor(D.n)); if (D.n < D.txt.length) return;
  if (D.ops) { el('dops').innerHTML = D.ops.map((o, i) => '<button data-i="' + i + '"' + (o.off ? ' disabled' : '') + '>' + (i + 1) + ' · ' + o.t + '</button>').join(''); el('dops').querySelectorAll('button').forEach(b => b.onclick = () => escolhe(+b.dataset.i)); el('dc').style.display = 'none'; } else { el('dc').style.display = ''; el('dc').onclick = avanca; }
}
// ---- relógio: 1 min de jogo = 6 s reais (1 dia de jogo = 2h24 reais); prazo = sexta, 18h ----
const PRAZO = 3 * 1440 + 18 * 60, MULT = +(new URLSearchParams(location.search).get('tempo') || 1), DIAS = ['Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom', 'Seg'];
function horaTxt() { const m = Math.floor(J.t), h = Math.floor(m / 60) % 24; return DIAS[Math.floor(m / 1440) % 7] + ' ' + String(h).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); }
function horaDe(t) { const m = Math.floor(t); return String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); }
function luzDoDia() { const h = (J.t / 60) % 24; return h < 5 || h >= 20 ? 0 : h < 7 ? (h - 5) / 2 : h < 17 ? 1 : (20 - h) / 3; }
function dorme() {
  const h = (J.t / 60) % 24;
  if (h >= 6 && h < 20) return dlgSeq([['', 'Ainda é dia. Dormir agora só faz o prazo andar sem o dinheiro entrar.']]);
  dlg('', 'Dormir até as 6h da manhã? O relógio avança e o prazo de sexta chega mais perto.', [{ t: 'Dormir', f: () => { const dia = Math.floor(J.t / 1440); J.t = (h < 6 ? dia : dia + 1) * 1440 + 6 * 60; J.vida = 100; fecha(); dlgSeq([['', 'Você apaga no colchão fino. Quando abre os olhos, já é manhã, ' + horaTxt() + '.']]); } }, { t: 'Ainda não', f: () => { } }]);
}
// ---- itens e interação ----
const temItem = t => J.inv.some(q => q.t === t);
function daItem(t) { let s = J.inv.find(q => q.t === t && q.n < PILHA); if (!s) { if (J.inv.length >= SLOTS) { aviso('Mochila cheia'); return false; } s = { t, n: 0 }; J.inv.push(s); } s.n++; desenhaHud(true); salva(); return true; }
function tiraItem(t) { const i = J.inv.findIndex(q => q.t === t); if (i < 0) return; if (--J.inv[i].n <= 0) J.inv.splice(i, 1); desenhaHud(true); salva(); }
function interPerto() { let b = null, bd = 1e9; for (const a of INTER) { if (a.ativo && !a.ativo()) continue; const d = Math.hypot(hx - a.x, hy - a.y); if (d < a.r && d < bd) { bd = d; b = a; } } return b; }
function interagir() { if (D.ativo) { avanca(); return; } if (J.morto) return; if (itemPerto()) { pegar(); return; } const a = interPerto(); if (a) a.f(); }
const texto = (...linhas) => () => dlgSeq(linhas.map(t => ['', t]));
function objetivo() { const f = J.f; if (J.q === 'corre') return 'Entregar a caixa de peças ao Seu Valdir (rua lateral, ao norte)'; if (f.b === 'buscar') return 'Buscar uma bateria usada com o Seu Zeca (ferro-velho, do outro lado da rua lateral)'; if (f.b === 'volta') return 'Levar a bateria ao Tadeu: R$ 55 até ' + horaDe(f.bIni + 60) + ', R$ 45 até ' + horaDe(f.bIni + 120); if (f.n === 'cobrar') return 'Cobrar o fiado de R$ 60 do Seu Osmar (casa ao sul da rua)'; if (f.n === 'volta') return 'Voltar ao mercadinho e acertar com a Dona Neide'; if (J.q === 'fim') return J.divida > 0 ? 'Juntar o dinheiro do aluguel: serviços do Tadeu e da Dona Neide' : 'Aluguel em dia'; if (f.corre === 'recusou') return 'Procurar outro jeito de se virar na rua'; if (f.tadeu) return 'Resolver com o Tadeu'; return f.rua ? 'Falar com o Tadeu, na oficina' : 'Olhar o quarto, pegar o que for útil e sair pela oficina'; }
// ---- bancada do quarto ----
function bancadaQuarto() {
  const f = J.f, ops = [], resta = [];
  if (!f.chave) { ops.push({ t: 'Pegar a chave de roda', f: () => { f.chave = 1; daItem('chave'); aviso('Pegou: Chave de roda'); bancadaQuarto(); } }); resta.push('uma chave de roda engraxada'); }
  if (!f.cur) { ops.push({ t: 'Pegar o curativo', f: () => { f.cur = 1; daItem('curativo'); aviso('Pegou: Kit de curativo'); bancadaQuarto(); } }); resta.push('um curativo'); }
  if (!f.din) { ops.push({ t: 'Pegar as moedas e cédulas amassadas', f: () => { f.din = 1; J.grana += 37; aviso('+ R$ 37'); desenhaHud(true); bancadaQuarto(); } }); resta.push('moedas e cédulas amassadas'); }
  ops.push({ t: 'Ler o caderno de anotações', f: () => dlgSeq([['', 'Rabiscos de rotas pela cidade baixa. Uma lista de nomes, quase todos riscados: Beto, Dona Neide, Marcão.'], ['', 'Só um nome está circulado: Tadeu.']], bancadaQuarto) });
  ops.push({ t: 'Sair', f: () => { } });
  dlg('', 'Na bancada: ' + (resta.length ? resta.join(', ') + ', ' : '') + 'o caderno de anotações e o carregador do comunicador, com o fio descascado.' + (f.din ? '' : ' Dá uns R$ 37, contando tudo.'), ops);
}
// ---- Tadeu e o primeiro corre ----
function repasse(v) { J.grana -= v; J.divida = Math.max(0, J.divida - v); desenhaHud(true); salva(); if (J.divida <= 0) { J.f.quitou = 1; dlgSeq([['Tadeu', J.f.seco ? 'Tá. Agora sim, a gente tá quite. Mas eu não esqueci.' : 'Fechou. O dono do galpão não enche mais o saco. Valeu, de verdade.']]); } else dlgSeq([['Tadeu', 'Anotado. Ainda faltam R$ ' + J.divida + '.' + (J.f.seco ? ' Continua mostrando serviço.' : '')]]); }
function menuTadeu() {
  const f = J.f, d = J.divida, pode = d > 0 && J.grana > 0, t = d <= 0 ? 'O aluguel tá em dia.' : (J.t >= PRAZO ? 'Você me deve R$ ' + d + '.' : 'Ainda faltam R$ ' + d + ' do aluguel. O prazo é sexta, 18h.');
  dlg('Tadeu', f.seco ? 'Fala. ' + t : 'E aí. ' + t, [
    { t: 'Repassar R$ 50', off: !pode || J.grana < 50 || d < 50, f: () => repasse(50) },
    { t: 'Repassar R$ 100', off: !pode || J.grana < 100 || d < 100, f: () => repasse(100) },
    { t: 'Repassar tudo que tenho (R$ ' + Math.min(J.grana, d) + ')', off: !pode, f: () => repasse(Math.min(J.grana, d)) },
    J.f.b === 'volta' && { t: 'Entregar a bateria', f: entregaBateria },
    J.inv.some(q => /^peca_/.test(q.t)) && { t: 'Vender as peças da carcaça', f: vendePecas },
    { t: 'Pedir um serviço', f: pedirServico },
    { t: 'Conversar sobre o corre', f: conversaTadeu },
    { t: 'Deixar pra lá', f: () => { } }].filter(Boolean));
}
function pedirServico() {
  const f = J.f, h = (J.t / 60) % 24, dia = Math.floor(J.t / 1440);
  if (J.q === 'corre') return dlgSeq([['Tadeu', 'Termina a entrega do Valdir primeiro. Uma coisa de cada vez.']]);
  if (f.b === 'buscar' || f.b === 'volta') return dlgSeq([['Tadeu', 'Já tá com o serviço da bateria, não tá? Vai lá.']]);
  if (f.bDia === dia) return dlgSeq([['Tadeu', 'Por hoje já deu serviço, não aparece mais nada. Amanhã cedo, de novo.']]);
  if (h < 5 || h >= 20) return dlgSeq([['Tadeu', 'A rua tá morta a essa hora. Volta amanhã cedo, que aparece serviço.']]);
  dlg('Tadeu', (f.seco ? 'Tenho um serviço. Faz direito dessa vez. ' : 'Tenho um serviço sim. ') + 'Preciso recondicionar a bateria de um cliente, e o Seu Zeca, do ferro-velho do outro lado da rua lateral, tem uma usada. Traz pra cá antes que o movimento aumente: se voltar em até uma hora eu pago R$ 55, em até duas R$ 45, depois disso R$ 35. A bateria é por sua conta, o Zeca costuma pedir uns R$ 25.', [
    { t: 'Fechado. Vou lá.', f: () => { f.b = 'buscar'; f.bIni = J.t; f.bCusto = null; dlgSeq([['Tadeu', 'A rua ainda tá acordando, vai de olho. E negocia com o Zeca, ele gosta de um papo.']]); } },
    { t: 'Deixa pra lá.', f: () => { } }]);
}
function entregaBateria() {
  const f = J.f, gasto = J.t - f.bIni, base = gasto <= 60 ? 55 : gasto <= 120 ? 45 : 35, pg = Math.max(10, base - (f.seco ? 10 : 0));
  tiraItem('bateria'); J.grana += pg; f.b = 'feito'; f.bDia = Math.floor(J.t / 1440); desenhaHud(true);
  dlgSeq([['Tadeu', gasto <= 60 ? 'Rapidinho! Era isso.' : gasto <= 120 ? 'Demorou um pouco, mas serve.' : 'Demorou demais. O cliente já tava reclamando.'], ['', 'O Tadeu confere a bateria e entrega R$ ' + pg + '.'], ...(f.zecaAmigo ? [['Tadeu', 'Soube que você deu uma mão pro Zeca. Ele fala bem de você, e isso vale mais que o dinheiro.']] : []), ...(f.seco ? [['Tadeu', 'Descontei do que você me deve. Continua assim.']] : [])]);
}
// ---- desmontar a carcaça do Zeca ----
const ETAPAS = [{ id: 'alt', nome: 'o alternador', valor: 50 }, { id: 'part', nome: 'o motor de partida', valor: 40 }, { id: 'bomba', nome: 'a bomba d\'água', valor: 25 }];
function trabalha(min, fim) {
  dlg('', 'Desmontando...', null, null); D.trab = true; D.n = D.txt.length; el('dc').style.display = 'none';
  const ini = J.t, alvo = J.t + min, t0 = performance.now(), dur = 1800;
  const iv = setInterval(() => { const p = Math.min(1, (performance.now() - t0) / dur), k = Math.floor(p * 20); J.t = ini + (alvo - ini) * p; el('dt').textContent = 'Desmontando a carcaça...   ' + '█'.repeat(k) + '░'.repeat(20 - k) + '   ' + horaTxt(); if (p >= 1) { clearInterval(iv); fecha(); fim(); } }, 60);
}
function falaCarcaca() {
  const f = J.f, i = f.cEt || 0, h = (J.t / 60) % 24, dia = Math.floor(J.t / 1440);
  if (!f.zecaAmigo) return dlgSeq([['', 'Uma carcaça de carro sem rodas, mais ferrugem que lata. O Seu Zeca fica de olho em quem mexe nela.']]);
  if (i >= 3) return dlgSeq([['', 'A carcaça está limpa: sobrou só a lataria e a ferrugem. O Seu Zeca já tá de olho no ferro pra vender.']]);
  if (!temItem('chave')) return dlgSeq([['', 'Sem a chave de roda não dá pra soltar nada aqui.']]);
  if (h < 6 || h >= 20) return dlgSeq([['', 'Escuro demais pra mexer em motor. Volta de dia.']]);
  if (f.cDia !== dia) { f.cDia = dia; f.cN = 0; }
  if (f.cN >= 2) return dlgSeq([['', 'Já deu por hoje: as mãos estão em carne viva. Amanhã a gente continua.']]);
  const e = ETAPAS[i];
  dlg('', 'O Seu Zeca aponta para ' + e.nome + ' da carcaça. "Inteiro vale uns R$ ' + e.valor + ' pro Tadeu. Na marra, metade."', [
    { t: 'Soltar com cuidado (1h de jogo, peça perfeita)', f: () => trabalha(60, () => pecaPronta(e, true)) },
    { t: 'Soltar na força (20 min, peça danificada: vale metade)', f: () => trabalha(20, () => pecaPronta(e, false)) },
    { t: 'Deixar pra depois', f: () => { } }]);
}
function pecaPronta(e, boa) {
  const t = 'peca_' + e.id + (boa ? '' : '_d'); if (!daItem(t)) { aviso('Mochila cheia: a peça ficou na carcaça'); return; }
  J.f.cEt = (J.f.cEt || 0) + 1; J.f.cN = (J.f.cN || 0) + 1; aviso('Pegou: ' + ITENS[t].nome);
  dlgSeq([['', boa ? 'Parafuso por parafuso, ' + e.nome + ' sai inteiro e limpo.' : 'Você faz força até o ferro ceder. ' + e.nome + ' sai amassado e riscado, mas sai.'], ['Seu Zeca', boa ? 'Isso é trabalho de quem sabe o que tá fazendo. Lembra: a carcaça é minha, então 40% do que a peça render é meu. O Tadeu me acerta.' : 'Rápido, mas olha o estrago. O Tadeu vai pagar menos. E 40% do que render é meu, que a carcaça é minha.']]);
}
function vendePecas() {
  let total = 0, boas = 0, ruins = 0; const itens = [];
  for (const q of J.inv) { const m = /^peca_(alt|part|bomba)(_d)?$/.exec(q.t); if (!m) continue; const e = ETAPAS.find(x => x.id === m[1]), v = Math.round(e.valor * (m[2] ? .5 : 1)); total += v * q.n; (m[2] ? (ruins += q.n) : (boas += q.n)); itens.push(q); }
  if (!itens.length) return dlgSeq([['Tadeu', 'Você não tem peça nenhuma pra eu ver.']]);
  const zeca = Math.round(total * .4), liq = total - zeca;
  dlg('Tadeu', 'Deixa eu ver o que o Zeca te passou... ' + (boas ? 'Essas inteiras estão limpas, bom serviço. ' : '') + (ruins ? 'Essas amassadas não valem o mesmo. ' : '') + 'Dou R$ ' + total + ' por tudo. A carcaça é do Zeca, então 40% (R$ ' + zeca + ') eu já separo pra ele. Sobram R$ ' + liq + ' pra você.', [
    { t: 'Vender tudo (você recebe R$ ' + liq + ')', f: () => { for (const q of itens) { for (let k = q.n; k > 0; k--) tiraItem(q.t); } J.grana += liq; aviso('+ R$ ' + liq); desenhaHud(true); dlgSeq([['Tadeu', J.f.zecaAmigo ? 'O Zeca tá te passando coisa boa, hein. Mantém essa amizade.' : 'Combinado.']]); } },
    { t: 'Ainda não', f: () => { } }]);
}
function falaZeca() {
  const f = J.f;
  if (f.b !== 'buscar' && f.zecaAmigo && (f.cEt || 0) < 3) return dlgSeq([['Seu Zeca', 'Aquela carcaça ainda tem coisa boa: alternador, motor de partida e bomba d\'água. Tira com cuidado, que o Tadeu paga bem por peça inteira. A carcaça é minha, então 40% do que render é meu; o resto é teu. Mão de obra boa eu reconheço.']]);
  if (f.b !== 'buscar') return dlgSeq([['Seu Zeca', f.b === 'volta' ? 'Já levou a bateria? Então vai, o Tadeu não gosta de esperar.' : 'Sucata, ferro-velho, peça usada. Se o Tadeu mandar, eu tenho.']]);
  const leva = custo => { f.bCusto = custo; f.b = 'volta'; J.grana -= custo; daItem('bateria'); aviso('Pegou: Bateria usada'); desenhaHud(true); };
  dlg('Seu Zeca', 'Ô, o menino do Tadeu. A bateria tá ali, usada mas ainda dá carga. Vinte e cinco e é tua.', [
    { t: 'Pagar R$ 25', off: J.grana < 25, f: () => { leva(25); dlgSeq([['Seu Zeca', 'Negócio fechado. Leva com cuidado, que é pesada.']]); } },
    { t: 'Barganhar o preço', f: () => dlg('Seu Zeca', 'Barganhar? (ri) Tá bom, tá bom. Quinze e não se fala mais nisso. Ou então me dá uma mão com aquela peça emperrada na carcaça, que eu tô há anos tentando soltar.', [
      { t: 'Pagar R$ 15', off: J.grana < 15, f: () => { leva(15); dlgSeq([['Seu Zeca', 'Assim que eu gosto, freguês que sabe conversar.']]); } },
      { t: 'Soltar a peça emperrada com a chave de roda, em troca da bateria', off: !temItem('chave'), f: () => { f.zecaAmigo = 1; leva(0); dlgSeq([['', 'Você encaixa a chave de roda no parafuso enferrujado e faz força até ele ceder. O Seu Zeca assiste de braços cruzados.'], ['Seu Zeca', 'Anos que essa peça tava presa! Leva a bateria, é tua. E volta sempre.']]); } },
      { t: 'Deixa, eu volto depois', f: () => { } }]) },
    { t: 'Voltar depois', f: () => { } }]);
}
function falaTadeu() {
  if (J.f.corre) return menuTadeu();
  conversaTadeu();
}
function conversaTadeu() {
  const f = J.f; f.tadeu = 1;
  if (J.q === 'fim') return dlgSeq([['Tadeu', 'O Valdir já me avisou que a caixa chegou. Valeu de verdade. Passa aqui amanhã cedo, sempre aparece alguma coisa.']]);
    if (J.q === 'corre') return dlgSeq([['Tadeu', 'Ainda com a caixa na mão? O Valdir espera na rua lateral, lá em cima. Vai antes de a rua encher.']]);
  if (f.corre === 'recusou') return dlg('Tadeu', 'Mudou de ideia?', [{ t: 'Aceito o corre. R$ 40 no fim.', f: () => aceita('direto', 40, 'Tá. Então vai. Mas agora é R$ 40, o resto já distribuí.') }, { t: 'Ainda não.', f: () => { } }]);
  dlg('Tadeu', 'Ô, acordou cedo. Ou nem dormiu... (limpa a graxa das mãos) O dono do galpão cobrou de novo, e sexta é o prazo. A sua parte ainda tá em aberto, tá? Por isso preciso de um favor rápido antes de a rua encher. Essa caixa de peças tem que chegar no Seu Valdir, na rua lateral, ali em cima. Ele paga R$ 50 na entrega. Só que o pessoal da Guilda do Cano anda rondando por lá.', [
    { t: 'Topo. Já saio.', f: () => aceita('direto', 50, 'Boa. Vai com cuidado, e volta inteiro. A peça é cara.') },
    { t: 'R$ 50 é pouco pro risco. Me adianta uma parte e me diz o que tem lá fora.', f: negocia },
    { t: 'Hoje não, Tadeu. Eu me viro.', f: recusa }]);
}
function aceita(tipo, paga, fala) { J.f.corre = tipo; J.f.paga = paga; J.q = 'corre'; dlgSeq([['Tadeu', fala], ['', 'O Tadeu entrega uma caixa pesada, lacrada com fita amarela.']], () => { if (!temItem('caixa')) daItem('caixa'); aviso('Pegou: Caixa de peças'); desenhaHud(true); }); }
function negocia() {
  dlg('Tadeu', '(suspira) Rapaz... Tá bom. Toma R$ 20 agora e os R$ 30 o Valdir paga na entrega. E olha: os caras da guilda saem pro café lá pelas sete. Se você demorar um pouco, passa limpo.', [
    { t: 'Fechado. Espero eles saírem.', f: () => { J.grana += 20; aviso('+ R$ 20'); aceita('negociou', 30, 'Combinado. Sem pressa, mas sem enrolar também.'); } },
    { t: 'Quero R$ 30 agora, não R$ 20.', f: () => dlg('Tadeu', 'Tá achando que eu sou banco? Ou vai por R$ 40 no fim, sem adiantamento, ou não vai.', [{ t: 'Tá bom. Vou assim mesmo.', f: () => { J.f.conf = -1; aceita('azedou', 40, 'Então vai. E não demora.'); } }, { t: 'Então deixa pra lá.', f: recusa }]) }]);
}
function recusa() { J.f.corre = 'recusou'; dlgSeq([['Tadeu', 'Cada um sabe de si. A porta fica aberta se você mudar de ideia.']]); }
function entrega() {
  if (!temItem('caixa')) return dlgSeq([['Seu Valdir', 'Cadê a caixa? Sem a caixa não tem conversa.']]);
  const pg = J.f.paga, linhas = [['Seu Valdir', 'Até que enfim. Deixa eu ver... (confere a caixa) Tá inteira. Fala pro Tadeu que a conta fecha.'], ['', 'Seu Valdir conta as notas e entrega R$ ' + pg + '.']];
  if (J.f.marcado) linhas.push(['Seu Valdir', 'Ouvi dizer que a guilda ficou de olho em você. Cuida desse pedaço pra não trazer problema pra cá.']);
  tiraItem('caixa'); J.grana += pg; J.q = 'fim'; desenhaHud(true);
  dlgSeq(linhas, () => dlgSeq([['', 'Primeiro corre cumprido. Mas o aviso ainda cobra R$ 480 pela oficina e pelo quarto, e a sexta não espera.'], ['', 'FIM DA CENA 01 — a rotina da cidade baixa continua.']]));
}
// ---- mercadinho da Dona Neide: aberto das 6h às 20h ----
const aberto = () => { const h = (J.t / 60) % 24; return h >= 6 && h < 20; }, diaAtual = () => Math.floor(J.t / 1440);
function compra(t, preco) { if (J.grana < preco) return aviso('Falta dinheiro (R$ ' + preco + ')'); if (!daItem(t)) return; J.grana -= preco; aviso('Comprou: ' + ITENS[t].nome + ' (- R$ ' + preco + ')'); desenhaHud(true); }
function falaNeide() {
  const f = J.f;
  if (!aberto()) return dlgSeq([['', 'O mercadinho está fechado. A placa diz: "abre às 6h, fecha às 20h".']]);
  if (f.n === 'volta') return acertoNeide();
  const intro = !f.neide; f.neide = 1;
  const menu = () => dlg('Dona Neide', intro && !f.neideMenu ? 'Ah, o rapaz da oficina do Tadeu! Já te vi passando por aqui. Aqui o que é meu tá com preço na etiqueta, e fiado só pra quem eu conheço há tempo. O que vai ser?' : 'Fala, meu filho. O que vai ser?', [
    { t: 'Comprar curativo (R$ 18)', off: J.grana < 18, f: () => { compra('curativo', 18); menu(); } },
    { t: 'Comprar analgésico (R$ 10)', off: J.grana < 10, f: () => { compra('analgesico', 10); menu(); } },
    { t: 'Perguntar se tem serviço', f: servicoNeide },
    { t: 'Sair', f: () => { } }]);
  f.neideMenu = 0; menu();
}
function servicoNeide() {
  const f = J.f;
  if (f.n === 'cobrar') return dlgSeq([['Dona Neide', 'Já te falei: o fiado do Seu Osmar, ali ao sul. Sem o dinheiro, nem volta.']]);
  if (f.neideDia === diaAtual()) return dlgSeq([['Dona Neide', 'Por hoje já deu, né? Amanhã eu vejo se aparece alguma coisa.']]);
  dlg('Dona Neide', 'Tem sim. O Seu Osmar, da casa ao sul da rua, me deve R$ 60 de fiado faz um mês. Fala que não tem, mas eu vejo ele comprando cigarro. Cobra pra mim que eu te dou uma parte, conforme o que você trouxer.', [
    { t: 'Fechado. Eu cobro.', f: () => { f.n = 'cobrar'; f.coleta = 0; dlgSeq([['Dona Neide', 'Boa. Ele é arredio, vai fazer cara de coitado. Não cai.']]); } },
    { t: 'Agora não.', f: () => { } }]);
}
function falaOsmar() {
  const f = J.f;
  if (f.n !== 'cobrar') return dlgSeq([['Seu Osmar', 'Não tô com tempo pra papo, rapaz.']]);
  dlg('Seu Osmar', 'Fiado? Que fiado? Eu pago a Dona Neide quando tiver. Não tô com dinheiro nenhum, olha só os meus bolsos!', [
    { t: temItem('chave') ? 'Cobrar firme (mostrar a chave de roda)' : 'Cobrar firme', f: () => {
      if (temItem('chave')) { f.coleta = 60; f.osmarMarcado = 1; f.n = 'volta'; dlgSeq([['', 'Você deixa a chave de roda aparecer na mão. O Seu Osmar engole seco.'], ['Seu Osmar', 'Tá bom, tá bom! Toma os R$ 60. Mas não precisava disso.'], ['', 'R$ 60 do fiado no bolso. O Seu Osmar não vai esquecer a sua cara.']]); }
      else { f.coleta = 30; f.n = 'volta'; dlgSeq([['Seu Osmar', 'Tenho R$ 30, é o que tem. O resto eu pago quando puder.'], ['', 'Sem nada na mão para pressionar, só saiu a metade.']]); } } },
    { t: 'Negociar: R$ 40 agora e o resto em duas semanas', f: () => { f.coleta = 40; f.n = 'volta'; dlgSeq([['Seu Osmar', 'Assim eu consigo. Toma R$ 40. O resto eu junto, prometo.'], ['', 'O Seu Osmar fica aliviado. Você ganhou um aliado, ou pelo menos um devedor educado.']]); } },
    { t: 'Voltar depois', f: () => { } }]);
}
function acertoNeide() {
  const f = J.f, col = f.coleta, pg = col >= 60 ? 50 : col >= 40 ? 35 : 25;
  dlgSeq([['Dona Neide', col >= 60 ? 'Tudo?! Mas que homem! Toma, sua parte: R$ ' + pg + '.' : col >= 40 ? 'Quarenta... é menos, mas já é alguma coisa. Sua parte: R$ ' + pg + '.' : 'Só trinta? Ele te enrolou, hein. Sua parte: R$ ' + pg + '.'], ...(f.osmarMarcado ? [['Dona Neide', 'Ouvi dizer que você mostrou a chave de roda pro Osmar. Rua pequena, rapaz. Aqui todo mundo fala.']] : [])], () => { J.grana += pg; aviso('+ R$ ' + pg); f.n = 'feito'; f.neideDia = diaAtual(); desenhaHud(true); });
}
// ---- ponto do Seu Valdir e a guilda ----
const guardado = () => J.q === 'corre' && J.f.corre !== 'negociou' && !J.f.liberado;
function encontro() {
  dlg('Capanga da Guilda', 'E aí, parceiro. Esse trecho é da Guilda do Cano. Taxa de circulação: R$ 20. Ou a caixa fica aqui.', [
    { t: 'Pagar R$ 20', off: J.grana < 20, f: () => { J.grana -= 20; J.f.liberado = 1; desenhaHud(true); dlgSeq([['Capanga da Guilda', 'Tá certo. Pode levar.']]); } },
    { t: 'Mostrar a chave de roda', off: !temItem('chave'), f: () => { J.f.liberado = 1; J.f.marcado = 1; dlgSeq([['', 'Os dois olham a ferramenta na sua mão. Trocam um olhar.'], ['Capanga da Guilda', 'Não vale a confusão. Leva. Mas a gente sabe a sua cara.']]); } },
    { t: 'Voltar depois', f: () => { } }]);
}
function falaValdir() {
  if (J.q === 'fim') return dlgSeq([['Seu Valdir', 'Tá acertado. Se aparecer outra caixa, eu mando chamar.']]);
  if (J.q !== 'corre') return dlgSeq([['Seu Valdir', 'Se não é entrega, não tenho tempo. Volta quando tiver alguma coisa.']]);
  if (guardado()) return encontro();
  entrega();
}
// ---- montagem do cenário ----
const COR = { madeira: ['#8a6a46', '#6f5337', '#58402a'], ferro: ['#7b7f86', '#5f636a', '#4a4d53'], pano: ['#b9b3a4', '#948f82', '#7a766b'], caixa: ['#a98150', '#8a6840', '#6e5232'], branco: ['#cdd0c8', '#aeb1a9', '#8f928b'], carro: ['#8c5b41', '#6e4733', '#56382a'], vidro: ['#7a9aab', '#617d8b', '#4d6470'], preto: ['#2b2b30', '#202024', '#18181b'], balde: ['#6d7e8c', '#586774', '#46525c'] };
function montaMoveis() {
  MOVEIS = []; INTER = []; LUZES = [];
  const liga = (m, x, y, r, rot, f, ativo) => INTER.push({ x, y, r, rot, f, ativo });
  // quarto
  const colchao = movel({ x: 5.25, y: 11.0, w: .95, d: 1.85, partes: [{ w: .95, d: 1.85, h: 8, cores: ['#a8a59e', '#898680', '#6e6c67'], det: (g, pr, o) => { ret(g, '#cfc8b8', ...pr(.12, .12, o.zt), 1, 1); for (let b = .1; b < .5; b += .05) lin(g, '#d9d3c4', pr(.15, b, o.zt), pr(.8, b, o.zt)); lin(g, '#7e7a70', pr(.1, 1.0, o.zt), pr(.7, 1.15, o.zt)); lin(g, '#7e7a70', pr(.2, 1.4, o.zt), pr(.85, 1.35, o.zt)); } }] });
  liga(colchao, 5.75, 11.9, 1.5, 'Descansar no colchão', () => dlg('', 'Um colchão fino no chão. O lençol ainda guarda a forma de quem dormiu mal.', [{ t: 'Dormir (pula a noite até as 6h)', f: dorme }, { t: 'Deixar pra lá', f: () => { } }]));
  const banc = movel({ x: 6.15, y: 10.15, w: 1.7, d: .7, partes: [{ w: 1.7, d: .7, h: 30, cores: COR.madeira, det: (g, pr, o) => { lin(g, '#aeb2b8', pr(.15, .35, o.zt), pr(.7, .3, o.zt)); lin(g, '#d9d9de', pr(.18, .33, o.zt), pr(.5, .3, o.zt)); ret(g, '#e8c14a', ...pr(1.0, .4, o.zt), 2, 1); ret(g, '#e8c14a', ...pr(1.08, .45, o.zt), 2, 1); ret(g, '#cfc8a8', ...pr(1.1, .3, o.zt), 3, 1); lin(g, '#e7e3d8', pr(1.35, .15, o.zt), pr(1.55, .2, o.zt)); lin(g, '#1c1c20', pr(.1, .55, o.zt), pr(.9, .6, o.zt)); } }] });
  liga(banc, 7.0, 10.9, 1.5, 'Mexer na bancada', bancadaQuarto);
  const aviso1 = movel({ x: 5.3, y: 10.1, w: .6, d: .05, bloq: false, partes: [{ w: .6, d: .05, h: 20, z0: 38, cores: ['#e6e0cc', '#d4cdb4', '#bdb69d'], det: (g, pr, o) => { for (let k = 0; k < 4; k++) lin(g, '#55504a', pr(.06, .05, o.zt - 4 - k * 3), pr(.5, .05, o.zt - 4 - k * 3)); lin(g, '#c8332b', pr(.06, .05, o.zt - 16), pr(.5, .05, o.zt - 16)); } }] });
  liga(aviso1, 5.6, 10.7, 1.4, 'Ler o aviso na parede', () => dlgSeq([['', 'AVISO DE COBRANÇA. Oficina e quarto dos fundos: 3 meses em atraso. Total devido: R$ 480. Prazo: sexta-feira.'], ['', 'O nome do Tadeu está no papel. O valor está sublinhado em vermelho, duas vezes.'], ['', 'O proprietário nunca consertou a goteira, mas cobra o aluguel inteiro. Se a sua parte não vier, a conta cai toda nas costas do Tadeu.']], () => { J.f.aviso = 1; desenhaHud(true); }));
  const balde = movel({ x: 7.35, y: 11.0, w: .4, d: .4, partes: [{ w: .4, d: .4, h: 16, cores: COR.balde, det: (g, pr, o) => { ret(g, '#2a3b4a', ...pr(.08, .08, o.zt), 18, 8); ret(g, '#6fa3c4', ...pr(.12, .2, o.zt), 6, 1); } }] });
  liga(balde, 7.55, 11.2, 1.3, 'Olhar o balde', texto('O balde já está quase cheio. A goteira começou no mês passado e o dono do imóvel nunca apareceu.'));
  LUZES.push({ x: 6.8, y: 11.7, z: 90, r: 230, pisca: true });
  // oficina
  const gel = movel({ x: 8.3, y: 10.15, w: .8, d: .8, partes: [{ w: .8, d: .8, h: 66, cores: COR.branco, det: (g, pr, o) => { lin(g, '#6b6e68', pr(.8, .65, o.zt - 8), pr(.8, .65, o.zt - 22)); lin(g, '#6b6e68', pr(.65, .8, o.zt - 8), pr(.65, .8, o.zt - 22)); } }] });
  liga(gel, 8.7, 11.2, 1.4, 'Olhar a geladeira', texto('A geladeira velha zumbe sem parar. Dentro: meia garrafa d\'água e um pote sem tampa. Nada que dê pra vender.'));
  const rodas = (dx, dy) => ({ dx, dy, w: .16, d: .5, h: 18, cores: COR.preto });
  const carro = movel({ x: 10.3, y: 11.6, w: 1.6, d: 3.0, partes: [rodas(.02, .35), rodas(.02, 2.15), { dx: .1, w: 1.4, d: 3.0, h: 22, z0: 8, cores: COR.carro }, { dx: .2, dy: .8, w: 1.2, d: 1.5, h: 20, z0: 30, cores: COR.vidro }, rodas(1.42, .35), rodas(1.42, 2.15)] });
  liga(carro, 11.1, 13.1, 2.4, 'Olhar o carro', texto('Um carro de cliente, parado há semanas esperando uma peça que nunca chega. A lataria está fria.'));
  const cx1 = movel({ x: 14.0, y: 10.2, w: .9, d: .9, partes: [{ w: .9, d: .9, h: 26, cores: COR.caixa }, { dx: .15, dy: .15, w: .6, d: .6, h: 18, z0: 26, cores: ['#b8905a', '#9a7348', '#7c5b38'] }] });
  const cx2 = movel({ x: 13.0, y: 10.25, w: .6, d: .6, partes: [{ w: .6, d: .6, h: 20, cores: COR.caixa }] });
  liga(cx1, 14.0, 11.5, 1.6, 'Olhar as caixas', texto('Caixas de peças, todas etiquetadas. Nenhuma é sua.'));
  const bt = movel({ x: 13.8, y: 15.1, w: 1.8, d: .75, partes: [{ w: 1.8, d: .75, h: 30, cores: COR.madeira, det: (g, pr, o) => { ret(g, '#d9d9de', ...pr(.3, .3, o.zt), 5, 1); } }, { dx: 1.2, dy: .2, w: .35, d: .22, h: 12, z0: 30, cores: ['#4a4f47', '#383c36', '#2b2e2a'], det: (g, pr, o) => { lin(g, '#9a9aa2', pr(.3, .1, o.zt), pr(.3, .1, o.zt + 14)); ret(g, '#d8a04a', ...pr(.1, .22, o.zt - 4), 2, 2); } }] });
  liga(bt, 14.7, 14.5, 1.7, 'Ouvir o rádio', texto('O rádio de bancada chia baixo, entre duas estações. De vez em quando sai um pedaço de notícia sobre a "taxa de circulação" dos distritos altos.'), () => !tadeuPerto());
  // Tadeu
  const tad = { x: 15.35, y: 14.45, w: .5, d: .5, bloq: true, npc: true, desenha: now => desenhaNpc('tadeu', 15.6, 14.7, [hexRgb('#c27a3a'), hexRgb('#6b4021'), hexRgb('#97602f')], now) }; MOVEIS.push(tad);
  liga(tad, 15.6, 14.7, 1.7, 'Falar com o Tadeu', falaTadeu);
  // rua: ponto do Seu Valdir, guilda e mural
  const mesa = movel({ x: 20.2, y: 3.8, w: 1.2, d: .75, partes: [{ w: 1.2, d: .75, h: 28, cores: COR.madeira }, { dx: .35, dy: .15, w: .5, d: .4, h: 16, z0: 28, cores: COR.caixa, det: (g, pr, o) => { lin(g, '#e0c35a', pr(.1, .2, o.zt), pr(.4, .2, o.zt)); } }] });
  mesa.ativo = () => true;
  const vald = { x: 20.55, y: 3.05, w: .5, d: .5, bloq: true, npc: true, desenha: now => desenhaNpc('valdir', 20.8, 3.3, [hexRgb('#4f8a84'), hexRgb('#24433f'), hexRgb('#3a6661')], now) }; MOVEIS.push(vald);
  liga(mesa, 20.8, 4.5, 2.0, 'Falar com o Seu Valdir', falaValdir);
    for (const [id, x0, y0, x1, y1, cor, nome] of [['g1', 19.2, 6.0, 21.9, 5.2, [hexRgb('#9a2f2f'), hexRgb('#4a1717'), hexRgb('#762424')], 'g1'], ['g2', 18.1, 5.5, 17.2, 5.9, [hexRgb('#4c5262'), hexRgb('#262a34'), hexRgb('#3a3f4d')], 'g2']]) {
    const px = () => J.q === 'corre' && !J.f.liberado && J.f.corre !== 'negociou' ? x0 : x1, py = () => J.q === 'corre' && !J.f.liberado && J.f.corre !== 'negociou' ? y0 : y1;
    const m = { get x() { return px() - .25; }, get y() { return py() - .25; }, w: .5, d: .5, bloq: true, npc: true, ativo: () => !(J.f.corre === 'negociou' && J.q === 'corre') && J.q !== 'fim', desenha: now => desenhaNpc(id, px(), py(), cor, now) }; MOVEIS.push(m);
  }
  const mural = movel({ x: 17.15, y: 17.3, w: .1, d: .9, partes: [{ dx: 0, dy: .4, w: .1, d: .1, h: 70, cores: COR.madeira }, { w: .1, d: .9, h: 36, z0: 40, cores: ['#d6cdb0', '#b9b094', '#9c9479'], det: (g, pr, o) => { for (let k = 0; k < 5; k++) lin(g, '#55504a', pr(.1, .15, o.zt - 4 - k * 5), pr(.1, .75, o.zt - 4 - k * 5)); } }] }); mural.bloq = false;
  liga(mural, 17.2, 17.75, 1.6, 'Ler o mural de bicos', () => dlgSeq([['', 'MURAL DE BICOS. "Precisa-se ajudante de feira. Falar com Dona Neide no mercadinho. R$ 25 por dia."'], ['', 'O papel está meio rasgado. Alguém já tentou a vaga.']], () => { J.f.mural = 1; }));
  // mercadinho da Dona Neide (casa x 23..27, y 15..20): estante no fundo, balcão e a dona
  const prat = movel({ x: 23.5, y: 15.2, w: 3.0, d: .45, partes: [{ w: 3.0, d: .45, h: 62, cores: ['#9a7a52', '#7c6040', '#624c32'], det: (g, pr, o) => { const cs = ['#c8473a', '#e0b84a', '#4a8fc4', '#7aa84a', '#d98a4a']; for (const z of [12, 30, 48]) for (let a = .12; a < 2.8; a += .24) ret(g, cs[Math.floor((a * 7 + z) % 5)], ...pr(a, o.d, z), 7, 9); } }] });
  liga(prat, 25.0, 16.2, 1.5, 'Olhar as prateleiras', texto('Prateleiras apertadas: arroz, feijão, óleo, sabão e uma fileira de analgésicos atrás do balcão. Tudo com a etiqueta de preço escrita à mão.'));
  const balc = movel({ x: 25.0, y: 16.4, w: .8, d: 2.4, partes: [{ w: .8, d: 2.4, h: 34, cores: ['#a98150', '#8a6840', '#6e5232'], det: (g, pr, o) => { ret(g, '#3a3f44', ...pr(.3, 1.2, o.zt), 10, 5); ret(g, '#8fd0a0', ...pr(.4, 1.2, o.zt - 1), 4, 2); ret(g, '#e0d8c0', ...pr(.2, .4, o.zt), 6, 2); } }] });
  liga(balc, 24.7, 17.6, 2.0, 'Falar com a Dona Neide', falaNeide);
  const neide = { x: 26.0, y: 16.9, w: .5, d: .5, bloq: true, npc: true, ativo: aberto, desenha: now => desenhaNpc('neide', 26.25, 17.15, [hexRgb('#c0607a'), hexRgb('#6e2c40'), hexRgb('#8f4560')], now) }; MOVEIS.push(neide);
  // Seu Osmar, na frente da casa ao sul
  const osmar = { x: 21.15, y: 24.15, w: .5, d: .5, bloq: true, npc: true, desenha: now => desenhaNpc('osmar', 21.4, 24.4, [hexRgb('#a3763a'), hexRgb('#4f3818'), hexRgb('#7d5a2a')], now) }; MOVEIS.push(osmar);
  liga(osmar, 21.4, 24.4, 1.8, 'Falar com o Seu Osmar', falaOsmar);
  // ferro-velho do Seu Zeca (terreno a leste da rua lateral): carcaça, pilha de sucata e o dono
  const carc = movel({ x: 20.3, y: 10.4, w: 1.6, d: 1.1, partes: [{ w: 1.6, d: 1.1, h: 24, z0: 4, cores: ['#8a5a40', '#6d4733', '#563826'], det: (g, pr, o) => { ret(g, '#3a3a40', ...pr(.3, .3, o.zt), 18, 6); lin(g, '#b07a50', pr(.1, .8, o.zt - 8), pr(1.4, .8, o.zt - 8)); } }, { dx: .1, dy: .1, w: .25, d: .25, h: 6, cores: COR.preto }] });
  liga(carc, 21.1, 11.1, 1.6, 'Mexer na carcaça', falaCarcaca);
  const pil = movel({ x: 22.5, y: 11.2, w: .9, d: .9, partes: [{ w: .9, d: .9, h: 22, cores: COR.ferro }, { dx: .1, dy: .1, w: .7, d: .6, h: 14, z0: 22, cores: ['#4a4f47', '#383c36', '#2b2e2a'], det: (g, pr, o) => { ret(g, '#c8473a', ...pr(.12, .1, o.zt), 3, 2); ret(g, '#9a9aa2', ...pr(.5, .1, o.zt), 3, 2); } }] });
  liga(pil, 22.9, 11.8, 1.4, 'Olhar a pilha de sucata', texto('Pilha de baterias velhas, pedaços de motor e fios enrolados. O Zeca sabe o preço de cada parafuso.'));
  const zeca = { x: 21.35, y: 12.05, w: .5, d: .5, bloq: true, npc: true, desenha: now => desenhaNpc('zeca', 21.6, 12.3, [hexRgb('#7a4a8a'), hexRgb('#3e2347'), hexRgb('#5c3668')], now) }; MOVEIS.push(zeca);
  liga(zeca, 21.6, 12.3, 1.8, 'Falar com o Seu Zeca', falaZeca);
}
function itensCena(now) {
  const out = [];
  for (const m of MOVEIS) { if (m.ativo && !m.ativo()) continue; if (m.npc) out.push({ d: m.x + m.y + m.w, f: () => m.desenha(now) }); else out.push({ d: dMovel(m), f: () => desenhaMovel(m) }); }
  for (const L of LUZES) out.push({ d: L.x + L.y + .3, f: () => { const X = Math.round(sxm(L.x, L.y)), Y = Math.round(sym(L.x, L.y)) - L.z; ctx.fillStyle = '#18181b'; ctx.fillRect(X, Y - 40, 1, 40); ctx.fillStyle = '#f0c060'; ctx.fillRect(X - 2, Y, 5, 5); ctx.fillStyle = '#2b2b30'; ctx.fillRect(X - 2, Y - 3, 5, 3); } });
  return out;
}
// ---- atmosfera: madrugada fria, lâmpada com mau contato, a rua clareando ----
let dia = 0;
const luzPisca = now => { const a = Math.sin(now / 130) + Math.sin(now / 53 + 1.7) + Math.sin(now / 310); return a > 2.1 ? .25 : a > 1.6 ? .7 : 1; };
function ambiente(now) {
  dia += (luzDoDia() * (hx > 16.4 ? 1 : .55) - dia) * .03; const W = cv.width, H = cv.height, t = (a, b) => Math.round(a + (b - a) * dia);
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgb(' + t(95, 225) + ',' + t(102, 225) + ',' + t(135, 232) + ')'; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'lighter';
  for (const L of LUZES) { const px = W / 2 + (sxm(L.x, L.y) - hsx) * K, py = H / 2 + (sym(L.x, L.y) - L.z - hsy) * K, r = L.r * K, f = L.pisca ? luzPisca(now) : 1, g = ctx.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, 'rgba(255,170,80,' + (.3 * f * (1 - dia * .7)) + ')'); g.addColorStop(1, 'rgba(255,170,80,0)'); ctx.fillStyle = g; ctx.fillRect(px - r, py - r, 2 * r, 2 * r); }
  ctx.restore();
}
// ---- mapa da cena ----
function geraCena01() {
  const rnd = rng(1123), longe = Array.from({ length: M }, () => Array(M).fill(true)), livre = Array.from({ length: M }, () => Array(M).fill(true)), pw = new Map();
  for (let y = 0; y < M; y++) for (let x = 0; x < M; x++) MAP[y][x] = 'grama_baixa';
  objetos = []; paredes = []; pisos = new Set(); ITENS_MUNDO = [];
  const terra = (x, y) => { if (x >= 0 && y >= 0 && x < M && y < M) { MAP[y][x] = 'terra_nova'; livre[y][x] = false; } };
  const reta = (x0, y0, x1, y1) => { for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) terra(x, y); };
  const par = (a, c, n, k) => pw.set(a + '|' + c + '|' + n, { a, c, n, k });
  const reserva = (x0, y0, x1, y1) => { for (let y = y0 - 3; y <= y1 + 3; y++) for (let x = x0 - 3; x <= x1 + 3; x++) if (x >= 0 && y >= 0 && x < M && y < M) { longe[y][x] = false; if (x >= x0 - 1 && x <= x1 + 1 && y >= y0 - 1 && y <= y1 + 1) livre[y][x] = false; } };
  reta(18, 0, 19, M - 1);   // rua lateral
  reta(16, 13, 17, 13);     // da porta do portão até a rua
  // quarto (x 5..7, y 10..12) + oficina (x 8..15, y 10..15)
  for (let y = 10; y <= 12; y++) for (let x = 5; x <= 7; x++) pisos.add(x + ',' + y);
  for (let y = 10; y <= 15; y++) for (let x = 8; x <= 15; x++) pisos.add(x + ',' + y);
  for (let n = 5; n <= 15; n++) par('x', 10, n, 'high');
  for (let n = 5; n <= 7; n++) par('x', 13, n, 'high');
  for (let n = 8; n <= 15; n++) par('x', 16, n, 'high');
  for (let n = 10; n <= 12; n++) par('y', 5, n, 'high');
  par('y', 8, 10, 'high'); par('y', 8, 11, 'door'); par('y', 8, 12, 'high'); for (let n = 13; n <= 15; n++) par('y', 8, n, 'high');
  for (let n = 10; n <= 15; n++) par('y', 16, n, n === 13 ? 'door' : 'high');
  reserva(5, 10, 16, 15);
  // casas de fundo (só cenário, sem nada dentro)
  const casa = (x0, y0, w, h, lado, n, cam) => {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) pisos.add(x + ',' + y);
    for (let i = 0; i < w; i++) { par('x', y0, x0 + i, 'high'); par('x', y0 + h, x0 + i, 'high'); } for (let j = 0; j < h; j++) { par('y', x0, y0 + j, 'high'); par('y', x0 + w, y0 + j, 'high'); }
    if (lado === 'W') par('y', x0, n, 'door'); else par('y', x0 + w, n, 'door'); reserva(x0, y0, x0 + w - 1, y0 + h - 1); reta(...cam);
  };
  casa(23, 6, 4, 4, 'W', 8, [20, 8, 22, 8]);
  casa(23, 15, 4, 5, 'W', 17, [20, 17, 22, 17]);
  casa(23, 23, 4, 4, 'W', 25, [20, 25, 22, 25]);
  casa(9, 19, 5, 4, 'E', 21, [14, 21, 17, 21]);
  casa(9, 3, 4, 4, 'E', 5, [13, 5, 17, 5]);
  reserva(19, 3, 22, 6); reserva(16, 16, 18, 19);
  paredes = [...pw.values()]; recalcParedes();
  // árvores e enfeites
  const arv = [], pesos = []; for (const k of Object.keys(OBJS)) { if (OBJS[k].deco) continue; if (/^(arvore\d|n_arvore_)/.test(k)) { arv.push(k); pesos.push(3); } else if (/^n_(arbusto|samambaia|toco)/.test(k)) { arv.push(k); pesos.push(1); } }
  const soma = pesos.reduce((a, b) => a + b, 0), sorteia = () => { let r = rnd() * soma; for (let i = 0; i < arv.length; i++) { r -= pesos[i]; if (r <= 0) return arv[i]; } return arv[0]; };
  const enf = ['d_grama_alta_1', 'd_grama_alta_2', 'd_grama_media_1', 'd_grama_media_2', 'd_pedra_pequena', 'd_folha_1', 'd_folhas_monte', 'd_galho'].filter(k => OBJS[k]), ocup = new Set();
  for (let y = 0; y < M; y++) for (let x = 0; x < M; x++) { if (!livre[y][x] || !longe[y][x] || MAP[y][x] !== 'grama_baixa') continue; const borda = x < 2 || y < 2 || x >= M - 2 || y >= M - 2; if (rnd() < (borda ? .45 : .03)) { objetos.push({ x, y, id: sorteia() }); ocup.add(x + ',' + y); } }
  for (let y = 0; y < M; y++) for (let x = 0; x < M; x++) { if (!livre[y][x] || ocup.has(x + ',' + y) || MAP[y][x] !== 'grama_baixa') continue; if (rnd() < .16 && enf.length) objetos.push({ x: Math.round((x + .15 + rnd() * .7) * 100) / 100, y: Math.round((y + .15 + rnd() * .7) * 100) / 100, id: enf[Math.floor(rnd() * enf.length)], f: 1 }); }
  SPAWN = { x: 7.0, y: 11.55 };
  montaMoveis(); TERR.render();
}
const tadeuPerto = () => Math.hypot(hx - 15.6, hy - 14.7) < 2.4;
// ---- ritmo da cena ----
let encDentro = false;
function cenaTick(dt) {
  if (!D.ativo && !J.morto) J.t += dt / 6 * MULT;
  if (D.ativo && D.n < D.txt.length) { D.n = Math.min(D.txt.length, D.n + dt * 70); mostraDlg(); }
  if (D.ativo) return;
  if (J.t >= PRAZO && !J.f.prazo) { J.f.prazo = 1; prazoFinal(); return; }
  if (!J.f.viuTadeu && Math.hypot(hx - 15.6, hy - 14.7) < 2.8) { J.f.viuTadeu = 1; dlgSeq([['', 'Tadeu está encostado na bancada perto do portão, limpando a graxa das mãos enquanto o dia começa a clarear.']], falaTadeu); return; }
  if (!J.f.rua && hx > 16.6) { J.f.rua = 1; dlgSeq([['', 'Você cruza o portão lateral e pisa na rua úmida da cidade baixa. O movimento da manhã começa a ganhar forma, os cabos cruzam o alto e, ao longe, os prédios corporativos observam.']]); return; }
  const dv = Math.hypot(hx - 20.8, hy - 4.6); if (dv > 4.4) encDentro = false;
  if (guardado() && !encDentro && dv < 3.3) { encDentro = true; encontro(); }
}
function prazoFinal() {
  if (J.divida <= 0) return dlgSeq([['', 'Sexta, 18h. O dono do galpão passa, pega o dinheiro e vai embora sem dizer uma palavra. Dessa vez o Tadeu não precisa cobrir nada.']]);
  const falta = J.divida; J.divida = Math.ceil(falta * 1.1 / 5) * 5; J.f.seco = 1; desenhaHud(true);
  dlgSeq([['', 'Sexta, 18h. O dono do galpão aparece pra cobrar. Faltaram R$ ' + falta + ', e o Tadeu cobriu a diferença tirando do dinheiro das peças.'], ['Tadeu', 'Eu segurei a barra por você. O que faltou agora é dívida sua comigo, com acréscimo: R$ ' + J.divida + '. E os adiantamentos acabaram até você mostrar serviço.']]);
}
function iniciaCena() { if (!J.f.intro) { J.f.intro = 1; dlgSeq([['', 'Cidade baixa. Madrugada.'], ['', 'O último trabalho não pagou. O bolso está vazio e o seu nome anda apertado na vizinhança.'], ['', 'Antes de sair, vale olhar o quarto.']]); } }
if (new URLSearchParams(location.search).has('bairro')) { SPAWN = { x: 11.5, y: 21.5 }; geraBairro(); } else geraCena01();
