import {canvas,place,polygon,bounds,WIDTH,HEIGHT} from './retry-atmosphere-layers.js';
export function swordBreathFrames(){
 return[{transform:'translateY(0px)'},{transform:'translateY(-7px)',offset:.5},{transform:'translateY(0px)'}];
}
// The original arm, grip and sword are one rigid paper cutout. Animation only
// translates that canvas; no resampling, displacement field, scale or rotation.
export function addSwordBreathing(root,source,art,animate){
 if(!art.sword?.outline)return;
 const points=art.sword.outline,raw=bounds(points),box=[Math.max(0,raw[0]-3),Math.max(0,raw[1]-3),Math.min(WIDTH,raw[0]+raw[2]+3)-Math.max(0,raw[0]-3),Math.min(HEIGHT,raw[1]+raw[3]+3)-Math.max(0,raw[1]-3)], [x,y,w,h]=box;
 const mask=canvas(w,h),mc=mask.getContext('2d',{willReadFrequently:true});mc.translate(-x,-y);polygon(mc,points);mc.fill();mc.lineWidth=4;mc.lineJoin='round';mc.stroke();const matte=mc.getImageData(0,0,w,h).data;
 const part=canvas(w,h),pc=part.getContext('2d',{willReadFrequently:true});pc.drawImage(source,x,y,w,h,0,0,w,h);const native=pc.getImageData(0,0,w,h);
 // The duo is cream paper: exclude the neighbouring black post and red rope.
 if(art.sword.paper)for(let k=0;k<native.data.length;k+=4)if(Math.min(native.data[k],native.data[k+1],native.data[k+2])<140)matte[k+3]=0;
 const repair=canvas(w,h),rc=repair.getContext('2d'),backing=rc.createImageData(w,h),all=source.getContext('2d',{willReadFrequently:true}).getImageData(0,y,WIDTH,h).data;
 // Reconstruct only the vacated strip from adjacent native background rows.
 // Both ends are sampled outside the cutout, preserving wall/road transitions.
 for(let row=0;row<h;row++){
  let col=0;while(col<w){if(!matte[(row*w+col)*4+3]){col++;continue;}const start=col;while(col<w&&matte[(row*w+col)*4+3])col++;const end=col-1,left=x+start-5,right=Math.min(WIDTH-1,x+end+5),a=(row*WIDTH+Math.max(0,left))*4,b=(row*WIDTH+right)*4;
   for(let px=start;px<=end;px++){const k=(row*w+px)*4,t=left<0?1:(px-start)/Math.max(1,end-start);for(let c=0;c<3;c++)backing.data[k+c]=Math.round(all[a+c]*(1-t)+all[b+c]*t);backing.data[k+3]=matte[k+3];}
  }
 }
 for(let k=3;k<native.data.length;k+=4)native.data[k]=Math.round(native.data[k]*matte[k]/255);
 rc.putImageData(backing,0,0);place(repair,box);repair.dataset.swordBacking='native-background';root.append(repair);
 pc.putImageData(native,0,0);place(part,box);part.dataset.swordBreath='rigid';root.append(part);
 animate(part,'sword-breath',swordBreathFrames(),{duration:art.sword.duration,easing:'ease-in-out'});
}
export function addLoadingDots(root,source,art,animate){
 (art.loadingDots||[]).forEach(([x,y],i)=>{
  const paper=canvas(16,16),pc=paper.getContext('2d');pc.beginPath();pc.arc(8,8,7.8,0,Math.PI*2);pc.clip();pc.drawImage(source,x-8,y+10,16,10,0,0,16,16);place(paper,[x-8,y-8,16,16]);root.append(paper);
  const dot=canvas(16,16),ctx=dot.getContext('2d',{willReadFrequently:true});ctx.drawImage(source,x-8,y-8,16,16,0,0,16,16);const image=ctx.getImageData(0,0,16,16);for(let p=0;p<image.data.length;p+=4)image.data[p+3]=Math.round(255*Math.max(0,Math.min(1,(140-Math.max(image.data[p],image.data[p+1],image.data[p+2]))/35)));ctx.putImageData(image,0,0);place(dot,[x-8,y-8,16,16]);dot.dataset.loadingDot=String(i);root.append(dot);
  animate(dot,'friend-loading',[{opacity:.2},{opacity:1,offset:.23},{opacity:.2,offset:.55},{opacity:.2}],{duration:1500,delay:i*240,easing:'ease-in-out'});
 });
}
