// Monta UMA folha PNG com as peças de parede/pilar/piso como estavam ANTES dos ajustes do Claude (código original do casa.html, commit 14efd59 de paredes.js),
// cada uma num quadro com margem, para abrir no editor-pixel (arrastar o PNG), consertar à mão e exportar.
// Peças (as ↙, "y", aparecem espelhadas, como no jogo): parede alta / com porta / baixa / CORTADA (26 px) / porta CORTADA, nas duas direções (x = corre em ↘, y = corre em ↙; as cores são diferentes), pilares e o piso.
// Saída: paredes_editar/folha_para_editar.png, paredes_editar/folha_layout.json e cópia em Downloads/paredes_para_editar.png
// Depois de editar e exportar: node paredes_aplicar_edicoes.mjs <png exportado>
import { spawn, spawnSync, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const OUT = './paredes_editar/', MARGEM = 12, LARG = 720, edge = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(p => fs.existsSync(p));
fs.mkdirSync(OUT, { recursive: true });
// código original das peças (o commit em que paredes.js nasceu), expondo as funções que fazem as peças
let src = execFileSync('git', ['show', '14efd59:paredes.js'], { encoding: 'utf8' });
{ const alvo = 'window.PAREDES = { PIECE,', k = src.lastIndexOf(alvo); src = src.slice(0, k) + 'window.PAREDES = { PIECE, wallPiece, postPiece, FACE_Y, FACE_X,' + src.slice(k + alvo.length); }   // (a 1ª ocorrência de window.PAREDES está num comentário, por isso o texto completo)
const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-')), pag = path.join(prof, 'p.html');
fs.writeFileSync(pag, '<!doctype html><meta charset="utf-8"><body><script>' + src + '</script></body>');
const port = 9300 + Math.floor(Math.random() * 500), proc = spawn(edge, ['--headless=new', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, '--window-size=900,600', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms)); let done = false;
const bye = () => { if (done) return; done = true; try { spawnSync('taskkill', ['/PID', String(proc.pid), '/T', '/F'], { stdio: 'ignore' }); } catch { } try { proc.kill(); } catch { }
  try { spawnSync('powershell', ['-NoProfile', '-Command', "Get-CimInstance Win32_Process -Filter \"Name='msedge.exe'\" | Where-Object { $_.CommandLine -like '*" + path.basename(prof) + "*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"], { stdio: 'ignore' }); } catch { } };   // garante: mata qualquer Edge que use a pasta temporária desta execução process.on('exit', bye);
try {
  let list; for (let i = 0; i < 60; i++) { try { list = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (list.find(t => t.type === 'page')) break; } catch { } await sleep(500); }
  const ws = new WebSocket(list.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  let id = 0; const pend = new Map(); ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Runtime.enable'); await send('Page.enable'); await send('Page.navigate', { url: pathToFileURL(pag).href }); await sleep(1500);
  const expr = `(() => { const P = PAREDES, M = ${MARGEM}, LARG = ${LARG}, CUT = 26;
    const itens = [];
    const espelha = p => { const c = document.createElement('canvas'); c.width = p.c.width; c.height = p.c.height; const k = c.getContext('2d'); k.translate(c.width, 0); k.scale(-1, 1); k.drawImage(p.c, 0, 0); return { c, oy: p.oy, espelhada: true }; };   // a parede ↙ é desenhada espelhada no jogo: na folha ela aparece como você a vê (correndo para ↙)
    for (const [d, F] of [['x', P.FACE_Y], ['y', P.FACE_X]]) { const ini = itens.length; itens.push([d + '_alta', P.wallPiece(F, P.HIGH)], [d + '_porta', P.wallPiece(F, P.HIGH, true)], [d + '_baixa', P.wallPiece(F, P.LOW)], [d + '_cortada', P.wallPiece(F, CUT)], [d + '_porta_cortada', P.wallPiece(F, CUT, true)]); if (d === 'y') for (let k = ini; k < itens.length; k++) itens[k][1] = espelha(itens[k][1]); }
    itens.push(['pilar_alto', P.postPiece(P.HIGH)], ['pilar_baixo', P.postPiece(P.LOW)], ['pilar_cortado', P.postPiece(CUT)]); itens.push(['piso', { c: P.floorTile, oy: 0 }]);
    let x = 0, y = 0, rh = 0; const lay = {};
    for (const [n, p] of itens) { const w = p.c.width, h = p.c.height, cw = w + 2 * M, ch = h + 2 * M; if (x + cw > LARG) { x = 0; y += rh; rh = 0; } lay[n] = { x, y, w: cw, h: ch, ix: x + M, iy: y + M, iw: w, ih: h, oy: p.oy, espelhada: !!p.espelhada }; x += cw; rh = Math.max(rh, ch); }
    const H = y + rh, cv = document.createElement('canvas'); cv.width = LARG; cv.height = H; const c = cv.getContext('2d');
    for (const [n, p] of itens) c.drawImage(p.c, lay[n].ix, lay[n].iy);
    return JSON.stringify({ png: cv.toDataURL('image/png'), lay, LARG, H }); })()`;
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true }); const v = r.result.result.value; if (!v) throw new Error('falhou: ' + JSON.stringify(r.result));
  const o = JSON.parse(v); fs.writeFileSync(OUT + 'folha_para_editar.png', Buffer.from(o.png.split(',')[1], 'base64'));
  fs.writeFileSync(OUT + 'folha_layout.json', JSON.stringify({ largura: o.LARG, altura: o.H, margem: MARGEM, itens: o.lay }, null, 1));
  const dl = os.homedir() + '/Downloads/paredes_para_editar.png'; fs.copyFileSync(OUT + 'folha_para_editar.png', dl);
  console.log('folha ' + o.LARG + 'x' + o.H + ' com ' + Object.keys(o.lay).length + ' peças → ' + dl);
  try { await send('Browser.close'); } catch { }
} finally { bye(); }
