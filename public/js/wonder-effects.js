import {cleanCompletedContours} from './wonder-completed-contours.js';
import {prepareImage} from './image-cache.js';
// Native-pixel contours traced against 1_1; used for transparent hit testing.
export const contours={
 window:[[103,104],[289,154],[289,520],[105,550]],
 map:[[585,181],[916,181],[916,389],[585,389]],
 note:[[1043,329],[1100,329],[1100,393],[1043,393]],
 box:[[1445,654],[1480,645],[1586,645],[1586,610],[1669,622],[1669,897],[1560,913],[1467,875]]
};
export function shapeHotspot(element,id){
 const points=contours[id];const x=Math.min(...points.map(p=>p[0])),y=Math.min(...points.map(p=>p[1]));const w=Math.max(...points.map(p=>p[0]))-x,h=Math.max(...points.map(p=>p[1]))-y;
 Object.assign(element.style,{left:`${x/1669*100}%`,top:`${y/942*100}%`,width:`${w/1669*100}%`,height:`${h/942*100}%`,clipPath:`polygon(${points.map(p=>`${(p[0]-x)/w*100}% ${(p[1]-y)/h*100}%`).join(',')})`});
}
function distance(x,y,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy);}
export function addContourLights(visual,done,{closedBox=false,movingNote=false}={}){
 const base=visual.querySelector('.scene-image');
 Promise.all([prepareImage('/assets/wonder/1_1.png'),Object.values(done).some(Boolean)?prepareImage('/assets/wonder/extra.png'):null]).then(([source,cleanSource])=>{
 if(!base.isConnected||visual.querySelector('.scene-image')!==base)return;
 cleanCompletedContours(visual,source,done,cleanSource);
 const buffer=document.createElement('canvas');buffer.width=1669;buffer.height=942;const ctx=buffer.getContext('2d',{willReadFrequently:true});ctx.drawImage(source,0,0);const pixels=ctx.getImageData(0,0,1669,942);
 Object.entries(contours).forEach(([id,points],index)=>{
 if((id==='box'&&closedBox)||(id==='note'&&movingNote)||done[id]||visual.querySelector('.contour-light[data-object="'+id+'"]'))return;
 const layer=document.createElement('canvas');layer.width=1669;layer.height=942;layer.className='contour-light';layer.dataset.object=id;layer.style.zIndex='3';layer.style.animationDelay=`-${index*.55}s`;
 const out=layer.getContext('2d').createImageData(1669,942);
 const minX=Math.max(0,Math.min(...points.map(p=>p[0]))-18),maxX=Math.min(1668,Math.max(...points.map(p=>p[0]))+18),minY=Math.max(0,Math.min(...points.map(p=>p[1]))-18),maxY=Math.min(941,Math.max(...points.map(p=>p[1]))+18);
 for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
 const i=(y*1669+x)*4,r=pixels.data[i],g=pixels.data[i+1],b=pixels.data[i+2];
 // Isolate only existing pale contour pixels, never the object fill or background.
 if(Math.min(r,g,b)<155||Math.max(r,g,b)-Math.min(r,g,b)>75)continue;
 const d=Math.min(...points.map((a,n)=>distance(x,y,a,points[(n+1)%points.length])));if(d>18)continue;
 out.data[i]=r;out.data[i+1]=g;out.data[i+2]=b;out.data[i+3]=Math.round(Math.min(1,(Math.min(r,g,b)-155)/70)*245);
 }
 layer.getContext('2d').putImageData(out,0,0);visual.append(layer);
 });
 }).catch(()=>{});
}
