import {prepareImage} from './image-cache.js';
// Keep the original UI pixels. Only a few brief scan slices move at a time.
export function mountPrologueUI(visual){
 const stage=visual.parentElement,image=visual.querySelector('.scene-image');
 const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=1024;
 canvas.className='prologue-ui-motion';canvas.setAttribute('aria-hidden','true');
 Object.assign(canvas.style,{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none'});visual.append(canvas);
 const ctx=canvas.getContext('2d'),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let alive=true,timer=0,next=0,until=0,bursts=0,floorPatch=null;
 async function cursor(){
  try{
   const im=await prepareImage('/assets/prologue/0_0.png');if(!alive)return;
   const cut=document.createElement('canvas');cut.width=37;cut.height=50;const c=cut.getContext('2d');
   c.drawImage(im,617,694,37,50,0,0,37,50);const pixels=c.getImageData(0,0,37,50);
   for(let i=0;i<pixels.data.length;i+=4){const light=Math.max(...pixels.data.subarray(i,i+3));pixels.data[i+3]=Math.min(255,light*5);}
   c.putImageData(pixels,0,0);
   stage.style.setProperty('--prologue-player-cursor',`url("${cut.toDataURL()}") 3 3, default`);
   stage.dataset.playerCursor='native';
  }catch{stage.dataset.playerCursor='fallback';}
 }
 function tick(){
  if(!alive)return;timer=setTimeout(tick,80);ctx.clearRect(0,0,1536,1024);
  if(floorPatch)ctx.drawImage(floorPatch,549,754);
  if(reduced||document.hidden||!image.complete||!image.naturalWidth)return;
  const now=performance.now();if(now>=next){until=now+160;next=now+2200+Math.random()*2000;bursts++;}
  if(now>until)return;
  for(let i=0;i<4;i++){
   const y=i%2?900+Math.floor(Math.random()*95):26+Math.floor(Math.random()*155);
   const x=i%3===0?1280:40+Math.floor(Math.random()*350),w=i%3===0?210:160;
   ctx.fillStyle='#000';ctx.fillRect(x-3,y-1,w+6,5);
   ctx.globalAlpha=.75;ctx.drawImage(image,x,y,w,3,x+(i%2?2:-2),y,w,3);ctx.globalAlpha=1;
  }
  ctx.font='10px monospace';ctx.fillStyle='#a7c5b080';
  ctx.fillText(['01_//','[::]','_0?1'][bursts%3],1310,990);
  canvas.dataset.bursts=String(bursts);
 }
 if(image.getAttribute('src').includes('0_4.'))image.decode().then(()=>{
  if(!alive)return;const sample=document.createElement('canvas');sample.width=1536;sample.height=1024;const c=sample.getContext('2d');c.drawImage(image,0,0);
  const pixels=c.getImageData(549,754,48,64),floor=c.getImageData(505,754,48,64);
  for(let i=0;i<pixels.data.length;i+=4){const [r,g,b]=pixels.data.subarray(i,i+3);if(Math.min(r,g,b)>115&&Math.max(r,g,b)-Math.min(r,g,b)<65){pixels.data[i]=floor.data[i];pixels.data[i+1]=floor.data[i+1];pixels.data[i+2]=floor.data[i+2];}else pixels.data[i+3]=0;}
  floorPatch=document.createElement('canvas');floorPatch.width=48;floorPatch.height=64;floorPatch.getContext('2d').putImageData(pixels,0,0);
 }).catch(()=>{});
 cursor();tick();
 return()=>{alive=false;clearTimeout(timer);canvas.remove();stage.style.removeProperty('--prologue-player-cursor');delete stage.dataset.playerCursor;};
}
