// Teste do editor-pixel (seleção de pixels com marcar, clonar, espelhar, somar e colar) com mouse/teclado reais simulados no Edge headless.
// uso: node testa_editor_pixel.mjs [caminho do index.html]
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const arq = path.resolve(process.argv[2] || 'C:/Users/emerson.souza.DIAMANTES/editor-pixel/index.html'), W = 1200, H = 800;
const edge = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(p => fs.existsSync(p));
const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-')), port = 9300 + Math.floor(Math.random() * 500);
const proc = spawn(edge, ['--headless=new', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, `--window-size=${W},${H}`, 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms)); let done = false;
const bye = () => { if (done) return; done = true; try { spawnSync('taskkill', ['/PID', String(proc.pid), '/T', '/F'], { stdio: 'ignore' }); } catch { } try { proc.kill(); } catch { }
  try { spawnSync('powershell', ['-NoProfile', '-Command', "Get-CimInstance Win32_Process -Filter \"Name='msedge.exe'\" | Where-Object { $_.CommandLine -like '*" + path.basename(prof) + "*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"], { stdio: 'ignore' }); } catch { } }; process.on('exit', bye);
let falhas = 0; const ok = (c, m) => { console.log((c ? '  OK   ' : '  FALHOU ') + m); if (!c) falhas++; };
try {
  let list; for (let i = 0; i < 60; i++) { try { list = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (list.find(t => t.type === 'page')) break; } catch { } await sleep(500); }
  const ws = new WebSocket(list.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  let id = 0; const pend = new Map(), erros = []; ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } else if (m.method === 'Runtime.exceptionThrown') erros.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text); };
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async js => { const r = await send('Runtime.evaluate', { expression: js, returnByValue: true }); if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text)); return r.result.result.value; };
  await send('Runtime.enable'); await send('Page.enable'); await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: pathToFileURL(arq).href + '?novo' }); await sleep(1500);
  await ev("novoDoc(64, 48); view.z = 8; view.ox = 20; view.oy = 20; redraw(); 1");
  // coordenada de tela do pixel (x,y)
  const pos = async (x, y) => ev(`(() => { const r = cv.getBoundingClientRect(); return [r.left + view.ox + (${x} + .5) * view.z, r.top + view.oy + (${y} + .5) * view.z]; })()`);
  const mouse = (type, [x, y], mod = 0, button = 'left') => send('Input.dispatchMouseEvent', { type, x, y, button, buttons: type === 'mouseReleased' || type === 'mouseMoved' ? 0 : (button === 'left' ? 1 : 2), clickCount: 1, modifiers: mod });
  const arrasta = async (a, b, mod = 0, button = 'left') => { const pa = await pos(...a), pb = await pos(...b); await mouse('mousePressed', pa, mod, button); const n = 6; for (let i = 1; i <= n; i++) await mouse('mouseMoved', [pa[0] + (pb[0] - pa[0]) * i / n, pa[1] + (pb[1] - pa[1]) * i / n], mod, button); await mouse('mouseReleased', pb, mod, button); await sleep(120); };
  const tecla = async (key, code, mod = 0) => { await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, modifiers: mod, text: mod ? '' : (key.length === 1 ? key : key === 'Enter' ? String.fromCharCode(13) : '') }); await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, modifiers: mod }); await sleep(80); };
  const conta = () => ev("(() => { const d = L().x.getImageData(0, 0, W, H).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) n++; return n; })()");
  const estado = () => ev("JSON.stringify(sel ? { bx: sel.bx, by: sel.by, bw: sel.bw, bh: sel.bh, ox: sel.ox, oy: sel.oy, px: (() => { const d = sel.c.getContext('2d').getImageData(0, 0, W, H).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) n++; return n; })() } : null)");
  // desenho de teste: um 'L' (3+3 pixels) em (5,5) e um quadradinho 2x2 em (20,5), um pixel solto em (30,30)
  await ev("(() => { const x = L().x; x.fillStyle = '#a33'; x.fillRect(5, 5, 1, 4); x.fillRect(5, 8, 4, 1); x.fillStyle = '#3a3'; x.fillRect(20, 5, 2, 2); x.fillStyle = '#33a'; x.fillRect(30, 30, 1, 1); redraw(); })()");
  const total0 = await conta(); console.log('pixels na camada:', total0);

  console.log('1) Marcar pixels (S): arrastar sobre o L e sobre o quadradinho');
  await tecla('s', 'KeyS'); ok(await ev("tool") === 'marcar', 'ferramenta Marcar ativa');
  await ev("$('tam').value = 3"); await arrasta([4, 6], [22, 6]); await ev("$('tam').value = 1");   // pincel de 3: faixa nas linhas 5 a 7, pega o L (3 pixels da perna) e o quadradinho (4)
  let e = JSON.parse(await estado()); console.log('   seleção:', JSON.stringify(e));
  ok(e && e.px === 7, 'a marcação pegou só os pixels que existem: 3 do L + 4 do quadradinho = ' + (e && e.px));
  await tecla('Escape', 'Escape'); ok(await conta() === total0, 'Esc solta de volta sem perder pixel (' + await conta() + ' = ' + total0 + ')');

  console.log('2) Selecionar (Q): clicar no L pega o grupo; Ctrl+D clona; mover; Enter solta');
  await tecla('q', 'KeyQ'); const pL = await pos(5, 6); await mouse('mousePressed', pL); await mouse('mouseReleased', pL); await sleep(100);
  e = JSON.parse(await estado()); ok(e && e.px === 7, 'grupo do L selecionado (7 pixels): ' + (e && e.px));
  await tecla('d', 'KeyD', 2); ok(await conta() === total0 - 7 + 7, 'Ctrl+D deixou uma cópia na camada (pixels da camada: ' + await conta() + ')');
  await arrasta([6, 7], [26, 17]); e = JSON.parse(await estado()); ok(e && e.ox === 20 && e.oy === 10, 'mover a seleção solta em (+20,+10): ' + (e && e.ox + ',' + e.oy));
  await tecla('Enter', 'Enter'); ok(await conta() === total0 + 7, 'depois de soltar há o L original e o clone: ' + await conta() + ' (esperado ' + (total0 + 7) + ')');

  console.log('3) Alt+arrastar clona');
  const t1 = await conta(); const pQ = await pos(20, 5); await mouse('mousePressed', pQ); await mouse('mouseReleased', pQ); await sleep(100);
  e = JSON.parse(await estado()); ok(e && e.px === 4, 'quadradinho selecionado (4 pixels): ' + (e && e.px));
  await arrasta([20, 5], [20, 20], 1); await tecla('Enter', 'Enter'); ok(await conta() === t1 + 4, 'Alt+arrastar deixou o original e criou o clone: ' + await conta() + ' (esperado ' + (t1 + 4) + ')');

  console.log('4) Espelhar (H) a seleção');
  const pL2 = await pos(5, 6); await mouse('mousePressed', pL2); await mouse('mouseReleased', pL2); await sleep(100);
  const antes = JSON.parse(await estado()); await tecla('h', 'KeyH'); const dep = JSON.parse(await estado());
  const sim = await ev("(() => { const d = sel.c.getContext('2d').getImageData(0, 0, W, H).data, A = (x, y) => d[(y * W + x) * 4 + 3] > 0; let r = []; for (let y = sel.by; y < sel.by + sel.bh; y++) { let s = ''; for (let x = sel.bx; x < sel.bx + sel.bw; x++) s += A(x, y) ? '#' : '.'; r.push(s); } return r.join('|'); })()");
  console.log('   depois de H:', sim); ok(sim === '...#|...#|...#|####' || sim === '...#|...#|...#|####'.replace(/\|/g, '|'), 'o L ficou espelhado (perna para o lado direito)');
  ok(antes.px === dep.px && antes.bx === dep.bx, 'mesmo número de pixels e mesma caixa'); await tecla('Escape', 'Escape');

  console.log('5) Shift soma outro grupo à seleção');
  const t2 = await conta(); const pa = await pos(8, 6); await mouse('mousePressed', pa); await mouse('mouseReleased', pa); await sleep(100);
  const pb = await pos(30, 30); await mouse('mousePressed', pb, 8); await mouse('mouseReleased', pb, 8); await sleep(100);
  e = JSON.parse(await estado()); ok(e && e.px === 7 + 1, 'seleção com o L e o pixel solto (8 pixels): ' + (e && e.px)); await tecla('Escape', 'Escape'); ok(await conta() === t2, 'soltar não perde pixels');

  console.log('6) Copiar e colar no cursor');
  const pc = await pos(8, 6); await mouse('mousePressed', pc); await mouse('mouseReleased', pc); await sleep(100); await tecla('c', 'KeyC', 2);
  const alvo = await pos(40, 20); await mouse('mouseMoved', alvo); await sleep(80); await ev("colaInterno(); 1"); e = JSON.parse(await estado());
  ok(e && e.bx === 40 && e.by === 20, 'a cópia entrou com o canto de cima à esquerda no mouse (40,20): ' + (e && e.bx + ',' + e.by)); await tecla('Enter', 'Enter');
  console.log('7) Botão direito durante o arrasto deixa uma cópia');
  await ev("(() => { const x = L().x; x.fillStyle = '#c0c'; x.fillRect(50, 40, 2, 2); redraw(); })()");
  const pq = await pos(50, 40); await mouse('mousePressed', pq); await mouse('mouseReleased', pq); await sleep(100);
  const base7 = await conta(); e = JSON.parse(await estado()); ok(e && e.px === 4, 'quadradinho novo selecionado (4 pixels)');
  const clicaDireito = async p => { await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p[0], y: p[1], button: 'right', buttons: 3, clickCount: 1 }); await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p[0], y: p[1], button: 'right', buttons: 1, clickCount: 1 }); await sleep(80); };
  const p0 = await pos(50, 40), p1 = await pos(53, 40), p2 = await pos(56, 40), p3 = await pos(59, 40);
  await mouse('mousePressed', p0); await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p1[0], y: p1[1], buttons: 1 }); await clicaDireito(p1);
  ok(await conta() === base7 + 4, 'primeiro clique direito deixou uma cópia (' + await conta() + ' = ' + (base7 + 4) + ')');
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p2[0], y: p2[1], buttons: 1 }); await clicaDireito(p2);
  ok(await conta() === base7 + 8, 'segundo clique direito deixou outra cópia (' + await conta() + ' = ' + (base7 + 8) + ')');
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p3[0], y: p3[1], buttons: 1 }); await mouse('mouseReleased', p3); await sleep(100); e = JSON.parse(await estado());
  ok(e && e.ox === 9, 'a seleção continuou com o mouse até o fim do arrasto (deslocamento +9): ' + (e && e.ox)); await tecla('Enter', 'Enter');
  ok(await conta() === base7 + 12, 'ao soltar: original, 2 cópias deixadas e a peça final = ' + await conta() + ' (esperado ' + (base7 + 12) + ')');
  console.log('8) Pintura feita sobre uma imagem anda junto com ela');
  await ev("(() => { const c = document.createElement('canvas'); c.width = 20; c.height = 20; c.getContext('2d').fillRect(0, 0, 20, 20); const id = ++idImg; IMG_REG[id] = { im: c, c }; const o = { id, nome: 'teste', t: 'imagem', im: c, c, x: 70, y: 60, w: 20, h: 20, m: [1, 0, 0, 1], crop: null, op: .5, acima: true, vis: true, z: ++zSeq }; imgs.push(o); selecionaRef(o); escolhe('lapis'); 1; })()");
  const q0 = await pos(75, 65), q1 = await pos(80, 65); await mouse('mousePressed', q0); await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: q1[0], y: q1[1], buttons: 1 }); await mouse('mouseReleased', q1); await sleep(100);
  e = JSON.parse(await ev("JSON.stringify({ n: L().objs.filter(o => o.t === 'traco' && o.pai).length, img: ref.id, pai: (L().objs.filter(o => o.t === 'traco').pop() || {}).pai })") || 'null');
  ok(e && e.n === 1 && e.pai === e.img, 'o traço pertence à imagem: ' + JSON.stringify(e));
  const x8 = JSON.parse(await ev("(() => { selObj = ref; aplicaMover({ k: 'omove', moveu: true, dx: 7, dy: 3 }); const t = L().objs.filter(o => o.t === 'traco').pop(); return JSON.stringify({ x: t.x, y: t.y, ix: ref.x }); })()"));
  ok(x8.x === 7 && x8.y === 3 && x8.ix === 77, 'mover a imagem levou a pintura junto: ' + JSON.stringify(x8));
  ok(erros.length === 0, 'nenhum erro de JavaScript na página' + (erros.length ? ': ' + erros[0] : ''));
  const shot = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(process.env.SHOT || path.join(os.tmpdir(), 'editor_teste.png'), Buffer.from(shot.result.data, 'base64'));
  console.log(falhas ? '\n' + falhas + ' FALHA(S)' : '\nTUDO OK');
  try { await send('Browser.close'); } catch { }
} finally { bye(); }
process.exit(falhas ? 1 : 0);
