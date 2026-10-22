import {prepareImage} from './image-cache.js';
const W=1920,H=1080;
let maskReady=null;
function wallMask(){
 if(!maskReady)maskReady=prepareImage('/assets/escape/room-clean.png').then(image=>{
  const mask=document.createElement('canvas');mask.width=W;mask.height=H;const ctx=mask.getContext('2d',{willReadFrequently:true});
  // Trace only the walls, keeping the window, desk, floor and door interior out.
  const regions=[[[.24,0],[.61,0],[.60,.18],[.57,.17],[.56,.23],[.42,.22],[.40,.28],[.32,.23],[.29,.31],[.27,.18]],[[.103,.02],[.12,.01],[.14,.16],[.21,.40],[.23,.51],[.29,.67],[.41,.91],[.31,.88],[.20,.78],[.11,.59],[.075,.43],[.06,.22]],[[.80,0],[.87,.06],[.90,.21],[.90,.40],[.87,.57],[.80,.75],[.69,.90],[.61,.94],[.68,.85],[.77,.68],[.83,.51],[.86,.31],[.84,.14]]];
  ctx.save();ctx.beginPath();for(const points of regions){points.forEach(([x,y],i)=>i?ctx.lineTo(x*W,y*H):ctx.moveTo(x*W,y*H));ctx.closePath();}ctx.clip();ctx.drawImage(image,0,0,W,H);ctx.restore();
  const pixels=ctx.getImageData(0,0,W,H);for(let i=0;i<pixels.data.length;i+=4){const r=pixels.data[i],g=pixels.data[i+1],b=pixels.data[i+2],a=pixels.data[i+3];pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=255;pixels.data[i+3]=a&&r>175&&g>160&&b<160&&r>b*1.35&&g>b*1.35?255:0;}ctx.putImageData(pixels,0,0);return mask;
 }).catch(error=>{maskReady=null;throw error;});
 return maskReady;
}
function drawGroup(ctx,index){
 let seed=413+index*997;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const anchors=[[.34,.12],[.48,.07],[.56,.12],[.10,.30],[.12,.45],[.18,.61],[.27,.79],[.87,.30],[.84,.55],[.76,.76]];
 ctx.strokeStyle='#101322';ctx.lineCap='round';ctx.lineJoin='round';
 for(let n=0;n<6;n++){
  const [ax,ay]=anchors[(index*7+n*3)%anchors.length],x=ax*W+(random()-.5)*95,y=ay*H+(random()-.5)*75;
  ctx.save();ctx.translate(x,y);ctx.rotate((random()-.5)*1.8);ctx.lineWidth=3.5+random()*4.5;
  if(n%3===0){
   ctx.beginPath();ctx.moveTo(-65,30);for(let k=0;k<6;k++)ctx.lineTo((k%2?1:-1)*(25+random()*65),-40+random()*85);ctx.stroke();
  }else if(n%3===1){
   ctx.beginPath();ctx.moveTo(-45,20);for(let k=0;k<4;k++)ctx.bezierCurveTo(-90+random()*50,-55+random()*30,70+random()*35,-40+random()*95,-35+random()*100,15+random()*45);ctx.stroke();
  }else{
   for(let k=0;k<5;k++){ctx.lineWidth=3+random()*5;ctx.beginPath();ctx.moveTo(-65+random()*40,-35+k*13);ctx.lineTo(30+random()*60,-50+k*12+random()*30);ctx.stroke();}
  }
  ctx.restore();
 }

}
export function mountWallPressure(visual,count,{animate=false}={}){
 if(!count)return()=>{};
 const layers=[],animations=[];let alive=true;
 wallMask().then(mask=>{
  if(!alive)return;
  const layer=(from,to,fresh)=>{
   const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;canvas.className='escape-wall-pressure';canvas.dataset.count=String(count);canvas.dataset.fresh=String(fresh);canvas.setAttribute('aria-hidden','true');Object.assign(canvas.style,{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',opacity:'.88'});
   const ctx=canvas.getContext('2d');for(let i=from;i<to;i++)drawGroup(ctx,i);ctx.globalCompositeOperation='destination-in';ctx.drawImage(mask,0,0);visual.append(canvas);layers.push(canvas);
   if(fresh&&!matchMedia('(prefers-reduced-motion: reduce)').matches)animations.push(canvas.animate([{opacity:0},{opacity:.88}],{duration:650,easing:'ease-out'}));
  };
  if(animate){if(count>1)layer(0,count-1,false);layer(count-1,count,true);}else layer(0,count,false);
 }).catch(()=>{});
 return()=>{alive=false;animations.forEach(a=>a.cancel());layers.forEach(c=>c.remove());};
}
