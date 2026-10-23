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
export const withdrawFrames=height=>[
 {offset:0,transform:'translateY(0px)'},{offset:.18,transform:'translateY(0px)',easing:'cubic-bezier(.45,0,.25,1)'},
 {offset:.41,transform:`translateY(${height+16}px)`},{offset:.59,transform:`translateY(${height+16}px)`,easing:'cubic-bezier(.45,0,.25,1)'},
 {offset:.85,transform:'translateY(0px)'},{offset:1,transform:'translateY(0px)'}
];
export function addBuildings(root,source,background,polygons,animate){
 polygons.forEach((points,index)=>{
  const {c,box}=sample(source,points),ctx=c.getContext('2d',{willReadFrequently:true}),pixels=ctx.getImageData(0,0,c.width,c.height),base=background.getContext('2d',{willReadFrequently:true}).getImageData(...box);
  for(let i=0;i<pixels.data.length;i+=4){const delta=Math.max(Math.abs(pixels.data[i]-base.data[i]),Math.abs(pixels.data[i+1]-base.data[i+1]),Math.abs(pixels.data[i+2]-base.data[i+2]));pixels.data[i+3]*=Math.max(0,Math.min(1,(delta-16)/12));}ctx.putImageData(pixels,0,0);
  const viewport=document.createElement('div');viewport.className='retry-building-slot';viewport.dataset.building=String(index);place(viewport,box);
  Object.assign(c.style,{width:'100%',height:'100%',display:'block'});viewport.append(c);root.append(viewport);
  animate(c,'building-withdraw',withdrawFrames(box[3]),{duration:8200+(index%5)*530,delay:(index*347)%1900,easing:'linear'});
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
function matteMessage(c,box){
 const ctx=c.getContext('2d',{willReadFrequently:true}),data=ctx.getImageData(0,0,c.width,c.height),n=c.width*c.height,paper=new Uint8Array(n),outside=new Uint8Array(n),queue=new Int32Array(n);let head=0,tail=0;
 for(let p=0;p<n;p++){const i=p*4;paper[p]=data.data[i+3]>0&&Math.min(data.data[i],data.data[i+1],data.data[i+2])>137&&data.data[i]-data.data[i+2]>8?1:0;}
 const push=p=>{if(!paper[p]&&!outside[p]){outside[p]=1;queue[tail++]=p;}};
 for(let x=0;x<c.width;x++){push(x);push((c.height-1)*c.width+x);}for(let y=0;y<c.height;y++){push(y*c.width);push(y*c.width+c.width-1);}
 while(head<tail){const p=queue[head++],x=p%c.width,y=Math.floor(p/c.width);if(x)push(p-1);if(x<c.width-1)push(p+1);if(y)push(p-c.width);if(y<c.height-1)push(p+c.width);}
 for(let p=0;p<n;p++){const i=p*4,x=p%c.width;const avatar=x<74&&Math.max(data.data[i],data.data[i+1],data.data[i+2])<112;data.data[i+3]*=(!outside[p]||avatar)?1:0;}
 ctx.putImageData(data,0,0);
}
export function addMessages(root,source,art,animate){
 const screen=document.createElement('div');screen.className='retry-message-screen';screen.style.clipPath='polygon('+art.phone.map(([x,y])=>`${x/WIDTH*100}% ${y/HEIGHT*100}%`).join(',')+')';root.append(screen);
 art.messages.forEach((points,index)=>{const {c,box}=sample(source,points);matteMessage(c,box);place(c,box);c.dataset.message=String(index);screen.append(c);
  animate(c,'phone-message',[{offset:0,transform:'none'},{offset:.18,transform:'none'},{offset:.36,transform:`translateY(-${5+index%2}px) rotate(${index%2?-.35:.35}deg)`},{offset:.50,transform:'translateY(-2px)'},{offset:.64,transform:'none'},{offset:1,transform:'none'}],{duration:5100,delay:index*670,easing:'ease-in-out'});
 });
}
export function addCalendar(root,source,art,animate){
 const field=document.createElement('div');field.className='retry-calendar-flutter';root.append(field);
 for(let i=0;i<12;i++){
  const [sx,sy,sw,sh]=art.calendarSamples[i%art.calendarSamples.length],[ox,oy]=art.calendarOrigins[i%art.calendarOrigins.length],w=20+i%4*7,h=26+i%3*9,c=canvas(w,h),ctx=c.getContext('2d');
  polygon(ctx,[[1,2],[w-3,0],[w,h-4],[4,h],[0,h*.7]]);ctx.clip();ctx.drawImage(source,sx,sy,sw,sh,0,0,w,h);place(c,[ox+(i%3-1)*9,oy,w,h]);field.append(c);
  const drift=30+i%4*18,fall=130+i%5*25,turn=i%2?1:-1;
  animate(c,'calendar-paper',[{offset:0,opacity:0,transform:'translate(0px,0px) rotate(0deg) scaleX(1)'},{offset:.10,opacity:.88,transform:`translate(7px,10px) rotate(${turn*9}deg) scaleX(.85)`},{offset:.38,opacity:.92,transform:`translate(${drift}px,${fall*.32}px) rotate(${turn*32}deg) scaleX(.32)`},{offset:.64,opacity:.85,transform:`translate(${drift*.55}px,${fall*.68}px) rotate(${turn*66}deg) scaleX(.9)`},{offset:.90,opacity:0,transform:`translate(${drift+14}px,${fall}px) rotate(${turn*108}deg) scaleX(.55)`},{offset:1,opacity:0,transform:`translate(${drift+14}px,${fall}px) rotate(${turn*108}deg) scaleX(.55)`}],{duration:4700+i%4*510,delay:-i*413,easing:'linear'});
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
