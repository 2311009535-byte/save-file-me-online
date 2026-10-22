import {prepareImage} from './image-cache.js';

// Keep the original 02 archive fixed. A sheet emerges directly from behind it;
// there is no opening flap or reconstruction of the surrounding texture.
export function mountEscapeLoadingMotion(host,src){
 const canvas=document.createElement('canvas');canvas.width=1672;canvas.height=941;canvas.className='escape-loading-motion';canvas.setAttribute('aria-hidden','true');canvas.dataset.archive='fixed';Object.assign(canvas.style,{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:1});host.append(canvas);
 const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let art=null,alive=true;
 prepareImage(src).then(image=>{if(alive)art=image;}).catch(()=>{});
 function paint(elapsed){
  if(!alive||!art)return;
  const phase=(elapsed%1600)/1600,smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
  const lift=reduced?1:phase<.46?smooth(phase/.46):phase<.68?1:1-smooth((phase-.68)/.32),y=Math.round(403-66*lift);
  ctx.clearRect(0,0,1672,941);ctx.save();ctx.beginPath();ctx.rect(794,333,84,155);ctx.clip();
  ctx.fillStyle='#454573';ctx.fillRect(807,y+3,60,66);ctx.fillStyle='#c5c6eb';ctx.fillRect(803,y,60,66);ctx.fillStyle='#8e91c3';ctx.fillRect(803,y,60,3);ctx.fillRect(803,y,3,66);ctx.fillStyle='#555982';for(let i=0;i<3;i++)ctx.fillRect(814,y+15+i*11,35-i*5,2);
  // Native icon pixels always cover the sheet's lower part, including its top.
  ctx.drawImage(art,794,403,84,85,794,403,84,85);ctx.restore();
  canvas.dataset.paperLift=lift.toFixed(4);canvas.dataset.paperY=String(y);canvas.dataset.motion=reduced?'static':'sliding';
 }
 return{paint,dispose(){alive=false;canvas.remove();}};
}
