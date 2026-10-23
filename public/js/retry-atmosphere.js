import {prepareImage} from './image-cache.js';
import {RETRY_ATMOSPHERE_ART} from './retry-atmosphere-art.js';
export {retryAtmosphereAssets} from './retry-atmosphere-art.js';
const W=1672,H=941,NS='http://www.w3.org/2000/svg';
const makeCanvas=(w=W,h=H)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
function polygon(ctx,points){ctx.beginPath();points.forEach(([x,y],i)=>ctx[i?'lineTo':'moveTo'](x,y));ctx.closePath();}
function svgElement(tag,attrs={}){const el=document.createElementNS(NS,tag);for(const [name,value]of Object.entries(attrs))el.setAttribute(name,value);return el;}
function bounds(points){const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);return [Math.floor(Math.min(...xs)),Math.floor(Math.min(...ys)),Math.ceil(Math.max(...xs)-Math.min(...xs)),Math.ceil(Math.max(...ys)-Math.min(...ys))];}
function place(el,[x,y,w,h]){Object.assign(el.style,{position:'absolute',left:x/W*100+'%',top:y/H*100+'%',width:w/W*100+'%',height:h/H*100+'%'});}
function tornOutline(spine){
 const left=[],right=[];
 for(let j=1;j<spine.length;j++){
  const a=spine[j-1],b=spine[j],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy),count=Math.ceil(length/5);
  for(let k=0;k<count;k++){const t=k/count,x=a[0]+dx*t,y=a[1]+dy*t,grain=Math.sin(k*4.7+j*9)*1.4,width=4.5+Math.sin(k*1.8+j)*1.2;
   left.push([x-dy/length*(width+grain),y+dx/length*(width+grain)]);right.push([x+dy/length*(width-grain),y-dx/length*(width-grain)]);
  }
 }
 left.push(spine.at(-1));return [...left,...right.toReversed()];
}
const collapseFrames=piece=>{
 const side=piece%2?1:-1,dx=side*(13+piece*7),dy=25+piece*14,turn=side*(8+piece*3);
 return [{offset:0,transform:'none',opacity:1},{offset:.29,transform:'none',opacity:1},{offset:.34,transform:`translate(${side*2}px,-2px) rotate(${side*.7}deg)`,opacity:1},{offset:.38,transform:'none',opacity:1},{offset:.45,transform:`translate(${dx*.3}px,${dy*.25}px) rotate(${turn*.4}deg)`,opacity:1},{offset:.59,transform:`translate(${dx}px,${dy}px) rotate(${turn}deg) scaleY(.3)`,opacity:0},{offset:.69,transform:`translate(${dx}px,${dy}px) rotate(${turn}deg) scaleY(.3)`,opacity:0},{offset:.83,transform:`translate(${dx*.25}px,${dy*.22}px) rotate(${turn*.25}deg)`,opacity:1},{offset:.91,transform:'none',opacity:1},{offset:1,transform:'none',opacity:1}];
};
export function createRetryAtmosphere(visual){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),stage=visual.closest('#stage');
 let root=null,epoch=0,dead=false,lastFile=null;const animations=new Set();
 const animate=(el,kind,frames,options)=>{el.dataset.atmosphereKind=kind;const a=el.animate(frames,{iterations:Infinity,fill:'both',easing:'steps(16,end)',...options});animations.add(a);return a;};
 const sync=()=>{const paused=document.hidden||Boolean(stage?.dataset.chapterIntro);for(const a of animations)paused?a.pause():a.play();if(root)root.dataset.paused=String(paused);};
 const observer=new MutationObserver(sync);if(stage)observer.observe(stage,{attributes:true,attributeFilter:['data-chapter-intro']});
 function clear(forget=true){epoch++;animations.forEach(a=>a.cancel());animations.clear();root?.remove();root=null;if(forget)lastFile=null;}
 async function show(file){
  clear(false);lastFile=file;const version=epoch,art=RETRY_ATMOSPHERE_ART[file];
  if(dead||reduced.matches||!art)return false;
  let original,plate;try{[original,plate]=await Promise.all([prepareImage('/assets/retry/'+file),prepareImage(art.plate)]);}catch{return false;}
  if(dead||version!==epoch||reduced.matches||!visual.querySelector('.scene-image')?.src.endsWith('/'+file))return false;
  const source=makeCanvas(),sc=source.getContext('2d',{willReadFrequently:true});sc.drawImage(original,0,0,W,H);
  root=document.createElement('div');root.className='retry-atmosphere';root.dataset.source=file;root.setAttribute('aria-hidden','true');Object.assign(root.style,{width:W+'px',height:H+'px',transformOrigin:'0 0',transform:`scale(${visual.clientWidth/W},${visual.clientHeight/H})`});
  const repair=makeCanvas(),rc=repair.getContext('2d'),mask=makeCanvas(),mc=mask.getContext('2d');
  const [bx,by,bw,bh]=art.boss.box;
  const allowed=makeCanvas(),ac=allowed.getContext('2d');polygon(ac,[[bx,by],[bx+bw,by],...art.boss.ridge.toReversed()]);ac.fill();
  const background=makeCanvas(),bgc=background.getContext('2d',{willReadFrequently:true});bgc.drawImage(plate,0,0,W,H);const clean=bgc.getImageData(bx,by,bw,bh).data;const allow=ac.getImageData(bx,by,bw,bh).data,ink=sc.getImageData(bx,by,bw,bh),face=art.boss.face;
  for(let i=0;i<ink.data.length;i+=4){const x=bx+(i/4)%bw,y=by+Math.floor(i/4/bw),r=ink.data[i],g=ink.data[i+1],b=ink.data[i+2];const exposed=Math.max(clean[i],clean[i+1],clean[i+2])-Math.max(r,g,b);let a=exposed>24?Math.max(0,Math.min(1,(42-Math.max(r,g,b))/16)):0;if(x>=face[0]&&x<=face[0]+face[2]&&y>=face[1]&&y<=face[1]+face[3]&&Math.min(r,g,b)>145)a=1;ink.data[i+3]=Math.round(a*allow[i+3]);}
  const boss=makeCanvas(bw,bh);boss.getContext('2d').putImageData(ink,0,0);mc.drawImage(boss,bx,by);
  const towers=art.towers.map(points=>{
   const box=bounds(points),[x,y,w,h]=box,c=makeCanvas(w,h),ctx=c.getContext('2d');ctx.translate(-x,-y);polygon(ctx,points);ctx.clip();ctx.drawImage(source,0,0);polygon(mc,points);mc.fill();return{c,box};
  });
  rc.drawImage(plate,0,0,W,H);rc.globalCompositeOperation='destination-in';rc.drawImage(mask,0,0);repair.className='retry-atmosphere-repair';root.append(repair);
  // Arms are independent native ink, pivoted at their shoulders. The torso
  // covers the joints; the foreground ridge is explicitly outside the mask.
  for(const [name,x,w,pivot,frames,duration]of [
   ['left',bx,art.boss.left-bx+28,[art.boss.left,135],[{transform:'none'},{transform:'translate(-4px,7px) rotate(6deg)',offset:.28},{transform:'translate(2px,-5px) rotate(-3deg)',offset:.64},{transform:'none'}],3300],
   ['right',art.boss.right-28,bx+bw-art.boss.right+28,[art.boss.right,130],[{transform:'none'},{transform:'translate(4px,-8px) rotate(-5deg)',offset:.37},{transform:'translate(-2px,5px) rotate(4deg)',offset:.76},{transform:'none'}],4100],
   ['torso',art.boss.left-28,art.boss.right-art.boss.left+56,art.boss.origin,[{transform:'none'},{transform:'translateY(-4px) scale(1.012,1.025) rotate(-.6deg)',offset:.48},{transform:'none'}],2900]
  ]){
   const c=makeCanvas(w,bh);c.getContext('2d').drawImage(boss,x-bx,0,w,bh,0,0,w,bh);place(c,[x,by,w,bh]);c.style.transformOrigin=`${(pivot[0]-x)/w*100}% ${(pivot[1]-by)/bh*100}%`;c.dataset.bossPart=name;root.append(c);animate(c,'boss-'+name,frames,{duration});
  }
  towers.forEach(({c,box},tower)=>{
   const [x,y,w,h]=box,pieces=5;
   for(let part=0;part<pieces;part++){
    const piece=makeCanvas(w,h),ctx=piece.getContext('2d');const edge=(n,expand)=>Array.from({length:9},(_,i)=>[w*i/8,h*n/pieces+expand+(n===0||n===pieces?0:((i*11+n*7)%9-4))]);
    polygon(ctx,[...edge(part,-.65),...edge(part+1,.65).toReversed()]);ctx.clip();ctx.drawImage(c,0,0);place(piece,box);piece.style.transformOrigin='50% 90%';piece.dataset.tower=String(tower);piece.dataset.piece=String(part);root.append(piece);
    animate(piece,'tower-piece',collapseFrames(part),{duration:9200+tower*2100,delay:tower*1800+part*100,easing:'steps(36,end)'});
   }
  });
  // Paper texture comes from the existing empty road, shared by tears/debris.
  const paper=makeCanvas(64,64);paper.getContext('2d').drawImage(source,845,535,64,64,0,0,64,64);
  const svg=svgElement('svg',{viewBox:`0 0 ${W} ${H}`,preserveAspectRatio:'none'});svg.classList.add('retry-atmosphere-paper');
  const id='retry-paper-'+crypto.randomUUID(),clip=id+'-sky',defs=svgElement('defs'),pattern=svgElement('pattern',{id,width:64,height:64,patternUnits:'userSpaceOnUse'}),texture=svgElement('image',{href:paper.toDataURL(),width:64,height:64});pattern.append(texture);defs.append(pattern);
  const clipPath=svgElement('clipPath',{id:clip});clipPath.append(svgElement('polygon',{points:art.safeSky.map(p=>p.join(',')).join(' ')}));defs.append(clipPath);svg.append(defs);
  art.tears.forEach((spine,i)=>{
   const points=tornOutline(spine);
   const outer=svgElement('g',{'clip-path':`url(#${clip})`}),g=svgElement('g'),crease=svgElement('polygon',{points:points.map(([x,y])=>`${x-3},${y+3}`).join(' '),fill:'#211e1b'}),tear=svgElement('polygon',{points:points.map(p=>p.join(',')).join(' '),fill:`url(#${id})`,stroke:'#e4d8c8','stroke-width':1});g.append(crease,tear);outer.append(g);svg.append(outer);
   animate(g,'paper-lightning',[{offset:0,opacity:0,clipPath:'inset(0 0 100% 0)'},{offset:.10,opacity:0,clipPath:'inset(0 0 100% 0)'},{offset:.14,opacity:.95,clipPath:'inset(0)'},{offset:.19,opacity:.88,clipPath:'inset(0)'},{offset:.27,opacity:0,clipPath:'inset(0 0 100% 0)'},{offset:1,opacity:0,clipPath:'inset(0 0 100% 0)'}],{duration:7900+i*2200,delay:i*3400,easing:'linear'});
  });
  const wash=svgElement('polygon',{points:art.safeSky.map(p=>p.join(',')).join(' '),fill:'#f4e4d1'});svg.append(wash);animate(wash,'sky-light',[{offset:0,opacity:0},{offset:.11,opacity:0},{offset:.15,opacity:.06},{offset:.27,opacity:0},{offset:1,opacity:0}],{duration:7900});
  art.cracks.forEach((coords,i)=>{const d=coords.map((v,j)=>j%2?' '+v:(j?' L':'M')+v).join(''),path=svgElement('path',{d,fill:'none',stroke:'#53473e','stroke-width':2-i*.4,'stroke-linejoin':'bevel'});svg.append(path);animate(path,'ground-seam',[{opacity:.03},{opacity:.28,offset:.18},{opacity:.06,offset:.36},{opacity:.03}],{duration:7900+i*1700});});
  towers.forEach(({c,box},tower)=>{
   for(let i=0;i<7;i++){
    const chip=makeCanvas(18+i%3*5,12+i%2*6),ctx=chip.getContext('2d');polygon(ctx,[[1,1],[chip.width-3,0],[chip.width,chip.height-4],[4,chip.height]]);ctx.clip();ctx.drawImage(c,(i*29)%Math.max(1,c.width-24),(i*37)%Math.max(1,c.height-24),24,24,0,0,chip.width,chip.height);const x=box[0]+box[2]*.5+(i%3-1)*18,y=box[1]+box[3]*.7;place(chip,[x,y,chip.width,chip.height]);root.append(chip);
    animate(chip,'rubble',[{offset:0,opacity:0,transform:'none'},{offset:.38,opacity:0,transform:'none'},{offset:.46,opacity:.9,transform:`translate(${(i-3)*9}px,${i*8}px) rotate(${i*13}deg)`},{offset:.60,opacity:0,transform:`translate(${(i-3)*16}px,${35+i*12}px) rotate(${i*31}deg)`},{offset:.70,opacity:0,transform:`translate(${(i-3)*16}px,${35+i*12}px) rotate(${i*31}deg)`},{offset:.81,opacity:.8,transform:`translate(${(i-3)*7}px,${i*6}px) rotate(${i*9}deg)`},{offset:.91,opacity:0,transform:'none'},{offset:1,opacity:0,transform:'none'}],{duration:9200+tower*2100,delay:tower*1800,easing:'steps(36,end)'});
   }
  });
  root.insertBefore(svg,root.children[1]);visual.append(root);sync();return true;
 }
 const motionChanged=()=>{if(reduced.matches)clear(false);else if(lastFile)show(lastFile);};
 document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',motionChanged);
 return{show,clear,charge(){for(const a of animations){if(a.effect.target.dataset.atmosphereKind?.startsWith('boss'))a.updatePlaybackRate(1.6);if(a.effect.target.dataset.atmosphereKind==='paper-lightning')a.currentTime=1150;}},dispose(){dead=true;clear();observer.disconnect();document.removeEventListener('visibilitychange',sync);reduced.removeEventListener('change',motionChanged);}};
}
