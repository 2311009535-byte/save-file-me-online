// Animate the existing save icon; all source artwork remains unchanged on disk.
export function createWonderLoadingMotion(art){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const sample=document.createElement('canvas');sample.width=1672;sample.height=941;const source=sample.getContext('2d',{willReadFrequently:true});source.drawImage(art,0,0,1672,941);
 const areas=[[310,282,47,20],[365,337,42,45],[406,521,35,36],[600,369,23,23],[1298,278,28,25],[1325,323,40,39],[1175,399,39,38],[1214,425,39,38],[1256,519,39,39]];
 const decor=areas.map(([x,y,w,h],i)=>{const p=source.getImageData(x,y,w,h).data;return{x,y,w,h,i,bg:`rgb(${p[0]},${p[1]},${p[2]})`};});
 return function draw(ctx,p,elapsed){
  const phase=(elapsed%1600)/1600,smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
  const flap=reduced?1:phase<.18?smooth(phase/.18):phase>.83?1-smooth((phase-.83)/.17):1;
  const paper=reduced?1:phase<.18?0:phase<.42?smooth((phase-.18)/.24):phase<.61?1:1-smooth((phase-.61)/.22);
  ctx.save();ctx.imageSmoothingEnabled=false;
  for(const d of decor){if(reduced)break;const scale=1+.10*Math.sin(elapsed*.002+d.i),dx=Math.sin(elapsed*.0018+d.i)*11,dy=Math.sin(elapsed*.0023+d.i)*15;ctx.fillStyle=d.bg;ctx.fillRect(d.x,d.y,d.w,d.h);ctx.globalAlpha=.75+.25*Math.sin(elapsed*.0024+d.i);ctx.filter='brightness(1.35)';ctx.drawImage(art,d.x,d.y,d.w,d.h,d.x+dx-d.w*(scale-1)/2,d.y+dy-d.h*(scale-1)/2,d.w*scale,d.h*scale);ctx.filter='none';ctx.globalAlpha=1;}
  ctx.drawImage(art,945,389,106,111,784,389,106,111);
  const paperY=430-88*paper;ctx.save();ctx.beginPath();ctx.rect(794,340,84,94);ctx.clip();ctx.fillStyle='#584257';ctx.fillRect(808,paperY+3,60,69);ctx.fillStyle='#edcfb4';ctx.fillRect(803,paperY,60,66);ctx.fillStyle='#ae7e91';ctx.fillRect(803,paperY,60,3);ctx.fillRect(803,paperY,3,66);ctx.fillStyle='#695267';for(let i=0;i<3;i++)ctx.fillRect(814,paperY+15+i*11,35-i*5,2);ctx.restore();
  ctx.drawImage(art,794,434,84,54,794,434,84,54);
  ctx.save();ctx.translate(836,405);ctx.transform(1,0,-.16*flap,1-.72*flap,0,-7*flap);ctx.drawImage(art,794,403,84,31,-42,0,84,31);ctx.restore();
  ctx.restore();return paper;
 };
}

// Clip to the native pixel border and remove every baked fill pixel first.
export function paintWonderProgress(ctx,progress){
 ctx.save();ctx.beginPath();ctx.moveTo(653,545);ctx.lineTo(1018,545);ctx.lineTo(1023,550);ctx.lineTo(1023,561);ctx.lineTo(1018,566);ctx.lineTo(653,566);ctx.lineTo(648,561);ctx.lineTo(648,550);ctx.closePath();ctx.clip();
 ctx.fillStyle='#090b18';ctx.fillRect(647,544,377,23);
 if(progress>0){const gradient=ctx.createLinearGradient(649,0,1023,0);gradient.addColorStop(0,'#e9b3a7');gradient.addColorStop(1,'#ab6d92');ctx.fillStyle=gradient;ctx.fillRect(649,548,374*Math.max(0,Math.min(1,progress)),16);}
 ctx.restore();
}
