// uso: node cdpshot.mjs <url> <saida.png> [segundos] [largura] [altura] [js-para-rodar-antes]
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const [url, out, secs = '10', W = '1200', H = '720', pre = ''] = process.argv.slice(2);
const edge = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(p => fs.existsSync(p));
const port = 9300 + Math.floor(Math.random() * 500);
const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-'));
const proc = spawn(edge, ['--headless=new', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, `--window-size=${W},${H}`, 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let done = false;
const bye = async () => { if (done) return; done = true; try { proc.kill(); } catch { } };
process.on('exit', bye);
try {
  let list;
  for (let i = 0; i < 60; i++) { try { list = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (list.find(t => t.type === 'page')) break; } catch { } await sleep(500); }
  const tgt = list.find(t => t.type === 'page');
  const ws = new WebSocket(tgt.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  let id = 0; const pend = new Map(), logs = [];
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
    else if (m.method === 'Runtime.consoleAPICalled') logs.push(m.params.type + ': ' + m.params.args.map(a => a.value ?? a.description).join(' '));
    else if (m.method === 'Runtime.exceptionThrown') logs.push('EXC: ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
  };
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Runtime.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: +W, height: +H, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url });
  await sleep(+secs * 1000);
  if (pre) { const r = await send('Runtime.evaluate', { expression: pre, awaitPromise: true }); logs.push('pre: ' + JSON.stringify(r.result?.result?.value ?? r.result?.exceptionDetails?.text)); await sleep(3000); }
  const r = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(out, Buffer.from(r.result.data, 'base64'));
  const ev = await send('Runtime.evaluate', { expression: 'document.getElementById("where")?.textContent + " | frames=" + (window.__f||0)' });
  console.log(ev.result?.result?.value);
  console.log(logs.filter(l => !/Tracking Prevention|toNonIndexed/.test(l)).slice(0, 15).join('\n'));
  try { await send('Browser.close'); } catch { }
} finally { await bye(); }
