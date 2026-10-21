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
 const caption=document.createElement('p');caption.className='opening-line';caption.setAttribute('aria-hidden','true');
 const transcript=document.createElement('p');transcript.className='opening-transcript';transcript.textContent=openingLines.join(' ')+' SAVE FILE: ME';
 const title=document.createElement('div');title.className='opening-title';title.textContent='SAVE FILE: ME';title.setAttribute('aria-hidden','true');
 const skip=document.createElement('button');skip.className='opening-skip';skip.textContent='SKIP';skip.setAttribute('aria-label','Skip opening and enter the save room');
 frame.append(canvas,caption,title);root.append(frame,transcript,skip);document.getElementById('viewport').append(root);
 const ctx=canvas.getContext('2d'),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const priorFocus=document.activeElement,priorInert=stage.inert;stage.inert=true;skip.focus({preventScroll:true});
 let alive=true,raf=0,last=0,elapsed=0,completed=false;
 const random=i=>{const n=Math.sin(i*127.1+311.7)*43758.5453;return n-Math.floor(n);};
 const marks=Array.from({length:440},(_,i)=>({x:44+random(i+1)*1440,y:224+random(i+230)*624,phase:random(i+900)*6.28}));
 const atoms=openingLines.map((line,index)=>{const c=document.createElement('canvas');c.width=1200;c.height=90;const x=c.getContext('2d');x.font='32px monospace';x.textAlign='center';x.fillStyle='#fff';x.fillText(line,600,55);const d=x.getImageData(0,0,1200,90).data,points=[];for(let y=10;y<75;y+=4)for(let px=0;px<1200;px+=4)if(d[(y*1200+px)*4+3]>100)points.push({x:168+px,y:440+y});return points.filter((_,i)=>i%Math.max(1,Math.ceil(points.length/150))===0).map((p,i)=>({...p,goal:marks[(i*13+index*59)%marks.length]}));});
 function resize(){const r=stage.getBoundingClientRect();Object.assign(frame.style,{left:r.left+'px',top:r.top+'px',transform:`scale(${r.width/1536})`});}
 function clean(){if(!alive)return;alive=false;cancelAnimationFrame(raf);window.removeEventListener('resize',resize);document.removeEventListener('keydown',key);document.removeEventListener('visibilitychange',visibility);stage.inert=priorInert;root.remove();if(priorFocus?.isConnected&&priorFocus!==document.body)priorFocus.focus({preventScroll:true});}
 function finish(){if(!alive)return;completed=true;try{sessionStorage.setItem(OPENING_KEY,'seen');}catch{}clean();onFinish();}
 function key(e){if(e.key==='Escape'){e.preventDefault();e.stopPropagation();finish();}else if(e.key==='Tab'){e.preventDefault();skip.focus();}}
 function visibility(){last=0;}
 function path(points,progress){ctx.beginPath();const lengths=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1]));let remaining=lengths.reduce((a,b)=>a+b,0)*progress;ctx.moveTo(...points[0]);for(let i=0;i<lengths.length;i++){const fraction=Math.min(1,remaining/lengths[i]);ctx.lineTo(points[i][0]+(points[i+1][0]-points[i][0])*fraction,points[i][1]+(points[i+1][1]-points[i][1])*fraction);remaining-=lengths[i];if(remaining<=0)break;}ctx.stroke();}
 function sketch(index,p){ctx.save();ctx.strokeStyle='#cad7ce';ctx.globalAlpha=Math.min(1,p*3)*.65;ctx.lineWidth=1;
  if(index===2){path([[664,600],[664,710],[864,710],[864,600],[664,600]],p);path([[764,600],[764,710]],p);path([[664,655],[864,655]],p);}
  else if(index===3){path([[704,635],[724,590],[804,590],[824,635],[704,635]],p);path([[764,635],[764,725],[724,725],[804,725]],p);}
  else if(index===4){for(const x of [710,800])path([[x,620],[x,688],[x+15,672],[x+29,698],[x+36,694],[x+22,668],[x+44,668],[x,620]],p);}
  else if(index===5){path([[620,710],[620,600],[898,600]],p);path([[898,630],[898,710],[660,710]],p);}
  else path([[650,660],[878,660]],p);
  ctx.restore();
 }
 function frameLoop(now){if(!alive)return;raf=requestAnimationFrame(frameLoop);if(document.hidden){last=0;return;}if(last)elapsed+=Math.min(now-last,80);last=now;
  const intro=reduced?0:650,interval=reduced?2400:2800,titleTime=intro+openingLines.length*interval,duration=titleTime+(reduced?1200:2400);
  ctx.clearRect(0,0,1536,1024);caption.style.opacity='0';title.style.opacity='0';root.dataset.elapsed=String(Math.round(elapsed));
  const index=Math.floor((elapsed-intro)/interval),phase=((elapsed-intro)%interval)/interval;
  if(elapsed<intro){ctx.fillStyle='#dae1d9';if(Math.floor(elapsed/220)%2===0)ctx.fillRect(765,485,2,30);}
  else if(index<openingLines.length){
   const line=openingLines[index],reveal=reduced?1:Math.min(1,phase/.46),fade=phase>.79?(1-phase)/.21:1;
   caption.textContent=line.slice(0,Math.ceil(line.length*reveal));caption.style.opacity=String(Math.min(1,phase/.08)*fade);caption.classList.toggle('is-typing',reveal<1);root.dataset.line=String(index);
   if(!reduced){sketch(index,Math.min(1,phase/.6));if(phase>.72){const scatter=(phase-.72)/.28;ctx.font='8px monospace';ctx.fillStyle='#d9e2d8';ctx.globalAlpha=Math.min(1,scatter*3)*(1-scatter*.5);for(const [i,p] of atoms[index].entries()){const e=scatter*scatter;ctx.fillText(['.',':','/','|','-','+'][i%6],p.x+(p.goal.x-p.x)*e,p.y+(p.goal.y-p.y)*e);}ctx.globalAlpha=1;}}
  }else{
   const t=Math.min(1,(elapsed-titleTime)/(reduced?1200:2400)),move=reduced?1:Math.max(0,Math.min(1,(t-.25)/.6)),ease=move*move*(3-2*move);
   title.style.opacity=String(Math.min(1,t*7));Object.assign(title.style,{left:(768+(42-768)*ease)+'px',top:(460+(32-460)*ease)+'px',fontSize:(46+(20-46)*ease)+'px',transform:`translateX(${-50*(1-ease)}%)`});
   if(!reduced){ctx.font='8px monospace';ctx.fillStyle='#ddd';ctx.globalAlpha=t*.68;for(let i=0;i<marks.length;i++){const p=marks[i];ctx.fillText(['.',':','/','|','-','+'][i%6],p.x+Math.sin(t+p.phase)*4,p.y+Math.cos(t+p.phase)*4);}ctx.globalAlpha=1;ctx.strokeStyle='#b4bdb4';ctx.lineWidth=1;const spread=Math.max(0,(t-.35)/.65)*727;for(const y of [205,866]){ctx.beginPath();ctx.moveTo(768-spread,y);ctx.lineTo(768+spread,y);ctx.stroke();}}
   root.style.opacity=String(t>.65?1-(t-.65)/.35:1);
  }
  if(elapsed>=duration)finish();
 }
 skip.onclick=finish;window.addEventListener('resize',resize);document.addEventListener('keydown',key);document.addEventListener('visibilitychange',visibility);resize();raf=requestAnimationFrame(frameLoop);
 return()=>{if(!completed)clean();};
}
