import {spawnSync} from 'node:child_process'; import fs from 'node:fs';
const S=process.env.S;
const base=fs.readFileSync('test_print83.mjs','utf8');
for(const [hx,hy] of [[0.15,3.87],[2.5,3],[0.5,0.5],[1.5,1.5],[-1,2],[5,2],[2,6],[2,-1],[3.5,0.3],[3.2,4.5],[1.5,0.2]]){
 const pre=`(() => { pisos = new Set(); paredes = [];
  for (let x = 0; x <= 3; x++) for (let y = 0; y <= 4; y++) pisos.add(x + ',' + y);
  const add = (a, c, n, k = 'high') => paredes.push({ a, c, n, k });
  for (let x = 0; x <= 3; x++) { add('x', 0, x); add('x', 5, x); }
  for (let y = 0; y <= 4; y++) { add('y', 0, y); add('y', 4, y); }
  for (let x = 0; x <= 1; x++) add('x', 2, x);
  add('y', 2, 0, 'door'); add('y', 2, 1);
  const f = paredes.find(p => p.a === 'y' && p.c === 4 && p.n === 1); f.k = 'door';
  recalcParedes(); editar = false; ui.style.display = 'none'; hx = ${hx}; hy = ${hy}; window.SEM_PECA=[];
  setTimeout(()=>{window.SEM_PECA=[]; setTimeout(()=>console.log('SP '+JSON.stringify(window.SEM_PECA)),600)},1500); return 'ok'; })()`;
 const r=spawnSync('node',['cdpshot.mjs','file:///C:/Users/emerson.souza.DIAMANTES/tiangua-game/chao.html?novo&z=2',S+'/x.png','5','1400','870',pre],{encoding:'utf8'});
 console.log(hx,hy,(r.stdout||'').split('\n').filter(l=>l.includes('SP ')).join('|')||'(sem linha)');
}
