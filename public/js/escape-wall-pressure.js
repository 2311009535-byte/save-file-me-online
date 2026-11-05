import {prepareImage} from './image-cache.js';
const W=1920,H=1080;
let maskReady=null;
function wallAssets(){
 if(!maskReady)maskReady=prepareImage('/assets/escape/room-clean.png').then(image=>{
  // Lift only native ink, never the yellow background, from several wall
  // patches. This keeps the source's pointed ends, broken edges and grain.
  const source=document.createElement('canvas');source.width=W;source.height=H;const sc=source.getContext('2d',{willReadFrequently:true});sc.drawImage(image,0,0,W,H);const sourcePixels=sc.getImageData(0,0,W,H).data;
  const areas=[[505,100,120,80],[1515,678,115,110],[255,660,80,100],[200,440,90,90],[420,160,80,100],[490,210,90,100],[780,95,120,70],[1600,250,70,120]];
  const brushes=areas.map(([x,y,w,h])=>{
   const brush=document.createElement('canvas');brush.width=w;brush.height=h;const ink=new ImageData(w,h);
   for(let row=0;row<h;row++)for(let col=0;col<w;col++){
    const i=((y+row)*W+x+col)*4,max=Math.max(sourcePixels[i],sourcePixels[i+1],sourcePixels[i+2]);if(max>100)continue;
    const nearWall=[[4,0],[-4,0],[0,4],[0,-4],[3,3],[-3,-3]].some(([dx,dy])=>{const n=((y+row+dy)*W+x+col+dx)*4;return sourcePixels[n]>170&&sourcePixels[n+1]>155&&sourcePixels[n+2]<150;});if(!nearWall)continue;
    const n=(row*w+col)*4;for(let c=0;c<3;c++)ink.data[n+c]=Math.min(22,Math.round((sourcePixels[i]+sourcePixels[i+1]+sourcePixels[i+2])/6));ink.data[n+3]=Math.round(255*Math.min(1,(110-max)/30));
   }
   brush.getContext('2d').putImageData(ink,0,0);return brush;
  });
  return {brushes};
 }).catch(error=>{maskReady=null;throw error;});
 return maskReady;
}
// A single clean pocket protects the original child, chair, desktop and monitor.
// Everywhere else can be invaded, including floor, window and outer frame.
export const pressurePocket=[[.466,.155],[.547,.16],[.547,.205],[.573,.168],[.613,.183],[.620,.390],[.579,.401],[.573,.500],[.558,.607],[.478,.625],[.448,.568],[.431,.478],[.422,.362],[.390,.357],[.397,.297],[.421,.225],[.461,.222]];
function clearPocket(ctx,safePapers){
 ctx.save();ctx.globalCompositeOperation='destination-out';ctx.fillStyle='#000';ctx.beginPath();pressurePocket.forEach(([x,y],i)=>ctx[i?'lineTo':'moveTo'](x*W,y*H));ctx.closePath();ctx.fill();
 for(const paper of safePapers)ctx.fillRect((paper.x/100-.012)*W,(paper.y/100-.018)*H,(paper.w/100+.024)*W,(paper.h/100+.036)*H);
 ctx.restore();
}
function drawGroup(ctx,index,brushes,safePapers){
 let seed=413+index*997;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const marks=index===6?180:12+index*6,thickness=1.1+index*.20;
 for(let n=0;n<marks;n++){
  const brush=brushes[Math.floor(random()*brushes.length)],x=random()*W,y=random()*H,scale=(1.1+random()*1.4)*thickness;
  ctx.save();ctx.translate(x,y);ctx.rotate((random()-.5)*Math.PI);ctx.scale(scale*(random()>.5?1:-1),scale);
  ctx.globalAlpha=.88+random()*.12;
  // Offset impressions thicken the native ink without smoothing its dry edges.
  const spread=index*.15;for(const [dx,dy]of [[0,0],[spread,0],[-spread,0],[0,spread]])ctx.drawImage(brush,-brush.width/2+dx,-brush.height/2+dy);
  ctx.restore();
 }
 if(index===6){
  // The final sheet closes the remaining gaps with angular pencil hatching.
  // Broken strokes remain visible instead of fading the room to a flat black.
  ctx.save();ctx.strokeStyle='#080b0d';ctx.lineCap='butt';ctx.lineJoin='bevel';
  for(let n=0;n<600;n++){
   const x=random()*W,y=random()*H,angle=random()*Math.PI*2,length=500+random()*1800;
   const shade=6+Math.floor(random()*26);ctx.strokeStyle=`rgb(${shade},${shade},${shade})`;ctx.lineWidth=22+random()*42;ctx.globalAlpha=.87+random()*.13;ctx.beginPath();
   for(let k=0;k<8;k++){const t=k/7-.5,px=x+Math.cos(angle)*length*t+(random()-.5)*28,py=y+Math.sin(angle)*length*t+(random()-.5)*28;ctx[k?'lineTo':'moveTo'](px,py);}ctx.stroke();
  }
  ctx.restore();
 }
 clearPocket(ctx,safePapers);
}

export function mountWallPressure(visual,count,{animate=false,safePapers=[]}={}){
 if(!count)return()=>{};
 const layers=[],animations=[];let alive=true,frame=0;
 wallAssets().then(({brushes})=>{
  if(!alive)return;
  const layer=(from,to,fresh)=>{
   const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;canvas.className='escape-wall-pressure';canvas.dataset.count=String(count);canvas.dataset.style='native-ink';canvas.dataset.scope='screen';canvas.dataset.thickness=String(1.1+(count-1)*.20);canvas.dataset.fresh=String(fresh);canvas.setAttribute('aria-hidden','true');Object.assign(canvas.style,{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',opacity:'1',zIndex:1});
   const ctx=canvas.getContext('2d');for(let i=from;i<to;i++)drawGroup(ctx,i,brushes,safePapers);visual.append(canvas);layers.push(canvas);
   if(fresh&&!matchMedia('(prefers-reduced-motion: reduce)').matches)animations.push(canvas.animate([{opacity:0},{opacity:1}],{duration:650,easing:'ease-out'}));
  };
  function reveal(){if(!alive)return;if(visual.closest('#stage')?.dataset.motion){frame=requestAnimationFrame(reveal);return;}if(animate){if(count>1)layer(0,count-1,false);layer(count-1,count,true);}else layer(0,count,false);}
  reveal();
 }).catch(()=>{});
 return()=>{alive=false;cancelAnimationFrame(frame);animations.forEach(a=>a.cancel());layers.forEach(c=>c.remove());};
}
