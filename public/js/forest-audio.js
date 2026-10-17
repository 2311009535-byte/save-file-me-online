import {gameAudio} from './game-audio.js';
const token=typeof location==='undefined'?null:new URLSearchParams(location.search).get('embedded');
const embedded=Boolean(token&&window.parent!==window);let last=-Infinity,started=false;
function send(type,z){parent.postMessage({type,token,z},location.origin);}
export function reportForestAudio(z){
 if(!started){started=true;if(!embedded){gameAudio.init();gameAudio.setScene('forest');}else{
  const unlock=e=>{if(e.isTrusted)send('forest-audio-unlock');};document.addEventListener('pointerdown',unlock,true);document.addEventListener('keydown',unlock,true);document.addEventListener('wheel',unlock,{capture:true,passive:true});
  window.addEventListener('pagehide',()=>{document.removeEventListener('pointerdown',unlock,true);document.removeEventListener('keydown',unlock,true);document.removeEventListener('wheel',unlock,true);},{once:true});
 }}
 const now=performance.now();if(now-last<200)return;last=now;if(embedded)send('forest-audio-position',z);else gameAudio.forestPosition(z);
}
