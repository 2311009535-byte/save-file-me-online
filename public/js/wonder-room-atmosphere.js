import {prepareImage} from './image-cache.js';
const clockEpoch=performance.now();

export function mountRoomAtmosphere(visual){
 const layer=document.createElement('canvas');layer.width=1669;layer.height=942;layer.className='wonder-room-atmosphere';layer.setAttribute('aria-hidden','true');Object.assign(layer.style,{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:1});visual.append(layer);
 const ctx=layer.getContext('2d');ctx.imageSmoothingEnabled=false;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let alive=true,raf=0,last=-Infinity;
 prepareImage('/assets/wonder/1_1.png').then(image=>{
  if(!alive)return;
  const face=document.createElement('canvas');face.width=76;face.height=76;const fc=face.getContext('2d',{willReadFrequently:true});fc.drawImage(image,1236,186,76,76,0,0,76,76);
  // Remove only the baked-in central hands; retain the numerals and rim.
  const pixels=fc.getImageData(0,0,76,76),original=new Uint8ClampedArray(pixels.data);
  for(let y=10;y<53;y++)for(let x=10;x<53;x++){
   if(!((x>=33&&x<=41&&y>=10&&y<=43)||(x>=10&&x<=41&&y>=32&&y<=43)))continue;
   const i=(y*76+x)*4;if(original[i]+original[i+1]+original[i+2]>240)continue;
   const sample=(y*76+49)*4;for(let c=0;c<3;c++)pixels.data[i+c]=original[sample+c];
  }
  fc.putImageData(pixels,0,0);
  function paint(now){
   ctx.clearRect(0,0,1669,942);
   // Fixed curtain rails, gently changing folds below them. Restoring each
   // strip from the source prevents accumulating trails between frames.
   for(const [x,y,w,h,phase] of [[4,44,95,538,.2],[289,155,54,375,2.4]]){
    for(let row=0;row<h;row+=2){const progress=row/h,shift=reduced?0:Math.sin(now/2300+phase+progress*1.4)*1.2*progress;
     ctx.drawImage(image,x,y+row,w,Math.min(2,h-row),x+shift,y+row,w-shift,Math.min(2,h-row));}
   }
   ctx.drawImage(face,1236,186);
   const seconds=reduced?0:(now-clockEpoch)/1000;
   function hand(angle,length,width,color){ctx.save();ctx.translate(1274,224);ctx.rotate(angle);ctx.fillStyle=color;ctx.fillRect(-width/2,-length,width,length+3);ctx.restore();}
   hand(-Math.PI/2+seconds/43200*Math.PI*2,23,5,'#252329');hand(seconds/3600*Math.PI*2,29,4,'#252329');hand(seconds/60*Math.PI*2,30,1.5,'#784331');ctx.fillStyle='#252329';ctx.fillRect(1271,221,6,6);
   if(!reduced)for(let i=0;i<15;i++){
    const t=now/1000,x=1080+((i*37.7+t*(2+i%3))%100)+Math.sin(t*.31+i)*4,y=502-((i*19.3+t*(2.1+i%4*.3))%72);
    const alpha=(.10+.12*(.5+.5*Math.sin(t*.7+i)))*Math.max(0,1-Math.abs(x-1130)/60);
    ctx.fillStyle=`rgba(255,221,155,${alpha})`;ctx.fillRect(x,y,i%4===0?2:1,1);
   }
   layer.dataset.clockSeconds=seconds.toFixed(3);layer.dataset.dustCount=reduced?'0':'15';layer.dataset.motion=reduced?'static':'running';layer.dataset.curtainPhase=String(now);
  }
  function tick(now){if(!alive||!layer.isConnected)return;if(!document.hidden&&now-last>=40){paint(now);last=now;}raf=requestAnimationFrame(tick);}
  paint(performance.now());if(!reduced)raf=requestAnimationFrame(tick);
 }).catch(()=>{layer.dataset.error='image-load';});
 return()=>{alive=false;cancelAnimationFrame(raf);layer.remove();};
}
