import {gameAudio} from './game-audio.js';
const KEY='save-file-me:wonder-narration:v1';
export function createWonderNarration(){
 const synth=window.speechSynthesis,supported=Boolean(synth&&window.SpeechSynthesisUtterance);
 let enabled=true;try{enabled=localStorage.getItem(KEY)!=='off';}catch{}
 let alive=true,current=null,utterance=null,version=0,timer=0,pending=false,blocked=false,resumeOnVisible=false;
 const initial=gameAudio.snapshot().preferences;let wasSilent=initial.muted||initial.effects===0;
 const button=document.createElement('button');button.type='button';button.className='wonder-narration-control';button.setAttribute('aria-label','Chapter one English narration');document.body.append(button);
 function update(){button.disabled=!supported;button.textContent=!supported?'NARRATION: UNAVAILABLE':blocked?'ENABLE NARRATION':enabled?'NARRATION: ON':'NARRATION: OFF';button.setAttribute('aria-pressed',String(enabled&&supported));}
 function stop(forget=true){version++;clearTimeout(timer);pending=false;if(utterance){utterance.onend=utterance.onerror=utterance.onstart=null;utterance=null;synth.cancel();}gameAudio.setNarrating(false);if(forget)current=null;}
 function speak(){
  if(!alive||!supported||!enabled||!current||!current.valid()||document.hidden)return;
  const prefs=gameAudio.snapshot().preferences;if(prefs.muted||prefs.effects===0)return;
  const job=current;stop(false);const token=version;pending=true;blocked=false;update();
  const line=new SpeechSynthesisUtterance(job.text);utterance=line;line.lang='en-US';line.rate=.95;line.pitch=1.06;line.volume=prefs.effects;
  const voices=synth.getVoices().filter(v=>/^en(?:-|$)/i.test(v.lang));
  voices.sort((a,b)=>{const score=v=>(/^en-US$/i.test(v.lang)?4:0)+(/natural|enhanced|samantha|ava|aria|jenny/i.test(v.name)?3:0)+(v.localService?1:0);return score(b)-score(a);});if(voices[0])line.voice=voices[0];
  const finish=()=>{if(token!==version)return;clearTimeout(timer);pending=false;utterance=null;gameAudio.setNarrating(false);};
  line.onstart=()=>{if(token===version&&alive)gameAudio.setNarrating(true);};line.onend=finish;line.onerror=e=>{if(token!==version)return;finish();if(!['canceled','interrupted'].includes(e.error)){blocked=true;update();button.title='Click to retry English narration in this browser.';}};
  timer=setTimeout(()=>{if(token===version){stop(false);blocked=true;update();}},25000);
  try{synth.speak(line);}catch{finish();blocked=true;update();}
 }
 button.onclick=()=>{if(blocked){blocked=false;enabled=true;}else enabled=!enabled;try{localStorage.setItem(KEY,enabled?'on':'off');}catch{}update();if(enabled)speak();else stop(false);};
 const preferences=()=>{const p=gameAudio.snapshot().preferences,silent=p.muted||p.effects===0;if(silent)stop(false);else if(wasSilent&&current&&enabled)speak();else if(utterance)utterance.volume=p.effects;wasSilent=silent;},visibility=()=>{if(document.hidden){resumeOnVisible=pending;stop(false);}else{if(resumeOnVisible&&current&&enabled)speak();resumeOnVisible=false;}};
 window.addEventListener('game-audio-preferences',preferences);document.addEventListener('visibilitychange',visibility);update();
 return{read(text,valid=()=>true){stop();current={text,valid};speak();},stop(){stop();},get speaking(){return pending;},dispose(){alive=false;stop();button.remove();window.removeEventListener('game-audio-preferences',preferences);document.removeEventListener('visibilitychange',visibility);}};
}
