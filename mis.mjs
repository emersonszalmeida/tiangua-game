import {decodePNG} from './pngdec.mjs';
const S=process.env.S,P=decodePNG(S+'/RU_CC.png'),G=decodePNG(S+'/p83_porta.png');const vx=+process.argv[2],vy=+process.argv[3];let out=[];
for(let y=0;y<P.h;y++)for(let x=0;x<P.w;x++){const i=(y*P.w+x)*4;if(!P.data[i+3])continue;const X=vx-10+2*x,Y=vy-250+2*y,j=(Y*G.w+X)*4;if(Math.abs(G.data[j]-P.data[i])+Math.abs(G.data[j+1]-P.data[i+1])+Math.abs(G.data[j+2]-P.data[i+2])>=20)out.push(x+','+y+' g='+G.data[j]+','+G.data[j+1]+','+G.data[j+2]+' p='+P.data[i]+','+P.data[i+1]+','+P.data[i+2]);}
console.log(out.length);console.log(out.slice(0,40).join('\n'));
