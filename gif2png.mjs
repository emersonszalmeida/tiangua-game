import fs from 'node:fs'; import {createRequire} from 'node:module'; import {encodePNG} from './pngenc.mjs';
const require=createRequire(import.meta.url); const {GifReader}=require('omggif');
const r=new GifReader(fs.readFileSync(process.argv[2])),w=r.width,h=r.height,n=r.numFrames(),dir=process.argv[3];
const W=w*n,sheet=new Uint8Array(W*h*4),cur=new Uint8Array(w*h*4);
for(let f=0;f<n;f++){r.decodeAndBlitFrameRGBA(f,cur);fs.writeFileSync(`${dir}/porta_${f+1}.png`,encodePNG(w,h,cur));
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const s=(y*w+x)*4,d=(y*W+f*w+x)*4;for(let c=0;c<4;c++)sheet[d+c]=cur[s+c];}}
fs.writeFileSync(`${dir}/porta_folha.png`,encodePNG(W,h,sheet));console.log(w,h,n);
