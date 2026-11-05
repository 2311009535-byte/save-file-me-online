import {prepareImage} from './image-cache.js';
// The pale ribbon in the drawing curls around the room. Lemon-yellow ink,
// blue furniture and black outlines never receive the moving white paint.
const W=960,H=540;
let trafficElapsed=0,paintedWall;
function wallPaint(){
 return paintedWall??=prepareImage('/assets/escape/room-clean.png').then(image=>{
  const c=document.createElement('canvas');c.width=W;c.height=H;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0,W,H);
  const pixels=ctx.getImageData(0,0,W,H),ink=pixels.data,alpha=new Uint8Array(W*H),angle=new Float32Array(W*H),points=[];let seed=2907;
  for(let p=0;p<alpha.length;p++){
   const i=p*4,r=ink[i],g=ink[i+1],b=ink[i+2];seed=(Math.imul(seed,1664525)+1013904223)>>>0;
   // Pale yellow has a substantial blue channel; lemon pigment does not.
   const pale=r>180&&g>180&&b>100&&b<225&&Math.abs(r-g)<45;
   alpha[p]=pale?Math.round(210*(.8+(seed/4294967296)*.2)*Math.min(1,(b-100)/35)):0;
   if(alpha[p])points.push(p);
   angle[p]=Math.atan2((Math.floor(p/W)-H*.45)/(.49*H),(p%W-W*.5)/(.43*W));
  }
  return{alpha,angle,points};
 }).catch(error=>{paintedWall=null;throw error;});
}
export function mountWindowTraffic(visual,{canPlay=()=>true}={}){
 const layer=document.createElement('canvas');layer.width=W;layer.height=H;layer.className='escape-window-traffic';layer.dataset.surface='pale-wall-ribbon';layer.setAttribute('aria-hidden','true');Object.assign(layer.style,{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none'});visual.append(layer);
 const ctx=layer.getContext('2d'),frame=ctx.createImageData(W,H),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let alive=true,raf=0,last=null,lastPaint=-Infinity,wall=null;
 wallPaint().then(paint=>{if(alive){wall=paint;layer.dataset.ready='true';}}).catch(()=>{});
 function paint(){
  const u=(trafficElapsed%6500-350)/4000,passing=!reduced&&wall&&u>0&&u<1;
  layer.dataset.motion=reduced?'static':'running';layer.dataset.passing=String(Boolean(passing));layer.dataset.phase=u.toFixed(4);
  if(!passing){ctx.clearRect(0,0,W,H);return;}
  // The whole pale wall lights from ceiling to floor. A broad moving wash
  // shifts along its curve; it never becomes a small spotlight.
  const centre=-Math.PI+u*Math.PI*2,envelope=Math.sin(u*Math.PI)**.7;
  for(const p of wall.points){
   const i=p*4;frame.data[i]=250;frame.data[i+1]=253;frame.data[i+2]=255;
   const d=Math.atan2(Math.sin(wall.angle[p]-centre),Math.cos(wall.angle[p]-centre));
   const band=.82+.18*Math.cos(d);
   frame.data[i+3]=Math.round(wall.alpha[p]*band*envelope);
  }
  ctx.putImageData(frame,0,0);
 }
 function tick(now){if(!alive)return;const dt=last===null?0:Math.min(80,now-last);last=now;if(!document.hidden&&canPlay()){trafficElapsed+=dt;if(now-lastPaint>=40){paint();lastPaint=now;}}raf=requestAnimationFrame(tick);}
 const reset=()=>{last=null;};document.addEventListener('visibilitychange',reset);raf=requestAnimationFrame(tick);
 return()=>{alive=false;cancelAnimationFrame(raf);document.removeEventListener('visibilitychange',reset);layer.remove();};
}
