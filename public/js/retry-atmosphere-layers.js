// Native artboard helpers. Layer sampling happens once, while WAAPI only moves
// the resulting paper canvases. No per-frame image repaint or moving UI.
export const WIDTH=1672,HEIGHT=941;
export const canvas=(w=WIDTH,h=HEIGHT)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
export function polygon(ctx,points){ctx.beginPath();points.forEach(([x,y],i)=>ctx[i?'lineTo':'moveTo'](x,y));ctx.closePath();}
export function bounds(points){const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);const x=Math.max(0,Math.floor(Math.min(...xs))),y=Math.max(0,Math.floor(Math.min(...ys)));return[x,y,Math.min(WIDTH-x,Math.ceil(Math.max(...xs)-x)),Math.min(HEIGHT-y,Math.ceil(Math.max(...ys)-y))];}
export function place(el,[x,y,w,h]){Object.assign(el.style,{position:'absolute',left:x/WIDTH*100+'%',top:y/HEIGHT*100+'%',width:w/WIDTH*100+'%',height:h/HEIGHT*100+'%'});}
export function sample(source,points,{cream=false}={}){
 const box=bounds(points),[x,y,w,h]=box,c=canvas(w,h),ctx=c.getContext('2d',{willReadFrequently:cream});ctx.translate(-x,-y);polygon(ctx,points);ctx.clip();ctx.drawImage(source,0,0);
 if(cream){const pixels=ctx.getImageData(0,0,w,h);for(let i=0;i<pixels.data.length;i+=4)pixels.data[i+3]*=Math.max(0,Math.min(1,(Math.min(pixels.data[i],pixels.data[i+1],pixels.data[i+2])-100)/45));ctx.putImageData(pixels,0,0);}
 return{c,box};
}
// A shared period and evenly distributed phases keep buildings visible forever,
// rather than allowing independent periods to drift into one empty skyline.
export const withdrawFrames=height=>[
 {offset:0,transform:'translateY(0px)'},{offset:.12,transform:'translateY(0px)',easing:'cubic-bezier(.45,0,.25,1)'},
 {offset:.32,transform:`translateY(${height+16}px)`},{offset:.43,transform:`translateY(${height+16}px)`,easing:'cubic-bezier(.45,0,.25,1)'},
 {offset:.64,transform:'translateY(0px)'},{offset:1,transform:'translateY(0px)'}
];
export function addBuildings(root,source,background,art,animate){
 const active=art.towers.map((_,i)=>i).filter(i=>!art.stillTowers.includes(i));
 art.towers.forEach((points,index)=>{
  const {c,box}=sample(source,points),ctx=c.getContext('2d',{willReadFrequently:true}),pixels=ctx.getImageData(0,0,c.width,c.height),base=background.getContext('2d',{willReadFrequently:true}).getImageData(...box);
  for(let i=0;i<pixels.data.length;i+=4){const delta=Math.max(Math.abs(pixels.data[i]-base.data[i]),Math.abs(pixels.data[i+1]-base.data[i+1]),Math.abs(pixels.data[i+2]-base.data[i+2]));const red=pixels.data[i]>120&&pixels.data[i]>pixels.data[i+1]*1.5&&pixels.data[i]>pixels.data[i+2]*1.5;pixels.data[i+3]*=red?0:Math.max(0,Math.min(1,(delta-16)/12));}ctx.putImageData(pixels,0,0);
  const viewport=document.createElement('div');viewport.className='retry-building-slot';viewport.dataset.building=String(index);place(viewport,box);
  Object.assign(c.style,{width:'100%',height:'100%',display:'block'});viewport.append(c);root.append(viewport);
  if(art.stillTowers.includes(index)){c.dataset.atmosphereKind='building-static';return;}
  animate(c,'building-withdraw',withdrawFrames(box[3]),{duration:10500,delay:-10500*active.indexOf(index)/active.length,easing:'linear'});
 });
}
export function addSkyBands(root,source,bands,animate){
 bands.forEach((points,index)=>{
  const {c,box}=sample(source,points,{cream:true}),[x,y,w,h]=box;
  for(let side=0;side<2;side++){
   const half=canvas(w,h),ctx=half.getContext('2d'),seam=Array.from({length:Math.ceil(h/5)+1},(_,i)=>[w*.53+Math.sin(i*4.1+index)*3.4,Math.min(h,i*5)]);
   polygon(ctx,side?[[w,0],[w,h],...seam.toReversed()]:[[0,0],...seam,[0,h]]);ctx.clip();ctx.drawImage(c,0,0);place(half,box);half.dataset.skyBand=String(index);root.append(half);
   const sign=side?1:-1;
   animate(half,'sky-paper',[{offset:0,transform:'none'},{offset:.22,transform:'none'},{offset:.43,transform:`translate(${sign*16}px,${sign*4}px) rotate(${sign*.7}deg)`},{offset:.60,transform:`translate(${sign*22}px,${sign*6}px) rotate(${sign*.9}deg)`},{offset:.87,transform:'none'},{offset:1,transform:'none'}],{duration:6800+index*430,delay:index*540,easing:'ease-in-out'});
  }
 });
}
function matteMessage(c){
 const ctx=c.getContext('2d',{willReadFrequently:true}),data=ctx.getImageData(0,0,c.width,c.height),n=c.width*c.height,paper=new Uint8Array(n),outside=new Uint8Array(n),queue=new Int32Array(n);let head=0,tail=0;
 for(let p=0;p<n;p++){const i=p*4;paper[p]=data.data[i+3]>0&&Math.min(data.data[i],data.data[i+1],data.data[i+2])>137&&data.data[i]-data.data[i+2]>8?1:0;}
 const push=p=>{if(!paper[p]&&!outside[p]){outside[p]=1;queue[tail++]=p;}};
 for(let x=0;x<c.width;x++){push(x);push((c.height-1)*c.width+x);}for(let y=0;y<c.height;y++){push(y*c.width);push(y*c.width+c.width-1);}
 while(head<tail){const p=queue[head++],x=p%c.width,y=Math.floor(p/c.width);if(x)push(p-1);if(x<c.width-1)push(p+1);if(y)push(p-c.width);if(y<c.height-1)push(p+c.width);}
 for(let p=0;p<n;p++){const i=p*4,x=p%c.width;const avatar=x<74&&Math.max(data.data[i],data.data[i+1],data.data[i+2])<112;data.data[i+3]*=(!outside[p]||avatar)?1:0;}
 ctx.putImageData(data,0,0);
}
// Only the ink moves. The message paper, avatars and phone are static.
export function addMessages(root,source,art,animate,background){
 // The opaque empty phone screen occludes buildings sliding behind the phone.
 const panel=sample(background,art.phone);place(panel.c,panel.box);root.append(panel.c);
 const screen=document.createElement('div');screen.className='retry-message-screen';screen.style.clipPath='polygon('+art.phone.map(([x,y])=>`${x/WIDTH*100}% ${y/HEIGHT*100}%`).join(',')+')';root.append(screen);
 art.messages.forEach((points,index)=>{
  const {c,box}=sample(source,points);matteMessage(c);place(c,box);c.dataset.message=String(index);screen.append(c);
  if(index!==0&&index!==2)return;
  const ctx=c.getContext('2d',{willReadFrequently:true}),data=ctx.getImageData(0,0,c.width,c.height),ink=canvas(c.width,c.height),inkCtx=ink.getContext('2d'),marks=inkCtx.createImageData(c.width,c.height);
  // Paper grain comes from the blank second message, not a flat painted fill.
  const markMask=canvas(c.width,c.height),maskCtx=markMask.getContext('2d');maskCtx.translate(-box[0],-box[1]);polygon(maskCtx,art.messageInk[index/2]);maskCtx.fill();const mask=maskCtx.getImageData(0,0,c.width,c.height).data;
  const blank=art.messages[1],paperX=blank[2][0]+25,paperY=blank[2][1]+20;
  const texture=canvas(c.width,c.height),tc=texture.getContext('2d');tc.drawImage(source,paperX,paperY,85,24,0,0,c.width,c.height);const paper=tc.getImageData(0,0,c.width,c.height);
  for(let y=0;y<c.height;y++)for(let x=90;x<c.width-12;x++){
   const i=(y*c.width+x)*4;if(!data.data[i+3]||!mask[i+3])continue;
   const alpha=Math.max(0,Math.min(1,(160-Math.max(data.data[i],data.data[i+1],data.data[i+2]))/38));
   if(!alpha)continue;for(let k=0;k<3;k++){marks.data[i+k]=data.data[i+k];data.data[i+k]=Math.round(data.data[i+k]*(1-alpha)+paper.data[i+k]*alpha);}marks.data[i+3]=Math.round(data.data[i+3]*alpha);
  }
  ctx.putImageData(data,0,0);inkCtx.putImageData(marks,0,0);place(ink,box);ink.dataset.messageInk=String(index);screen.append(ink);
  animate(ink,'message-ink',[{transform:'none'},{offset:.19,transform:'translate(1px,-1px) skewX(1deg) scaleY(1.025)'},{offset:.37,transform:'translate(-1px,1px) skewX(-1.4deg) scaleX(.985)'},{offset:.56,transform:'translate(1px,0px) skewX(.8deg)'},{offset:.78,transform:'translate(0px,-1px) scaleY(.98)'},{transform:'none'}],{duration:2600+index*310,delay:-index*430,easing:'steps(5,end)'});
 });
}
export function nativePaper(source,points){
 const {c,box}=sample(source,points),ctx=c.getContext('2d',{willReadFrequently:true}),pixels=ctx.getImageData(0,0,c.width,c.height);
 for(let i=0;i<pixels.data.length;i+=4){const r=pixels.data[i],g=pixels.data[i+1],b=pixels.data[i+2];const paper=Math.max(0,Math.min(1,(Math.min(r,g,b)-95)/55));const red=r>g*1.3&&r>b*1.3&&r>125;pixels.data[i+3]*=red?1:paper;}ctx.putImageData(pixels,0,0);return{c,box};
}
export function addCalendar(root,source,art,animate){
 const field=document.createElement('div');field.className='retry-calendar-flutter';root.append(field);
 art.loosePages.forEach((points,i)=>{const {c,box}=nativePaper(source,points);place(c,box);c.style.transformOrigin='50% 40%';field.append(c);const sign=i%2?1:-1;
  animate(c,'calendar-paper',[{transform:'none'},{offset:.26,transform:`translate(${sign*5}px,-7px) rotate(${sign*2.2}deg) scaleX(.97)`},{offset:.57,transform:`translate(${-sign*4}px,5px) rotate(${-sign*1.8}deg) scaleX(.92)`},{offset:.81,transform:`translate(${sign*3}px,2px) rotate(${sign*.8}deg) scaleX(.98)`},{transform:'none'}],{duration:4600+i*530,delay:-i*870,easing:'ease-in-out'});
 });
}
export function addFlags(root,source,art,animate){
 art.flags.forEach((points,i)=>{const {c,box}=sample(source,points),ctx=c.getContext('2d',{willReadFrequently:true}),pixels=ctx.getImageData(0,0,c.width,c.height);
  for(let k=0;k<pixels.data.length;k+=4)pixels.data[k+3]*=pixels.data[k]>pixels.data[k+1]*1.5&&pixels.data[k]>pixels.data[k+2]*1.5?1:0;ctx.putImageData(pixels,0,0);place(c,box);c.style.transformOrigin='0 50%';root.append(c);
  animate(c,'red-flag',[{transform:'none'},{offset:.24,transform:'skewY(-7deg) scaleX(.9)'},{offset:.51,transform:'skewY(5deg) scaleX(.98)'},{offset:.77,transform:'skewY(-3deg) scaleX(.94)'},{transform:'none'}],{duration:2100+i*390,delay:-i*650,easing:'ease-in-out'});
 });
}
// Hair tips are cut from the original cream silhouettes. Their roots stay
// anchored beside the head; separate periods keep the two players natural.
export function addHair(root,source,art,animate){
 (art.hair||[]).forEach((points,i)=>{const {c,box}=sample(source,points),ctx=c.getContext('2d',{willReadFrequently:true}),pixels=ctx.getImageData(0,0,c.width,c.height);for(let k=0;k<pixels.data.length;k+=4)pixels.data[k+3]*=Math.max(0,Math.min(1,(Math.min(pixels.data[k],pixels.data[k+1],pixels.data[k+2])-165)/30));ctx.putImageData(keepPaperComponents(pixels,400),0,0);place(c,box);c.dataset.playerHair=String(i+1);c.style.transformOrigin='100% 50%';root.append(c);
  animate(c,'player-hair',[{transform:'none'},{offset:.27,transform:'skewY(1.6deg) scaleY(.985)'},{offset:.56,transform:'skewY(-1.3deg) scaleY(1.015)'},{offset:.79,transform:'skewY(.7deg) scaleY(.995)'},{transform:'none'}],{duration:3400+i*850,delay:-i*1100,easing:'ease-in-out'});
 });
}
// Keep the connected paper sheets and player silhouettes, without accidentally
// restoring small white window marks on a building hidden behind them.
export function keepPaperComponents(data,minSize=240){
 const {width:w,height:h}=data,n=w*h,visited=new Uint8Array(n),queue=new Int32Array(n);
 for(let start=0;start<n;start++){
  if(visited[start]||!data.data[start*4+3])continue;let head=0,tail=1;queue[0]=start;visited[start]=1;
  while(head<tail){const p=queue[head++],x=p%w,y=Math.floor(p/w);for(const q of [x?p-1:-1,x<w-1?p+1:-1,y?p-w:-1,y<h-1?p+w:-1])if(q>=0&&!visited[q]&&data.data[q*4+3]){visited[q]=1;queue[tail++]=q;}}
  if(tail<minSize)for(let i=0;i<tail;i++)data.data[queue[i]*4+3]=0;
 }
 return data;
}
