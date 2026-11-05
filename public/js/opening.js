import {beginOpeningHandoff,endOpeningHandoff} from './prologue-handoff.js';
export const OPENING_KEY='save-file-me:opening:v1';
export const openingLines=[
 'I grew up playing games.',
 '',
 'As my life changed,',
 'so did what they meant to me.',
 '',
 'Sometimes, a place to explore.',
 'Sometimes, a place to pause.',
 'Sometimes, a reason to try again.',
 '',
 'Until I wanted to make something of my own.',
 '',
 'A life, saved in moments of play.',
 '',
 'SAVE FILE: ME'
];
export function shouldShowOpening(state){
 if(state.scene!=='prologue')return false;
 if(new URLSearchParams(location.search).get('opening')==='1')return true;
 if(state.completed!==0)return false;
 try{return sessionStorage.getItem(OPENING_KEY)!=='seen';}catch{return true;}
}
export function mountOpening({stage,onFinish=()=>{}}){
 const root=document.createElement('section');root.className='opening';root.tabIndex=-1;root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Save File: Me · opening poem');
 const handoff=beginOpeningHandoff(stage);
 const frame=document.createElement('div');frame.className='opening-frame';
 const editor=document.createElement('div');editor.className='opening-editor';editor.setAttribute('aria-hidden','true');
 const filename=document.createElement('div');filename.className='opening-filename';filename.textContent='save_file_me.txt';
 const caption=document.createElement('div');caption.className='opening-document';
 const lineNodes=openingLines.map((_,index)=>{const line=document.createElement('p');line.className='opening-line';const number=document.createElement('span');number.className='opening-number';number.textContent=String(index+1).padStart(2,'0');const text=document.createElement('span');text.className='opening-text';line.append(number,text);caption.append(line);return text;});
 editor.append(filename,caption);
 const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=1024;canvas.setAttribute('aria-hidden','true');
 const transcript=document.createElement('p');transcript.className='opening-transcript';transcript.textContent=openingLines.filter(Boolean).join(' ');
 const title=document.createElement('div');title.className='opening-title';title.textContent='SAVE FILE: ME';title.setAttribute('aria-hidden','true');
 const titleMask=document.createElement('div');titleMask.className='opening-room-title-mask';titleMask.setAttribute('aria-hidden','true');
 frame.append(titleMask,editor,canvas,title);root.append(frame,transcript);document.getElementById('viewport').append(root);
 const ctx=canvas.getContext('2d'),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const priorFocus=document.activeElement,priorInert=stage.inert;stage.inert=true;root.focus({preventScroll:true});
 let alive=true,raf=0,last=0,elapsed=0,completed=false;
 const random=i=>{const n=Math.sin(i*127.1+311.7)*43758.5453;return n-Math.floor(n);};
 const schedule=[];let writtenAt=650;
 for(const text of openingLines){const typing=text?Math.max(800,text.length*80):0,pause=text?650:250;schedule.push({start:writtenAt,typing,end:writtenAt+typing+pause});writtenAt+=typing+pause;}
 const scatterStart=writtenAt+6500,scatterEnd=scatterStart+3600;
 // Rasterize the printed body into tiny fragments, then move those fragments
 // to the live room's own 440 particle positions using the same cached sprites.
 const letters=document.createElement('canvas');letters.width=1536;letters.height=1024;const lc=letters.getContext('2d',{willReadFrequently:true});lc.font='24px monospace';lc.fillStyle='#fff';
 openingLines.slice(0,-1).forEach((line,i)=>lc.fillText(line,244,262+i*36));
 const pixels=lc.getImageData(0,0,1536,1024).data,ink=[];
 for(let y=230;y<740;y+=2)for(let x=244;x<1285;x+=2)if(pixels[(y*1536+x)*4+3]>90)ink.push({x,y});
 const fragments=Array.from({length:440},(_,i)=>({...ink[Math.floor(i*ink.length/440)],delay:random(i+400)*.14,bend:(random(i+1200)-.5)*110}));
 function drawFragments(progress){
  const targets=handoff.targets;if(!targets||!handoff.atlas)return;
  const transfer=Math.max(0,Math.min(1,(progress-.88)/.12));handoff.ambientOpacity=transfer;
  for(let i=0;i<fragments.length;i++){
   const p=fragments[i],target=targets[i],t=Math.max(0,Math.min(1,(progress-p.delay)/(1-p.delay))),ease=t*t*(3-2*t),arc=Math.sin(Math.PI*t);
   const x=p.x+(target.x-p.x)*ease+p.bend*arc,y=p.y+(target.y-p.y)*ease-arc*35;
   ctx.globalAlpha=.68*(1-transfer)*Math.min(1,progress/.10);ctx.drawImage(handoff.atlas,target.g*16,target.a*16,16,16,x-8,y-8,16,16);
  }
  ctx.globalAlpha=1;root.dataset.fragmentCount=String(fragments.length);root.dataset.particleTransfer=transfer.toFixed(3);
 }
 function resize(){const r=stage.getBoundingClientRect();Object.assign(frame.style,{left:r.left+'px',top:r.top+'px',transform:`scale(${r.width/1536})`});}
 function clean(){if(!alive)return;alive=false;endOpeningHandoff(stage,handoff);cancelAnimationFrame(raf);window.removeEventListener('resize',resize);document.removeEventListener('keydown',key,true);document.removeEventListener('visibilitychange',visibility);stage.inert=priorInert;root.remove();if(priorFocus?.isConnected&&priorFocus!==document.body)priorFocus.focus({preventScroll:true});}
 function finish(){if(!alive)return;completed=true;try{sessionStorage.setItem(OPENING_KEY,'seen');}catch{}clean();onFinish();}
 // This opening has no skip path: Escape and clicks never finish playback.
 function key(e){if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();}else if(e.key==='Tab'){e.preventDefault();root.focus();}}
 function visibility(){last=0;}
 function frameLoop(now){if(!alive)return;raf=requestAnimationFrame(frameLoop);if(document.hidden){last=0;return;}if(last)elapsed+=Math.min(now-last,80);last=now;
  const titleTime=reduced?12000:scatterEnd,duration=titleTime+1200;
  ctx.clearRect(0,0,1536,1024);title.style.opacity='0';root.style.backgroundColor='#000';root.style.opacity='1';root.dataset.elapsed=String(Math.round(elapsed));
  const titleY=236+(openingLines.length-1)*36;
  if(elapsed<titleTime){
   const scatter=reduced?0:Math.max(0,Math.min(1,(elapsed-scatterStart)/3600));handoff.progress=scatter;
   editor.style.opacity=String(Math.min(1,elapsed/450)*(1-scatter));let completedLines=0,current=-1;
   for(let i=0;i<openingLines.length;i++){
    const item=schedule[i],progress=reduced?1:item.typing?Math.max(0,Math.min(1,(elapsed-item.start)/item.typing)):Number(elapsed>=item.start);
    const text=openingLines[i].slice(0,Math.floor(openingLines[i].length*progress));if(lineNodes[i].textContent!==text)lineNodes[i].textContent=text;
    if(progress===1&&openingLines[i])completedLines++;if(openingLines[i]&&!reduced&&elapsed>=item.start&&elapsed<item.end)current=i;
    lineNodes[i].classList.toggle('is-typing',current===i&&scatter===0);
   }
   root.dataset.line=String(current);root.dataset.completedLines=String(completedLines);root.dataset.phase=scatter>0?'scatter':reduced||elapsed>=writtenAt?'reading':'writing';
   if(scatter>0){
    lineNodes.at(-1).style.visibility='hidden';lineNodes.slice(0,-1).forEach(node=>{node.style.opacity=String(Math.max(0,1-scatter/.14));});
    title.style.opacity='1';Object.assign(title.style,{left:'244px',top:titleY+'px',fontSize:'24px',transform:'none'});
    const reveal=scatter*scatter*(3-2*scatter);root.style.backgroundColor=`rgba(0,0,0,${1-reveal*.94})`;root.dataset.reveal=reveal.toFixed(3);
    drawFragments(scatter);
   }
  }else{
   editor.style.opacity='0';lineNodes.at(-1).style.visibility='hidden';handoff.progress=1;handoff.ambientOpacity=1;root.dataset.phase='title';const t=Math.min(1,(elapsed-titleTime)/1200),move=reduced?1:Math.max(0,Math.min(1,(t-.15)/.7)),ease=move*move*(3-2*move);
   title.style.opacity='1';Object.assign(title.style,{left:(244+(42-244)*ease)+'px',top:(titleY+(32-titleY)*ease)+'px',fontSize:(24+(20-24)*ease)+'px',transform:'none'});
   // Continue revealing the same live scene; no substitute particle screen
   // or opaque intermediate frame sits between the poem and the room.
   root.dataset.reveal=String(reduced?t:.94+.06*t);root.style.backgroundColor=`rgba(0,0,0,${(reduced?1:.06)*(1-t)})`;
   if(reduced)editor.style.opacity=String(1-t);
   const settled=Math.max(0,Math.min(1,(t-.88)/.12));titleMask.style.opacity=String(1-settled);title.style.opacity=String(1-settled);root.dataset.titleHandoff=settled.toFixed(3);

  }
  if(elapsed>=duration)finish();
 }
 window.addEventListener('resize',resize);document.addEventListener('keydown',key,true);document.addEventListener('visibilitychange',visibility);resize();raf=requestAnimationFrame(frameLoop);
 return()=>{if(!completed)clean();};
}
