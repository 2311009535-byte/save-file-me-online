import {prepareImage} from './image-cache.js';
const W=1920,H=1080;
let maskReady=null;
function wallAssets(){
 if(!maskReady)maskReady=prepareImage('/assets/escape/room-clean.png').then(image=>{
  const mask=document.createElement('canvas');mask.width=W;mask.height=H;const ctx=mask.getContext('2d',{willReadFrequently:true});
  // Trace only the walls, keeping the window, desk, floor and door interior out.
  const regions=[[[.24,0],[.61,0],[.60,.18],[.57,.17],[.56,.23],[.42,.22],[.40,.28],[.32,.23],[.29,.31],[.27,.18]],[[.103,.02],[.12,.01],[.14,.16],[.21,.40],[.23,.51],[.29,.67],[.41,.91],[.31,.88],[.20,.78],[.11,.59],[.075,.43],[.06,.22]],[[.80,0],[.87,.06],[.90,.21],[.90,.40],[.87,.57],[.80,.75],[.69,.90],[.61,.94],[.68,.85],[.77,.68],[.83,.51],[.86,.31],[.84,.14]]];
  ctx.save();ctx.beginPath();for(const points of regions){points.forEach(([x,y],i)=>i?ctx.lineTo(x*W,y*H):ctx.moveTo(x*W,y*H));ctx.closePath();}ctx.clip();ctx.drawImage(image,0,0,W,H);ctx.restore();
  // Lift only native ink, never the yellow background, from several wall
  // patches. This keeps the source's pointed ends, broken edges and grain.
  const source=document.createElement('canvas');source.width=W;source.height=H;const sc=source.getContext('2d',{willReadFrequently:true});sc.drawImage(image,0,0,W,H);const sourcePixels=sc.getImageData(0,0,W,H).data;
  const areas=[[505,100,120,80],[1515,678,115,110],[255,660,80,100],[200,440,90,90],[420,160,80,100],[490,210,90,100],[780,95,120,70],[1600,250,70,120]];
  const brushes=areas.map(([x,y,w,h])=>{
   const brush=document.createElement('canvas');brush.width=w;brush.height=h;const ink=new ImageData(w,h);
   for(let row=0;row<h;row++)for(let col=0;col<w;col++){
    const i=((y+row)*W+x+col)*4,max=Math.max(sourcePixels[i],sourcePixels[i+1],sourcePixels[i+2]);if(max>100)continue;
    const nearWall=[[4,0],[-4,0],[0,4],[0,-4],[3,3],[-3,-3]].some(([dx,dy])=>{const n=((y+row+dy)*W+x+col+dx)*4;return sourcePixels[n]>170&&sourcePixels[n+1]>155&&sourcePixels[n+2]<150;});if(!nearWall)continue;
    const n=(row*w+col)*4;for(let c=0;c<3;c++)ink.data[n+c]=sourcePixels[i+c];ink.data[n+3]=Math.round(255*Math.min(1,(110-max)/30));
   }
   brush.getContext('2d').putImageData(ink,0,0);return brush;
  });
  const pixels=ctx.getImageData(0,0,W,H);for(let i=0;i<pixels.data.length;i+=4){const r=pixels.data[i],g=pixels.data[i+1],b=pixels.data[i+2],a=pixels.data[i+3];pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=255;pixels.data[i+3]=a&&r>175&&g>160&&b<160&&r>b*1.35&&g>b*1.35?255:0;}ctx.putImageData(pixels,0,0);return {mask,brushes};
 }).catch(error=>{maskReady=null;throw error;});
 return maskReady;
}
function drawGroup(ctx,index,brushes){
 let seed=413+index*997;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 // Local angles follow the curved walls; small variations avoid stamped rows.
 const anchors=[[.34,.12,-.15],[.48,.07,-.1],[.56,.12,.1],[.10,.30,-.3],[.12,.45,-.4],[.18,.61,-.55],[.27,.79,-.65],[.87,.30,.2],[.84,.55,.35],[.76,.76,.55]];
 for(let n=0;n<15;n++){
  const [ax,ay,angle]=anchors[(index*7+n*3)%anchors.length],brush=brushes[(index*3+n)%brushes.length];
  const x=ax*W+(random()-.5)*120,y=ay*H+(random()-.5)*90,scale=1.05+random()*.65;
  ctx.save();ctx.translate(x,y);ctx.rotate(angle+(random()-.5)*.3);ctx.scale(scale*(random()>.5?1:-1),scale*(.8+random()*.35));ctx.globalAlpha=.83+random()*.17;ctx.drawImage(brush,-brush.width/2,-brush.height/2);ctx.restore();
 }
}

export function mountWallPressure(visual,count,{animate=false}={}){
 if(!count)return()=>{};
 const layers=[],animations=[];let alive=true,frame=0;
 wallAssets().then(({mask,brushes})=>{
  if(!alive)return;
  const layer=(from,to,fresh)=>{
   const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;canvas.className='escape-wall-pressure';canvas.dataset.count=String(count);canvas.dataset.style='native-ink';canvas.dataset.fresh=String(fresh);canvas.setAttribute('aria-hidden','true');Object.assign(canvas.style,{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',opacity:'.88'});
   const ctx=canvas.getContext('2d');for(let i=from;i<to;i++)drawGroup(ctx,i,brushes);ctx.globalCompositeOperation='destination-in';ctx.drawImage(mask,0,0);visual.append(canvas);layers.push(canvas);
   if(fresh&&!matchMedia('(prefers-reduced-motion: reduce)').matches)animations.push(canvas.animate([{opacity:0},{opacity:.88}],{duration:650,easing:'ease-out'}));
  };
  function reveal(){if(!alive)return;if(visual.closest('#stage')?.dataset.motion){frame=requestAnimationFrame(reveal);return;}if(animate){if(count>1)layer(0,count-1,false);layer(count-1,count,true);}else layer(0,count,false);}
  reveal();
 }).catch(()=>{});
 return()=>{alive=false;cancelAnimationFrame(frame);animations.forEach(a=>a.cancel());layers.forEach(c=>c.remove());};
}
