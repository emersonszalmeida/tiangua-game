import { spawnSync } from 'node:child_process';
const S = process.argv[2] || 'C:/Users/EMERSO~1.DIA/AppData/Local/Temp/claude/beee3ef7ee05daa6/dc1e5392-d1dd-4955-a9e4-0bfb436e16d2/scratchpad';
// cenas: [pisos x0..x1, y0..y1, paredes] ; x-wall {a:'x',c:linha y,n:célula x}; y-wall {a:'y',c:linha x,n:célula y}
const cenas = {
  sala: { x: [4, 6], y: [4, 6], div: [] },
  T:    { x: [4, 9], y: [4, 6], div: [['y', 7, 4, 6]] },
  menor: { x: [1, 0], y: [1, 0], div: [['y', 5, 5, 5], ['x', 6, 5, 5]], h: [5, 6] },   // canto < (RU)
  maior: { x: [1, 0], y: [1, 0], div: [['x', 6, 4, 4], ['y', 5, 6, 6]], h: [5, 6] },   // canto > (LD)
  menorP: { x: [1, 0], y: [1, 0], div: [['y', 5, 5, 5, 'door'], ['x', 6, 5, 5]], h: [5, 6] },   // < com porta atrás
  maiorP: { x: [1, 0], y: [1, 0], div: [['x', 6, 4, 4, 'door'], ['y', 5, 6, 6]], h: [5, 6] },   // > com porta atrás
  cruz: { x: [4, 7], y: [4, 7], div: [['y', 6, 4, 7], ['x', 6, 4, 7]] },
};
const pre = (c) => `(() => { const C = ${JSON.stringify(c)}; pisos = new Set(); paredes = [];
  for (let x = C.x[0]; x <= C.x[1]; x++) for (let y = C.y[0]; y <= C.y[1]; y++) pisos.add(x + ',' + y);
  const add = (a, c, n) => { paredes.push({ a, c, n, k: 'high' }); };
  for (let x = C.x[0]; x <= C.x[1]; x++) { add('x', C.y[0], x); add('x', C.y[1] + 1, x); }
  for (let y = C.y[0]; y <= C.y[1]; y++) { add('y', C.x[0], y); add('y', C.x[1] + 1, y); }
  for (const [a, c, n0, n1, k] of C.div) for (let n = n0; n <= n1; n++) { add(a, c, n); if (k) paredes[paredes.length - 1].k = k; }
  recalcParedes(); editar = false; salaDoPersonagem = () => null; PERS.draw = () => {}; ui.style.display = 'none';
  hx = C.h ? C.h[0] : (C.x[0] + C.x[1] + 1) / 2; hy = C.h ? C.h[1] : (C.y[0] + C.y[1] + 1) / 2; return 'ok'; })()`;
const url = (k) => 'file:///C:/Users/emerson.souza.DIAMANTES/tiangua-game/chao.html?novo&z=1' + (k ? '#' + k : '');
for (const [nome, c] of Object.entries(cenas)) for (const k of [0]) {
  const r = spawnSync('node', ['cdpshot.mjs', url(k), `${S}/${nome}_k${k}.png`, '4', '1000', '700', pre(c)], { encoding: 'utf8' });
  console.log(nome, k, (r.stdout || '').trim().split('\n').slice(-2).join(' | '));
}
