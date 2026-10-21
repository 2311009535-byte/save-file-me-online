// Restore completed objects from the supplied sharp room artwork. No palette
// reconstruction, interpolation grid or blur is applied to the object pixels.
const paths={window:[[103,104],[289,154],[289,520],[105,550]],map:[[585,181],[916,181],[916,389],[585,389]],note:[[1043,329],[1100,329],[1100,393],[1043,393]],box:[[1445,654],[1480,645],[1586,645],[1586,610],[1669,622],[1669,897],[1560,913],[1467,875]]};
function locationOn(points,x,y){let d=Infinity,inside=false;for(let a=0,b=points.length-1;a<points.length;b=a++){const p=points[a],q=points[b],dx=q[0]-p[0],dy=q[1]-p[1],t=Math.max(0,Math.min(1,((x-p[0])*dx+(y-p[1])*dy)/(dx*dx+dy*dy)));d=Math.min(d,Math.hypot(x-p[0]-t*dx,y-p[1]-t*dy));if((p[1]>y)!==(q[1]>y)&&x<(q[0]-p[0])*(y-p[1])/(q[1]-p[1])+p[0])inside=!inside;}return{d,inside};}
export function cleanCompletedContours(visual,source,done,cleanSource){
 const key=Object.keys(paths).filter(id=>done[id]).join(',');if(!key||!cleanSource)return;
 const base=visual.querySelector('.scene-image');if(!base)return;
 const canvas=document.createElement('canvas');canvas.width=1669;canvas.height=942;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(source,0,0,1669,942);const image=ctx.getImageData(0,0,1669,942);
 ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,1669,942);ctx.drawImage(cleanSource,0,0,1669,942);const clean=ctx.getImageData(0,0,1669,942);
 for(const [id,points]of Object.entries(paths)){
  if(!done[id])continue;
  const x1=Math.max(0,Math.min(...points.map(p=>p[0]))-42),x2=Math.min(1668,Math.max(...points.map(p=>p[0]))+42),y1=Math.max(0,Math.min(...points.map(p=>p[1]))-42),y2=Math.min(941,Math.max(...points.map(p=>p[1]))+42);
  for(let y=y1;y<=y2;y++)for(let x=x1;x<=x2;x++){
   const {d,inside}=locationOn(points,x,y);if(!inside&&d>=42)continue;
   const alpha=inside||d<=34?1:(42-d)/8,i=(y*1669+x)*4;
   for(let ch=0;ch<3;ch++)image.data[i+ch]=Math.round(image.data[i+ch]*(1-alpha)+clean.data[i+ch]*alpha);
  }
 }
 ctx.putImageData(image,0,0);canvas.className='wonder-clean-room';canvas.dataset.completed=key;canvas.dataset.source='extra.png';Object.assign(canvas.style,{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none'});visual.insertBefore(canvas,base.nextSibling);
}
