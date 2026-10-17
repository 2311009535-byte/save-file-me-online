import {createDiaryTurn} from './retry-page-turn.js?v=diary3';
import {createSwitchBook} from './retry-switch-book.js';
import {gameAudio} from './game-audio.js';
import {createChapterLoading} from './chapter-loading.js';
import {createChapterIntro} from './chapter-intro.js';
import {createVictoryFrame} from './retry-victory-frame.js?v=duo8';
import {deskDiary,warningPaper,diaryDrag,bossPaper} from './retry-paper.js?v=diary2';
import {prepareImage,warmImages} from './image-cache.js';
import {RETRY_KEY,normalizeRetry,settleRetryRound,retryRound,joinPartner,resetRetry} from './retry-state.js';
import {createRetryVideo} from './retry-video.js';
import {createVideoTransitions} from './wonder-videos.js';
import {createRetryActions} from './retry-actions.js';
export {resetRetry};
const files=['3_1.png','3_2.png','3_3.png','3_4.png','3_5.png','3_6.png','3_7.JPG','3_8.png','3_9.JPG','3_10.png','3_11.png','3_12.png','3_13.jpg','3_14.png','3_15.png','3_16.PNG','3_17.PNG','3_18.PNG'];
const url=f=>'/assets/retry/'+f;
export function mountRetry({imageScene,hotspot,onExit,onVictory}){
 const $=id=>document.getElementById(id),stage=$('stage'),visual=$('visual'),videos=createRetryVideo(),victoryFrame=createVictoryFrame();let data;try{data=normalizeRetry(JSON.parse(localStorage.getItem(RETRY_KEY)));}catch{data=normalizeRetry(null);}
 const intro=createChapterIntro(stage),loader=createChapterLoading(stage);
 const partnerVideo=createVideoTransitions({partner:{enter:{src:'/assets/retry/videos/player2-join.mp4',available:true},return:{available:false}}},'retry-partner-overlay');
 const diaryVideo=createVideoTransitions({diary:{enter:{src:'/assets/retry/videos/diary-enter.mp4',available:true},return:{available:false}}},'retry-diary-video');
 let alive=true,busy=true,generation=0,viewGeneration=0,loadingFrame=0,diaryTurn=null,switchBook=null;const timers=new Map(),animations=new Set();
 const persist=()=>{gameAudio.setRetry({joined:data.joined,view:data.view,won:data.won});try{localStorage.setItem(RETRY_KEY,JSON.stringify(data));}catch{}$('retry-progress').textContent=`第三章：失败 ${data.failures}/3 · player2 ${data.joined?'已加入':'未加入'} · ${data.won?'已获胜':'未获胜'} · 日记 ${data.page+1}/4`;stage.dataset.retryFailures=String(data.failures);stage.dataset.retryJoined=String(data.joined);stage.dataset.retryWon=String(data.won);};
 function pause(ms){return new Promise(resolve=>{const timer=setTimeout(()=>{timers.delete(timer);resolve(alive);},ms);timers.set(timer,resolve);});}
 const actions=createRetryActions({visual,show,onCue:name=>name==='stopCombat'?gameAudio.stopCombat():gameAudio.effect(name),hold:ms=>animate(visual.querySelector('.scene-image'),[{opacity:1},{opacity:1}],{duration:ms})});
 function cancel(){loader.dispose();intro.dispose();diaryTurn?.dispose();diaryTurn=null;switchBook?.dispose();switchBook=null;generation++;actions.dispose();victoryFrame.dispose();partnerVideo.dispose();diaryVideo.dispose();for(const [timer,resolve] of timers){clearTimeout(timer);resolve(false);}timers.clear();cancelAnimationFrame(loadingFrame);animations.forEach(a=>a.cancel());animations.clear();videos.dispose();}
 async function animate(element,frames,options){if(!alive)return false;const a=element.animate(frames,options);animations.add(a);try{await a.finished;return alive;}catch{return false;}finally{animations.delete(a);}}
 function lock(){busy=true;$('hotspots').querySelectorAll('button').forEach(b=>b.disabled=true);visual.querySelectorAll('.retry-card-art').forEach(c=>c.classList.remove('is-selected'));}
 function corner(){const diary=data.view==='diary';$('back').textContent=diary?'BACK':'SAVE ROOM';$('back').setAttribute('aria-label',diary?'BACK':'SAVE ROOM');$('back').hidden=!diary;$('back').onclick=()=>{if(diary&&!busy){gameAudio.effect('page');data.view='switch';persist();draw();}};}
 function button(id,rect,label,callback,disabled=false){hotspot(id,rect,label,disabled,()=>{if(!alive||busy||disabled)return;callback();});}
 async function show(f){const version=++viewGeneration;if(f==='3_14.png'){const frame=await videos.finalFrame();if(!alive||version!==viewGeneration)return false;if(!frame){overlayText('桌面动画未能加载，请重新进入第三章。');return false;}imageScene('retry/'+f,f,1672,941);const im=visual.querySelector('.scene-image');im.src=frame;await im.decode();if(!alive||version!==viewGeneration)return false;stage.dataset.retryFrame='switch-blank';return true;}if(f==='3_12.png'){const frame=await victoryFrame.get(visual);if(!alive||version!==viewGeneration)return false;if(frame){imageScene('retry/'+f,f,1672,941);visual.replaceChildren(frame);stage.dataset.retryFrame=f;return true;}}await prepareImage(url(f));if(!alive||version!==viewGeneration)return false;imageScene('retry/'+f,f,1672,941);stage.dataset.retryFrame=f;return true;}
 function overlayText(text,cls='retry-action'){const div=document.createElement('div');div.className=cls;div.textContent=text;visual.append(div);return div;}
 function drawHP(value){const bar=document.createElement('div');bar.className='retry-hp';bar.style.setProperty('--hp',value);bar.append(document.createElement('i'));visual.append(bar);return bar;}
 function patchAttempt(switchScreen=false){// Only the printed attempt label is patched; originals stay intact.
 const strip=document.createElement('div');strip.className=switchScreen?'retry-switch-attempt':'retry-attempt-patch';strip.textContent=switchScreen?'04':'attempt 04';visual.append(strip);
 }
 function retryButton(rect,id,callback){button(id,rect,'RETRY',callback);const b=$(id);b.classList.add('retry-paper-button');b.textContent='RETRY';}
 async function draw(){
 if(!alive)return;diaryTurn?.dispose();diaryTurn=null;switchBook?.dispose();switchBook=null;delete stage.dataset.retryBook;lock();const version=++generation;stage.dataset.retryView=data.view;delete stage.dataset.retryAction;delete stage.dataset.retryActionEnded;$('hotspots').replaceChildren();corner();persist();
 let f=data.view==='battle'?(data.joined?'3_9.JPG':'3_1.png'):data.view==='defeat'?'3_6.png':data.view==='discovered'?'3_6.png':data.view==='invite'?'3_8.png':data.view==='victory'?'3_12.png':data.view==='switch'?'3_14.png':['3_15.png','3_16.PNG','3_17.PNG','3_18.PNG'][data.page];
 if(!await show(f)||!alive||version!==generation)return;
 if(data.view==='battle'){
  const cards=data.joined?[[64.3,74.3,10.4,22.5],[75.2,74.5,10.6,22.7],[86.3,74.5,10.7,22.7]]:[[47.5,73.5,11.5,25.5],[61.5,73.5,11.5,25.5],[75,73.5,11.5,25.5]];
  const outlines=[
   [[8,8],[23,0],[36,5],[66,3],[85,5],[91,12],[94,42],[100,84],[92,99],[62,98],[30,96],[3,94],[0,86],[6,53],[6,22]],
   [[6,10],[23,1],[37,6],[70,3],[90,5],[96,12],[94,38],[100,87],[86,100],[32,99],[3,94],[0,85],[5,45]],
   [[6,11],[25,0],[38,6],[66,3],[85,5],[92,13],[95,42],[100,86],[89,100],[30,98],[2,94],[0,83],[5,41]]
  ];
  ['ATTACK','DEFEND','HEAL'].forEach((name,i)=>{
   const rect=cards[i],outline=outlines[i],id='retry-'+name.toLowerCase();button(id,rect,name,()=>battle(name));
   const b=$(id);b.classList.add('retry-card');b.style.clipPath='polygon('+outline.map(([x,y])=>`${x}% ${y}%`).join(',')+')';
   // Sample only this card from the existing art. The background and other cards stay untouched.
   const im=visual.querySelector('.scene-image'),c=document.createElement('canvas'),[x,y,w,h]=rect;
   c.width=Math.round(im.naturalWidth*w/100);c.height=Math.round(im.naturalHeight*h/100);c.className='retry-card-art';c.dataset.card=name.toLowerCase();c.setAttribute('aria-hidden','true');
   Object.assign(c.style,{left:x+'%',top:y+'%',width:w+'%',height:h+'%'});
   const ctx=c.getContext('2d');ctx.beginPath();outline.forEach(([px,py],j)=>ctx[j?'lineTo':'moveTo'](px*c.width/100,py*c.height/100));ctx.closePath();ctx.clip();ctx.drawImage(im,im.naturalWidth*x/100,im.naturalHeight*y/100,im.naturalWidth*w/100,im.naturalHeight*h/100,0,0,c.width,c.height);visual.append(c);
   const select=()=>{if(busy||b.disabled)return;visual.querySelectorAll('.retry-card-art').forEach(other=>other.classList.toggle('is-selected',other===c));};
   const clear=()=>c.classList.remove('is-selected');b.onmouseenter=select;b.onmouseleave=clear;b.onfocus=select;b.onblur=clear;
  });
 }else if(data.view==='defeat')button('retry-again',[43.3,55.8,13.4,6.6],'RETRY',()=>retry());
 else if(data.view==='discovered')button('retry-again',[43.3,55.8,13.4,6.6],'RETRY',()=>{data=retryRound(data);persist();draw();});
 else if(data.view==='invite')button('retry-invite',[43.3,55.8,13.4,6.6],'YES',()=>invitePartner());
 else if(data.view==='victory'){button('retry-continue',[40.5,48.5,16.5,6.5],'CONTINUE',()=>toSwitch());}
 else if(data.view==='switch'){
  patchAttempt(true);
  stage.dataset.retryBook='blank';if(!await pause(250)||!alive||version!==generation)return;
  switchBook=createSwitchBook(visual);stage.dataset.retryBook='turning';gameAudio.effect('page');
  if(!await switchBook.play()||!alive||version!==generation)return;
  switchBook.dispose();switchBook=null;stage.dataset.retryBook='ready';
  button('retry-diary',[50,44,48,52],'DIARY',()=>openDiary());
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 1672 941');svg.classList.add('retry-diary-glow');svg.innerHTML='<defs><filter id="diary-white-halo" x="-25%" y="-40%" width="150%" height="180%"><feGaussianBlur stdDeviation="10"/></filter></defs><path d="M984 445 L1292 477 L1618 518 L1616 835 L1222 771 L846 738 Z"/>';visual.append(svg);
 }else if(data.view==='diary'){diaryTurn=createDiaryTurn(visual,delta=>{if(busy||!alive)return;data.page+=delta;persist();draw();},data.page);
  button('retry-prev',[5.5,89,10,6],'PREV',()=>{gameAudio.effect('page');diaryTurn?.turn(-1);},data.page===0);
  button('retry-next',[84,89,10,6],'NEXT',()=>{gameAudio.effect('page');diaryTurn?.turn(1);},data.page===3);
  if(data.page===3){
   button('retry-painting',[54,20,34,48],'RETURN TO SAVE ROOM',()=>{if(data.won)onExit();});
   $('retry-painting').style.clipPath='polygon(8% 8%,24% 0,57% 15%,86% 3%,93% 44%,100% 93%,73% 94%,58% 84%,32% 98%,0 96%,3% 47%)';
   const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 1672 941');svg.classList.add('retry-painting-glow');
   svg.innerHTML='<path d="M925 605 L928 420 L933 237 L1048 204 L1055 398 Q1100 394 1150 435 L1160 284 L1185 319 L1180 420 Q1200 377 1255 386 L1298 223 L1340 268 L1407 220 L1425 466 L1464 616 L1360 626 L1270 616 L1216 609 L1160 633 L1050 634 L970 620 Z"/>';visual.append(svg);
  }
  for(const id of ['retry-prev','retry-next']){$(id).classList.add('retry-page-button');$(id).textContent=id==='retry-prev'?'PREV':'NEXT';}
 }
 busy=false;corner();
 }
 async function openDiary(){
  if(busy||!alive||data.view!=='switch')return;gameAudio.effect('page');
  lock();const token=++generation;stage.dataset.retryView='diary-transition';$('hotspots').replaceChildren();visual.querySelector('.retry-diary-glow')?.remove();
  const result=await diaryVideo.play('diary',false,stage);
  if(!alive||token!==generation||result==='cancelled')return;
  if(result==='ended'){data.view='diary';data.page=1;persist();}
  await draw();diaryVideo.cancel();
 }
 async function invitePartner(){
  if(busy||!alive||data.view!=='invite'||data.failures!==3)return;
  lock();const token=++generation;stage.dataset.retryView='partner-transition';
  if(!await show('3_1.png')||!alive||token!==generation)return;
  const result=await partnerVideo.play('partner',false,stage);
  if(!alive||token!==generation||result==='cancelled')return;
  if(result==='ended'){data=joinPartner(data);persist();gameAudio.effect('join');}
  await draw();partnerVideo.cancel();
 }
 // Persist before playback: refresh/cancellation cannot display the warning twice.
 async function retry(){
  if(busy||data.view!=='defeat')return;
  const warning=data.failures===1&&!data.warningSeen;
  data=retryRound(data);data.warningSeen=data.warningSeen||warning;persist();
  if(warning){lock();$('hotspots').replaceChildren();const token=++generation;stage.dataset.retryView='warning';
   if(!await show('3_1.png')||!await warningPaper(visual,animate,pause)||!alive||token!==generation)return;
  }
  await draw();
 }
 async function battle(action){
 if(busy||!alive||data.view!=='battle')return;gameAudio.effect('card');lock();const token=++generation;stage.dataset.retryAction=action;stage.dataset.retryView='action';persist();
 const current=()=>alive&&token===generation;
 stage.dataset.retryPlayerHp='1';stage.dataset.retryBossHp='1';
 const play=async(group,onEnded)=>{
  stage.dataset.retryGroup=group;
  return await actions.play(group,{onEnded:async()=>{if(current()){await onEnded();if(current())stage.dataset.retryActionEnded=group;}}})==='ended'&&current();
 };
 try{
  if(data.joined){
   if(!await play('duoAttack',()=>{stage.dataset.retryBossHp='0';}))return;
  }else{
   if(action==='ATTACK'){
    if(!await play('playerAttack',()=>{stage.dataset.retryBossHp='.65';}))return;
   }else{
    // DEFEND/HEAL retain their code feedback until dedicated art is available.
    stage.dataset.retryGroup='playerFeedback';
    if(!await animate(visual.querySelector('.scene-image'),[{opacity:1},{opacity:1}],{duration:450})||!current())return;
    const feedback=overlayText(action==='DEFEND'?'DEFEND':'HEAL +');feedback.classList.add('retry-'+action.toLowerCase());
    if(!await animate(feedback,[{opacity:0,transform:'translateY(10px) scale(.9)'},{opacity:1,transform:'translateY(0) scale(1)',offset:.2},{opacity:1,offset:.8},{opacity:0,transform:'translateY(-8px)'}],{duration:1300})||!current())return;
   }
   stage.dataset.retryGroup='bossWarning';if(!await bossPaper(visual,animate,pause)||!current())return;
   if(!await play('bossAttack',async()=>{
    // Both real clips and demos must finish before HP reaches zero.
    if(!await show('3_5.png')||!current())return;
    stage.dataset.retryPlayerHp='0';drawHP(0);
    await animate(visual.querySelector('.scene-image'),[{opacity:1},{opacity:1}],{duration:500});
   }))return;
  }
  if(!current())return;delete stage.dataset.retryGroup;data=settleRetryRound(data);persist();if(data.won)onVictory();await draw();
 }catch(error){console.error('Retry action failed',error);if(current())await draw();}
 }

 async function toSwitch(){
 if(busy||!data.won)return;lock();const token=++generation;stage.dataset.retryView='transition';const result=await videos.play(visual);if(!alive||token!==generation||result==='cancelled')return;
 if(result==='missing'){
  const old=visual.querySelector('.scene-image').cloneNode();old.classList.add('retry-transition-image');await prepareImage(url('3_14.png'));if(!alive||token!==generation)return;
  if(!await show('3_14.png')||!alive||token!==generation)return;visual.append(old);await animate(old,[{opacity:1},{opacity:0}],{duration:550,easing:'ease-in-out'});old.remove();
 }
 if(!alive||token!==generation)return;data.view='switch';persist();await draw();
 }
 async function load(){
 stage.classList.add('retry-scene');stage.dataset.retryView='loading';persist();corner();
 if(!alive)return;imageScene('retry/3_1.png','Retry loading',1672,941);
 const critical=[...files];
 if(!await loader.play(3,critical.map(url))||!alive)return;
 await intro.play(3,()=>draw());
 }
 function suspend(){cancel();}window.addEventListener('pagehide',suspend);if(data.won)onVictory();load();
 return()=>{alive=false;viewGeneration++;cancel();window.removeEventListener('pagehide',suspend);stage.classList.remove('retry-scene');for(const key of ['retryView','retryFailures','retryJoined','retryWon','retryAction','retryFrame','retryGroup','retryPlayerHp','retryBossHp','retryActionEnded'])delete stage.dataset[key];};
}
