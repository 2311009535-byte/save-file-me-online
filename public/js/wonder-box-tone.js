export const BOX_BRIGHTNESS=.56;
export function boxTransitionTone({back=false,roomBrightness=.44}={}){
 return(video,overlay)=>{let raf=0,alive=true;function tick(){if(!alive)return;const time=video.currentTime||0,duration=Number.isFinite(video.duration)?video.duration:4,raw=back?(time-duration+.8)/.8:time/.8,t=Math.max(0,Math.min(1,raw)),e=t*t*(3-2*t),from=back?BOX_BRIGHTNESS:roomBrightness,to=back?roomBrightness:BOX_BRIGHTNESS;overlay.style.filter=`brightness(${from+(to-from)*e})`;overlay.dataset.boxTone='true';raf=requestAnimationFrame(tick);}tick();return()=>{alive=false;cancelAnimationFrame(raf);overlay.style.filter='';};};
}
