import {prepareImage} from './image-cache.js';

// Keep the original 02 archive fixed. A sheet emerges directly from behind it;
// there is no opening flap or reconstruction of the surrounding texture.
export function mountEscapeLoadingMotion(host,src){
 const canvas=document.createElement('canvas');canvas.width=1672;canvas.height=941;canvas.className='escape-loading-motion';canvas.setAttribute('aria-hidden','true');canvas.dataset.archive='fixed';Object.assign(canvas.style,{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:1});host.append(canvas);
 const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let art=null,alive=true,decor=[];
 prepareImage(src).then(image=>{
  if(!alive)return;art=image;
  const source=document.createElement('canvas');source.width=1672;source.height=941;const sc=source.getContext('2d',{willReadFrequently:true});sc.drawImage(image,0,0,1672,941);
  const areas=[[370,342,32,32],[600,370,22,22],[410,526,30,30],[375,574,26,26],[1332,326,28,28],[1299,282,25,18],[1178,400,31,32],[1218,426,34,34],[1260,519,32,34],[1284,482,37,17],[312,285,43,16],[333,441,27,20],[529,474,30,18],[1078,483,20,17]];
  decor=areas.map(([x,y,w,h],i)=>{
   const pixels=sc.getImageData(x,y,w,h),sprite=document.createElement('canvas'),clean=document.createElement('canvas');sprite.width=clean.width=w;sprite.height=clean.height=h;
   const cut=new ImageData(w,h),patch=new ImageData(w,h),left=sc.getImageData(x-3,y,1,h).data,right=sc.getImageData(x+w+3,y,1,h).data;
   for(let row=0;row<h;row++)for(let col=0;col<w;col++){
    const n=(row*w+col)*4,r=pixels.data[n],g=pixels.data[n+1],b=pixels.data[n+2];
    if(Math.max(r,g,b)<35||b<r+3)continue;
    for(let c=0;c<3;c++){cut.data[n+c]=pixels.data[n+c];patch.data[n+c]=left[row*4+c]*(1-col/(w-1))+right[row*4+c]*col/(w-1);}
    cut.data[n+3]=patch.data[n+3]=255;
   }
   sprite.getContext('2d').putImageData(cut,0,0);clean.getContext('2d').putImageData(patch,0,0);return{x,y,w,h,i,sprite,clean};
  });
 }).catch(()=>{});
 function paint(elapsed){
  if(!alive||!art)return;
  const phase=(elapsed%3200)/3200,smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
  const lift=reduced?1:phase<.46?smooth(phase/.46):phase<.68?1:1-smooth((phase-.68)/.32),y=Math.round(403-66*lift);
  ctx.clearRect(0,0,1672,941);
  if(!reduced){
   // Replace just each luminous UI pixel, preserving the original surrounding
   // texture. Their native shapes drift at separate rates on both sides.
   for(const d of decor)ctx.drawImage(d.clean,d.x,d.y);
   for(const d of decor){const dx=Math.round(Math.sin(elapsed/1450+d.i)*9),dy=Math.round(Math.sin(elapsed/1900+d.i*.8)*12);ctx.globalAlpha=.85+.15*Math.sin(elapsed/1200+d.i);ctx.drawImage(d.sprite,d.x+dx,d.y+dy);}
   ctx.globalAlpha=1;
  }
  ctx.save();ctx.beginPath();ctx.rect(794,333,84,155);ctx.clip();
  ctx.fillStyle='#454573';ctx.fillRect(807,y+3,60,66);ctx.fillStyle='#c5c6eb';ctx.fillRect(803,y,60,66);ctx.fillStyle='#8e91c3';ctx.fillRect(803,y,60,3);ctx.fillRect(803,y,3,66);ctx.fillStyle='#555982';for(let i=0;i<3;i++)ctx.fillRect(814,y+15+i*11,35-i*5,2);
  // Native icon pixels always cover the sheet's lower part, including its top.
  ctx.drawImage(art,794,403,84,85,794,403,84,85);ctx.restore();
  canvas.dataset.periodMs='3200';canvas.dataset.decorCount=String(decor.length);canvas.dataset.decorMotion=reduced?'static':'floating';canvas.dataset.paperLift=lift.toFixed(4);canvas.dataset.paperY=String(y);canvas.dataset.motion=reduced?'static':'sliding';
 }
 return{paint,dispose(){alive=false;canvas.remove();}};
}
