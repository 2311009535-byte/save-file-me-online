import {gameAudio} from './game-audio.js';
// The approved forest uses its own viewport and GSAP lifecycle inside the game.
// Completion is accepted only from this live frame after its final door opens.
export function mountEscapeParallax({host,input,complete}){
 let alive=true,ready=false,finished=false;
 const token=crypto.randomUUID(),root=document.createElement('section');
 root.className='escape-parallax';root.setAttribute('aria-label','日落森林 · 滚动向前探索');
 Object.assign(root.style,{position:'absolute',inset:0,overflow:'hidden',zIndex:1,background:'#172023'});
 const frame=document.createElement('iframe');frame.title='第二章 · 日落森林';
 Object.assign(frame.style,{display:'block',width:'100%',height:'100%',border:0});
 frame.src='/forest-bridge-study.html?embedded='+encodeURIComponent(token);
 root.append(frame);host.append(root);
 function message(e){
  if(!alive||e.origin!==location.origin||e.source!==frame.contentWindow||e.data?.token!==token)return;
  if(e.data.type==='forest-ready'){ready=true;gameAudio.setScene('forest');root.dataset.ready='true';}
  if(e.data.type==='forest-audio-unlock')gameAudio.unlock();
  if(e.data.type==='forest-audio-position'&&ready)gameAudio.forestPosition(Number(e.data.z));
  if(e.data.type==='forest-error'){root.dataset.error='assets';}
  if(e.data.type==='forest-complete'&&ready&&!finished){finished=true;complete();}
 }
 function onInput(e){if(!alive||!ready||finished||e.detail?.kind!=='wheel')return;const{deltaY,deltaMode}=e.detail;frame.contentWindow.postMessage({type:'forest-wheel',token,deltaY:Number(deltaY)||0,deltaMode:Number(deltaMode)||0},location.origin);}
 window.addEventListener('message',message);input?.addEventListener('input',onInput);
 return()=>{if(!alive)return;alive=false;window.removeEventListener('message',message);input?.removeEventListener('input',onInput);frame.src='about:blank';root.remove();if(gameAudio.snapshot().scene==='forest')gameAudio.setScene('chapter2');};
}
export const escapeParallaxAdapter={mount:mountEscapeParallax};
