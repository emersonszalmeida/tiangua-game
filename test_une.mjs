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
  const clicaS = async (a, mod) => { const p = await pos(...a); await mouse('mousePressed', p, mod); await mouse('mouseReleased', p, mod); await sleep(80); };
  const novo = () => ev("(() => { novoDoc(64, 48); imgs = []; ref = null; view.z = 8; view.ox = 20; view.oy = 20; redraw(); return 1; })()");
  const pixAt = (x, y) => ev(`(() => { let n = 0; layers.forEach((l, i) => { const d = l.x.getImageData(${x}, ${y}, 1, 1).data; if (d[3]) n++; }); return n; })()`);
  const resumo = () => ev("JSON.stringify({ objs: layers.map(l => l.objs.length), imgs: imgs.length, grupo: grupo ? grupo.itens.length : 0, sel: !!sel, selObj: !!selObj })");
  const traco = async (a, b) => { await tecla('b', 'KeyB'); await arrasta(a, b); };   // lápis
  // A) dois traços da mesma camada, Shift+clique, Ctrl+E
  console.log('A) dois traços + Ctrl+E'); await novo(); await traco([5, 5], [12, 5]); await ev("L().objs[0].x = 1; 1"); await traco([5, 12], [12, 12]); await ev("escolhe('selecionar'); 1");
  let r = JSON.parse(await resumo()); console.log('   antes', JSON.stringify(r));
  await clicaS([8, 5], 0); await clicaS([8, 12], 8); r = JSON.parse(await resumo()); console.log('   selecionado', JSON.stringify(r)); await tecla('e', 'KeyE', 2); await sleep(150);
  r = JSON.parse(await resumo()); ok(r.objs[0] === 0 && (await pixAt(8, 5)) === 1 && (await pixAt(8, 12)) === 1, 'A: unir 2 traços → pixels: ' + JSON.stringify(r));
  // B) traço + pixels marcados (sel)
  console.log('B) traço + pixels marcados'); await novo(); await ev("(() => { const x = L().x; x.fillStyle = '#a33'; x.fillRect(20, 20, 4, 4); redraw(); })()");
  await traco([5, 5], [12, 5]); await tecla('s', 'KeyS'); await arrasta([20, 21], [23, 21]); await ev("escolhe('selecionar'); 1"); await clicaS([8, 5], 8);
  r = JSON.parse(await resumo()); console.log('   selecionado', JSON.stringify(r)); await tecla('e', 'KeyE', 2); await sleep(150); r = JSON.parse(await resumo()); ok(r.objs[0] === 0 && (await pixAt(8, 5)) === 1 && (await pixAt(21, 21)) === 1, 'B: unir traço + pixels marcados: ' + JSON.stringify(r));
  // C) dois traços em camadas diferentes
  // C) camadas: Ctrl+clique marca outra camada, Ctrl+E une (pixels + traço de cada uma)
  console.log('C) unir camadas'); await novo();
  await ev("(() => { L().x.fillStyle = '#a33'; L().x.fillRect(3, 3, 3, 3); layers.push(novaCamada('Camada 2')); cur = 1; L().x.fillStyle = '#3a3'; L().x.fillRect(20, 20, 3, 3); layers.push(novaCamada('Camada 3')); cur = 2; L().x.fillStyle = '#33a'; L().x.fillRect(40, 30, 3, 3); camadasUi(); redraw(); return 1; })()");
  await ev("(() => { const d = [...document.querySelectorAll('#camadas div')]; const r = i => d.find(x => +x.dataset.i === i); r(1).dispatchEvent(new MouseEvent('click', { bubbles: true, ctrlKey: true })); return 1; })()");
  let e = JSON.parse(await ev("JSON.stringify({ camSel: [...camSel], cur })")); ok(e.camSel.length === 1 && e.camSel[0] === 1 && e.cur === 2, 'Ctrl+clique marcou a camada 2 sem trocar a atual: ' + JSON.stringify(e));
  await tecla('e', 'KeyE', 2); await sleep(150);
  e = JSON.parse(await ev("JSON.stringify({ n: layers.length, cur, nomes: layers.map(l => l.nome), px: (() => { const g = (l, x, y) => l.x.getImageData(x, y, 1, 1).data[3] > 0; const a = layers[layers.length - 1]; return [g(layers[0], 4, 4), g(a, 21, 21), g(a, 41, 31), !g(a, 4, 4)]; })() })"));
  ok(e.n === 2 && e.px.every(Boolean) , 'Unir camadas: 3 camadas → 2, a unida (a mais alta marcada) tem os pixels das duas: ' + JSON.stringify(e));
  // D) imagem importada + pixels da camada, marcados com Shift
  console.log('D) imagem + pixels'); await novo();
  await ev("(() => { const c = document.createElement('canvas'); c.width = 10; c.height = 10; const x = c.getContext('2d'); x.fillStyle = '#c80'; x.fillRect(0, 0, 10, 10); const id = ++idImg; IMG_REG[id] = { im: c, c }; const o = { id, nome: 'img', t: 'imagem', im: c, c, x: 30, y: 10, w: 10, h: 10, m: [1, 0, 0, 1], crop: null, op: 1, acima: true, vis: true, z: ++zSeq }; imgs.push(o); L().x.fillStyle = '#a33'; L().x.fillRect(5, 5, 4, 4); redraw(); return 1; })()");
  await ev("escolhe('selecionar'); 1"); await arrasta([2, 2], [11, 11]); console.log('   marcou', await estado()); await clicaS([34, 14], 8);
  r = JSON.parse(await resumo()); console.log('   selecionado', JSON.stringify(r)); await tecla('e', 'KeyE', 2); await sleep(150); r = JSON.parse(await resumo()); ok(r.imgs === 0 && (await pixAt(6, 6)) === 1 && (await pixAt(34, 14)) === 1, 'D: ' + JSON.stringify(r));
  // F) objeto selecionado primeiro, Shift+clique em pixels soltos (o caso do dono)
  console.log('F) objeto + Shift+clique em pixels'); await novo();
  await ev("(() => { L().x.fillStyle = '#a33'; L().x.fillRect(30, 20, 15, 20); redraw(); return 1; })()");
  await traco([5, 5], [12, 5]); await ev("escolhe('selecionar'); 1"); await clicaS([8, 5], 0); await clicaS([35, 30], 8);
  r = JSON.parse(await resumo()); console.log('   selecionado', JSON.stringify(r), await estado()); ok(r.grupo === 1 && r.sel, 'F: objeto + pixels ficam selecionados juntos');
  await tecla('e', 'KeyE', 2); await sleep(150); r = JSON.parse(await resumo()); ok(r.objs[0] === 0 && (await pixAt(8, 5)) === 1 && (await pixAt(35, 30)) === 1 && !r.sel, 'F: unidos: ' + JSON.stringify(r));
  // G) parede = imagem (atrás), desenho pintado com a imagem selecionada (traço preso a ela)
  console.log('G) imagem atrás + traço preso'); await novo();
  await ev("(() => { const c = document.createElement('canvas'); c.width = 30; c.height = 40; const x = c.getContext('2d'); x.fillStyle = '#c80'; x.fillRect(0, 0, 30, 40); const id = ++idImg; IMG_REG[id] = { im: c, c }; const o = { id, nome: 'img', t: 'imagem', im: c, c, x: 10, y: 4, w: 30, h: 40, m: [1, 0, 0, 1], crop: null, op: 1, acima: false, vis: true, z: ++zSeq }; imgs.push(o); selecionaRef(o); return 1; })()");
  await traco([14, 10], [30, 10]); r = JSON.parse(await resumo()); console.log('   pintou', JSON.stringify(r), await ev("JSON.stringify(layers.map(l => l.objs.map(o => [o.t, o.pai])))"));
  
  await ev("escolhe('selecionar'); 1"); await clicaS([20, 30], 0); await clicaS([20, 10], 8);
  r = JSON.parse(await resumo()); console.log('   selecionado', JSON.stringify(r)); await tecla('e', 'KeyE', 2); await sleep(150);
  r = JSON.parse(await resumo()); console.log('   depois', JSON.stringify(r), 'aviso', await ev("aviso")); ok(r.imgs === 0 && (await pixAt(20, 30)) === 1 && (await pixAt(20, 10)) === 1, 'G: unir imagem + traço preso');
  // H) nada selecionado: une TUDO (2 camadas + imagem + traço) numa camada só
  console.log('H) unir tudo'); await novo();
  await ev("(() => { const c = document.createElement('canvas'); c.width = 10; c.height = 10; c.getContext('2d').fillRect(0, 0, 10, 10); const id = ++idImg; IMG_REG[id] = { im: c, c }; imgs.push({ id, nome: 'img', t: 'imagem', im: c, c, x: 40, y: 30, w: 10, h: 10, m: [1, 0, 0, 1], crop: null, op: 1, acima: false, vis: true, z: ++zSeq }); L().x.fillStyle = '#a33'; L().x.fillRect(3, 3, 3, 3); layers.push(novaCamada('C2')); cur = 1; L().x.fillStyle = '#3a3'; L().x.fillRect(20, 20, 3, 3); camadasUi(); redraw(); return 1; })()");
  await traco([5, 40], [12, 40]); await ev("escolhe('selecionar'); selObj = null; grupo = null; 1"); await tecla('e', 'KeyE', 2); await sleep(150);
  e = JSON.parse(await ev("JSON.stringify({ n: layers.length, imgs: imgs.length, objs: layers[0].objs.length, p: [4, 4, 21, 21, 8, 40, 45, 35].reduce((a, v, k, arr) => k % 2 ? a : a.concat(layers[0].x.getImageData(arr[k], arr[k + 1], 1, 1).data[3] > 0), []) })"));
  ok(e.n === 1 && e.imgs === 0 && e.objs === 0 && e.p.every(Boolean), 'H: tudo numa camada só: ' + JSON.stringify(e));
  // I) importar imagem: vira pixels (objeto) sozinha; com a opção desligada fica imagem e o botão converte
  console.log('I) converter imagem'); await novo();
  const imp = async () => { await ev("(async () => { const c = document.createElement('canvas'); c.width = 12; c.height = 12; const x = c.getContext('2d'); x.fillStyle = '#c80'; x.fillRect(0, 0, 12, 12); const b = await new Promise(r => c.toBlob(r)); carregaRef(new File([b], 'parede.png', { type: 'image/png' })); await new Promise(r => setTimeout(r, 1200)); return 1; })()"); await sleep(1500); };
  await imp(); r = JSON.parse(await resumo()); ok(r.imgs === 0 && r.objs[0] === 1, 'I1: importou já em pixels: ' + JSON.stringify(r));
  await ev("$('rAuto').checked = false; 1"); await imp(); r = JSON.parse(await resumo()); ok(r.imgs === 1, 'I2: com a opção desligada fica imagem: ' + JSON.stringify(r));
  await ev("$('bRefPx').click(); 1"); r = JSON.parse(await resumo()); ok(r.imgs === 0 && r.objs[0] === 2, 'I3: botão converteu: ' + JSON.stringify(r) + ' aviso ' + await ev('aviso'));
  const c1 = await ev("(() => { const o = L().objs[1]; return TRACOS[o.cid].getContext('2d').getImageData(W / 2, H / 2, 1, 1).data[3]; })()"); ok(c1 === 255, 'I4: pixel opaco no meio: ' + c1);
  // J) erro no meio do Unir: nada pode sumir
  console.log('J) falha no meio'); await novo();
  await ev("(() => { L().x.fillStyle = '#a33'; L().x.fillRect(3, 3, 5, 5); redraw(); return 1; })()");
  await traco([5, 20], [12, 20]); await traco([5, 30], [12, 30]); await ev("escolhe('selecionar'); 1"); await arrasta([2, 18], [14, 32]);
  await ev("(() => { window._d = desenhaTraco; desenhaTraco = () => { throw new Error('teste'); }; return 1; })()");
  const antes = await ev("JSON.stringify({ n: layers.map(l => l.objs.length), p: L().x.getImageData(4, 4, 1, 1).data[3] })"); await tecla('e', 'KeyE', 2); await sleep(200);
  const dep = await ev("JSON.stringify({ n: layers.map(l => l.objs.length), p: L().x.getImageData(4, 4, 1, 1).data[3], aviso })"); console.log('   antes', antes, 'depois', dep);
  ok(JSON.parse(dep).n[0] === JSON.parse(antes).n[0] && JSON.parse(dep).p === 255, 'J: após o erro tudo continua lá');
  // K) objetos de traço com canvas próprio (68x126) em posição alta, como no vídeo do dono
  console.log('K) traço 68x126'); await ev("desenhaTraco = window._d; novoDoc(910, 1472); imgs = []; ref = null; 1");
  await ev("(() => { const mk = (x, y, w, h, cor) => { const c = canvasTraco(); c.width = w; c.height = h; const g = c.getContext('2d'); g.fillStyle = cor; g.fillRect(0, 0, w, h); const o = { t: 'traco', x, y, w, h, m: [1, 0, 0, 1], z: ++zSeq, cid: ++idTr, pai: 0 }; TRACOS[o.cid] = c; L().objs.push(o); return o; }; window._a = mk(79, 807, 68, 126, '#c80'); window._b = mk(79, 922, 4, 10, '#0a0'); window._a.acima = false; window._b.acima = false; grupo = { itens: [window._a, window._b], comPx: false }; toca(); redraw(); return 1; })()");
  const vis0 = await ev("(() => { const c = juntaCanvas().getContext('2d'); return [c.getImageData(100, 850, 1, 1).data[3], c.getImageData(80, 925, 1, 1).data[3]]; })()");
  await tecla('e', 'KeyE', 2); await sleep(200);
  const vis1 = await ev("(() => { const c = juntaCanvas().getContext('2d'); return [c.getImageData(100, 850, 1, 1).data[3], c.getImageData(80, 925, 1, 1).data[3], layers[0].objs.length, L().x.getImageData(100, 850, 1, 1).data[3]]; })()");
  console.log('   antes', JSON.stringify(vis0), 'depois', JSON.stringify(vis1), 'aviso', await ev('aviso')); ok(vis1[0] === 255 && vis1[1] === 255, 'K: continua visível');
  // L) espelhar só o selecionado
  console.log('L) espelhar'); await ev("desenhaTraco = window._d || desenhaTraco; novoDoc(64, 48); imgs = []; ref = null; view.z = 8; view.ox = 20; view.oy = 20; redraw(); 1");
  const px = (x, y) => ev("(() => { const c = juntaCanvas().getContext('2d'); return c.getImageData(" + x + ", " + y + ", 1, 1).data[3] > 0; })()");
  await ev("(() => { L().x.fillStyle = '#a33'; L().x.fillRect(40, 30, 6, 4); redraw(); return 1; })()"); await traco([5, 5], [12, 5]); await ev("escolhe('selecionar'); 1");
  await clicaS([8, 5], 0); await clicaS([42, 31], 8);
  r = JSON.parse(await resumo()); console.log('   grupo', JSON.stringify(r), await estado());
  await tecla('h', 'KeyH'); await sleep(150);
  const dep2 = [await px(44, 5), await px(8, 5), (await ev('sel.bx + sel.ox')) === 5, true]; console.log('   depois do H', JSON.stringify(dep2));
  ok(dep2[0] === true && dep2[1] === false && dep2[2] === true && dep2[3] === true, 'L1: o traço foi para o lado oposto do conjunto');
  
  // M) exportar = igual à tela: objeto "para trás" fica por baixo dos pixels
  console.log('M) exportação'); await ev("novoDoc(64, 48); imgs = []; ref = null; 1");
  await ev("(() => { const mk = (x, y, w, h, cor, acima) => { const c = canvasTraco(); c.width = w; c.height = h; const g = c.getContext('2d'); g.fillStyle = cor; g.fillRect(0, 0, w, h); const o = { t: 'traco', x, y, w, h, m: [1, 0, 0, 1], z: ++zSeq, cid: ++idTr, pai: 0 }; if (acima === false) o.acima = false; TRACOS[o.cid] = c; L().objs.push(o); return o; }; L().x.fillStyle = '#00f'; L().x.fillRect(10, 10, 10, 10); mk(5, 5, 20, 20, '#f00', false); mk(30, 30, 10, 10, '#0f0'); redraw(); return 1; })()");
  const cor = await ev("(() => { const c = juntaCanvas().getContext('2d'); const a = c.getImageData(12, 12, 1, 1).data, b = c.getImageData(7, 7, 1, 1).data; return [a[2] === 255 && a[0] === 0, b[0] === 255]; })()");
  ok(cor[0] && cor[1], 'M: exportação põe o objeto "para trás" por baixo do pixel azul: ' + JSON.stringify(cor));
  // N) clonar grupo (Ctrl+D): objetos + pixels soltos, e as cópias continuam agrupadas
  console.log('N) clonar grupo'); await novo();
  await ev("(() => { L().x.fillStyle = '#a33'; L().x.fillRect(40, 30, 6, 4); redraw(); return 1; })()"); await traco([5, 5], [12, 5]); await ev("escolhe('selecionar'); 1"); await clicaS([8, 5], 0); await clicaS([42, 31], 8);
  await ev("grupo.itens.forEach(o => { o.grp = 7; }); 1");
  await tecla('d', 'KeyD', 2); await sleep(150);
  r = JSON.parse(await resumo()); console.log('   depois', JSON.stringify(r), await ev("JSON.stringify(layers[0].objs.map(o => [o.x, o.y, o.grp, o.cid]))"));
  ok(r.objs[0] === 2 && r.grupo === 1 && r.sel, 'N1: 2 traços (original + cópia) e a seleção é o grupo clonado');
  const g = JSON.parse(await ev("JSON.stringify({ a: layers[0].objs[0].cid !== layers[0].objs[1].cid, grp: layers[0].objs[0].grp !== layers[0].objs[1].grp && !!layers[0].objs[1].grp, dx: layers[0].objs[1].x - layers[0].objs[0].x, px: [sel.ox, sel.oy] })"));
  ok(g.a && g.grp && g.dx === 3 && g.px[0] === 3, 'N2: cópia independente, grupo novo, deslocada 3 px: ' + JSON.stringify(g));
  const antes2 = await ev("L().x.getImageData(41, 31, 1, 1).data[3]"); ok(antes2 === 255, 'N3: os pixels soltos deixaram cópia no lugar');
  // E) pixels em duas camadas, retângulo em volta dos dois
  console.log('E) pixels em 2 camadas'); await novo();
  await ev("(() => { L().x.fillStyle = '#a33'; L().x.fillRect(5, 5, 20, 30); layers.push(novaCamada('Camada 2')); cur = 1; L().x.fillStyle = '#3a3'; L().x.fillRect(27, 30, 3, 3); camadasUi(); redraw(); return 1; })()");
  await tecla('s', 'KeyS'); await arrasta([2, 2], [35, 40]); r = JSON.parse(await resumo()); console.log('   marcou', JSON.stringify(r), await estado()); await tecla('e', 'KeyE', 2); await sleep(150);
  console.log('   camadas', await ev("JSON.stringify(layers.map(l => { const d = l.x.getImageData(0,0,W,H).data; let n=0; for (let i=3;i<d.length;i+=4) if (d[i]) n++; return n; }))"), 'aviso', await ev("aviso"));
  const shot = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(process.env.SHOT || path.join(os.tmpdir(), 'editor_teste.png'), Buffer.from(shot.result.data, 'base64'));
  console.log(falhas ? '\n' + falhas + ' FALHA(S)' : '\nTUDO OK');
  try { await send('Browser.close'); } catch { }
} finally { bye(); }
process.exit(falhas ? 1 : 0);
