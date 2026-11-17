// canto > com porta alta no fundo (x) e a frente (y) média, personagem dentro, zoom 2 (como o print 87)
import { spawnSync } from 'node:child_process';
const S = 'C:/Users/EMERSO~1.DIA/AppData/Local/Temp/claude/beee3ef7ee05daa6/dc1e5392-d1dd-4955-a9e4-0bfb436e16d2/scratchpad';
const px = process.argv[2] || 6.3, py = process.argv[3] || 4.8;
const pre = `(() => { pisos = new Set(); paredes = [];
  for (let x = 4; x <= 6; x++) for (let y = 4; y <= 6; y++) pisos.add(x + ',' + y);
  const add = (a, c, n, k = 'high') => paredes.push({ a, c, n, k });
  for (let x = 4; x <= 6; x++) { add('x', 4, x); add('x', 7, x); }
  for (let y = 4; y <= 6; y++) { add('y', 4, y); add('y', 7, y); }
  paredes.find(p => p.a === 'x' && p.c === 4 && p.n === 6).k = 'door';
  recalcParedes(); editar = false; ui.style.display = 'none'; hx = ${px}; hy = ${py}; return 'ok'; })()`;
spawnSync('node', ['cdpshot.mjs', 'file:///C:/Users/emerson.souza.DIAMANTES/tiangua-game/chao.html?novo&z=2', `${S}/cantoD.png`, '4', '1000', '700', pre], { encoding: 'utf8' });
