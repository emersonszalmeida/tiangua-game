import {spawnSync} from 'node:child_process'; import {decodePNG} from './pngdec.mjs';
const S=process.env.S, P=decodePNG(S+'/RU_CC.png');
for(const [hx,hy] of [[0.2,4.8],[0.5,3],[0.5,1.5],[1.5,4.5],[1.5,2.5],[2.5,4.6],[3.5,4.8],[2,1],[0.3,0.4],[3.5,2.5]]){
  spawnSync('node',['test_print83.mjs','porta',S,String(hx),String(hy),'door'],{encoding:'utf8'});
  const G=decodePNG(S+'/p83_porta.png'); const vx=Math.round(700+(-5-(hx-hy))*128), vy=Math.round(435+(5-(hx+hy))*64);
  let best=0,t=0; let bx=0,by=0;
  for(let dy=-4;dy<=4;dy+=1)for(let dx=-4;dx<=4;dx+=1){let m=0;t=0;for(let y=0;y<P.h;y+=1)for(let x=0;x<P.w;x++){const i=(y*P.w+x)*4;if(!P.data[i+3])continue;t++;const X=vx-10+dx+2*x,Y=vy-250+dy+2*y;if(X<0||Y<0||X>=1140||Y>=G.h)continue;const j=(Y*G.w+X)*4;if(Math.abs(G.data[j]-P.data[i])+Math.abs(G.data[j+1]-P.data[i+1])+Math.abs(G.data[j+2]-P.data[i+2])<20)m++;}if(m>best){best=m;bx=dx;by=dy;}}
  console.log(hx,hy,'vertice',vx,vy,'ajuste',bx,by,'casa',(100*best/t).toFixed(1)+'%');
}
