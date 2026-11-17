import {spawnSync} from 'node:child_process'; import {decodePNG} from './pngdec.mjs';
const S=process.env.S, P=decodePNG(S+'/RU_CC.png');
for(const hx of [0.1,0.2,0.3,0.4])for(const hy of [3.6,3.8,4.0,4.2]){
  spawnSync('node',['test_print83.mjs','porta',S,String(hx),String(hy),'door'],{encoding:'utf8'});
  const G=decodePNG(S+'/p83_porta.png'); const vx=Math.round(700+(-5-(hx-hy))*128), vy=Math.round(435+(5-(hx+hy))*64);
  let bad=0,t=0;
  for(let y=15;y<60;y++)for(let x=0;x<40;x++){const i=(y*P.w+x)*4;if(!P.data[i+3])continue;t++;const X=vx-10+2*x,Y=vy-250+2*y;if(X<0||Y<0||X>=1140||Y>=G.h)continue;const j=(Y*G.w+X)*4;if(Math.abs(G.data[j]-P.data[i])+Math.abs(G.data[j+1]-P.data[i+1])+Math.abs(G.data[j+2]-P.data[i+2])>=20)bad++;}
  console.log(hx,hy,'ponta: pixels diferentes',bad,'de',t);
  if(bad>5) spawnSync('cp',[S+'/p83_porta.png',S+`/scan_${hx}_${hy}.png`]);
}
