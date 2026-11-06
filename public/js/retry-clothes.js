import {canvas,sample,place,WIDTH} from './retry-atmosphere-layers.js';
// Native coat flaps hinge at the waist, with the same 7-degree paper swing as
// the flags. A stationary backing removes the old hem before it moves.
export function addClothes(root,source,art,animate){
 (art.clothes||[]).forEach((points,i)=>{
  const {c,box}=sample(source,points,{cream:true}),[x,y,w,h]=box,ctx=c.getContext('2d',{willReadFrequently:true}),ink=ctx.getImageData(0,0,w,h),background=canvas(w,h),bc=background.getContext('2d'),fill=bc.createImageData(w,h),native=source.getContext('2d',{willReadFrequently:true}).getImageData(0,y,WIDTH,h).data;
  for(let row=0;row<h;row++){
   let col=0;while(col<w){if(!ink.data[(row*w+col)*4+3]){col++;continue;}const start=col;while(col<w&&ink.data[(row*w+col)*4+3])col++;const end=col-1,left=(row*WIDTH+Math.max(0,x+start-5))*4,right=(row*WIDTH+Math.min(WIDTH-1,x+end+5))*4;
    for(let px=start;px<=end;px++){const k=(row*w+px)*4,t=(px-start)/Math.max(1,end-start);for(let ch=0;ch<3;ch++)fill.data[k+ch]=Math.round(native[left+ch]*(1-t)+native[right+ch]*t);fill.data[k+3]=ink.data[k+3];}
   }
  }
  bc.putImageData(fill,0,0);place(background,box);root.append(background);place(c,box);c.dataset.playerClothes=String(i+1);c.style.transformOrigin='82% 22%';root.append(c);
  animate(c,'player-clothes',[{transform:'none'},{offset:.24,transform:'skewY(-7deg) scaleX(.92)'},{offset:.51,transform:'skewY(5deg) scaleX(.99)'},{offset:.77,transform:'skewY(-3deg) scaleX(.95)'},{transform:'none'}],{duration:1700+i*370,delay:-i*630,easing:'ease-in-out'});
 });
}
