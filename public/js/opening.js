export const OPENING_KEY='save-file-me:opening:v1';
export const openingLines=[
 'I grew up playing games.',
 'As my life changed, so did what they meant to me.',
 'Sometimes, a place to explore.',
 'Sometimes, a place to pause.',
 'Sometimes, a reason to try again.',
 'Until I wanted to make something of my own.'
];
export function shouldShowOpening(state){
 if(state.scene!=='prologue')return false;
 if(new URLSearchParams(location.search).get('opening')==='1')return true;
 if(state.completed!==0)return false;
 try{return sessionStorage.getItem(OPENING_KEY)!=='seen';}catch{return true;}
}
export function mountOpening({stage,onFinish=()=>{}}){
 const root=document.createElement('section');root.className='opening';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Save File: Me · opening poem');
 const frame=document.createElement('div');frame.className='opening-frame';
 const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=1024;canvas.setAttribute('aria-hidden','true');
 const caption=document.createElement('div');caption.className='opening-document';caption.setAttribute('aria-hidden','true');
 const lineNodes=openingLines.map(()=>{const line=document.createElement('p');line.className='opening-line';caption.append(line);return line;});
 const transcript=document.createElement('p');transcript.className='opening-transcript';transcript.textContent=openingLines.join(' ')+' SAVE FILE: ME';
 const title=document.createElement('div');title.className='opening-title';title.textContent='SAVE FILE: ME';title.setAttribute('aria-hidden','true');
 const skip=document.createElement('button');skip.className='opening-skip';skip.textContent='SKIP';skip.setAttribute('aria-label','Skip opening and enter the save room');
 frame.append(canvas,caption,title);root.append(frame,transcript,skip);document.getElementById('viewport').append(root);
 const ctx=canvas.getContext('2d'),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const priorFocus=document.activeElement,priorInert=stage.inert;stage.inert=true;skip.focus({preventScroll:true});
 let alive=true,raf=0,last=0,elapsed=0,completed=false;
 const random=i=>{const n=Math.sin(i*127.1+311.7)*43758.5453;return n-Math.floor(n);};
 const marks=Array.from({length:440},(_,i)=>({x:44+random(i+1)*1440,y:224+random(i+230)*624,phase:random(i+900)*6.28}));
 const schedule=[];let writtenAt=650;
 for(const text of openingLines){const typing=Math.max(2300,text.length*80);schedule.push({start:writtenAt,typing,end:writtenAt+typing+1100});writtenAt+=typing+1100;}
 const scatterStart=writtenAt+6500,scatterEnd=scatterStart+2400;
 const atoms=openingLines.map((line,index)=>{const c=document.createElement('canvas');c.width=1116;c.height=54;const x=c.getContext('2d');x.font='28px monospace';x.fillStyle='#fff';x.fillText(line,0,34);const d=x.getImageData(0,0,1116,54).data,points=[];for(let y=4;y<48;y+=3)for(let px=0;px<1116;px+=3)if(d[(y*1116+px)*4+3]>100)points.push({x:210+px,y:280+index*66+y});return points.filter((_,i)=>i%Math.max(1,Math.ceil(points.length/150))===0).map((p,i)=>({...p,goal:marks[(i*13+index*59)%marks.length]}));});
 function resize(){const r=stage.getBoundingClientRect();Object.assign(frame.style,{left:r.left+'px',top:r.top+'px',transform:`scale(${r.width/1536})`});}
 function clean(){if(!alive)return;alive=false;cancelAnimationFrame(raf);window.removeEventListener('resize',resize);document.removeEventListener('keydown',key);document.removeEventListener('visibilitychange',visibility);stage.inert=priorInert;root.remove();if(priorFocus?.isConnected&&priorFocus!==document.body)priorFocus.focus({preventScroll:true});}
 function finish(){if(!alive)return;completed=true;try{sessionStorage.setItem(OPENING_KEY,'seen');}catch{}clean();onFinish();}
 function key(e){if(e.key==='Escape'){e.preventDefault();e.stopPropagation();finish();}else if(e.key==='Tab'){e.preventDefault();skip.focus();}}
 function visibility(){last=0;}
 function path(points,progress){ctx.beginPath();const lengths=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1]));let remaining=lengths.reduce((a,b)=>a+b,0)*progress;ctx.moveTo(...points[0]);for(let i=0;i<lengths.length;i++){const fraction=Math.min(1,remaining/lengths[i]);ctx.lineTo(points[i][0]+(points[i+1][0]-points[i][0])*fraction,points[i][1]+(points[i+1][1]-points[i][1])*fraction);remaining-=lengths[i];if(remaining<=0)break;}ctx.stroke();}
 function sketch(index,p,alpha=1){ctx.save();ctx.strokeStyle='#cad7ce';ctx.globalAlpha=Math.min(1,p*3)*.65*alpha;ctx.lineWidth=1;
  if(index===2){path([[664,600],[664,710],[864,710],[864,600],[664,600]],p);path([[764,600],[764,710]],p);path([[664,655],[864,655]],p);}
  else if(index===3){path([[704,635],[724,590],[804,590],[824,635],[704,635]],p);path([[764,635],[764,725],[724,725],[804,725]],p);}
  else if(index===4){for(const x of [710,800])path([[x,620],[x,688],[x+15,672],[x+29,698],[x+36,694],[x+22,668],[x+44,668],[x,620]],p);}
  else if(index===5){path([[620,710],[620,600],[898,600]],p);path([[898,630],[898,710],[660,710]],p);}
  else path([[650,660],[878,660]],p);
  ctx.restore();
 }
 function frameLoop(now){if(!alive)return;raf=requestAnimationFrame(frameLoop);if(document.hidden){last=0;return;}if(last)elapsed+=Math.min(now-last,80);last=now;
  const titleTime=reduced?12000:scatterEnd,duration=titleTime+(reduced?1200:3600);
  ctx.clearRect(0,0,1536,1024);caption.style.opacity='0';title.style.opacity='0';root.dataset.elapsed=String(Math.round(elapsed));
  if(elapsed<titleTime){
   const scatter=reduced?0:Math.max(0,Math.min(1,(elapsed-scatterStart)/2400));
   caption.style.opacity=String(1-scatter);let completedLines=0,current=-1;
   for(let i=0;i<openingLines.length;i++){
    const item=schedule[i],progress=reduced?1:Math.max(0,Math.min(1,(elapsed-item.start)/item.typing));
    lineNodes[i].textContent=openingLines[i].slice(0,Math.floor(openingLines[i].length*progress));
    if(progress===1)completedLines++;if(!reduced&&elapsed>=item.start&&elapsed<item.end)current=i;
    lineNodes[i].classList.toggle('is-typing',current===i&&scatter===0);
    if(!reduced&&i>=2&&progress>0){ctx.save();ctx.translate(1220-768*.38,306+i*66-660*.38);ctx.scale(.38,.38);sketch(i,progress,1-scatter);ctx.restore();}
   }
   root.dataset.line=String(current);root.dataset.completedLines=String(completedLines);
   root.dataset.phase=scatter>0?'scatter':completedLines===6?'reading':'writing';
   if(!reduced&&elapsed<650&&Math.floor(elapsed/300)%2===0){ctx.fillStyle='#dae1d9';ctx.fillRect(210,287,2,28);}
   if(scatter>0){ctx.font='8px monospace';ctx.fillStyle='#d9e2d8';ctx.globalAlpha=Math.sin(Math.PI*scatter)*.8;const ease=scatter*scatter*(3-2*scatter);for(const group of atoms)for(const [i,p] of group.entries())ctx.fillText(['.',':','/','|','-','+'][i%6],p.x+(p.goal.x-p.x)*ease,p.y+(p.goal.y-p.y)*ease);ctx.globalAlpha=1;}
  }else{
   root.dataset.phase='title';const t=Math.min(1,(elapsed-titleTime)/(reduced?1200:3600)),move=reduced?1:Math.max(0,Math.min(1,(t-.3)/.55)),ease=move*move*(3-2*move);
   title.style.opacity=String(Math.min(1,t*7));Object.assign(title.style,{left:(768+(42-768)*ease)+'px',top:(460+(32-460)*ease)+'px',fontSize:(46+(20-46)*ease)+'px',transform:`translateX(${-50*(1-ease)}%)`});
   if(!reduced){ctx.font='8px monospace';ctx.fillStyle='#ddd';ctx.globalAlpha=t*.68;for(let i=0;i<marks.length;i++){const p=marks[i];ctx.fillText(['.',':','/','|','-','+'][i%6],p.x+Math.sin(t+p.phase)*4,p.y+Math.cos(t+p.phase)*4);}ctx.globalAlpha=1;ctx.strokeStyle='#b4bdb4';ctx.lineWidth=1;const spread=Math.max(0,(t-.35)/.65)*727;for(const y of [205,866]){ctx.beginPath();ctx.moveTo(768-spread,y);ctx.lineTo(768+spread,y);ctx.stroke();}}
   root.style.opacity=String(t>.7?1-(t-.7)/.3:1);
  }
  if(elapsed>=duration)finish();
 }
 skip.onclick=finish;window.addEventListener('resize',resize);document.addEventListener('keydown',key);document.addEventListener('visibilitychange',visibility);resize();raf=requestAnimationFrame(frameLoop);
 return()=>{if(!completed)clean();};
}
