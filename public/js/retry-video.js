export const retryVideo={src:'/assets/retry/videos/victory-to-switch-closed.mp4',available:true};
export function createRetryVideo(){
 let video=null,cancel=null,disposed=false,still=null,stillJob=null,stopStill=null;
 if(retryVideo.available){video=document.createElement('video');video.src=retryVideo.src;video.preload='auto';video.muted=true;video.playsInline=true;video.className='retry-transition-video';video.load();}
 function wait(event,ready,start=()=>{}){if(ready())return Promise.resolve(true);return new Promise(resolve=>{let timer,finished=false;const done=ok=>{if(finished)return;finished=true;clearTimeout(timer);video.removeEventListener(event,yes);video.removeEventListener('error',no);stopStill=null;resolve(ok&&!disposed);},yes=()=>done(true),no=()=>done(false);stopStill=no;video.addEventListener(event,yes);video.addEventListener('error',no);timer=setTimeout(no,15000);try{start();}catch{no();}});}
 async function finalFrame(){
  if(disposed||!video)return null;if(still)return still;if(stillJob)return stillJob;
  stillJob=(async()=>{
   if(!await wait('loadedmetadata',()=>video.readyState>=1)||disposed)return null;
   video.pause();const target=Math.max(0,video.duration-.025);
   // Seek to the actual final video frame. Fast playback can drop the final
   // presented frame and produce a differently zoomed desk photograph.
   if(!await wait('seeked',()=>Math.abs(video.currentTime-target)<.008&&!video.seeking&&video.readyState>=2,()=>{video.currentTime=target;})||disposed)return null;
   try{const c=document.createElement('canvas');c.width=1672;c.height=941;c.getContext('2d').drawImage(video,0,0,c.width,c.height);still=c.toDataURL('image/jpeg',.97);return still;}catch{return null;}
  })();try{return await stillJob;}finally{stillJob=null;}
 }
 return{finalFrame,async play(visual){if(disposed)return 'cancelled';if(!video)return 'missing';visual.append(video);return new Promise(resolve=>{let timer,finished=false;const finish=result=>{if(finished)return;finished=true;clearTimeout(timer);video.pause();if(result!=='ended')video.remove();video.removeEventListener('ended',ended);video.removeEventListener('error',error);cancel=null;resolve(result);},ended=()=>finish('ended'),error=()=>finish('missing');cancel=()=>finish('cancelled');video.addEventListener('ended',ended);video.addEventListener('error',error);timer=setTimeout(error,20000);try{video.currentTime=0;video.play().catch(error);}catch{error();}});},dispose(){disposed=true;stopStill?.();cancel?.();video?.pause();video?.remove();if(video){video.removeAttribute('src');video.load();}}};
}
