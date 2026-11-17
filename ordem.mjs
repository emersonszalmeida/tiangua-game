import {spawnSync} from 'node:child_process';
const S=process.env.S,[hx,hy]=[process.argv[2],process.argv[3]];
const pre=`(() => { pisos = new Set(); paredes = [];
  for (let x = 0; x <= 3; x++) for (let y = 0; y <= 4; y++) pisos.add(x + ',' + y);
  const add = (a, c, n, k = 'high') => paredes.push({ a, c, n, k });
  for (let x = 0; x <= 3; x++) { add('x', 0, x); add('x', 5, x); }
  for (let y = 0; y <= 4; y++) { add('y', 0, y); add('y', 4, y); }
  for (let x = 0; x <= 1; x++) add('x', 2, x);
  add('y', 2, 0, 'door'); add('y', 2, 1);
  const f = paredes.find(p => p.a === 'y' && p.c === 4 && p.n === 1); f.k = 'door';
  recalcParedes(); editar = false; ui.style.display = 'none'; hx = ${hx}; hy = ${hy};
  setTimeout(()=>console.log('ORD '+JSON.stringify(window.ORDEM)),1500); return 'ok'; })()`;
const r=spawnSync('node',['cdpshot.mjs','file:///C:/Users/emerson.souza.DIAMANTES/tiangua-game/chao.html?novo&z=2',S+'/o.png','4','1400','870',pre],{encoding:'utf8'});
console.log(r.stdout);
