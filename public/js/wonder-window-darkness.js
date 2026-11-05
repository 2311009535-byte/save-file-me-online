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
export function mountWindowDarkness(source,host,{kind='room'}={}){
 const film=source instanceof HTMLVideoElement,c=document.createElement('canvas');c.width=film?640:kind==='detail'?1910:1669;c.height=film?361:kind==='detail'?1084:942;c.className='wonder-window-darkness';c.dataset.kind=kind;c.setAttribute('aria-hidden','true');Object.assign(c.style,{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:2});host.append(c);
 const ctx=c.getContext('2d',{willReadFrequently:true});let alive=true,raf=0,request=0,reveal=null,last=-1;
 function paint(){if(!alive||!(film?source.readyState>=2:source.complete&&source.naturalWidth))return;if(film&&source.currentTime===last)return;last=film?source.currentTime:0;
  const W=c.width,H=c.height,q=film?quadAt(last):kind==='detail'?detail:room;
  ctx.clearRect(0,0,W,H);ctx.drawImage(source,0,0,W,H);const src=ctx.getImageData(0,0,W,H);ctx.clearRect(0,0,W,H);
  const polygon=points=>{ctx.beginPath();points.forEach(([x,y],i)=>ctx[i?'lineTo':'moveTo'](x*W,y*H));ctx.closePath();ctx.fill();};
  ctx.fillStyle='#000';polygon(q);ctx.globalCompositeOperation='destination-out';
  function ellipse(x,y,rx,ry){ctx.beginPath();ctx.ellipse(x*W,y*H,rx*W,ry*H,0,0,Math.PI*2);ctx.fill();}
  let plant;
  if(!film&&kind==='detail'){
   polygon([[.374,.055],[.410,.055],[.410,.758],[.374,.758]]);
   polygon([[.198,.666],[.259,.651],[.280,.808],[.205,.827]]);
   ellipse(.324,.757,.038,.064);ellipse(.635,.776,.025,.045);
   polygon([[.663,.715],[.735,.715],[.735,.814],[.663,.814]]);plant=[.705,.585,.810,.835];
  }else if(!film){
   polygon([[.099,.15],[.108,.155],[.108,.54],[.099,.54]]);
   polygon([[.063,.487],[.078,.479],[.09,.534],[.066,.541]]);ellipse(.126,.516,.014,.025);plant=[.13,.43,.174,.55];
  }else{
   const f=Math.min(1,last/4.5),point=(u,v)=>{const l=[q[0][0]+(q[3][0]-q[0][0])*v,q[0][1]+(q[3][1]-q[0][1])*v],r=[q[1][0]+(q[2][0]-q[1][0])*v,q[1][1]+(q[2][1]-q[1][1])*v];return[l[0]+(r[0]-l[0])*u,l[1]+(r[1]-l[1])*u];};
   const u=.35-.06*f,v=.42-.07*f;polygon([point(u,0),point(v,0),point(v,1),point(u,1)]);
   const p=point(.10,.94),clock=point(.50-.29*f,.95),pw=q[1][0]-q[0][0],ph=q[3][1]-q[0][1];
   ellipse(clock[0],clock[1],pw*.065,ph*.095);polygon([point(.01,.86),point(.14,.86),point(.18,1.1),point(.02,1.1)]);
   const l=point(.84,.74),r=point(1.02,1.14);plant=[l[0],l[1],r[0],r[1]];
   if(f>.5){const globe=point(.73,1.02);ellipse(globe[0],globe[1],pw*.035,ph*.06);polygon([point(.79,.95),point(.91,.95),point(.91,1.12),point(.79,1.12)]);}
  }
  ctx.globalCompositeOperation='source-over';
  // Keep the plant's native green leaves and brown pot; gaps remain black.
  const out=ctx.getImageData(0,0,W,H),[px,py,ex,ey]=plant;
  for(let y=Math.max(0,Math.floor(py*H));y<Math.min(H,ey*H);y++)for(let x=Math.max(0,Math.floor(px*W));x<Math.min(W,ex*W);x++){
   const i=(y*W+x)*4,r=src.data[i],g=src.data[i+1],b=src.data[i+2];if((g>r*.72&&g>b*1.12)||(r>g*1.08&&r>b*1.15))out.data[i+3]=0;
  }
  if(film){
   // Restore connected foreground wood/props along the sill, while rejecting
   // tiny isolated city lights. This follows their actual current-frame pixels.
   const warm=new Uint8Array(W*H),seen=new Uint8Array(W*H),queue=new Int32Array(W*H),startY=Math.max(0,Math.floor((Math.min(q[0][1],q[1][1])+(Math.max(q[2][1],q[3][1])-Math.min(q[0][1],q[1][1]))*.60)*H));
   for(let y=startY;y<H;y++)for(let x=0;x<W;x++){const n=y*W+x,i=n*4,r=src.data[i],g=src.data[i+1],b=src.data[i+2];if(out.data[i+3]&&((r>g*.9&&r>b*1.15)||(g>r*.72&&g>b*1.12)))warm[n]=1;}
   const size=25*Math.pow((q[1][0]-q[0][0])/.113,2);
   for(let n=startY*W;n<warm.length;n++){if(!warm[n]||seen[n])continue;let head=0,tail=1;queue[0]=n;seen[n]=1;while(head<tail){const p=queue[head++],x=p%W;for(const k of [x?p-1:-1,x<W-1?p+1:-1,p>=W?p-W:-1,p<W*(H-1)?p+W:-1])if(k>=0&&warm[k]&&!seen[k]){seen[k]=1;queue[tail++]=k;}}if(tail>size)for(let k=0;k<tail;k++)out.data[queue[k]*4+3]=0;}
  }
  ctx.putImageData(out,0,0);c.dataset.ready='true';
 }
 function frame(){if(!alive)return;paint();if(source.requestVideoFrameCallback)request=source.requestVideoFrameCallback(frame);else raf=requestAnimationFrame(frame);}
 if(film)frame();else{source.addEventListener('load',paint);paint();}
 return{reveal(){c.dataset.revealed='true';reveal=c.animate([{opacity:1},{opacity:0}],{duration:matchMedia('(prefers-reduced-motion:reduce)').matches?1:650,fill:'forwards'});},dispose(){alive=false;cancelAnimationFrame(raf);if(request)source.cancelVideoFrameCallback?.(request);source.removeEventListener('load',paint);reveal?.cancel();c.remove();}};
}
