import {prepareImage} from './image-cache.js';
// Project the supplied diary artwork onto the two physical pages, preserving the spiral.
export async function deskDiary(visual){
 const scene=visual.querySelector('.scene-image');const im=await prepareImage('/assets/retry/3_16.PNG');
 if(!scene?.isConnected)return;
 const c=document.createElement('canvas');c.width=1672;c.height=941;c.className='retry-desk-writing';
 const ctx=c.getContext('2d');
 function page(src,q){
  const [x,y,w,h]=src,[a,b,d,e]=q;
  const dx=b[0]-d[0],dy=b[1]-d[1],ex=e[0]-d[0],ey=e[1]-d[1],zx=a[0]-b[0]+d[0]-e[0],zy=a[1]-b[1]+d[1]-e[1];
  const den=dx*ey-ex*dy,g=(zx*ey-ex*zy)/den,k=(dx*zy-zx*dy)/den;
  const point=(u,v)=>[(a[0]+(b[0]*(1+g)-a[0])*u+(e[0]*(1+k)-a[0])*v)/(1+g*u+k*v),(a[1]+(b[1]*(1+g)-a[1])*u+(e[1]*(1+k)-a[1])*v)/(1+g*u+k*v)];
  function tri(s,t){
   const [p,r,z]=s,[A,B,C]=t,D=(r[0]-p[0])*(z[1]-p[1])-(z[0]-p[0])*(r[1]-p[1]);
   const aa=((B[0]-A[0])*(z[1]-p[1])-(C[0]-A[0])*(r[1]-p[1]))/D,bb=((B[1]-A[1])*(z[1]-p[1])-(C[1]-A[1])*(r[1]-p[1]))/D;
   const cc=((C[0]-A[0])*(r[0]-p[0])-(B[0]-A[0])*(z[0]-p[0]))/D,dd=((C[1]-A[1])*(r[0]-p[0])-(B[1]-A[1])*(z[0]-p[0]))/D;
   ctx.save();ctx.beginPath();t.forEach(([X,Y],i)=>ctx[i?'lineTo':'moveTo'](X,Y));ctx.closePath();ctx.clip();ctx.setTransform(aa,bb,cc,dd,A[0]-aa*p[0]-cc*p[1],A[1]-bb*p[0]-dd*p[1]);ctx.drawImage(im,0,0);ctx.restore();
  }
  for(let j=0;j<12;j++)for(let i=0;i<12;i++){
   const uv=[[i/12,j/12],[(i+1)/12,j/12],[(i+1)/12,(j+1)/12],[i/12,(j+1)/12]],s=uv.map(([u,v])=>[x+w*u,y+h*v]),t=uv.map(([u,v])=>point(u,v));
   tri([s[0],s[1],s[2]],[t[0],t[1],t[2]]);tri([s[0],s[2],s[3]],[t[0],t[2],t[3]]);
  }
 }
 page([184,62,611,790],[[993,458],[1282,486],[1192,754],[866,731]]);
 page([872,62,622,790],[[1320,492],[1607,529],[1605,820],[1234,764]]);
 visual.append(c);
}
// Deform the original paper as a connected mesh: no background pixels or crossfade.
export async function warningPaper(visual,animate,pause){
 const im=await prepareImage('/assets/retry/3_7.JPG'),paper=document.createElement('canvas');paper.className='retry-warning-paper';paper.setAttribute('aria-label','A heavy strike is coming.');
 const sx=im.naturalWidth*.337,sy=im.naturalHeight*.260,sw=im.naturalWidth*.325,sh=im.naturalHeight*.180;
 paper.width=Math.ceil(sw);paper.height=Math.ceil(sh*1.65);const ctx=paper.getContext('2d');visual.append(paper);let frame=0;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function render(open){
  paper.dataset.open=String(open);ctx.clearRect(0,0,paper.width,paper.height);
  const fold=1-open,w=paper.width,h=sh,cy=paper.height/2;
  const point=(u,v)=>{
   const ripple=Math.sin(u*Math.PI*12)*fold;
   return [w/2+(u-.5)*w*(.10+.90*open)+Math.sin(v*Math.PI*4+u*5)*fold*w*.035,cy+(v-.5)*h*(.20+.80*open)+ripple*h*.23+Math.sin(v*Math.PI*6+u*7)*fold*h*.06];
  };
  function tri(s,t,shade){
   const [p,r,z]=s,[A,B,C]=t,D=(r[0]-p[0])*(z[1]-p[1])-(z[0]-p[0])*(r[1]-p[1]);
   const aa=((B[0]-A[0])*(z[1]-p[1])-(C[0]-A[0])*(r[1]-p[1]))/D,bb=((B[1]-A[1])*(z[1]-p[1])-(C[1]-A[1])*(r[1]-p[1]))/D;
   const cc=((C[0]-A[0])*(r[0]-p[0])-(B[0]-A[0])*(z[0]-p[0]))/D,dd=((C[1]-A[1])*(r[0]-p[0])-(B[1]-A[1])*(z[0]-p[0]))/D;
   ctx.save();ctx.beginPath();t.forEach(([X,Y],i)=>ctx[i?'lineTo':'moveTo'](X,Y));ctx.closePath();ctx.clip();ctx.setTransform(aa,bb,cc,dd,A[0]-aa*p[0]-cc*p[1],A[1]-bb*p[0]-dd*p[1]);ctx.drawImage(im,0,0);ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle=`rgba(0,0,0,${shade})`;ctx.fill();ctx.restore();
  }
  for(let j=0;j<6;j++)for(let i=0;i<24;i++){
   const uv=[[i/24,j/6],[(i+1)/24,j/6],[(i+1)/24,(j+1)/6],[i/24,(j+1)/6]],src=uv.map(([u,v])=>[sx+sw*u,sy+sh*v]),dest=uv.map(([u,v])=>point(u,v)),shade=fold*(i%4<2?.24:.04);
   tri([src[0],src[1],src[2]],[dest[0],dest[1],dest[2]],shade);tri([src[0],src[2],src[3]],[dest[0],dest[2],dest[3]],shade);
  }
 }
 async function tween(from,to,duration){
  render(from);const promise=animate(paper,[{opacity:1},{opacity:1}],{duration:reduced?1:duration,easing:'ease-in-out'}),animation=paper.getAnimations()[0];
  const tick=()=>{const p=animation?.effect.getComputedTiming().progress??0;render(from+(to-from)*p);frame=requestAnimationFrame(tick);};tick();
  const ok=await promise;cancelAnimationFrame(frame);render(to);return ok;
 }
 try{if(!await tween(0,1,950)||!await pause(1800))return false;return await tween(1,0,800);}finally{cancelAnimationFrame(frame);paper.remove();}
}
export async function bossPaper(visual,animate,pause){
 const paper=document.createElement('div');paper.className='retry-boss-warning';paper.textContent='BOSS IS ABOUT TO ATTACK';paper.setAttribute('role','status');visual.append(paper);
 const duration=matchMedia('(prefers-reduced-motion: reduce)').matches?1:300;
 try{
  if(!await animate(paper,[{transform:'translateY(14px) rotate(-3deg) scaleX(.12)'},{transform:'translateY(0) rotate(-1deg) scaleX(1)'}],{duration,easing:'ease-out',fill:'forwards'}))return false;
  if(!await pause(1200))return false;
  return await animate(paper,[{transform:'rotate(-1deg) scaleX(1)'},{transform:'translateY(-8px) rotate(4deg) scaleX(.08)'}],{duration:duration*.7,easing:'ease-in',fill:'forwards'});
 }finally{paper.remove();}
}
export function diaryDrag(visual,change,page){
 const hit=document.createElement('div');hit.className='retry-diary-drag';hit.setAttribute('aria-label','Drag left to turn the page; drag right to go back.');
 const hint=document.createElement('div');hint.className='retry-diary-hint';hint.textContent=page===0?'DRAG LEFT TO TURN THE PAGE':page===3?'DRAG RIGHT TO GO BACK':'DRAG LEFT / RIGHT TO TURN THE PAGE';
 visual.append(hint);document.getElementById('hotspots').append(hit);let start=null;
 hit.onpointerdown=e=>{if(e.button!==0)return;start=e.clientX;hit.setPointerCapture(e.pointerId);};
 hit.onpointermove=e=>{if(start===null)return;const dx=e.clientX-start;const image=visual.querySelector('.scene-image');if(image){image.style.transformOrigin='50% 50%';image.style.transform=`perspective(1800px) rotateY(${Math.max(-12,Math.min(12,dx/hit.getBoundingClientRect().width*24))}deg)`;}hit.dataset.direction=dx<0?'next':'previous';hint.textContent=Math.abs(dx)>hit.getBoundingClientRect().width*.16?'RELEASE TO TURN THE PAGE':'KEEP DRAGGING';};
 hit.onpointerup=e=>{if(start===null)return;const dx=e.clientX-start;start=null;visual.querySelector('.scene-image').style.transform='';const delta=dx<0?1:-1;if(Math.abs(dx)>hit.getBoundingClientRect().width*.16&&page+delta>=0&&page+delta<=3)change(delta);else hint.textContent=page===0?'DRAG LEFT TO TURN THE PAGE':'DRAG LEFT / RIGHT TO TURN THE PAGE';};
 hit.onpointercancel=()=>{start=null;visual.querySelector('.scene-image').style.transform='';hint.textContent='DRAG LEFT / RIGHT TO TURN THE PAGE';};
}
