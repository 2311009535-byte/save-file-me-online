// Displacement is separate from each particle's drift/assembly position: the
// pointer never changes an object's destination or its saved formation state.
export function particleField(p,x,y,field,dt){
 let tx=0,ty=0;
 if(field){const dx=x-field.x,dy=y-field.y,d=Math.hypot(dx,dy),r=145;
  if(d<r){const angle=d>.01?Math.atan2(dy,dx):(p.g+p.a+1)*2.39996323,fall=1-d/r,push=(r-d)*.78;
   tx=Math.cos(angle)*push-Math.sin(angle)*fall*8;ty=Math.sin(angle)*push+Math.cos(angle)*fall*8;
  }
 }
 const k=1-Math.exp(-Math.min(Math.max(dt,0),.04)*(field?8:4));
 p.fieldX=(p.fieldX||0)+(tx-(p.fieldX||0))*k;p.fieldY=(p.fieldY||0)+(ty-(p.fieldY||0))*k;
 return{x:x+p.fieldX,y:y+p.fieldY,shift:Math.hypot(p.fieldX,p.fieldY)};
}
