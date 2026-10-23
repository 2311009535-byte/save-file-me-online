import {prepareImage} from './image-cache.js';
import {RETRY_ATMOSPHERE_ART} from './retry-atmosphere-art.js';
import {addBuildings,addSkyBands,addMessages,addCalendar,addFlags,keepPaperComponents} from './retry-atmosphere-layers.js';
export {retryAtmosphereAssets} from './retry-atmosphere-art.js';
const W=1672,H=941,NS='http://www.w3.org/2000/svg';
const makeCanvas=(w=W,h=H)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
function polygon(ctx,points){ctx.beginPath();points.forEach(([x,y],i)=>ctx[i?'lineTo':'moveTo'](x,y));ctx.closePath();}
function svgElement(tag,attrs={}){const el=document.createElementNS(NS,tag);for(const [name,value]of Object.entries(attrs))el.setAttribute(name,value);return el;}
function place(el,[x,y,w,h]){Object.assign(el.style,{position:'absolute',left:x/W*100+'%',top:y/H*100+'%',width:w/W*100+'%',height:h/H*100+'%'});}
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
  let original,plate,bossPlate,motionPlate;try{[original,plate,bossPlate,motionPlate]=await Promise.all([prepareImage('/assets/retry/'+file),prepareImage(art.plate),prepareImage(art.bossPlate),prepareImage(art.motionPlate)]);}catch{return false;}
  if(dead||version!==epoch||reduced.matches||!visual.querySelector('.scene-image')?.src.endsWith('/'+file))return false;
  const source=makeCanvas(),sc=source.getContext('2d',{willReadFrequently:true});sc.drawImage(original,0,0,W,H);
  root=document.createElement('div');root.className='retry-atmosphere';root.dataset.source=file;root.setAttribute('aria-hidden','true');Object.assign(root.style,{width:W+'px',height:H+'px',transformOrigin:'0 0',transform:`scale(${visual.clientWidth/W},${visual.clientHeight/H})`});
  const repair=makeCanvas(),rc=repair.getContext('2d');
  const [bx,by,bw,bh]=art.boss.box;
  const allowed=makeCanvas(),ac=allowed.getContext('2d');polygon(ac,[[bx,by],[bx+bw,by],...art.boss.ridge.toReversed()]);ac.fill();ac.globalCompositeOperation='destination-out';ac.lineWidth=4;for(const [index,points] of art.towers.entries()){if(art.stillTowers.includes(index))continue;polygon(ac,points);ac.fill();ac.stroke();}
  const background=makeCanvas(),bgc=background.getContext('2d',{willReadFrequently:true});bgc.drawImage(bossPlate,0,0,W,H);const clean=bgc.getImageData(bx,by,bw,bh).data;const allow=ac.getImageData(bx,by,bw,bh).data,ink=sc.getImageData(bx,by,bw,bh),face=art.boss.face;
  for(let i=0;i<ink.data.length;i+=4){const x=bx+(i/4)%bw,y=by+Math.floor(i/4/bw),r=ink.data[i],g=ink.data[i+1],b=ink.data[i+2];const exposed=Math.max(clean[i],clean[i+1],clean[i+2])-Math.max(r,g,b);let a=exposed>24?Math.max(0,Math.min(1,(42-Math.max(r,g,b))/16)):0;if(x>=face[0]&&x<=face[0]+face[2]&&y>=face[1]&&y<=face[1]+face[3]&&Math.min(r,g,b)>145)a=1;ink.data[i+3]=Math.round(a*allow[i+3]);}
  const boss=makeCanvas(bw,bh);boss.getContext('2d').putImageData(ink,0,0);
  // One continuous repaired backdrop prevents pale roof ghosts and polygon
  // seams when a sheet is pulled out. Native foreground art is restored below.
  const protect=makeCanvas(),pc=protect.getContext('2d');
  for(const points of art.huds){polygon(pc,points);pc.fill();}
  polygon(pc,file==='3_1.png'?[[273,402],[445,370],[486,399],[478,523],[301,555],[270,511]]:[[160,327],[326,295],[366,330],[358,451],[187,473],[157,433]]);pc.fill();
  const piles=makeCanvas(),pctx=piles.getContext('2d',{willReadFrequently:true});for(const points of art.piles){polygon(pctx,points);pctx.fill();}pctx.globalCompositeOperation='source-in';pctx.drawImage(source,0,0);const pilePixels=pctx.getImageData(0,0,W,H);for(let i=0;i<pilePixels.data.length;i+=4)pilePixels.data[i+3]*=Math.max(0,Math.min(1,(Math.min(pilePixels.data[i],pilePixels.data[i+1],pilePixels.data[i+2])-140)/35));pctx.putImageData(keepPaperComponents(pilePixels),0,0);pc.drawImage(piles,0,0);
  const frame=makeCanvas(),fc=frame.getContext('2d');
  const outer=file==='3_1.png'?[[1348,239],[1516,245],[1672,283],[1672,508],[1602,844],[1238,724],[1306,343]]:[[1403,321],[1532,341],[1672,375],[1672,535],[1628,767],[1308,684],[1359,478]];
  polygon(fc,outer);fc.fill();fc.globalCompositeOperation='destination-out';polygon(fc,art.phone);fc.fill();pc.drawImage(frame,0,0);
  // Printed card art and foreground players keep their native silhouettes.
  const cards=file==='3_1.png'?[
   [[800,704],[829,687],[969,699],[986,922],[961,941],[787,920]],[[1037,708],[1064,691],[1199,702],[1218,923],[1183,941],[1019,925]],[[1261,705],[1290,691],[1424,701],[1458,924],[1420,941],[1236,926]]
  ]:[[[1090,699],[1122,687],[1225,700],[1254,895],[1223,921],[1063,910]],[[1270,707],[1296,692],[1397,705],[1434,905],[1405,926],[1251,912]],[[1450,705],[1478,693],[1587,706],[1630,910],[1604,927],[1429,916]]];
  pc.lineWidth=6;pc.lineJoin='round';for(const points of cards){polygon(pc,points);pc.fill();pc.stroke();}
  if(file==='3_9.JPG'){
   const actors=makeCanvas(),ctx=actors.getContext('2d',{willReadFrequently:true});polygon(ctx,[[362,513],[535,492],[554,551],[524,589],[574,622],[716,496],[735,500],[649,687],[657,925],[371,941],[368,808],[349,713],[324,635]]);ctx.clip();ctx.drawImage(source,0,0);const data=ctx.getImageData(0,0,W,H);for(let i=0;i<data.data.length;i+=4)data.data[i+3]*=Math.max(0,Math.min(1,(Math.min(data.data[i],data.data[i+1],data.data[i+2])-140)/35));ctx.putImageData(keepPaperComponents(data),0,0);pc.drawImage(actors,0,0);
  }
  // Remove the original loose pages from the foreground mask, so the native
  // sheets are drawn exactly once and can reveal a repaired backing as they sway.
  const patches=makeCanvas(),patchCtx=patches.getContext('2d');patchCtx.lineWidth=12;patchCtx.lineJoin='round';
  for(const points of [...art.loosePages,...art.flags]){polygon(patchCtx,points);patchCtx.fill();patchCtx.stroke();}
  pc.globalCompositeOperation='destination-out';pc.drawImage(patches,0,0);
  const motionBacking=makeCanvas(),mb=motionBacking.getContext('2d');mb.drawImage(motionPlate,0,0,W,H);mb.globalCompositeOperation='destination-in';mb.drawImage(patches,0,0);
  rc.drawImage(plate,0,0,W,H);rc.drawImage(motionBacking,0,0);rc.globalCompositeOperation='destination-out';rc.drawImage(protect,0,0);repair.className='retry-atmosphere-repair';root.append(repair);
  // Arms are independent native ink, pivoted at their shoulders. The torso
  // covers the joints; the foreground ridge is explicitly outside the mask.
  for(const [name,x,w,pivot,frames,duration]of [
   ['left',bx,art.boss.left-bx+28,[art.boss.left,135],[{transform:'none'},{transform:'translate(-4px,7px) rotate(6deg)',offset:.28},{transform:'translate(2px,-5px) rotate(-3deg)',offset:.64},{transform:'none'}],3300],
   ['right',art.boss.right-28,bx+bw-art.boss.right+28,[art.boss.right,130],[{transform:'none'},{transform:'translate(4px,-8px) rotate(-5deg)',offset:.37},{transform:'translate(-2px,5px) rotate(4deg)',offset:.76},{transform:'none'}],4100],
   ['torso',art.boss.left-28,art.boss.right-art.boss.left+56,art.boss.origin,[{transform:'none'},{transform:'translateY(-4px) scale(1.012,1.025) rotate(-.6deg)',offset:.48},{transform:'none'}],2900]
  ]){
   const c=makeCanvas(w,bh);c.getContext('2d').drawImage(boss,x-bx,0,w,bh,0,0,w,bh);place(c,[x,by,w,bh]);c.style.transformOrigin=`${(pivot[0]-x)/w*100}% ${(pivot[1]-by)/bh*100}%`;c.dataset.bossPart=name;root.append(c);animate(c,'boss-'+name,frames,{duration});
  }
  const moving=makeCanvas(),movingCtx=moving.getContext('2d');movingCtx.drawImage(source,0,0);movingCtx.globalCompositeOperation='destination-out';movingCtx.drawImage(protect,0,0);
  const structures=makeCanvas(),stc=structures.getContext('2d');stc.drawImage(moving,0,0);stc.globalCompositeOperation='destination-out';polygon(stc,outer);stc.fill();stc.drawImage(patches,0,0);
  const backdrop=makeCanvas(),backdropCtx=backdrop.getContext('2d');backdropCtx.drawImage(plate,0,0,W,H);
  addBuildings(root,structures,backdrop,art,animate);
  addMessages(root,moving,art,animate,backdrop);
  const svg=svgElement('svg',{viewBox:`0 0 ${W} ${H}`,preserveAspectRatio:'none'});svg.classList.add('retry-atmosphere-paper');
  const wash=svgElement('polygon',{points:art.safeSky.map(p=>p.join(',')).join(' '),fill:'#f4e4d1'});svg.append(wash);animate(wash,'sky-light',[{offset:0,opacity:0},{offset:.11,opacity:0},{offset:.15,opacity:.06},{offset:.27,opacity:0},{offset:1,opacity:0}],{duration:7900});
  art.cracks.forEach((coords,i)=>{const d=coords.map((v,j)=>j%2?' '+v:(j?' L':'M')+v).join(''),path=svgElement('path',{d,fill:'none',stroke:'#53473e','stroke-width':2-i*.4,'stroke-linejoin':'bevel'});svg.append(path);animate(path,'ground-seam',[{opacity:.03},{opacity:.28,offset:.18},{opacity:.06,offset:.36},{opacity:.03}],{duration:7900+i*1700});});
  const foreground=makeCanvas(),fg=foreground.getContext('2d');fg.drawImage(source,0,0);fg.globalCompositeOperation='destination-in';fg.drawImage(protect,0,0);foreground.className='retry-atmosphere-foreground';root.append(foreground);
  addCalendar(root,source,art,animate);
  addFlags(root,source,art,animate);
  const cloudSource=makeCanvas(),clc=cloudSource.getContext('2d');clc.drawImage(structures,0,0);clc.globalCompositeOperation='destination-out';clc.lineWidth=4;for(const points of art.towers){polygon(clc,points);clc.fill();clc.stroke();}
  const sky=document.createElement('div');sky.className='retry-sky-paper';addSkyBands(sky,cloudSource,art.skyBands,animate);root.insertBefore(sky,root.children[1]);root.insertBefore(svg,root.children[1]);visual.append(root);sync();return true;
 }
 const motionChanged=()=>{if(reduced.matches)clear(false);else if(lastFile)show(lastFile);};
 document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',motionChanged);
 return{show,clear,charge(){for(const a of animations){if(a.effect.target.dataset.atmosphereKind?.startsWith('boss'))a.updatePlaybackRate(1.6);if(a.effect.target.dataset.atmosphereKind==='sky-paper')a.updatePlaybackRate(1.3);}},dispose(){dead=true;clear();observer.disconnect();document.removeEventListener('visibilitychange',sync);reduced.removeEventListener('change',motionChanged);}};
}
