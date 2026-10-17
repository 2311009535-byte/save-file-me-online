// Enable each clip only after the user supplies and approves its final frame.
export const videoTransitions={
 window:{enter:{src:'/assets/wonder/videos/window_enter.mp4',available:true},return:{src:'/assets/wonder/videos/window_return.mp4',available:true}},
 box:{enter:{src:'/assets/wonder/videos/box_enter.mp4',available:true},return:{src:'/assets/wonder/videos/box_return.mp4',available:true}}
};
export function createVideoTransitions(transitions=videoTransitions,overlayClass='wonder-video-overlay'){
 const prepared=new Map();let active=null,overlay=null,abort=null,disposed=false,disposeEffect=null;
 function preload(clip){
  if(!clip.available)return null;
  if(prepared.has(clip.src))return prepared.get(clip.src);
  const video=document.createElement('video');video.src=clip.src;video.preload='auto';video.muted=true;video.playsInline=true;video.controls=false;
  const ready=new Promise(resolve=>{
   let timer;const finish=ok=>{clearTimeout(timer);video.removeEventListener('canplay',yes);video.removeEventListener('error',no);if(!ok)prepared.delete(clip.src);resolve(ok);};
   const yes=()=>finish(true),no=()=>finish(false);video.addEventListener('canplay',yes);video.addEventListener('error',no);timer=setTimeout(no,30000);video.load();
  });
  const entry={video,ready};prepared.set(clip.src,entry);return entry;
 }
 // Load only the selected transition. Two large eager downloads could time out
 // before the player selected an object, permanently caching a failed preload.
 function cancel(){disposeEffect?.();disposeEffect=null;abort?.();abort=null;active?.pause();active=null;overlay?.remove();overlay=null;}
 async function play(view,back,stage,{effect=null}={}){
  cancel();const entry=preload(transitions[view][back?'return':'enter']);if(!entry)return 'missing';
  const video=entry.video;active=video;
  const ready=await Promise.race([entry.ready,new Promise(resolve=>{abort=()=>resolve(false);})]);
  if(disposed||active!==video)return 'cancelled';
  if(!ready){
   console.warn('Wonder transition video unavailable:',video.src);
   overlay=document.createElement('div');overlay.className=overlayClass;
   const loading=document.createElement('div');loading.className='wonder-video-loading';loading.textContent='ANIMATION COULD NOT LOAD. ';loading.setAttribute('role','status');overlay.append(loading);stage.append(overlay);
   const retry=document.createElement('button');retry.textContent='RETRY';loading.append(retry);
   const again=await new Promise(resolve=>{abort=()=>resolve(false);retry.onclick=()=>resolve(true);});
   if(!again||disposed||active!==video)return 'cancelled';
   return play(view,back,stage,{effect});
  }
  overlay=document.createElement('div');overlay.className=overlayClass;overlay.append(video);stage.append(overlay);video.currentTime=0;
  if(effect)disposeEffect=effect(video,overlay);
  return new Promise(resolve=>{
   let timer;const finish=result=>{clearTimeout(timer);video.removeEventListener('ended',ended);video.removeEventListener('error',failed);abort=null;resolve(result);};
   const ended=()=>finish('ended'),failed=()=>{console.warn('Wonder transition playback failed:',video.src);finish('missing');};
   abort=()=>finish('cancelled');video.addEventListener('ended',ended);video.addEventListener('error',failed);
   timer=setTimeout(failed,Math.max(15000,(Number.isFinite(video.duration)?video.duration:10)*1000+10000));
   video.play().catch(failed);
  });
 }
 return {play,cancel,layer:()=>overlay,dispose(){disposed=true;cancel();prepared.forEach(({video})=>{video.pause();video.removeAttribute('src');video.load();});prepared.clear();}};
}
