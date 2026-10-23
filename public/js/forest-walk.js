import {ROUTE_LENGTH} from './forest-route.js';
import {createForestObservations} from './forest-observations.js';
export const LOOK_LIMITS={yaw:.38,up:.23,down:-.30};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function advanceWalk(state,forward,side,dt){
 // Limit elapsed time after a suspended tab, and keep the walker inside the rails.
 const step=clamp(dt,0,.25);
 state.progress=clamp(state.progress+forward*250*step/ROUTE_LENGTH,0,1);
 state.offset=clamp(state.offset+side*75*step,-55,55);
 return state;
}
export function walkingCamera(base,view){
 const yaw=base.yaw||0;
 const camera={...base,x:base.x+Math.cos(yaw)*view.offset,z:base.z-Math.sin(yaw)*view.offset,yaw:yaw+view.yaw,pitch:view.pitch};
 if(view.focus)for(const key of ['x','y','z','yaw','pitch'])camera[key]+=(view.focus.camera[key]-camera[key])*view.focus.amount;
 return camera;
}
// Shared with the door and painted atmosphere so their hit areas and sprites
// follow exactly the same yaw / pitch projection as the WebGL scenery.
export function projectForestPoint(camera,x,y,z){
 const yaw=camera.yaw||0,pitch=camera.pitch||0,dx=x-camera.x,dy=y-camera.y,dz=z-camera.z;
 const horizontal=Math.cos(yaw)*dx-Math.sin(yaw)*dz,depth=Math.sin(yaw)*dx+Math.cos(yaw)*dz;
 const vertical=Math.cos(pitch)*dy-Math.sin(pitch)*depth,d=Math.sin(pitch)*dy+Math.cos(pitch)*depth;
 return {x:836+900*horizontal/d,y:240-900*vertical/d,depth:d};
}
export function mountForestWalk({canvas,scroller,model,cameraAt}){
 const state={progress:model.progress,offset:0,yaw:0,pitch:0},keys=new Set(),held=new Set(),listeners=[];
 let targetYaw=0,targetPitch=0,drag=null,disposed=false;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),observations=createForestObservations(cameraAt);
 const on=(node,type,fn,options)=>{node.addEventListener(type,fn,options);listeners.push(()=>node.removeEventListener(type,fn,options));};
 const hud=document.createElement('nav');hud.className='forest-walk-controls';hud.setAttribute('aria-label','Forest exploration controls');
 hud.innerHTML='<div class="forest-look"><button data-look="sky" aria-label="Look at the sky"><span class="forest-full-label">Look at the sky</span><span class="forest-short-label" aria-hidden="true">Sky</span></button><button data-look="path" aria-label="Back to the path"><span class="forest-full-label">Back to the path</span><span class="forest-short-label" aria-hidden="true">Path</span></button></div><p class="forest-walk-hint">Hold W / ↑ to walk · S / ↓ to step back · A / D to sidestep<br>Drag / ← → to look · I / K to look up / down · R to face the path</p><span class="forest-touch-hint">Drag to look around</span><div class="forest-touch-walk" aria-label="Hold to move"><button data-move="left" aria-label="Step left">‹</button><button data-move="forward" aria-label="Walk forward">↑</button><button data-move="back" aria-label="Step backward">↓</button><button data-move="right" aria-label="Step right">›</button></div>';
 document.body.append(hud);
 const moment=document.createElement('aside');moment.className='forest-observation';moment.hidden=true;moment.setAttribute('aria-live','polite');
 moment.innerHTML='<p></p><button aria-label="Return to the path">Continue · Esc</button>';document.body.append(moment);
 on(moment.querySelector('button'),'click',()=>observations.skip());
 const choose=kind=>{
  targetYaw=0;targetPitch=kind==='sky'?.22:0;
  if(observations.active)observations.skip();
  hud.dataset.looking=kind;for(const b of hud.querySelectorAll('[data-look]'))b.setAttribute('aria-pressed',String(b.dataset.look===kind));
 };
 for(const button of hud.querySelectorAll('[data-look]'))on(button,'click',()=>choose(button.dataset.look));
 const codes=new Set(['KeyW','KeyS','KeyA','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyI','KeyK','KeyJ','KeyL','KeyR','Escape']);
 on(window,'keydown',e=>{if(!codes.has(e.code)||e.ctrlKey||e.metaKey||e.altKey)return;e.preventDefault();if(observations.active&&['KeyR','Escape'].includes(e.code)){observations.skip();return;}keys.add(e.code);if(e.code==='KeyR')choose('path');});
 on(window,'keyup',e=>{keys.delete(e.code);});
 const clear=()=>{keys.clear();held.clear();drag=null;};
 on(window,'blur',clear);on(document,'visibilitychange',()=>{if(document.hidden)clear();});
 on(scroller,'wheel',e=>e.preventDefault(),{passive:false});
 on(canvas,'pointerdown',e=>{if(e.button!==0||observations.active)return;canvas.focus({preventScroll:true});canvas.setPointerCapture(e.pointerId);drag={id:e.pointerId,x:e.clientX,y:e.clientY};});
 on(canvas,'pointermove',e=>{if(drag?.id!==e.pointerId)return;const scale=1.1/Math.max(320,canvas.clientWidth);targetYaw=clamp(targetYaw-(e.clientX-drag.x)*scale,-LOOK_LIMITS.yaw,LOOK_LIMITS.yaw);targetPitch=clamp(targetPitch+(e.clientY-drag.y)*scale,LOOK_LIMITS.down,LOOK_LIMITS.up);drag={id:e.pointerId,x:e.clientX,y:e.clientY};hud.dataset.looking='free';});
 on(canvas,'pointerup',()=>{drag=null;});on(canvas,'pointercancel',()=>{drag=null;});on(canvas,'lostpointercapture',()=>{drag=null;});
 for(const button of hud.querySelectorAll('[data-move]')){
  const release=()=>held.delete(button.dataset.move);
  on(button,'pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);held.add(button.dataset.move);});
  on(button,'pointerup',release);on(button,'pointercancel',release);on(button,'lostpointercapture',release);
 }
 canvas.tabIndex=0;canvas.setAttribute('aria-label','Sunset forest. Hold W or Up to walk; S or Down to step back. Drag to look around. R faces the path.');
 return {view:state,reset(){clear();observations.reset();state.focus=null;moment.hidden=true;state.progress=model.progress=0;state.offset=0;choose('path');},update(dt){
  if(disposed)return;
  const before=JSON.stringify(state),paused=document.hidden||!document.querySelector('#original-view').hidden||document.body.dataset.door==='opening';
  if(paused){clear();return false;}
  const down=(...codes)=>codes.some(c=>keys.has(c));
  const previous=state.progress;
  if(!observations.active)advanceWalk(state,Number(down('KeyW','ArrowUp')||held.has('forward'))-Number(down('KeyS','ArrowDown')||held.has('back')),Number(down('KeyD')||held.has('right'))-Number(down('KeyA')||held.has('left')),dt);
  const beat=observations.update(previous,state.progress,dt,reduced.matches);
  state.progress=beat.progress;state.focus=beat.focus;
  moment.hidden=!beat.focus;hud.classList.toggle('is-observing',Boolean(beat.focus));document.body.dataset.observation=beat.focus?beat.id:'none';document.body.dataset.observationPhase=beat.phase||'idle';
  if(beat.focus){moment.querySelector('p').textContent=beat.label;targetYaw=0;targetPitch=0;drag=null;}
  targetYaw=clamp(targetYaw+(Number(down('KeyL','ArrowRight'))-Number(down('KeyJ','ArrowLeft')))*dt*.5,-LOOK_LIMITS.yaw,LOOK_LIMITS.yaw);
  targetPitch=clamp(targetPitch+(Number(down('KeyI'))-Number(down('KeyK')))*dt*.5,LOOK_LIMITS.down,LOOK_LIMITS.up);
  const blend=reduced.matches?1:1-Math.exp(-dt*11);
  state.yaw+=(targetYaw-state.yaw)*blend;state.pitch+=(targetPitch-state.pitch)*blend;
  model.progress=state.progress;return before!==JSON.stringify(state);
 },dispose(){disposed=true;clear();listeners.forEach(remove=>remove());observations.reset();moment.remove();hud.remove();canvas.removeAttribute('tabindex');}};
}
