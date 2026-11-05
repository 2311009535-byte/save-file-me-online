import {prepareImage} from './image-cache.js';
// A passing car sweeps white pigment across the yellow walls. The existing
// pale painted light, blue furniture and black outlines stay untouched.
const W=960,H=540;
let trafficElapsed=0,paintedWall;
function wallPaint(){
 return paintedWall??=prepareImage('/assets/escape/room-clean.png').then(image=>{
  const c=document.createElement('canvas');c.width=W;c.height=H;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0,W,H);
  const pixels=ctx.getImageData(0,0,W,H),ink=pixels.data,alpha=new Uint8Array(W*H),points=[];let seed=2907;
  for(let p=0;p<alpha.length;p++){
   const i=p*4,r=ink[i],g=ink[i+1],b=ink[i+2];seed=(Math.imul(seed,1664525)+1013904223)>>>0;
   // Select the remaining saturated yellow, excluding the baked pale light.
   const yellow=r>175&&g>160&&b<100&&Math.abs(r-g)<60;
   alpha[p]=yellow?Math.round(210*(.8+(seed/4294967296)*.2)):0;
   if(alpha[p])points.push(p);
  }
  return{alpha,points};
 }).catch(error=>{paintedWall=null;throw error;});
}
export function mountWindowTraffic(visual,{canPlay=()=>true}={}){
 const layer=document.createElement('canvas');layer.width=W;layer.height=H;layer.className='escape-window-traffic';layer.dataset.surface='yellow-walls';layer.setAttribute('aria-hidden','true');Object.assign(layer.style,{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none'});visual.append(layer);
 const ctx=layer.getContext('2d'),frame=ctx.createImageData(W,H),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let alive=true,raf=0,last=null,lastPaint=-Infinity,wall=null;
 wallPaint().then(paint=>{if(alive){wall=paint;layer.dataset.ready='true';}}).catch(()=>{});
 function paint(){
  const u=(trafficElapsed%6500-350)/4000,passing=!reduced&&wall&&u>0&&u<1;
  layer.dataset.motion=reduced?'static':'running';layer.dataset.passing=String(Boolean(passing));layer.dataset.phase=u.toFixed(4);
  if(!passing){ctx.clearRect(0,0,W,H);return;}
  // A broad vertical wash crosses the walls from left to right, covering
  // their full height before fading back to the fixed room exposure.
  const centre=-.45+1.9*u,envelope=Math.sin(u*Math.PI)**.7;
  for(const p of wall.points){
   const i=p*4;frame.data[i]=250;frame.data[i+1]=253;frame.data[i+2]=255;
   const distance=Math.abs((p%W)/W-centre),edge=Math.max(0,Math.min(1,(distance-.18)/.47));
   const band=1-edge*edge*(3-2*edge);
   frame.data[i+3]=Math.round(wall.alpha[p]*band*envelope);
  }
  ctx.putImageData(frame,0,0);
 }
 function tick(now){if(!alive)return;const dt=last===null?0:Math.min(80,now-last);last=now;if(!document.hidden&&canPlay()){trafficElapsed+=dt;if(now-lastPaint>=40){paint();lastPaint=now;}}raf=requestAnimationFrame(tick);}
 const reset=()=>{last=null;};document.addEventListener('visibilitychange',reset);raf=requestAnimationFrame(tick);
 return()=>{alive=false;cancelAnimationFrame(raf);document.removeEventListener('visibilitychange',reset);layer.remove();};
}
