import {gameAudio} from './game-audio.js';
// English copy supplied in 添加内容.docx. Chinese columns are translations only.
export const chapterIntros={
 1:{title:'WONDER',lines:['Back then, the world felt bigger than my room.','I wanted to know what was out there.']},
 2:{title:'ESCAPE',lines:['As I grew older, there was always something to finish.','Sometimes, I just needed somewhere to pause.']},
 3:{title:'RETRY & CONNECTION',lines:['Some challenges took more than one try.','Some became easier when someone stayed.']},
 4:{title:'CREATION',lines:['For years, I stepped into worlds made by others.','Then I wondered: could I make one of my own?']}
};
export function readingTime(lines){return Math.max(3500,Math.ceil(lines.join(' ').trim().split(/\s+/).length/5.2*1000+250));}
export function createChapterIntro(stage){
 let disposed=false,current=null;
 function stop(){current?.stop();}
 return {
  get active(){return Boolean(current);},cancel:stop,
  async play(number,reveal,prepare=null){
   stop();if(disposed)return false;const copy=chapterIntros[number];if(!copy)throw Error('Unknown chapter intro');
   const cover=document.createElement('section');cover.className='chapter-intro';cover.setAttribute('aria-label',`Chapter ${number}: ${copy.title}`);cover.setAttribute('role','region');
   const title=document.createElement('small'),text=document.createElement('div');title.textContent=`CHAPTER ${String(number).padStart(2,'0')} / ${copy.title}`;text.className='chapter-intro-copy';
   for(const line of copy.lines){const p=document.createElement('p');p.textContent=line;text.append(p);}cover.append(title,text);document.body.append(cover);
   const locked=[document.getElementById('visual'),document.getElementById('hotspots'),document.getElementById('back')].filter(Boolean).map(el=>[el,el.inert]);locked.forEach(([el])=>el.inert=true);
   gameAudio.setReading(true);document.body.classList.add('chapter-intro-active');stage.dataset.chapterIntro=number;
   let closed=false,raf=0,resolveWait=null;const animations=new Set();
   const cleanup=()=>{if(closed)return;closed=true;cancelAnimationFrame(raf);resolveWait?.(false);resolveWait=null;animations.forEach(a=>a.cancel());animations.clear();cover.remove();gameAudio.setReading(false);locked.forEach(([el,was])=>el.inert=was);window.removeEventListener('keydown',block,true);if(current?.cover===cover){current=null;delete stage.dataset.chapterIntro;delete stage.dataset.chapterIntroState;}document.body.classList.toggle('chapter-intro-active',Boolean(document.querySelector('.chapter-intro')));};
   const block=e=>{if(e.target.closest?.('.game-audio-controls'))return;if(['Space','Enter','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.code)&&document.getElementById('dev-panel')?.hidden){e.preventDefault();e.stopImmediatePropagation();}};window.addEventListener('keydown',block,true);
   current={cover,stop:cleanup};
   // Only time during which the tab is visible counts toward reading time.
   const wait=ms=>new Promise(resolve=>{resolveWait=resolve;let elapsed=0,last=performance.now();const tick=now=>{if(closed){resolve(false);return;}if(!document.hidden)elapsed+=Math.min(100,Math.max(0,now-last));last=now;cover.dataset.remaining=String(Math.max(0,Math.ceil(ms-elapsed)));if(elapsed>=ms){resolveWait=null;resolve(true);}else raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);});
   const animate=async(el,frames,ms)=>{if(closed)return false;const a=el.animate(frames,{duration:matchMedia('(prefers-reduced-motion: reduce)').matches?1:ms,easing:'ease-in-out',fill:'forwards'});animations.add(a);try{await a.finished;return !closed;}catch{return false;}finally{animations.delete(a);}};
   try{
    if(prepare){stage.dataset.chapterIntroState='loading';text.hidden=true;const loading=document.createElement('span');loading.className='chapter-intro-loading';loading.textContent='LOADING MEMORY…';cover.append(loading);await prepare();if(closed||disposed)return false;if(!await wait(500))return false;loading.remove();text.hidden=false;}
    stage.dataset.chapterIntroState='reading';const ms=readingTime(copy.lines);cover.dataset.readingMs=String(ms);
    if(!await animate(text,[{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],400)||!await wait(ms))return false;
    stage.dataset.chapterIntroState='dissolve';await reveal();if(closed||disposed)return false;
    return await animate(cover,[{opacity:1},{opacity:0}],600);
   }finally{cleanup();}
  },dispose(){disposed=true;stop();}
 };
}
