import {prepareImage} from './image-cache.js';

export function createWonderGameFlow(stage,visual,canReveal){
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 let entryFrame=0,entryAnimation=null,entryVersion=0,version=0,door=null,flash=null;
 const active=new Set();
 async function animate(node,frames,duration){
  const animation=node.animate(frames,{duration,easing:'ease-in-out',fill:'forwards'});active.add(animation);
  try{await animation.finished;return true;}catch{return false;}finally{active.delete(animation);animation.cancel();}
 }
 function clearEntry(){entryVersion++;cancelAnimationFrame(entryFrame);entryAnimation?.cancel();entryAnimation=null;}
 function revealEntry(button,image){
  clearEntry();const token=entryVersion;button.disabled=true;button.style.opacity='0';button.dataset.reveal='waiting';
  async function reveal(){
   try{await image.decode();}catch{return;}
   function wait(){
    if(token!==entryVersion||!button.isConnected)return;
    if(!canReveal()){entryFrame=requestAnimationFrame(wait);return;}
    button.dataset.reveal='fading';entryAnimation=button.animate([{opacity:0},{opacity:1}],{duration:reduced()?100:850,easing:'ease-out',fill:'forwards'});
    entryAnimation.finished.then(()=>{if(token!==entryVersion||!button.isConnected)return;button.style.opacity='1';button.disabled=false;button.dataset.reveal='ready';entryAnimation.cancel();entryAnimation=null;}).catch(()=>{});
   }
   entryFrame=requestAnimationFrame(wait);
  }
  reveal();
 }
 async function white(onCovered,{handoff=false}={}){
  const token=version,node=document.createElement('div');node.className='wonder-game-flash';node.setAttribute('aria-hidden','true');Object.assign(node.style,{position:'fixed',inset:0,zIndex:10030,background:'#fff',opacity:0,pointerEvents:'auto'});document.body.append(node);flash={node,transferred:false};
  try{
   if(!await animate(node,[{opacity:0},{opacity:1}],reduced()?120:450)||token!==version)return false;
   node.style.opacity='1';
   if(handoff){
    // The chapter unmounts synchronously in onCovered. Transfer this bounded
    // fade to the destination so disposal cannot expose a hard cut underneath.
    flash.transferred=true;
    onCovered();
    const fade=node.animate([{opacity:1},{opacity:1,offset:.15},{opacity:0}],{duration:reduced()?180:800,fill:'forwards',easing:'ease-out'});
    try{await fade.finished;}catch{}finally{fade.cancel();}
    return true;
   }
   onCovered();
   if(token!==version)return false;
   return await animate(node,[{opacity:1},{opacity:1,offset:.15},{opacity:0}],reduced()?180:800);
  }finally{node.remove();if(flash?.node===node)flash=null;}
 }
 async function complete(onCovered){
  const token=version;
  let image;try{image=await prepareImage('/assets/wonder/1_12.png');}catch{return false;}
  if(token!==version)return false;
  const opening=document.createElement('div');opening.className='wonder-game-door';opening.dataset.state='opening';opening.setAttribute('aria-hidden','true');Object.assign(opening.style,{position:'absolute',left:`${1494/1672*100}%`,top:`${442/941*100}%`,width:`${100/1672*100}%`,height:`${170/941*100}%`,background:'#fff8df',clipPath:'polygon(0 28%,4% 16%,15% 7%,32% 1%,50% 0,70% 5%,86% 14%,97% 28%,100% 100%,0 100%)',perspective:'220px',pointerEvents:'none',zIndex:2});
  const leaf=document.createElement('canvas');leaf.width=100;leaf.height=170;leaf.getContext('2d').drawImage(image,1494,442,100,170,0,0,100,170);Object.assign(leaf.style,{width:'100%',height:'100%',display:'block',transformOrigin:'left center',backfaceVisibility:'hidden'});opening.append(leaf);visual.append(opening);door=opening;
  if(!await animate(leaf,[{transform:'rotateY(0deg)'},{transform:'rotateY(-84deg)'}],reduced()?120:950)||token!==version)return false;
  leaf.style.transform='rotateY(-84deg)';opening.dataset.state='open';
  return white(onCovered,{handoff:true});
 }
 function cancel(){version++;clearEntry();active.forEach(a=>a.cancel());active.clear();door?.remove();door=null;if(flash&&!flash.transferred){flash.node.remove();flash=null;}}
 return{revealEntry,clearEntry,white,complete,cancel};
}
