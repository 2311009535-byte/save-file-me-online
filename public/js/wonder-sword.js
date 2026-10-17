import {prepareImage} from './image-cache.js';
const outline='M1190 148 L1233 164 L1238 213 L1190 244 L1227 265 L1220 313 L1180 309 L1153 378 L1073 378 L1111 283 L1091 282 L1086 246 L1132 239 L1164 205 L1169 160 Z';
export function showSwordGlow(visual){
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 1670 942');svg.classList.add('wonder-sword-glow');svg.setAttribute('aria-hidden','true');svg.innerHTML=`<path d="${outline}" fill="none" stroke="#ffd971" stroke-width="5"/>`;visual.append(svg);
}
export async function showSwordChange(visual,{valid=()=>true,animate=false}={}){
 const image=await prepareImage('/assets/wonder/1_6.png');if(!valid())return false;
 let swapped=false;const swap=()=>{if(swapped||!valid())return;const next=image.cloneNode();next.className='scene-image';next.alt='The transformed sword';visual.querySelector('.scene-image')?.replaceWith(next);visual.querySelector('.wonder-sword-glow')?.remove();swapped=true;};
 if(!animate||matchMedia('(prefers-reduced-motion: reduce)').matches){swap();return swapped;}
 const burst=document.createElementNS('http://www.w3.org/2000/svg','svg');burst.setAttribute('viewBox','0 0 1670 942');burst.classList.add('wonder-sword-burst');burst.setAttribute('aria-hidden','true');
 burst.innerHTML=`<path d="${outline}" fill="#fff6bd" fill-opacity=".7" stroke="#a6ffff" stroke-width="10"/>`+Array.from({length:12},(_,i)=>{const a=i*Math.PI/6,x=1160+Math.cos(a)*100,y=260+Math.sin(a)*135;return `<path d="M${x-8} ${y}h16M${x} ${y-8}v16" stroke="${i%2?'#b8ffff':'#fff0a3'}" stroke-width="5"/>`;}).join('');visual.append(burst);
 const effect=burst.animate([{opacity:0},{opacity:1,offset:.42},{opacity:.9,offset:.55},{opacity:0}],{duration:900,easing:'ease-in-out'});let raf=0;
 const tick=()=>{if(!valid()){effect.cancel();return;}if(effect.currentTime>=380)swap();raf=requestAnimationFrame(tick);};tick();
 try{await effect.finished;if(valid())swap();return swapped&&valid();}catch{return false;}finally{cancelAnimationFrame(raf);effect.cancel();burst.remove();}
}
