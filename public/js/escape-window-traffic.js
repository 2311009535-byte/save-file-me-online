import {headlightSurfaces,surfacePoint,projectQuad} from './escape-headlight-projection.js';
// Headlights pass through the left window and sweep across the room's surfaces.
// Keep native ink and furniture silhouettes intact; no lights are drawn outside.
let trafficElapsed=0;
const W=960,H=540,S=.5;
let surfaces;
function roomSurfaces(){
 return surfaces??=new Promise(resolve=>{
  const image=new Image();image.onload=()=>{
   const source=document.createElement('canvas');source.width=W;source.height=H;const sc=source.getContext('2d');sc.drawImage(image,0,0,W,H);
   const ink=sc.getImageData(0,0,W,H).data,masks={};
   for(const surface of headlightSurfaces){
    const mask=document.createElement('canvas');mask.width=W;mask.height=H;const ctx=mask.getContext('2d');ctx.scale(S,S);
    for(let j=0;j<surface.v.length-1;j++)for(let i=0;i<surface.u.length-1;i++){
     const points=[surface.grid[j][i],surface.grid[j][i+1],surface.grid[j+1][i+1],surface.grid[j+1][i]];
     ctx.beginPath();points.forEach(([x,y],n)=>n?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();
    }
    if(surface.name==='floor'){
     // The person, chair and bag occlude the floor; their coloured pixels are
     // not a floor surface just because they share its cyan ink palette.
     ctx.globalCompositeOperation='destination-out';
     for(const points of [
      [[920,282],[1008,280],[1050,340],[1080,415],[1080,475],[1100,500],[1090,580],[1020,660],[945,685],[870,625],[835,505],[800,475],[820,390],[880,350]],
      [[920,780],[1050,760],[1090,820],[1140,910],[1090,990],[990,1015],[900,970],[895,900]]
     ]){ctx.beginPath();points.forEach(([x,y],n)=>n?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();}
    }
    ctx.setTransform(1,0,0,1,0,0);const pixels=ctx.getImageData(0,0,W,H),d=pixels.data;
    for(let i=0;i<d.length;i+=4){const brightness=Math.max(ink[i],ink[i+1],ink[i+2]);d[i+3]=Math.round(d[i+3]*Math.max(0,Math.min(1,(brightness-45)/140)));d[i]=d[i+1]=d[i+2]=255;}
    ctx.putImageData(pixels,0,0);masks[surface.name]=mask.toDataURL();
   }
   resolve(masks);
  };image.onerror=()=>resolve(null);image.src='/assets/escape/room-clean.png';
 });
}
let paintedBand;
function headlightPaint(){
 if(paintedBand)return paintedBand;
 const canvas=document.createElement('canvas');canvas.width=750;canvas.height=190;
 const ctx=canvas.getContext('2d');let seed=2707;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 // Overlapping pale strokes match the flat printed colours in the source art.
 // Uneven edges and dry pigment are baked once, so the texture never shimmers.
 function stroke(top,bottom,alpha,roughness){
  const upper=[],lower=[];
  for(let x=0;x<=774;x+=24){upper.push([x,top+(random()-.5)*roughness]);lower.push([x,bottom+(random()-.5)*roughness]);}
  ctx.beginPath();[...upper,...lower.reverse()].forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=`rgba(250,253,255,${alpha})`;ctx.fill();
 }
 stroke(18,174,.07,12);stroke(29,162,.13,10);stroke(43,149,.20,8);
 stroke(54,135,.55,7);
 // Small breaks in the paint suggest window-frame shadows without adding ink.
 ctx.globalCompositeOperation='destination-out';ctx.fillStyle='rgba(0,0,0,.16)';
 ctx.beginPath();ctx.moveTo(0,93);ctx.lineTo(750,98);ctx.lineTo(750,102);ctx.lineTo(0,97);ctx.closePath();ctx.fill();
 const pixels=ctx.getImageData(0,0,canvas.width,canvas.height),d=pixels.data;
 for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){
  const i=(y*canvas.width+x)*4;
  // Fine paper tooth with occasional short dry-brush gaps, rather than blur.
  const tooth=.9+random()*.1;d[i+3]=Math.round(d[i+3]*tooth);
  if(random()<.018){d[i+3]=Math.round(d[i+3]*.55);if(x+1<canvas.width)d[i+7]=Math.round(d[i+7]*.7);}
 }
 ctx.putImageData(pixels,0,0);const vertical=document.createElement('canvas');vertical.width=190;vertical.height=750;const vc=vertical.getContext('2d');vc.setTransform(0,1,1,0,0,0);vc.drawImage(canvas,0,0);
 return paintedBand={horizontal:canvas.toDataURL(),vertical:vertical.toDataURL()};
}
export function mountWindowTraffic(visual,{canPlay=()=>true}={}){
 const layer=document.createElement('div');layer.className='escape-window-traffic';layer.setAttribute('aria-hidden','true');Object.assign(layer.style,{position:'absolute',inset:0,pointerEvents:'none',contain:'strict'});
 const pass=document.createElement('div');pass.className='escape-headlight-pass';Object.assign(pass.style,{position:'absolute',inset:0,opacity:0});layer.append(pass);
 const paintTexture=headlightPaint(),bands=[],panels=[];
 for(const surface of headlightSurfaces){
  const panel=document.createElement('div');panel.dataset.headlightSurface=surface.name;Object.assign(panel.style,{position:'absolute',inset:0,maskSize:'100% 100%',maskRepeat:'no-repeat'});pass.append(panel);panels.push(panel);
  const geometry=document.createElement('div');Object.assign(geometry.style,{position:'absolute',left:0,top:0,width:'1920px',height:'1080px',transformOrigin:'0 0'});panel.append(geometry);
  for(let j=0;j<surface.v.length-1;j++)for(let i=0;i<surface.u.length-1;i++){
   let u0=surface.u[i],u1=surface.u[i+1],v0=surface.v[j],v1=surface.v[j+1];
   // Reverse-project to the left window's vertical aperture. The same window
   // admits the bed light and bounds the light climbing the opposite wall.
   if(surface.kind==='horizontal'){u0=Math.max(u0,(.15-surface.z)/.35);u1=Math.min(u1,(.95-surface.z)/.35);}
   else{v0=Math.max(v0,.15-.35*surface.x);v1=Math.min(v1,.95-.35*surface.x);}
   if(u0>=u1||v0>=v1)continue;
   const width=(u1-u0)*1000,height=(v1-v0)*1000;
   const quad=[[u0,v0],[u1,v0],[u1,v1],[u0,v1]].map(([u,v])=>surfacePoint(surface,u,v));
   const patch=document.createElement('div');patch.className='escape-headlight-patch';Object.assign(patch.style,{position:'absolute',left:0,top:0,width:width+'px',height:height+'px',overflow:'hidden',transformOrigin:'0 0',transform:`matrix3d(${projectQuad(quad,width,height).join(',')})`});geometry.append(patch);
   const band=document.createElement('div');Object.assign(band.style,{position:'absolute',transformOrigin:'0 0',willChange:'transform',backgroundImage:`url(${paintTexture[surface.kind]})`,backgroundSize:'100% 100%',backgroundRepeat:'no-repeat'});
   if(surface.kind==='horizontal')Object.assign(band.style,{left:((.15-surface.z)/.35-u0)*1000+'px',top:(.42-.25-v0)*1000+'px',width:(.8/.35*1000)+'px',height:'500px'});
   else Object.assign(band.style,{left:(.42-.25-u0)*1000+'px',top:(.15-.35*surface.x-v0)*1000+'px',width:'500px',height:'800px'});
   patch.append(band);bands.push({band,surface});
  }
 }
 const resize=()=>{for(const panel of panels)panel.firstChild.style.transform=`scale(${visual.clientWidth/1920},${visual.clientHeight/1080})`;};
 resize();const observer=new ResizeObserver(resize);observer.observe(visual);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let alive=true,raf=0,last=null,lastPaint=-Infinity,ready=false;
 const resetClock=()=>{last=null;};document.addEventListener('visibilitychange',resetClock);
 roomSurfaces().then(masks=>{if(alive&&masks){for(const panel of panels)panel.style.maskImage=`url(${masks[panel.dataset.headlightSurface]})`;ready=true;}});
 function paint(){
  const local=trafficElapsed%8000,u=(local-600)/4200,passing=!reduced&&ready&&u>0&&u<1;
  layer.dataset.motion=reduced?'static':'running';layer.dataset.passing=String(passing);layer.dataset.phase=u.toFixed(4);
  pass.style.opacity=passing?String(Math.pow(Math.sin(u*Math.PI),.85)):0;
  if(!passing)return;
  const direction=-.55+1.1*u;layer.dataset.direction=direction.toFixed(3);
  // A shared incident ray shears horizontal planes, but translates along the
  // vertical wall. Both sample the same window coordinates (y - direction*x,
  // z + .35*x), so paint and window-frame shadows meet at surface seams.
  // Static mesh cells bend the projection around the illustration's corners.
  for(const {band,surface}of bands)band.style.transform=surface.kind==='horizontal'?`matrix(1,${direction},0,1,0,${direction*(.15-surface.z)/.35*1000}) translateZ(0)`:`translate3d(${direction*surface.x*1000}px,0,0)`;
 }
 function tick(now){
  if(!alive)return;const dt=last===null?0:now-last;last=now;
  if(!document.hidden&&canPlay()){
   if(!layer.isConnected)visual.append(layer);trafficElapsed+=dt;if(now-lastPaint>=40){paint();lastPaint=now;}if(reduced)return;
  }
  raf=requestAnimationFrame(tick);
 }
 paint();raf=requestAnimationFrame(tick);
 return()=>{alive=false;cancelAnimationFrame(raf);observer.disconnect();document.removeEventListener('visibilitychange',resetClock);layer.remove();};
}
