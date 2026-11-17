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
  await ev("novoDoc(64, 48); view.z = 4; view.ox = 20; view.oy = 20; redraw(); 1");
  // coordenada de tela do pixel (x,y)
  const pos = async (x, y) => ev(`(() => { const r = cv.getBoundingClientRect(); return [r.left + view.ox + (${x} + .5) * view.z, r.top + view.oy + (${y} + .5) * view.z]; })()`);
  const mouse = (type, [x, y], mod = 0, button = 'left') => send('Input.dispatchMouseEvent', { type, x, y, button, buttons: type === 'mouseReleased' || type === 'mouseMoved' ? 0 : (button === 'left' ? 1 : 2), clickCount: 1, modifiers: mod });
  const arrasta = async (a, b, mod = 0, button = 'left') => { const pa = await pos(...a), pb = await pos(...b); await mouse('mousePressed', pa, mod, button); const n = 6; for (let i = 1; i <= n; i++) await mouse('mouseMoved', [pa[0] + (pb[0] - pa[0]) * i / n, pa[1] + (pb[1] - pa[1]) * i / n], mod, button); await mouse('mouseReleased', pb, mod, button); await sleep(120); };
  const tecla = async (key, code, mod = 0) => { await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, modifiers: mod, text: mod ? '' : (key.length === 1 ? key : key === 'Enter' ? String.fromCharCode(13) : '') }); await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, modifiers: mod }); await sleep(80); };
  const cor = async (x, y) => ev(`(() => { const r = cv.getContext('2d').getImageData(view.ox + (${x} + .5) * view.z, view.oy + (${y} + .5) * view.z, 1, 1).data; return r[0] + ',' + r[1] + ',' + r[2]; })()`);
  await ev("(() => { const x = L().x; x.fillStyle = '#336699'; x.fillRect(30, 10, 10, 20); x.fillStyle = '#cc3333'; x.fillRect(5, 10, 8, 20); redraw(); })()");   // parede azul (pixels) e folha vermelha separada
  await sleep(300);
  const preparar = async () => { await ev("selObj = null; sel = null; L().objs.length = 0; L().x.clearRect(0, 0, W, H); L().x.fillStyle = '#336699'; L().x.fillRect(30, 10, 10, 20); L().x.fillStyle = '#cc3333'; L().x.fillRect(5, 10, 8, 20); redraw(); 1");
    await tecla('q', 'KeyQ'); const p = await pos(8, 20); await mouse('mousePressed', p); await mouse('mouseReleased', p); await sleep(100);
    for (let i = 0; i < 25; i++) await tecla('ArrowRight', 'ArrowRight');   // leva a folha vermelha para cima da parede azul (x 30..37)
    await sleep(200); };
  console.log('1) pixels selecionados + Shift+PageUp (para frente de tudo)');
  await preparar(); ok(await ev("!!sel"), 'folha selecionada (pixels soltos)'); console.log('   sobrepõe em x 30..37:', await cor(32, 20));
  await tecla('PageUp', 'PageUp', 8); await sleep(250); ok(await ev("!sel && !!selObj && selObj.t === 'traco'"), 'virou objeto automaticamente'); const c1 = await cor(32, 20); console.log('   cor no encontro:', c1); ok(c1 === '204,51,51', 'a folha ficou NA FRENTE da parede (vermelho)');
  console.log('2) pixels selecionados + Shift+PageDown (para trás de tudo)');
  await preparar(); await tecla('PageDown', 'PageDown', 8); await sleep(250); const c2 = await cor(32, 20); console.log('   cor no encontro:', c2); ok(c2 === '51,102,153', 'a folha ficou ATRÁS da parede (azul)'); ok(await ev("!!selObj"), 'continua selecionada como objeto');
  console.log('3) o botão "Para trás de tudo" do painel Seleção de pixels');
  await preparar(); await ev("$('bSelTrasT').click(); 1"); await sleep(250); ok(await cor(32, 20) === '51,102,153', 'o botão mandou para trás também');
  console.log('erros:', erros.join('|') || 'nenhum'); ok(erros.length === 0, 'sem erros de script'); console.log(falhas ? 'FALHAS: ' + falhas : 'TUDO OK');
} finally { bye(); }
