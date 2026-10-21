import {prepareImage} from './image-cache.js';
export const ASSEMBLY_KEY='save-file-me:assembly:v2';
export const components=[
 {id:'window',box:[198,272,210,169],label:[250,237,100,26]},
 {id:'lamp',box:[565,279,132,328],label:[595,237,75,26]},
 {id:'computer',box:[774,320,395,364],label:[900,282,150,27]},
 {id:'shelf',box:[1237,358,210,240],label:[1300,319,95,27]},
 {id:'bed',box:[102,557,342,285],label:[252,521,70,27]},
 {id:'door',box:[1231,691,145,153],label:[1263,651,84,29]}
];
export function resetAssembly(){try{localStorage.removeItem(ASSEMBLY_KEY);localStorage.removeItem('save-file-me:assembly:v1');}catch{}}
export function mountAssembly(visual,{completed=0}={}){
 const eligible=['window','lamp','computer','door'][Math.min(completed,3)];
 const retained=['window','lamp','computer','door'].slice(0,completed);
 const sceneComponents=components.map(c=>({...c,box:completed>0&&c.id==='window'?[50,246,460,270]:completed>=2&&c.id==='lamp'?[550,275,145,390]:completed===3&&c.id==='computer'?[770,290,415,400]:completed===3&&c.id==='shelf'?[1220,288,270,330]:completed===3&&c.id==='bed'?[48,557,486,295]:c.box}));
 const stage=visual.parentElement,canvas=document.createElement('canvas');canvas.width=1536;canvas.height=1024;canvas.className='prologue-assembly';canvas.setAttribute('aria-hidden','true');visual.append(canvas);
 const ctx=canvas.getContext('2d');ctx.fillStyle='#000';ctx.fillRect(40,216,1455,642);
 let saved=[];try{const data=JSON.parse(localStorage.getItem(ASSEMBLY_KEY));saved=data?.completed===completed?data.formed:[];}catch{}
 const done=new Set(Array.isArray(saved)?saved.filter(id=>retained.includes(id)||id===eligible):[]),groups=[];
 retained.forEach(id=>done.add(id));
 let disposed=false,raf=0,source=null,pointer=null,active=null,hold=0,holdStarted=0,last=0,touch=false,suppressClick=false;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 // Render small ASCII marks once. Animation only moves cached sprites.
 const atlas=document.createElement('canvas');atlas.width=96;atlas.height=64;const ac=atlas.getContext('2d');
 for(let a=0;a<4;a++)for(let g=0;g<6;g++){ac.save();ac.translate(g*16+8,a*16+8);ac.rotate(a*Math.PI/4);ac.font='8px monospace';ac.fillStyle='#ddd';ac.textAlign='center';ac.textBaseline='middle';ac.fillText(['.',':','/','|','-','+'][g],0,0);ac.restore();}
 const random=i=>{const n=Math.sin(i*127.1+311.7)*43758.5453;return n-Math.floor(n);};
 const ambient=Array.from({length:440},(_,i)=>({x:44+random(i+1)*1440,y:224+random(i+230)*624,vx:(random(i+900)-.5)*9,vy:(random(i+1200)-.5)*7,g:i%6,a:i%4}));
 function point(e){const r=stage.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*1536,y:(e.clientY-r.top)/r.height*1024,scale:r.width/1536};}
 function move(e){if(e.pointerType==='touch'&&!touch)return;pointer=point(e);const next=sceneComponents.find(c=>!done.has(c.id)&&pointer.x>=c.box[0]&&pointer.x<=c.box[0]+c.box[2]&&pointer.y>=c.box[1]&&pointer.y<=c.box[1]+c.box[3]);if(next?.id!==active?.id){active=next;hold=0;holdStarted=performance.now();}}
 function leave(){pointer=null;active=null;hold=0;holdStarted=0;}
 function down(e){if(e.pointerType==='touch'){touch=true;suppressClick=!done.has(eligible)&&!!e.target.closest('#entry-'+(['window','lamp','computer','door'].indexOf(eligible)+1));move(e);}}
 function up(e){if(e.pointerType==='touch'){touch=false;leave();}}
 function click(e){if(suppressClick){suppressClick=false;e.preventDefault();e.stopImmediatePropagation();return;}const entry=e.target.closest('[id^=entry-]');const id=entry&&['window','lamp','computer','door'][Number(entry.id.slice(6))-1];if(source&&id&&!done.has(id)){e.preventDefault();e.stopImmediatePropagation();}}
 for(const [type,fn] of [['pointermove',move],['pointerleave',leave],['pointerdown',down],['pointerup',up],['pointercancel',up],['click',click]])stage.addEventListener(type,fn,type==='click');
 function persist(){try{localStorage.setItem(ASSEMBLY_KEY,JSON.stringify({completed,formed:[...done]}));}catch{}}
 function mark(p,alpha){if(alpha<.01)return;ctx.globalAlpha=alpha;ctx.drawImage(atlas,p.g*16,p.a*16,16,16,p.x-8,p.y-8,16,16);}
 // Reference cursor halo: loose ASCII strokes, separate from the dwell meter.
 const orbit={x:768,y:530,alpha:0};
 const orbitAtlas=document.createElement('canvas');orbitAtlas.width=96;orbitAtlas.height=64;const oc=orbitAtlas.getContext('2d');
 for(let a=0;a<4;a++)for(let g=0;g<6;g++){oc.save();oc.translate(g*16+8,a*16+8);oc.rotate(a*Math.PI/4);oc.font='8px monospace';oc.fillStyle='#fff';oc.textAlign='center';oc.textBaseline='middle';oc.fillText(['.',':','/','|','-','+'][g],0,0);oc.restore();}
 const orbitParticles=Array.from({length:84},(_,i)=>({phase:i*2.3999632297,radius:82+random(i+1700)*28,speed:.24+random(i+1800)*.24,g:2+i%4,a:i%4}));
 function drawPointerOrbit(dt,now){
  const inside=pointer&&pointer.x>=40&&pointer.x<=1495&&pointer.y>=216&&pointer.y<=858;
  const fade=1-Math.exp(-dt*12);orbit.alpha+=(Number(Boolean(inside))-orbit.alpha)*fade;
  if(inside){if(orbit.alpha<.12){orbit.x=pointer.x;orbit.y=pointer.y;}else{orbit.x+=(pointer.x-orbit.x)*(1-Math.exp(-dt*22));orbit.y+=(pointer.y-orbit.y)*(1-Math.exp(-dt*22));}}
  canvas.dataset.orbitAlpha=orbit.alpha.toFixed(3);
  if(orbit.alpha<.01)return;
  const time=reduced?0:now*.001;
  for(const p of orbitParticles){const angle=p.phase+time*p.speed,radius=p.radius+Math.sin(time*1.1+p.phase)*4;
   const x=orbit.x+Math.cos(angle)*radius,y=orbit.y+Math.sin(angle)*radius;
   const alpha=orbit.alpha*(.65+.30*(.5+.5*Math.sin(p.phase*1.7-time*1.4)));
   const a=((Math.round(angle/(Math.PI/4))%4)+4)%4;ctx.globalAlpha=alpha;ctx.drawImage(orbitAtlas,p.g*16,a*16,16,16,x-8,y-8,16,16);
  }
  canvas.dataset.orbitX=orbit.x.toFixed(2);canvas.dataset.orbitY=orbit.y.toFixed(2);canvas.dataset.orbitCount='84';canvas.dataset.orbitAlpha=orbit.alpha.toFixed(3);
 }
 function frame(now){if(disposed)return;raf=requestAnimationFrame(frame);if(!source||document.hidden){last=now;return;}const began=performance.now(),dt=Math.min(last?(now-last)/1000:0,.04);last=now;
 if(active)hold=Math.min(1,(now-holdStarted)/1500);
 ctx.clearRect(0,0,1536,1024);ctx.save();ctx.beginPath();ctx.rect(40,216,1455,642);ctx.clip();ctx.fillStyle='#000';ctx.fillRect(40,216,1455,642);ctx.drawImage(source,580,631,89,36,580,631,89,36);
 for(const group of groups){const c=group.c,isActive=active?.id===c.id;
  if(isActive&&hold>=1&&c.id===eligible){done.add(c.id);persist();active=null;hold=0;}
  const target=done.has(c.id)?1:isActive?hold:0;
  // Independent fading masks retain unfinished fragments while the cursor moves.
  group.progress+=(target-group.progress)*(1-Math.exp(-dt*(target>group.progress?14:9)));
  if(done.has(c.id))group.progress=1;stage.style.setProperty('--assembly-'+c.id,String(group.progress));canvas.dataset[c.id+'Progress']=group.progress.toFixed(3);
  const bucket=Math.floor(group.progress*48);
  if(bucket!==group.bucket){group.bucket=bucket;const gc=group.context;gc.clearRect(0,0,group.layer.width,group.layer.height);for(const f of group.tiles)if(f.order<=bucket/48)gc.drawImage(source,f.x,f.y,f.w,f.h,f.x-c.box[0],f.y-c.box[1],f.w,f.h);}
  ctx.globalAlpha=1;if(done.has(c.id))ctx.drawImage(source,...c.box,...c.box);else ctx.drawImage(group.layer,c.box[0],c.box[1]);
  // Object names stay hidden; accessible button labels remain in the DOM.
  const k=1-Math.exp(-dt*7),t=reduced?0:now*.001;
  for(const p of group.particles){const gather=group.progress,driftX=Math.sin(t*.55+p.phase)*9,driftY=Math.cos(t*.47+p.phase)*12;
   let tx=p.homeX+(p.goalX-p.homeX)*gather+driftX*(1-gather),ty=p.homeY+(p.goalY-p.homeY)*gather+driftY*(1-gather);
   if(pointer&&!done.has(c.id)){const dx=tx-pointer.x,dy=ty-pointer.y,d=Math.hypot(dx,dy);if(d>1&&d<95){tx+=dx/d*(95-d)*.32;ty+=dy/d*(95-d)*.32;}}
   p.x+=(tx-p.x)*k;p.y+=(ty-p.y)*k;mark(p,(.30+.50*(isActive?1:0))*(1-gather));
  }
 }
 for(const p of ambient){if(!reduced){p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.x<44||p.x>1485)p.vx*=-1;if(p.y<224||p.y>850)p.vy*=-1;}mark(p,.68);}
 drawPointerOrbit(dt,now);
 ctx.globalAlpha=1;
 if(pointer&&active){const radius=15/pointer.scale,x=Math.min(1480-radius,pointer.x+24/pointer.scale),y=Math.max(230+radius,Math.min(848-radius,pointer.y-24/pointer.scale));ctx.lineWidth=2/pointer.scale;ctx.strokeStyle='#ffffff30';ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='#d5eadc';ctx.beginPath();ctx.arc(x,y,radius,-Math.PI/2,-Math.PI/2+Math.PI*2*hold);ctx.stroke();}
 for(const [index,id] of ['window','lamp','computer','door'].entries()){const entry=stage.querySelector('#entry-'+(index+1));if(entry)entry.setAttribute('aria-disabled',String(!done.has(id)));}
 ctx.restore();canvas.dataset.ambientParticles='440';canvas.dataset.active=active?.id||'';canvas.dataset.progress=String(hold);canvas.dataset.assembled=[...done].join(',');canvas.dataset.frame=String(now);canvas.dataset.drawMs=(performance.now()-began).toFixed(2);canvas.dataset.style='cached-fine-ascii';
 }
 prepareImage(visual.querySelector('.scene-image').getAttribute('src')).then(im=>{if(disposed)return;source=im;const sample=document.createElement('canvas');sample.width=1536;sample.height=1024;const sc=sample.getContext('2d',{willReadFrequently:true});sc.drawImage(im,0,0);sc.fillStyle='#000';for(const c of components)sc.fillRect(...c.label);if(completed===3){sc.fillRect(880,263,210,28);sc.fillRect(1285,263,165,25);}source=sample;const data=sc.getImageData(0,0,1536,1024).data;
 sceneComponents.forEach((c,index)=>{const [x,y,w,h]=c.box,goals=[],tiles=[],cols=Math.ceil(w/6),occupied=new Uint8Array(cols*Math.ceil(h/6));
  for(let py=y;py<y+h;py+=2)for(let px=x;px<x+w;px+=2)if(data[(py*1536+px)*4]>110){goals.push({x:px,y:py});occupied[Math.floor((py-y)/6)*cols+Math.floor((px-x)/6)]=1;}
  for(let py=0;py<h;py+=6)for(let px=0;px<w;px+=6)if(occupied[Math.floor(py/6)*cols+Math.floor(px/6)])tiles.push({x:x+px,y:y+py,w:Math.min(6,w-px),h:Math.min(6,h-py),order:random(index*2000+py*cols+px)});
  const layer=document.createElement('canvas');layer.width=w;layer.height=h;
  const particles=Array.from({length:110},(_,i)=>{const goal=goals[Math.floor(random(index*301+i+50)*goals.length)]||{x:x+w/2,y:y+h/2},phase=random(i+index*110)*Math.PI*2,spread=24+random(i+400)*60,homeX=Math.max(44,Math.min(1485,goal.x+Math.cos(phase)*spread)),homeY=Math.max(224,Math.min(850,goal.y+Math.sin(phase)*spread));return{x:homeX,y:homeY,homeX,homeY,goalX:goal.x,goalY:goal.y,phase,g:i%6,a:i%4};});
  groups.push({c,layer,context:layer.getContext('2d'),tiles,particles,progress:done.has(c.id)?1:0,bucket:-1});
 });if(reduced){done.add(eligible);persist();}canvas.dataset.assembled=[...done].join(',');raf=requestAnimationFrame(frame);
 }).catch(()=>{canvas.remove();});
 const visibility=()=>{leave();last=performance.now();};document.addEventListener('visibilitychange',visibility);
 return()=>{disposed=true;cancelAnimationFrame(raf);for(const [type,fn] of [['pointermove',move],['pointerleave',leave],['pointerdown',down],['pointerup',up],['pointercancel',up],['click',click]])stage.removeEventListener(type,fn,type==='click');document.removeEventListener('visibilitychange',visibility);for(const c of components)stage.style.removeProperty('--assembly-'+c.id);canvas.remove();};
}
