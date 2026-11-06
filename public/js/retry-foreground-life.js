import {canvas,place} from './retry-atmosphere-layers.js';
// A small cached sprite strip keeps the native hand and blade together. The
// surrounding paper is sampled as well, so the printed pose never doubles.
export function swordLift(art,x,y){
 const {grip:g,tip:t,radius,hand:[hx,hy,rx,ry]}=art.sword,vx=t[0]-g[0],vy=t[1]-g[1],length=vx*vx+vy*vy;
 const along=Math.max(0,Math.min(1,((x-g[0])*vx+(y-g[1])*vy)/length)),dx=x-g[0]-along*vx,dy=y-g[1]-along*vy;
 const reach=radius*1.4,blade=Math.max(0,1-(dx*dx+dy*dy)/(reach*reach))**2,hand=Math.max(0,1-((x-hx)/rx)**2-((y-hy)/ry)**2)**2;
 const amount=Math.max(blade,hand);return amount?-16*amount:0;
}
export function addSwordBreathing(root,source,art,animate){
 if(!art.sword)return;
 const [x,y,w,h]=art.sword.box,W=Math.round(w*.7),H=Math.round(h*.7),steps=16,patch=canvas(W,H),pc=patch.getContext('2d',{willReadFrequently:true});pc.drawImage(source,x,y,w,h,0,0,W,H);const src=pc.getImageData(0,0,W,H).data,field=new Float32Array(W*H);
 for(let py=0;py<H;py++)for(let px=0;px<W;px++)field[py*W+px]=swordLift(art,x+px/W*w,y+py/H*h)*H/h;
 const strip=canvas(W*(steps+1),H),ctx=strip.getContext('2d');
 for(let frame=0;frame<=steps;frame++){
  const image=ctx.createImageData(W,H),out=image.data;
  for(let py=0;py<H;py++)for(let px=0;px<W;px++){
   const p=py*W+px;if(!field[p])continue;const sy=Math.max(0,Math.min(H-1,py-field[p]*(.5-.5*Math.cos(frame/steps*Math.PI)))),iy=Math.floor(sy),fy=sy-iy,a=(iy*W+px)*4,b=(Math.min(H-1,iy+1)*W+px)*4;
   for(let c=0;c<3;c++)out[p*4+c]=Math.round(src[a+c]*(1-fy)+src[b+c]*fy);out[p*4+3]=255;
  }
  ctx.putImageData(image,frame*W,0);
 }
 const viewport=document.createElement('div');place(viewport,art.sword.box);Object.assign(viewport.style,{overflow:'hidden',pointerEvents:'none'});viewport.dataset.swordBreath='native';Object.assign(strip.style,{width:(steps+1)*100+'%',height:'100%',display:'block'});viewport.append(strip);root.append(viewport);
 animate(strip,'sword-breath',[{transform:'translateX(0px)',easing:`steps(${steps},end)`},{transform:`translateX(${-steps*w}px)`,offset:.5,easing:`steps(${steps},end)`},{transform:'translateX(0px)'}],{duration:art.sword.duration,easing:'linear'});
}
export function addLoadingDots(root,source,art,animate){
 (art.loadingDots||[]).forEach(([x,y],i)=>{
  const paper=canvas(16,16),pc=paper.getContext('2d');pc.beginPath();pc.arc(8,8,7.8,0,Math.PI*2);pc.clip();pc.drawImage(source,x-8,y+10,16,10,0,0,16,16);place(paper,[x-8,y-8,16,16]);root.append(paper);
  const dot=canvas(16,16),ctx=dot.getContext('2d',{willReadFrequently:true});ctx.drawImage(source,x-8,y-8,16,16,0,0,16,16);const image=ctx.getImageData(0,0,16,16);for(let p=0;p<image.data.length;p+=4)image.data[p+3]=Math.round(255*Math.max(0,Math.min(1,(140-Math.max(image.data[p],image.data[p+1],image.data[p+2]))/35)));ctx.putImageData(image,0,0);place(dot,[x-8,y-8,16,16]);dot.dataset.loadingDot=String(i);root.append(dot);
  animate(dot,'friend-loading',[{opacity:.2},{opacity:1,offset:.23},{opacity:.2,offset:.55},{opacity:.2}],{duration:1500,delay:i*240,easing:'ease-in-out'});
 });
}
