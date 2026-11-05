// Black out the view through the glass, preserving warm wooden dividers and
// foreground props. The supplied image/video pixels remain unchanged.
const room=[[.065,.133],[.166,.190],[.166,.525],[.065,.548]];
const detail=[[.200,.060],[.798,.060],[.798,.753],[.190,.753]];
const camera=[
 [0,[[.064,.12],[.177,.20],[.177,.53],[.064,.57]]],
 [.8,[[.110,.10],[.280,.20],[.280,.60],[.110,.66]]],
 [1.6,[[.160,.10],[.400,.20],[.400,.62],[.160,.68]]],
 [2.4,[[.190,.06],[.600,.13],[.600,.70],[.190,.78]]],
 [3.2,[[.190,.04],[.740,.07],[.740,.76],[.190,.83]]],
 [4.5,detail]
];
function quadAt(t){let a=camera[0],b=camera.at(-1);for(let i=1;i<camera.length;i++)if(t<=camera[i][0]){a=camera[i-1];b=camera[i];break;}const f=Math.max(0,Math.min(1,(t-a[0])/Math.max(.001,b[0]-a[0])));return a[1].map((p,i)=>p.map((v,j)=>v+(b[1][i][j]-v)*f));}
// Build the film matte from the current frame, not holes at estimated prop
// coordinates. Small stars/city lights remain part of the opaque sky matte.
function paintFilmWindow(ctx,source,q,W,H){
 ctx.drawImage(source,0,0,W,H);const rgb=ctx.getImageData(0,0,W,H).data;ctx.clearRect(0,0,W,H);
 const centre=q.reduce((p,v)=>[p[0]+v[0]/4,p[1]+v[1]/4],[0,0]),edge=q.map(p=>[centre[0]+(p[0]-centre[0])*1.05,centre[1]+(p[1]-centre[1])*1.035]);
 ctx.beginPath();edge.forEach(([x,y],i)=>ctx[i?'lineTo':'moveTo'](x*W,y*H));ctx.closePath();ctx.fillStyle='#000';ctx.fill();const area=ctx.getImageData(0,0,W,H),inside=new Uint8Array(W*H),warm=new Uint8Array(W*H),barrier=new Uint8Array(W*H),seen=new Uint8Array(W*H),queue=new Int32Array(W*H);
 for(let p=0;p<inside.length;p++){const i=p*4;inside[p]=area.data[i+3]>0?1:0;if(!inside[p])continue;const r=rgb[i],g=rgb[i+1],b=rgb[i+2];warm[p]=r>g*.95&&g>b*1.04&&r>35?1:0;}
 const size=Math.min(200,Math.max(12,18*Math.pow((q[1][0]-q[0][0])/.113,2)));
 function neighbours(p){const x=p%W;return[x?p-1:-1,x<W-1?p+1:-1,p>=W?p-W:-1,p<W*(H-1)?p+W:-1];}
 for(let p=0;p<warm.length;p++){if(!warm[p]||seen[p])continue;let head=0,tail=1;queue[0]=p;seen[p]=1;while(head<tail){const n=queue[head++];for(const k of neighbours(n))if(k>=0&&warm[k]&&!seen[k]){seen[k]=1;queue[tail++]=k;}}if(tail>=size)for(let k=0;k<tail;k++)barrier[queue[k]]=1;}
 const minX=Math.min(...q.map(p=>p[0])),maxX=Math.max(...q.map(p=>p[0])),minY=Math.min(...q.map(p=>p[1])),maxY=Math.max(...q.map(p=>p[1]));
 for(let p=0;p<inside.length;p++){if(!inside[p])continue;const x=(p%W)/W,y=Math.floor(p/W)/H,i=p*4,r=rgb[i],g=rgb[i+1],b=rgb[i+2];if(x>minX+(maxX-minX)*.78&&y>minY+(maxY-minY)*.64&&g>r*.90&&g>b*1.2)barrier[p]=1;}
 // Seal one-pixel gaps in wooden borders so picture interiors stay enclosed.
 const sealed=new Uint8Array(barrier);for(let p=0;p<barrier.length;p++)if(inside[p]&&!barrier[p]){let count=0;for(const k of neighbours(p))if(k>=0&&barrier[k])count++;if(count>=2)sealed[p]=1;}
 seen.fill(0);const output=ctx.createImageData(W,H),minimum=(maxX-minX)*W*(maxY-minY)*H*.025;
 for(let p=0;p<inside.length;p++){if(!inside[p]||sealed[p]||seen[p])continue;let head=0,tail=1;queue[0]=p;seen[p]=1;while(head<tail){const n=queue[head++];for(const k of neighbours(n))if(k>=0&&inside[k]&&!sealed[k]&&!seen[k]){seen[k]=1;queue[tail++]=k;}}let photo=tail<minimum;for(let k=0;k<tail&&photo;k++){const n=queue[k],x=(n%W)/W,y=Math.floor(n/W)/H;if(x>minX+(maxX-minX)*.23||y<minY+(maxY-minY)*.80)photo=false;}if(!photo)for(let k=0;k<tail;k++)output.data[queue[k]*4+3]=255;}
 // Locate the actual dark wooden mullion from its vertical colour signal.
 // Retain only neutral/brown pixels in that band, never purple/blue scenery.
 const span=(maxX-minX)*W,half=Math.max(2,Math.round(span*.035)),left=Math.floor((minX+(maxX-minX)*.20)*W),right=Math.ceil((minX+(maxX-minX)*.50)*W),top=Math.max(0,Math.floor((minY+(maxY-minY)*.15)*H)),bottom=Math.min(H-1,Math.ceil((minY+(maxY-minY)*.83)*H));
 const scores=new Float32Array(W);for(let x=Math.max(0,left-half);x<Math.min(W,right+half);x++)for(let y=top;y<=bottom;y+=2){const i=(y*W+x)*4;scores[x]+=rgb[i]+rgb[i+1]-2*rgb[i+2];}
 let best=left,bestScore=-Infinity;for(let x=left;x<=right;x++){let score=0;for(let d=-half;d<=half;d++)if(x+d>=0&&x+d<W)score+=scores[x+d];if(score>bestScore){bestScore=score;best=x;}}
 for(let y=Math.max(0,Math.floor(minY*H));y<Math.min(H,maxY*H);y++)for(let x=Math.max(0,best-half);x<Math.min(W,best+half);x++){const i=(y*W+x)*4,r=rgb[i],g=rgb[i+1],b=rgb[i+2];if(r>=b*.6&&g>=b*.6&&(Math.max(r,g,b)<75||g>b*1.04))output.data[i+3]=0;}
 ctx.clearRect(0,0,W,H);ctx.putImageData(output,0,0);
}
export function mountWindowDarkness(source,host,{kind='room'}={}){
 const film=source instanceof HTMLVideoElement,c=document.createElement('canvas');c.width=film?640:kind==='detail'?1910:1669;c.height=film?361:kind==='detail'?1084:942;c.className='wonder-window-darkness';c.dataset.kind=kind;c.setAttribute('aria-hidden','true');Object.assign(c.style,{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:2});host.append(c);
 const ctx=c.getContext('2d',{willReadFrequently:true});let alive=true,raf=0,request=0,reveal=null,last=-1,mediaTime=null;
 function paint(frameTime=null){if(!alive||!(film?source.readyState>=2:source.complete&&source.naturalWidth))return;const time=film?(typeof frameTime==='number'?frameTime:source.currentTime):0;if(film&&time===last)return;last=time;
  const W=c.width,H=c.height,q=film?quadAt(last):kind==='detail'?detail:room;
  if(film){ctx.clearRect(0,0,W,H);paintFilmWindow(ctx,source,q,W,H);c.dataset.ready='true';return;}
  ctx.clearRect(0,0,W,H);ctx.drawImage(source,0,0,W,H);const src=ctx.getImageData(0,0,W,H);ctx.clearRect(0,0,W,H);
  const polygon=points=>{ctx.beginPath();points.forEach(([x,y],i)=>ctx[i?'lineTo':'moveTo'](x*W,y*H));ctx.closePath();ctx.fill();};
  ctx.fillStyle='#000';polygon(q);ctx.globalCompositeOperation='destination-out';
  function ellipse(x,y,rx,ry){ctx.beginPath();ctx.ellipse(x*W,y*H,rx*W,ry*H,0,0,Math.PI*2);ctx.fill();}
  let plant;
  if(kind==='detail'){
   polygon([[.374,.055],[.410,.055],[.410,.758],[.374,.758]]);
   polygon([[.198,.666],[.259,.651],[.280,.808],[.205,.827]]);
   ellipse(.324,.757,.038,.064);ellipse(.635,.776,.025,.045);
   polygon([[.663,.715],[.735,.715],[.735,.814],[.663,.814]]);plant=[.705,.585,.810,.835];
  }else{
   polygon([[.099,.15],[.108,.155],[.108,.54],[.099,.54]]);
   polygon([[.063,.487],[.078,.479],[.09,.534],[.066,.541]]);ellipse(.126,.516,.014,.025);plant=[.13,.43,.174,.55];
  }
  ctx.globalCompositeOperation='source-over';
  // Keep the plant's native green leaves and brown pot; gaps remain black.
  const out=ctx.getImageData(0,0,W,H),[px,py,ex,ey]=plant;
  for(let y=Math.max(0,Math.floor(py*H));y<Math.min(H,ey*H);y++)for(let x=Math.max(0,Math.floor(px*W));x<Math.min(W,ex*W);x++){
   const i=(y*W+x)*4,r=src.data[i],g=src.data[i+1],b=src.data[i+2];if((g>r*.72&&g>b*1.12)||(r>g*1.08&&r>b*1.15))out.data[i+3]=0;
  }
  ctx.putImageData(out,0,0);c.dataset.ready='true';
 }
 function frame(now,metadata){if(!alive)return;if(metadata)mediaTime=metadata.mediaTime;paint(mediaTime);if(source.requestVideoFrameCallback)request=source.requestVideoFrameCallback(frame);else raf=requestAnimationFrame(frame);}
 const paused=()=>{last=-1;paint(mediaTime);};if(film)source.addEventListener('pause',paused);
 if(film)frame();else{source.addEventListener('load',paint);paint();}
 return{reveal(){c.dataset.revealed='true';reveal=c.animate([{opacity:1},{opacity:0}],{duration:matchMedia('(prefers-reduced-motion:reduce)').matches?1:650,fill:'forwards'});},dispose(){alive=false;cancelAnimationFrame(raf);if(request)source.cancelVideoFrameCallback?.(request);source.removeEventListener('load',paint);source.removeEventListener('pause',paused);reveal?.cancel();c.remove();}};
}
