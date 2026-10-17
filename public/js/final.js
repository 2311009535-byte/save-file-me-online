import {storyCaption,FINAL_STORY_SECONDS} from './final-timeline.js';
import {createFinalFrontier} from './final-frontier.js';
export function mountFinal({root,onFinished}){
 const scene=document.createElement('section');scene.className='final-film';scene.dataset.phase='loading';scene.setAttribute('aria-label','Final · stepping outside');
 const style=document.createElement('style');style.textContent='.final-film{position:absolute;inset:0;background:#030405;color:#f2e3cb;font-family:monospace}.final-film video,.final-frontier,.final-opening{display:block;width:100%;height:100%;object-fit:contain}.final-frontier,.final-opening{position:absolute;inset:0;pointer-events:none}.final-film-controls{position:absolute;left:24px;bottom:20px;display:flex;gap:10px;align-items:center}.final-film button{font:calc(12px * var(--scene-ui,1)) monospace;color:#f2e3cb;background:#111b;border:1px solid #cfb78c66;padding:10px 14px;cursor:pointer}.final-film button:focus-visible{outline:2px solid #e5c794;outline-offset:3px}.final-film-status{position:absolute;inset:0;display:grid;place-content:center;gap:14px;text-align:center;background:#0005;font-size:calc(14px * var(--scene-ui,1))}.final-film-end{position:absolute;right:24px;bottom:20px;display:flex;gap:14px;align-items:center;font-size:calc(13px * var(--scene-ui,1))}.final-subtitle{position:absolute;left:9%;right:9%;top:50%;transform:translateY(-50%);margin:0;text-align:center;color:#f2eadf;font:calc(26px * var(--scene-ui,1))/1.55 Georgia,serif;text-shadow:0 2px 6px #000;pointer-events:none}';scene.append(style);
 const video=document.createElement('video');video.className='final-film-video';video.preload='auto';video.playsInline=true;video.poster='/assets/prologue/0_4.png';video.volume=.55;video.setAttribute('aria-label','Walk from the restored room into the unfinished world');scene.append(video);
 const canvas=document.createElement('canvas');canvas.className='final-frontier';canvas.hidden=true;scene.append(canvas);
 const blackout=document.createElement('div');blackout.className='final-cut';Object.assign(blackout.style,{position:'absolute',inset:'0',background:'#000',opacity:'0',pointerEvents:'none'});scene.append(blackout);
 const caption=document.createElement('p');caption.className='final-subtitle';caption.setAttribute('aria-live','polite');scene.append(caption);
 const controls=document.createElement('div');controls.className='final-film-controls';
 const button=(text,parent,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=text;b.onclick=fn;parent.append(b);return b;};
 const pause=button('PAUSE',controls,()=>{if(paused||video.paused&&mode==='film')play();else pausePlayback();});
 const sound=button('SOUND: ON',controls,()=>{video.muted=!video.muted;sound.textContent=video.muted?'SOUND: OFF':'SOUND: ON';sound.setAttribute('aria-pressed',String(!video.muted));});sound.setAttribute('aria-pressed','true');scene.append(controls);
 const status=document.createElement('div');status.className='final-film-status';status.setAttribute('role','status');
 const message=document.createElement('span');message.textContent='LOADING FINAL…';status.append(message);
 const retry=button('PLAY FINAL',status,()=>{if(scene.dataset.phase==='error')video.load();play();});retry.hidden=true;scene.append(status);
 const ending=document.createElement('div');ending.className='final-film-end';ending.hidden=true;
 const title=document.createElement('span');title.textContent='SAVE FILE : ME';ending.append(title);button('REPLAY',ending,replay);scene.append(ending);root.replaceChildren(scene);
 let alive=true,completed=false,attempt=0,timer=0,raf=0,last=0,mode='film',paused=false,storyTime=0,captionAnimation=null,resumeOnVisible=false;
 let cut='in',bridgeTime=0,outTime=0,frontier=null;
 const smooth=u=>{u=Math.max(0,Math.min(1,u));return u*u*(3-2*u);};
 const handlers=[];function listen(name,fn){video.addEventListener(name,fn);handlers.push([name,fn]);}
 function clear(){clearTimeout(timer);timer=0;}
 function text(value){if(caption.textContent===value)return;captionAnimation?.cancel();caption.textContent=value;captionAnimation=caption.animate([{opacity:0},{opacity:1}],{duration:matchMedia('(prefers-reduced-motion: reduce)').matches?1:400,easing:'ease-out'});}
 function tick(now){
  raf=0;if(!alive||paused)return;const dt=last?Math.min(.1,(now-last)/1000):0;last=now;
  const advancing=mode==='bridge'||mode==='hold'||mode==='film'&&!video.paused&&!video.seeking&&video.readyState>=3;
  if(advancing){storyTime+=dt;text(storyCaption(storyTime));}
  if(mode==='hold'){outTime+=dt;frontier.render(outTime);}
  if(mode==='bridge'){bridgeTime+=dt;if(bridgeTime>=2.4){mode='film';cut='out';play();}}
  else if(mode==='film'){
   const t=video.currentTime;
   if(video.playbackRate!==.6)video.playbackRate=.6;
   if(cut==='in'){blackout.style.opacity=String(smooth((t-.95)/.5));if(t>=1.5){video.pause();mode='bridge';bridgeTime=0;blackout.style.opacity='1';scene.dataset.phase='bridge';}}
   else if(cut==='out'){blackout.style.opacity=String(1-smooth((t-1.85)/.65));if(t>=2.5){cut='done';blackout.hidden=true;}}
  }
  else if(storyTime>=FINAL_STORY_SECONDS){ending.hidden=false;pause.hidden=true;scene.dataset.phase='ended';if(!completed){completed=true;onFinished();}return;}
  raf=requestAnimationFrame(tick);
 }
 function startClock(){if(!raf){last=0;raf=requestAnimationFrame(tick);}}
 function pausePlayback(){clear();paused=true;video.pause();cancelAnimationFrame(raf);raf=0;last=0;status.hidden=true;pause.textContent='PLAY';scene.dataset.phase='paused';}
 function error(){if(!alive)return;clear();cancelAnimationFrame(raf);raf=0;last=0;scene.dataset.phase='error';message.textContent='FINAL VIDEO COULD NOT LOAD';status.hidden=false;retry.hidden=false;retry.textContent='TRY AGAIN';pause.hidden=true;}
 function waiting(){if(!alive||video.ended)return;message.textContent='BUFFERING…';status.hidden=false;retry.hidden=true;clear();timer=setTimeout(error,20000);}
 async function play(){
  if(!alive)return;paused=false;pause.hidden=false;pause.textContent='PAUSE';ending.hidden=true;
  if(mode==='bridge'){status.hidden=true;scene.dataset.phase='bridge';startClock();return;}
  if(mode==='hold'){status.hidden=true;scene.dataset.phase='hold';startClock();return;}
  const token=++attempt;clear();status.hidden=false;retry.hidden=true;message.textContent='LOADING FINAL…';scene.dataset.phase='loading';timer=setTimeout(error,20000);
  try{await video.play();}catch(e){if(!alive||token!==attempt)return;clear();if(e.name==='NotAllowedError'){scene.dataset.phase='awaiting-play';message.textContent='FINAL';retry.textContent='PLAY FINAL';retry.hidden=false;}else error();}
 }
 function replay(){frontier?.dispose();frontier=null;outTime=0;canvas.hidden=true;cut='in';bridgeTime=0;storyTime=0;blackout.hidden=false;blackout.style.opacity='0';cancelAnimationFrame(raf);raf=0;mode='film';video.currentTime=0;video.playbackRate=.6;captionAnimation?.cancel();caption.textContent='';play();}
 listen('playing',()=>{if(!alive)return;clear();paused=false;status.hidden=true;pause.hidden=false;pause.textContent='PAUSE';scene.dataset.phase='playing';text(storyCaption(storyTime));startClock();});listen('waiting',waiting);listen('error',error);
 listen('ended',()=>{if(!alive)return;clear();status.hidden=true;mode='hold';paused=false;last=0;outTime=0;frontier?.dispose();frontier=createFinalFrontier(canvas,video);frontier.render(0);canvas.hidden=false;scene.dataset.phase='hold';startClock();});
 function visibility(){if(document.hidden){resumeOnVisible=!paused&&['playing','bridge','hold','buffering'].includes(scene.dataset.phase);if(resumeOnVisible)pausePlayback();}else if(resumeOnVisible){resumeOnVisible=false;play();}}
 document.addEventListener('visibilitychange',visibility);video.src='/assets/final/final-walk-new.mp4';video.playbackRate=.6;play();
 return()=>{if(!alive)return;alive=false;attempt++;clear();cancelAnimationFrame(raf);captionAnimation?.cancel();frontier?.dispose();document.removeEventListener('visibilitychange',visibility);for(const[name,fn]of handlers)video.removeEventListener(name,fn);video.pause();video.removeAttribute('src');video.load();scene.remove();};
}
