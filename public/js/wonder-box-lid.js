import {prepareImage} from './image-cache.js';
const W=1669,H=942;
const A=[1468,675],B=[1605,645],C=[1669,663],D=[1576,708],E=[1536,660],F=[1630,691];
// Both panels share the central seam E–F. Their outer folds A–D and B–C
// remain fixed while the free edges rotate around them.
function rotatePanel(quad,hinge,angle){
 const [a,b]=hinge,dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy),ux=dx/len,uy=dy/len;
 return quad.map(p=>{const vx=p[0]-a[0],vy=p[1]-a[1],along=vx*ux+vy*uy,px=vx-along*ux,py=vy-along*uy,lift=Math.hypot(px,py)*1.5*Math.sin(angle);return[a[0]+along*ux+px*Math.cos(angle),a[1]+along*uy+py*Math.cos(angle)-lift];});
}
export function mountClosedBox(visual){
 const root=document.createElement('div');root.className='wonder-box-lid';root.dataset.state='closed';Object.assign(root.style,{position:'absolute',inset:0,zIndex:1,pointerEvents:'none'});visual.append(root);
 const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;Object.assign(canvas.style,{width:'100%',height:'100%',position:'absolute',inset:0});root.append(canvas);const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
 const ready=prepareImage('/assets/wonder/room-closed-box.png').then(image=>{if(!root.isConnected)return null;paint(image,0);return image;});
 const hint=document.createElement('canvas');hint.width=W;hint.height=H;hint.className='contour-light';hint.dataset.object='box';Object.assign(hint.style,{zIndex:3,filter:'none'});const hc=hint.getContext('2d');hc.strokeStyle='rgba(255,242,210,.75)';hc.lineWidth=2;
 function edge(points){hc.beginPath();points.forEach((p,i)=>i?hc.lineTo(...p):hc.moveTo(...p));hc.stroke();}
 edge([A,B,C,[1669,897],[1576,913],[1468,873],A]);edge([A,D,[1669,689]]);edge([D,[1576,913]]);visual.append(hint);
 let stopped=false,raf=0,settle=null,lastImage=null;
 function triangle(image,src,dst){const[a,b,c]=src,[p,q,r]=dst,den=(b[0]-a[0])*(c[1]-a[1])-(c[0]-a[0])*(b[1]-a[1]);const ax=((q[0]-p[0])*(c[1]-a[1])-(r[0]-p[0])*(b[1]-a[1]))/den,bx=((r[0]-p[0])*(b[0]-a[0])-(q[0]-p[0])*(c[0]-a[0]))/den,ay=((q[1]-p[1])*(c[1]-a[1])-(r[1]-p[1])*(b[1]-a[1]))/den,by=((r[1]-p[1])*(b[0]-a[0])-(q[1]-p[1])*(c[0]-a[0]))/den;ctx.save();ctx.beginPath();ctx.moveTo(...p);ctx.lineTo(...q);ctx.lineTo(...r);ctx.closePath();ctx.clip();ctx.transform(ax,ay,bx,by,p[0]-ax*a[0]-bx*a[1],p[1]-ay*a[0]-by*a[1]);ctx.drawImage(image,0,0);ctx.restore();}
 function paint(image,t){
  ctx.clearRect(0,0,W,H);ctx.globalAlpha=1;ctx.drawImage(image,1420,580,249,350,1420,580,249,350);
  if(!t)return;
  // Replace the flat top with a single opaque interior, then render each lid
  // once. No transparent room crossfade or duplicate moving-lid layers.
  ctx.beginPath();[A,B,C,D].forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.fillStyle='#20150e';ctx.fill();
  const quads=[[A,E,F,D],[E,B,C,F]],hinges=[[A,D],[B,C]];
  [1,0].forEach(i=>{const turn=Math.max(0,Math.min(1,(t-i*.10)/.90)),angle=turn*2.65,dst=rotatePanel(quads[i],hinges[i],angle);triangle(image,[quads[i][0],quads[i][1],quads[i][2]],[dst[0],dst[1],dst[2]]);triangle(image,[quads[i][0],quads[i][2],quads[i][3]],[dst[0],dst[2],dst[3]]);});
  root.dataset.progress=t.toFixed(3);
 }
 function reset(){cancelAnimationFrame(raf);settle?.(false);settle=null;root.dataset.state='closed';if(lastImage)paint(lastImage,0);hint.style.visibility='';}
 async function open(valid){const image=await ready;if(stopped||!valid()||!image)return false;lastImage=image;root.dataset.state='opening';hint.style.visibility='hidden';const duration=matchMedia('(prefers-reduced-motion: reduce)').matches?120:880;return new Promise(resolve=>{settle=resolve;let start=null;function tick(now){if(stopped||!valid()){reset();return;}start??=now;const t=Math.min(1,(now-start)/duration);paint(image,t*t*(3-2*t));if(t<1)raf=requestAnimationFrame(tick);else{root.dataset.state='open';hint.remove();settle=null;resolve(true);}}raf=requestAnimationFrame(tick);});}
 return{ready,open,cancel:reset,dispose(){stopped=true;reset();root.remove();hint.remove();}};
}
