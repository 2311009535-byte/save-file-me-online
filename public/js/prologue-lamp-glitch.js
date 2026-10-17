// Native 0_2 coordinates. The polygon mask follows shade, stem and base;
// source-colored fragments may extend slightly beyond the silhouette.
const area={x:540,y:274,w:165,h:398};
const baseShapes=[[[46,12],[122,12],[146,97],[20,97]],[[76,95],[93,95],[93,368],[76,368]],[[50,361],[118,361],[126,384],[42,384]]];
function contains(x,y,points){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
export function mountLampGlitch(visual){
 const isThird=visual.querySelector('.scene-image')?.getAttribute('src')?.endsWith('0_3.jpg');
 const shapes=isThird?[[[40,12],[126,12],[148,91],[14,91]],[[73,88],[91,88],[91,344],[73,344]],[[48,338],[113,338],[124,357],[38,357]]]:baseShapes;
 const image=visual.querySelector('.scene-image'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let alive=true,timer=0,canvas=null,ctx=null,source=null,mask=null,frames=0;
 function stop(){clearTimeout(timer);ctx?.clearRect(0,0,area.w,area.h);}
 function tick(){
  if(!alive||document.hidden||reduced.matches){stop();return;}
  const now=performance.now(),intense=Math.random()<.64,shift=intense?1+Math.floor(Math.random()*3):1;
  const slices=Array.from({length:5},()=>({y:10+Math.floor(Math.random()*374),h:1+Math.floor(Math.random()*3),dx:Math.random()<.5?-4:4}));
  const out=ctx.createImageData(area.w,area.h),pixels=source.data,phase=Math.floor(now/30),gain=.95+Math.random()*.12;
  const sample=(x,y,c)=>pixels[(y*area.w+Math.max(0,Math.min(area.w-1,x)))*4+c];
  for(let y=0;y<area.h;y++)for(let x=0;x<area.w;x++){
   const i=(y*area.w+x)*4,m=mask[y*area.w+x];if(!m)continue;
   const offset=slices.find(s=>y>=s.y&&y<s.y+s.h)?.dx||0,light=Math.max(pixels[i],pixels[i+1],pixels[i+2]);
   out.data[i]=Math.min(255,sample(x-offset-shift,y,0)*gain);out.data[i+1]=Math.min(255,sample(x-offset+shift,y,1)*gain);out.data[i+2]=sample(x-offset,y,2);out.data[i+3]=m*(intense?145:85)*Math.min(1,light/40);
   if(Math.random()<.18){const red=Math.random()<.5;out.data[i]=red?225:40;out.data[i+1]=red?40:210;out.data[i+2]=60;out.data[i+3]=m*(25+Math.random()*60)*(light>160?.3:1);}
   else if((y+phase)%5===0){out.data[i]=phase%2?170:30;out.data[i+1]=phase%2?40:160;out.data[i+2]=40;out.data[i+3]=m*(light>160?12:40);}
  }
  ctx.putImageData(out,0,0);
  ctx.save();ctx.beginPath();for(const polygon of shapes){ctx.moveTo(...polygon[0]);polygon.slice(1).forEach(p=>ctx.lineTo(...p));ctx.closePath();}ctx.clip();
  const glow=ctx.createRadialGradient(84,65,0,84,65,23);glow.addColorStop(0,`rgba(255,173,69,${.12+.045*Math.sin(now/450)})`);glow.addColorStop(1,'rgba(255,173,69,0)');ctx.fillStyle=glow;ctx.fillRect(59,40,50,50);
  if(Math.random()<.38){ctx.font='10px monospace';ctx.fillStyle=Math.random()<.5?'#f4575b88':'#60e68788';const y=Math.random()<.6?36+Math.random()*49:110+Math.random()*237;ctx.fillText(['|','+--','01','//','_'][Math.floor(Math.random()*5)],y<100?49+Math.random()*52:78,y);}
  ctx.restore();canvas.dataset.frames=String(++frames);canvas.dataset.phase=intense?'burst':'signal';
  timer=setTimeout(tick,30+Math.random()*8);
 }
 async function start(){
  try{await image.decode();}catch{return;}if(!alive||!image.isConnected)return;
  const capture=document.createElement('canvas');capture.width=area.w;capture.height=area.h;const c=capture.getContext('2d');c.drawImage(image,area.x,area.y,area.w,area.h,0,0,area.w,area.h);source=c.getImageData(0,0,area.w,area.h);
  mask=new Float32Array(area.w*area.h);
  for(let y=0;y<area.h;y++)for(let x=0;x<area.w;x++){
   const i=(y*area.w+x)*4,light=Math.max(source.data[i],source.data[i+1],source.data[i+2]);const silhouette=shapes.some(p=>contains(x,y,p))?.9:0;
   const feather=Math.max(0,Math.min(1,x/12,(area.w-1-x)/12,y/8,(area.h-1-y)/8));mask[y*area.w+x]=feather*Math.max(silhouette,light>45?Math.min(1,light/100):0);
  }
  canvas=document.createElement('canvas');canvas.className='prologue-lamp-glitch';canvas.width=area.w;canvas.height=area.h;canvas.setAttribute('aria-hidden','true');Object.assign(canvas.style,{position:'absolute',pointerEvents:'none',imageRendering:'pixelated',left:area.x/1536*100+'%',top:area.y/1024*100+'%',width:area.w/1536*100+'%',height:area.h/1024*100+'%'});ctx=canvas.getContext('2d');visual.append(canvas);tick();
 }
 function visibility(){stop();if(canvas&&!document.hidden)tick();}
 document.addEventListener('visibilitychange',visibility);reduced.addEventListener('change',visibility);start();
 return ()=>{alive=false;stop();canvas?.remove();document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',visibility);};
}
