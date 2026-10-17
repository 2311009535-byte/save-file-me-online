// Enable when a matching-final-frame clip has been supplied.
export const retryVideo={src:'/assets/retry/videos/victory-to-switch.mp4',available:true};
export function createRetryVideo(){
 let video=null,cancel=null,disposed=false,still=null,stillJob=null,stopStill=null;
 if(retryVideo.available){video=document.createElement('video');video.src=retryVideo.src;video.preload='auto';video.muted=true;video.playsInline=true;video.className='retry-transition-video';video.load();}
 function capture(){const c=document.createElement('canvas');c.width=1672;c.height=941;c.getContext('2d').drawImage(video,0,0,c.width,c.height);still=c.toDataURL('image/jpeg',.97);return still;}
 async function finalFrame(){
  if(disposed||!video)return null;if(still)return still;if(stillJob)return stillJob;
  if(video.ended&&video.readyState>=2)return capture();
  stillJob=new Promise(resolve=>{
   let timer;const finish=value=>{clearTimeout(timer);video.pause();video.playbackRate=1;video.removeEventListener('ended',done);video.removeEventListener('error',fail);stopStill=null;resolve(value);};
   const fail=()=>finish(null),done=()=>{try{finish(disposed?null:capture());}catch{fail();}};
   stopStill=fail;video.addEventListener('ended',done);video.addEventListener('error',fail);timer=setTimeout(fail,15000);
   // The local static server does not support byte ranges. Decode through the
   // clip silently rather than seeking, which can silently land on frame zero.
   video.playbackRate=8;video.play().catch(fail);
  });const value=await stillJob;stillJob=null;return value;
 }
 return {finalFrame,async play(visual){if(disposed)return 'cancelled';if(!video)return 'missing';visual.append(video);video.currentTime=0;return new Promise(resolve=>{let timer;const finish=result=>{clearTimeout(timer);video.pause();if(result!=='ended')video.remove();video.removeEventListener('ended',ended);video.removeEventListener('error',error);cancel=null;resolve(result);};const ended=()=>finish('ended'),error=()=>finish('missing');cancel=()=>finish('cancelled');video.addEventListener('ended',ended);video.addEventListener('error',error);timer=setTimeout(error,20000);video.play().catch(error);});},dispose(){disposed=true;stopStill?.();cancel?.();video?.pause();video?.remove();if(video){video.removeAttribute('src');video.load();}}};
}
