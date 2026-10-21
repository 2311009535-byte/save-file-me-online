const regions={window:[.12,.34,.27,.49],box:[.93,.81,.30,.43],map:[.45,.30,.29,.38],note:[.642,.383,.20,.30]};
export function mountRoomLighting(visual,done,previous=null){
 const canvas=document.createElement('canvas');canvas.width=1669;canvas.height=942;canvas.className='wonder-room-lighting';canvas.setAttribute('aria-hidden','true');
 Object.assign(canvas.style,{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:2});visual.append(canvas);
 const glow=document.createElement('canvas');glow.width=1669;glow.height=942;glow.className='wonder-room-light-spill';glow.setAttribute('aria-hidden','true');
 Object.assign(glow.style,{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:2,mixBlendMode:'screen'});visual.append(glow);
 const light=glow.getContext('2d');
 const ctx=canvas.getContext('2d'),ids=Object.keys(regions),all=ids.every(id=>done[id]),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const changed=previous&&ids.some(id=>Boolean(previous[id])!==Boolean(done[id])),duration=changed&&!reduced?1100:0;
 let raf=0,alive=true,start=null;
 function paint(progress){
  ctx.clearRect(0,0,1669,942);ctx.globalCompositeOperation='source-over';ctx.fillStyle=`rgba(2,5,14,${.56*(all?1-progress:1)})`;ctx.fillRect(0,0,1669,942);
  ctx.globalCompositeOperation='destination-out';
  function hole(x,y,rx,ry,strength){ctx.save();ctx.translate(x*1669,y*942);ctx.scale(rx*1669,ry*942);const g=ctx.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,`rgba(0,0,0,${strength})`);g.addColorStop(.35,`rgba(0,0,0,${strength*.98})`);g.addColorStop(.75,`rgba(0,0,0,${strength*.35})`);g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(-1,-1,2,2);ctx.restore();}
  // Small permanent pools of window light and desk-lamp light precede exploration.
  hole(.12,.37,.22,.43,.18);hole(.20,.63,.25,.20,.08);
  hole(.69,.49,.19,.22,1);hole(.69,.43,.045,.065,1);
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
  canvas.dataset.ambient='window,desk-lamp';
  // Emitted light is separate from shadow removal: bright cores and colored
  // spill can exceed the unlit source exposure without blurring its pixels.
  light.clearRect(0,0,1669,942);light.globalAlpha=all?1-progress:1;
  function spill(x,y,rx,ry,rgb,alpha){light.save();light.translate(x*1669,y*942);light.scale(rx*1669,ry*942);const g=light.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,`rgba(${rgb},${alpha})`);g.addColorStop(.25,`rgba(${rgb},${alpha*.65})`);g.addColorStop(1,`rgba(${rgb},0)`);light.fillStyle=g;light.fillRect(-1,-1,2,2);light.restore();}
  spill(.69,.43,.030,.038,'255,224,143',.95);
  spill(.69,.50,.14,.17,'255,172,67',.46);
  spill(.65,.55,.13,.045,'255,192,91',.35);
  spill(.51,.065,.016,.025,'255,231,159',.9);
  spill(.51,.055,.10,.10,'255,173,65',.22);
  spill(.12,.37,.16,.34,'104,143,255',.035);
  spill(.20,.63,.24,.14,'102,142,255',.025);
  glow.dataset.exposure='bright-cores-local-spill';
  ctx.globalCompositeOperation='source-over';canvas.dataset.lit=ids.filter(id=>done[id]).join(',');canvas.dataset.progress=progress.toFixed(3);canvas.dataset.fullyLit=String(all&&progress===1);
 }
 function tick(now){if(!alive||!canvas.isConnected)return;if(start===null)start=now;const t=Math.min(1,(now-start)/duration);paint(t*t*(3-2*t));if(t<1)raf=requestAnimationFrame(tick);}
 paint(duration?0:1);if(duration)raf=requestAnimationFrame(tick);
 const dispose=()=>{alive=false;cancelAnimationFrame(raf);canvas.remove();glow.remove();};dispose.duration=duration;return dispose;
}
