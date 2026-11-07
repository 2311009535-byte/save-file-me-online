import {gameAudio} from './game-audio.js';
export const retryActionAssets={
 playerAttack:{audioGain:.733669,src:'/assets/retry/videos/player-attack.mp4',enabled:true,outTime:2,frames:[['3_1.png',450],['3_2.png',1300]]},
 bossAttack:{audioGain:.640472,src:'/assets/retry/videos/boss-attack.mp4',enabled:true,frames:[['3_3.png',650],['3_4.png',1200]]},
 duoAttack:{audioGain:.747309,src:'/assets/retry/videos/duo-attack.mp4',enabled:true,frames:[['3_9.JPG',450],['3_10.png',1150],['3_11.png',1800]]}
};
export function createRetryActions({visual,show,hold,assets=retryActionAssets,onCue=()=>{},startupTimeout=30000}){
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
   let finished=false,frame=0,loading=null,lastTime=0,lastProgress=performance.now();
   const waiting=setTimeout(()=>{if(finished)return;loading=document.createElement('div');loading.className='retry-action-loading';loading.setAttribute('role','status');loading.textContent='Preparing attack…';visual.append(loading);},500);
   const startup=setTimeout(()=>finish('missing'),startupTimeout);
   const stalled=setInterval(()=>{
    const now=performance.now();
    if(video.paused||document.hidden){lastProgress=now;return;}
    if(video.currentTime>lastTime+.01){lastTime=video.currentTime;lastProgress=now;}
    else if(now-lastProgress>=startupTimeout)finish('missing');
   },Math.min(1000,startupTimeout/4));
   const started=()=>{clearTimeout(waiting);clearTimeout(startup);loading?.remove();loading=null;};
   onCue('stopCombat');
   const detachAudio=gameAudio.bindVideoAudio(video,audioGain);
   const finish=result=>{
    if(finished)return;
    finished=true;
    clearInterval(stalled);
    started();
    video.removeEventListener('playing',started);
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
   video.addEventListener('playing',started);
   video.addEventListener('ended',ended);
   video.addEventListener('error',error);
   video.addEventListener('timeupdate',progress);
   if(video.requestVideoFrameCallback)
    frame=video.requestVideoFrameCallback(nextFrame);
   if(held&&!held.isConnected)held=null;
   delete video.dataset.heldFrame;
   if(held&&held!==video)visual.insertBefore(video,held);
   else visual.append(video);
   try{video.currentTime=0;}catch{error();return;}
   if(video.error){error();return;}
   const handoff=()=>{
    if(finished)return;
    if(held&&held!==video){held.remove();held=null;}
   };
   video.play().then(()=>{
    if(finished){video.pause();return;}
    if(video.requestVideoFrameCallback)video.requestVideoFrameCallback(handoff);
    else handoff();
   }).catch(error);
  });
 }
 function retryVideo(){
  return new Promise(resolve=>{
   const panel=document.createElement('div');panel.className='retry-video-error';panel.setAttribute('role','alert');
   const message=document.createElement('p');message.textContent='The attack animation could not load.';
   const button=document.createElement('button');button.type='button';button.textContent='RETRY ANIMATION';panel.append(message,button);visual.append(panel);
   const finish=ok=>{panel.remove();if(active?.panel===panel)active=null;resolve(ok);};
   active={panel,cancel:()=>finish(false)};button.addEventListener('click',()=>finish(true),{once:true});button.focus();
  });
 }
 return {
  captureHeldFrame(){
   if(!held||held.readyState<2||!held.videoWidth)return null;
   try{const frame=document.createElement('canvas');frame.width=held.videoWidth;frame.height=held.videoHeight;frame.getContext('2d').drawImage(held,0,0);return frame.toDataURL('image/png');}catch{return null;}
  },
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
    // Real attack clips must play. Never replace a failed video with stills
    // or settle the round while waiting for the player's explicit retry.
    while(result==='missing'&&asset.enabled){
     if(!await retryVideo()||disposed)return 'cancelled';
     const video=clips.get(group);video.load();
     result=await playClip(video,asset.outTime,asset.audioGain);
     if(disposed||result==='cancelled')return 'cancelled';
    }
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
