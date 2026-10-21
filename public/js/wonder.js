import {windowTransitionTone} from './wonder-window-tone.js';
import {mountRoomLighting} from './wonder-room-lighting.js';
import {hideRoomMeteor} from './wonder-room-sky.js';
import {gameAudio} from './game-audio.js';
import {createWindowReturnHold} from './wonder-return-state.js';
import {createChapterLoading} from './chapter-loading.js';
import {createChapterIntro} from './chapter-intro.js';
import {createChapterHints} from './chapter-hints.js';
import {prepareImage,warmImages} from './image-cache.js';
import {showSwordChange,showSwordGlow} from './wonder-sword.js';
import {createRunner,jump,step} from './platform.js';
import {shapeHotspot,addContourLights} from './wonder-effects.js';
import {createVideoTransitions} from './wonder-videos.js';
const KEY='save-file-me:wonder:v1';
const ids=['window','box','map','note'];
export function resetWonder(){try{localStorage.removeItem(KEY);}catch{}}
export function mountWonder({showLoading=false,imageScene,hotspot,scenePoint,finish,onExit}){
 let data;try{data=JSON.parse(localStorage.getItem(KEY));}catch{}
 data={done:Object.fromEntries(ids.map(id=>[id,data?.done?.[id]===true])),view:ids.includes(data?.view)||['room','computer','game','win'].includes(data?.view)?data.view:'room',level:Number.isInteger(data?.level)?Math.min(4,Math.max(0,data.level)):0};
 if(['computer','game','win'].includes(data.view)&&!ids.every(id=>data.done[id]))data.view='room';
 let alive=true,raf=0,runner=null,last=0,meteorShown=false,swordChanged=false,busy=false,motionToken=0,drawVersion=0;
 const animations=new Set();let transitionOverlay=null,monitorPowered=ids.every(id=>data.done[id]),jumpHeld=false;
 let disposeRoomLight=null,shownRoom=null;
 const videos=createVideoTransitions();
 const $=id=>document.getElementById(id),intro=createChapterIntro($('stage')),hints=createChapterHints($('stage'));
 const loader=createChapterLoading($('stage'));
 const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(data));}catch{}};
 function jumpWithSound(){const was=runner?.grounded;jump(runner);}
 function clear(){disposeRoomLight?.();disposeRoomLight=null;cancelAnimationFrame(raf);$('hotspots').replaceChildren();}
 function mark(id){data.done[id]=true;persist();}
 function glow(id){$(id)?.classList.add('wonder-target');}
 function cancelMotion(){loader.dispose();intro.cancel();hints.hide();videos.cancel();stopMeteor();motionToken++;animations.forEach(a=>a.cancel());animations.clear();transitionOverlay?.remove();transitionOverlay=null;$('visual').style.transform='';$('visual').style.transformOrigin='';busy=false;delete $('stage').dataset.motion;}
 async function animate(element,frames,options,token){const a=element.animate(frames,options);animations.add(a);try{await a.finished;return alive&&token===motionToken;}catch{return false;}finally{a.cancel();animations.delete(a);}}
 const targetImages={window:'window-enter-supplied-last.png',box:'1_5.png',map:'1_3.png',note:'1_7.jpg',computer:'1_15.png'};
 const profiles={window:{room:[.117,.35,.112],detail:[.5,.42,.60],turn:3},box:{room:[.932,.807,.134],detail:[.61,.54,.63],turn:-3},map:{room:[.45,.302,.198],detail:[.5,.5,.88],turn:0},note:{room:[.642,.383,.034],detail:[.64,.48,.36],turn:0},computer:{room:[.585,.485,.09],detail:[.48,.38,.45],turn:0}};
 function pose(x,y,scale,turn=0){return `translate(${x*100}%,${y*100}%) perspective(1800px) rotateY(${turn}deg) scale(${scale})`;}
 async function transition(view,back=false){
 if(busy||!alive)return;hints.hide();if(!back||view!=='window')stopMeteor();busy=true;const token=++motionToken;$('stage').dataset.motion=back?'return':'push';if(!back){$('back').textContent='BACK';$('back').setAttribute('aria-label','BACK');}
 if(view==='window'||view==='box'){
 const destination=back?'room':view;
 const previewSrc='/assets/wonder/'+(back?'1_1.png':targetImages[view]);
 try{await prepareImage(previewSrc);}catch{cancelMotion();return;}if(!alive||token!==motionToken)return;
 // No intermediate still-image playback. Missing clips use a direct, honest fallback.
 const returnEffect=back&&view==='window'?createWindowReturnHold({visual:$('visual'),meteor:meteorLayer}):null;
 const effect=view==='window'?windowTransitionTone({back,roomBrightness:ids.every(id=>data.done[id])?1:(back ? .58 : .56),returnEffect}):null;
 const result=await videos.play(view,back,$('stage'),{effect});
 if(!alive||token!==motionToken||result==='cancelled')return;
 if(back)stopMeteor();data.view=destination;meteorShown=false;swordChanged=false;draw();
 // Keep the final video frame over the already decoded destination during handoff.
 const layer=videos.layer();if(layer)await animate(layer,[{opacity:1},{opacity:0}],{duration:160,fill:'forwards'},token);
 if(!alive||token!==motionToken)return;videos.cancel();busy=false;delete $('stage').dataset.motion;persist();return;
 }
 const previewSrc='/assets/wonder/'+(back?'1_1.png':targetImages[view]);try{await prepareImage(previewSrc);}catch{cancelMotion();return;}if(!alive||token!==motionToken)return;
 const q=profiles[view],ratio=q.room[2]/q.detail[2],zoom=1/ratio;
 const roomPose=pose(q.detail[0]-q.room[0]*zoom,q.detail[1]-q.room[1]*zoom,zoom,q.turn);
 const detailPose=pose(q.room[0]-q.detail[0]*ratio,q.room[1]-q.detail[1]*ratio,ratio,-q.turn);
 const old=$('visual').cloneNode(true);old.querySelectorAll('canvas').forEach((copy,i)=>copy.getContext('2d').drawImage($('visual').querySelectorAll('canvas')[i],0,0));old.removeAttribute('id');old.classList.add('push-overlay');old.style.transformOrigin='0 0';old.style.zIndex='1';transitionOverlay=old;
 data.view=back?'room':view;if(view==='window')meteorShown=false;if(view==='box')swordChanged=false;draw();$('stage').append(old);
 const incoming=$('visual');incoming.style.transformOrigin='0 0';
 const duration=1250,easing='cubic-bezier(.45,0,.2,1)';
 const outFrames=back?[{transform:pose(0,0,1),opacity:1},{transform:detailPose,opacity:0}]:[{transform:pose(0,0,1),opacity:1},{transform:roomPose,opacity:0}];
 const inFrames=back?[{transform:roomPose,opacity:0},{transform:pose(0,0,1),opacity:1}]:[{transform:detailPose,opacity:0},{transform:pose(0,0,1),opacity:1}];
 const results=await Promise.all([animate(old,outFrames,{duration,easing,fill:'forwards'},token),animate(incoming,inFrames,{duration,easing,fill:'forwards'},token)]);
 if(!results.every(Boolean))return;old.remove();transitionOverlay=null;incoming.style.transformOrigin='';busy=false;delete $('stage').dataset.motion;persist();
 }
 function push(view){return transition(view);}
 let meteorLayer=null,meteorAnimation=null,windowActivated=false;
 function stopMeteor(){meteorAnimation?.cancel();meteorAnimation=null;meteorLayer?.remove();meteorLayer=null;meteorShown=false;windowActivated=false;}
 function meteor(){
 if(busy||meteorShown||!alive||!windowActivated||data.view!=='window')return;meteorShown=true;
 const sky=document.createElement('div');sky.className='meteor-sky';sky.innerHTML='<div class="meteor-traveler"><span class="meteor-tail"></span><span class="meteor-head"></span></div>';$('visual').append(sky);meteorLayer=sky;
 meteorAnimation=sky.firstElementChild.animate([{transform:'translate(1180px,150px)',opacity:0},{transform:'translate(1120px,190px)',opacity:1,offset:.1},{transform:'translate(810px,400px)',opacity:1,offset:.65},{transform:'translate(730px,455px)',opacity:0,offset:.78},{transform:'translate(730px,455px)',opacity:0}],{duration:1900,easing:'linear',iterations:Infinity});
 // The first completed pass earns exploration; the sky stays animated until return.
 let token=motionToken;const earn=()=>{if(alive&&meteorShown&&meteorLayer===sky&&data.view==='window'&&motionToken===token){mark('window');}};
 const a=sky.animate([{opacity:1},{opacity:1}],{duration:1500});animations.add(a);a.finished.then(earn).catch(()=>{}).finally(()=>{animations.delete(a);a.cancel();});
 }
 async function loading(){
 busy=true;$('back').textContent='SAVE ROOM';$('back').setAttribute('aria-label','SAVE ROOM');const token=++motionToken;$('stage').classList.add('wonder-scene');$('stage').dataset.motion='loading';$('stage').dataset.wonderView='loading';imageScene('wonder/1_0.png','Wonder 加载页面',1672,941);$('hotspots').replaceChildren();$('back').onclick=()=>{cancelMotion();onExit();};
 const names=['1_1.png','window-enter-supplied-last.png','1_5.png','1_6.png','1_3.png','1_4.png','1_7.jpg','1_13.png','1_15.png','1_8.png','1_9.png','1_10.png','1_11.png','1_12.png','character.png'];
 if(!await loader.play(1,names.map(f=>'/assets/wonder/'+f))||!alive||token!==motionToken)return;
 if(!await intro.play(1,()=>draw())||!alive||token!==motionToken)return;busy=false;delete $('stage').dataset.motion;
 }
 function go(view){if(busy)return;stopMeteor();if(view==='window')meteorShown=false;if(view==='box')swordChanged=false;data.view=view;persist();draw();}
 function draw(){
 gameAudio.setWonderGame(data.view==='game'||data.view==='win');
 $('visual').classList.toggle('wonder-window-dim',data.view==='window');
 const version=++drawVersion;hints.hide();
 clear();$('wonder-progress').textContent='第一章探索：'+ids.map(id=>({window:'窗户',box:'纸箱',map:'地图',note:'便签'}[id]+(data.done[id]?' ✓':' 未完成'))).join(' / ');$('stage').classList.add('wonder-scene');$('stage').dataset.wonderView=data.view;$('back').textContent=data.view==='room'?'SAVE ROOM':'BACK';
 $('back').setAttribute('aria-label',$('back').textContent);$('back').onclick=()=>{if(busy){cancelMotion();go('room');return;}if(data.view==='room')onExit();else{if(data.view==='map'||data.view==='note')mark(data.view);if(profiles[data.view])transition(data.view,true);else go('room');}};
 if(data.view==='room'){
 const ready=ids.every(id=>data.done[id]);imageScene('wonder/1_1.png','Wonder 房间',1669,942);
 addContourLights($('visual'),data.done);
 hideRoomMeteor($('visual'),data.done.window);
 const light=mountRoomLighting($('visual'),data.done,shownRoom);disposeRoomLight=light;shownRoom={...data.done};
 const powerDelay=Math.max(light.duration,$('stage').dataset.motion?(videos.layer()?160:1250):0);
 if(ready){const monitor=document.createElement('img');monitor.className='computer-light';monitor.src='/assets/wonder/1_13.png';monitor.alt='已亮起的电脑';$('visual').append(monitor);if(!monitorPowered){monitorPowered=true;gameAudio.effect('boot',{chapter:1,delay:powerDelay/1000});monitor.classList.add('is-powering-on');const power=monitor.animate([{opacity:0},{opacity:1,offset:.12},{opacity:.1,offset:.22},{opacity:1,offset:.38},{opacity:.15,offset:.48},{opacity:1,offset:.66},{opacity:.55,offset:.76},{opacity:1}],{duration:500,delay:powerDelay,easing:'steps(1,end)',fill:'both'});animations.add(power);power.finished.then(()=>{if(!alive||!monitor.isConnected)return;monitor.classList.remove('is-powering-on');const button=$('wonder-computer');if(button)button.disabled=false;}).catch(()=>{}).finally(()=>{animations.delete(power);power.cancel();});}}
 const boxes={window:[4,12,16,45],box:[86,64,14,33],map:[35,18,20,23],note:[62,34,4,8]};
 ids.forEach(id=>{hotspot('wonder-'+id,boxes[id],{window:'窗户',box:'箱子',map:'地图',note:'便签'}[id],false,()=>push(id,'wonder-'+id));shapeHotspot($('wonder-'+id),id);if(data.done[id]){$('wonder-'+id).dataset.completed='true';$('wonder-'+id).style.filter='none';}if(!data.done[id])glow('wonder-'+id);if(['box','map','note'].includes(id)){const target=$('wonder-'+id);const hint=()=>{if(!busy&&!data.done[id])hints.show(id);};target.onpointerenter=hint;target.onfocus=hint;target.onpointerleave=()=>hints.hide();target.onblur=()=>hints.hide();}});
 hotspot('wonder-computer',[54,42,9,13],ready?'电脑 · 进入游戏':'电脑 · 先探索四件物品',!ready,()=>push('computer','wonder-computer'));if(ready)glow('wonder-computer');if($('visual').querySelector('.is-powering-on'))$('wonder-computer').disabled=true;
 }else if(data.view==='window'){
 stopMeteor();
 imageScene('wonder/window-enter-supplied-last.png','窗户特写 · 视频最后一帧',1910,1084);
 if(!data.done.window)hints.show('window');
 hotspot('wonder-meteor',[18,12,64,73],'点击窗户，寻找流星',false,()=>{if(busy)return;windowActivated=true;hints.hide();meteor();});if(!data.done.window)glow('wonder-meteor');
 }else if(data.view==='box'){
 imageScene('wonder/1_5.png','箱子与剑特写',1670,942);
 if(!data.done.box)showSwordGlow($('visual'));
 if(data.done.box)showSwordChange($('visual'),{valid:()=>alive&&data.view==='box'&&drawVersion===version});
 hotspot('wonder-sword',[64,14,11,28],'点击剑',data.done.box,async()=>{if(busy||data.done.box)return;busy=true;const token=motionToken;try{const changed=await showSwordChange($('visual'),{animate:true,valid:()=>alive&&data.view==='box'&&drawVersion===version&&token===motionToken});if(changed){swordChanged=true;mark('box');$('wonder-sword').disabled=true;$('wonder-sword').classList.remove('wonder-target');}}finally{if(alive&&token===motionToken)busy=false;}});if(!data.done.box)glow('wonder-sword');
 }else if(data.view==='map'){
 if(!data.done.map)hints.show('map');
 imageScene('wonder/1_4.png','下层游戏地图',1669,942);
 const top=document.createElement('img');top.className='map-real';top.src='/assets/wonder/1_3.png';top.alt='上层现实地图';$('visual').append(top);
 const reveal=e=>{if(e.type==='pointerdown')hints.hide();const {x,y}=scenePoint(e.clientX,e.clientY);top.style.maskImage=`radial-gradient(circle 110px at ${x*100}% ${y*100}%, transparent 98%, black 100%)`;};
 $('visual').onpointermove=reveal;$('visual').onpointerdown=reveal;
 }else if(data.view==='note')imageScene('wonder/1_7.jpg','便签特写',825,466);
 else if(data.view==='computer'){
 imageScene('wonder/1_15.png','电脑特写',1672,941);hotspot('wonder-play',[32,28,29,9],'点击屏幕进入平台游戏',false,()=>go('game'));$('wonder-play').classList.add('wonder-enter-game');$('wonder-play').textContent='ENTER GAME';
 }else if(data.view==='game'){
 imageScene(`wonder/1_${8+data.level}.png`,'平台游戏场景 '+(data.level+1),1672,941);
 runner=createRunner(data.level);$('stage').dataset.level=String(data.level);
 const sprite=document.createElement('img');sprite.id='wonder-player';sprite.src='/assets/wonder/character.png';sprite.alt='自动向右前进的小人';sprite.className='wonder-player';$('visual').append(sprite);
 hotspot('wonder-jump',[40,82,20,12],'Space / 点击跳跃',false,()=>jumpWithSound());
 const status=document.createElement('div');status.id='runner-status';status.className='runner-status';$('visual').append(status);
 last=0;const tick=time=>{if(!alive||data.view!=='game')return;const dt=last?Math.min((time-last)/1000,.035):0;last=time;
 if(!document.hidden&&!$('dev-panel').hidden){raf=requestAnimationFrame(tick);return;}
 if(jumpHeld&&runner.grounded&&!intro.active)jumpWithSound();const outcome=document.hidden||intro.active?'running':step(runner,dt);sprite.style.left=(runner.x-30)+'px';sprite.style.top=(runner.y-75)+'px';sprite.dataset.x=runner.x;sprite.dataset.y=runner.y;sprite.dataset.grounded=runner.grounded;status.textContent=`${data.level+1} / 5 · HOLD SPACE / TAP TO JUMP`;
 if(outcome==='next'){data.level++;persist();draw();return;}if(outcome==='win'){go('win');return;}raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);
 }else{
 imageScene('wonder/1_12.png','Wonder 通关',1672,941);const win=document.createElement('div');win.className='wonder-win';win.innerHTML='<h1>WONDER · 通关</h1><p>好奇，让窗外的世界有了形状。</p><button id="wonder-finish">SAVE ROOM</button>';$('visual').append(win);$('wonder-finish').onclick=()=>{data.view='room';data.level=0;persist();finish();};
 }
 if(data.view!=='map'){$('visual').onpointermove=null;$('visual').onpointerdown=null;}
 }
 const key=e=>{if(!intro.active&&data.view==='game'&&e.code==='Space'&&$('dev-panel').hidden){e.preventDefault();jumpHeld=true;if(!e.repeat)jumpWithSound();}};const keyup=e=>{if(e.code==='Space')jumpHeld=false;};const blur=()=>jumpHeld=false;window.addEventListener('keyup',keyup);window.addEventListener('blur',blur);window.addEventListener('keydown',key);window.addEventListener('beforeunload',cancelMotion);window.addEventListener('pagehide',cancelMotion);persist();if(showLoading)loading();else draw();
 return ()=>{alive=false;intro.dispose();hints.dispose();cancelMotion();videos.dispose();clear();window.removeEventListener('keydown',key);window.removeEventListener('keyup',keyup);window.removeEventListener('blur',blur);window.removeEventListener('beforeunload',cancelMotion);window.removeEventListener('pagehide',cancelMotion);$('visual').onpointermove=null;$('visual').onpointerdown=null;$('visual').classList.remove('wonder-window-dim');$('stage').classList.remove('wonder-scene');delete $('stage').dataset.wonderView;delete $('stage').dataset.level;};
}
