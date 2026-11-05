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
 'Until I wanted to make',
 'something of my own.',
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
 const frame=document.createElement('div');frame.className='opening-frame';
 const editor=document.createElement('div');editor.className='opening-editor';editor.setAttribute('aria-hidden','true');
 const filename=document.createElement('div');filename.className='opening-filename';filename.textContent='save_file_me.txt';
 const caption=document.createElement('div');caption.className='opening-document';
 const lineNodes=openingLines.map((_,index)=>{const line=document.createElement('p');line.className='opening-line';const number=document.createElement('span');number.className='opening-number';number.textContent=String(index+1).padStart(2,'0');const text=document.createElement('span');text.className='opening-text';line.append(number,text);caption.append(line);return text;});
 editor.append(filename,caption);
 const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=1024;canvas.setAttribute('aria-hidden','true');
 const transcript=document.createElement('p');transcript.className='opening-transcript';transcript.textContent=openingLines.filter(Boolean).join(' ');
 const title=document.createElement('div');title.className='opening-title';title.textContent='SAVE FILE: ME';title.setAttribute('aria-hidden','true');
 frame.append(editor,canvas,title);root.append(frame,transcript);document.getElementById('viewport').append(root);
 const ctx=canvas.getContext('2d'),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const priorFocus=document.activeElement,priorInert=stage.inert;stage.inert=true;root.focus({preventScroll:true});
 let alive=true,raf=0,last=0,elapsed=0,completed=false;
 const random=i=>{const n=Math.sin(i*127.1+311.7)*43758.5453;return n-Math.floor(n);};
 const schedule=[];let writtenAt=650;
 for(const text of openingLines){const typing=text?Math.max(800,text.length*80):0,pause=text?650:250;schedule.push({start:writtenAt,typing,end:writtenAt+typing+pause});writtenAt+=typing+pause;}
 const scatterStart=writtenAt+6500,scatterEnd=scatterStart+2400;
 // Scatter the actual printed characters, keeping their initial font and
 // baseline. The real room is already mounted behind this inert overlay.
 const atoms=openingLines.slice(0,-1).flatMap((line,index)=>Array.from(line,(char,i)=>({char,x:244+i*14.44921875,y:262+index*36,dx:(random(index*97+i+1)-.5)*135,dy:-20-random(index*113+i+700)*90,delay:random(index*131+i+400)*.28})).filter(p=>p.char!==' '));
 function resize(){const r=stage.getBoundingClientRect();Object.assign(frame.style,{left:r.left+'px',top:r.top+'px',transform:`scale(${r.width/1536})`});}
 function clean(){if(!alive)return;alive=false;cancelAnimationFrame(raf);window.removeEventListener('resize',resize);document.removeEventListener('keydown',key,true);document.removeEventListener('visibilitychange',visibility);stage.inert=priorInert;root.remove();if(priorFocus?.isConnected&&priorFocus!==document.body)priorFocus.focus({preventScroll:true});}
 function finish(){if(!alive)return;completed=true;try{sessionStorage.setItem(OPENING_KEY,'seen');}catch{}clean();onFinish();}
 // This opening has no skip path: Escape and clicks never finish playback.
 function key(e){if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();}else if(e.key==='Tab'){e.preventDefault();root.focus();}}
 function visibility(){last=0;}
 function frameLoop(now){if(!alive)return;raf=requestAnimationFrame(frameLoop);if(document.hidden){last=0;return;}if(last)elapsed+=Math.min(now-last,80);last=now;
  const titleTime=reduced?12000:scatterEnd,duration=titleTime+1200;
  ctx.clearRect(0,0,1536,1024);title.style.opacity='0';root.style.backgroundColor='#000';root.style.opacity='1';root.dataset.elapsed=String(Math.round(elapsed));
  const titleY=236+(openingLines.length-1)*36;
  if(elapsed<titleTime){
   const scatter=reduced?0:Math.max(0,Math.min(1,(elapsed-scatterStart)/2400));
   editor.style.opacity=String(Math.min(1,elapsed/450)*(1-scatter));let completedLines=0,current=-1;
   for(let i=0;i<openingLines.length;i++){
    const item=schedule[i],progress=reduced?1:item.typing?Math.max(0,Math.min(1,(elapsed-item.start)/item.typing)):Number(elapsed>=item.start);
    const text=openingLines[i].slice(0,Math.floor(openingLines[i].length*progress));if(lineNodes[i].textContent!==text)lineNodes[i].textContent=text;
    if(progress===1&&openingLines[i])completedLines++;if(openingLines[i]&&!reduced&&elapsed>=item.start&&elapsed<item.end)current=i;
    lineNodes[i].classList.toggle('is-typing',current===i&&scatter===0);
   }
   root.dataset.line=String(current);root.dataset.completedLines=String(completedLines);root.dataset.phase=scatter>0?'scatter':reduced||elapsed>=writtenAt?'reading':'writing';
   if(scatter>0){
    lineNodes.forEach(node=>node.style.visibility='hidden');title.style.opacity='1';Object.assign(title.style,{left:'244px',top:titleY+'px',fontSize:'24px',transform:'none'});
    const reveal=scatter*scatter*(3-2*scatter);root.style.backgroundColor=`rgba(0,0,0,${1-reveal*.94})`;root.dataset.reveal=reveal.toFixed(3);
    ctx.font='24px monospace';ctx.fillStyle='#dbe1d9';
    for(const p of atoms){const t=Math.max(0,Math.min(1,(scatter-p.delay)/(1-p.delay))),ease=t*t*(3-2*t);ctx.globalAlpha=Math.pow(1-t,1.5);ctx.fillText(p.char,p.x+p.dx*ease,p.y+p.dy*ease);}
    ctx.globalAlpha=1;
   }
  }else{
   editor.style.opacity='0';root.dataset.phase='title';const t=Math.min(1,(elapsed-titleTime)/1200),move=reduced?1:Math.max(0,Math.min(1,(t-.15)/.7)),ease=move*move*(3-2*move);
   title.style.opacity='1';Object.assign(title.style,{left:(244+(42-244)*ease)+'px',top:(titleY+(32-titleY)*ease)+'px',fontSize:(24+(20-24)*ease)+'px',transform:'none'});
   // Continue revealing the same live scene; no substitute particle screen
   // or opaque intermediate frame sits between the poem and the room.
   root.dataset.reveal=String(.94+.06*t);root.style.backgroundColor=`rgba(0,0,0,${(reduced?1:.06)*(1-t)})`;
   if(reduced)editor.style.opacity=String(1-t);
   title.style.opacity=String(t>.55?1-(t-.55)/.45:1);

  }
  if(elapsed>=duration)finish();
 }
 window.addEventListener('resize',resize);document.addEventListener('keydown',key,true);document.addEventListener('visibilitychange',visibility);resize();raf=requestAnimationFrame(frameLoop);
 return()=>{if(!completed)clean();};
}
