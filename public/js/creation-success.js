// A short red-pencil annotation. Its completion callback runs only after the
// player has had time to see the feedback, and is cancelled on scene changes.
export const CREATION_SUCCESS_MS=2800;
export function createCreationSuccess(root){
 let frame=0,notice=null,visibility=()=>{};const onVisibility=()=>visibility();document.addEventListener('visibilitychange',onVisibility);
 function clear(){cancelAnimationFrame(frame);frame=0;visibility=()=>{};notice?.remove();notice=null;}
 return {show(message,{onComplete=null,canAdvance=()=>true}={}){clear();notice=document.createElement('div');notice.className='creation-success';notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 72 58');svg.setAttribute('aria-hidden','true');svg.innerHTML='<path pathLength="100" d="M8 31 Q16 36 25 49 Q42 19 65 7"/><path class="creation-success-echo" pathLength="100" d="M10 32 L25 46 Q45 17 63 9"/>';
  const words=document.createElement('span');words.textContent=message;notice.append(svg,words);root.append(notice);
  let elapsed=0,last=null,paused=null;const current=notice;
  const sync=advancing=>{const nextPaused=!advancing;if(paused!==nextPaused){paused=nextPaused;current.getAnimations({subtree:true}).forEach(a=>paused?a.pause():a.play());}};
  visibility=()=>{last=null;sync(!document.hidden&&canAdvance());};
  const tick=now=>{if(notice!==current)return;const advancing=!document.hidden&&canAdvance(),dt=last===null?0:Math.min(100,now-last);last=now;
   sync(advancing);
   if(advancing)elapsed+=dt;current.dataset.elapsed=String(Math.round(elapsed));
   if(elapsed>=CREATION_SUCCESS_MS){clear();onComplete?.();return;}frame=requestAnimationFrame(tick);
  };frame=requestAnimationFrame(tick);
 },clear,dispose(){clear();document.removeEventListener('visibilitychange',onVisibility);}};
}
