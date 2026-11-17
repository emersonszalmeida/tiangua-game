import { spawnSync } from 'node:child_process';
const S='C:/Users/EMERSO~1.DIA/AppData/Local/Temp/claude/beee3ef7ee05daa6/dc1e5392-d1dd-4955-a9e4-0bfb436e16d2/scratchpad';
const out=process.argv[2]||'p96a', hx=process.argv[3]||2.5, hy=process.argv[4]||1.4;
const pre=`(() => { pisos = new Set(); paredes = [];
 for (let x=0;x<=1;x++) for (let y=0;y<=1;y++) pisos.add(x+','+y);
 const add=(a,c,n,k='high')=>paredes.push({a,c,n,k});
 for (let n=0;n<=1;n++){add('x',0,n);add('x',2,n);add('y',0,n);add('y',2,n,n===0?'door':'high');}
 add('x',0,2); add('x',2,2); add('y',0,-1);
 recalcParedes(); editar=false; ui.style.display='none'; hx=${hx}; hy=${hy}; return 'ok'; })()`;
const r=spawnSync('node',['cdpshot.mjs','file:///C:/Users/emerson.souza.DIAMANTES/tiangua-game/chao.html?novo&z=2',`${S}/${out}.png`,'4','1400','870',pre],{encoding:'utf8'});
console.log((r.stdout||'').trim().split('\n').slice(-1).join(''));
