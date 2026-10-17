// Native 0_1 coordinates: window + existing fragments, excluding WINDOW/BED text.
const area={x:50,y:246,w:460,h:270};
export function mountPrologueGlitch(visual){
 const image=visual.querySelector('.scene-image');
 let alive=true,timer=0,canvas=null,source=null,ctx=null,bursts=0,burstUntil=0,nextBurst=0,mask=null;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function clear(){if(ctx)ctx.clearRect(0,0,area.w,area.h);if(canvas)canvas.dataset.phase='stable';}
 function schedule(fn,ms){clearTimeout(timer);if(alive&&!document.hidden&&!reduced.matches)timer=setTimeout(fn,ms);}
 function tick(){
  if(!alive||document.hidden||reduced.matches){clear();return;}
  const now=performance.now();
  if(now>=nextBurst){burstUntil=now+100+Math.random()*140;nextBurst=burstUntil+45+Math.random()*150;bursts++;}
  const intense=now<burstUntil;
  const out=ctx.createImageData(area.w,area.h),pixels=source.data;
  const shift=intense?2+Math.floor(Math.random()*3):(Math.random()<.35?1:0),gain=intense?.91+Math.random()*.20:.98+Math.random()*.05;
  const slices=intense?Array.from({length:4},()=>({y:18+Math.floor(Math.random()*230),h:2+Math.floor(Math.random()*4),dx:Math.random()<.5?-5:5})):[];
  const strips=Array.from({length:5},()=>({x:25+Math.floor(Math.random()*365),y:16+Math.floor(Math.random()*236),w:16+Math.floor(Math.random()*65),h:1+Math.floor(Math.random()*2),red:Math.random()<.5}));
  const scanPhase=Math.floor(now/32)+Math.floor(Math.random()*3);
  const sample=(x,y,c)=>pixels[(y*area.w+Math.max(0,Math.min(area.w-1,x)))*4+c];
  for(let y=0;y<area.h;y++){
   const offset=slices.find(s=>y>=s.y&&y<s.y+s.h)?.dx||0;
   const strip=strips.find(s=>y>=s.y&&y<s.y+s.h);
   for(let x=0;x<area.w;x++){
    const i=(y*area.w+x)*4,m=mask[y*area.w+x];if(!m)continue;
    const r=sample(x-offset-shift,y,0),g=sample(x-offset+shift,y,1),b=sample(x-offset,y,2);
    if(intense||shift){const light=Math.max(r,g,b,pixels[i],pixels[i+1],pixels[i+2]);out.data[i]=Math.min(255,r*gain);out.data[i+1]=Math.min(255,g*gain);out.data[i+2]=Math.min(255,b*gain);out.data[i+3]=m*Math.min(1,light/38)*(intense?155:80);}
    // Fine colored snow remains active between stronger glitches. Preserve highlights.
    if(Math.random()<.18){const red=Math.random()<.5;out.data[i]=red?240:48;out.data[i+1]=red?42:225;out.data[i+2]=65;out.data[i+3]=m*(40+Math.random()*70)*(Math.max(pixels[i],pixels[i+1],pixels[i+2])>150?.2:1);}
    else if((y+scanPhase)%5===0&&x>84&&x<374&&y>30&&y<214){out.data[i]=scanPhase%2?170:25;out.data[i+1]=scanPhase%2?35:180;out.data[i+2]=48;out.data[i+3]=m*(24+Math.random()*26)*(Math.max(pixels[i],pixels[i+1],pixels[i+2])>150?.25:1);}
    if(strip&&x>=strip.x&&x<strip.x+strip.w){
     const highlight=Math.max(pixels[i],pixels[i+1],pixels[i+2])>150;
     out.data[i]=strip.red?235:30;out.data[i+1]=strip.red?35:220;out.data[i+2]=55;
     out.data[i+3]=m*(highlight?22:65+Math.random()*45)*Math.min(1,(x-strip.x+1)/5,(strip.x+strip.w-x)/5);
    }
   }
  }
  ctx.putImageData(out,0,0);
  // Fleeting fragments of the ASCII room, sparse enough to read the physical window.
  if(Math.random()<.48){ctx.font='11px monospace';ctx.fillStyle=Math.random()<.5?'#fa635766':'#59e98566';const x=95+Math.floor(Math.random()*245),y=42+Math.floor(Math.random()*158);ctx.fillText(['+--+','|_|','01','//','[ ]','--'][Math.floor(Math.random()*6)],x,y);}
  canvas.dataset.phase=intense?'burst':'signal';canvas.dataset.bursts=String(bursts);canvas.dataset.frames=String(Number(canvas.dataset.frames||0)+1);
  schedule(tick,30+Math.random()*8);
 }
 async function start(){
  try{await image.decode();}catch{return;}if(!alive||!image.isConnected)return;
  const capture=document.createElement('canvas');capture.width=area.w;capture.height=area.h;
  const c=capture.getContext('2d');c.drawImage(image,area.x,area.y,area.w,area.h,0,0,area.w,area.h);source=c.getImageData(0,0,area.w,area.h);
  mask=new Float32Array(area.w*area.h);
  for(let y=0;y<area.h;y++)for(let x=0;x<area.w;x++){
   const i=(y*area.w+x)*4,light=Math.max(source.data[i],source.data[i+1],source.data[i+2]);
   const glass=Math.max(0,Math.min(1,(x-84)/10,(374-x)/10,(y-28)/10,(216-y)/10));
   const edge=Math.max(0,Math.min(1,x/18,(area.w-1-x)/18,y/12,(area.h-1-y)/12));
   mask[y*area.w+x]=edge*Math.max(glass,Math.min(1,light/45));
  }
  canvas=document.createElement('canvas');canvas.className='prologue-window-glitch';canvas.width=area.w;canvas.height=area.h;canvas.setAttribute('aria-hidden','true');
  Object.assign(canvas.style,{left:area.x/1536*100+'%',top:area.y/1024*100+'%',width:area.w/1536*100+'%',height:area.h/1024*100+'%'});
  ctx=canvas.getContext('2d');visual.append(canvas);tick();
 }
 function visibility(){clearTimeout(timer);clear();if(canvas&&!document.hidden)tick();}
 document.addEventListener('visibilitychange',visibility);reduced.addEventListener('change',visibility);start();
 return ()=>{alive=false;clearTimeout(timer);canvas?.remove();document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',visibility);};
}
