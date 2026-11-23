// Gera mundo.html a partir de chao.html (motor da cabana) + mundo_bloco.js (sobrevivência). Uso: node faz_mundo.mjs
// Depois de mexer em chao.html (paredes/portas), rode de novo para o mundo receber a correção.
import fs from 'node:fs';
let s = fs.readFileSync('chao.html', 'utf8').replace(/\r\n/g, '\n');
const bloco = ['mundo_bloco.js', 'mundo_cena.js'].map(a => fs.readFileSync(a, 'utf8').replace(/\r\n/g, '\n')).join('\n');
let falhou = 0;
const troca = (de, para, tudo) => { if (!s.includes(de)) { console.log('NÃO ACHOU:', de.slice(0, 70)); falhou++; return; } s = tudo ? s.split(de).join(para) : s.replace(de, () => para); };
troca('<title>Editor da cabana</title>', '<title>Mundo</title>');
troca('#ui{position:fixed;left:10px;top:8px;', '#ui{position:fixed;right:10px;top:8px;');
troca('</style>', `
#hud{position:fixed;left:10px;top:8px;width:210px;background:rgba(20,16,12,.78);padding:8px 10px;border-radius:6px;user-select:none}
.barra{display:grid;grid-template-columns:44px 1fr 28px;align-items:center;gap:6px;margin:4px 0;font-size:12px}
.barra .tr{height:10px;background:#000a;border-radius:2px;overflow:hidden;border:1px solid #0008}
.barra i{display:block;height:100%}
#r_vida i{background:#d9483a}
.barra.baixo .tr{animation:pisca .8s infinite}
@keyframes pisca{50%{box-shadow:0 0 0 2px #ff3b3b}}
.barra span.v{text-align:right;color:#ddd}
#inv{position:fixed;left:50%;bottom:12px;transform:translateX(-50%);display:flex;gap:6px;background:rgba(20,16,12,.78);padding:6px;border-radius:8px}
.slot{width:54px;height:54px;border:2px solid #5a4630;border-radius:5px;background:#2b2118;position:relative;display:flex;align-items:center;justify-content:center;cursor:pointer}
.slot.cheio:hover{border-color:#ffd76a}
.slot img{image-rendering:pixelated}
.slot .n{position:absolute;left:3px;top:1px;font-size:10px;color:#9a8a76}
.slot .q{position:absolute;right:3px;bottom:1px;font-size:12px;color:#fff;font-weight:700;text-shadow:0 1px 2px #000}
#dica{position:fixed;left:50%;bottom:86px;transform:translateX(-50%);background:rgba(20,16,12,.85);color:#ffd76a;padding:6px 14px;border-radius:6px;font-size:14px}
#aviso{position:fixed;left:50%;top:70px;transform:translateX(-50%);background:rgba(20,16,12,.85);padding:6px 14px;border-radius:6px;opacity:0;transition:opacity .3s;font-size:14px}
#morte{position:fixed;inset:0;background:rgba(40,0,0,.7);display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:30px;gap:12px}
#morte small{font-size:16px;color:#ddd}
#grana{margin-top:6px;font-size:13px;color:#ffd76a}#obj{margin-top:4px;font-size:11px;color:#bbb;line-height:1.35}
#dlg{position:fixed;left:50%;bottom:92px;transform:translateX(-50%);width:min(760px,94%);background:rgba(16,12,10,.93);border:2px solid #5a4630;border-radius:8px;padding:12px 16px;font-size:16px;line-height:1.5;z-index:5}
#dq{color:#ffd76a;font-weight:700;margin-bottom:4px}#dt.narra{color:#d8d2c4;font-style:italic}
#dops{display:flex;flex-direction:column;gap:6px;margin-top:10px}#dops button{text-align:left;background:#3a3028;color:#eee;border:1px solid #5a4630;border-radius:5px;padding:7px 10px;font:15px system-ui;cursor:pointer}#dops button:hover:not(:disabled){background:#5a4630}#dops button:disabled{opacity:.4;cursor:default}
#dc{margin-top:8px;text-align:right;font-size:12px;color:#9a8a76;cursor:pointer}
#novo{margin-top:6px;width:100%;background:#3a3028;color:#ccc;border:1px solid #5a4630;border-radius:4px;padding:3px;cursor:pointer;font:11px system-ui}
</style>`);
troca('<div id="ui"></div>', `<div id="ui"></div>
<div id="hud">
<div class="barra" id="r_vida"><b>Vida</b><div class="tr"><i id="b_vida"></i></div><span class="v" id="t_vida"></span></div>
<div id="hora" style="margin-top:6px;font-size:13px;color:#ddd"></div><div id="grana"></div><div id="obj"></div>
<button id="novo">Novo jogo</button>
</div>
<div id="dlg" style="display:none"><div id="dq"></div><div id="dt"></div><div id="dops"></div><div id="dc">E · continuar</div></div>
<div id="inv"></div><div id="dica" style="display:none"></div><div id="aviso"></div>
<div id="morte" style="display:none">Você morreu<small>aperte R para recomeçar</small></div>`);
troca('const M = 24, NOMES', 'const M = 32, NOMES');
troca("function autosave() { try { localStorage.setItem('cabana_mapa_v2', JSON.stringify(paraJson())); } catch (e) { } }", 'function autosave() { }');
s = s.replace(/^if \(!new URLSearchParams\(location\.search\)\.has\('novo'\)\) try \{ const salvo = localStorage\.getItem\('cabana_mapa_v2'\);.*$/m, '');
troca('editar = true, hsx', 'editar = false, hsx');
troca("ui.innerHTML = 'WASD / setas: andar · Shift: correr · roda: zoom · T: grade · E: mostra/esconde o editor';", "ui.innerHTML = 'WASD / setas: andar · Shift: correr · E: pegar · 1-8: usar item · roda: zoom';");
troca("if (e.code === 'KeyE') { editar = !editar; atualizaUi(); } const n = +e.key; if (n >= 1 && n <= VISIVEIS.length) { ferr = { t: 'chao', id: VISIVEIS[n - 1] }; atualizaUi(); }", "if (e.code === 'KeyE') interagir(); if ((e.code === 'Space' || e.code === 'Enter') && D.ativo) { e.preventDefault(); avanca(); } if (e.code === 'KeyR' && J.morto) novoJogo(); { const n = +e.key; if (n >= 1 && n <= SLOTS) { if (D.ativo) escolhe(n - 1); else usa(n - 1); } }");
troca("const P = PERS.create('NE'); let hx = M / 2 + .5, hy = M / 2 + .5, last = performance.now();", bloco + "\nconst P = PERS.create('NE'); let hx = SPAWN.x, hy = SPAWN.y, last = performance.now();\ncarrega(); iniciaCena(); document.getElementById('novo').onclick = () => { if (confirm('Começar um jogo novo? O progresso atual será apagado.')) novoJogo(); }; desenhaHud(true);");
troca('const bateParede = (x, y) => rectsP.some(([a, b, c, d]) => x + RP > a && x - RP < c && y + RP > b && y - RP < d);', 'const bateParede = (x, y) => rectsP.some(([a, b, c, d]) => x + RP > a && x - RP < c && y + RP > b && y - RP < d) || bateMovel(x, y);');
troca('ctx.restore(); requestAnimationFrame(frame);', 'ctx.restore(); ambiente(now); requestAnimationFrame(frame);');
troca('const dt = Math.min(.05, (now - last) / 1000); last = now;', 'const dt = Math.min(.05, (now - last) / 1000); last = now; jogoTick(dt);');
troca("const casa = itensCasa(); lista.push({ d: hx + hy, jog: true,", "const casa = itensCasa(); for (const it of ITENS_MUNDO) if (!J.pegos[it.id]) lista.push({ d: it.x + it.y, f: () => desenhaItem(it, now) }); lista.push(...itensCena(now)); lista.push({ d: hx + hy, jog: true,");
if (falhou) { console.log(falhou + ' trocas falharam; mundo.html NÃO escrito'); process.exit(1); }
fs.writeFileSync('mundo.html', s.replace(/\n/g, '\r\n'));
console.log('mundo.html escrito', s.length, 'bytes');
