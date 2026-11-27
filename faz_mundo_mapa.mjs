// Gera mundo_mapa.html a partir de mundo.html: o chão vira o MAPA GRANDE (ruas com asfalto, BR) e o cenário antigo fica reduzido à oficina + quarto dos fundos.
// Uso: node faz_mundo_mapa.mjs   (rode depois de node faz_mundo.mjs)
import fs from 'node:fs';
let s = fs.readFileSync('mundo.html', 'utf8').replace(/\r\n/g, '\n'), falhou = 0;
const troca = (de, para) => { if (!s.includes(de)) { console.log('NÃO ACHOU:', de.slice(0, 80)); falhou++; return; } s = s.replace(de, () => para); };
const corta = (ini, fim, por = '') => { const a = s.indexOf(ini), b = s.indexOf(fim, a + 1); if (a < 0 || b < 0) { console.log('NÃO ACHOU corte:', ini.slice(0, 60)); falhou++; return; } s = s.slice(0, a) + por + s.slice(b); };
troca('<title>Mundo</title>', '<title>Mundo — mapa grande</title>');
troca('<script', '<script src="tiangua_mapa/ruas_mapa.js"></script><script src="tiangua_mapa/asfalto_tex.js"></script><script src="tiangua_mapa/mapa_chao.js"></script><script src="mundo_mapa_terreno.js"></script>\n<script');
troca('<script src="terreno_motor.js"></script>', '<script src="terreno_motor_mapa.js"></script>');
// motor de terreno: lê o tipo da célula de KIND_FN (mundo inteiro) e ganha drawView (desenha só as células visíveis)
{ let t = fs.readFileSync('terreno_motor.js', 'utf8').replace(/\r\n/g, '\n');
  const ant = 'const kindOf = (cx, cy) => { if (cx < 0'; if (!t.includes(ant)) { console.log('NÃO ACHOU kindOf'); falhou++; }
  t = t.replace(ant, 'const kindOf = (cx, cy) => { if (window.KIND_FN) return window.KIND_FN(cx, cy); if (cx < 0');
  const fim = t.lastIndexOf('})();'); if (fim < 0) { console.log('NÃO ACHOU fim do motor'); falhou++; }
  t = t.slice(0, fim) + `  TERR.drawView = function (c, cx0, cx1, cy0, cy1, tela) {   // desenha as células [cx0..cx1] × [cy0..cy1] (mundo sem limite)
    if (!TERR.ready) return; const cells = []; for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) { if (tela) { const px = M * 64 + (cx - cy) * 64 - 64, py = (cx + cy) * 32; if (px + 128 < tela.x0 || px > tela.x1 || py + 64 < tela.y0 || py > tela.y1) continue; } cells.push([cx, cy]); }
    cells.sort((p, q) => (p[0] + p[1]) - (q[0] + q[1])); if (PIECES.size > 3000) PIECES.clear();
    const at = (cx, cy) => [M * 64 + (cx - cy) * 64 - 64, (cx + cy) * 32], mod3 = n => ((n % 3) + 3) % 3;
    for (const [cx, cy] of cells) { const [x, y] = at(cx, cy); c.drawImage(IMGT[mod3(cx) + ',' + mod3(-cy)], x, y); }
    for (const [cx, cy] of cells) { const p = pieceCanvas(cx, cy, kindOf(cx, cy)); if (p) { const [x, y] = at(cx, cy); c.drawImage(p, x, y); } }
  };
` + t.slice(fim);
  fs.writeFileSync('terreno_motor_mapa.js', t); }
// chão: o mapa grande no lugar do terreno de blocos. O bloco de tiles (10,5; 13) = centro da planta da oficina+quarto fica no ponto (X0, Z0) do mapa (o círculo do dono).
troca('if (TERR.cv) ctx.drawImage(TERR.cv, 0, 0);', `{ const X0 = -391.8, Z0 = 196.8, PM = MAPACHAO.PPM, sx0 = (10.5 - 13) * 64 + M * 64, sy0 = (10.5 + 13) * 32;
    const R = MT.visiveis(hsx, hsy, cv.width, cv.height, K); TERR.drawView(ctx, R.cx0, R.cx1, R.cy0, R.cy1, R.tela); objetos = MT.objetos(R);   // grama, terra, árvores e enfeites das células visíveis
    ctx.save(); ctx.translate(sx0 - X0 * PM, sy0 - Z0 * PM / 2); ctx.scale(PM, PM / 2);
    const cxm = X0 + (hsx - sx0) / PM, czm = Z0 + (hsy - sy0) / (PM / 2), hw = cv.width / 2 / K / PM + 20, hh = cv.height / 2 / K / (PM / 2) + 20;
    MAPACHAO.desenha(ctx, cxm - hw, cxm + hw, czm - hh, czm + hh); ctx.restore(); }`);
// anda pelo mapa inteiro (sem a borda do bloco 64x64)
{ const a = s.indexOf('x > .3 && y > .3 && x < M - .3 && y < M - .3 && '); if (a < 0) { console.log('NÃO ACHOU limites'); falhou++; } else s = s.replace('x > .3 && y > .3 && x < M - .3 && y < M - .3 && ', ''); }
// carro de dirigir: o do jogo (carro.js) sem a borda do bloco, mais lento fora do asfalto; sempre liberado e estacionado na rua em frente ao portão
{ let t = fs.readFileSync('carro.js', 'utf8').split('\r\n').join('\n'); const tr = (de, para) => { if (!t.includes(de)) { console.log('NÃO ACHOU em carro.js:', de.slice(0, 60)); falhou++; return; } t = t.replace(de, () => para); };
  tr('x > .3 && y > .3 && x < M - .3 && y < M - .3 && ', '');
  tr('function dirige(dt) {', "const vmaxAqui = () => (typeof MT !== 'undefined' ? MT.noAsfaltoCasas(c.x, c.y) : true) ? VMAX : 6;   // fora do asfalto: 6 m/s\n  function dirige(dt) {");
  tr('Math.min(VMAX, Math.max(0, c.v) + ACEL_M * dt)', 'Math.min(vmaxAqui(), Math.max(0, c.v) + ACEL_M * dt)');
  tr('    const a = ANG[c.dir] * Math.PI / 180, m = c.v * dt, [ox, oy]', '    if (c.v > vmaxAqui()) c.v = Math.max(vmaxAqui(), c.v - 8 * dt);\n    const a = ANG[c.dir] * Math.PI / 180, m = c.v * dt, [ox, oy]');
  fs.writeFileSync('carro_mapa.js', t); }
troca('<script src="carro.js"></script>', '<script src="carro_mapa.js"></script>');
troca('<script src="mundo_mapa_terreno.js"></script>', '<script src="mundo_mapa_terreno.js"></script><script src="mundo_mapa_carros.js"></script>');
troca("SAVE_KEY = 'mundo_v2'", "SAVE_KEY = 'mundo_mapa_v1'");   // não mistura o progresso com o do mundo.html
troca('const p = J.f.cp || [19.0, 16.4, 0]; CARROT.poeEm(p[0], p[1], p[2]); CARROT.disponivel = !!J.f.carro && !J.f.carroOk;', 'const p = J.f.cp || MT.vaga(); CARROT.poeEm(p[0], p[1], p[2]); CARROT.disponivel = true;');
// carro vermelho dentro da oficina, no lugar da caixa antiga
corta('  const rodas = (dx, dy)', '  const cx1 = movel(', `  const carro = { x: 10.65, y: 12.15, w: .9, d: 1.9, bloq: true, npc: true, carro: true, dir: 14, get dd() { return this.x + this.y + (this.w + this.d) / 2 + .15; }, desenha: now => CARRO_VERM.desenha(ctx, carro.x + carro.w / 2, carro.y + carro.d / 2, carro.dir) }; MOVEIS.push(carro);   // carro de cliente (vermelho), virado ao longo da oficina
  liga(carro, 11.1, 13.1, 2.4, 'Olhar o carro', texto('Um carro de cliente, parado há semanas esperando uma peça que nunca chega. A lataria está fria.'));
`);
troca('out.push({ d: m.x + m.y + m.w, f: () => m.desenha(now) })', 'out.push({ d: m.dd !== undefined ? m.dd : m.x + m.y + m.w, f: () => m.desenha(now) })');
// cena: só quarto + oficina
troca('<script src="mundo_mapa_carros.js"></script>', '<script src="mundo_mapa_carros.js"></script><script src="casa_layout.js"></script><script src="mundo_mapa_editor.js"></script>');
if (!fs.existsSync('casa_layout.js')) fs.writeFileSync('casa_layout.js', '// Posições dos móveis e personagens (gerado pelo editor da casa: F2 em mundo_mapa.html). Vazio = posições originais.\nconst CASA_LAYOUT = null;\n');
troca('function autosave() { }', 'function autosave() { if (typeof CASA_EDIT !== "undefined") CASA_EDIT.salvaCasa(); }');   // as ferramentas de parede/piso do chao.html chamam autosave()
troca("if (!pisos.has(c0x + ',' + c0y)) return null;", "if (!pisos.has(c0x + ',' + c0y)) return null; const DEN = window.DENTRO && window.DENTRO.size ? window.DENTRO : null; if (DEN && !DEN.has(c0x + ',' + c0y)) return null;");   // piso de dentro marcado no editor: só nele as paredes de frente baixam, mesmo com a sala aberta
troca("if (!pisos.has(k)) { aberta = true; continue; }", "if (!pisos.has(k) || (DEN && !DEN.has(k))) { if (!DEN) aberta = true; continue; }");
troca('const liga = (m, x, y, r, rot, f, ativo) => INTER.push({ x, y, r, rot, f, ativo });', 'const liga = (m, x, y, r, rot, f, ativo) => INTER.push({ x, y, r, rot, f, ativo, m });');
troca("desenhaNpc('tadeu', 15.6, 14.7,", "desenhaNpc('tadeu', tad.x + .25, tad.y + .25,");
troca('MOVEIS.push(tad);', 'MOVEIS.push(tad); TAD = tad;');
troca('const tadeuPerto = () => Math.hypot(hx - 15.6, hy - 14.7) < 2.4;', 'const tadeuPerto = () => Math.hypot(hx - (TAD.x + .25), hy - (TAD.y + .25)) < 2.4;');
troca('Math.hypot(hx - 15.6, hy - 14.7) < 2.8', 'Math.hypot(hx - (TAD.x + .25), hy - (TAD.y + .25)) < 2.8');
troca('function cenaTick(dt) {\n  carroTick();', 'function cenaTick(dt) {\n  carroTick(); if (window.EDITA) return;   // editor da casa aberto: o tempo e a história param');
troca('function interagir() { ', 'function interagir() { if (window.EDITA) return; ');
troca('  return out;\n}\n// ---- atmosfera', '  if (window.EDITA) out.push(...CASA_EDIT.overlay());\n  return out;\n}\n// ---- atmosfera');
corta('  for (const L of LUZES) out.push({ d: L.x + L.y + .3', '  if (window.EDITA) out.push(...CASA_EDIT.overlay());', '');   // a lâmpada não aparece no jogo, só o efeito de luz
troca('out.push({ d: dMovel(m), f: () => desenhaMovel(m) })', 'out.push({ d: ajustaMuro(m, dMovel(m)), f: () => desenhaMovel(m) })');
troca('out.push({ d: m.dd !== undefined ? m.dd : m.x + m.y + m.w, f: () => m.desenha(now) })', 'out.push({ d: ajustaMuro(m, m.dd !== undefined ? m.dd : m.x + m.y + m.w), f: () => m.desenha(now) })');
troca("ctx.fillStyle = g; ctx.fillRect(px - r, py - r, 2 * r, 2 * r); }", "LUZ_PINTA(L, g, px - r, py - r, 2 * r, W, H); }");
troca('(hx > 16.4 ? 1 : .55)', '(foraDeCasa() ? 1 : .55)');
troca("  const Hh = w => w.p.k === 'door'", "  window.ALT_PAREDE = new Map(inf.map(w => [w.p.a + '|' + w.p.c + '|' + w.p.n, w.p.k === 'low' ? 12 : w.corta ? 27 : 93]));   // altura de cada parede neste quadro (o brilho da luz usa)\n  const Hh = w => w.p.k === 'door'");
troca('function geraCena01() {', `var TAD = { x: 15.35, y: 14.45 };
function geraCena01() {
  for (let y = 0; y < M; y++) for (let x = 0; x < M; x++) MAP[y][x] = 'grama_baixa';
  objetos = []; paredes = []; pisos = new Set(); ITENS_MUNDO = [];
  const pw = new Map(), par = (a, c, n, k) => pw.set(a + '|' + c + '|' + n, { a, c, n, k });
  for (let y = 10; y <= 12; y++) for (let x = 5; x <= 7; x++) pisos.add(x + ',' + y);          // quarto (x 5..7, y 10..12)
  for (let y = 10; y <= 15; y++) for (let x = 8; x <= 15; x++) pisos.add(x + ',' + y);         // oficina (x 8..15, y 10..15)
  for (let n = 5; n <= 15; n++) par('x', 10, n, 'high');
  for (let n = 5; n <= 7; n++) par('x', 13, n, 'high');
  for (let n = 8; n <= 15; n++) par('x', 16, n, 'high');
  for (let n = 10; n <= 12; n++) par('y', 5, n, 'high');
  par('y', 8, 10, 'high'); par('y', 8, 11, 'door'); par('y', 8, 12, 'high'); for (let n = 13; n <= 15; n++) par('y', 8, n, 'high');
  for (let n = 10; n <= 15; n++) par('y', 16, n, n === 13 ? 'door' : 'high');                  // portão leste (y = 13)
  paredes = [...pw.values()]; CASA_EDIT.carregaCasa(); recalcParedes();   // carregaCasa: se o dono refez a casa no editor (F2), usa a planta dele
  SPAWN = { x: 7.0, y: 11.55 };
  montaMoveis(); CASA_EDIT.aplica(); SPAWN = CASA_EDIT.nascer(SPAWN); TERR.render();
}
function geraCena01Velha() {`);
corta('  // rua: ponto do Seu Valdir, guilda e mural', '}\nfunction itensCena(now) {', '');
troca('  out.push(...patioDesenha(now));\n', '');
corta('  patioTick(dt);', 'function prazoFinal()', '}\n');
if (falhou) { console.log(falhou + ' trocas falharam; mundo_mapa.html NÃO escrito'); process.exit(1); }
fs.writeFileSync('mundo_mapa.html', s.replace(/\n/g, '\r\n'));
console.log('mundo_mapa.html escrito', s.length, 'bytes');
