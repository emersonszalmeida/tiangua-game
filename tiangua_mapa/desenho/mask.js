window.mask=(ratio,bl,rad,win)=>{const d=RET.data,W=RET.width,Hh=RET.height,N=W*Hh,gr=new Float32Array(N);
 for(let i=0;i<N;i++)gr[i]=(d[i*4]+d[i*4+1]+d[i*4+2])/3;
 // fundo local = media em janela (integral)
 const I=new Float64Array((W+1)*(Hh+1));for(let y=0;y<Hh;y++){let s=0;for(let x=0;x<W;x++){s+=gr[y*W+x];I[(y+1)*(W+1)+x+1]=I[y*(W+1)+x+1]+s;}}
 const m=new Uint8Array(N);
 for(let y=0;y<Hh;y++)for(let x=0;x<W;x++){const x0=Math.max(0,x-win),x1=Math.min(W,x+win+1),y0=Math.max(0,y-win),y1=Math.min(Hh,y+win+1);const bg=(I[y1*(W+1)+x1]-I[y0*(W+1)+x1]-I[y1*(W+1)+x0]+I[y0*(W+1)+x0])/((x1-x0)*(y1-y0));const i=y*W+x;m[i]=(gr[i]<bg*ratio&&d[i*4+2]-d[i*4]>bl)?1:0;}
 const er=(a)=>{const o=new Uint8Array(N);for(let y=rad;y<Hh-rad;y++)for(let x=rad;x<W-rad;x++){let ok=1;for(let dy=-rad;dy<=rad&&ok;dy++)for(let dx=-rad;dx<=rad;dx++)if(!a[(y+dy)*W+x+dx]){ok=0;break;}o[y*W+x]=ok;}return o;};
 const di=(a)=>{const o=new Uint8Array(N);for(let y=rad;y<Hh-rad;y++)for(let x=rad;x<W-rad;x++){if(!a[y*W+x])continue;for(let dy=-rad;dy<=rad;dy++)for(let dx=-rad;dx<=rad;dx++)o[(y+dy)*W+x+dx]=1;}return o;};
 const r=di(er(m));window.MASK=r;const cv=document.getElementById('c'),g=cv.getContext('2d'),o=g.createImageData(W,Hh);let n=0;
 for(let i=0;i<N;i++){const v=r[i]?0:255;n+=r[i];o.data[i*4]=o.data[i*4+1]=o.data[i*4+2]=v;o.data[i*4+3]=255;}g.putImageData(o,0,0);return n;};
