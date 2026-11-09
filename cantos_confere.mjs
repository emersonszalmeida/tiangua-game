// Confere pixel a pixel o que o JOGO (chao.html) desenha em cada situação de canto contra o que o dono desenhou na folha exportada.
// uso: node cantos_confere.mjs [export.png=cantos_editar/exportado_1.png] [pasta de saída das imagens de diferença]
// Para cada situação monta as paredes altas ao redor de um vértice, tira print do jogo em zoom 1 (1 px = 1 px) e compara o quadro (40x108) com a folha: só os pixels que a folha tem (alpha>0).
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { decodePNG } from './pngdec.mjs';
import { encodePNG } from './pngenc.mjs';
const exp = decodePNG(process.argv[2] || './cantos_editar/exportado_1.png'), outDir = process.argv[3] || '', lay = JSON.parse(fs.readFileSync('./cantos_editar/folha_layout.json', 'utf8'));
const edge = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(p => fs.existsSync(p));
const W = 1100, H = 700, prof = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-')), port = 9300 + Math.floor(Math.random() * 500);
const proc = spawn(edge, ['--headless=new', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, `--window-size=${W},${H}`, 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms)); let done = false;
const bye = () => { if (done) return; done = true; try { spawnSync('taskkill', ['/PID', String(proc.pid), '/T', '/F'], { stdio: 'ignore' }); } catch { } try { proc.kill(); } catch { }
  try { spawnSync('powershell', ['-NoProfile', '-Command', "Get-CimInstance Win32_Process -Filter \"Name='msedge.exe'\" | Where-Object { $_.CommandLine -like '*" + path.basename(prof) + "*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"], { stdio: 'ignore' }); } catch { } }; process.on('exit', bye);
try {
  let list; for (let i = 0; i < 60; i++) { try { list = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (list.find(t => t.type === 'page')) break; } catch { } await sleep(500); }
  const ws = new WebSocket(list.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  let id = 0; const pend = new Map(); ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Runtime.enable'); await send('Page.enable'); await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: pathToFileURL(path.resolve('./chao.html')).href + '?novo&z=1&x=20&y=20' }); await sleep(3500);
  await send('Runtime.evaluate', { expression: 'PERS.draw = () => {}; editar = false; atualizaUi(); K = 1; 1' });
  let totalIg = 0, totalDif = 0;
  for (const [nome, L] of Object.entries(lay.itens)) {
    const fl = L.flags, V = 20, js = `(() => { paredes.length = 0; pisos.clear(); objetos.length = 0; const f = ${JSON.stringify(fl)};
      if (f.includes('L')) paredes.push({ a: 'x', c: ${V}, n: ${V - 1}, k: 'high' }); if (f.includes('R')) paredes.push({ a: 'x', c: ${V}, n: ${V}, k: 'high' }); if (f.includes('U')) paredes.push({ a: 'y', c: ${V}, n: ${V - 1}, k: 'high' }); if (f.includes('D')) paredes.push({ a: 'y', c: ${V}, n: ${V}, k: 'high' });
      recalcParedes(); hx = ${V}; hy = ${V}; return JSON.stringify(postes.map(q => q.cfg)); })()`;
    const cfgs = (await send('Runtime.evaluate', { expression: js, returnByValue: true })).result.result.value; await sleep(450);
    const shot = await send('Page.captureScreenshot', { format: 'png' }); const tmp = path.join(prof, 's.png'); fs.writeFileSync(tmp, Buffer.from(shot.result.data, 'base64')); const G = decodePNG(tmp);
    const cx = Math.round(W / 2), cy = Math.round(H / 2); let ig = 0, dif = 0; const lista = [], diff = new Uint8Array(L.fw * L.fh * 4);
    for (let j = 0; j < L.fh; j++) for (let i = 0; i < L.fw; i++) { const e = ((L.fy + j) * exp.w + L.fx + i) * 4; if (!exp.data[e + 3]) continue;
      const g = ((cy - (L.vy - L.fy) + j) * G.w + (cx - (L.vx - L.fx) + i)) * 4, same = G.data[g] === exp.data[e] && G.data[g + 1] === exp.data[e + 1] && G.data[g + 2] === exp.data[e + 2];
      if (same) ig++; else { dif++; if (lista.length < 8) lista.push('(' + i + ',' + j + ') folha ' + exp.data[e] + ',' + exp.data[e + 1] + ',' + exp.data[e + 2] + ' · jogo ' + G.data[g] + ',' + G.data[g + 1] + ',' + G.data[g + 2]); diff.set([255, 0, 0, 255], (j * L.fw + i) * 4); } }
    totalIg += ig; totalDif += dif; console.log(nome.padEnd(10), 'peças no vértice:', cfgs, '| iguais', ig, '| DIFERENTES', dif, dif ? '\n     ' + lista.join('\n     ') : '');
    if (outDir && dif) { fs.mkdirSync(outDir, { recursive: true }); fs.writeFileSync(path.join(outDir, nome + '_dif.png'), encodePNG(L.fw, L.fh, diff)); }
  }
  console.log('TOTAL iguais', totalIg, '· diferentes', totalDif);
  try { await send('Browser.close'); } catch { }
} finally { bye(); }
