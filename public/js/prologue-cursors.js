import {prepareImage} from './image-cache.js';
// Reuse the exact original pixels and native coordinates; no invented icon/font or mouse tracking.
export const cursorSources={white:{x:617,y:694,w:37,h:50},player2:{x:684,y:747,w:56,h:86,src:'/assets/prologue/0_4.png'}};
export function mountPrologueCursors(visual){
 const image=visual.querySelector('.scene-image'),canvas=document.createElement('canvas');canvas.width=1536;canvas.height=1024;canvas.className='prologue-cursors';canvas.setAttribute('aria-hidden','true');
 const ctx=canvas.getContext('2d'),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;let alive=true,raf=0,white=null,blue=null,erase=null,frames=0;
 function cut(im,area,kind){const c=document.createElement('canvas');c.width=area.w;c.height=area.h;const out=c.getContext('2d');out.drawImage(im,area.x,area.y,area.w,area.h,0,0,area.w,area.h);const pixels=out.getImageData(0,0,area.w,area.h);
  for(let y=0;y<area.h;y++)for(let x=0;x<area.w;x++){
   const i=(y*area.w+x)*4,r=pixels.data[i],g=pixels.data[i+1],b=pixels.data[i+2];
   if(kind==='blue'){
    // Remove only the brown room background. Blue outline and source glow retain RGB values.
    const signal=Math.max(0,Math.min(1,(b-r-5)/24,(b-g+1)/10)),edge=Math.min(1,x/5,(area.w-1-x)/5,y/5,(area.h-1-y)/5);
    pixels.data[i+3]=255*signal*Math.max(0,edge);
   }else{
    const visible=Math.max(r,g,b)>12;pixels.data[i+3]=visible?255:0;
    if(kind==='erase')pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=0;
   }
  }
  out.putImageData(pixels,0,0);return c;
 }
 function frame(now){if(!alive)return;raf=requestAnimationFrame(frame);if(document.hidden||!white||!blue)return;ctx.clearRect(0,0,1536,1024);
  const t=reduced?0:now/1000,dx=reduced?0:Math.sin(t*.9)*.6,dy=reduced?0:Math.sin(t*1.1)*1.1,bx=reduced?0:Math.sin(t*.85+1)*1,by=reduced?0:Math.sin(t*1.05+1)*1.6;
  const w=cursorSources.white,p=cursorSources.player2;ctx.drawImage(erase,w.x,w.y);ctx.globalAlpha=reduced?1:.92+.08*Math.sin(t*1.2);ctx.drawImage(white,w.x+dx,w.y+dy);
  ctx.globalAlpha=reduced?1:.86+.14*Math.sin(t*1.25+1);ctx.drawImage(blue,p.x+bx,p.y+by);ctx.globalAlpha=1;
  canvas.dataset.frame=String(++frames);canvas.dataset.player2X=String(p.x+bx);canvas.dataset.player2Y=String(p.y+by);canvas.dataset.source='0_4.png';
 }
 async function start(){try{const [_,source]=await Promise.all([image.decode(),prepareImage(cursorSources.player2.src)]);if(!alive||!image.isConnected)return;white=cut(image,cursorSources.white,'white');erase=cut(image,cursorSources.white,'erase');blue=cut(source,cursorSources.player2,'blue');visual.append(canvas);raf=requestAnimationFrame(frame);}catch(error){if(alive)console.error('Prologue cursor source failed',error);}}
 start();return()=>{alive=false;cancelAnimationFrame(raf);canvas.remove();};
}
