import fs from 'node:fs'; import {decodePNG} from './pngdec.mjs';
eval(fs.readFileSync('casa_pecas_dados.js','utf8').replace('const PECAS','globalThis.PECAS'));
for(const nm of Object.keys(PECAS)){const p=PECAS[nm];fs.writeFileSync('_t.png',Buffer.from(p.src.split(',')[1],'base64'));const S=decodePNG('_t.png');
 const a=(x,y)=>x>=0&&y>=0&&x<S.w&&y<S.h&&S.data[(y*S.w+x)*4+3]>0;
 const out=[];for(let y=0;y<S.h;y++)for(let x=0;x<S.w;x++){if(!a(x,y))continue;let n=0;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]])if(a(x+dx,y+dy))n++;if(n<=1)out.push(x+','+y);}
 if(out.length)console.log(nm,out.join(' '));}
