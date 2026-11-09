// Folhas para o dono desenhar TODAS as possibilidades de cantos/pontas/encontros no editor-pixel (peças únicas), em 3 alturas de parede:
// A = alta (92 px), M = média (26 px, a parede cortada), B = baixa (12 px). Cada quadro mostra as paredes que chegam num vértice e uma moldura magenta onde se desenha.
//  - cantos_uniformes: toda situação de vértice com todas as paredes da MESMA altura (15 situações x 3 alturas)
//  - cantos_mistos:    paredes de alturas diferentes no mesmo vértice (alta + média: é o caso de uma sala aberta, com as paredes da frente cortadas)
// Saída: cantos_todos/<folha>/folha_para_editar.png, base.png, folha_layout.json e Downloads/cantos_<folha>.png
// Depois de editar e exportar: node cantos_todos_aplicar_edicoes.mjs <folha> <png exportado>
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const edge = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(p => fs.existsSync(p));
// situações de vértice: [nome, letras das paredes que chegam]. L = ↘ chegando pela esquerda (ponta que olha para a câmera), R = ↘ saindo para a direita (ponta do fundo),
// U = ↙ chegando por cima (ponta que olha para a câmera), D = ↙ saindo para baixo (ponta do fundo)
const CFG = [['ponta_dir', 'L'], ['ponta_esq', 'U'], ['fundo_R', 'R'], ['fundo_D', 'D'], ['canto_LU', 'LU'], ['canto_RD', 'RD'], ['canto_LD', 'LD'], ['canto_RU', 'RU'], ['t_LRD', 'LRD'], ['t_LRU', 'LRU'], ['t_UDL', 'DLU'], ['t_UDR', 'DRU'], ['cruz', 'DLRU'], ['reta_LR', 'LR'], ['reta_UD', 'UD']];
const uniformes = [], mistos = [];
for (const [nome, fl] of CFG) {
  const letras = [...fl], reta = nome.startsWith('reta');
  for (const h of reta ? [] : ['A', 'M', 'B']) uniformes.push({ nome: nome + '__' + letras.map(l => l + h).join('_'), cfg: nome, arms: letras.map(l => [l, h]) });
  if (letras.length >= 2) for (let m = 0; m < (1 << letras.length); m++) { const hs = letras.map((_, i) => (m >> i) & 1 ? 'M' : 'A'); if (hs.every(x => x === hs[0])) continue; mistos.push({ nome: nome + '__' + letras.map((l, i) => l + hs[i]).join('_'), cfg: nome, arms: letras.map((l, i) => [l, hs[i]]) }); }
}
console.log('uniformes', uniformes.length, '· mistos', mistos.length);
const fazFolha = async (id, itens) => {
  const OUT = './cantos_todos/' + id + '/'; fs.mkdirSync(OUT, { recursive: true });
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
    const expr = `(() => { const P = PAREDES.PIECE, ITENS = ${JSON.stringify(itens)}, ALT = { A: 92, M: 26, B: 12 }, PC = { A: 'High', M: 'Mid', B: 'Low' };
      const SW = 170, MG = 6, COLS = 5, FW = 40, sx = (x, y) => (x - y) * 64, sy = (x, y) => (x + y) * 32, V = 20, lay = {};
      // altura da célula: a maior parede + folga; posição por linhas
      const dims = ITENS.map(it => { const hm = Math.max(...it.arms.map(a => ALT[a[1]])); return { hm, VY: hm + 40, SH: hm + 80, FH: hm + 16 }; });
      let x = 0, y = 0, rh = 0; const pos = [];
      ITENS.forEach((it, k) => { const d = dims[k], cw = SW + 2 * MG, ch = d.SH + 2 * MG; if (x + cw > COLS * (SW + 2 * MG)) { x = 0; y += rh; rh = 0; } pos.push([x + MG, y + MG]); x += cw; rh = Math.max(rh, ch); });
      const W = COLS * (SW + 2 * MG), H = y + rh, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
      ITENS.forEach((it, k) => { const d = dims[k], [ox, oy] = pos[k], VX = 85, VY = d.VY, itens = it.arms.map(([l, h]) => ({ l, h, a: (l === 'L' || l === 'R') ? 'x' : 'y', n: l === 'L' || l === 'U' ? V - 1 : V, key: (l === 'L' || l === 'U' ? V - .5 : V + .5) + V }));
        itens.sort((p, q) => p.key - q.key); c.save(); c.beginPath(); c.rect(ox, oy, SW, d.SH); c.clip();
        for (const a of itens) { const pc = P[a.a + PC[a.h]], X = a.a === 'x' ? sx(a.n, V) : sx(V, a.n), Y = a.a === 'x' ? sy(a.n, V) : sy(V, a.n), bx = ox + VX + X - sx(V, V), by = oy + VY + Y - sy(V, V) - pc.oy + 1;
          if (a.a === 'x') c.drawImage(pc.c, bx, by); else { c.save(); c.translate(bx, by); c.scale(-1, 1); c.drawImage(pc.c, 0, 0); c.restore(); } }
        c.restore();
        lay[it.nome] = { cfg: it.cfg, arms: it.arms, h: d.hm, x: ox, y: oy, w: SW, hh: d.SH, fx: ox + VX - 20, fy: oy + VY - (d.hm + 8), fw: FW, fh: d.FH, vx: ox + VX, vy: oy + VY }; });
      const base = cv.toDataURL('image/png'); c.fillStyle = '#ff00ff';
      for (const L of Object.values(lay)) { c.fillRect(L.fx - 1, L.fy - 1, L.fw + 2, 1); c.fillRect(L.fx - 1, L.fy + L.fh, L.fw + 2, 1); c.fillRect(L.fx - 1, L.fy, 1, L.fh); c.fillRect(L.fx + L.fw, L.fy, 1, L.fh); }
      return JSON.stringify({ base, png: cv.toDataURL('image/png'), lay, W, H }); })()`;
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true }); const v = r.result.result.value; if (!v) throw new Error('falhou: ' + JSON.stringify(r.result).slice(0, 600));
    const o = JSON.parse(v), sv = (u, f) => fs.writeFileSync(f, Buffer.from(u.split(',')[1], 'base64'));
    sv(o.png, OUT + 'folha_para_editar.png'); sv(o.base, OUT + 'base.png'); fs.writeFileSync(OUT + 'folha_layout.json', JSON.stringify({ largura: o.W, altura: o.H, itens: o.lay }, null, 1));
    const dl = os.homedir() + '/Downloads/cantos_' + id + '.png'; fs.copyFileSync(OUT + 'folha_para_editar.png', dl); console.log(id + ': ' + o.W + 'x' + o.H + ' com ' + Object.keys(o.lay).length + ' quadros → ' + dl);
    try { await send('Browser.close'); } catch { }
  } finally { bye(); }
};
await fazFolha('uniformes', uniformes); await fazFolha('mistos', mistos);
