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
 const marks=Array.from({length:440},(_,i)=>({x:44+random(i+1)*1440,y:224+random(i+230)*624,phase:random(i+900)*6.28}));
 const schedule=[];let writtenAt=650;
 for(const text of openingLines){const typing=text?Math.max(800,text.length*80):0,pause=text?650:250;schedule.push({start:writtenAt,typing,end:writtenAt+typing+pause});writtenAt+=typing+pause;}
 const scatterStart=writtenAt+6500,scatterEnd=scatterStart+2400;
 // Only the poem's characters scatter. Its final line remains as the room title.
 const atoms=openingLines.slice(0,-1).map((line,index)=>{const c=document.createElement('canvas');c.width=1040;c.height=36;const x=c.getContext('2d');x.font='24px monospace';x.fillStyle='#fff';x.fillText(line,0,26);const d=x.getImageData(0,0,1040,36).data,points=[];for(let y=2;y<34;y+=3)for(let px=0;px<1040;px+=3)if(d[(y*1040+px)*4+3]>100)points.push({x:244+px,y:236+index*36+y});return points.filter((_,i)=>i%Math.max(1,Math.ceil(points.length/100))===0).map((p,i)=>({...p,goal:marks[(i*13+index*59)%marks.length]}));});
 function resize(){const r=stage.getBoundingClientRect();Object.assign(frame.style,{left:r.left+'px',top:r.top+'px',transform:`scale(${r.width/1536})`});}
 function clean(){if(!alive)return;alive=false;cancelAnimationFrame(raf);window.removeEventListener('resize',resize);document.removeEventListener('keydown',key,true);document.removeEventListener('visibilitychange',visibility);stage.inert=priorInert;root.remove();if(priorFocus?.isConnected&&priorFocus!==document.body)priorFocus.focus({preventScroll:true});}
 function finish(){if(!alive)return;completed=true;try{sessionStorage.setItem(OPENING_KEY,'seen');}catch{}clean();onFinish();}
 // This opening has no skip path: Escape and clicks never finish playback.
 function key(e){if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();}else if(e.key==='Tab'){e.preventDefault();root.focus();}}
 function visibility(){last=0;}
 function frameLoop(now){if(!alive)return;raf=requestAnimationFrame(frameLoop);if(document.hidden){last=0;return;}if(last)elapsed+=Math.min(now-last,80);last=now;
  const titleTime=reduced?12000:scatterEnd,duration=titleTime+(reduced?1200:3200);
  ctx.clearRect(0,0,1536,1024);title.style.opacity='0';root.dataset.elapsed=String(Math.round(elapsed));
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
   if(scatter>0){lineNodes.at(-1).style.visibility='hidden';title.style.opacity='1';Object.assign(title.style,{left:'244px',top:titleY+'px',fontSize:'24px',transform:'none'});ctx.font='8px monospace';ctx.fillStyle='#d9e2d8';ctx.globalAlpha=Math.sin(Math.PI*scatter)*.8;const ease=scatter*scatter*(3-2*scatter);for(const group of atoms)for(const [i,p] of group.entries())ctx.fillText(['.',':','/','|','-','+'][i%6],p.x+(p.goal.x-p.x)*ease,p.y+(p.goal.y-p.y)*ease);ctx.globalAlpha=1;}
  }else{
   editor.style.opacity='0';root.dataset.phase='title';const t=Math.min(1,(elapsed-titleTime)/(reduced?1200:3200)),move=reduced?1:Math.max(0,Math.min(1,(t-.15)/.7)),ease=move*move*(3-2*move);
   title.style.opacity='1';Object.assign(title.style,{left:(244+(42-244)*ease)+'px',top:(titleY+(32-titleY)*ease)+'px',fontSize:(24+(20-24)*ease)+'px',transform:'none'});
   if(!reduced){ctx.font='8px monospace';ctx.fillStyle='#ddd';ctx.globalAlpha=t*.68;for(let i=0;i<marks.length;i++){const p=marks[i];ctx.fillText(['.',':','/','|','-','+'][i%6],p.x+Math.sin(t+p.phase)*4,p.y+Math.cos(t+p.phase)*4);}ctx.globalAlpha=1;ctx.strokeStyle='#b4bdb4';ctx.lineWidth=1;const spread=Math.max(0,(t-.35)/.65)*727;for(const y of [205,866]){ctx.beginPath();ctx.moveTo(768-spread,y);ctx.lineTo(768+spread,y);ctx.stroke();}}
   root.style.opacity=String(t>.7?1-(t-.7)/.3:1);
  }
  if(elapsed>=duration)finish();
 }
 window.addEventListener('resize',resize);document.addEventListener('keydown',key,true);document.addEventListener('visibilitychange',visibility);resize();raf=requestAnimationFrame(frameLoop);
 return()=>{if(!completed)clean();};
}
