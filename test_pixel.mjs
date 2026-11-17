// Teste do editor-pixel (seleção de pixels com marcar, clonar, espelhar, somar e colar) com mouse/teclado reais simulados no Edge headless.
// uso: node testa_editor_pixel.mjs [caminho do index.html]
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const arq = path.resolve(process.argv[2] || 'C:/Users/emerson.souza.DIAMANTES/tiangua-game/editor-pixel/index.html'), W = 1200, H = 800;
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
  await ev("novoDoc(64, 48); view.z = 6; view.ox = 20; view.oy = 20; redraw(); 1");
  // coordenada de tela do pixel (x,y)
  const pos = async (x, y) => ev(`(() => { const r = cv.getBoundingClientRect(); return [r.left + view.ox + (${x} + .5) * view.z, r.top + view.oy + (${y} + .5) * view.z]; })()`);
  const mouse = (type, [x, y], mod = 0, button = 'left') => send('Input.dispatchMouseEvent', { type, x, y, button, buttons: type === 'mouseReleased' || type === 'mouseMoved' ? 0 : (button === 'left' ? 1 : 2), clickCount: 1, modifiers: mod });
  const arrasta = async (a, b, mod = 0, button = 'left') => { const pa = await pos(...a), pb = await pos(...b); await mouse('mousePressed', pa, mod, button); const n = 6; for (let i = 1; i <= n; i++) await mouse('mouseMoved', [pa[0] + (pb[0] - pa[0]) * i / n, pa[1] + (pb[1] - pa[1]) * i / n], mod, button); await mouse('mouseReleased', pb, mod, button); await sleep(120); };
  const tecla = async (key, code, mod = 0) => { await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, modifiers: mod, text: mod ? '' : (key.length === 1 ? key : key === 'Enter' ? String.fromCharCode(13) : '') }); await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, modifiers: mod }); await sleep(80); };
  const alfas = () => ev("(() => { const o = L().objs[L().objs.length - 1]; const d = TRACOS[o.cid].getContext('2d').getImageData(0, 0, W, H).data, s = new Set(); for (let i = 3; i < d.length; i += 4) if (d[i]) s.add(d[i]); return JSON.stringify([...s]); })()");
  console.log('1) imagem recortada pela Forma na diagonal: sem pixels pela metade');
  await ev("(() => { const c = document.createElement('canvas'); c.width = 30; c.height = 30; const g = c.getContext('2d'); g.fillStyle = '#c33'; g.fillRect(0, 0, 30, 30); const id = ++idImg, o = { id, nome: 'teste', t: 'imagem', im: c, c, x: 10, y: 10, w: 30, h: 30, m: [1, 0, 0, 1], crop: null, op: 1, acima: true, vis: true, z: ++zSeq }; imgs.push(o); selecionaRef(o); redraw(); return 1; })()"); await sleep(300);
  ok(await ev("!!ref"), 'imagem carregada'); await ev("ref.op = 1; ref.x = 10; ref.y = 10; redraw(); 1");
  await tecla('F10', 'F10'); const nos = JSON.parse(await ev("JSON.stringify(nosRef().map(p => paraMundo(ref, p[0], p[1])))")); console.log('   cantos:', JSON.stringify(nos));
  await arrasta([Math.round(nos[1][0]), Math.round(nos[1][1])], [Math.round(nos[1][0]) - 9, Math.round(nos[1][1]) + 4]);   // arrasta o canto de cima-direita para dentro: borda diagonal
  console.log('   crop:', await ev("JSON.stringify(nosRef().map(p => paraMundo(ref, p[0], p[1])))"));
  await ev("converteImg(ref); 1"); const al = JSON.parse(await alfas()); console.log('   valores de alfa depois de unir em pixels:', JSON.stringify(al)); ok(al.length === 1 && al[0] === 255, 'só pixels inteiros (alfa 255), nada pela metade');
  console.log('2) esticar um traço: a caixa cai em pixels inteiros');
  await ev("selObj = null; L().objs.length = 0; L().x.clearRect(0, 0, W, H); L().x.fillStyle = '#964'; L().x.fillRect(10, 10, 7, 13); redraw(); 1");
  await tecla('q', 'KeyQ'); const p = await pos(12, 15); await mouse('mousePressed', p); await mouse('mouseReleased', p); await sleep(100); await tecla('t', 'KeyT');
  const al2 = JSON.parse(await ev("JSON.stringify(alcas(selObj).map(a => [a.dx, a.dy, a.sx, a.sy]))")), a = al2.find(q => q[0] === 1 && q[1] === 1), r = JSON.parse(await ev("(() => { const r = cv.getBoundingClientRect(); return JSON.stringify([r.left, r.top]); })()"));
  const A = [r[0] + a[2], r[1] + a[3]]; await mouse('mousePressed', A); for (let i = 1; i <= 7; i++) await mouse('mouseMoved', [A[0] + 13.7 * i, A[1] + 9.3 * i]); await mouse('mouseReleased', [A[0] + 13.7 * 7, A[1] + 9.3 * 7]); await sleep(150);
  const B = JSON.parse(await ev("JSON.stringify((() => { const b = caixa(selObj); return [b.l, b.t, b.r, b.b]; })())")); console.log('   caixa:', JSON.stringify(B)); ok(B.every(v => Math.abs(v - Math.round(v)) < 1e-6), 'a caixa do desenho esticado está em pixels inteiros');
  console.log('3) objeto antigo com caixa fracionada é levado para a grade ao selecionar');
  await ev("selObj = null; const o = L().objs[0]; o.x += 0.25; o.y -= 0.4; redraw(); 1"); await tecla('q', 'KeyQ'); const p3 = await pos(14, 18); await mouse('mousePressed', p3); await mouse('mouseReleased', p3); await sleep(150);
  const B3 = JSON.parse(await ev("JSON.stringify(selObj ? (() => { const b = caixa(selObj); return [b.l, b.t, b.r, b.b]; })() : null)")); console.log('   caixa:', JSON.stringify(B3)); ok(B3 && B3.every(v => Math.abs(v - Math.round(v)) < 1e-6), 'caixa encaixada na grade');
  console.log('4) na TELA cada pixel do desenho esticado ocupa um número inteiro de pixels do zoom');
  await ev("selObj = null; L().objs.length = 0; L().x.clearRect(0, 0, W, H); const x = L().x; for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#c33' : '#38c'; x.fillRect(10 + i, 10, 1, 6); } redraw(); 1");
  await tecla('q', 'KeyQ'); const p4 = await pos(11, 12); await mouse('mousePressed', p4); await mouse('mouseReleased', p4); await sleep(100); await tecla('t', 'KeyT');
  const al4 = JSON.parse(await ev("JSON.stringify(alcas(selObj).map(a => [a.dx, a.dy, a.sx, a.sy]))")), a4 = al4.find(q => q[0] === 1 && q[1] === 0), r4 = JSON.parse(await ev("(() => { const r = cv.getBoundingClientRect(); return JSON.stringify([r.left, r.top]); })()")); const A4 = [r4[0] + a4[2], r4[1] + a4[3]];
  await mouse('mousePressed', A4); for (let i = 1; i <= 6; i++) await mouse('mouseMoved', [A4[0] + 7.3 * i, A4[1]]); await mouse('mouseReleased', [A4[0] + 43.8, A4[1]]); await sleep(300); await ev('selObj = null; if (typeof grade !== "undefined") grade = false; redraw(); 1'); await sleep(300);
  const runs = JSON.parse(await ev("(() => { const g = cv.getContext('2d'), y = Math.round(view.oy + 13 * view.z + view.z / 2), x0 = Math.round(view.ox + 8 * view.z), x1 = Math.round(view.ox + 30 * view.z), d = g.getImageData(x0, y, x1 - x0, 1).data, out = []; let prev = null, n = 0; for (let i = 0; i < x1 - x0; i++) { const c = d[i * 4] + ',' + d[i * 4 + 1] + ',' + d[i * 4 + 2]; if (c === prev) n++; else { if (prev) out.push([prev, n]); prev = c; n = 1; } } out.push([prev, n]); return JSON.stringify({ z: view.z, ox: view.ox, x0, out }); })()"));
  console.log('   zoom', runs.z, 'faixas de cor na tela:', JSON.stringify(runs.out.map(q => q[1])));
  const bons = runs.out.filter(q => q[0] === '51,136,204' || q[0] === '204,51,51'); ok(bons.length >= 4 && bons.every(q => q[1] % runs.z === 0), 'cada faixa de cor é múltipla do zoom (' + runs.z + '): pixels inteiros');
  console.log('erros:', erros.join('|') || 'nenhum'); ok(erros.length === 0, 'sem erros de script'); console.log(falhas ? 'FALHAS: ' + falhas : 'TUDO OK');
} finally { bye(); }
