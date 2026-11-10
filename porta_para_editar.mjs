// Gera Downloads/portas_para_editar.png: as 4 portas que o jogo desenha hoje (alta e média, ↘ e ↙), sem moldura, fundo transparente, 1 tile de largura cada (para o dono redesenhar no editor-pixel)
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const edge = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(p => fs.existsSync(p));
const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-')), pag = path.join(prof, 'p.html'); fs.writeFileSync(pag, '<!doctype html><meta charset="utf-8"><body><script>' + fs.readFileSync('./paredes.js', 'utf8') + '</script></body>');
const port = 9300 + Math.floor(Math.random() * 500), proc = spawn(edge, ['--headless=new', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, '--window-size=900,600', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms)); let done = false;
const bye = () => { if (done) return; done = true; try { spawnSync('taskkill', ['/PID', String(proc.pid), '/T', '/F'], { stdio: 'ignore' }); } catch { } try { proc.kill(); } catch { }
  try { spawnSync('powershell', ['-NoProfile', '-Command', "Get-CimInstance Win32_Process -Filter \"Name='msedge.exe'\" | Where-Object { $_.CommandLine -like '*" + path.basename(prof) + "*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"], { stdio: 'ignore' }); } catch { } }; process.on('exit', bye);
try {
  let list; for (let i = 0; i < 60; i++) { try { list = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (list.find(t => t.type === 'page')) break; } catch { } await sleep(500); }
  const ws = new WebSocket(list.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  let idc = 0; const pend = new Map(); ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
  const send = (method, params = {}) => new Promise(r => { const i = ++idc; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Runtime.enable'); await send('Page.enable'); await send('Page.navigate', { url: pathToFileURL(pag).href }); await sleep(1500);
  const expr = `(() => { const P = PAREDES.PIECE, nomes = ['xDoor', 'yDoor', 'xDoorMid', 'yDoorMid'], G = 24; let W = G, H = 0; for (const n of nomes) { W += P[n].c.width + G; H = Math.max(H, P[n].c.height); }
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H + 2 * G; const c = cv.getContext('2d'); let x = G; const info = {};
    for (const n of nomes) { const p = P[n]; c.drawImage(p.c, x, G + (H - p.c.height)); info[n] = [x, G + (H - p.c.height), p.c.width, p.c.height, p.oy]; x += p.c.width + G; }
    return JSON.stringify({ png: cv.toDataURL('image/png'), info, W, H: cv.height }); })()`;
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true }), o = JSON.parse(r.result.result.value);
  const dl = os.homedir() + '/Downloads/portas_para_editar.png'; fs.writeFileSync(dl, Buffer.from(o.png.split(',')[1], 'base64')); fs.mkdirSync('./portas_editar', { recursive: true }); fs.copyFileSync(dl, './portas_editar/portas_para_editar.png'); fs.writeFileSync('./portas_editar/layout.json', JSON.stringify(o, null, 1));
  console.log(o.W + 'x' + o.H, JSON.stringify(o.info)); try { await send('Browser.close'); } catch { }
} finally { bye(); }
