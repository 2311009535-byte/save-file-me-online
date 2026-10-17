// Source pixels only, excluding both brackets: no second font-rendered word.
const area={x:209,y:127,w:74,h:23};
export function mountWonderWordGlitch(visual){return mountWordGlitch(visual,area,'wonder');}
export function mountEscapeWordGlitch(visual){return mountWordGlitch(visual,{x:312,y:127,w:75,h:23},'escape');}
export function mountRetryWordGlitch(visual){return mountWordGlitch(visual,{x:434,y:127,w:180,h:23},'retry',{weak:true});}
function mountWordGlitch(visual,area,word,{weak=false}={}){
 const image=visual.querySelector('.scene-image'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let alive=true,canvas=null,ctx=null,source=null,timer=0,frames=0,bursts=0,nextBurst=0,burstEnd=0;
 function schedule(fn,ms){clearTimeout(timer);if(alive&&!document.hidden&&!reduced.matches)timer=setTimeout(fn,ms);}
 function clear(){ctx?.clearRect(0,0,area.w,area.h);if(canvas)canvas.dataset.phase='clear';}
 function tick(){
  if(!alive||document.hidden||reduced.matches){clear();return;}
  const now=performance.now();
  if(!nextBurst)nextBurst=now+(weak?750:500)+Math.random()*(weak?650:500);
  if(now>=nextBurst){
   bursts++;burstEnd=now+100+Math.random()*100;nextBurst=now+(weak?750:500)+Math.random()*(weak?650:500);
   canvas.dataset.bursts=String(bursts);canvas.dataset.lastBurst=String(now);canvas.dataset.burstDuration=String(burstEnd-now);
  }
  const intense=now<burstEnd,out=ctx.createImageData(area.w,area.h),src=source.data;
  const sliceY=5+Math.floor(Math.random()*10),dx=Math.random()<.5?-2:2;
  const shift=intense&&!weak?2:1;
  const direction=intense?(Math.random()<.5?-1:1):(Math.sin(now/150)<0?-1:1);
  const alpha=intense?(weak?135:220):(weak?22:48)+Math.sin(now/110)*(weak?8:18);
  for(let y=0;y<area.h;y++)for(let x=0;x<area.w;x++){
   const i=(y*area.w+x)*4,offset=intense&&((y>=sliceY&&y<sliceY+2)||(y>=sliceY+5&&y<sliceY+7))?dx:0;
   const sample=(distance,c)=>src[(y*area.w+Math.max(0,Math.min(area.w-1,x-offset+distance)))*4+c];
   out.data[i]=sample(-shift*direction,0);out.data[i+1]=sample(shift*direction,1);out.data[i+2]=sample(0,2);
   const feather=Math.max(0,Math.min(1,x/3,(area.w-1-x)/3,y/2,(area.h-1-y)/2));out.data[i+3]=feather*alpha;
  }
  if(weak&&intense)for(let n=0;n<9;n++){const x=4+Math.floor(Math.random()*(area.w-8)),y=4+Math.floor(Math.random()*(area.h-8)),i=(y*area.w+x)*4;if(src[i]+src[i+1]+src[i+2]>130){out.data[i]=200;out.data[i+1]=Math.random()<.5?50:170;out.data[i+2]=60;out.data[i+3]=110;}}
  ctx.putImageData(out,0,0);canvas.dataset.phase=intense?'burst':'edge';canvas.dataset.frames=String(++frames);
  const boundary=intense?Math.min(burstEnd,nextBurst):nextBurst;
  schedule(tick,Math.max(1,Math.min(40,boundary-now)));
 }
 async function start(){
  try{await image.decode();}catch{return;}if(!alive||!image.isConnected)return;
  const capture=document.createElement('canvas');capture.width=area.w;capture.height=area.h;
  const c=capture.getContext('2d');c.drawImage(image,area.x,area.y,area.w,area.h,0,0,area.w,area.h);source=c.getImageData(0,0,area.w,area.h);
  canvas=document.createElement('canvas');canvas.width=area.w;canvas.height=area.h;canvas.className='prologue-word-glitch';canvas.dataset.word=word;canvas.setAttribute('aria-hidden','true');
  Object.assign(canvas.style,{position:'absolute',pointerEvents:'none',left:area.x/1536*100+'%',top:area.y/1024*100+'%',width:area.w/1536*100+'%',height:area.h/1024*100+'%'});
  ctx=canvas.getContext('2d');visual.append(canvas);tick();
 }
 function visibility(){clearTimeout(timer);clear();if(canvas&&!document.hidden){nextBurst=0;burstEnd=0;tick();}}
 document.addEventListener('visibilitychange',visibility);reduced.addEventListener('change',visibility);start();
 return ()=>{alive=false;clearTimeout(timer);canvas?.remove();document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',visibility);};
}
