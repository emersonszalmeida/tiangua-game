// Extrai quadros de um vídeo local usando o Edge headless (sem ffmpeg).
// uso: node video_quadros.mjs <video.mp4> <pasta de saída> [n quadros=12] [largura=1280] [altura=720] [inicio=0] [fim=duração]
// Grava <pasta>/q_000.png ... e imprime a duração. Fecha o Edge no fim (confira que não sobrou nenhum).
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const [arq, saida, nq = '12', W = '1280', H = '720', t0 = '0', t1 = ''] = process.argv.slice(2);
const edge = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(p => fs.existsSync(p));
const port = 9300 + Math.floor(Math.random() * 500), prof = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-'));
const proc = spawn(edge, ['--headless=new', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, `--window-size=${W},${H}`, 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let done = false; const bye = () => { if (done) return; done = true; try { spawnSync('taskkill', ['/PID', String(proc.pid), '/T', '/F'], { stdio: 'ignore' }); } catch { } try { proc.kill(); } catch { } };   process.on("exit", bye);   // mata a árvore de processos do Edge no fim
fs.mkdirSync(saida, { recursive: true });
try {
  let list; for (let i = 0; i < 60; i++) { try { list = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (list.find(t => t.type === 'page')) break; } catch { } await sleep(500); }
  const ws = new WebSocket(list.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  let id = 0; const pend = new Map(); ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Runtime.enable'); await send('Page.enable'); await send('Emulation.setDeviceMetricsOverride', { width: +W, height: +H, deviceScaleFactor: 1, mobile: false });
  // página mínima com o vídeo (file://), sem controles, preenchendo a janela
  const html = '<!doctype html><body style="margin:0;background:#000"><video id="v" muted playsinline preload="auto" style="width:100vw;height:100vh;object-fit:contain" src="' + pathToFileURL(path.resolve(arq)).href + '"></video></body>';
  const pag = path.join(prof, 'v.html'); fs.writeFileSync(pag, html); await send('Page.navigate', { url: pathToFileURL(pag).href }); await sleep(1500);
  const meta = await send('Runtime.evaluate', { awaitPromise: true, returnByValue: true, expression: `new Promise(r => { const v = document.getElementById('v'); const ok = () => r({ d: v.duration, w: v.videoWidth, h: v.videoHeight }); if (v.readyState >= 1) ok(); else { v.onloadedmetadata = ok; v.onerror = () => r({ erro: v.error && v.error.message }); setTimeout(() => r({ erro: 'timeout' }), 15000); } })` });
  const m = meta.result.result.value; console.log('vídeo:', JSON.stringify(m)); if (!m || m.erro || !m.d) throw new Error('não consegui abrir o vídeo no Edge');
  const a = +t0, b = t1 ? +t1 : m.d, n = +nq;
  for (let k = 0; k < n; k++) { const t = n === 1 ? a : a + (b - a) * k / (n - 1) * .999;
    await send('Runtime.evaluate', { awaitPromise: true, expression: `new Promise(r => { const v = document.getElementById('v'); v.onseeked = () => setTimeout(r, 150); v.currentTime = ${t.toFixed(3)}; setTimeout(r, 4000); })` });
    const r = await send('Page.captureScreenshot', { format: 'png' }); const f = path.join(saida, 'q_' + String(k).padStart(3, '0') + '.png'); fs.writeFileSync(f, Buffer.from(r.result.data, 'base64')); console.log(f, 't=' + t.toFixed(2) + 's'); }
  try { await send('Browser.close'); } catch { }
} finally { bye(); }
