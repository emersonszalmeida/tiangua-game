// Gera mundo.html (o JOGO) a partir de mundo_base.html (feito por faz_mundo.mjs): personagem vindo das folhas de sprites do modelo 3D (personagem_sheet.js), luta (luta.js) e carro (carro.js).
// Uso: node faz_mundo.mjs  (gera mundo_base.html e chama este script). Antes: folhas em animacao3d/sprites/*.png (sprites_gera.html) e carros/sprites/*.png.
import fs from 'node:fs';
let s = fs.readFileSync('mundo_base.html', 'utf8').replace(/\r\n/g, '\n');
const ERR = m => { console.log('NÃO ACHOU: ' + m); process.exit(1); };
const de = '<script src="sprites7.js"></script><script src="idles.js"></script><script src="personagem.js"></script>';
if (!s.includes(de)) ERR('os scripts do personagem');
s = s.replace(de, '<script src="animacao3d/sprites_manifest.js"></script><script src="sprites_jogo.js"></script><script src="personagem_sheet.js"></script>');
const gancho = 'lista.push(...itensCena(now));';
if (!s.includes(gancho)) ERR('o ponto de desenho');
const mov = 'PERS.step(P, dx, dy, run, now);';
if (!s.includes(mov) || !s.includes('const dx = (keys.KeyD')) ERR('o movimento');
s = s.replace('const dx = (keys.KeyD', 'let dx = (keys.KeyD').replace(mov, 'if (PERS.preso(P, now)) { dx = 0; dy = 0; run = false; } ' + mov);   // parado enquanto soca / dentro do carro
s = s.replace(gancho, gancho + ' lista.push(...LUTA.itens(now)); lista.push(...CARROT.itens(now));');
// a pé não atravessa o carro estacionado
const liv = '!objetos.some(o => bateArv(o, x, y)) && !bateParede(x, y); if (livre(nx, ny))';
if (!s.includes(liv)) ERR('colisão do movimento');
s = s.replace(liv, '!objetos.some(o => bateArv(o, x, y)) && !bateParede(x, y) && !CARROT.bate(x, y); if (livre(nx, ny))');
// E: dentro do carro / perto do carro (se não há outra coisa para pegar ou falar)
const inter = 'function interagir() { if (D.ativo) { avanca(); return; } if (J.morto) return; if (itemPerto()) { pegar(); return; } const a = interPerto(); if (a) a.f(); }';
if (!s.includes(inter)) ERR('interagir');
s = s.replace(inter, 'function interagir() { if (D.ativo) { avanca(); return; } if (J.morto) return; if (CARROT.ocupado()) { CARROT.interage(); return; } if (itemPerto()) { pegar(); return; } const a = interPerto(); if (a) a.f(); else CARROT.interage(); }');
const rot = "rot = p ? 'Pegar ' + ITENS[p.t].nome : ia ? ia.rot : ''";
if (!s.includes(rot)) ERR('rótulo da dica');
s = s.replace(rot, "rot = typeof CARROT !== 'undefined' && CARROT.ocupado() ? CARROT.rotulo() : p ? 'Pegar ' + ITENS[p.t].nome : ia ? ia.rot : typeof CARROT !== 'undefined' ? CARROT.rotulo() : ''");
// os scripts luta.js e carro.js carregam depois do principal: o 1º quadro espera por eles
if (!s.includes('function frame(now) {')) ERR('frame');
s = s.replace('function frame(now) {', "function frame(now) { if (typeof CARROT === 'undefined' || typeof LUTA === 'undefined') { requestAnimationFrame(frame); return; }");
// jogo novo: tira lutadores e carro (as cenas recriam)
const novo = 'function novoJogo() {';
if (!s.includes(novo)) ERR('novoJogo');
s = s.replace(novo, "function novoJogo() { if (typeof LUTA !== 'undefined') { LUTA.limpa(); CARROT.reinicia(); PERS.revive(P); P.combT0 = 0; }");
s = s.replace('</script></body></html>', "</script><script src=\"luta.js\"></script><script src=\"carro.js\"></script><script>addEventListener('keydown', e => { if (e.code === 'KeyQ' && !e.repeat) LUTA.soco(performance.now()); });</script></body></html>");
if (!s.includes('luta.js')) ERR('fim do arquivo');
// as folhas vão embutidas (data:) para o navegador não marcar o canvas do jogo como "contaminado" quando o arquivo é aberto direto do disco
const B = {};
for (const n of ['parado', 'andar', 'correr', 'dano', 'jab', 'morrer', 'luta']) B[n] = 'data:image/png;base64,' + fs.readFileSync('animacao3d/sprites/' + n + '.png').toString('base64');
const IMG64 = f => 'data:image/png;base64,' + fs.readFileSync('carros/sprites/' + f + '.png').toString('base64'), META = f => JSON.parse(fs.readFileSync('carros/sprites/' + f + '.json', 'utf8'));
const NOMES = { parado: 'NormalCar1', entrar: 'NormalCar1_entrar', sair: 'NormalCar1_sair', dirigir: 'NormalCar1_dirigir', entrarP: 'NormalCar1_entrarP', sairP: 'NormalCar1_sairP', dirigirP: 'NormalCar1_dirigirP' };
const CB = {}, CM = {}; for (const [k, f] of Object.entries(NOMES)) { CB[k] = IMG64(f); CM[k] = META(f); }
fs.writeFileSync('sprites_jogo.js', '// GERADO por faz_mundo_sprites.mjs: folhas de sprites embutidas\nconst SPRITES_B64 = ' + JSON.stringify(B) + ';\nconst CARRO_B64 = ' + JSON.stringify(CB) + ';\nconst CARRO_META = ' + JSON.stringify(CM) + ';\n');
fs.writeFileSync('mundo.html', s.replace(/\n/g, '\r\n'));
console.log('mundo.html e sprites_jogo.js escritos');
