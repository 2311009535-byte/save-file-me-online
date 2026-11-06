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
// Roof-to-foot direction follows the leaning walls in the illustration.
export function buildingAxis(points){
 const top=Math.min(...points.map(p=>p[1])),bottom=Math.max(...points.map(p=>p[1])),height=bottom-top;
 const middle=list=>{const sorted=list.map(p=>p[0]).sort((a,b)=>a-b);return sorted[Math.floor(sorted.length/2)];};
 const roof=middle(points.filter(p=>p[1]<top+height*.28)),foot=middle(points.filter(p=>p[1]>bottom-height*.28));
 return{x:Math.max(-height*.75,Math.min(height*.75,(foot-roof)/.65)),y:height+16};
}
export const withdrawFrames=(height,x=0)=>[
 {offset:0,transform:'translate(0px,0px)'},{offset:.12,transform:'translate(0px,0px)',easing:'cubic-bezier(.45,0,.25,1)'},
 {offset:.32,transform:`translate(${x}px,${height+16}px)`},{offset:.43,transform:`translate(${x}px,${height+16}px)`,easing:'cubic-bezier(.45,0,.25,1)'},
 {offset:.64,transform:'translate(0px,0px)'},{offset:1,transform:'translate(0px,0px)'}
];
export function addBuildings(root,source,background,art,animate){
 const active=art.towers.map((_,i)=>i).filter(i=>!art.stillTowers.includes(i));
 art.towers.forEach((points,index)=>{
  const {c,box}=sample(source,points),ctx=c.getContext('2d',{willReadFrequently:true}),pixels=ctx.getImageData(0,0,c.width,c.height),base=background.getContext('2d',{willReadFrequently:true}).getImageData(...box);
  for(let i=0;i<pixels.data.length;i+=4){const delta=Math.max(Math.abs(pixels.data[i]-base.data[i]),Math.abs(pixels.data[i+1]-base.data[i+1]),Math.abs(pixels.data[i+2]-base.data[i+2]));const red=pixels.data[i]>120&&pixels.data[i]>pixels.data[i+1]*1.5&&pixels.data[i]>pixels.data[i+2]*1.5;pixels.data[i+3]*=red?0:Math.max(0,Math.min(1,(delta-16)/12));}ctx.putImageData(pixels,0,0);
  const viewport=document.createElement('div');viewport.className='retry-building-slot';viewport.dataset.building=String(index);place(viewport,box);
  Object.assign(c.style,{width:'100%',height:'100%',display:'block'});viewport.append(c);root.append(viewport);
  if(art.stillTowers.includes(index)){c.dataset.atmosphereKind='building-static';return;}
  const axis=buildingAxis(points);c.dataset.withdrawX=String(axis.x);c.dataset.withdrawY=String(axis.y);
  animate(c,'building-withdraw',withdrawFrames(box[3],axis.x),{duration:10500,delay:-10500*active.indexOf(index)/active.length,easing:'linear'});
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
// A repeating strip scrolls along the phone's own tilted vertical axis.
export function addMessages(root,source,art,animate,background){
 const panel=sample(background,art.phone);place(panel.c,panel.box);root.append(panel.c);
 const screen=document.createElement('div');screen.className='retry-message-screen';screen.style.clipPath='polygon('+art.phone.map(([x,y])=>`${x/WIDTH*100}% ${y/HEIGHT*100}%`).join(',')+')';root.append(screen);
 const tape=document.createElement('div');Object.assign(tape.style,{position:'absolute',inset:0});screen.append(tape);
 const rows=art.messages.length,first=art.messages[0][0],last=art.messages.at(-1)[0],dx=(first[0]-last[0])*rows/(rows-1),dy=(first[1]-last[1])*rows/(rows-1);
 tape.dataset.scrollX=String(dx);tape.dataset.scrollY=String(dy);
 for(const copy of [-1,0,1]){
  const group=document.createElement('div');Object.assign(group.style,{position:'absolute',inset:0,transform:`translate(${-dx*copy}px,${-dy*copy}px)`});group.dataset.messageCopy=String(copy);tape.append(group);
  art.messages.forEach((points,index)=>{const {c,box}=sample(source,points);matteMessage(c);place(c,box);c.dataset.message=String(index);group.append(c);});
 }
 animate(tape,'message-scroll',[{transform:'translate(0px,0px)'},{transform:`translate(${dx}px,${dy}px)`}],{duration:10500,easing:'linear'});
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
  animate(c,'red-flag',[{transform:'none'},{offset:.24,transform:'skewY(-7deg) scaleX(.9)'},{offset:.51,transform:'skewY(5deg) scaleX(.98)'},{offset:.77,transform:'skewY(-3deg) scaleX(.94)'},{transform:'none'}],{duration:900+i*130,delay:-i*310,easing:'ease-in-out'});
 });
}
// Hair tips are cut from the original cream silhouettes. Their roots stay
// anchored beside the head; separate periods keep the two players natural.
export function addHair(root,source,art,animate){
 (art.hair||[]).forEach((points,i)=>{const {c,box}=sample(source,points),ctx=c.getContext('2d',{willReadFrequently:true}),pixels=ctx.getImageData(0,0,c.width,c.height);for(let k=0;k<pixels.data.length;k+=4)pixels.data[k+3]*=Math.max(0,Math.min(1,(Math.min(pixels.data[k],pixels.data[k+1],pixels.data[k+2])-165)/30));ctx.putImageData(keepPaperComponents(pixels,400),0,0);place(c,box);c.dataset.playerHair=String(i+1);c.style.transformOrigin='100% 50%';root.append(c);
  animate(c,'player-hair',[{transform:'none'},{offset:.27,transform:'skewY(1.6deg) scaleY(.985)'},{offset:.56,transform:'skewY(-1.3deg) scaleY(1.015)'},{offset:.79,transform:'skewY(.7deg) scaleY(.995)'},{transform:'none'}],{duration:3400+i*850,delay:-i*1100,easing:'ease-in-out'});
 });
}
// Only coat/chest paper rises; feet, heads, weapons and the ground stay fixed.
export function addBreathing(root,source,art,animate){
 for(const [i,points]of (art.breathing||[]).entries()){
  const {c,box}=sample(source,points,{cream:true});place(c,box);c.dataset.playerBreath=String(i+1);c.style.transformOrigin='50% 100%';root.append(c);
  animate(c,'player-breath',[{transform:'scale(1,1)'},{transform:'scale(1.007,1.025)',offset:.48},{transform:'scale(1,1)'}],{duration:3700+i*950,delay:-i*1400,easing:'ease-in-out'});
 }
}
export function addBossInk(root,art,animate){
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox',`0 0 ${WIDTH} ${HEIGHT}`);Object.assign(svg.style,{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none'});svg.dataset.bossInk='emitting';root.append(svg);
 const [cx,cy]=art.boss.origin,ns='http://www.w3.org/2000/svg',id=`retry-boss-ink-${cx}-${cy}`,defs=document.createElementNS(ns,'defs'),clip=document.createElementNS(ns,'clipPath'),area=document.createElementNS(ns,'polygon'),field=document.createElementNS(ns,'g');clip.id=id;clip.setAttribute('clipPathUnits','userSpaceOnUse');area.setAttribute('points',art.safeSky.map(p=>p.join(',')).join(' '));clip.append(area);defs.append(clip);svg.append(defs);field.setAttribute('clip-path',`url(#${id})`);svg.append(field);
 for(let i=0;i<20;i++){
  const angle=-Math.PI+i/19*Math.PI*2,rx=250+(i*43%180),ry=90+(i*29%75),points=[];
  for(let n=0;n<14;n++){const t=n/13,r=.25+t*.95,wave=Math.sin(n*2.4+i)*(5+8*t);points.push([cx+Math.cos(angle)*rx*r+Math.sin(angle)*wave,cy+Math.sin(angle)*ry*r-Math.cos(angle)*wave]);}
  const path=document.createElementNS('http://www.w3.org/2000/svg','path');let d='M'+points[0].join(',');for(let j=1;j<points.length-1;j++)d+=' Q'+points[j].join(',')+' '+[(points[j][0]+points[j+1][0])/2,(points[j][1]+points[j+1][1])/2].join(',');d+=' L'+points.at(-1).join(',');path.setAttribute('d',d);path.setAttribute('fill','none');path.setAttribute('stroke','#171615');path.setAttribute('stroke-width',String(.8+(i%4)*.35));path.setAttribute('stroke-linecap','square');path.setAttribute('stroke-linejoin','bevel');path.setAttribute('pathLength','100');path.style.strokeDasharray='100';field.append(path);
  animate(path,'boss-ink',[{strokeDashoffset:100,opacity:0},{strokeDashoffset:90,opacity:.8,offset:.12},{strokeDashoffset:0,opacity:.72,offset:.66},{strokeDashoffset:-20,opacity:0}],{duration:2100+i%5*270,delay:-i*317,easing:'linear'});
 }
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
