export const gameStory=[
 'School was over. What was behind that hill, anyway?',
 'A little path! Did anyone else know it was here?',
 'Something flickered between the trees. A firefly? A fairy?',
 'There it was again! Just a little farther…',
 'A door in the woods? What if it opened into another world?'
];

export function mountGameStory(visual,level){
 const text=gameStory[level],reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const panel=document.createElement('div');panel.className='wonder-game-story';panel.dataset.level=String(level);panel.dataset.phase='waiting';panel.setAttribute('role','note');panel.setAttribute('aria-label',text);
 const copy=document.createElement('span');copy.className='wonder-game-story-copy';copy.setAttribute('aria-hidden','true');panel.append(copy);visual.append(panel);
 const sparks=[];
 if(level===2||level===3)for(let i=0;i<2;i++){
  const spark=document.createElement('i');spark.className='wonder-story-spark';spark.setAttribute('aria-hidden','true');Object.assign(spark.style,{left:`${(level===2?68:76)+i*9}%`,top:`${48-i*7}%`,animationDelay:`-${i*1.3}s`});visual.append(spark);sparks.push(spark);
 }
 let elapsed=0,disposed=false;
 const typingDuration=reduced?0:text.length/46,hold=4.5;
 function update(dt){
  if(disposed)return;elapsed+=dt;
  if(elapsed<.2)return;
  const t=elapsed-.2,letters=reduced?text.length:Math.min(text.length,Math.floor(t*46));copy.textContent=text.slice(0,letters);
  panel.style.opacity=String(Math.min(1,t/.35,Math.max(0,(typingDuration+hold+.5-t)/.5)));
  panel.dataset.phase=t<typingDuration?'typing':t<typingDuration+hold?'reading':'fading';
  panel.classList.toggle('is-typing',!reduced&&letters<text.length);
  if(t>=typingDuration+hold+.5){panel.hidden=true;panel.dataset.phase='finished';}
 }
 return{update,dispose(){disposed=true;panel.remove();sparks.forEach(s=>s.remove());}};
}
