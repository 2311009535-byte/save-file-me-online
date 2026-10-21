import {prepareImage} from './image-cache.js';
const configs={
 detail:{width:825,height:466,src:'/assets/wonder/1_7.jpg',paper:[[283,149],[523,126],[549,380],[308,409]],tape:[386,108,50,55],anchor:140,amplitude:8,curl:4,wall:[560,190,12,210]},
 room:{width:1669,height:942,src:'/assets/wonder/extra.png',paper:[[1046,338],[1095,338],[1095,392],[1046,392]],tape:[1061,325,17,22],anchor:338,amplitude:3.8,curl:1.8,wall:[1104,336,12,62]}
};
export function mountNoteBreeze(visual,{room=false,completed=false}={}){
 const config=room?configs.room:configs.detail,{width,height,paper,tape,anchor,amplitude,curl}=config;
 const layer=document.createElement('canvas');layer.width=width;layer.height=height;layer.className='wonder-note-breeze';layer.dataset.view=room?'room':'detail';layer.setAttribute('aria-hidden','true');Object.assign(layer.style,{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:1});visual.append(layer);const ctx=layer.getContext('2d');
 let hint=null;if(room&&!completed){hint=document.createElement('canvas');hint.width=width;hint.height=height;hint.className='wonder-note-wind-hint';hint.setAttribute('aria-hidden','true');Object.assign(hint.style,{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:3});visual.append(hint);}
 let alive=true,raf=0,lastPaint=-Infinity;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 prepareImage(config.src).then(image=>{
  if(!alive)return;
  const x0=Math.min(...paper.map(p=>p[0])),y0=Math.min(...paper.map(p=>p[1])),w=Math.max(...paper.map(p=>p[0]))-x0,h=Math.max(...paper.map(p=>p[1]))-y0,pad=20;
  const texture=document.createElement('canvas');texture.width=w;texture.height=h;const tc=texture.getContext('2d');tc.beginPath();paper.forEach((p,i)=>i?tc.lineTo(p[0]-x0,p[1]-y0):tc.moveTo(p[0]-x0,p[1]-y0));tc.closePath();tc.clip();tc.drawImage(image,-x0,-y0);
  const warped=document.createElement('canvas');warped.width=w+pad*2;warped.height=h+pad*2;const wc=warped.getContext('2d');wc.imageSmoothingEnabled=false;
  const patch=room?[1030,311,90,105]:[274,112,286,311];
  function triangle(src,dst){const[a,b,c]=src,[p,q,r]=dst,den=(b[0]-a[0])*(c[1]-a[1])-(c[0]-a[0])*(b[1]-a[1]);const ax=((q[0]-p[0])*(c[1]-a[1])-(r[0]-p[0])*(b[1]-a[1]))/den,bx=((r[0]-p[0])*(b[0]-a[0])-(q[0]-p[0])*(c[0]-a[0]))/den,ay=((q[1]-p[1])*(c[1]-a[1])-(r[1]-p[1])*(b[1]-a[1]))/den,by=((r[1]-p[1])*(b[0]-a[0])-(q[1]-p[1])*(c[0]-a[0]))/den;const clip=dst.map((v,i)=>{const prev=dst[(i+2)%3],next=dst[(i+1)%3],center=[(p[0]+q[0]+r[0])/3,(p[1]+q[1]+r[1])/3];function normal(a,b){let x=b[1]-a[1],y=a[0]-b[0],len=Math.hypot(x,y);x/=len;y/=len;if(x*(center[0]-(a[0]+b[0])/2)+y*(center[1]-(a[1]+b[1])/2)>0){x=-x;y=-y;}return[x,y];}const a=normal(prev,v),b=normal(v,next),scale=.75/Math.max(.001,1+a[0]*b[0]+a[1]*b[1]);return[v[0]+(a[0]+b[0])*scale,v[1]+(a[1]+b[1])*scale];});wc.save();wc.beginPath();wc.moveTo(...clip[0]);wc.lineTo(...clip[1]);wc.lineTo(...clip[2]);wc.closePath();wc.clip();wc.transform(ax,ay,bx,by,p[0]-ax*a[0]-bx*a[1],p[1]-ay*a[0]-by*a[1]);wc.drawImage(texture,0,0);wc.restore();}
  function paint(now){
   const sway=reduced?0:Math.sin(now/1150)*.78+Math.sin(now/2700)*.22,corner=reduced?0:(.5+.5*Math.sin(now/1500+.7));
   function move(x,y){const t=Math.max(0,Math.min(1,(y+y0-anchor)/(y0+h-anchor)));return[x+pad+sway*amplitude*Math.pow(t,1.45),y+pad-corner*curl*Math.pow(t,3)*(x/w)];}
   ctx.clearRect(...patch);
   // First restore the sharp surrounding wall so the original paper and its
   // old white hint cannot remain behind as a second, stationary image.
   if(room)ctx.drawImage(image,...patch,...patch);
   ctx.save();ctx.beginPath();const cx=x0+w/2,cy=y0+h/2;paper.forEach((p,i)=>{const x=p[0]+(p[0]>cx?4:-4),y=p[1]+(p[1]>cy?7:-3);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.closePath();ctx.clip();ctx.drawImage(image,...config.wall,x0-6,y0-5,w+12,h+15);ctx.restore();
   wc.clearRect(0,0,warped.width,warped.height);
   for(let row=0;row<8;row++){const ya=h*row/8,yb=h*(row+1)/8,src=[[0,ya],[w,ya],[w,yb],[0,yb]],dst=src.map(([x,y])=>move(x,y));triangle([src[0],src[1],src[2]],[dst[0],dst[1],dst[2]]);triangle([src[0],src[2],src[3]],[dst[0],dst[2],dst[3]]);}
   ctx.save();ctx.shadowColor='rgba(0,0,0,.4)';ctx.shadowBlur=room?2:4;ctx.shadowOffsetX=1+Math.abs(sway)*(room?1:2);ctx.shadowOffsetY=room?3:5;ctx.drawImage(warped,x0-pad,y0-pad);ctx.restore();
   // Tape stays fixed to the wall while only the paper below it flexes.
   ctx.drawImage(image,...tape,...tape);
   if(hint){const hc=hint.getContext('2d');hc.clearRect(...patch);hc.strokeStyle=`rgba(255,243,216,${.38+.17*Math.sin(now/1100)})`;hc.lineWidth=1.6;hc.shadowColor='#fff0cc';hc.shadowBlur=3;hc.beginPath();paper.forEach((p,i)=>{const q=move(p[0]-x0,p[1]-y0),x=q[0]+x0-pad,y=q[1]+y0-pad;i?hc.lineTo(x,y):hc.moveTo(x,y);});hc.closePath();hc.stroke();}
   const bottom=move(w,h);layer.dataset.angle=(sway*amplitude/h).toFixed(5);layer.dataset.displacement=(sway*amplitude).toFixed(3);layer.dataset.cornerLift=(corner*curl).toFixed(3);layer.dataset.anchor=String(anchor);layer.dataset.bottom=bottom.map(v=>v.toFixed(2)).join(',');
  }
  function tick(now){if(!alive||!layer.isConnected)return;if(!document.hidden&&now-lastPaint>=32){paint(now);lastPaint=now;}raf=requestAnimationFrame(tick);}
  paint(performance.now());if(!reduced)raf=requestAnimationFrame(tick);
 }).catch(()=>{});
 return()=>{alive=false;cancelAnimationFrame(raf);layer.remove();hint?.remove();};
}
