import fs from 'node:fs'; import {createRequire} from 'node:module'; import {encodePNG} from './pngenc.mjs';
const require=createRequire(import.meta.url); const {GifReader}=require('omggif');
const r=new GifReader(fs.readFileSync(process.argv[2])); const w=r.width,h=r.height,n=r.numFrames(); console.log(w,h,n,[...Array(n)].map((_,i)=>r.frameInfo(i).delay).join(','));
const cols=Math.min(n,8),rows=Math.ceil(n/cols),K=+process.argv[4]||3,W=cols*w*K,H=rows*h*K,out=new Uint8Array(W*H*4);
for(let i=0;i<W*H;i++){out[i*4]=90;out[i*4+1]=90;out[i*4+2]=110;out[i*4+3]=255;}
const cur=new Uint8Array(w*h*4);
for(let f=0;f<n;f++){const fi=r.frameInfo(f);r.decodeAndBlitFrameRGBA(f,cur);const ox=(f%cols)*w*K,oy=Math.floor(f/cols)*h*K;
 for(let y=0;y<h*K;y++)for(let x=0;x<w*K;x++){const s=((y/K|0)*w+(x/K|0))*4;if(cur[s+3]){const d=((oy+y)*W+ox+x)*4;out[d]=cur[s];out[d+1]=cur[s+1];out[d+2]=cur[s+2];}}}
fs.writeFileSync(process.argv[3],encodePNG(W,H,out));
