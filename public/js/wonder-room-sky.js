export function hideRoomMeteor(visual,completed){
 if(completed)return;
 const source=visual.querySelector('.scene-image');
 if(!source)return;
 const canvas=document.createElement('canvas');
 canvas.width=1669;
 canvas.height=942;
 canvas.className='wonder-room-sky';
 canvas.dataset.meteor='hidden';
 Object.assign(canvas.style,{
  position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none'
 });
 visual.append(canvas);
 function mask(x,y){
  const dx=90,dy=-80;
  const t=Math.max(0,Math.min(1,((x-194)*dx+(y-285)*dy)/(dx*dx+dy*dy)));
  const d=Math.hypot(x-194-t*dx,y-285-t*dy);
  return Math.max(
   Math.max(0,Math.min(1,(12-d)/4)),
   Math.max(0,Math.min(1,(23-Math.hypot(x-195,y-284))/6))
  );
 }
 function paint(){
  if(!canvas.isConnected||!source.complete||!source.naturalWidth)return;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  ctx.drawImage(source,0,0,1669,942);
  const im=ctx.getImageData(170,180,126,135);
  const original=new Uint8ClampedArray(im.data);
  for(let y=0;y<135;y++)for(let x=0;x<126;x++){
   const a=mask(x+170,y+180);
   if(!a)continue;
   let up=y-1,down=y+1;
   while(up>0&&mask(x+170,up+180)>.01)up--;
   while(down<134&&mask(x+170,down+180)>.01)down++;
   up=Math.max(0,up-3);
   down=Math.min(134,down+3);
   const t=(y-up)/Math.max(1,down-up),i=(y*126+x)*4;
   for(let c=0;c<3;c++){
    const color=original[(up*126+x)*4+c]*(1-t)+original[(down*126+x)*4+c]*t;
    im.data[i+c]=original[i+c]*(1-a)+color*a;
   }
  }
  ctx.clearRect(0,0,1669,942);
  ctx.putImageData(im,170,180);
 }
 if(source.complete)paint();
 else source.addEventListener('load',paint,{once:true});
}
