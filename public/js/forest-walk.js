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
 const camera={...base,x:base.x+Math.cos(yaw)*view.offset,z:base.z-Math.sin(yaw)*view.offset,yaw:yaw+view.yaw,pitch:view.pitch,fullSky:view.sky||0,roll:0,zoom:1};
 if(view.focus)for(const key of ['x','y','z','yaw','pitch','fullSky','roll','zoom'])camera[key]+=((view.focus.camera[key]??(key==='zoom'?1:0))-camera[key])*view.focus.amount;
 const gait=view.gaitMix||0,phase=view.gaitPhase||0;camera.y+=Math.sin(phase*2)*.75*gait;camera.x+=Math.cos(phase)*.6*gait;camera.roll+=Math.sin(phase)*.003*gait;camera.zoom*=1-.025*gait;
 return camera;
}
// Shared with the door and painted atmosphere so their hit areas and sprites
// follow exactly the same yaw / pitch projection as the WebGL scenery.
export function projectForestPoint(camera,x,y,z){
 const yaw=camera.yaw||0,pitch=camera.pitch||0,dx=x-camera.x,dy=y-camera.y,dz=z-camera.z;
 const horizontal=Math.cos(yaw)*dx-Math.sin(yaw)*dz,depth=Math.sin(yaw)*dx+Math.cos(yaw)*dz;
 const vertical=Math.cos(pitch)*dy-Math.sin(pitch)*depth,d=Math.sin(pitch)*dy+Math.cos(pitch)*depth;
 const roll=camera.roll||0,zoom=camera.zoom||1;return {x:836+900*zoom*(Math.cos(roll)*horizontal+Math.sin(roll)*vertical)/d,y:240-900*zoom*(-Math.sin(roll)*horizontal+Math.cos(roll)*vertical)/d,depth:d};
}
export function mountForestWalk({canvas,scroller,model,cameraAt}){
 const state={progress:model.progress,offset:0,yaw:0,pitch:0,sky:0,gaitMix:0,gaitPhase:0},keys=new Set(),held=new Set(),listeners=[];
 let targetYaw=0,targetPitch=0,targetSky=0,drag=null,disposed=false,cued=null;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),observations=createForestObservations(cameraAt);
 const on=(node,type,fn,options)=>{node.addEventListener(type,fn,options);listeners.push(()=>node.removeEventListener(type,fn,options));};
 const hud=document.createElement('nav');hud.className='forest-walk-controls';hud.setAttribute('aria-label','Forest exploration controls');
 hud.innerHTML='<div class="forest-look"><button data-look="sky" aria-label="Look at the sky"><span class="forest-full-label">Look at the sky</span><span class="forest-short-label" aria-hidden="true">Sky</span></button><button data-look="path" aria-label="Back to the path"><span class="forest-full-label">Back to the path</span><span class="forest-short-label" aria-hidden="true">Path</span></button></div><p class="forest-walk-hint">Hold W / ↑ to walk · S / ↓ to step back · A / D to sidestep<br>Drag / ← → to look · I / K to look up / down · R to face the path</p><span class="forest-touch-hint">Drag to look around</span><div class="forest-touch-walk" aria-label="Hold to move"><button data-move="left" aria-label="Step left">‹</button><button data-move="forward" aria-label="Walk forward">↑</button><button data-move="back" aria-label="Step backward">↓</button><button data-move="right" aria-label="Step right">›</button></div>';
 document.body.append(hud);
 const guide=document.createElement('section');guide.className='forest-walk-guide';guide.setAttribute('role','status');guide.setAttribute('aria-label','How to explore the forest');guide.append(hud.querySelector('.forest-walk-hint'),hud.querySelector('.forest-touch-hint'));guide.querySelector('.forest-touch-hint').innerHTML='Hold ↑ / ↓ to walk · ‹ / › to sidestep<br>Drag to look around · Sky / Path to change your view';document.body.append(guide);
 const dismissGuide=()=>{guide.classList.add('is-dismissed');guide.setAttribute('aria-hidden','true');};

 const moment=document.createElement('aside');moment.className='forest-observation';moment.hidden=true;moment.setAttribute('aria-live','polite');
 moment.innerHTML='<p></p><button aria-label="Return to the path">Continue · Esc</button>';document.body.append(moment);
 const grass=document.createElement('div');grass.className='forest-rest-grass';grass.hidden=true;grass.setAttribute('aria-hidden','true');grass.innerHTML='<img src="/assets/escape/parallax/flowers/grass-sparse.png" alt=""><img src="/assets/escape/parallax/flowers/grass-sparse.png" alt="">';document.body.append(grass);
 on(moment.querySelector('button'),'click',()=>observations.skip());
 on(document,'forest-wildlife-interact',e=>observations.react(e.detail.kind,e.detail));
 const choose=kind=>{
  targetYaw=0;targetPitch=kind==='sky'?.22:0;targetSky=kind==='sky'?1:0;
  if(observations.active)observations.skip();
  hud.dataset.looking=kind;for(const b of hud.querySelectorAll('[data-look]'))b.setAttribute('aria-pressed',String(b.dataset.look===kind));
 };
 for(const button of hud.querySelectorAll('[data-look]'))on(button,'click',()=>choose(button.dataset.look));
 const codes=new Set(['KeyW','KeyS','KeyA','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyI','KeyK','KeyJ','KeyL','KeyR','Escape']);
 on(window,'keydown',e=>{if(!codes.has(e.code)||e.ctrlKey||e.metaKey||e.altKey)return;e.preventDefault();if(observations.active&&['KeyR','Escape'].includes(e.code)){observations.skip();return;}if(targetSky&&['KeyW','KeyS','ArrowUp','ArrowDown'].includes(e.code))choose('path');keys.add(e.code);if(e.code==='KeyR'||e.code==='Escape')choose('path');});
 on(window,'keyup',e=>{keys.delete(e.code);});
 const clear=()=>{keys.clear();held.clear();drag=null;};
 on(window,'blur',clear);on(document,'visibilitychange',()=>{if(document.hidden)clear();});
 on(scroller,'wheel',e=>e.preventDefault(),{passive:false});
 on(canvas,'pointerdown',e=>{if(e.button!==0||observations.active)return;canvas.focus({preventScroll:true});canvas.setPointerCapture(e.pointerId);drag={id:e.pointerId,x:e.clientX,y:e.clientY};});
 on(canvas,'pointermove',e=>{if(drag?.id!==e.pointerId)return;const scale=1.1/Math.max(320,canvas.clientWidth);targetYaw=clamp(targetYaw-(e.clientX-drag.x)*scale,-LOOK_LIMITS.yaw,LOOK_LIMITS.yaw);targetPitch=clamp(targetPitch+(e.clientY-drag.y)*scale,LOOK_LIMITS.down,LOOK_LIMITS.up);drag={id:e.pointerId,x:e.clientX,y:e.clientY};hud.dataset.looking='free';});
 on(canvas,'pointerup',()=>{drag=null;});on(canvas,'pointercancel',()=>{drag=null;});on(canvas,'lostpointercapture',()=>{drag=null;});
 for(const button of hud.querySelectorAll('[data-move]')){
  const release=()=>held.delete(button.dataset.move);
  on(button,'pointerdown',e=>{e.preventDefault();if(targetSky)choose('path');button.setPointerCapture(e.pointerId);held.add(button.dataset.move);});
  on(button,'pointerup',release);on(button,'pointercancel',release);on(button,'lostpointercapture',release);
 }
 canvas.tabIndex=0;canvas.setAttribute('aria-label','Sunset forest. Hold W or Up to walk; S or Down to step back. Drag to look around. R faces the path.');
 return {view:state,reset(){clear();observations.reset();state.focus=null;state.gaitMix=0;state.gaitPhase=0;cued=null;state.sky=0;moment.hidden=true;grass.hidden=true;state.progress=model.progress=0;state.offset=0;guide.classList.remove('is-dismissed');guide.removeAttribute('aria-hidden');choose('path');},update(dt){
  if(disposed)return;
  const before=JSON.stringify(state),paused=document.hidden||!document.querySelector('#original-view').hidden||document.body.dataset.door==='opening';
  if(paused){clear();return false;}
  const down=(...codes)=>codes.some(c=>keys.has(c));
  const previous=state.progress,previousOffset=state.offset;
  if(!observations.active&&!targetSky&&state.sky<.02)advanceWalk(state,Number(down('KeyW','ArrowUp')||held.has('forward'))-Number(down('KeyS','ArrowDown')||held.has('back')),Number(down('KeyD')||held.has('right'))-Number(down('KeyA')||held.has('left')),dt);
  if(state.progress!==previous||state.offset!==previousOffset)dismissGuide();
  const beat=observations.update(previous,state.progress,dt,reduced.matches);
  state.progress=beat.progress;state.focus=beat.focus;
  const walking=!beat.focus&&Math.abs(state.progress-previous)>1e-8&&!reduced.matches;state.gaitMix+=(Number(walking)-state.gaitMix)*(1-Math.exp(-dt*7));if(walking)state.gaitPhase+=Math.abs(state.progress-previous)*ROUTE_LENGTH*.045;
  if(beat.focus&&beat.phase==='holding'&&cued!==beat.id&&['rabbit-friend','butterfly-visit'].includes(beat.id)){cued=beat.id;document.dispatchEvent(new CustomEvent('forest-wildlife-cue',{detail:{kind:beat.id==='rabbit-friend'?'rabbit':'butterfly'}}));}
  grass.hidden=!(beat.focus&&beat.id==='meadow-rest');grass.style.opacity=String((beat.focus?.amount||0)*(beat.focus?.camera.fullSky||0));
  moment.hidden=!beat.focus;hud.classList.toggle('is-observing',Boolean(beat.focus));document.body.dataset.observation=beat.focus?beat.id:'none';document.body.dataset.observationPhase=beat.phase||'idle';
  if(beat.focus){moment.querySelector('p').textContent=beat.label;targetYaw=0;targetPitch=0;targetSky=0;drag=null;}
  targetYaw=clamp(targetYaw+(Number(down('KeyL','ArrowRight'))-Number(down('KeyJ','ArrowLeft')))*dt*.5,-LOOK_LIMITS.yaw,LOOK_LIMITS.yaw);
  targetPitch=clamp(targetPitch+(Number(down('KeyI'))-Number(down('KeyK')))*dt*.5,LOOK_LIMITS.down,LOOK_LIMITS.up);
  const blend=reduced.matches?1:1-Math.exp(-dt*11);
  state.sky+=(targetSky-state.sky)*blend;state.yaw+=(targetYaw-state.yaw)*blend;state.pitch+=(targetPitch-state.pitch)*blend;
  model.progress=state.progress;return before!==JSON.stringify(state);
 },dispose(){disposed=true;clear();listeners.forEach(remove=>remove());observations.reset();moment.remove();grass.remove();guide.remove();hud.remove();canvas.removeAttribute('tabindex');}};
}
