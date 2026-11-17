// Reconstrução do mapa do print 83 (edifício 4x5, quartinho 2x2 com porta, porta da frente) para conferir as paredes da frente
import { spawnSync } from 'node:child_process';
const S = process.argv[3] || 'C:/Users/EMERSO~1.DIA/AppData/Local/Temp/claude/beee3ef7ee05daa6/dc1e5392-d1dd-4955-a9e4-0bfb436e16d2/scratchpad';
const variante = process.argv[2] || 'porta';   // o que é a célula da frente (x=4, n=1): porta | mid | high
const pre = `(() => { pisos = new Set(); paredes = [];
  for (let x = 0; x <= 3; x++) for (let y = 0; y <= 4; y++) pisos.add(x + ',' + y);
  const add = (a, c, n, k = 'high') => paredes.push({ a, c, n, k });
  for (let x = 0; x <= 3; x++) { add('x', 0, x); add('x', 5, x); }
  for (let y = 0; y <= 4; y++) { add('y', 0, y); add('y', 4, y); }
  for (let x = 0; x <= 1; x++) add('x', 2, x);
  add('y', 2, 0, '${process.argv[6] || 'door'}'); add('y', 2, 1);
  const f = paredes.find(p => p.a === 'y' && p.c === 4 && p.n === 1); f.k = '${variante}';
  recalcParedes(); editar = false; ui.style.display = 'none';
  hx = ${process.argv[4] || 1.8}; hy = ${process.argv[5] || 0.5}; return 'ok'; })()`;
const r = spawnSync('node', ['cdpshot.mjs', 'file:///C:/Users/emerson.souza.DIAMANTES/tiangua-game/chao.html?novo&z=2', `${S}/p83_${variante}.png`, '4', '1400', '870', pre], { encoding: 'utf8' });
console.log(variante, (r.stdout || '').trim().split('\n').slice(-1).join(''));
