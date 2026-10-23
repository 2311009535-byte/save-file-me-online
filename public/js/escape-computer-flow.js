import {prepareImage} from './image-cache.js';
export const computerReactionAsset='/assets/escape/computer-reaction.png';
export const computerEndingAsset='/assets/escape/computer-ending.webp';

export function createEscapeComputerFlow(stage){
 let version=0,reaction=null,flash=null;const animations=new Set();
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 async function animate(node,frames,duration){
  const animation=node.animate(frames,{duration,easing:'ease-in-out',fill:'forwards'});animations.add(animation);
  try{await animation.finished;return true;}catch{return false;}finally{animations.delete(animation);animation.cancel();}
 }
 async function react(onReturn){
  const token=version;let image;
  try{image=await prepareImage(computerReactionAsset);}catch{if(token!==version)return false;await onReturn();return token===version;}
  if(token!==version)return false;
  const node=document.createElement('div');node.className='escape-computer-reaction';node.dataset.phase='appearing';node.setAttribute('aria-label','A quiet moment of relief');Object.assign(node.style,{position:'absolute',inset:0,zIndex:3,background:'#000',pointerEvents:'none'});
  const shot=image.cloneNode();shot.alt='Resting at the desk with a small, relieved smile';Object.assign(shot.style,{display:'block',width:'100%',height:'100%',objectFit:'contain'});node.append(shot);stage.append(node);reaction=node;
  try{
   if(!await animate(node,[{opacity:0},{opacity:1}],reduced()?100:220)||token!==version)return false;
   node.style.opacity='1';node.dataset.phase='holding';
   if(!await animate(node,[{opacity:1},{opacity:1}],2200)||token!==version)return false;
   await onReturn();if(token!==version)return false;
   node.dataset.phase='returning';
   return await animate(node,[{opacity:1},{opacity:0}],reduced()?100:280);
  }finally{node.remove();if(reaction===node)reaction=null;}
 }
 async function enter(onCovered){
  if(flash)return false;
  const token=version,node=document.createElement('div');node.className='escape-game-flash';node.dataset.phase='covering';node.setAttribute('aria-hidden','true');Object.assign(node.style,{position:'fixed',inset:0,zIndex:10030,background:'#fff',opacity:0,pointerEvents:'auto'});document.body.append(node);flash=node;
  try{
   if(!await animate(node,[{opacity:0},{opacity:1}],reduced()?120:280)||token!==version)return false;
   node.style.opacity='1';await onCovered();if(token!==version)return false;
   node.dataset.phase='revealing';
   return await animate(node,[{opacity:1},{opacity:1,offset:.15},{opacity:0}],reduced()?180:750);
  }finally{node.remove();if(flash===node)flash=null;}
 }
 function cancel(){version++;animations.forEach(a=>a.cancel());animations.clear();reaction?.remove();reaction=null;flash?.remove();flash=null;}
 return{react,enter,cancel};
}
