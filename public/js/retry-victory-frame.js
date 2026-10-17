// Keep the supplied combined clip's victory artwork, including after a reload.
export function createVictoryFrame(){
 let cached=null,owned=null,abort=null,disposed=false;
 const src='/assets/retry/videos/duo-attack.mp4';
 function wait(video,event,ready){
  if(ready())return Promise.resolve(true);
  return new Promise(resolve=>{
   let timer;const done=ok=>{clearTimeout(timer);video.removeEventListener(event,yes);video.removeEventListener('error',no);abort=null;resolve(ok&&!disposed);};
   const yes=()=>done(true),no=()=>done(false);abort=no;video.addEventListener(event,yes,{once:true});video.addEventListener('error',no,{once:true});timer=setTimeout(no,15000);
  });
 }
 return {
  async get(visual){
   if(disposed)return null;if(cached)return cached;
   let video=[...visual.querySelectorAll('video')].find(v=>v.src.endsWith('duo-attack.mp4')&&v.readyState>=2&&v.ended);
   if(!video){
    owned=document.createElement('video');video=owned;video.muted=true;video.playsInline=true;video.preload='auto';video.src=src;video.load();
    if(!await wait(video,'loadeddata',()=>video.readyState>=2)||disposed)return null;
    video.currentTime=Math.max(0,video.duration-.1);
    if(!await wait(video,'seeked',()=>!video.seeking&&video.readyState>=2)||disposed)return null;
   }
   const canvas=document.createElement('canvas');canvas.width=video.videoWidth;canvas.height=video.videoHeight;canvas.className='retry-victory-frame';canvas.dataset.source='duo-attack.mp4';canvas.setAttribute('aria-label','Victory — connection established.');
   canvas.getContext('2d').drawImage(video,0,0);cached=canvas;
   if(owned){owned.pause();owned.removeAttribute('src');owned.load();owned=null;}
   return canvas;
  },
  dispose(){disposed=true;abort?.();owned?.pause();if(owned){owned.removeAttribute('src');owned.load();owned=null;}cached=null;}
 };
}
