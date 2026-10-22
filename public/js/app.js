import {mountOpening,shouldShowOpening} from './opening.js';
import {gameAudio} from './game-audio.js';
import {mountFinal} from './final.js';
import {mountFinalPrelude} from './final-timeline.js';
import {mountBedFrameGlitch} from './prologue-bed-frame.js';
import {mountObjectGlitches} from './prologue-object-glitch.js';
import {mountPrologueUI} from './prologue-ui.js';
import {mountRetry,resetRetry} from './retry.js';
import {mountWindowSelection} from './prologue-selection.js';
import {mountAssembly,resetAssembly} from './prologue-assembly.js';
import {sceneImage,warmImages,prepareImage} from './image-cache.js';
import {mountLampGlitch} from './prologue-lamp-glitch.js';
import {STORAGE_KEY,normalize,canEnter,enter,complete,exit} from './state.js';
import {chapters} from './chapters.js';
import {input} from './input.js';
import {mountCreation} from './creation.js';
let disposeAvatar=null,disposeFinal=null,disposeOpening=null;
import {mountWonder,resetWonder} from './wonder.js';
import {mountEscape,resetEscape} from './escape.js';
import {mountPrologueGlitch} from './prologue-glitch.js';
import {mountWonderWordGlitch,mountEscapeWordGlitch,mountRetryWordGlitch} from './prologue-word-glitch.js';
let disposeBedFrame=null,disposeObjects=null,disposeCursors=null,disposeRetryWord=null,disposeRetry=null,disposeSelection=null,disposeAssembly=null,disposeLamp=null,disposeEscapeWord=null,disposeEscape=null,disposeWordGlitch=null,disposeGlitch=null,disposeWonder=null,lastRenderedScene=null;
const $=id=>document.getElementById(id);
gameAudio.init();
let state,width=1536,height=1024;
try{state=normalize(JSON.parse(localStorage.getItem(STORAGE_KEY)));}catch{state=normalize(null);}
// Return from the independent forest preview without completing or resetting chapters.
if(new URLSearchParams(location.search).get('forestReturn')==='1'){state={...state,scene:'prologue'};const url=new URL(location.href);url.searchParams.delete('forestReturn');history.replaceState(null,'',url.pathname+url.search+url.hash);}
function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));$('save-status').textContent='本地进度已保存';}catch{$('save-status').textContent='存档不可用；当前进度仅保留在此页面';}}
function commit(next){state=normalize(next);save();render();}
function finishChapter(n){commit(complete(state,n));}
function resize(){const rect=$('viewport').getBoundingClientRect();const creation=state?.scene==='chapter4'&&Boolean(document.querySelector('.creation-controls:not([hidden])')),usableHeight=Math.max(1,rect.height-(creation?64:0));const scale=Math.min(rect.width/width,usableHeight/height);$('stage').style.top=creation?'calc(50% - 32px)':'50%';$('stage').style.setProperty('--scene-ui',1/scale);$('stage').style.width=width+'px';$('stage').style.height=height+'px';$('stage').style.transform=`translate(-50%, -50%) scale(${scale})`;}
// The whole stage (image + percentage hotspots + overlays) uses one transform.
// Convert viewport pointer coordinates into scene coordinates for future interactions.
export function scenePoint(clientX,clientY){const r=$('stage').getBoundingClientRect();return {x:(clientX-r.left)/r.width,y:(clientY-r.top)/r.height};}
function imageScene(src,label,w=1536,h=1024){width=w;height=h;if(src instanceof HTMLCanvasElement){src.className='scene-image escape-native-phone';$('visual').replaceChildren(src);resize();return;}const im=sceneImage('/assets/'+src);im.className='scene-image';im.alt=label;$('visual').replaceChildren(im);const fit=()=>{if(!im.isConnected||$('visual').firstElementChild!==im)return;width=im.naturalWidth;height=im.naturalHeight;resize();};im.onload=fit;if(im.complete&&im.naturalWidth)fit();else resize();}
function hotspot(id,rect,label,disabled,callback){const b=document.createElement('button');b.id=id;b.className='hotspot';b.disabled=disabled;b.setAttribute('aria-label',label);b.title=label;const [x,y,w,h]=rect;Object.assign(b.style,{left:x+'%',top:y+'%',width:w+'%',height:h+'%'});const hint=document.createElement('span');hint.className='hint';hint.textContent=label;b.append(hint);b.onclick=callback;$('hotspots').append(b);}
function render(){
 disposeOpening?.();disposeOpening=null;
 disposeFinal?.();disposeFinal=null;disposeAvatar?.();disposeAvatar=null;
 const showWonderLoading=lastRenderedScene!=='chapter1';lastRenderedScene=state.scene;
 disposeBedFrame?.();disposeBedFrame=null;disposeObjects?.();disposeObjects=null;disposeCursors?.();disposeCursors=null;disposeRetryWord?.();disposeRetryWord=null;disposeRetry?.();disposeRetry=null;disposeSelection?.();disposeSelection=null;disposeAssembly?.();disposeAssembly=null;disposeLamp?.();disposeLamp=null;disposeEscapeWord?.();disposeEscapeWord=null;disposeEscape?.();disposeEscape=null;disposeWonder?.();disposeWonder=null;disposeGlitch?.();disposeGlitch=null;disposeWordGlitch?.();disposeWordGlitch=null;
 $('back').textContent='SAVE ROOM';$('back').setAttribute('aria-label','SAVE ROOM');$('back').onclick=()=>commit({...state,scene:'prologue',ended:state.ended});
 input.stopCamera();$('camera-video').hidden=true;$('camera-status').textContent='摄像头未开启 · 第四章可开启手势';$('hotspots').replaceChildren();$('back').hidden=state.scene==='prologue';
 $('stage').classList.toggle('prologue-scene',state.scene==='prologue');
 gameAudio.setScene(state.scene,{completed:state.completed});
 const n=state.scene.startsWith('chapter')?Number(state.scene.slice(-1)):0;
 $('dev-state').textContent=`场景：${state.scene} · 完成：${state.completed}/4 · 房间：0_${state.completed}`;
 $('complete-chapter').hidden=!n;$('complete-chapter').textContent=n===2?'测试完成第二章 → 返回序章（游戏终点尚未实现）':'临时完成当前章节 → 返回序章';$('asset-browser').hidden=n!==1;$('camera-controls').hidden=n!==4;
 $('chapter-plan').innerHTML=n?`<ol>${chapters[n-1].steps.map(s=>`<li>${s}</li>`).join('')}</ol>${n===3?`<p>${chapters[2].future.knownIssue}</p>`:''}`:'进入章节后显示待实现结构。';
 $('dev-actions').innerHTML=chapters.map(c=>`<button data-enter="${c.id}" ${canEnter(state,c.id)?'':'disabled'}>正常进入 ${c.name}</button><button data-jump="${c.id}">测试跳转第 ${c.id} 章</button><button data-simulate="${c.id}">模拟完成至第 ${c.id} 章</button>`).join('')+`<button id="dev-exit" ${state.completed===4?'':'disabled'}>进入 Final</button>`;
 document.querySelectorAll('[data-enter]').forEach(b=>b.onclick=()=>commit(enter(state,Number(b.dataset.enter))));
 document.querySelectorAll('[data-jump]').forEach(b=>b.onclick=()=>{const c=Number(b.dataset.jump);commit({...state,completed:Math.max(state.completed,c-1),scene:`chapter${c}`});});
 document.querySelectorAll('[data-simulate]').forEach(b=>b.onclick=()=>commit({completed:Number(b.dataset.simulate),scene:'prologue',ended:false}));$('dev-exit').onclick=()=>commit(exit(state));
 if(state.scene==='prologue'){
 warmImages(state.completed===0?['1_0.png','1_1.png','window-enter-supplied-last.png','1_5.png','1_6.png'].map(f=>'/assets/wonder/'+f):state.completed===1?['2_0.png','room-clean.png','phone-item.png','phone-clean.jpg','exam.png','computer.png','wechat.png'].map(f=>'/assets/escape/'+f):[]);
 imageScene(`prologue/0_${state.completed}.${state.completed===0||state.completed===4?'png':'jpg'}`,`序章 0_${state.completed}`);
 if(state.completed<4)disposeAssembly=mountAssembly($('visual'),{completed:state.completed});
 disposeCursors=mountPrologueUI($('visual'));
 if(state.completed>=1&&state.completed<=3)disposeGlitch=mountPrologueGlitch($('visual'));
 if(state.completed===3){disposeObjects=mountObjectGlitches($('visual'));disposeBedFrame=mountBedFrameGlitch($('visual'));disposeRetryWord=mountRetryWordGlitch($('visual'));}
 if(state.completed===1)disposeWordGlitch=mountWonderWordGlitch($('visual'));
 if(state.completed===2||state.completed===3){disposeLamp=mountLampGlitch($('visual'));disposeEscapeWord=mountEscapeWordGlitch($('visual'));}
 // Match original room objects. Restored room (0_4) has a different composition.
 // Native source white cursor and approved 0_4 PLAYER2 crop are animated separately.
 const restored=state.completed===4;
 const boxes=restored?[[6,22,27,28],[34,34,8,35],[47,38,14,12],[71,24,13,46]]:state.completed===0?[[13,26,14,17],[37,27,9,33],[56,31,13,12],[80,34,14,25]]:[[5,25,27,25],[35,26,11,36],[55,29,15,14],[80,28,17,29]];
 boxes[3]=restored?[88,23,10,55]:[80,67,10,16];
 chapters.forEach((c,i)=>hotspot(`entry-${c.id}`,boxes[i],`${c.name}${canEnter(state,c.id)?'':' · 尚未解锁'}`,!canEnter(state,c.id),()=>commit(enter(state,c.id))));
 hotspot('exit',restored?[88,23,10,55]:[80,67,10,16],'EXIT GAME',state.completed!==4,()=>commit(exit(state)));
 $('entry-4').hidden=restored;$('exit').hidden=!restored;
 if(restored)disposeFinal=mountFinalPrelude($('visual'));
 disposeSelection=mountWindowSelection($('visual'));
 }else if(n){
 if(n===1){disposeWonder=mountWonder({showLoading:showWonderLoading,imageScene,hotspot,scenePoint,prepareFinish:()=>{const n=Math.max(state.completed,1);return prepareImage(`/assets/prologue/0_${n}.${n===4?'png':'jpg'}`);},finish:()=>finishChapter(1),onExit:()=>commit({...state,scene:'prologue'})});return;}
 if(n===3){disposeRetry=mountRetry({imageScene,hotspot,onVictory:()=>{state={...state,completed:Math.max(state.completed,3)};save();$('dev-state').textContent='场景：chapter3 · 完成：'+state.completed+'/4';},onExit:()=>commit({...state,scene:'prologue'})});return;}
 if(n===2){disposeEscape=mountEscape({imageScene,hotspot,scenePoint,finish:()=>finishChapter(2),onExit:()=>commit({...state,scene:'prologue'})});return;}
 const c=chapters[n-1];if(c.image)imageScene(c.image,'Wonder 房间',1670,942);
 else{width=1672;height=941;resize();if(n===4)disposeAvatar=mountCreation({root:$('visual'),finish:()=>finishChapter(4)});}
 }else{
 width=1920;height=1080;resize();disposeFinal=mountFinal({root:$('visual'),onFinished:()=>{if(state.scene==='final'){state={...state,ended:true};save();}}});
 }
}
$('back').onclick=()=>commit({...state,scene:'prologue',ended:state.ended});
function setPanel(open){$('dev-panel').hidden=!open;}
window.addEventListener('keydown',e=>{if(e.shiftKey&&e.code==='KeyD'&&!e.repeat){e.preventDefault();setPanel($('dev-panel').hidden);}if(e.key==='Escape')setPanel(false);});$('dev-close').onclick=()=>setPanel(false);
$('complete-chapter').onclick=()=>{const n=Number(state.scene.slice(-1));finishChapter(n);};
$('reset-retry').onclick=()=>{if(confirm('重置第三章战斗次数、player2 和日记进度？总章节存档保留。')){resetRetry();commit({...state,completed:Math.max(state.completed,2),scene:'chapter3'});}};
document.querySelectorAll('[data-retry-test]').forEach(b=>b.onclick=()=>{const failures=Number(b.dataset.retryTest);localStorage.setItem('save-file-me:retry:v1',JSON.stringify({failures,joined:false,won:false,view:failures===3?'discovered':'battle'}));commit({...state,completed:Math.max(state.completed,2),scene:'chapter3'});});
$('reset-assembly').onclick=()=>{resetAssembly();if(state.scene==='prologue'&&state.completed===0)render();};
$('reset-wonder').onclick=()=>{if(confirm('清空第一章的四项探索和小游戏进度？其他章节及总通关存档会保留。')){resetWonder();commit({...state,scene:'chapter1'});}};
$('reset-escape').onclick=()=>{if(confirm('清空第二章消息、试卷和游戏进度？总章节存档及第一章进度保留。')){resetEscape();commit({...state,scene:'chapter2'});}};
$('reset').onclick=()=>{if(confirm('重置全部进度并返回初始房间？')){resetAssembly();resetWonder();resetEscape();resetRetry();commit(normalize(null));}};
const files=['1_1.png','1_1.5.png','1_2.png','1_3.png','1_4.png','1_5.png','1_6.png','1_7.jpg','1_15.png','1_8.png','1_9.png','1_10.png','1_11.png','1_12.png'];$('asset-options').innerHTML=files.map(f=>`<button data-asset="${f}">${f}</button>`).join('');document.querySelectorAll('[data-asset]').forEach(b=>b.onclick=()=>imageScene(`wonder/${b.dataset.asset}`,'Wonder 素材',1670,942));
$('camera-start').onclick=async()=>{if(state.scene==='chapter4'){document.getElementById('hand-start')?.click();$('camera-status').textContent='手势状态见第四章实时诊断面板';return;}const button=$('camera-start');button.disabled=true;try{await input.startCamera($('camera-video'));if(state.scene!=='chapter4'){input.stopCamera();return;}$('camera-video').hidden=false;$('camera-status').textContent='摄像头预览开启';}catch(e){input.stopCamera();$('camera-status').textContent='无法开启：'+e.message;}finally{button.disabled=false;}};
$('camera-stop').onclick=()=>{document.getElementById('hand-stop')?.click();input.stopCamera();$('camera-video').hidden=true;$('camera-status').textContent='摄像头已关闭';};
window.addEventListener('resize',resize);window.addEventListener('pagehide',()=>{disposeOpening?.();disposeOpening=null;disposeFinal?.();disposeFinal=null;input.stopCamera();disposeBedFrame?.();disposeBedFrame=null;disposeObjects?.();disposeObjects=null;disposeCursors?.();disposeCursors=null;disposeRetryWord?.();disposeRetryWord=null;disposeRetry?.();disposeRetry=null;disposeSelection?.();disposeSelection=null;disposeAssembly?.();disposeAssembly=null;disposeLamp?.();disposeLamp=null;disposeEscapeWord?.();disposeEscapeWord=null;disposeGlitch?.();disposeGlitch=null;disposeWordGlitch?.();disposeWordGlitch=null;});window.addEventListener('pageshow',e=>{if(e.persisted)render();});window.addEventListener('storage',e=>{if(e.key===STORAGE_KEY){try{state=normalize(JSON.parse(e.newValue));render();}catch{}}});save();render();
if(shouldShowOpening(state))disposeOpening=mountOpening({stage:$('stage'),onFinish:()=>{disposeOpening=null;}});

// Chapter 04 test controls remain available from the prologue.
document.querySelectorAll('[data-creation-test]').forEach(button=>button.onclick=()=>{
 const key='save-file-me:creation:v1',old=localStorage.getItem(key);
 if(old)localStorage.setItem(key+':backup',old);
 const run=button.dataset.creationTest==='run';
 localStorage.setItem(key,JSON.stringify(run?{roomCreated:true,built:5,phase:'complete',item:'door'}:{roomCreated:false,built:0,phase:'room-place',item:'window'}));
 setPanel(false);commit({...state,completed:Math.max(state.completed,3),scene:'chapter4'});
});
