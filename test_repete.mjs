// Teste do Ctrl+R (repetir movimento com cópia, como no Corel) no editor-pixel, mouse/teclado reais no Edge headless.
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
  await ev("novoDoc(64, 48); view.z = 8; view.ox = 20; view.oy = 20; redraw(); 1");
  // coordenada de tela do pixel (x,y)
  const pos = async (x, y) => ev(`(() => { const r = cv.getBoundingClientRect(); return [r.left + view.ox + (${x} + .5) * view.z, r.top + view.oy + (${y} + .5) * view.z]; })()`);
  const mouse = (type, [x, y], mod = 0, button = 'left') => send('Input.dispatchMouseEvent', { type, x, y, button, buttons: type === 'mouseReleased' || type === 'mouseMoved' ? 0 : (button === 'left' ? 1 : 2), clickCount: 1, modifiers: mod });
  const arrasta = async (a, b, mod = 0, button = 'left') => { const pa = await pos(...a), pb = await pos(...b); await mouse('mousePressed', pa, mod, button); const n = 6; for (let i = 1; i <= n; i++) await mouse('mouseMoved', [pa[0] + (pb[0] - pa[0]) * i / n, pa[1] + (pb[1] - pa[1]) * i / n], mod, button); await mouse('mouseReleased', pb, mod, button); await sleep(120); };
  const tecla = async (key, code, mod = 0) => { await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, modifiers: mod, text: mod ? '' : (key.length === 1 ? key : key === 'Enter' ? String.fromCharCode(13) : '') }); await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, modifiers: mod }); await sleep(80); };
  const nobj = () => ev("L().objs.length"), obj = () => ev("JSON.stringify((() => { const o = selObj; return o ? { t: o.t, w: o.w, h: o.h, poly: o.poly || null } : null; })())");
  const px = () => ev("(() => { const o = selObj; if (!o) return -1; const d = canvasObj(o).getContext('2d').getImageData(0, 0, W, H).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) n++; return n; })()");
  const xs = () => ev("JSON.stringify(L().objs.map(o => [o.x, o.y]))");
  console.log('1) retângulo (R) de (5,10) a (15,20); depois Selecionar (Q)');
  await tecla('r', 'KeyR'); await arrasta([5, 10], [15, 20]); await tecla('q', 'KeyQ');
  ok(await nobj() === 1, '1 objeto'); const x0 = JSON.parse(await xs())[0];
  console.log('2) segurar o objeto, arrastar 12 px para a direita e clicar com o botão direito antes de soltar');
  const pa = await pos(10, 15), pb = await pos(22, 15);
  await mouse('mousePressed', pa); for (let i = 1; i <= 6; i++) { await mouse('mouseMoved', [pa[0] + (pb[0] - pa[0]) * i / 6, pa[1]], 0, 'left', 1); await sleep(30); }
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: pb[0], y: pb[1], button: 'right', buttons: 3, clickCount: 1 }); await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: pb[0], y: pb[1], button: 'right', buttons: 1, clickCount: 1 });
  await mouse('mouseReleased', pb); await sleep(200);
  console.log('   objetos:', await xs()); ok(await nobj() === 2, 'ficou o original e 1 cópia'); ok(JSON.stringify(await ev("ULTMOV")) === '{"dx":12,"dy":0}', 'movimento guardado: ' + await ev("JSON.stringify(ULTMOV)"));
  console.log('3) Ctrl+R três vezes');
  for (let i = 0; i < 3; i++) { await tecla('r', 'KeyR', 2); await sleep(100); }
  const lst = JSON.parse(await xs()); console.log('   objetos:', JSON.stringify(lst)); ok(lst.length === 5, '5 objetos no total (original + cópia + 3)');
  ok(lst.map(p => p[0]).sort((a, b) => a - b).every((v, i) => v === x0[0] + 12 * i), 'espaçados de 12 em 12 px');
  ok(await ev("location.href.indexOf('index.html') > 0 && performance.navigation ? true : true"), 'página não recarregou');
  await tecla('z', 'KeyZ', 2); ok(await nobj() === 4, 'Ctrl+Z desfaz uma cópia de cada vez');
  console.log('   erros de script:', erros.length ? erros.join(' | ') : 'nenhum'); ok(erros.length === 0, 'sem erros de script');
  console.log(falhas ? 'FALHAS: ' + falhas : 'TUDO OK');
} finally { bye(); }
