// MASK (apos mask()) -> esqueleto -> grafo. Coordenadas em pixels da imagem retificada (escala .5 da impressao)
window.grafo=(minArea,poda)=>{const W=RET.width,Hh=RET.height,N=W*Hh,m=Uint8Array.from(MASK);
 // recorta ao quadro do mapa (impressao 795..4166 x 403..3280, escala .5) e tira componentes pequenos
 const X0=Math.round(795*.5)+6,X1=Math.round(4166*.5)-2,Y0=Math.round(402.6*.5)+4,Y1=Math.round(3280.5*.5)-2;
 for(let y=0;y<Hh;y++)for(let x=0;x<W;x++)if(x<X0||x>X1||y<Y0||y>Y1)m[y*W+x]=0;
 const lab=new Int32Array(N);let nc=0;const st=[];
 for(let i=0;i<N;i++)if(m[i]&&!lab[i]){nc++;let cnt=0;const pl=[i];lab[i]=nc;while(pl.length){const p=pl.pop();cnt++;st.push(p);const x=p%W,y=(p/W)|0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const q=(y+dy)*W+x+dx;if(m[q]&&!lab[q]){lab[q]=nc;pl.push(q);}}}
  if(cnt<minArea){for(let k=st.length-cnt;k<st.length;k++)m[st[k]]=0;}st.length=0;}
 // espessura: distancia ate o fundo (chanfro 2 passadas)
 const D=new Float32Array(N);for(let i=0;i<N;i++)D[i]=m[i]?1e4:0;
 for(let y=1;y<Hh-1;y++)for(let x=1;x<W-1;x++){const i=y*W+x;if(!m[i])continue;D[i]=Math.min(D[i],D[i-1]+1,D[i-W]+1,D[i-W-1]+1.414,D[i-W+1]+1.414);}
 for(let y=Hh-2;y>0;y--)for(let x=W-2;x>0;x--){const i=y*W+x;if(!m[i])continue;D[i]=Math.min(D[i],D[i+1]+1,D[i+W]+1,D[i+W+1]+1.414,D[i+W-1]+1.414);}
 // Zhang-Suen
 const s=Uint8Array.from(m);const nb=(i)=>[s[i-W],s[i-W+1],s[i+1],s[i+W+1],s[i+W],s[i+W-1],s[i-1],s[i-W-1]];
 let mudou=1;while(mudou){mudou=0;for(let pass=0;pass<2;pass++){const del=[];for(let y=1;y<Hh-1;y++)for(let x=1;x<W-1;x++){const i=y*W+x;if(!s[i])continue;const p=nb(i),B=p.reduce((a,b)=>a+b,0);if(B<2||B>6)continue;let A=0;for(let k=0;k<8;k++)if(!p[k]&&p[(k+1)%8])A++;if(A!==1)continue;
   if(pass===0){if(p[0]*p[2]*p[4]||p[2]*p[4]*p[6])continue;}else{if(p[0]*p[2]*p[6]||p[0]*p[4]*p[6])continue;}del.push(i);}
  if(del.length){mudou=1;for(const i of del)s[i]=0;}}}
 // poda de pontas curtas
 const cnt8=i=>{const p=nb(i);return p[0]+p[1]+p[2]+p[3]+p[4]+p[5]+p[6]+p[7];};
 for(let k=0;k<poda;k++){const del=[];for(let y=1;y<Hh-1;y++)for(let x=1;x<W-1;x++){const i=y*W+x;if(s[i]&&cnt8(i)<=1)del.push(i);}for(const i of del)s[i]=0;}
 // nos: pixels com 3+ vizinhos ou 1 vizinho
 const tipo=new Uint8Array(N);for(let y=1;y<Hh-1;y++)for(let x=1;x<W-1;x++){const i=y*W+x;if(!s[i])continue;const c=cnt8(i);tipo[i]=(c===1||c>=3)?1:0;}
 const nid=new Int32Array(N).fill(-1),nos=[];
 for(let i=0;i<N;i++)if(tipo[i]&&nid[i]<0){const id=nos.length,pl=[i],mem=[];nid[i]=id;while(pl.length){const p=pl.pop();mem.push(p);const x=p%W,y=(p/W)|0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const q=(y+dy)*W+x+dx;if(tipo[q]&&nid[q]<0){nid[q]=id;pl.push(q);}}}
  let sx=0,sy=0;for(const p of mem){sx+=p%W;sy+=(p/W)|0;}nos.push([sx/mem.length,sy/mem.length,mem]);}
 const vis=new Uint8Array(N),arestas=[];
 const viz=(i)=>{const x=i%W,y=(i/W)|0,r=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if((dx||dy)&&s[(y+dy)*W+x+dx])r.push((y+dy)*W+x+dx);return r;};
 for(let a=0;a<nos.length;a++){for(const p0 of nos[a][2])for(const q0 of viz(p0)){if(nid[q0]===a||vis[q0])continue;
   const cam=[q0];vis[q0]=1;let prev=p0,cur=q0,fim=-1;
   if(nid[q0]>=0){fim=nid[q0];}
   else while(true){const vs=viz(cur).filter(v=>v!==prev&&!(nid[v]===a&&cam.length<2));let nxt=-1;for(const v of vs){if(nid[v]>=0&&nid[v]!==a||nid[v]===a&&cam.length>6){nxt=v;break;}}if(nxt<0)nxt=vs.find(v=>!vis[v]&&nid[v]<0);if(nxt===undefined||nxt<0)break;
     if(nid[nxt]>=0){fim=nid[nxt];break;}vis[nxt]=1;cam.push(nxt);prev=cur;cur=nxt;}
   if(fim<0||(fim===a&&cam.length<8))continue;
   let es=0;for(const p of cam)es+=D[p];
   arestas.push({a,b:fim,w:+(2*es/cam.length).toFixed(1),p:[nos[a][0],nos[a][1],...cam.flatMap(p=>[p%W,(p/W)|0]),nos[fim][0],nos[fim][1]]});}}
 window.GRAFO={nos:nos.map(n=>[+n[0].toFixed(1),+n[1].toFixed(1)]),arestas};
 // desenha o esqueleto para conferir
 const cv=document.getElementById('c'),g=cv.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,W,Hh);g.strokeStyle='#000';g.lineWidth=2;
 for(const e of arestas){g.beginPath();g.moveTo(e.p[0],e.p[1]);for(let k=2;k<e.p.length;k+=2)g.lineTo(e.p[k],e.p[k+1]);g.stroke();}
 g.fillStyle='#d00';for(const n of nos)g.fillRect(n[0]-2,n[1]-2,4,4);
 return nos.length+' nos, '+arestas.length+' arestas';};
window.exporta=()=>JSON.stringify(window.GRAFO);
