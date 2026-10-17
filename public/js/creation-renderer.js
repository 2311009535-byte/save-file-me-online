import {buildSpecs,drawBuild} from './creation-build-drawing.js';
import {creationAssets} from './creation-assets.js';
export const UI_SOURCES={
 build:{name:'Build UI.JPG',source:'/assets/creation/4_4.JPG',crop:[1105.344,0,307.04,114.48],size:[160,59],full:true},
 code:{name:'code  UI.JPG',source:'/assets/creation/4_4.JPG',crop:[3085.752,103.68,353.096,105.84],size:[160,48],full:true},
 inventory:{source:'/assets/creation/4_4.JPG',crop:[806,1620,2264,389],size:[1000,172],full:true},
 window:{name:'window UI.JPG',crop:[323,844,3028,783],size:[184,118]},
 lamp:{name:'lamp UI.JPG',crop:[538,220,1880,1858],size:[184,118]},
 bed:{name:'bed UI.JPG',crop:[278,87,1660,2026],size:[184,118]},
 computer:{name:'computer UI.JPG',crop:[213,195,2910,1931],size:[184,118]}
};
export function createCreationRenderer(root){
 let alive=true,token=0,worker=null,nextId=0;const pending=new Map(),cache=new Map(),ui=new Map();
 const original=root.querySelector('.creation-backdrop');
 const density=Math.min(2,window.devicePixelRatio||1),targetWidth=Math.min(3072,Math.max(1672,Math.round(root.getBoundingClientRect().width*density)));
 const CACHE_BYTES=64*1024*1024;let cacheBytes=0;const sizes=new Map();
 function trim(){while(cacheBytes>CACHE_BYTES&&cache.size>1){const key=cache.keys().next().value;cache.delete(key);cacheBytes-=sizes.get(key)||0;sizes.delete(key);}}
 const backdrop=document.createElement('canvas');backdrop.className='creation-rendered';backdrop.width=1672;backdrop.height=941;backdrop.hidden=true;root.prepend(backdrop);
 const animation=document.createElement('canvas');animation.className='creation-raise-animation';animation.dataset.animationSlot='chapter4-raise';animation.width=Math.round(1008*density);animation.height=Math.round(535*density);animation.hidden=true;root.append(animation);
 try{worker=new Worker('/js/creation-render-worker.js');worker.onmessage=({data})=>{pending.get(data.id)?.(new Uint8ClampedArray(data.buffer));pending.delete(data.id);};worker.onerror=()=>{worker.terminate();worker=null;for(const resolve of pending.values())resolve(null);pending.clear();};}catch{}
 async function normalize(canvas){
  if(!alive)return;
  const context=canvas.getContext('2d',{willReadFrequently:true}),data=context.getImageData(0,0,canvas.width,canvas.height);
  if(worker){const pixels=await new Promise(resolve=>{const id=++nextId;pending.set(id,resolve);worker.postMessage({id,buffer:data.data.buffer},[data.data.buffer]);});if(pixels){context.putImageData(new ImageData(pixels,canvas.width,canvas.height),0,0);return;}}
  // A failed worker leaves the original artwork usable; do not blank the game.
 }
 async function image(url){const im=new Image();im.decoding='async';im.src=url;await im.decode();return im;}
 function load(n){
  if(cache.has(n)){const promise=cache.get(n);cache.delete(n);cache.set(n,promise);return promise;}
  const promise=(async()=>{const name=creationAssets[n]?.name||(n===28||n===37?`4_${n}.JPG`:`4_${n}.png`);const im=await image('/assets/creation/'+name);const canvas=document.createElement('canvas');canvas.width=Math.min(im.naturalWidth,targetWidth);canvas.height=Math.round(canvas.width*941/1672);canvas.getContext('2d').drawImage(im,0,0,canvas.width,canvas.height);await normalize(canvas);if(n===27||n===28){const reference=await load(26),width=Math.round(canvas.width*343/1672);canvas.getContext('2d').drawImage(reference,0,0,reference.width*343/1672,reference.height,0,0,width,canvas.height);}if(alive&&cache.get(n)===promise){sizes.set(n,canvas.width*canvas.height*4);cacheBytes+=sizes.get(n);trim();}return canvas;})();
  cache.set(n,promise);promise.catch(()=>{if(cache.get(n)===promise)cache.delete(n);});
  while(cache.size>8){const key=cache.keys().next().value;cache.delete(key);cacheBytes-=sizes.get(key)||0;sizes.delete(key);}return promise;
 }
 async function show(n){
  const current=++token;try{const canvas=await load(n);if(!alive||current!==token)return;if(backdrop.width!==canvas.width||backdrop.height!==canvas.height){backdrop.width=canvas.width;backdrop.height=canvas.height;}backdrop.getContext('2d').drawImage(canvas,0,0);backdrop.hidden=false;original.hidden=true;root.dataset.renderedFrame=n;root.dataset.computerSidebar=n===27||n===28?'26':'native';}catch{if(alive&&current===token){backdrop.hidden=true;original.hidden=false;}}
 }
 function warm(numbers){for(const n of new Set(numbers.filter(n=>n>0&&n<=37)))load(n).catch(()=>{});}
 function sharpLabel(kind,container){
  const canvas=document.createElement('canvas'),w=kind==='build'?160:160,h=kind==='build'?59:48;
  const resolution=Math.max(2,density,root.getBoundingClientRect().width/1672);
  canvas.width=Math.ceil(w*resolution);canvas.height=Math.ceil(h*resolution);
  const c=canvas.getContext('2d');c.scale(canvas.width/w,canvas.height/h);c.fillStyle='#f6f2e9';c.fillRect(0,0,w,h);
  c.strokeStyle='#1212cf';c.lineWidth=.6;c.globalAlpha=.16;
  for(let x=-h;x<w;x+=4){c.beginPath();c.moveTo(Math.max(4,x),Math.min(h-4,h-4+x-4));c.lineTo(Math.min(w-4,x+h-8),Math.max(4,4+x+h-8-(w-4)));c.stroke();}
  c.globalAlpha=1;c.lineWidth=1.6;c.lineJoin='round';c.lineCap='round';
  c.stroke(new Path2D(`M3 3 L${w-4} 2 L${w-3} ${h-4} L4 ${h-3} Z M6 5 L${w-7} 5 L${w-6} ${h-7} L7 ${h-6} Z`));
  if(kind==='build'){c.stroke(new Path2D('M18 19 L30 12 L43 19 L43 35 L31 43 L18 35 Z M18 19 L31 27 L43 19 M31 27 L31 43 M24 16 L36 23'));}
  const letters={B:'M0 0V22H8Q15 22 15 16Q15 12 8 11Q14 10 14 5Q14 0 7 0Z M0 11H8',U:'M0 0V16Q0 23 8 22Q15 22 15 16V0',I:'M2 0H12 M7 0V22 M2 22H12',L:'M0 0V22H14',D:'M0 0V22H6Q17 22 17 11Q17 0 6 0Z',C:'M16 3Q11 -1 5 1Q0 3 0 11Q0 20 6 22Q12 24 16 19',O:'M8 0Q0 0 0 11Q0 22 8 22Q16 22 16 11Q16 0 8 0Z',E:'M15 0H0V22H15 M0 11H12'};
  c.save();c.translate(kind==='build'?55:45,(h-22)/2);c.lineWidth=1.9;
  for(const letter of kind==='build'?'BUILD':'CODE'){c.stroke(new Path2D(letters[letter]));c.translate(19,0);}c.restore();
  canvas.dataset.sharpLabel=kind;container.replaceChildren(canvas);
 }
 function icon(kind,container){
  if(!UI_SOURCES[kind])return;if(['build','code'].includes(kind)){sharpLabel(kind,container);return;}
  if(!ui.has(kind))ui.set(kind,(async()=>{const spec=UI_SOURCES[kind],im=await image(spec.source||'/assets/creation/ui/'+spec.name);const canvas=document.createElement('canvas');const iconDensity=Math.max(2,density);[canvas.width,canvas.height]=spec.size.map(n=>Math.round(n*iconDensity));const context=canvas.getContext('2d');context.fillStyle='#f6f2e9';context.fillRect(0,0,canvas.width,canvas.height);const [x,y,w,h]=spec.crop,scale=Math.min((canvas.width-12*iconDensity)/w,(canvas.height-8*iconDensity)/h);if(spec.full)context.drawImage(im,x,y,w,h,0,0,canvas.width,canvas.height);else context.drawImage(im,x,y,w,h,(canvas.width-w*scale)/2,(canvas.height-h*scale)/2,w*scale,h*scale);await normalize(canvas);return canvas;})());
  ui.get(kind).then(source=>{if(!alive||!container.isConnected)return;const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;canvas.getContext('2d').drawImage(source,0,0);container.replaceChildren(canvas);}).catch(()=>{});
 }
 let raiseToken=0,raiseKey='',raiseFrames=null,targetProgress=0;
 function drawRaise(progress){
  if(!raiseFrames)return;const c=animation.getContext('2d'),background=raiseFrames[0];c.globalAlpha=1;
  c.drawImage(background,343*background.width/1672,52*background.height/941,1008*background.width/1672,535*background.height/941,0,0,animation.width,animation.height);
  c.save();c.scale(animation.width/1008,animation.height/535);c.translate(-343,-52);drawBuild(c,buildSpecs[raiseKey].kind,progress);c.restore();
  animation.hidden=false;animation.dataset.progress=progress.toFixed(3);
 }
 function raise(stages,progress){
  targetProgress=Math.max(0,Math.min(1,progress));const key=stages.join(',');if(!buildSpecs[key])return;
  animation.dataset.animationMode=buildSpecs[key].kind+'-drawing';
  if(key===raiseKey){drawRaise(targetProgress);return;}
  raiseKey=key;raiseFrames=null;animation.hidden=true;animation.dataset.progress='loading';const current=++raiseToken;
  load(buildSpecs[key].background).then(background=>{if(!alive||current!==raiseToken)return;raiseFrames=[background];drawRaise(targetProgress);}).catch(()=>{});
 }
 function stopRaise(){raiseToken++;raiseKey='';raiseFrames=null;animation.hidden=true;}

 return {show,warm,icon,raise,stopRaise,dispose(){alive=false;token++;stopRaise();worker?.terminate();for(const resolve of pending.values())resolve(null);pending.clear();cache.clear();ui.clear();}};
}
