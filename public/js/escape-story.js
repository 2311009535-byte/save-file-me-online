export const escapeStory={
 examGuide:'The test paper we just got back is still on my desk…',
 exam:'I got a terrible score. I don’t know how to face it.',
 phoneGuide:'My phone lit up again. What now?',
 phone:'More messages. I really don’t want to read them right now.',
 papersGuide:'I still have all these worksheets to finish. I’m so tired.',
 computerGuide:'It’s been a long day. Let me take a little break.',
 game:'Finally, a moment to breathe.'
};

// Reading time advances only after the scene settles. Completion and reading
// are separate: neither opening an item nor waiting can finish its interaction.
export function createEscapeStory(stage,{canRead,isComplete,onReturn}){
 let panel=null,key=null,raf=0,last=null,elapsed=0,completedElapsed=0;
 function clear(){cancelAnimationFrame(raf);panel?.remove();panel=null;key=null;last=null;elapsed=0;completedElapsed=0;}
 function show(next){
  if(key===next&&panel?.isConnected)return;clear();if(!escapeStory[next])return;
  key=next;panel=document.createElement('p');panel.className='escape-story';panel.dataset.story=next;panel.textContent=escapeStory[next];panel.setAttribute('role','status');panel.style.opacity='0';stage.append(panel);
  const duration=Math.max(4500,escapeStory[next].split(/\s+/).length*240+1600),auto=next==='exam'||next==='phone';
  function tick(now){
   if(!panel)return;const dt=last===null?0:Math.min(100,Math.max(0,now-last));last=now;
   if(!document.hidden&&canRead(next)){elapsed+=dt;if(auto){if(isComplete(next))completedElapsed+=dt;else completedElapsed=0;}}
   const leaving=!auto&&elapsed>duration,opacity=Math.min(1,elapsed/450,leaving?Math.max(0,1-(elapsed-duration)/550):1);panel.style.opacity=String(opacity);panel.dataset.elapsed=String(Math.round(elapsed));panel.dataset.completedElapsed=String(Math.round(completedElapsed));
   if(auto&&completedElapsed>=(next==='exam'?3000:8000)){const finished=key;clear();onReturn(finished);return;}
   if(leaving&&opacity===0)return;
   raf=requestAnimationFrame(tick);
  }
  raf=requestAnimationFrame(tick);
 }
 const visibility=()=>{last=null;};document.addEventListener('visibilitychange',visibility);
 return{show,clear,dispose(){clear();document.removeEventListener('visibilitychange',visibility);}};
}
