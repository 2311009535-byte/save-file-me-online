import {prepareImage} from './image-cache.js';
const files=['3_15.png','3_16.PNG','3_17.PNG','3_18.PNG'];
// A sheet bends around the spine. Its front and back use the supplied page art.
export function createDiaryTurn(visual,change,page){
 const hit=document.createElement('div');hit.className='retry-diary-drag';hit.tabIndex=0;hit.setAttribute('aria-label','Drag left for the next page; drag right for the previous page.');
 const hint=document.createElement('div');hint.className='retry-diary-hint';
 const instructions=()=>page===0?'DRAG LEFT TO TURN THE PAGE':page===3?'DRAG RIGHT TO GO BACK':'DRAG LEFT / RIGHT TO TURN THE PAGE';hint.textContent=instructions();visual.append(hint);document.getElementById('hotspots').append(hit);
 const scene=visual.querySelector('.scene-image');let disposed=false,frame=0,drag=null,leaf=null,render=null,progress=0,direction=0,locked=false,revision=0,resolveTween=null;
 const crop=side=>side>0?[856,40,659,829]:[170,40,642,829];
 function triangle(ctx,im,s,t,shade){
  const [p,r,z]=s,[A,B,C]=t,D=(r[0]-p[0])*(z[1]-p[1])-(z[0]-p[0])*(r[1]-p[1]);
  const aa=((B[0]-A[0])*(z[1]-p[1])-(C[0]-A[0])*(r[1]-p[1]))/D,bb=((B[1]-A[1])*(z[1]-p[1])-(C[1]-A[1])*(r[1]-p[1]))/D;
  const cc=((C[0]-A[0])*(r[0]-p[0])-(B[0]-A[0])*(z[0]-p[0]))/D,dd=((C[1]-A[1])*(r[0]-p[0])-(B[1]-A[1])*(z[0]-p[0]))/D;
  ctx.save();ctx.beginPath();t.forEach(([x,y],i)=>ctx[i?'lineTo':'moveTo'](x,y));ctx.closePath();ctx.clip();ctx.setTransform(aa,bb,cc,dd,A[0]-aa*p[0]-cc*p[1],A[1]-bb*p[0]-dd*p[1]);ctx.drawImage(im,0,0);ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle=`rgba(30,20,10,${shade})`;ctx.fill();ctx.restore();
 }
 async function ready(delta){
  const version=++revision;const next=await prepareImage('/assets/retry/'+files[page+delta]);if(disposed||version!==revision||!scene.isConnected)return false;
  direction=delta;leaf=document.createElement('canvas');leaf.className='retry-page-curl';leaf.width=1672;leaf.height=941;leaf.setAttribute('aria-hidden','true');visual.append(leaf);const ctx=leaf.getContext('2d');
  render=p=>{
   progress=p;leaf.dataset.progress=String(p);leaf.dataset.direction=String(delta);ctx.clearRect(0,0,1672,941);
   // Reveal the next sheet under the moving front; the opposite current page stays fixed.
   ctx.save();ctx.beginPath();ctx.rect(delta>0?835:0,0,835,941);ctx.clip();ctx.drawImage(next,0,0,1672,941);ctx.restore();
   const angle=p*Math.PI,N=32,positions=[[0,0]];let x=0,z=0;
   for(let i=0;i<N;i++){const u=(i+.5)/N,a=angle+.38*Math.sin(angle)*Math.sin(u*Math.PI);x+=Math.cos(a)/N;z+=Math.sin(a)/N;positions.push([x,z]);}
   const point=(i,v)=>{const [xx,zz]=positions[i],width=crop(delta)[2]*(1-p)+crop(-delta)[2]*p,depth=zz*width,factor=2200/(2200-depth);return [835+(delta*(21*Math.cos(angle)+xx*width))*factor,454.5+(40+829*v-454.5)*factor];};
   for(let i=0;i<N;i++)for(let j=0;j<4;j++){
    const u=(i+.5)/N,a=angle+.38*Math.sin(angle)*Math.sin(u*Math.PI),front=Math.cos(a)>=0,side=front?delta:-delta,im=front?scene:next,[cx,cy,cw,ch]=crop(side),uv=[[i/N,j/4],[(i+1)/N,j/4],[(i+1)/N,(j+1)/4],[i/N,(j+1)/4]];
    const src=uv.map(([U,V])=>[(cx+(side>0?U:1-U)*cw)*im.naturalWidth/1672,(cy+V*ch)*im.naturalHeight/941]);
    const dst=[point(i,j/4),point(i+1,j/4),point(i+1,(j+1)/4),point(i,(j+1)/4)],shade=Math.sin(angle)*(.08+.2*(1-Math.abs(Math.cos(a))));
    triangle(ctx,im,src.slice(0,3),dst.slice(0,3),shade);triangle(ctx,im,[src[0],src[2],src[3]],[dst[0],dst[2],dst[3]],shade);
   }
   // The shadow travels with the turning sheet and vanishes when it lies flat.
   const edge=point(N,.5)[0],shadow=ctx.createLinearGradient(edge-35,0,edge+35,0);shadow.addColorStop(0,'transparent');shadow.addColorStop(.5,`rgba(0,0,0,${.22*Math.sin(angle)})`);shadow.addColorStop(1,'transparent');ctx.fillStyle=shadow;ctx.fillRect(edge-35,40,70,829);
  };render(0);return true;
 }
 function clear(){leaf?.remove();leaf=null;render=null;progress=0;direction=0;hint.textContent=instructions();}
 function tween(to){return new Promise(resolve=>{resolveTween=resolve;const from=progress,start=performance.now(),duration=matchMedia('(prefers-reduced-motion: reduce)').matches?1:Math.max(180,480*Math.abs(to-from));
  const tick=now=>{if(disposed){resolve(false);return;}const t=Math.min(1,(now-start)/duration),eased=t*t*(3-2*t);render?.(from+(to-from)*eased);if(t<1)frame=requestAnimationFrame(tick);else{resolveTween=null;resolve(true);}};frame=requestAnimationFrame(tick);
 });}
 async function finish(commit){locked=true;const ok=await tween(commit?1:0);if(!ok||disposed)return;const delta=direction;clear();locked=false;if(commit)change(delta);}
 async function turn(delta){if(disposed||locked||drag||page+delta<0||page+delta>3)return;locked=true;try{if(await ready(delta))await finish(true);}catch{clear();hint.textContent='PAGE COULD NOT LOAD — TRY AGAIN';}finally{locked=false;}}
 hit.onpointerdown=e=>{if(e.button!==0||locked||disposed)return;drag={start:e.clientX,last:e.clientX,pending:false};hit.setPointerCapture(e.pointerId);};
 hit.onpointermove=e=>{if(!drag||locked)return;drag.last=e.clientX;const dx=drag.last-drag.start,delta=dx<0?1:-1;
  if(!render&&!drag.pending&&Math.abs(dx)>6&&page+delta>=0&&page+delta<=3){drag.pending=true;ready(delta).then(ok=>{if(!ok||!drag)return;drag.pending=false;update();}).catch(()=>{if(drag)drag.pending=false;clear();});}
  update();
 };
 function update(){if(!render||!drag)return;const dx=(drag.start-drag.last)*direction,p=Math.max(0,Math.min(.98,dx/(hit.getBoundingClientRect().width*.6)));render(p);hint.textContent=p>=.22?'RELEASE TO TURN THE PAGE':'KEEP DRAGGING';}
 hit.onpointerup=()=>{if(!drag)return;const commit=progress>=.22;drag=null;revision++;if(render)finish(commit);else hint.textContent=instructions();};
 hit.onpointercancel=()=>{drag=null;revision++;if(render)finish(false);};
 hit.onkeydown=e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();turn(e.key==='ArrowLeft'?1:-1);}};
 return {turn,dispose(){disposed=true;revision++;drag=null;cancelAnimationFrame(frame);resolveTween?.(false);resolveTween=null;clear();hit.remove();hint.remove();}};
}
