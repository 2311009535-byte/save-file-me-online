const W=1672,H=941;
const ease=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
// Cut out native paper/ink and replace only those pixels with nearby paper.
// This keeps the supplied grain and notebook ruling instead of flat patches.
function cutout(source,box,backgroundY,blue=false){
 const [x,y,w,h]=box,ctx=source.getContext('2d'),sprite=document.createElement('canvas');sprite.width=w;sprite.height=h;
 const c=sprite.getContext('2d'),pixels=ctx.getImageData(x,y,w,h),mask=document.createElement('canvas');mask.width=w;mask.height=h;const m=mask.getContext('2d'),alpha=m.createImageData(w,h);
 for(let i=0;i<pixels.data.length;i+=4){const[r,g,b]=pixels.data.slice(i,i+3);const strength=blue?(b-Math.min(r,g)-35)/80:(Math.max(r,g,b)-64)/35;const a=Math.round(Math.max(0,Math.min(1,strength))*255);pixels.data[i+3]=a;alpha.data[i+3]=a;}
 c.putImageData(pixels,0,0);m.putImageData(alpha,0,0);
 const patch=document.createElement('canvas');patch.width=w;patch.height=h;const pc=patch.getContext('2d');pc.drawImage(source,x,backgroundY,w,h,0,0,w,h);pc.globalCompositeOperation='destination-in';pc.drawImage(mask,0,0);ctx.drawImage(patch,x,y);
 return{sprite,x,y,w,h};
}
function trace(c,points,progress){
 const lengths=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1]));let remaining=lengths.reduce((a,b)=>a+b,0)*Math.max(0,Math.min(1,progress));
 c.beginPath();c.moveTo(...points[0]);for(let i=0;i<lengths.length&&remaining>0;i++){const t=Math.min(1,remaining/lengths[i]);c.lineTo(points[i][0]+(points[i+1][0]-points[i][0])*t,points[i][1]+(points[i+1][1]-points[i][1])*t);remaining-=lengths[i];}c.stroke();
}
export function createChapterLoadingMotion(chapter,art,{reduced=matchMedia('(prefers-reduced-motion: reduce)').matches}={}){
 if(chapter!==3&&chapter!==4)return null;
 const base=document.createElement('canvas');base.width=W;base.height=H;const b=base.getContext('2d',{willReadFrequently:true});b.drawImage(art,0,0,W,H);
 const papers=chapter===3?[[338,346,146,118],[1186,425,180,134],[1250,331,23,24],[1077,473,23,24],[1166,603,24,24],[491,517,25,25],[206,463,26,26],[1435,425,26,25]].map((box,i)=>({...cutout(base,box,box[1]<500?730:800),i})):[];
 if(chapter===4){cutout(base,[307,287,49,54],381,true);cutout(base,[1297,508,57,62],696,true);}
 function cube(c,x,y,size,progress){
  const h=22*size*ease(progress),q=[[x,y-22*size],[x+19*size,y-11*size],[x,y],[x-19*size,y-11*size]],top=q.map(([a,b])=>[a,b-h]);
  c.save();c.strokeStyle='#1919ca';c.lineWidth=1.6;c.lineJoin='round';c.lineCap='round';
  trace(c,[...q,q[0]],1);for(const i of [1,2,3])trace(c,[q[i],top[i]],ease(progress));trace(c,[...top,top[0]],ease(progress));trace(c,[top[2],q[2]],1);c.restore();
 }
 return function paint(c,p,elapsed){
  const settle=1-ease((p-.85)/.15);c.save();
  if(chapter===3&&!reduced){
   c.drawImage(base,0,0);for(const d of papers){const group=d.i<2,phase=elapsed*(group?.003:.0018+d.i*.00013)+d.i*1.7,dx=Math.sin(phase)*(group?1.5:5)*settle,dy=Math.sin(phase*.8)*(group?2:7)*settle;
    c.save();c.translate(d.x+d.w/2+dx,d.y+d.h/2+dy);c.rotate(Math.sin(phase)*(group?.012:.12)*settle);c.drawImage(d.sprite,-d.w/2,-d.h/2);c.restore();}
   const flash=Math.max(0,Math.sin(elapsed*.0032-.5))**8*.4*settle;c.strokeStyle=`rgba(255,245,225,${flash})`;c.lineWidth=1.6;trace(c,[[780,381],[775,401],[779,421],[775,444],[779,467],[777,498],[799,502]],1);
   c.restore();return p>=.99?'paper-settled':'paper-tremble';
  }
  if(chapter===4&&!reduced){
   c.drawImage(base,0,0);cube(c,331,336,1,.12+.88*ease((p-.05)/.65));cube(c,1326,563,1.2,.12+.88*ease((p-.25)/.65));
   c.strokeStyle='#2727d2';c.globalAlpha=.28+.12*Math.sin(elapsed*.0025)**2*settle;c.lineWidth=1.1;c.setLineDash([5,5]);trace(c,[[762,504],[762,390],[783,369],[878,369],[904,395],[904,505],[762,504]],ease(p/.8));c.setLineDash([]);
   c.globalAlpha=.5;for(const [x,y]of [[762,390],[904,505]]){trace(c,[[x-6,y],[x+6,y]],ease(p/.7));trace(c,[[x,y-6],[x,y+6]],ease(p/.7));}
  }
  if(chapter===4&&p>.8){c.globalAlpha=1;c.strokeStyle='#b6383b';c.lineWidth=3;c.lineCap='round';c.lineJoin='round';trace(c,[[915,424],[925,434],[946,405]],reduced?1:ease((p-.8)/.2));}
  c.restore();return reduced?'static':p>=.99?'blueprint-ready':'blueprint-building';
 };
}
