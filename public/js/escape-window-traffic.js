// The window is part of the native fisheye room. Light remains clipped inside
// its glazing; the rest of the scene never flashes or changes geometry.
let trafficElapsed=0;
export function mountWindowTraffic(visual,{canPlay=()=>true}={}){
 const canvas=document.createElement('canvas');canvas.width=310;canvas.height=470;canvas.className='escape-window-traffic';canvas.setAttribute('aria-hidden','true');Object.assign(canvas.style,{position:'absolute',left:`${220/1920*100}%`,top:0,width:`${310/1920*100}%`,height:`${470/1080*100}%`,pointerEvents:'none'});
 const ctx=canvas.getContext('2d');ctx.translate(-220,0);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let alive=true,raf=0,last=null,lastPaint=-Infinity;
 const glass=[[249,0],[431,0],[507,320],[411,449],[300,202]];
 function paint(){
  ctx.clearRect(0,0,1920,1080);const local=trafficElapsed%12000,u=(local-1200)/3200,passing=!reduced&&u>0&&u<1;
  canvas.dataset.motion=reduced?'static':'running';canvas.dataset.passing=String(passing);canvas.dataset.phase=u.toFixed(4);
  if(!passing)return;
  const envelope=Math.sin(u*Math.PI),x=230+310*u,y=165+140*u;canvas.dataset.lightX=x.toFixed(2);
  ctx.save();ctx.beginPath();glass.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.clip();
  function glow(x,y,rx,ry,alpha){ctx.save();ctx.translate(x,y);ctx.scale(rx,ry);const g=ctx.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,`rgba(255,248,222,${alpha})`);g.addColorStop(.24,`rgba(255,232,178,${alpha*.55})`);g.addColorStop(1,'rgba(255,215,141,0)');ctx.fillStyle=g;ctx.fillRect(-1,-1,2,2);ctx.restore();}
  for(const offset of [0,-35]){glow(x+offset-28,y+offset*.2,78,22,.32*envelope);glow(x+offset,y+offset*.2,17,9,.92*envelope);}
  ctx.restore();
 }
 function tick(now){
  if(!alive)return;const dt=last===null?0:Math.min(80,now-last);last=now;
  if(!document.hidden&&canPlay()){
   if(!canvas.isConnected)visual.append(canvas);trafficElapsed+=dt;if(now-lastPaint>=40){paint();lastPaint=now;}if(reduced)return;
  }
  raf=requestAnimationFrame(tick);
 }
 paint();raf=requestAnimationFrame(tick);
 return()=>{alive=false;cancelAnimationFrame(raf);canvas.remove();};
}
