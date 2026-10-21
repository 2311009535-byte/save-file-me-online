import {prepareImage} from './image-cache.js';
export function mountMapGlass(visual,top,{scenePoint,onReveal}){
 const lens=document.createElement('div');lens.className='wonder-map-glass';lens.hidden=true;lens.setAttribute('aria-hidden','true');Object.assign(lens.style,{position:'absolute',width:(220/1669*100)+'%',aspectRatio:'1',borderRadius:'50%',overflow:'hidden',pointerEvents:'none',zIndex:1,transform:'translate(-50%,-50%)',border:'1.5px solid rgba(230,246,255,.48)',boxShadow:'inset 2px 3px 7px #ffffff55,inset -3px -4px 9px #508fac50,0 5px 16px #06182633',background:'rgba(190,222,230,.05)'});
 const image=document.createElement('canvas');image.width=220;image.height=220;Object.assign(image.style,{position:'absolute',inset:0,width:'100%',height:'100%',borderRadius:'50%'});lens.append(image);
 const sheen=document.createElement('div');Object.assign(sheen.style,{position:'absolute',inset:0,borderRadius:'50%',background:'radial-gradient(ellipse at 23% 12%,#ffffff42,transparent 40%),radial-gradient(ellipse at 80% 90%,#8ed8ff29,transparent 42%)',boxShadow:'inset 0 0 0 5px #ffffff09'});lens.append(sheen);visual.append(lens);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;const glint=reduced?null:sheen.animate([{opacity:.65},{opacity:1},{opacity:.65}],{duration:4300,iterations:Infinity,easing:'ease-in-out'});
 let source=null,alive=true,raf=0,target=null,current=null,revealed=false;
 prepareImage('/assets/wonder/1_4.png').then(im=>{source=im;if(target&&!raf)raf=requestAnimationFrame(paint);}).catch(()=>{});
 function paint(){if(!alive||!target)return;current??={...target};current.x+=(target.x-current.x)*.24;current.y+=(target.y-current.y)*.24;const {x,y}=current;top.style.maskImage=`radial-gradient(circle 110px at ${x*100}% ${y*100}%,transparent 97%,#000 100%)`;lens.hidden=false;lens.style.left=x*100+'%';lens.style.top=y*100+'%';if(source){const c=image.getContext('2d');c.clearRect(0,0,220,220);c.drawImage(source,x*1669-107,y*942-107,214,214,0,0,220,220);}if(Math.abs(target.x-x)+Math.abs(target.y-y)>.0001)raf=requestAnimationFrame(paint);else raf=0;}
 function reveal(e){const p=scenePoint(e.clientX,e.clientY);target={x:Math.max(0,Math.min(1,p.x)),y:Math.max(0,Math.min(1,p.y))};if(!raf)raf=requestAnimationFrame(paint);if(!revealed){revealed=true;onReveal();}}
 visual.onpointermove=reveal;visual.onpointerdown=reveal;
 return()=>{alive=false;cancelAnimationFrame(raf);glint?.cancel();lens.remove();visual.onpointermove=null;visual.onpointerdown=null;};
}
