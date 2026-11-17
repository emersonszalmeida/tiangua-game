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
  const nobj = () => ev("L().objs.length"), obj = () => ev("JSON.stringify((() => { const o = selObj; return o ? { t: o.t, w: o.w, h: o.h, poly: o.poly || null } : null; })())");
  const px = () => ev("(() => { const o = selObj; if (!o) return -1; const d = canvasObj(o).getContext('2d').getImageData(0, 0, W, H).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) n++; return n; })()");
  console.log('1) criar um retângulo (R) de (10,10) a (30,25)');
  await tecla('r', 'KeyR'); ok(await ev("tool") === 'retangulo', 'ferramenta Retângulo ativa'); await arrasta([10, 10], [30, 25]);
  let o = JSON.parse(await obj()); console.log('   objeto:', JSON.stringify(o)); ok(o && o.t === 'retangulo', 'retângulo criado e selecionado');
  const p0 = await px(); console.log('   pixels do retângulo:', p0);
  console.log('2) ferramenta Forma (F10): arrastar o canto direito-alto para fora');
  await tecla('F10', 'F10'); ok(await ev("tool") === 'forma', 'Forma ativa'); ok(JSON.parse(await obj()) && JSON.parse(await obj()).t === 'retangulo', 'o retângulo continua selecionado');
  const cantos = JSON.parse(await ev("JSON.stringify(contornoObj(selObj))")); console.log('   cantos (mundo):', JSON.stringify(cantos));
  const [cx, cy] = cantos[1]; await arrasta([Math.round(cx), Math.round(cy)], [Math.round(cx) + 6, Math.round(cy) - 5]);
  o = JSON.parse(await obj()); console.log('   depois:', JSON.stringify(o));
  ok(o && o.t === 'poligono' && o.poly.length === 4, 'virou polígono de 4 pontos'); const p1 = await px(); ok(p1 > 0 && p1 !== p0, 'o desenho mudou (' + p0 + ' → ' + p1 + ' pixels)');
  const c2 = JSON.parse(await ev("JSON.stringify(contornoObj(selObj))")); ok(Math.abs(c2[1][0] - (cx + 6)) < 1.01 && Math.abs(c2[1][1] - (cy - 5)) < 1.01, 'o canto foi para onde arrastei: ' + JSON.stringify(c2[1]) + ' (esperado ' + (cx + 6) + ',' + (cy - 5) + ')');
  ok(Math.abs(c2[0][0] - cantos[0][0]) < .01 && Math.abs(c2[3][1] - cantos[3][1]) < .01, 'os outros cantos não se mexeram');
  console.log('3) duplo clique na borda de baixo cria um ponto novo');
  const mx = Math.round((c2[2][0] + c2[3][0]) / 2), my = Math.round((c2[2][1] + c2[3][1]) / 2), pm = await pos(mx, my); await mouse('mousePressed', pm); await mouse('mouseReleased', pm); await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: pm[0], y: pm[1], button: 'left', buttons: 1, clickCount: 2 }); await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: pm[0], y: pm[1], button: 'left', buttons: 0, clickCount: 2 }); await sleep(150);
  o = JSON.parse(await obj()); console.log('   pontos:', o && o.poly && o.poly.length); 
  console.log('4) desfazer (Ctrl+Z) volta ao retângulo');
  let tp = ''; for (let i = 0; i < 4; i++) { await tecla('z', 'KeyZ', 2); tp = await ev('L().objs.map(q => q.t + (q.poly ? q.poly.length : "")).join()'); if (tp === 'retangulo') break; }
  ok(tp === 'retangulo', 'desfazer devolveu o retângulo: ' + tp);
  console.log('5) polígono com duplicar, girar, espelhar, salvar e abrir');
  await tecla('F10', 'F10'); await ev('selObj = L().objs[0]; redraw(); 1'); await arrasta([Math.round(cx), Math.round(cy)], [Math.round(cx) + 4, Math.round(cy) - 3]);
  const r5 = await ev("(() => { try { const o = L().objs[0]; selObj = o; duplica(); const n1 = L().objs.length; gira(selObj, 30); const pg = canvasObj(selObj).getContext('2d').getImageData(0, 0, W, H).data; let k = 0; for (let i = 3; i < pg.length; i += 4) if (pg[i]) k++; const js = projJson(); abreProj(JSON.parse(js)); const t = L().objs.map(q => q.t).join(); return JSON.stringify({ n1, k, t, poly: !!L().objs[0].poly }); } catch (e) { return 'ERRO ' + e.message; } })()");
  console.log('   ', r5); ok(!String(r5).startsWith('ERRO') && JSON.parse(r5).t.includes('poligono') && JSON.parse(r5).k > 0, 'duplicar/girar/salvar/abrir funcionam com polígono');
  console.log('6) selecionar 2 pontos com Shift+clique e arrastar os dois juntos');
  await ev("L().objs.length = 0; selObj = null; redraw(); 1"); await tecla('r', 'KeyR'); await arrasta([10, 30], [30, 45]); await tecla('F10', 'F10');
  const cn = JSON.parse(await ev("JSON.stringify(contornoObj(selObj))")); console.log('   cantos:', JSON.stringify(cn));
  const tClick = async (i, mod = 0) => { const pp = await pos(Math.round(cn[i][0]), Math.round(cn[i][1])); await mouse('mousePressed', pp, mod); await mouse('mouseReleased', pp, mod); await sleep(100); };
  await tClick(0); await tClick(1, 8);   // 8 = Shift
  ok(JSON.stringify(await ev("polySel")) === '[0,1]', 'Shift+clique selecionou 2 pontos: ' + await ev("JSON.stringify(polySel)"));
  await arrasta([Math.round(cn[0][0]), Math.round(cn[0][1])], [Math.round(cn[0][0]) - 3, Math.round(cn[0][1]) - 6]);
  const c6 = JSON.parse(await ev("JSON.stringify(contornoObj(selObj))")); console.log('   depois:', JSON.stringify(c6));
  ok(Math.abs(c6[0][1] - (cn[0][1] - 6)) < .01 && Math.abs(c6[1][1] - (cn[1][1] - 6)) < .01 && Math.abs(c6[1][0] - (cn[1][0] - 3)) < .01, 'os dois pontos subiram 6 e foram 3 para a esquerda juntos');
  ok(Math.abs(c6[2][1] - cn[2][1]) < .01 && Math.abs(c6[3][1] - cn[3][1]) < .01, 'os outros dois não se mexeram');
  console.log('7) retângulo de seleção em volta de 2 pontos (arrastar no vazio)');
  const p7a = c6[3][0] - 4, p7b = c6[2][0] + 4; await ev("polySel = []; ptSel = -1; redraw(); 1");
  await arrasta([Math.round(p7a), Math.round(c6[3][1]) - 3], [Math.round(p7b), Math.round(c6[3][1]) + 4]);
  ok(JSON.stringify(await ev("polySel.slice().sort()")) === '[2,3]', 'o retângulo pegou os 2 pontos de baixo: ' + await ev("JSON.stringify(polySel)"));
  await tecla('Delete', 'Delete'); const nOp = await ev("selObj.poly.length"); ok(nOp === 4, 'Delete com 2 pontos de um quadrilátero não deixa menos de 3 (continua com ' + nOp + ')');
  await tecla('h', 'KeyH'); console.log('   erros de script:', erros.length ? erros.join(' | ') : 'nenhum'); ok(erros.length === 0, 'sem erros de script');
  console.log(falhas ? 'FALHAS: ' + falhas : 'TUDO OK');
} finally { bye(); }
