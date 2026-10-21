import {prepareImage} from './image-cache.js';
// Type and erase the original UI pixels so typography stays faithful to the art.
export function mountPrologueUI(visual){
 const stage=visual.parentElement,image=visual.querySelector('.scene-image');
 const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=1024;
 canvas.className='prologue-ui-motion';canvas.setAttribute('aria-hidden','true');
 Object.assign(canvas.style,{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none'});visual.append(canvas);
 const ctx=canvas.getContext('2d'),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let alive=true,timer=0,floorPatch=null;
 const restored=image.getAttribute('src').includes('0_4.');
 const lines=[...(!restored?[{x:188,y:80,w:116,h:27,columns:12,offset:0}]:[]),{x:183,y:887,w:90,h:31,columns:8,offset:2800},{x:162,y:924,w:120,h:31,columns:10,offset:5600}];
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
  const now=performance.now();
  for(const line of lines){
   const phase=(now+line.offset)%10500;let fraction=1;
   if(phase>=4600&&phase<5500)fraction=1-(phase-4600)/900;
   else if(phase>=5500&&phase<5900)fraction=0;
   else if(phase>=5900&&phase<7600)fraction=(phase-5900)/1700;
   const columns=Math.round(fraction*line.columns),width=Math.round(line.w*columns/line.columns);
   ctx.fillStyle='#000';ctx.fillRect(line.x,line.y,line.w,line.h);
   if(width)ctx.drawImage(image,line.x,line.y,width,line.h,line.x,line.y,width,line.h);
   if(fraction<1&&Math.floor(now/450)%2===0){ctx.fillStyle='#cbd2cb';ctx.fillRect(line.x+width,line.y+9,2,14);}
   canvas.dataset['typed'+line.y]=String(columns);
  }
  if(!restored){
   const count=Math.floor(now/450)%4;ctx.fillStyle='#000';ctx.fillRect(304,80,30,27);
   if(count)ctx.drawImage(image,304,80,count*10,27,304,80,count*10,27);
   canvas.dataset.loadingDots=String(count);
  }
  canvas.dataset.uiStyle='erase-and-type';
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
