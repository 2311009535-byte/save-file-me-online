import {gameAudio} from './game-audio.js';
export const retryActionAssets={
 playerAttack:{audioGain:.733669,src:'/assets/retry/videos/player-attack.mp4',enabled:true,outTime:2,frames:[['3_1.png',450],['3_2.png',1300]]},
 bossAttack:{audioGain:.640472,src:'/assets/retry/videos/boss-attack.mp4',enabled:true,frames:[['3_3.png',650],['3_4.png',1200]]},
 duoAttack:{audioGain:.747309,src:'/assets/retry/videos/duo-attack.mp4',enabled:true,frames:[['3_9.JPG',450],['3_10.png',1150],['3_11.png',1800]]}
};
export function createRetryActions({visual,show,hold,assets=retryActionAssets,onCue=()=>{}}){
 let disposed=false,active=null,playing=false,abortPlayback=null,held=null;
 const clips=new Map();
 for(const [name,asset] of Object.entries(assets))if(asset.enabled){
  const video=document.createElement('video');
  video.src=asset.src;
  video.preload='auto';
  video.muted=true;
  video.playsInline=true;
  video.loop=false;
  video.className='retry-action-video';
  video.load();
  clips.set(name,video);
 }
 function playClip(video,outTime=null,audioGain=1){
  return new Promise(resolve=>{
   let finished=false,frame=0;
   onCue('stopCombat');
   const detachAudio=gameAudio.bindVideoAudio(video,audioGain);
   const finish=result=>{
    if(finished)return;
    finished=true;
    detachAudio();
    if(frame)video.cancelVideoFrameCallback?.(frame);
    video.removeEventListener('timeupdate',progress);
    video.pause();
    if(result!=='ended')onCue('stopCombat');
    if(result==='ended'){
     held=video;
     video.dataset.heldFrame='true';
    }else video.remove();
    video.removeEventListener('ended',ended);
    video.removeEventListener('error',error);
    if(active?.video===video)active=null;
    resolve(result);
   };
   const ended=()=>finish('ended'),error=()=>finish('missing');
   const progress=()=>{
    if(Number.isFinite(outTime)&&video.currentTime>=outTime)ended();
   };
   const nextFrame=()=>{
    if(finished)return;
    progress();
    if(!finished&&video.requestVideoFrameCallback)
     frame=video.requestVideoFrameCallback(nextFrame);
   };
   active={video,cancel:()=>finish('cancelled')};
   video.addEventListener('ended',ended);
   video.addEventListener('error',error);
   video.addEventListener('timeupdate',progress);
   if(video.requestVideoFrameCallback)
    frame=video.requestVideoFrameCallback(nextFrame);
   if(held&&!held.isConnected)held=null;
   delete video.dataset.heldFrame;
   if(held&&held!==video)visual.insertBefore(video,held);
   else visual.append(video);
   video.currentTime=0;
   if(video.error){error();return;}
   const handoff=()=>{
    if(finished)return;
    if(held&&held!==video){held.remove();held=null;}
   };
   video.play().then(()=>{
    if(finished)return;
    if(video.requestVideoFrameCallback)video.requestVideoFrameCallback(handoff);
    else handoff();
   }).catch(error);
  });
 }
 return {
  async play(group,{onEnded=()=>{}}={}){
   if(disposed)return 'cancelled';
   if(playing)throw new Error('Retry action playback is already active');
   const asset=assets[group];
   if(!asset)throw new Error('Unknown Retry action group: '+group);
   playing=true;
   const cancelled=new Promise(resolve=>{abortPlayback=()=>resolve(false);});
   const wait=p=>Promise.race([p,cancelled]);
   try{
    let result=clips.has(group)?
     await playClip(clips.get(group),asset.outTime,asset.audioGain):'missing';
    if(disposed||result==='cancelled')return 'cancelled';
    if(result==='missing'){
     active={cancel:()=>{}};
     try{
      for(const [file,duration] of asset.frames){
       if(disposed||!await wait(show(file))){
        result='cancelled';break;
       }
       if(!await wait(hold(duration))){
        result='cancelled';break;
       }
       result='ended';
      }
     }finally{active=null;}
    }
    if(disposed||result!=='ended')return 'cancelled';
    await onEnded();
    return disposed?'cancelled':'ended';
   }finally{playing=false;abortPlayback=null;}
  },
  dispose(){
   onCue('stopCombat');
   disposed=true;
   abortPlayback?.();
   active?.cancel();
   for(const video of clips.values()){
    video.pause();
    video.remove();
    video.removeAttribute('src');
    video.load();
   }
   clips.clear();
   held=null;
  }
 };
}
