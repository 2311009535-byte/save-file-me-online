// Headlights pass through the left window and sweep across the room's surfaces.
// Keep native ink and furniture silhouettes intact; no lights are drawn outside.
let trafficElapsed=0;
const W=960,H=540,S=.5;
let surfaces;
function roomSurfaces(){
 return surfaces??=new Promise(resolve=>{
  const image=new Image();image.onload=()=>{
   const mask=document.createElement('canvas');mask.width=W;mask.height=H;
   const ctx=mask.getContext('2d');ctx.scale(S,S);
   const patches=[
    [[450,0],[1170,0],[1090,240],[810,245],[725,285],[670,245],[535,335]], // back wall
    [[445,575],[570,335],[670,245],[750,285],[660,485],[535,690]], // bed
    [[750,535],[850,620],[1080,545],[1230,465],[1375,655],[1230,925],[1120,990],[760,975],[625,750]], // floor
    [[1500,55],[1720,420],[1550,790],[1240,950],[1370,600],[1430,330]] // right wall / door
   ];
   for(const points of patches){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();}
   ctx.setTransform(1,0,0,1,0,0);ctx.globalCompositeOperation='source-in';ctx.drawImage(image,0,0,W,H);
   const pixels=ctx.getImageData(0,0,W,H),d=pixels.data;
   for(let i=0;i<d.length;i+=4){const brightness=Math.max(d[i],d[i+1],d[i+2]);d[i+3]=Math.round(d[i+3]*Math.max(0,Math.min(1,(brightness-45)/140)));d[i]=d[i+1]=d[i+2]=255;}
   ctx.putImageData(pixels,0,0);resolve(mask.toDataURL());
  };image.onerror=()=>resolve(null);image.src='/assets/escape/room-clean.png';
 });
}
export function mountWindowTraffic(visual,{canPlay=()=>true}={}){
 const layer=document.createElement('div');layer.className='escape-window-traffic';layer.setAttribute('aria-hidden','true');Object.assign(layer.style,{position:'absolute',inset:0,pointerEvents:'none',contain:'strict',maskSize:'100% 100%',maskRepeat:'no-repeat'});
 const band=document.createElement('div');Object.assign(band.style,{position:'absolute',left:`${455/1920*100}%`,top:`${(330-190)/1080*100}%`,width:`${1500/1920*100}%`,height:`${380/1080*100}%`,transformOrigin:'0 50%',willChange:'transform, opacity',opacity:0,background:'linear-gradient(to bottom,rgba(255,246,207,0),rgba(255,246,207,.12) 18%,rgba(255,246,207,.32) 32%,rgba(255,246,207,.27) 42%,rgba(255,246,207,.17) 46%,rgba(255,246,207,.30) 50%,rgba(255,246,207,.23) 66%,rgba(255,246,207,.09) 82%,rgba(255,246,207,0))'});layer.append(band);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let alive=true,raf=0,last=null,lastPaint=-Infinity,ready=false;
 roomSurfaces().then(maskUrl=>{if(alive&&maskUrl){layer.style.maskImage=`url(${maskUrl})`;ready=true;}});
 function paint(){
  const local=trafficElapsed%13500,u=(local-1200)/4200,passing=!reduced&&ready&&u>0&&u<1;
  layer.dataset.motion=reduced?'static':'running';layer.dataset.passing=String(passing);layer.dataset.phase=u.toFixed(4);
  band.style.opacity=passing?String(Math.pow(Math.sin(u*Math.PI),1.3)):0;
  if(!passing)return;
  const angle=1.08-.88*u;layer.dataset.lightAngle=angle.toFixed(3);
  // Animate a composited band under a fixed surface mask. Repainting a full-room
  // canvas every frame also rerasterizes the native SVG mist on some browsers.
  band.style.transform=`rotate(${angle}rad) translateZ(0)`;
 }
 function tick(now){
  if(!alive)return;const dt=last===null?0:Math.min(80,now-last);last=now;
  // Defer mounting until camera movement settles, and pause during interactions.
  if(!document.hidden&&canPlay()){
   if(!layer.isConnected)visual.append(layer);trafficElapsed+=dt;if(now-lastPaint>=40){paint();lastPaint=now;}if(reduced)return;
  }
  raf=requestAnimationFrame(tick);
 }
 paint();raf=requestAnimationFrame(tick);
 return()=>{alive=false;cancelAnimationFrame(raf);layer.remove();};
}
