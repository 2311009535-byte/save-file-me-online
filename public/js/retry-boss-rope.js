import {canvas,place,WIDTH,HEIGHT} from './retry-atmosphere-layers.js';
const isRed=(r,g,b)=>r>105&&r>g*1.55&&r>b*1.55;
// Pulse the photographed red paper itself, preserving the crumpled texture.
export function addBossBackdrop(root,source,backdrop,art,animate){
 const [cx,cy]=art.boss.origin,sun=canvas(),ctx=sun.getContext('2d',{willReadFrequently:true});ctx.drawImage(backdrop,0,0);const pixels=ctx.getImageData(0,0,WIDTH,HEIGHT);
 for(let y=0;y<HEIGHT;y++)for(let x=0;x<WIDTH;x++){const k=(y*WIDTH+x)*4;pixels.data[k+3]*=x>cx-265&&x<cx+265&&y<cy+175&&isRed(...pixels.data.subarray(k,k+3))?1:0;}
 ctx.putImageData(pixels,0,0);place(sun,[0,0,WIDTH,HEIGHT]);sun.dataset.bossSun='native';root.append(sun);
 animate(sun,'boss-sun',[{filter:'brightness(.62)'},{filter:'brightness(1.15)',offset:.5},{filter:'brightness(.62)'}],{duration:4800,easing:'ease-in-out'});
 // The art hides the lower torso behind towers. Complete its shadow behind
 // them, using sampled native ink grain, while the paper road stays in front.
 const body=canvas(),bc=body.getContext('2d',{willReadFrequently:true});bc.beginPath();bc.moveTo(cx-87,cy-42);bc.bezierCurveTo(cx-158,cy+8,cx-96,cy+65,cx-80,cy+94);
 for(let i=0;i<=28;i++){const t=i/28;bc.lineTo(cx-80+t*160,cy+94+Math.sin(t*Math.PI)*57+Math.sin(i*2.37)*9);}
 bc.bezierCurveTo(cx+91,cy+65,cx+158,cy+8,cx+83,cy-42);bc.closePath();bc.fillStyle='#0c0c0b';bc.fill();
 const ink=source.getContext('2d',{willReadFrequently:true}).getImageData(cx-60,cy-60,120,90).data,palette=[];
 for(let i=0;i<ink.length;i+=4)if(Math.max(ink[i],ink[i+1],ink[i+2])<32)palette.push([ink[i],ink[i+1],ink[i+2]]);
 const image=bc.getImageData(0,0,WIDTH,HEIGHT),base=backdrop.getContext('2d',{willReadFrequently:true}).getImageData(0,0,WIDTH,HEIGHT).data;
 for(let y=Math.max(0,cy-60);y<Math.min(HEIGHT,cy+200);y++)for(let x=cx-165;x<cx+165;x++){const k=(y*WIDTH+x)*4;if(!image.data[k+3])continue;const paper=Math.min(base[k],base[k+1],base[k+2])>145&&base[k]-base[k+2]>8;if(paper&&y>cy+16){image.data[k+3]=0;continue;}const color=palette[(x*37+y*113)%palette.length]||[12,12,11];image.data.set(color.map(v=>Math.min(v,14)),k);}
 bc.putImageData(image,0,0);place(body,[0,0,WIDTH,HEIGHT]);body.dataset.bossCompletion='native-ink';root.append(body);
}
// Only the red fibres are displaced. Pole knots and both ends stay anchored.
// Pre-render a tiny sprite strip once; no per-frame canvas or image downloads.
export function prepareRopes(source,backdrop,art){
 const cleaned=canvas(),cc=cleaned.getContext('2d',{willReadFrequently:true});cc.drawImage(backdrop,0,0);const base=cc.getImageData(0,0,WIDTH,HEIGHT),original=new Uint8ClampedArray(base.data),src=source.getContext('2d',{willReadFrequently:true}).getImageData(0,0,WIDTH,HEIGHT).data,ropes=[];
 for(const [a,b]of art.ropes||[]){
  const x=Math.floor(a[0]+12),y=Math.floor(Math.min(a[1],b[1])-12),w=Math.ceil(b[0]-a[0]-24),h=Math.ceil(Math.abs(a[1]-b[1])+66),patch=canvas(w,h),pc=patch.getContext('2d'),image=pc.createImageData(w,h);
  for(let py=0;py<h;py++)for(let px=0;px<w;px++){
   const k=((y+py)*WIDTH+x+px)*4,j=(py*w+px)*4;if(!isRed(...src.subarray(k,k+3))||!isRed(...original.subarray(k,k+3)))continue;
   image.data.set(src.subarray(k,k+4),j);
   // Sample neighbouring wall, never the overlaid building or a flat colour.
   for(let d=5;d<=16;d++){const q=((y+py-d)*WIDTH+x+px)*4;if(!isRed(...original.subarray(q,q+3))){base.data.set(original.subarray(q,q+4),k);break;}}
  }
  pc.putImageData(image,0,0);ropes.push({patch,box:[x,y,w,h]});
 }
 cc.putImageData(base,0,0);return{cleaned,ropes};
}
export function addRopes(root,ropes,animate){
 ropes.forEach(({patch,box},i)=>{
  const [x,y,w,h]=box,pad=5,frames=12,strip=canvas(w*frames,h+pad*2),ctx=strip.getContext('2d');
  for(let frame=0;frame<frames;frame++)for(let col=0;col<w;col++){
   const t=col/(w-1),dy=3.8*Math.sin(Math.PI*t)**2*Math.sin(frame/frames*Math.PI*2+t*Math.PI*3);ctx.drawImage(patch,col,0,1,h,frame*w+col,pad+dy,1,h);
  }
  const viewport=document.createElement('div');place(viewport,[x,y-pad,w,h+pad*2]);Object.assign(viewport.style,{overflow:'hidden',pointerEvents:'none'});viewport.dataset.redRope=String(i);Object.assign(strip.style,{width:frames*100+'%',height:'100%',display:'block'});viewport.append(strip);root.append(viewport);
  animate(strip,'red-rope',[{transform:'translateX(0px)'},{transform:`translateX(${-w*frames}px)`}],{duration:1100+i*170,delay:-i*280,easing:`steps(${frames},end)`});
 });
}
