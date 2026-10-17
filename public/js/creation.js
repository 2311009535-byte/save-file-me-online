import {gameAudio} from './game-audio.js';
import {createChapterLoading} from './chapter-loading.js';
import {createChapterIntro} from './chapter-intro.js';
import {prepareImage} from './image-cache.js';
import {createVideoTransitions} from './wonder-videos.js';
import {mountAvatar} from './avatar.js';
import {createHandTracker} from './hand-tracker.js';
import {CreationGame,CREATION_KEY,objects} from './creation-state.js';
import {input} from './input.js';
import {creationAssets} from './creation-assets.js';
import {DwellSelection} from './creation-dwell.js';
import {createCodeAnimation} from './creation-code-animation.js';
import {createCreationRenderer} from './creation-renderer.js?v=finish2';
const labels=['WINDOW','FLOOR LAMP','BED','DESK + COMPUTER','DOOR'];
export function mountCreation({root,finish}){
 const intro=createChapterIntro(document.getElementById('stage')),loader=createChapterLoading(root);
 const runVideo=createVideoTransitions({room:{enter:{src:'/assets/creation/videos/run-room.mp4',available:true},return:{available:false}}},'creation-run-video');
 let alive=true,started=false,drag=null,handSelection=null,holdFrame=null,transitionEpoch=0,settleTimer=null,plugSelected=false,inputMode='hands',runStarting=false,returning=false,returnAnimation=null;
 let saved;try{saved=JSON.parse(localStorage.getItem(CREATION_KEY));}catch{}
 if(saved?.phase==='finished')saved={roomCreated:false,built:0,phase:'room-place'};
 const game=new CreationGame(saved,state=>{try{localStorage.setItem(CREATION_KEY,JSON.stringify(state));}catch{}render();});
 root.classList.add('creation-scene');
 root.innerHTML='<img class="creation-backdrop" src="/assets/creation/4_1.JPG" alt="Chapter 04 creation"><div class="creation-fixed-build"></div><div class="creation-fixed-code"></div><div class="creation-summary"></div><div class="creation-code"></div><div class="creation-board"></div><div class="creation-inventory"><div class="creation-inventory-art"></div></div><div class="creation-controls" hidden><button id="hand-start">ENABLE HANDS</button><button id="hand-stop">STOP CAMERA</button><button id="creation-photo">PHOTO PREVIEW</button><button id="creation-input-mode">SWITCH TO MOUSE</button><span id="creation-mode-status">HAND MODE · ENABLE HANDS TO BUILD</span><p id="creation-help" role="status"></p><p id="creation-pinch-hint" hidden role="status"><svg viewBox="0 0 64 48" aria-hidden="true"><path d="M22 40c-8-9-11-16-9-20 2-4 6-2 10 4l4 5-2-20c-1-7 7-8 8-1l3 19 3-8c2-6 8-4 7 2l-1 10c-1 6-4 10-9 13M28 3l4 3M42 4l-3 4M39 13l5-1"/><path class="pinch-arrow" d="M55 35V14m-5 5 5-5 5 5"/></svg><span>PINCH THUMB + INDEX AND PULL UP; RELEASE AT 100%  THEN RELEASE</span></p><p id="hand-status" role="status">Dwell on an item for 1.5 s to select or grab; dwell in the drop zone for 1.5 s to place; pinch to lift.</p><video id="hand-camera" muted playsinline hidden></video></div><div class="hand-cursor" hidden></div><div class="hand-dwell" hidden aria-hidden="true"><svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="20"/><circle class="dwell-progress" cx="24" cy="24" r="20" pathLength="100"/><text x="24" y="28" text-anchor="middle">1.5s</text></svg></div>';
 const controls=root.querySelector('.creation-controls');
 const $=s=>s==='.creation-controls'?controls:root.querySelector(s)||controls.querySelector(s),board=$('.creation-board'),cursor=$('.hand-cursor');
 const codeAnimation=createCodeAnimation($('.creation-code'));
 const renderer=createCreationRenderer(root),dwell=new DwellSelection(),dropDwell=new DwellSelection(),dwellRing=$('.hand-dwell');let hitCache=null,dropAnchor=null;
 const clearHits=()=>{hitCache=null;};window.addEventListener('resize',clearHits);const hitObserver=new MutationObserver(records=>{if(records.some(record=>[...record.addedNodes,...record.removedNodes].some(node=>node.nodeType===1&&(node.matches('button')||node.querySelector('button')))))clearHits();});hitObserver.observe(root,{childList:true,subtree:true});
 const debug=document.createElement('output');debug.className='creation-hand-debug';debug.hidden=true;document.body.append(controls,debug);
 let handState={detected:false,pinching:false,ratio:null},lastHandPoint=null,lastOpenPoint=null;
 const panel=document.getElementById('dev-panel');
 const debugObserver=new MutationObserver(()=>{debug.hidden=!panel||panel.hidden;if(!debug.hidden)debugUpdate();});
 if(panel)debugObserver.observe(panel,{attributes:true,attributeFilter:['hidden']});debug.hidden=!panel||panel.hidden;
 function targetName(el){const label=el?.getAttribute('aria-label')||el?.dataset.drag||el?.textContent.trim()||'None';return label+(el?.disabled?' (LOCKED)':'');}
 function debugUpdate(){if(debug.hidden)return;debug.textContent=`Hand detected: ${handState.detected?'Yes':'No'} · Pinching: ${handState.pinching?'Yes':'No'} · Distance / palm: ${handState.ratio==null?'—':handState.ratio.toFixed(2)} (close <=0.50 / open >=0.75）\nHover: ${targetName(handState.detected&&lastHandPoint?hit(lastHandPoint,true):null)} · Grabbed: ${drag?.owner==='hand'?'Yes ('+targetName(drag.element)+'）':'No'} · Selected: ${targetName(handSelection?.element)}\nTracking: ${handState.fps==null?'—':handState.fps.toFixed(1)+' fps'} · Inference: ${handState.inferenceMs==null?'—':handState.inferenceMs.toFixed(0)+' ms'}\nModel: ${$('#hand-status').textContent}`;}
 window.dispatchEvent(new Event('resize'));
 function point(x,y){const r=root.getBoundingClientRect();return {x:(x-r.left)/r.width,y:(y-r.top)/r.height};}
 function client(p){const r=root.getBoundingClientRect();return {x:r.left+p.x*r.width,y:r.top+p.y*r.height};}
 function hit(p,includeDisabled=false){
  const q=client(p);
  if(!hitCache)hitCache=[...root.querySelectorAll('button')].map(el=>({el,box:el.getBoundingClientRect()}));
  const candidates=hitCache.filter(({el,box})=>el.isConnected&&(includeDisabled||!el.disabled)&&!el.closest('[hidden]')&&box.width>2);
  const contains=({box:b},pad)=>q.x>=b.left-pad&&q.x<=b.right+pad&&q.y>=b.top-pad&&q.y<=b.bottom+pad;
  return (candidates.find(entry=>contains(entry,0))||candidates.filter(entry=>contains(entry,10)).sort((a,b)=>Math.hypot(q.x-a.box.left-a.box.width/2,q.y-a.box.top-a.box.height/2)-Math.hypot(q.x-b.box.left-b.box.width/2,q.y-b.box.top-b.box.height/2))[0])?.el||null;
 }
 function frame(n){const name=creationAssets[n]?.name||(n===28||n===37?`4_${n}.JPG`:`4_${n}.png`);const image=$('.creation-backdrop');if(image.dataset.frame!==String(n)){image.src='/assets/creation/'+name;image.dataset.frame=n;renderer.show(n);}root.dataset.creationFrame=n;}
 function asset(n){frame(n);return `<span class="creation-art" aria-label="Scene ${n}" data-scene="${n}"></span>`;}
 function room(){return asset([4,12,19,25,32,37][game.state.built]);}
 function setArt(n){if(root.dataset.creationFrame===String(n))return;const art=board.querySelector('.creation-art');frame(n);if(art)art.outerHTML=asset(n);}
 function recovered(n){if(n===14)animateCode('recovered');resetDwell();clearHits();drag=null;handSelection=null;cancelAnimationFrame(holdFrame);board.innerHTML=asset(n)+'<button class="creation-return">RETURN TO BUILD</button>';$('.creation-return').onclick=()=>game.solve();$('#creation-objective').textContent='Memory restored. Dwell on RETURN TO BUILD for 1.5 s to return to build.';$('#creation-help').textContent=$('#creation-objective').textContent;}
 function animateCode(stage){
  const {built,item,roomCreated}=game.state;
  const name={window:'window',lamp:'floorLamp',bed:'bed',computer:'computer',door:'door'}[item];
  const lines=[];
  if(!codeAnimation.hasHistory()){
   lines.push('// A room for your memories.','const room = createRoom();','const memory = {};','room.objectsBuilt = 0;','');
   for(let i=0;i<built;i++)lines.push(`// Memory ${i+1}: ${objects[i]}`,`memory.${objects[i]} = true;`,`await placeObject(${objects[i]});`,`await raiseObject(${objects[i]});`,`await releaseToInstall(${objects[i]});`,`room.objectsBuilt = ${i+1};`,'');
  }
  if(stage==='puzzle')lines.push(`// Memory ${built+1}: ${name}`,`const ${name} = selectObject("${name}");`,item==='computer'?'await selectPlug();':item==='door'?'await selectSaveFile();':`await restoreMemory(${name});`,'');
  else if(stage==='recovered')lines.push(`memory.${name} = true;`,`unlockBuild(${name});`,'await returnToBuild();','');
  else if(stage==='plug-selected')lines.push('computer.plugSelected = true;','await selectPowerStrip();','');
  else if(stage==='connected')lines.push('computer.connected = true;','await pressPowerButton();','');
  else if(stage==='place')lines.push(`await placeObject(${name});`,`${name}.placed = true;`,'');
  else if(stage==='raise'||stage==='room-raise')lines.push(`await raiseObject(${stage==='room-raise'?'room':name});`,'await releaseToInstall();','');
  else if(stage==='complete')lines.push('room.objectsBuilt = 5;','room.complete = true;','// Every memory found its place.','await runRoom();');
  else if(stage==='choose')lines.push(`room.objectsBuilt = ${built};`,`memory.current = ${Math.min(5,built+1)};`,'await chooseObject();','');
  else if(stage==='room-place')lines.push('await createRoomBase();','await placeRoomBase();','');
  codeAnimation.append(`${built}:${item}:${stage}`,lines);

 }
 function markInventory(item){root.querySelectorAll('[data-object]').forEach(el=>{const selected=el.dataset.object===item;el.classList.toggle('is-selected',selected);el.setAttribute('aria-pressed',String(selected));});}
 function render(){
  if(!alive||!started)return;if(!['transition','finished'].includes(game.state.phase))runVideo.cancel();clearTimeout(settleTimer);resetDwell();clearHits();renderer.stopRaise();drag=null;handSelection=null;cancelAnimationFrame(holdFrame);
  plugSelected=false;runStarting=false;root.classList.remove('creation-real-room','creation-transition');
  root.querySelectorAll(':scope > [data-drag=place], :scope > .creation-run').forEach(el=>el.remove());
  const {built,phase,item}=game.state;gameAudio.setCreation(built);if(phase!=='transition')$('#hand-start').disabled=false;root.classList.toggle('creation-door-lift',phase==='raise'&&item==='door');root.classList.toggle('creation-easy-lift',phase==='raise'&&['bed','computer','door'].includes(item));
  $('.creation-summary').innerHTML=`<h2>CREATION</h2><p>MEMORY RECONSTRUCTION</p><p>${!game.state.roomCreated?'CREATE THE ROOM':built===5?'ROOM COMPLETE':'MEMORY / '+String(built+1).padStart(2,'0')}</p><p>Built ${built} / 5</p><p>${!game.state.roomCreated?'ROOM BASE':labels[objects.indexOf(item)]}</p><p id="creation-objective" role="status"></p>`;
  animateCode(phase);
  $('.creation-inventory').innerHTML='<div class="creation-inventory-art" aria-hidden="true"></div>'+objects.map((o,i)=>`<button data-object="${o}" ${(i!==built&&!(built===0&&i===1))||phase!=='choose'?'disabled':''} class="${o==='door'&&built>=4?'door-unlocked ':''}${['puzzle','place','raise'].includes(phase)&&o===item?'is-selected':''}" aria-pressed="${['puzzle','place','raise'].includes(phase)&&o===item}" aria-label="${labels[i]}">${i<4?`<span class="creation-fixed-icon" data-icon="${o}" aria-hidden="true"></span>`:'<svg class="door-icon" viewBox="2770 1650 250 200" aria-label="DOOR"><image href="/assets/creation/4_4.JPG" width="3838" height="2160"/></svg>'}<span>${String(i+1).padStart(2,'0')} ${labels[i]}</span><small>${o==='door'&&built===4&&phase==='choose'?'UNLOCKED':i<built?'BUILT':(i===built||(built===0&&i===1&&phase==='choose'))?(phase==='choose'?'INSPECT':'SELECTED'):'LOCKED'}</small></button>`).join('');
  if(game.state.roomCreated){renderer.icon('inventory',$('.creation-inventory-art'));root.querySelectorAll('[data-icon]').forEach(el=>renderer.icon(el.dataset.icon,el));}
  $('.creation-inventory').hidden=!game.state.roomCreated;root.querySelectorAll('[data-object]').forEach(b=>b.onclick=()=>{markInventory(b.dataset.object);if(!game.choose(b.dataset.object)&&built===0&&b.dataset.object==='lamp'){setArt(5);objective.textContent='The light came from the sky. Choose the window.';$('#creation-help').textContent=objective.textContent;}});
  board.innerHTML=['choose','complete'].includes(phase)?room():'';
  const objective=$('#creation-objective');
  if(phase==='room-place'){objective.textContent='Dwell on the base for 1.5 s to grab; dwell in the center for 1.5 s to place, then pinch and lift.';board.innerHTML=asset(1)+'<div class="build-drop creation-drop" data-target="place">DROP ZONE</div><button class="build-item room-base-item" data-drag="place" aria-label="ROOM BASE">PLACE ROOM BASE</button>';}
  else if(phase==='room-raise'){objective.textContent='PINCH and pull the room upward; reach 100%  then release.';board.innerHTML=asset(2)+'<button class="raise-item" data-drag="raise">LIFT ROOM ↑ <span id="build-progress">0%</span></button>';}
  else if(phase==='choose'){objective.textContent='Dwell on INSPECT  for 1.5 s to select. LOCKED items require the previous object to be placed and lifted.';}
  else if(phase==='puzzle'){
   if(item==='window'){objective.textContent='Dwell on a star for 1.5 s to grab; move your index finger; dwell in the window for 1.5 s to place.';board.innerHTML=asset(6)+'<div class="creation-drop" data-target="window">WINDOW</div><button class="star star-one" data-drag="star1" aria-label="First star"><svg viewBox="910 640 260 270" aria-hidden="true"><image href="/assets/creation/4_6.JPG" width="3838" height="2160"/></svg></button><button class="star star-two" data-drag="star2" aria-label="Second star"><svg viewBox="2700 640 260 270" aria-hidden="true"><image href="/assets/creation/4_6.JPG" width="3838" height="2160"/></svg></button>';}
   if(item==='lamp'){objective.textContent='Dwell on HOLD  switch for 1.5 s to light up; in mouse mode hold for 2 s.';board.innerHTML=asset(13)+'<button class="lamp-hold" data-drag="lamp" aria-label="Lamp switch">HOLD TO LIGHT · 0%</button>';}
   if(item==='bed'){objective.textContent='Dwell on the blanket for 1.5 s to grab, then move your index finger upward.';board.innerHTML=asset(20)+'<button class="quilt-drag" data-drag="quilt" aria-label="BLANKET">GRAB BLANKET ↑</button><output class="quilt-dwell-progress" role="progressbar" aria-label="Blanket dwell progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">0%</output>';}
   if(item==='computer'){objective.textContent='Dwell on the plug for 1.5 s to select; then dwell on the power strip for 1.5 s to connect, then dwell on POWER.';board.innerHTML=asset(26)+'<button class="plug-drag" data-drag="plug" aria-label="PLUG">PLUG</button><button class="computer-socket creation-drop socket-control" data-target="socket" aria-label="POWER STRIP" disabled>POWER STRIP</button><button class="computer-power" aria-label="Computer power" disabled>POWER</button>';$('.plug-drag').onclick=selectPlug;$('.socket-control').onclick=connectPlug;$('.computer-power').onclick=()=>{if(game.connected){animateCode('recovered');board.innerHTML=asset(28);objective.textContent='Computer memory restored.';const b=document.createElement('button');b.className='creation-return missing-source-action';b.setAttribute('aria-label','RETURN TO BUILD');b.innerHTML='<svg viewBox="1610 1370 650 140" aria-hidden="true"><image href="/assets/creation/4_7.JPG" width="3838" height="2160"/></svg>';b.onclick=()=>game.solve();board.append(b);}};}
   if(item==='door'){objective.textContent='Dwell on the save card for 1.5 s to grab; move it to the door slot and dwell for 1.5 s to install.';board.innerHTML=asset(33)+'<button class="save-card" data-drag="save" aria-label="SAVE CARD">SAVE FILE: ME</button><div class="door-slot creation-drop" data-target="slot">SAVE SLOT</div>';}
  }else if(phase==='place'){
   objective.textContent='Dwell on the inventory item for 1.5 s to grab; move to the drop zone and dwell for 1.5 s to place.';
   board.innerHTML=asset({window:8,lamp:15,bed:19,computer:25,door:31}[item])+`<div class="build-drop creation-drop" data-target="place">DROP ZONE</div><button class="build-item" data-drag="place" aria-label="PLACE ${labels[built]}">PLACE ${labels[built]}</button>`;
  }else if(phase==='raise'){
   objective.textContent='PINCH and pull upward; reach 100%  and release to complete the build.';
   board.innerHTML=asset({window:9,lamp:16,bed:22,computer:29,door:35}[item])+`<button class="raise-item" data-drag="raise">PULL UP ↑ <span id="build-progress">0%</span></button>`;
  }else if(phase==='complete'){
   objective.textContent='All five objects installed. Dwell on RUN to bring the room to life.';const b=document.createElement('button');b.className='creation-run';b.textContent='RUN';b.onclick=()=>{if(runStarting)return;runStarting=true;b.classList.add('is-selected');b.setAttribute('aria-pressed','true');b.disabled=true;settleTimer=setTimeout(()=>game.commit('transition'),600);};board.append(b);
  }else if(phase==='transition'){if(!intro.active)transition();}
  else if(phase==='finished'){showFinalRoom();}
  if(phase==='puzzle'&&['window','lamp','bed','computer','door'].includes(item)){const hint=document.createElement('p');hint.className='creation-action-hint';hint.textContent=item==='window'?'Dwell 1.5s on a star to grab; dwell 1.5s in the window to place.':item==='lamp'?'HOLD  switch for 1.5 s to light up':item==='bed'?'Dwell on the blanket for 1.5 s to grab, then pull upward':item==='computer'?'PLUG: dwell 1.5 s to select; POWER STRIP: dwell 1.5 s to connect':'SAVE CARD: dwell 1.5 s to grab; DOOR SLOT: dwell 1.5 s to install';board.append(hint);}if(['room-place','place','choose'].includes(phase)){const hint=document.createElement('p');hint.className='creation-action-hint';hint.textContent=objective.textContent;board.append(hint);}const placeHandle=board.querySelector('[data-drag=place]');const run=board.querySelector('.creation-run');if(run)root.append(run);if(placeHandle){placeHandle.style.left=(phase==='room-place'?21.1:21.1+built*11.8)+'%';root.append(placeHandle);}
  const now=Number(root.dataset.creationFrame);renderer.warm([now+1,now+2]);if(['raise','room-raise'].includes(phase)){renderer.warm(raiseStages());renderer.raise(raiseStages(),0);}
  const raising=['raise','room-raise'].includes(phase);if(raising){const hint=document.createElement('p');hint.className='creation-lift-hint';hint.textContent=phase==='room-raise'?'PINCH thumb + index, then lift the floor ↑':'PINCH thumb + index, then lift ↑';board.append(hint);}$('#creation-help').hidden=raising;$('#creation-pinch-hint').hidden=!raising;
  $('#creation-help').textContent=objective.textContent;debugUpdate();
 }
 function raiseStages(){return game.state.phase==='room-raise'?[2,3,4]:{window:[9,10,11],lamp:[16,17,18],bed:[22,23,23],computer:[29,29,30],door:[35,35,36]}[game.state.item];}
 function updateRaiseArt(){const p=game.progress,stages=raiseStages();setArt(stages[p>=1?2:p>=.6?1:0]);renderer.raise(stages,p);}
 function inside(p,target){const el=board.querySelector(`[data-target="${target}"]`);if(!el)return false;const r=root.getBoundingClientRect(),b=el.getBoundingClientRect();return p.x*r.width+r.left>=b.left&&p.x*r.width+r.left<=b.right&&p.y*r.height+r.top>=b.top&&p.y*r.height+r.top<=b.bottom;}
 function begin(p,element,owner='mouse'){
  if(!alive||!started||drag||!element||!root.contains(element))return;
  if(owner==='hand')element.dataset.handGrabbed='true';
  drag={owner,kind:element.dataset.drag,start:{...p},point:{...p},element,time:performance.now()};
  if(drag.kind.startsWith('star')){const cover=document.createElement('div');cover.className='collected-star '+(drag.kind==='star1'?'star-one':'star-two');board.append(cover);drag.cover=cover;element.style.zIndex='5';}
  if(drag.kind==='place'){
   const ghost=document.createElement('span');ghost.className='creation-drag-ghost';
   if(!game.state.roomCreated)ghost.innerHTML='<svg viewBox="405 710 100 110"><image href="/assets/creation/4_1.JPG" width="1672" height="941"/></svg>';
   else if(game.state.built<4)renderer.icon(objects[game.state.built],ghost);
   else ghost.innerHTML='<svg viewBox="2770 1650 250 200"><image href="/assets/creation/4_4.JPG" width="3838" height="2160"/></svg>';
   element.append(ghost);drag.ghost=ghost;
  }
  if(drag.kind==='quilt')quiltProgress(1);
  if(drag.kind==='plug'){const ghost=document.createElement('span');ghost.className='creation-drag-ghost plug-ghost';ghost.innerHTML='<svg viewBox="945 490 120 95"><image href="/assets/creation/4_26.png" width="1672" height="941"/></svg>';element.append(ghost);drag.ghost=ghost;const cover=document.createElement('span');cover.className='plug-origin-cover';cover.innerHTML='<svg viewBox="945 490 120 95"><image href="/assets/creation/4_27.png" width="1672" height="941"/></svg>';board.append(cover);drag.cover=cover;element.style.zIndex='5';if(owner==='hand'){drag.mode='plug-dwell';drag.dropTarget='socket';}}
  if(drag.kind==='save'){const ghost=document.createElement('span');ghost.className='creation-drag-ghost drag-label';ghost.textContent=drag.kind==='plug'?'PLUG':'SAVE FILE: ME';element.append(ghost);drag.ghost=ghost;}

  if(drag.kind==='lamp'){
   const current=drag;
   const tick=time=>{if(drag!==current)return;const progress=Math.min(1,(time-current.time)/2000);current.element.textContent=`HOLD TO LIGHT · ${Math.round(progress*100)}%`;if(progress===1){recovered(14);return;}holdFrame=requestAnimationFrame(tick);};holdFrame=requestAnimationFrame(tick);
  }
 }
 function move(p){
  if(!drag)return;drag.point=p;
  const r=root.getBoundingClientRect(),scale=r.width/1672;
  if(drag.kind==='raise'){
   game.raise(drag.start.y-p.y,game.state.phase==='raise'&&['bed','computer','door'].includes(game.state.item)?.10:.18);$('#build-progress').textContent=Math.round(game.progress*100)+'%';
   updateRaiseArt();return;
  }
  if(drag.kind==='quilt')return;
  drag.element.style.transform=`translate(${(p.x-drag.start.x)*r.width/scale}px,${(p.y-drag.start.y)*r.height/scale}px)`;
 }
 function end(p,cancelled=false){
  if(!drag)return;clearHits();const current=drag;drag=null;cancelAnimationFrame(holdFrame);delete current.element.dataset.handGrabbed;current.element.style.transform='';current.element.style.zIndex='';current.ghost?.remove();
  if(current.kind==='raise'){
   const previousItem=game.state.item,roomRaise=game.state.phase==='room-raise';const installed=game.release(cancelled);if(installed)
   if(installed&&!roomRaise&&['bed','computer'].includes(previousItem)){
    const from=previousItem==='bed'?24:31,to=previousItem==='bed'?25:32;setArt(from);
    settleTimer=setTimeout(()=>{if(alive&&game.state.phase==='choose'&&root.dataset.creationFrame===String(from))setArt(to);},900);
   }
   if(alive&&['raise','room-raise'].includes(game.state.phase)){$('#build-progress').textContent='0%';updateRaiseArt();}return;
  }
  if(current.kind==='plug')current.cover?.remove();
  if(cancelled){current.cover?.remove();if(current.kind==='quilt')quiltProgress(0);return;}
  if(current.kind.startsWith('star')&&inside(p,'window')){current.element.remove();game.stars++;if(game.stars===2)recovered(7);}
  if(current.kind.startsWith('star')&&current.element.isConnected)current.cover?.remove();
  if(current.kind==='quilt'&&current.start.y-p.y>.12)recovered(21);
  if(current.kind==='plug'&&inside(p,'socket')){game.connected=true;animateCode('connected');board.querySelector('.creation-art').outerHTML=asset(27);current.element.remove();$('.computer-power').disabled=false;clearHits();$('#creation-objective').textContent='Power connected. Dwell on POWER for 1.5 s to start.';}
  if(current.kind==='save'&&inside(p,'slot')){animateCode('recovered');board.innerHTML=asset(34);const b=document.createElement('button');b.className='creation-return creation-door-return';b.textContent='RETURN TO BUILD';b.onclick=()=>game.solve();board.append(b);}
  if(current.kind==='place'&&inside(p,'place'))game.placed();
 }
 function selectPlug(){if(game.connected||plugSelected)return;plugSelected=true;$('.plug-drag').classList.add('is-flashing');$('.socket-control').disabled=false;clearHits();animateCode('plug-selected');$('#creation-help').textContent='Plug selected. Dwell on the power strip for 1.5 s to connect.';}
 function connectPlug(){if(!plugSelected||game.connected)return;game.connected=true;animateCode('connected');setArt(27);$('.plug-drag')?.remove();const socket=$('.socket-control');socket.classList.add('connection-flash');socket.disabled=true;$('.computer-power').disabled=false;clearHits();$('#creation-help').textContent='Connected. Dwell on POWER for 1.5 s to start.';}
 function quiltProgress(value){const el=board.querySelector('.quilt-dwell-progress');if(!el)return;const percent=Math.round(value*100);if(el.getAttribute('aria-valuenow')!==String(percent)){el.setAttribute('aria-valuenow',String(percent));el.textContent=percent+'%';}}
 function resetDwell(){quiltProgress(drag?.kind==='quilt'?1:0);dwell.reset();dropDwell.reset();dropAnchor=null;dwellRing.hidden=true;}
 function ring(p,progress,label,target){
  dwellRing.hidden=false;dwellRing.style.left=(Math.min(.94,p.x)+(p.x>.88?-.05:.025))*100+'%';dwellRing.style.top=Math.min(.93,p.y)*100+'%';dwellRing.dataset.dwellTarget=target;dwellRing.dataset.progress=progress.toFixed(3);dwellRing.querySelector('.dwell-progress').style.strokeDasharray=`${progress*100} 100`;const text=dwellRing.querySelector('text');if(text.textContent!==label)text.textContent=label;
 }
 function updateDwell(p){
  if(drag?.owner==='hand'&&['dwell','plug-dwell'].includes(drag.mode)){
   const zone=(drag.mode==='plug-dwell'||!p.pinching)&&inside(p,drag.dropTarget||'place')?board.querySelector(`[data-target="${drag.dropTarget||'place'}"]`):null;
   if(!zone){dropDwell.reset();dropAnchor=null;dwellRing.hidden=true;return;}
   if(!dropAnchor||Math.hypot(p.x-dropAnchor.x,p.y-dropAnchor.y)>.04){dropDwell.reset();dropAnchor={...p};}
   const result=dropDwell.update(zone,performance.now());ring(p,result.progress,drag.dropTarget==='socket'?'CONNECT':drag.dropTarget==='slot'?'INSTALL':drag.dropTarget==='window'?'PLACE':'DROP','drop');
   if(result.activate){resetDwell();end(p,false);}return;
  }
  const target=!p.pinching&&!drag&&!handSelection?hit(p):null,eligible=target?.classList.contains('creation-return')||target?.classList.contains('creation-run')||target?.classList.contains('computer-power')||target?.classList.contains('socket-control')||target?.dataset.drag==='plug'||['lamp','quilt','save'].includes(target?.dataset.drag)||target?.dataset.object||target?.dataset.drag==='place'||target?.dataset.drag?.startsWith('star')?target:null;
  const result=dwell.update(eligible,performance.now());quiltProgress(drag?.kind==='quilt'?1:eligible?.dataset.drag==='quilt'?result.progress:0);dwellRing.hidden=!eligible;
  if(eligible){ring(p,result.progress,'1.5s',eligible.dataset.object||'pickup');if(result.activate){if(eligible.dataset.drag==='lamp'){resetDwell();recovered(14);}else if(eligible.dataset.drag==='quilt'){resetDwell();begin(p,eligible,'hand');if(drag)drag.mode='quilt-dwell';}else if(['place','save'].includes(eligible.dataset.drag)||eligible.dataset.drag?.startsWith('star')){resetDwell();begin(p,eligible,'hand');if(drag){drag.mode='dwell';drag.dropTarget=drag.kind==='save'?'slot':drag.kind.startsWith('star')?'window':'place';}}else eligible.click();}}
 }

 function handEvent(type,p){
  if(!alive||!started||inputMode!=='hands'||!root.querySelector('.avatar-setup').hidden)return;lastHandPoint=p;cursor.hidden=Boolean(p.cancelled);cursor.style.left=p.x*100+'%';cursor.style.top=p.y*100+'%';
  if(type==='grab'){
   resetDwell();if(drag)return;
   const previous=lastOpenPoint&&Math.hypot(p.x-lastOpenPoint.x,p.y-lastOpenPoint.y)<.08?hit(lastOpenPoint):null;const el=hit(p)||previous;handSelection=null;
   if(el?.dataset.drag&&!['place','lamp','quilt','save','plug'].includes(el.dataset.drag)&&!el.dataset.drag.startsWith('star'))begin(p,el,'hand');
   else if(el&&!el.classList.contains('creation-return')&&!el.classList.contains('creation-run')&&!el.classList.contains('computer-power')&&!el.classList.contains('socket-control')&&!el.dataset.object&&!el.dataset.drag)handSelection={element:el,start:{...p},distance:0};
  }
  if(type==='move'){
   if(!p.pinching)lastOpenPoint={...p};updateDwell(p);
   if(drag?.owner==='hand'){move(p);if(drag?.mode==='quilt-dwell'&&drag.start.y-p.y>.12)end(p,false);}
   if(handSelection)handSelection.distance=Math.max(handSelection.distance,Math.hypot(p.x-handSelection.start.x,p.y-handSelection.start.y));
  }
  if(type==='release'){
   if(p.cancelled)resetDwell();const selection=handSelection;handSelection=null;
   if(drag?.owner==='hand'&&(!['dwell','quilt-dwell','plug-dwell'].includes(drag.mode)||p.cancelled))end(p,p.cancelled);
   else if(selection&&!p.cancelled&&selection.distance<=.12&&selection.element.isConnected&&!selection.element.disabled)selection.element.click();
  }
  // Release owns selection. Ignore the recognizer's legacy click event to
  // prevent a second action against the next scene after an element changes.
  cursor.classList.toggle('pinching',Boolean(drag)||Boolean(handSelection));debugUpdate();
 }
 const tracker=createHandTracker($('#hand-camera'),handEvent,message=>{if(alive){$('#hand-status').textContent=message;const cameraStatus=document.getElementById('camera-status');if(cameraStatus)cameraStatus.textContent=message;$('#hand-start').textContent=message.startsWith('Loading')?'LOADING…':message.startsWith('Unable')||message.startsWith('Tracking temporarily')?'RETRY HANDS':'HANDS ENABLED';debugUpdate();if(message.startsWith('Place')||message.startsWith('Unable')||message.startsWith('Tracking temporarily'))cursor.hidden=true;}},state=>{handState=state;if(!state.detected){lastOpenPoint=null;resetDwell();if(drag?.owner==='hand')end(drag.point,true);}if(alive){cursor.classList.toggle('pinching',state.pinching);debugUpdate();}});
 const pointerDown=e=>{if(inputMode!=='mouse'||e.button!==0)return;const el=e.target.closest('[data-drag]');if(el?.dataset.drag==='plug')return;if(drag?.owner==='hand')return;if(!el)return;begin(point(e.clientX,e.clientY),el);if(drag){el.setPointerCapture(e.pointerId);e.preventDefault();}};
 const pointerMove=e=>{if(drag?.owner==='mouse')move(point(e.clientX,e.clientY));};
 const pointerUp=e=>{if(drag?.owner==='mouse')end(point(e.clientX,e.clientY),e.type==='pointercancel');};
 root.addEventListener('pointerdown',pointerDown);root.addEventListener('pointermove',pointerMove);root.addEventListener('pointerup',pointerUp);root.addEventListener('pointercancel',pointerUp);
 const gateMouse=e=>{const button=e.target.closest('button');if(inputMode==='hands'&&e.isTrusted&&button&&(button.closest('.creation-board,.creation-inventory')||button.matches('[data-drag],.creation-run'))){e.preventDefault();e.stopImmediatePropagation();}};root.addEventListener('click',gateMouse,true);
 $('#creation-input-mode').onclick=()=>{if(drag)end(drag.point,true);resetDwell();handSelection=null;inputMode=inputMode==='hands'?'mouse':'hands';$('#creation-input-mode').textContent=inputMode==='hands'?'SWITCH TO MOUSE':'USE HANDS';$('#creation-mode-status').textContent=inputMode==='hands'?'HAND MODE · ENABLE HANDS TO BUILD':'MOUSE MODE';if(inputMode==='mouse'){tracker.stop(true);cursor.hidden=true;}else tracker.start();};
 $('#hand-start').onclick=()=>{inputMode='hands';$('#creation-input-mode').textContent='SWITCH TO MOUSE';$('#creation-mode-status').textContent='HAND MODE';if(tracker.running)return;tracker.start();};
 $('#hand-stop').onclick=()=>{resetDwell();tracker.stop(true);$('#hand-camera').hidden=true;cursor.hidden=true;$('#hand-status').textContent='Camera stopped. Enable hands or switch to mouse mode.';$('#hand-start').textContent='ENABLE HANDS';debugUpdate();};

 async function returnToPrologue(){
  if(!alive||returning)return;returning=true;root.classList.add('creation-returning');
  returnAnimation=root.animate([{opacity:1,transform:'scale(1)'},{opacity:0,transform:'scale(.97)'}],{duration:matchMedia('(prefers-reduced-motion: reduce)').matches?1:650,easing:'ease-in',fill:'forwards'});
  try{await returnAnimation.finished;if(alive&&returning)finish();}catch{}
 }
 function showFinalRoom(){
  root.classList.add('creation-real-room');board.innerHTML='<img class="creation-real-image" src="/assets/creation/4_41.png" alt="Real room">';if(!intro.active)returnToPrologue();
 }
 async function transition(){
  const token=++transitionEpoch,resumeHands=tracker.running&&inputMode==='hands';root.classList.add('creation-transition');$('#hand-start').disabled=true;cursor.hidden=true;await tracker.stop(false);
  const current=()=>alive&&token===transitionEpoch;
  const resume=()=>{if(current()&&resumeHands&&inputMode==='hands'&&input.stream?.getVideoTracks().some(t=>t.readyState==='live'))tracker.start();};
  if(!current())return;
  const result=await runVideo.play('room',false,root);
  if(!current()||result==='cancelled')return;
  if(result==='ended'){game.commit('finished');}
  else {game.commit('complete');$('#creation-objective').textContent='Animation could not play. Dwell on RUN to retry.';resume();}
 }
 const disposeAvatar=mountAvatar(root,{generationAllowed:true,onContinue:()=>{started=true;$('.creation-controls').hidden=false;render();window.dispatchEvent(new Event('resize'));if(!intro.active&&game.state.phase==='finished')returnToPrologue();}});
 $('#creation-photo').onclick=()=>{resetDwell();if(drag)end(drag.point,true);handSelection=null;cursor.hidden=true;root.querySelector('.avatar-setup').hidden=false;root.querySelector('#avatar-change').click();};
 root.querySelector('.avatar-setup').hidden=true;
 loader.play(4,['/assets/creation/4_1.JPG']).then(ok=>ok&&alive?intro.play(4,async()=>{const enabled=await disposeAvatar.availability;if(!alive)return;if(enabled){root.querySelector('.avatar-setup').hidden=false;}else{root.querySelector('#avatar-default').click();root.querySelector('#avatar-continue').click();}},()=>prepareImage('/assets/creation/4_1.JPG')):false).then(ok=>{if(!ok||!alive||!started)return;if(game.state.phase==='transition')transition();else if(game.state.phase==='finished')returnToPrologue();}).catch(()=>{if(alive){root.querySelector('#avatar-default').click();root.querySelector('#avatar-continue').click();}});
 renderer.icon('build',$('.creation-fixed-build'));renderer.icon('code',$('.creation-fixed-code'));
 return ()=>{alive=false;loader.dispose();intro.dispose();returnAnimation?.cancel();runVideo.dispose();codeAnimation.stop();renderer.dispose();hitObserver.disconnect();window.removeEventListener('resize',clearHits);clearTimeout(settleTimer);transitionEpoch++;cancelAnimationFrame(holdFrame);tracker.stop();disposeAvatar();controls.remove();debugObserver.disconnect();debug.remove();window.dispatchEvent(new Event('resize'));root.classList.remove('creation-scene','creation-transition','creation-real-room','creation-door-lift','creation-easy-lift','creation-returning');root.removeEventListener('click',gateMouse,true);root.removeEventListener('pointerdown',pointerDown);root.removeEventListener('pointermove',pointerMove);root.removeEventListener('pointerup',pointerUp);root.removeEventListener('pointercancel',pointerUp);};
}
