import {prepareImage} from './image-cache.js';
const regions={window:[.12,.34,.27,.49],box:[.93,.81,.30,.43],map:[.45,.30,.29,.38],note:[.642,.383,.20,.30]};
export function mountRoomLighting(visual,done,previous=null,{lampPatch=true}={}){
 const canvas=document.createElement('canvas');canvas.width=1669;canvas.height=942;canvas.className='wonder-room-lighting';canvas.setAttribute('aria-hidden','true');
 Object.assign(canvas.style,{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:2});visual.append(canvas);
 const glow=document.createElement('canvas');glow.width=1669;glow.height=942;glow.className='wonder-room-light-spill';glow.setAttribute('aria-hidden','true');
 Object.assign(glow.style,{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:2,mixBlendMode:'screen'});visual.append(glow);
 // Dim the source's baked lamp mouth as well as removing emitted overlays.
 // Pixel grading preserves the original shade edges and grain.
 const lampOff=document.createElement('canvas');lampOff.width=1669;lampOff.height=942;lampOff.className='wonder-lamp-unlit';lampOff.setAttribute('aria-hidden','true');Object.assign(lampOff.style,{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:1});visual.append(lampOff);
 if(lampPatch)prepareImage('/assets/wonder/1_1.png').then(image=>{
  if(!alive)return;const c=lampOff.getContext('2d',{willReadFrequently:true});c.drawImage(image,0,0);const pixels=c.getImageData(0,0,1669,942);
  for(let y=0;y<942;y++)for(let x=0;x<1669;x++){
   const i=(y*1669+x)*4,r=pixels.data[i],g=pixels.data[i+1],b=pixels.data[i+2];
   const mouth=x>=1124&&x<=1174&&y>=395&&y<=443&&r>175&&g>105&&r>b*1.3;
   const beam=y>=441&&y<=512&&x>=1115&&x<=1178-(y-441)*.28&&r>g*1.15&&g>b*1.2;
   if(mouth){pixels.data[i]=r*.58;pixels.data[i+1]=g*.60;pixels.data[i+2]=b*.67;}
   else if(beam){const fade=Math.min(1,(x-1115)/9,(1178-(y-441)*.28-x)/9,(y-441)/8,(512-y)/10);const a=Math.max(0,fade)*.65;pixels.data[i]=r*(1-a*.60);pixels.data[i+1]=g*(1-a*.40);pixels.data[i+2]=b*(1-a*.10);}
   else pixels.data[i+3]=0;
  }
  c.putImageData(pixels,0,0);lampOff.dataset.ready='true';
 }).catch(()=>{});
 const light=glow.getContext('2d');
 const ctx=canvas.getContext('2d'),ids=Object.keys(regions),all=ids.every(id=>done[id]),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const changed=previous&&ids.some(id=>Boolean(previous[id])!==Boolean(done[id])),duration=changed&&!reduced?1100:0;
 let raf=0,alive=true,start=null;
 function paint(progress){
  ctx.clearRect(0,0,1669,942);ctx.globalCompositeOperation='source-over';ctx.fillStyle=`rgba(2,5,14,${.56*(all?1-progress:1)})`;ctx.fillRect(0,0,1669,942);
  ctx.globalCompositeOperation='destination-out';
  function hole(x,y,rx,ry,strength){ctx.save();ctx.translate(x*1669,y*942);ctx.scale(rx*1669,ry*942);const g=ctx.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,`rgba(0,0,0,${strength})`);g.addColorStop(.35,`rgba(0,0,0,${strength*.98})`);g.addColorStop(.75,`rgba(0,0,0,${strength*.35})`);g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(-1,-1,2,2);ctx.restore();}
  // Preserve the existing window exposure; the ceiling bulb is the sole room lamp.
  hole(.12,.37,.22,.43,.18);hole(.20,.63,.25,.20,.08);
  hole(.51,.065,.085,.10,1);
  for(const id of ids){if(done[id])hole(...regions[id],previous?.[id]||!changed?1:progress);}
  // Keep the unvisited window near the reference's dark night exposure.
  // This shadow lifts with the existing earned window light, not on hover.
  const night=done.window?(previous?.window||!changed?0:1-progress):1;
  ctx.globalCompositeOperation='source-over';ctx.save();
  ctx.translate(.12*1669,.34*942);ctx.scale(.19*1669,.40*942);
  const shade=ctx.createRadialGradient(0,0,0,0,0,1);
  shade.addColorStop(0,`rgba(3,5,20,${.48*night})`);
  shade.addColorStop(.55,`rgba(3,5,20,${.40*night})`);
  shade.addColorStop(1,'rgba(3,5,20,0)');ctx.fillStyle=shade;ctx.fillRect(-1,-1,2,2);ctx.restore();
  canvas.dataset.ambient='window,ceiling';canvas.dataset.deskLamp='off';
  // Emitted light is separate from shadow removal: bright cores and colored
  // spill can exceed the unlit source exposure without blurring its pixels.
  light.clearRect(0,0,1669,942);light.globalAlpha=all?1-progress:1;
  function spill(x,y,rx,ry,rgb,alpha,target=light){target.save();target.translate(x*1669,y*942);target.scale(rx*1669,ry*942);const g=target.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,`rgba(${rgb},${alpha})`);g.addColorStop(.25,`rgba(${rgb},${alpha*.65})`);g.addColorStop(1,`rgba(${rgb},0)`);target.fillStyle=g;target.fillRect(-1,-1,2,2);target.restore();}
  spill(.51,.065,.016,.025,'255,231,159',.9);
  spill(.51,.055,.10,.10,'255,173,65',.22);
  spill(.12,.37,.16,.34,'104,143,255',.035);
  spill(.20,.63,.24,.14,'102,142,255',.025);
  glow.dataset.exposure='bright-cores-local-spill';
  ctx.globalCompositeOperation='source-over';canvas.dataset.lit=ids.filter(id=>done[id]).join(',');canvas.dataset.progress=progress.toFixed(3);canvas.dataset.fullyLit=String(all&&progress===1);
 }
 let paintedProgress=duration?0:1;
 function tick(now){
  if(!alive||!canvas.isConnected)return;if(start===null)start=now;
  if(duration&&paintedProgress<1){const t=Math.min(1,(now-start)/duration);paintedProgress=t;paint(t*t*(3-2*t));}

  if(paintedProgress<1)raf=requestAnimationFrame(tick);
 }
 paint(duration?0:1);tick(performance.now());
 const dispose=()=>{alive=false;cancelAnimationFrame(raf);canvas.remove();glow.remove();lampOff.remove();};dispose.duration=duration;return dispose;
}
