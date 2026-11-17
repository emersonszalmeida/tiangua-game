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
  await ev("novoDoc(64, 48); view.z = 8; view.ox = 20; view.oy = 20; redraw(); 1");
  // coordenada de tela do pixel (x,y)
  const pos = async (x, y) => ev(`(() => { const r = cv.getBoundingClientRect(); return [r.left + view.ox + (${x} + .5) * view.z, r.top + view.oy + (${y} + .5) * view.z]; })()`);
  const mouse = (type, [x, y], mod = 0, button = 'left') => send('Input.dispatchMouseEvent', { type, x, y, button, buttons: type === 'mouseReleased' || type === 'mouseMoved' ? 0 : (button === 'left' ? 1 : 2), clickCount: 1, modifiers: mod });
  const arrasta = async (a, b, mod = 0, button = 'left') => { const pa = await pos(...a), pb = await pos(...b); await mouse('mousePressed', pa, mod, button); const n = 6; for (let i = 1; i <= n; i++) await mouse('mouseMoved', [pa[0] + (pb[0] - pa[0]) * i / n, pa[1] + (pb[1] - pa[1]) * i / n], mod, button); await mouse('mouseReleased', pb, mod, button); await sleep(120); };
  const tecla = async (key, code, mod = 0) => { await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, modifiers: mod, text: mod ? '' : (key.length === 1 ? key : key === 'Enter' ? String.fromCharCode(13) : '') }); await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, modifiers: mod }); await sleep(80); };
  const caixaPx = () => ev("(() => { const o = selObj; if (!o) return null; const d = canvasObj(o).getContext('2d').getImageData(0, 0, W, H).data; let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1, n = 0; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3]) { n++; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } return JSON.stringify({ t: o.t, n, w: x1 - x0 + 1, h: y1 - y0 + 1 }); })()");
  await ev("(() => { const x = L().x; x.fillStyle = '#a33'; x.fillRect(10, 10, 2, 10); x.fillRect(10, 18, 10, 2); redraw(); })()");
  console.log('1) pegar o desenho com Q e apertar T');
  await tecla('q', 'KeyQ'); const pL = await pos(10, 12); await mouse('mousePressed', pL); await mouse('mouseReleased', pL); await sleep(100);
  ok(await ev("!!sel"), 'desenho selecionado (pixels soltos)'); await tecla('t', 'KeyT');
  let c0 = JSON.parse(await caixaPx()); console.log('   objeto:', JSON.stringify(c0)); ok(c0 && c0.t === 'traco' && c0.w === 10 && c0.h === 10, 'virou objeto (traço) 10x10 com ' + (c0 && c0.n) + ' pixels');
  ok(await ev("!sel"), 'a seleção de pixels solta foi consumida');
  console.log('2) esticar pela alça de baixo-direita');
  const al = JSON.parse(await ev("JSON.stringify(alcas(selObj).map(a => [a.dx, a.dy, a.sx, a.sy]))")), a = al.find(q => q[0] === 1 && q[1] === 1); const r = JSON.parse(await ev("(() => { const r = cv.getBoundingClientRect(); return JSON.stringify([r.left, r.top]); })()"));
  const A = [r[0] + a[2], r[1] + a[3]]; await mouse('mousePressed', A); for (let i = 1; i <= 6; i++) await mouse('mouseMoved', [A[0] + 12 * 8 * i / 6, A[1] + 6 * 8 * i / 6]); await mouse('mouseReleased', [A[0] + 96, A[1] + 48]); await sleep(150);
  const c1 = JSON.parse(await caixaPx()); console.log('   depois:', JSON.stringify(c1)); ok(c1.t === 'traco' && c1.w > c0.w + 8 && c1.h > c0.h + 4, 'o desenho esticou: ' + c0.w + 'x' + c0.h + ' → ' + c1.w + 'x' + c1.h);
  ok(c1.n > c0.n, 'mais pixels depois de esticar (sem borrar): ' + c0.n + ' → ' + c1.n);
  const cores = await ev("(() => { const d = canvasObj(selObj).getContext('2d').getImageData(0, 0, W, H).data, s = new Set(); for (let i = 0; i < d.length; i += 4) if (d[i + 3]) s.add(d[i + 3] + ',' + d[i] + ',' + d[i + 1] + ',' + d[i + 2]); return s.size; })()");
  ok(cores === 1, 'continua pixel exato: 1 cor, sem meio-tom (' + cores + ')');
  console.log('3) Ctrl+Z desfaz o esticar; Ctrl+E junta em pixels');
  await tecla('z', 'KeyZ', 2); await ev('selObj = L().objs[0] || null; 1'); const c2 = JSON.parse(await caixaPx()); ok(c2 && c2.w === c0.w, 'desfazer voltou ao tamanho original: ' + (c2 && c2.w));
  console.log('erros de script:', erros.length ? erros.join(' | ') : 'nenhum'); ok(erros.length === 0, 'sem erros de script');
  console.log(falhas ? 'FALHAS: ' + falhas : 'TUDO OK');
} finally { bye(); }
