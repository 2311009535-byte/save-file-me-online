import {prepareImage} from './image-cache.js';
// Source-relative, compact deformation fields. Hands, elbows and the chair
// sit outside the fields, so each accepted sheet changes only the upper pose.
export function fatigueOffset(x,y){
 const bump=(cx,cy,rx,ry)=>Math.max(0,1-((x-cx)/rx)**2-((y-cy)/ry)**2)**2;
 const head=bump(.532,.303,.037,.055),shoulders=bump(.515,.383,.062,.066),back=bump(.490,.416,.038,.047);
 return[3*head-3*shoulders-12*back,12*head+7*shoulders-3*back];
}
const crop={x:.44,y:.245,w:.15,h:.245},W=384,H=353;
let prepared;
function sourcePatch(){return prepared??=prepareImage('/assets/escape/room-clean.png').then(image=>{
 const c=document.createElement('canvas');c.width=W;c.height=H;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,image.naturalWidth*crop.x,image.naturalHeight*crop.y,image.naturalWidth*crop.w,image.naturalHeight*crop.h,0,0,W,H);
 const pixels=ctx.getImageData(0,0,W,H),dx=new Float32Array(W*H),dy=new Float32Array(W*H);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const p=y*W+x,[ox,oy]=fatigueOffset(crop.x+x/W*crop.w,crop.y+y/H*crop.h);dx[p]=ox*W/(1920*crop.w);dy[p]=oy*H/(1080*crop.h);}
 return{pixels,dx,dy};
}).catch(error=>{prepared=null;throw error;});}
export function mountFatigue(visual,count,{animate=false,canAnimate=()=>true}={}){
 if(!count)return()=>{};
 const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;canvas.className='escape-fatigue';canvas.dataset.count=String(count);canvas.setAttribute('aria-hidden','true');Object.assign(canvas.style,{position:'absolute',left:crop.x*100+'%',top:crop.y*100+'%',width:crop.w*100+'%',height:crop.h*100+'%',pointerEvents:'none'});
 let alive=true,raf=0,elapsed=0,last=null;
 sourcePatch().then(({pixels,dx,dy})=>{
  if(!alive)return;visual.querySelector('.scene-image')?.after(canvas);const ctx=canvas.getContext('2d'),output=ctx.createImageData(W,H),src=pixels.data,dst=output.data;
  function paint(strength){
   for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    const p=y*W+x,sx=Math.max(0,Math.min(W-1,x-dx[p]*strength)),sy=Math.max(0,Math.min(H-1,y-dy[p]*strength)),ix=Math.floor(sx),iy=Math.floor(sy),fx=sx-ix,fy=sy-iy;
    const a=(iy*W+ix)*4,b=(iy*W+Math.min(W-1,ix+1))*4,c=(Math.min(H-1,iy+1)*W+ix)*4,d=(Math.min(H-1,iy+1)*W+Math.min(W-1,ix+1))*4;
    for(let k=0;k<3;k++)dst[p*4+k]=Math.round((src[a+k]*(1-fx)+src[b+k]*fx)*(1-fy)+(src[c+k]*(1-fx)+src[d+k]*fx)*fy);dst[p*4+3]=255;
   }
   ctx.putImageData(output,0,0);canvas.dataset.strength=strength.toFixed(4);
  }
  const target=Math.min(7,count)/7,reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
  if(!animate||reduced){paint(target);canvas.dataset.phase='resting';return;}
  const start=Math.max(0,count-1)/7;paint(start);canvas.dataset.phase='waiting';
  function frame(now){
   if(!alive)return;const dt=last===null?0:Math.min(80,now-last);last=now;
   if(!document.hidden&&canAnimate()){elapsed+=dt;const t=Math.min(1,elapsed/1150),ease=1-(1-t)**3;paint(start+(target-start)*ease+Math.sin(Math.PI*t)**2*.28);canvas.dataset.phase=t<1?'sinking':'resting';if(t>=1)return;}
   raf=requestAnimationFrame(frame);
  }
  raf=requestAnimationFrame(frame);
 }).catch(()=>{});
 return()=>{alive=false;cancelAnimationFrame(raf);canvas.remove();};
}
