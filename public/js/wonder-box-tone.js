import {mountRoomLighting} from './wonder-room-lighting.js';
export const BOX_BRIGHTNESS=.56;
// Preserve the actual room's local lamp pools and shadows at the wide end of
// the film; move smoothly to one exposure for the close-up and its still.
export function boxTransitionTone({back=false,done={}}={}){
 return(video,overlay)=>{
  const mask=document.createElement('div');Object.assign(mask.style,{position:'absolute',inset:0,pointerEvents:'none',zIndex:1});overlay.style.isolation='isolate';overlay.append(mask);const disposeLight=mountRoomLighting(mask,{...done});let raf=0,alive=true;
  function tick(){if(!alive)return;const time=video.currentTime||0,duration=Number.isFinite(video.duration)?video.duration:4,raw=back?(time-duration+.85)/.85:time/.85,t=Math.max(0,Math.min(1,raw)),e=t*t*(3-2*t),roomWeight=back?e:1-e;mask.style.opacity=String(roomWeight);overlay.style.filter=`brightness(${BOX_BRIGHTNESS+(1-BOX_BRIGHTNESS)*roomWeight})`;overlay.dataset.boxTone='true';raf=requestAnimationFrame(tick);}
  tick();return()=>{alive=false;cancelAnimationFrame(raf);disposeLight();mask.remove();overlay.style.filter='';overlay.style.isolation='';};
 };
}
