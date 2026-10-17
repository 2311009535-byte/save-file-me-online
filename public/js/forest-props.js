
import {routeX} from './forest-route.js';
export const FOREST_PROPS=[
 ['mushrooms',0,-250,1620,16],['rocks',0,285,1730,30],['stump',0,-365,2010,45],
 ['mushrooms',3,-325,2030,19],['mushrooms',1,-393,1990,13],['rocks',2,275,2120,24],
 ['mushrooms',4,330,2170,17],['log',0,-335,2540,36],['mushrooms',2,-290,2560,13],
 ['sign',0,260,1700,128],['rocks',1,370,2890,44],['mushrooms',5,330,2910,15],
 ['stump',0,430,3450,42],['mushrooms',0,385,3465,17],['log',0,-410,4070,34],
 ['rocks',0,-305,4560,32],['stump',0,380,5020,40],['rocks',2,-280,5660,26],
 ['log',0,-390,4860,38],['rocks',2,-445,4895,25],
 ['mushrooms',3,280,5890,15]
].map(([kind,index,x,z,h])=>({kind,index,x,z,h}));
for(let i=0;i<12;i++){
 const side=i%2?1:-1;
 FOREST_PROPS.push({kind:'mushrooms',index:i%6,x:side*(225+(i*37%160)),z:3210+i*245,h:12+i%5});
}
export function addForestProps({texture,quad},images){
 const identity=[1,0,0,0,1,0,0,0,1],cache=new Map();
 function sprite(kind,index=0){
  const key=kind+index;
  if(cache.has(key))return cache.get(key);
  const im=images['prop'+kind];
  const cols=kind==='leaves'?3:kind==='rocks'?3:kind==='mushrooms'?6:1;
  const rows=kind==='leaves'?2:1;
  const sx=Math.floor((index%cols)*im.width/cols);
  const sy=Math.floor(Math.floor(index/cols)*im.height/rows);
  const w=Math.floor(im.width/cols),h=Math.floor(im.height/rows);
  const full=document.createElement('canvas');full.width=w;full.height=h;
  const ctx=full.getContext('2d',{willReadFrequently:true});
  ctx.drawImage(im,sx,sy,w,h,0,0,w,h);
  const a=ctx.getImageData(0,0,w,h).data;
  let l=w,t=h,r=-1,b=-1;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   if(a[(y*w+x)*4+3]>=160){
    l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);
   }
  }
  if(r<l)throw Error('Empty forest prop: '+key);
  l=Math.max(0,l-2);t=Math.max(0,t-2);
  r=Math.min(w-1,r+2);b=Math.min(h-1,b+2);
  const c=document.createElement('canvas');
  c.width=r-l+1;c.height=b-t+1;
  c.getContext('2d').drawImage(full,l,t,c.width,c.height,0,0,c.width,c.height);
  const v={tex:texture(c),ratio:c.width/c.height};
  cache.set(key,v);return v;
 }
 function place(kind,index,x,z,h,y=0,effect=0){
  const {tex,ratio}=sprite(kind,index),w=h*ratio;x+=routeX(z);
  quad(tex,[
   {p:[x-w/2,y+h,z],uv:[0,0]},
   {p:[x+w/2,y+h,z],uv:[1,0]},
   {p:[x+w/2,y,z],uv:[1,1]},
   {p:[x-w/2,y,z],uv:[0,1]}
  ],identity,undefined,false,effect);
 }
 for(const p of FOREST_PROPS)place(p.kind,p.index,p.x,p.z,p.h);
 for(let i=0;i<24;i++){
  place('leaves',i%6,(i%2?1:-1)*(50+i*29%320),1760+i*210,15+i%3*3,22,3);
 }
}
