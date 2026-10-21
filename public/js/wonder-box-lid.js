import {prepareImage} from './image-cache.js';
const W=1669,H=942;
export function mountClosedBox(visual){
 const root=document.createElement('div');root.className='wonder-box-lid';root.dataset.state='closed';Object.assign(root.style,{position:'absolute',inset:0,zIndex:1,pointerEvents:'none'});visual.append(root);
 const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;Object.assign(canvas.style,{width:'100%',height:'100%',position:'absolute',inset:0});root.append(canvas);
 const ready=prepareImage('/assets/wonder/room-closed-box.png').then(image=>{if(!root.isConnected)return null;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(image,1420,580,249,350,1420,580,249,350);return image;});
 const hint=document.createElement('canvas');hint.width=W;hint.height=H;hint.className='contour-light';hint.dataset.object='box';hint.style.zIndex='3';const c=hint.getContext('2d');c.beginPath();for(const [i,p]of [[1468,675],[1605,645],[1669,663],[1669,897],[1560,913],[1467,875]].entries()){i?c.lineTo(...p):c.moveTo(...p)}c.closePath();c.strokeStyle='rgba(255,245,220,.8)';c.lineWidth=3;c.stroke();visual.append(hint);
 let stopped=false,raf=0,settle=null;
 function reset(){cancelAnimationFrame(raf);settle?.(false);settle=null;root.style.opacity='1';root.dataset.state='closed';visual.querySelector('.box-moving-lids')?.remove();hint.style.visibility='';}
 async function open(valid){
  const image=await ready;if(stopped||!valid()||!image)return false;
  root.dataset.state='opening';hint.style.visibility='hidden';
  const moving=document.createElement('canvas');moving.className='box-moving-lids';moving.width=W;moving.height=H;Object.assign(moving.style,{position:'absolute',inset:0,width:'100%',height:'100%'});visual.append(moving);moving.style.zIndex='1';const ctx=moving.getContext('2d');
  const starts=[[[1468,675],[1536,660],[1630,691],[1576,708]],[[1536,660],[1605,645],[1669,663],[1630,691]]],ends=[[[1445,711],[1480,653],[1586,645],[1566,761]],[[1586,610],[1617,610],[1669,622],[1669,705]]];
  function triangle(src,dst){const [a,b,c]=src,[p,q,r]=dst,den=(b[0]-a[0])*(c[1]-a[1])-(c[0]-a[0])*(b[1]-a[1]);const ax=((q[0]-p[0])*(c[1]-a[1])-(r[0]-p[0])*(b[1]-a[1]))/den,bx=((r[0]-p[0])*(b[0]-a[0])-(q[0]-p[0])*(c[0]-a[0]))/den,ay=((q[1]-p[1])*(c[1]-a[1])-(r[1]-p[1])*(b[1]-a[1]))/den,by=((r[1]-p[1])*(b[0]-a[0])-(q[1]-p[1])*(c[0]-a[0]))/den;ctx.save();ctx.beginPath();ctx.moveTo(...p);ctx.lineTo(...q);ctx.lineTo(...r);ctx.closePath();ctx.clip();ctx.transform(ax,ay,bx,by,p[0]-ax*a[0]-bx*a[1],p[1]-ay*a[0]-by*a[1]);ctx.drawImage(image,0,0);ctx.restore();}
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,duration=reduced?120:760;
  return new Promise(resolve=>{settle=resolve;let start=null;function tick(now){if(stopped||!valid()){moving.remove();reset();return;}start??=now;const t=Math.min(1,(now-start)/duration),e=t*t*(3-2*t);root.style.opacity=String(1-e);ctx.clearRect(0,0,W,H);ctx.globalAlpha=Math.min(1,(1-t)*3);starts.forEach((quad,i)=>{const dst=quad.map((p,j)=>p.map((v,k)=>v+(ends[i][j][k]-v)*e));triangle([quad[0],quad[1],quad[2]],[dst[0],dst[1],dst[2]]);triangle([quad[0],quad[2],quad[3]],[dst[0],dst[2],dst[3]]);});if(t<1)raf=requestAnimationFrame(tick);else{moving.remove();root.dataset.state='open';root.remove();hint.remove();settle=null;resolve(true);}}raf=requestAnimationFrame(tick);});
 }
 return{ready,open,cancel:reset,dispose(){stopped=true;reset();root.remove();hint.remove();visual.querySelector('.box-moving-lids')?.remove();}};
}
