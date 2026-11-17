import {spawnSync} from 'node:child_process'; import {decodePNG} from './pngdec.mjs';
const S=process.env.S;
const mk=(skip)=>`(() => { pisos = new Set(); paredes = [];
  for (let x = 0; x <= 3; x++) for (let y = 0; y <= 4; y++) pisos.add(x + ',' + y);
  const add = (a, c, n, k = 'high') => paredes.push({ a, c, n, k });
  for (let x = 0; x <= 3; x++) { add('x', 0, x); add('x', 5, x); }
  for (let y = 0; y <= 4; y++) { add('y', 0, y); add('y', 4, y); }
  for (let x = 0; x <= 1; x++) add('x', 2, x);
  add('y', 2, 0, 'door'); add('y', 2, 1);
  const f = paredes.find(p => p.a === 'y' && p.c === 4 && p.n === 1); f.k = 'door';
  recalcParedes(); editar = false; ui.style.display = 'none'; hx = 4.239; hy = -0.042; window.SKIP = new Set(${JSON.stringify(skip)});
  ${skip.length?'':"setTimeout(()=>console.log('ORD '+JSON.stringify(window.ORDEM)),1200);"} return 'ok'; })()`;
const run=(skip,out)=>{const r=spawnSync('node',['cdpshot.mjs','file:///C:/Users/emerson.souza.DIAMANTES/tiangua-game/chao.html?novo&z=2',S+'/'+out,'3','1400','870',mk(skip)],{encoding:'utf8'});return r.stdout;};
const dots=f=>{const G=decodePNG(S+'/'+f);let n=0;for(let y=250;y<310;y++)for(let x=540;x<620;x++){const j=(y*G.w+x)*4;if(G.data[j]<70&&G.data[j+1]<70)n++;}return n;};
const o=run([], 'k0.png'); const a=JSON.parse(o.slice(o.indexOf('ORD ')+4).split('\n')[0]);
console.log('base dots',dots('k0.png'),'itens',a.length);
a.forEach((s,i)=>{const m=/r=(-?\d+),(-?\d+),(\d+),(\d+)/.exec(s);if(!m)return;const [x,y,w,h]=m.slice(1).map(Number);if(x<1790&&x+w>1700&&y<75&&y+h>35){run([i],'k1.png');console.log(i,s,'-> dots sem ele',dots('k1.png'));}});
