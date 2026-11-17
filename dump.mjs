import fs from 'node:fs'; import {decodePNG} from './pngdec.mjs';
eval(fs.readFileSync('casa_pecas_dados.js','utf8').replace('const PECAS','globalThis.PECAS'));
import {writeFileSync} from 'node:fs';
const nm=process.argv[2], [r0,r1]=[+process.argv[3],+process.argv[4]];
const p=PECAS[nm]; writeFileSync('_t.png',Buffer.from(p.src.split(',')[1],'base64')); const S=decodePNG('_t.png');
console.log(nm,S.w,S.h,p.ax,p.ay);
for(let y=r0;y<=r1;y++){let s=String(y).padStart(3)+' ';for(let x=0;x<Math.min(S.w,14);x++){const i=(y*S.w+x)*4;s+=S.data[i+3]?(S.data[i]<120?'#':S.data[i]<165?'o':'.'):' ';}console.log(s);}
