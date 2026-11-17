import {decodePNG} from './pngdec.mjs';
const G=decodePNG(process.argv[2]), P=decodePNG(process.argv[3]);
let best=null;
for(let oy=+process.argv[4];oy<+process.argv[4]+60;oy++)for(let ox=+process.argv[5];ox<+process.argv[5]+30;ox++){let m=0,t=0;for(let y=0;y<P.h;y++)for(let x=0;x<P.w;x++){const i=(y*P.w+x)*4;if(!P.data[i+3])continue;t++;const j=((oy+2*y)*G.w+ox+2*x)*4;if(Math.abs(G.data[j]-P.data[i])+Math.abs(G.data[j+1]-P.data[i+1])+Math.abs(G.data[j+2]-P.data[i+2])<20)m++;}
 if(!best||m>best.m)best={ox,oy,m,t};}
console.log(best);
const {ox,oy}=best;
for(let y=+process.argv[6];y<+process.argv[7];y++){let s=String(y).padStart(3)+' ';for(let x=0;x<34;x++){const i=(y*P.w+x)*4,j=((oy+2*y)*G.w+ox+2*x)*4;const pa=P.data[i+3]>0;const same=Math.abs(G.data[j]-P.data[i])+Math.abs(G.data[j+1]-P.data[i+1])+Math.abs(G.data[j+2]-P.data[i+2])<20;const gdark=G.data[j]<70&&G.data[j+1]<70;s+=pa?(same?'=':'x'):(gdark?'G':' ');}console.log(s);}
