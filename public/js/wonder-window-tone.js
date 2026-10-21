import {mountWindowBackMask} from './wonder-window-ui-mask.js';
export const WINDOW_BRIGHTNESS=.65;
// Grade the whole transition (including its temporary return-state overlay).
export function windowTransitionTone({back=false,roomBrightness=.56,returnEffect=null}={}){
 return(video,overlay)=>{
  const release=returnEffect?.(video,overlay),releaseUI=mountWindowBackMask(overlay,video,{back});let alive=true,raf=0;
  function frame(){if(!alive)return;const time=video.currentTime||0,duration=Number.isFinite(video.duration)?video.duration:4;const raw=back?(time-(duration-.85))/.85:time/1.1,t=Math.max(0,Math.min(1,raw)),ease=t*t*(3-2*t);const from=back?WINDOW_BRIGHTNESS:roomBrightness,to=back?roomBrightness:WINDOW_BRIGHTNESS;overlay.style.filter=`brightness(${from+(to-from)*ease})`;overlay.dataset.windowTone='true';raf=requestAnimationFrame(frame);}
  frame();return()=>{alive=false;cancelAnimationFrame(raf);release?.();releaseUI();overlay.style.filter='';};
 };
}
