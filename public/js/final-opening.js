export function createFinalOpening(canvas,video,room){
 canvas.width=1920;canvas.height=1080;
 const ctx=canvas.getContext('2d'),still=document.createElement('canvas');
 still.width=1920;still.height=1080;
 still.getContext('2d').drawImage(video,0,0,1920,1080);
 function render(time){
  const u=Math.min(1,time/2),ease=u*u*(3-2*u);
  ctx.globalAlpha=1;ctx.drawImage(still,0,0);
  if(room.complete&&room.naturalWidth){
   ctx.globalAlpha=1-Math.max(0,(u-.9)/.1);
   ctx.drawImage(room,0,0,1920,1080);ctx.globalAlpha=1;
   ctx.save();ctx.beginPath();ctx.rect(1715,250,155,620);
   ctx.clip();ctx.drawImage(still,0,0);ctx.restore();
   const hinge=1725,top=285,bottom=835,width=130,angle=ease*1.4;
   const free=hinge+width*Math.cos(angle),recede=Math.sin(angle)*25;
   const opacity=1-Math.max(0,(u-.78)/.22);
   ctx.globalAlpha=opacity;
   for(let i=0;i<80;i++){
    const a=i/80,b=(i+1)/80;
    const x1=hinge+(free-hinge)*a,x2=hinge+(free-hinge)*b;
    const y1=top+recede*a,h=bottom-top-2*recede*a;
    ctx.drawImage(room,1380+103*a,270,103/80+.25,522,
     x1,y1,Math.max(.4,x2-x1+.4),h);
   }
   ctx.globalAlpha=opacity*.22*ease;ctx.fillStyle='#000';
   ctx.beginPath();ctx.moveTo(free,top+recede);
   ctx.lineTo(hinge,top);ctx.lineTo(hinge,bottom);
   ctx.lineTo(free,bottom-recede);ctx.closePath();ctx.fill();
  }
  ctx.globalAlpha=1;canvas.dataset.openProgress=String(u);
 }
 return{render,dispose(){still.width=still.height=0;}};
}
