const regions={window:[.12,.34,.27,.49],box:[.93,.81,.30,.43],map:[.45,.30,.29,.38],note:[.642,.383,.20,.30]};
export function mountRoomLighting(visual,done,previous=null){
 const canvas=document.createElement('canvas');canvas.width=1669;canvas.height=942;canvas.className='wonder-room-lighting';canvas.setAttribute('aria-hidden','true');
 Object.assign(canvas.style,{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:2});visual.append(canvas);
 const ctx=canvas.getContext('2d'),ids=Object.keys(regions),all=ids.every(id=>done[id]),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const changed=previous&&ids.some(id=>Boolean(previous[id])!==Boolean(done[id])),duration=changed&&!reduced?1100:0;
 let raf=0,alive=true,start=null;
 function paint(progress){
  ctx.clearRect(0,0,1669,942);ctx.globalCompositeOperation='source-over';ctx.fillStyle=`rgba(2,5,14,${.56*(all?1-progress:1)})`;ctx.fillRect(0,0,1669,942);
  ctx.globalCompositeOperation='destination-out';
  for(const id of ids){if(!done[id])continue;const strength=previous?.[id]||!changed?1:progress,[x,y,rx,ry]=regions[id];ctx.save();ctx.translate(x*1669,y*942);ctx.scale(rx*1669,ry*942);const g=ctx.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,`rgba(0,0,0,${strength})`);g.addColorStop(.35,`rgba(0,0,0,${strength*.98})`);g.addColorStop(.75,`rgba(0,0,0,${strength*.35})`);g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(-1,-1,2,2);ctx.restore();}
  ctx.globalCompositeOperation='source-over';canvas.dataset.lit=ids.filter(id=>done[id]).join(',');canvas.dataset.progress=progress.toFixed(3);canvas.dataset.fullyLit=String(all&&progress===1);
 }
 function tick(now){if(!alive||!canvas.isConnected)return;if(start===null)start=now;const t=Math.min(1,(now-start)/duration);paint(t*t*(3-2*t));if(t<1)raf=requestAnimationFrame(tick);}
 paint(duration?0:1);if(duration)raf=requestAnimationFrame(tick);
 const dispose=()=>{alive=false;cancelAnimationFrame(raf);canvas.remove();};dispose.duration=duration;return dispose;
}
