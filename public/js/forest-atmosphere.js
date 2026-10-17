import {drawForestFireflies} from './forest-fireflies.js';
// Source-art smoke, projected through the same fixed camera as the cottage.
export function createForestAtmosphere(source,anchor={x:712,y:294,z:2200}){
 const puff=document.createElement('canvas');puff.width=44;puff.height=43;
 puff.getContext('2d').drawImage(source,1408,370,44,43,0,0,44,43);
 let overlay,ctx;
 return {
  update(camera,time,canvas){
   if(!overlay){overlay=document.createElement('canvas');overlay.width=1672;overlay.height=941;overlay.setAttribute('aria-hidden','true');overlay.style.cssText='position:absolute;pointer-events:none;';canvas.after(overlay);ctx=overlay.getContext('2d');}
   overlay.style.width=canvas.clientWidth+'px';overlay.style.height=canvas.clientHeight+'px';ctx.clearRect(0,0,1672,941);
   drawForestFireflies(ctx,camera,time);
   const depth=anchor.z-camera.z;if(depth<60)return;
   const scale=900/depth;ctx.imageSmoothingEnabled=false;
   for(let i=0;i<6;i++){
    const age=(time*.16+i/6)%1,fade=Math.sin(Math.PI*age)*.8;
    const x=anchor.x+age*30+Math.sin(age*4+i)*5,y=anchor.y+age*85,size=24+age*40;
    ctx.globalAlpha=fade;
    ctx.drawImage(puff,836+(x-camera.x)*scale-size*scale/2,240-(y-camera.y)*scale-size*scale,size*scale,size*scale);
   }
   ctx.globalAlpha=1;
  },
  dispose(){overlay?.remove();overlay=ctx=null;}
 };
}
