import {gameAudio} from './game-audio.js';
// The approved forest uses its own viewport and GSAP lifecycle inside the game.
// Completion is accepted only from this live frame after its final door opens.
export function mountEscapeParallax({host,complete}){
 let alive=true,ready=false,finished=false;
 const token=crypto.randomUUID(),root=document.createElement('section');
 root.className='escape-parallax';root.setAttribute('aria-label','日落森林 · 按键行走与自由观察');
 Object.assign(root.style,{position:'absolute',inset:0,overflow:'hidden',zIndex:1,background:'#172023'});
 const frame=document.createElement('iframe');frame.title='第二章 · 日落森林';
 Object.assign(frame.style,{display:'block',width:'100%',height:'100%',border:0});
 frame.src='/forest-bridge-study.html?embedded='+encodeURIComponent(token);
 root.append(frame);host.append(root);
 // The room is a scaled artboard. Give the iframe a viewport in visible pixels
 // so its controls stay legible and its mobile layout can actually respond.
 function resize(){const r=root.getBoundingClientRect();if(!r.width||!r.height)return;frame.style.width=r.width+'px';frame.style.height=r.height+'px';frame.style.transformOrigin='0 0';frame.style.transform=`scale(${root.clientWidth/r.width},${root.clientHeight/r.height})`;}
 const observer=new ResizeObserver(resize);observer.observe(root);window.addEventListener('resize',resize);resize();
 function message(e){
  if(!alive||e.origin!==location.origin||e.source!==frame.contentWindow||e.data?.token!==token)return;
  if(e.data.type==='forest-ready'){ready=true;gameAudio.setScene('forest');root.dataset.ready='true';}
  if(e.data.type==='forest-audio-unlock')gameAudio.unlock();
  if(e.data.type==='forest-audio-position'&&ready)gameAudio.forestPosition(Number(e.data.z));
  if(e.data.type==='forest-error'){root.dataset.error='assets';}
  if(e.data.type==='forest-complete'&&ready&&!finished){finished=true;complete();}
 }
 window.addEventListener('message',message);
 return()=>{if(!alive)return;alive=false;observer.disconnect();window.removeEventListener('resize',resize);window.removeEventListener('message',message);frame.src='about:blank';root.remove();if(gameAudio.snapshot().scene==='forest')gameAudio.setScene('chapter2');};
}
export const escapeParallaxAdapter={mount:mountEscapeParallax};
