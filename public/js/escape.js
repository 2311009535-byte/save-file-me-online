import {mountEscapeLoadingMotion} from './escape-loading-motion.js';
import {createEscapeStory} from './escape-story.js';
import {gameAudio} from './game-audio.js';
import {escapeParallaxAdapter} from './escape-parallax.js';
import {createChapterIntro} from './chapter-intro.js';
import {createChapterHints} from './chapter-hints.js';
import {prepareImage,warmImages} from './image-cache.js';
import {phoneListAsset,mountPhoneList} from './escape-phone-list.js';
import {canReceivePaper} from './escape-drop-zone.js';
import {mountExamInk} from './escape-exam-ink.js';
import {createEscapeGame} from './escape-game.js';
import {floorItems,FLOOR_VERSION} from './escape-floor.js';
import {escapeLoadingAsset} from './escape-loading-asset.js';
import {createVideoTransitions} from './wonder-videos.js';
import {mountSceneDimming,roomDarkness} from './escape-lighting.js';
import {createNativePhone,phoneCardRects} from './escape-phone-native.js';
import {cameraProfiles,cameraPose} from './escape-camera.js';
const KEY='save-file-me:escape:v1';
const files=[...(phoneListAsset?[phoneListAsset]:[]),'room-interior-mask.svg','room-clean.png','phone-clean.jpg','class-card.png','teacher-card.png',...floorItems.map(item=>item.file),'phone-item.png','exam.png','computer.png','game.png'];
export function resetEscape(){try{localStorage.removeItem(KEY);}catch{}}
export function mountEscape({imageScene,hotspot,scenePoint,finish,onExit,gameAdapter=null}){
 const intro=createChapterIntro(document.getElementById('stage')),hints=createChapterHints(document.getElementById('stage')),nativePhone=createNativePhone();
 const $=id=>document.getElementById(id);let saved;try{saved=JSON.parse(localStorage.getItem(KEY));}catch{}
 const data={messages:[0,1].map(i=>saved?.messages?.[i]===true),floorVersion:FLOOR_VERSION,papers:floorItems.map((_,i)=>saved?.floorVersion===FLOOR_VERSION?saved?.papers?.[i]===true:Array.isArray(saved?.papers)&&saved.papers.length===2&&saved.papers.every(v=>v===true)),exam:saved?.exam===true,view:['room','phone','exam','computer','game'].includes(saved?.view)?saved.view:'room'};
 data.dragTutorialDone=saved?.dragTutorialDone===true||data.papers.some(Boolean);
 const floorUnlocked=()=>data.exam&&data.messages.every(Boolean);
 const ready=()=>data.messages.every(Boolean)&&data.papers.every(Boolean)&&data.exam;
 if((data.view==='phone'&&!data.exam)||(['computer','game'].includes(data.view)&&!ready()))data.view='room';
 let alive=true,busy=true,drag=null,loadToken=0,timer=0,motionToken=0,overlay=null,gameController=null,examInk=null,hintTimer=0,phoneGesture=false,hintLastActivity=0,dragHintTimer=0,loadingFrame=0,loadingMotion=null,roomDragStarted=false,disposePhoneList=null,drawEpoch=0;const motions=new Set();const openMessages=[false,false];
 const videos=createVideoTransitions({phone:{enter:{src:'/assets/escape/videos/phone_enter.mp4',available:true},return:{available:false}},exam:{enter:{src:'/assets/escape/videos/exam_enter.mp4',available:true},return:{available:false}},computer:{enter:{src:'/assets/escape/videos/computer_enter.mp4',available:true},return:{available:false}}},'escape-video-overlay');
 const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(data));}catch{}};
 const story=createEscapeStory($('stage'),{
  canRead:key=>alive&&!busy&&!intro.active&&!$('stage').dataset.motion&&$('dev-panel').hidden&&(key!=='game'||!$('visual').querySelector('.escape-parallax')||$('visual').querySelector('.escape-parallax').dataset.ready==='true'),
  isComplete:view=>view==='exam'?data.exam:data.messages.every(Boolean),
  onReturn:view=>{if(alive&&!busy&&data.view===view)transition(view,true);}
 });
 function syncStory(){
  const key=data.view==='room'?(ready()?'computerGuide':floorUnlocked()?'papersGuide':data.exam?'phoneGuide':'examGuide'):['exam','phone','game'].includes(data.view)?data.view:null;
  story.show(key);
 }

 const add=(tag,className,parent=$('visual'))=>{const el=document.createElement(tag);el.className=className;parent.append(el);return el;};
 const img=(file,className,parent=$('visual'))=>{const el=add('img',className,parent);el.src='/assets/escape/'+file;el.draggable=false;return el;};
 function mistDefinitions(){
  const defs=add('div','escape-mist-definitions',$('hotspots'));
  const filter=(id,radius,blur,shift)=>`<filter id="${id}" x="-100%" y="-100%" width="300%" height="300%" color-interpolation-filters="sRGB"><feMorphology in="SourceAlpha" operator="dilate" radius="${radius}" result="spread"/><feGaussianBlur in="spread" stdDeviation="${blur}" result="soft"/><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="8" result="noise"><animate attributeName="baseFrequency" values=".035;.052;.041;.035" dur="7s" repeatCount="indefinite"/></feTurbulence><feDisplacementMap in="soft" in2="noise" scale="${shift}" xChannelSelector="R" yChannelSelector="G" result="cloud"/><feComposite in="cloud" in2="SourceAlpha" operator="out" result="outside"/><feFlood flood-color="#070910"/><feComposite in2="outside" operator="in"/></filter>`;
  defs.innerHTML=`<svg width="0" height="0" aria-hidden="true"><defs>${filter('escape-object-mist',8,12,19)}${filter('escape-exam-mist',.24,.36,.65)}</defs></svg>`;
 }
 function mist(file,parent,style,delay=0){const cloud=img(file,'escape-mist',parent);Object.assign(cloud.style,style,{animationDelay:delay+'s'});cloud.setAttribute('aria-hidden','true');return cloud;}
 function go(view){if(busy||!alive)return;cancelDrag();data.view=view;persist();draw();}
 function cancelDrag(){const previous=drag;drag=null;if(previous){try{previous.el.releasePointerCapture(previous.id);}catch{}previous.el.style.transform='';}}
 function stopDragTutorial(){clearTimeout(dragHintTimer);dragHintTimer=0;$('visual').querySelector('.escape-drag-tutorial')?.remove();}
 function scheduleDragTutorial(){
  stopDragTutorial();if(!alive||busy||!floorUnlocked()||drag||data.view!=='room'||roomDragStarted||data.dragTutorialDone)return;
  dragHintTimer=setTimeout(()=>{dragHintTimer=0;if(!alive||busy||!floorUnlocked()||drag||data.view!=='room'||roomDragStarted||data.dragTutorialDone)return;
   const index=data.papers.findIndex(done=>!done);if(index<0)return;const item=floorItems[index],x=item.x+item.w/2,y=item.y+item.h/2;
   const guide=add('div','escape-drag-tutorial');guide.setAttribute('aria-hidden','true');guide.innerHTML=`<svg viewBox="0 0 100 100" preserveAspectRatio="none"><path class="escape-drag-dashes" d="M${x} ${y} Q${x-1} ${y-12} 53 37"/><path class="escape-drag-arrowhead" d="M55.4 37.4 L53 37 L54.3 39.1"/></svg>`;
  },2000);
 }
 function movePaper(e){
  const p=scenePoint(e.clientX,e.clientY),item=floorItems[drag.index],dx=p.x-drag.p.x,dy=p.y-drag.p.y;
  drag.el.style.transform=`translate(${dx*parseFloat($('stage').style.width)}px,${dy*parseFloat($('stage').style.height)}px)`;
  const rect={x:item.x/100+dx,y:item.y/100+dy,w:item.w/100,h:item.h/100};
  return canReceivePaper(rect);
 }
 function bindDrag(el,kind,index){
  el.onpointerdown=e=>{if(busy||!floorUnlocked()||drag||data.papers[index]||e.button!==0)return;e.preventDefault();stopDragTutorial();roomDragStarted=true;el.style.transition='none';el.style.transform='';const p=scenePoint(e.clientX,e.clientY);drag={el,id:e.pointerId,p,index};el.setPointerCapture(e.pointerId);};
  el.onpointermove=e=>{if(!drag||drag.id!==e.pointerId||drag.el!==el)return;movePaper(e);};
  el.onpointerup=e=>{if(!drag||drag.id!==e.pointerId||drag.el!==el)return;const accepted=movePaper(e);
   if(accepted&&!data.papers[index]){cancelDrag();data.papers[index]=true;data.dragTutorialDone=true;persist();draw(true);const feedback=add('div','escape-paper-feedback');feedback.textContent=data.papers.filter(Boolean).length+' / '+floorItems.length;feedback.addEventListener('animationend',()=>feedback.remove(),{once:true});}
   else{el.style.transition='transform .24s ease-out';cancelDrag();}
  };
  el.onpointercancel=()=>{el.style.transition='transform .24s ease-out';cancelDrag();};el.onlostpointercapture=()=>{if(drag?.el===el)cancelDrag();};
 }
 function stopPhoneHints(){clearTimeout(hintTimer);hintTimer=0;$('hotspots').querySelectorAll('.escape-swipe-hint').forEach(e=>e.hidden=true);}
 function schedulePhoneHints(){
  stopPhoneHints();if(!alive||busy||phoneGesture||data.view!=='phone'||data.messages.every(Boolean))return;
  hintTimer=setTimeout(()=>{hintTimer=0;if(!alive||busy||phoneGesture||data.view!=='phone')return;$('hotspots').querySelectorAll('.escape-swipe-hint').forEach(e=>{const i=Number(e.dataset.message);e.hidden=data.messages[i]||openMessages[i];});},Math.max(0,2000-(performance.now()-hintLastActivity)));
 }
 function updateProgress(){$('escape-progress').textContent=`第二章：消息 ${data.messages.filter(Boolean).length}/2 · 地板作业 ${data.papers.filter(Boolean).length}/${floorItems.length}（含1个叠放组） · 桌上试卷 ${data.exam?'✓':'未完成'}`;}
 function messageRow(parent,index){
  const row=add('div','escape-message-row',parent);const [x,y,w,h]=phoneCardRects[index];Object.assign(row.style,{left:x*100+'%',top:y*100+'%',width:w*100+'%',height:h*100+'%'});
  const del=add('button','escape-delete',row);del.id='escape-delete-'+index;del.textContent='DELETE';del.disabled=!openMessages[index];
  del.onclick=async()=>{
   if(busy||!openMessages[index]||del.disabled)return;gameAudio.effect('dismiss');stopPhoneHints();del.disabled=true;card.disabled=true;hint.hidden=true;
   const deletion=row.animate([{opacity:1,transform:'translateX(0)'},{opacity:0,transform:'translateX(-12%)'}],{duration:220,easing:'ease-in',fill:'forwards'});motions.add(deletion);
   try{await deletion.finished;}catch{return;}finally{motions.delete(deletion);}
   if(!alive||data.view!=='phone'||!row.isConnected)return;
   data.messages[index]=true;openMessages[index]=false;persist();row.remove();deletion.cancel();hintLastActivity=performance.now();updateProgress();
   if(data.messages.every(Boolean)){hints.hide();stopPhoneHints();disposePhoneList=mountPhoneList(parent,{fade:true});}else schedulePhoneHints();
  };
  const card=add('button','escape-message',row);card.id='escape-message-'+index;card.setAttribute('aria-label',(index?'TEACHER':'CLASS GROUP')+' · swipe left');const cardImage=document.createElement('img');cardImage.src=nativePhone.card(index);cardImage.alt=index?'HOMEROOM TEACHER':'CLASS GROUP';card.append(cardImage);
  const hint=add('span','escape-swipe-hint',row);hint.hidden=true;hint.dataset.message=String(index);hint.setAttribute('aria-hidden','true');hint.innerHTML='<svg viewBox="0 0 100 24"><path d="M90 12 H10 M24 2 L10 12 L24 22"/></svg>';
  let gesture=null;const reveal=.34;
  const set=(fraction,animated=true)=>{card.style.transition=animated?'transform .2s ease-out':'none';card.style.transform=`translateX(${fraction*100}%)`;del.disabled=!openMessages[index];};set(openMessages[index]?-reveal:0);
  card.onpointerdown=e=>{if(busy||e.button!==0)return;e.preventDefault();stopPhoneHints();phoneGesture=true;gesture={id:e.pointerId,x:e.clientX,start:openMessages[index]?-reveal:0};card.setPointerCapture(e.pointerId);};
  card.onpointermove=e=>{if(!gesture||gesture.id!==e.pointerId)return;const w=row.getBoundingClientRect().width;if(Math.abs(e.clientX-gesture.x)>4)hintLastActivity=performance.now();set(Math.max(-reveal,Math.min(0,gesture.start+(e.clientX-gesture.x)/w)),false);};
  card.onpointerup=e=>{if(!gesture||gesture.id!==e.pointerId)return;const dx=(e.clientX-gesture.x)/row.getBoundingClientRect().width;openMessages[index]=gesture.start+dx<-.16;gesture=null;phoneGesture=false;set(openMessages[index]?-reveal:0);schedulePhoneHints();};
  card.onpointercancel=()=>{gesture=null;phoneGesture=false;set(openMessages[index]?-reveal:0);schedulePhoneHints();};card.onlostpointercapture=()=>{if(gesture){gesture=null;phoneGesture=false;set(openMessages[index]?-reveal:0);schedulePhoneHints();}};
 }
 function roomInputLocked(locked){$('visual').querySelectorAll('.escape-paper').forEach(p=>p.disabled=locked||!floorUnlocked());}
 function cancelMotion(){story.clear();roomInputLocked(false);videos.cancel();motionToken++;motions.forEach(a=>a.cancel());motions.clear();overlay?.remove();overlay=null;$('visual').style.transformOrigin='';delete $('stage').dataset.motion;}
 async function animate(el,frames,token){const a=el.animate(frames,{duration:950,easing:'cubic-bezier(.45,0,.2,1)',fill:'forwards'});motions.add(a);try{await a.finished;return alive&&token===motionToken;}catch{return false;}finally{a.cancel();motions.delete(a);}}
 async function transition(view,back=false){
  if(busy||!alive||(!back&&view==='phone'&&!data.exam)||(!back&&view==='computer'&&!ready()))return;
  hints.hide();story.clear();
  if(!back&&['exam','phone'].includes(view))$('back').hidden=true;
  drawEpoch++;busy=true;roomInputLocked(true);stopDragTutorial();stopPhoneHints();examInk?.cancel();cancelDrag();const token=++motionToken;$('stage').dataset.motion=back?'return':'push';
  const file=back?'room-clean.png':view==='phone'?'phone-clean.jpg':view==='exam'?'exam.png':'computer.png';
  const previewSrc='/assets/escape/'+file;try{await prepareImage(previewSrc);}catch{busy=false;roomInputLocked(false);delete $('stage').dataset.motion;return;}if(!alive||token!==motionToken)return;
  if(['phone','exam','computer'].includes(view)&&!back){
   $('back').textContent='BACK';$('back').setAttribute('aria-label','BACK');$('back').hidden=['exam','phone'].includes(view);
   const result=await videos.play(view,false,$('stage'),{effect:['phone','exam'].includes(view)?(video,layer)=>mountSceneDimming(video,layer,roomDarkness(data.papers.filter(Boolean).length,floorItems.length)):null});
   if(!alive||token!==motionToken||result==='cancelled')return;
   if(view==='phone')gameAudio.effect('unlock');if(view==='computer')gameAudio.effect('boot',{chapter:2});data.view=view;await draw();videos.cancel();busy=false;delete $('stage').dataset.motion;persist();hintLastActivity=performance.now();schedulePhoneHints();return;
  }
  const old=$('visual').cloneNode(true);old.querySelectorAll('canvas').forEach((canvas,i)=>canvas.getContext('2d').drawImage($('visual').querySelectorAll('canvas')[i],0,0));old.removeAttribute('id');old.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));old.className='escape-camera-overlay';overlay=old;
  const profile=cameraProfiles[view],ratio=profile.room[2]/profile.detail[2],zoom=1/ratio;
  const roomPose=cameraPose(profile.detail[0]-profile.room[0]*zoom,profile.detail[1]-profile.room[1]*zoom,zoom,profile.turn);
  const detailPose=cameraPose(profile.room[0]-profile.detail[0]*ratio,profile.room[1]-profile.detail[1]*ratio,ratio,-profile.turn);
  const origin=data.view;data.view=back?'room':view;draw();$('stage').append(old);const incoming=$('visual');incoming.style.transformOrigin='0 0';
  const results=await Promise.all([animate(old,[{transform:cameraPose(0,0,1),opacity:1},{transform:back?detailPose:roomPose,opacity:0}],token),animate(incoming,[{transform:back?roomPose:detailPose,opacity:0},{transform:cameraPose(0,0,1),opacity:1}],token)]);
  if(!results.every(Boolean)){if(alive&&token===motionToken){data.view=origin;draw();}return;}
  old.remove();overlay=null;incoming.style.transformOrigin='';busy=false;roomInputLocked(false);delete $('stage').dataset.motion;persist();if(data.view==='phone')hintLastActivity=performance.now();schedulePhoneHints();scheduleDragTutorial();
 }
 async function draw(animateDarkness=false){
  const version=++drawEpoch;hints.hide();$('visual').style.filter='';
  const wasRoom=$('stage').dataset.escapeView==='room';if(!wasRoom)roomDragStarted=false;stopDragTutorial();
  const previousDarkness=Number($('visual').querySelector('.escape-room-dim')?getComputedStyle($('visual').querySelector('.escape-room-dim')).opacity:0);
  disposePhoneList?.();disposePhoneList=null;stopPhoneHints();phoneGesture=false;examInk?.dispose();examInk=null;gameController?.dispose();gameController=null;cancelDrag();$('hotspots').replaceChildren();$('stage').classList.add('escape-scene');$('stage').dataset.escapeView=data.view;
  updateProgress();
  $('back').hidden=['exam','phone'].includes(data.view);
  $('back').textContent=data.view==='room'||data.view==='game'?'SAVE ROOM':'BACK';$('back').setAttribute('aria-label',$('back').textContent);
  $('back').onclick=()=>{if(busy){loadToken++;cancelMotion();busy=false;data.view='room';persist();draw();return;}if(data.view==='room'||data.view==='game')onExit();else transition(data.view,true);};
  if(data.view==='room'){
   if(floorUnlocked()&&data.papers.some(done=>!done))hints.show('papers');
   mistDefinitions();
   imageScene('escape/room-clean.png','Escape 房间',3840,2160);
   const count=data.papers.filter(Boolean).length,darkness=.56*count/floorItems.length;
   const phonePosition={left:'28.85%',top:'33.24%',width:'11.51%',height:'18.89%'};const phone=img('phone-item.png','escape-phone-item');Object.assign(phone.style,phonePosition);
   const dim=add('div','escape-room-dim'+(animateDarkness?' escape-dim-step':''));dim.setAttribute('aria-hidden','true');dim.style.opacity=String(darkness);dim.style.setProperty('--dim-from',String(previousDarkness));dim.style.setProperty('--dim-to',String(darkness));
   if(data.exam&&!data.messages.every(Boolean))mist('phone-item.png',$('visual'),phonePosition,-.35);
   hotspot('escape-phone',[28.85,33.24,11.51,18.89],'PHONE',!data.exam,()=>transition('phone'));
   hotspot('escape-exam',[41.5,25,5.5,7],'EXAM',false,()=>transition('exam'));
   $('stage').dataset.escapePaperCount=String(count);
   // The original character pose remains unchanged; only room illumination changes.
   if(!data.exam){const light=add('div','escape-exam-mist');light.innerHTML='<svg viewBox="0 0 100 100" preserveAspectRatio="none"><polygon filter="url(#escape-exam-mist)" points="42.2,28.8 44.4,26.2 46.5,28.2 44.1,30.6"/></svg>';}
   data.papers.forEach((done,i)=>{if(done)return;const paper=add('button','escape-paper');paper.id='escape-paper-'+i;paper.disabled=busy||!floorUnlocked();const item=floorItems[i];paper.setAttribute('aria-label',(item.bundle?'拖动叠放作业组 ':'拖动作业 ')+(i+1)+' 到小人');Object.assign(paper.style,{left:item.x+'%',top:item.y+'%',width:item.w+'%',height:item.h+'%'});if(floorUnlocked())mist(item.file,paper,{left:'0',top:'0',width:'100%',height:'100%'},-i*.31);const art=img(item.file,'escape-paper-art'+(animateDarkness?' escape-paper-dim-step':''),paper);art.style.filter=`brightness(${1-darkness})`;art.style.setProperty('--paper-from',String(1-previousDarkness));art.style.setProperty('--paper-to',String(1-darkness));bindDrag(paper,'paper',i);});
   if(ready()){const light=add('div','escape-monitor-light');light.setAttribute('aria-hidden','true');}
   hotspot('escape-computer',[46.5,15.8,8.2,10],'COMPUTER',!ready(),()=>transition('computer'));
   scheduleDragTutorial();
  }else if(data.view==='phone'){
   if(!data.messages.every(Boolean))hints.show('phone');
   const prepared=await nativePhone.prepare(videos.layer()?.querySelector('video'));if(!alive||version!==drawEpoch||data.view!=='phone')return;if(!prepared)throw Error('Phone ending could not load');imageScene(nativePhone.background(),'Phone notifications',1920,1080);$('visual').style.filter=`brightness(${1-roomDarkness(data.papers.filter(Boolean).length,floorItems.length)})`;
   hintLastActivity=performance.now();const screen=add('div','escape-phone-screen',$('hotspots'));screen.style.filter=`brightness(${1-roomDarkness(data.papers.filter(Boolean).length,floorItems.length)})`;
   if(data.messages.every(Boolean))disposePhoneList=mountPhoneList(screen);
   else{data.messages.forEach((done,i)=>{if(!done)messageRow(screen,i);});schedulePhoneHints();}
  }else if(data.view==='exam'){
   imageScene('escape/exam.png','58 分试卷',1675,939);$('visual').style.filter=`brightness(${1-roomDarkness(data.papers.filter(Boolean).length,floorItems.length)})`;
   examInk=mountExamInk({host:$('visual'),completed:data.exam,onState:drawing=>{if(drawing)hints.hide();if(drawing)$('stage').dataset.escapeInk='drawing';else delete $('stage').dataset.escapeInk;},onComplete:()=>{if(!alive||data.view!=='exam')return;data.exam=true;persist();updateProgress();}});
   hotspot('escape-cross-exam',[12,3,82,89],'划掉分数',data.exam,()=>{if(busy||data.exam)return;$('escape-cross-exam').disabled=true;examInk?.play();});
  }else if(data.view==='computer'){
   imageScene('escape/computer.png','STAY HERE FOR A WHILE?',1676,939);
   hotspot('escape-yes',[63,28,14,11],'YES',false,()=>go('game'));
  }else{
   imageScene('escape/game.png','Escape 游戏场景',1672,941);
   // The real journey owns its door button; no transparent click layer over it.
   gameController=createEscapeGame({host:$('visual'),adapter:gameAdapter||escapeParallaxAdapter,onComplete:()=>{if(!alive||data.view!=='game')return;data.view='room';persist();finish();}});
   if(gameAdapter)hotspot('escape-advance',[0,0,100,88],'GAME',false,e=>{if(busy||!alive||!$('dev-panel').hidden)return;gameController?.handleInput({kind:'click',point:scenePoint(e.clientX,e.clientY)});});
  }
  syncStory();
 }
 const wheel=e=>{if(data.view!=='game'||busy||!$('dev-panel').hidden)return;e.preventDefault();gameController?.handleInput({kind:'wheel',point:scenePoint(e.clientX,e.clientY),deltaY:e.deltaY,deltaMode:e.deltaMode,direction:e.deltaY>0?'forward':e.deltaY<0?'backward':'none'});};
 const hide=()=>{story.dispose();intro.dispose();hints.hide();disposePhoneList?.();disposePhoneList=null;stopDragTutorial();stopPhoneHints();examInk?.dispose();examInk=null;gameController?.dispose();gameController=null;cancelDrag();cancelMotion();cancelAnimationFrame(loadingFrame);loadingFrame=0;loadingMotion?.dispose();loadingMotion=null;clearTimeout(timer);};window.addEventListener('pagehide',hide);$('stage').addEventListener('wheel',wheel,{passive:false});
 async function loading(){
  loadingMotion?.dispose();loadingMotion=null;
  const token=++loadToken;$('stage').classList.add('escape-scene');$('stage').dataset.escapeView='loading';$('hotspots').replaceChildren();
  let cover;
  if(escapeLoadingAsset.available){imageScene('escape/'+escapeLoadingAsset.src,'Escape 加载页面',1672,941);cover=add('div','escape-baked-loading-track');cover.innerHTML='<div id="escape-load-fill"></div>';loadingMotion=mountEscapeLoadingMotion($('visual'),'/assets/escape/'+escapeLoadingAsset.src);}
  else{imageScene('escape/room-clean.png','Escape 加载页',3840,2160);cover=add('div','escape-loading');cover.innerHTML='<h1>ESCAPE</h1><div class="escape-track"><div id="escape-load-fill"></div></div>';}

  $('back').hidden=false;$('back').textContent='SAVE ROOM';$('back').onclick=()=>{loadToken++;onExit();};let count=0;
  const critical=data.view==='room'?['room-clean.png','phone-item.png',...floorItems.map(item=>item.file),'room-interior-mask.svg']:data.view==='phone'?['phone-clean.jpg','class-card.png','teacher-card.png',...(phoneListAsset?[phoneListAsset]:[])]:data.view==='exam'?['exam.png']:data.view==='computer'?['computer.png']:['game.png'];
  const assets=escapeLoadingAsset.available?[escapeLoadingAsset.src,...critical]:critical;
  warmImages(files.map(file=>'/assets/escape/'+file));
  const duration=2400;let elapsed=0,last=performance.now();
  const progress=now=>{if(!alive||token!==loadToken)return;if(!document.hidden)elapsed+=Math.min(80,Math.max(0,now-last));last=now;const amount=Math.min(count/assets.length,elapsed/duration);$('escape-load-fill').style.width=(Math.min(.98,amount)*100)+'%';loadingMotion?.paint(elapsed);loadingFrame=requestAnimationFrame(progress);};progress(last);
  const minimum=new Promise(resolve=>{timer=setTimeout(resolve,duration);});
  try{
   await Promise.all([minimum,Promise.all(assets.map(async file=>{await prepareImage('/assets/escape/'+file);count++;}))]);
   if(!alive||token!==loadToken)return;cancelAnimationFrame(loadingFrame);loadingFrame=0;$('escape-load-fill').style.width='100%';
   await new Promise(resolve=>{timer=setTimeout(resolve,180);});
  }catch{cancelAnimationFrame(loadingFrame);loadingFrame=0;loadingMotion?.dispose();loadingMotion=null;if(alive&&token===loadToken){cover.innerHTML='<button id="escape-retry">RETRY</button>';$('escape-retry').onclick=loading;}return;}
  if(!alive||token!==loadToken)return;loadingMotion?.dispose();loadingMotion=null;if(!await intro.play(2,()=>draw())||!alive||token!==loadToken)return;busy=false;roomInputLocked(false);schedulePhoneHints();scheduleDragTutorial();
 }
 persist();loading();
 return ()=>{alive=false;$('back').hidden=false;nativePhone.dispose();$('visual').style.filter='';hints.dispose();loadToken++;hide();videos.dispose();$('stage').removeEventListener('wheel',wheel);window.removeEventListener('pagehide',hide);$('stage').classList.remove('escape-scene');delete $('stage').dataset.escapeView;delete $('stage').dataset.escapePaperCount;delete $('stage').dataset.escapeDistance;$('stage').classList.remove('escape-game-complete');};
}
