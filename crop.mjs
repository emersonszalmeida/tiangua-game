import fs from 'node:fs'; import {decodePNG} from './pngdec.mjs'; import {encodePNG} from './pngenc.mjs';
const [,, inp,outp,x0,y0,w,h,k]=process.argv; const S=decodePNG(inp); const K=+k||6;
const d=new Uint8Array(w*K*h*K*4);
for(let y=0;y<h*K;y++)for(let x=0;x<w*K;x++){const i=((+y0+(y/K|0))*S.w+(+x0+(x/K|0)))*4,j=(y*w*K+x)*4;for(let c=0;c<4;c++)d[j+c]=S.data[i+c];}
fs.writeFileSync(outp,encodePNG(w*K,h*K,d));
