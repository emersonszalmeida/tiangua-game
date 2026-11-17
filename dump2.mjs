import fs from 'node:fs'; import {decodePNG} from './pngdec.mjs';
eval(fs.readFileSync('casa_pecas_dados.js','utf8').replace('const PECAS','globalThis.PECAS'));
const [nm,x0,x1,y0,y1]=[process.argv[2],...process.argv.slice(3).map(Number)];
const p=PECAS[nm];fs.writeFileSync('_t.png',Buffer.from(p.src.split(',')[1],'base64'));const S=decodePNG('_t.png');
for(let y=y0;y<=y1;y++){let s=String(y).padStart(3)+' ';for(let x=x0;x<=x1;x++){const i=(y*S.w+x)*4;s+=S.data[i+3]?(S.data[i]<120?'#':S.data[i]<165?'o':'.'):' ';}console.log(s);}
