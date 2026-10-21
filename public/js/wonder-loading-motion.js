// Animate the existing save icon; all source artwork remains unchanged on disk.
export function createWonderLoadingMotion(art){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const sample=document.createElement('canvas');sample.width=1672;sample.height=941;const source=sample.getContext('2d',{willReadFrequently:true});source.drawImage(art,0,0,1672,941);
 const areas=[[310,282,47,20],[365,337,42,45],[406,521,35,36],[600,369,23,23],[1298,278,28,25],[1325,323,40,39],[1175,399,39,38],[1214,425,39,38],[1256,519,39,39]];
 const decor=areas.map(([x,y,w,h],i)=>{const p=source.getImageData(x,y,w,h).data;return{x,y,w,h,i,bg:`rgb(${p[0]},${p[1]},${p[2]})`};});
 return function draw(ctx,p,elapsed){
  const open=reduced?1:Math.min(1,elapsed/1000),ease=open*open*(3-2*open);
  ctx.save();ctx.imageSmoothingEnabled=false;
  for(const d of decor){if(reduced)break;ctx.fillStyle=d.bg;ctx.fillRect(d.x,d.y,d.w,d.h);ctx.globalAlpha=.8+.2*Math.sin(elapsed*.0016+d.i);ctx.drawImage(art,d.x,d.y,d.w,d.h,d.x+Math.sin(elapsed*.0009+d.i)*3,d.y+Math.sin(elapsed*.0012+d.i)*5,d.w,d.h);ctx.globalAlpha=1;}
  ctx.drawImage(art,945,389,106,111,784,389,106,111);
  const paperY=430-67*ease;ctx.save();ctx.beginPath();ctx.rect(794,340,84,94);ctx.clip();ctx.fillStyle='#584257';ctx.fillRect(808,paperY+3,60,69);ctx.fillStyle='#edcfb4';ctx.fillRect(803,paperY,60,66);ctx.fillStyle='#ae7e91';ctx.fillRect(803,paperY,60,3);ctx.fillRect(803,paperY,3,66);ctx.fillStyle='#695267';for(let i=0;i<3;i++)ctx.fillRect(814,paperY+15+i*11,35-i*5,2);ctx.restore();
  ctx.drawImage(art,794,434,84,54,794,434,84,54);
  ctx.save();ctx.translate(836,405);ctx.transform(1,0,-.16*ease,1-.72*ease,0,-7*ease);ctx.drawImage(art,794,403,84,31,-42,0,84,31);ctx.restore();
  ctx.restore();return ease;
 };
}
