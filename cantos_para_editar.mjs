// Folha para o dono DESENHAR as peças dos cantos/pontas das paredes no editor-pixel (peças únicas, uma por situação).
// Cada quadro mostra as paredes (altas, só as paredes, sem nenhum pilar/face de ponta) que chegam num ponto; o dono desenha DENTRO da moldura magenta
// a peça do canto, por cima das paredes. Só o que for pintado diferente do que já está vira a peça (as paredes de fundo não entram).
// Saída: cantos_editar/folha_para_editar.png, cantos_editar/base.png (a folha original, para comparar), cantos_editar/folha_layout.json e Downloads/cantos_para_editar.png
// Depois de editar e exportar: node cantos_aplicar_edicoes.mjs <png exportado>
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const OUT = './cantos_editar/', edge = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(p => fs.existsSync(p));
fs.mkdirSync(OUT, { recursive: true });
const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-')), pag = path.join(prof, 'p.html');
fs.writeFileSync(pag, '<!doctype html><meta charset="utf-8"><body><script>' + fs.readFileSync('./paredes.js', 'utf8') + '</script></body>');
const port = 9300 + Math.floor(Math.random() * 500), proc = spawn(edge, ['--headless=new', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, '--window-size=900,600', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms)); let done = false;
const bye = () => { if (done) return; done = true; try { spawnSync('taskkill', ['/PID', String(proc.pid), '/T', '/F'], { stdio: 'ignore' }); } catch { } try { proc.kill(); } catch { }
  try { spawnSync('powershell', ['-NoProfile', '-Command', "Get-CimInstance Win32_Process -Filter \"Name='msedge.exe'\" | Where-Object { $_.CommandLine -like '*" + path.basename(prof) + "*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"], { stdio: 'ignore' }); } catch { } }; process.on('exit', bye);
try {
  let list; for (let i = 0; i < 60; i++) { try { list = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (list.find(t => t.type === 'page')) break; } catch { } await sleep(500); }
  const ws = new WebSocket(list.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  let id = 0; const pend = new Map(); ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Runtime.enable'); await send('Page.enable'); await send('Page.navigate', { url: pathToFileURL(pag).href }); await sleep(1500);
  const expr = `(() => { const P = PAREDES.PIECE, CFG = [
      ['ponta_dir', 'L'], ['ponta_esq', 'U'], ['canto_LU', 'LU'], ['canto_RD', 'RD'], ['canto_LD', 'LD'], ['canto_RU', 'RU'],
      ['t_LRD', 'LRD'], ['t_LRU', 'LRU'], ['t_UDL', 'UDL'], ['t_UDR', 'UDR'], ['cruz', 'LRUD']];
    const SW = 170, SH = 175, VX = 85, VY = 125, FX = VX - 20, FY = VY - 100, FW = 40, FH = 108, MG = 6, COLS = 4, CW = SW + 2 * MG, CH = SH + 2 * MG;
    const sx = (x, y) => (x - y) * 64, sy = (x, y) => (x + y) * 32, V = 20, lay = {};
    const W = COLS * CW, H = Math.ceil(CFG.length / COLS) * CH, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
    CFG.forEach(([nome, fl], k) => { const ox = (k % COLS) * CW + MG, oy = Math.floor(k / COLS) * CH + MG, itens = [];
      const add = (a, cc, n, key) => itens.push({ a, c: cc, n, key });
      if (fl.includes('L')) add('x', V, V - 1, V - .5 + V); if (fl.includes('R')) add('x', V, V, V + .5 + V); if (fl.includes('U')) add('y', V, V - 1, V - .5 + V); if (fl.includes('D')) add('y', V, V, V + .5 + V);
      itens.sort((p, q) => p.key - q.key);
      c.save(); c.beginPath(); c.rect(ox, oy, SW, SH); c.clip();
      for (const it of itens) { const pc = P[it.a === 'x' ? 'xHigh' : 'yHigh'], bx = ox + VX + sx(it.a === 'x' ? it.n : it.c, it.a === 'x' ? it.c : it.n) - sx(V, V), by = oy + VY + sy(it.a === 'x' ? it.n : it.c, it.a === 'x' ? it.c : it.n) - sy(V, V) - pc.oy + 1;
        if (it.a === 'x') c.drawImage(pc.c, bx, by); else { c.save(); c.translate(bx, by); c.scale(-1, 1); c.drawImage(pc.c, 0, 0); c.restore(); } }
      c.restore();
      lay[nome] = { flags: fl, x: ox, y: oy, w: SW, h: SH, fx: ox + FX, fy: oy + FY, fw: FW, fh: FH, vx: ox + VX, vy: oy + VY }; });
    const base = cv.toDataURL('image/png');
    // moldura magenta (fica FORA da área de desenho: 1 px em volta)
    c.fillStyle = '#ff00ff'; for (const L of Object.values(lay)) { c.fillRect(L.fx - 1, L.fy - 1, L.fw + 2, 1); c.fillRect(L.fx - 1, L.fy + L.fh, L.fw + 2, 1); c.fillRect(L.fx - 1, L.fy, 1, L.fh); c.fillRect(L.fx + L.fw, L.fy, 1, L.fh); }
    return JSON.stringify({ base, png: cv.toDataURL('image/png'), lay, W, H }); })()`;
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true }); const v = r.result.result.value; if (!v) throw new Error('falhou: ' + JSON.stringify(r.result).slice(0, 600));
  const o = JSON.parse(v), sv = (u, f) => fs.writeFileSync(f, Buffer.from(u.split(',')[1], 'base64'));
  sv(o.png, OUT + 'folha_para_editar.png'); sv(o.base, OUT + 'base.png');
  fs.writeFileSync(OUT + 'folha_layout.json', JSON.stringify({ largura: o.W, altura: o.H, itens: o.lay }, null, 1));
  const dl = os.homedir() + '/Downloads/cantos_para_editar.png'; fs.copyFileSync(OUT + 'folha_para_editar.png', dl);
  console.log('folha ' + o.W + 'x' + o.H + ' com ' + Object.keys(o.lay).length + ' situações → ' + dl);
  try { await send('Browser.close'); } catch { }
} finally { bye(); }
