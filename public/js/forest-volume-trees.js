
// Solid near trees reuse the approved artwork as leaf and bark textures.
export function createVolumeTrees({texture,quad},image){
 const identity=[1,0,0,0,1,0,0,0,1],cache=new Map();
 function material(kind,shade){
  const key=kind+shade;
  if(cache.has(key))return cache.get(key);
  const c=document.createElement('canvas');c.width=32;c.height=32;
  const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;
  const r=kind==='bark'?[586,536,24,48]:[548,438,42,42];
  ctx.drawImage(image,...r,0,0,32,32);
  if(shade){
   ctx.fillStyle=shade>0?'#ffe5a4':'#101d24';
   ctx.globalAlpha=Math.abs(shade);ctx.fillRect(0,0,32,32);
  }
  const tex=texture(c);cache.set(key,tex);return tex;
 }
 function box(x,y,z,w,h,d,kind){
  const l=x-w/2,r=x+w/2,n=z-d/2,f=z+d/2,b=y,t=y+h;
  const faces=[
   [[l,t,n],[r,t,n],[r,b,n],[l,b,n]],
   [[r,t,f],[l,t,f],[l,b,f],[r,b,f]],
   [[l,t,f],[l,t,n],[l,b,n],[l,b,f]],
   [[r,t,n],[r,t,f],[r,b,f],[r,b,n]],
   [[l,t,f],[r,t,f],[r,t,n],[l,t,n]],
   [[l,b,n],[r,b,n],[r,b,f],[l,b,f]]
  ];
  faces.forEach((points,i)=>quad(
   material(kind,[0,-.12,-.18,.12,.16,-.2][i]),
   points.map((p,j)=>({p,uv:[[0,0],[1,0],[1,1],[0,1]][j]})),
   identity
  ));
 }
 return function draw(p){
  const h=p.height,x=p.x,z=p.z;
  box(x,0,z,h*.12,h*.59,h*.12,'bark');
  box(x-h*.12,h*.42,z,h*.24,h*.065,h*.065,'bark');
  box(x+h*.12,h*.48,z+h*.03,h*.24,h*.065,h*.065,'bark');
  box(x,h*.43,z,h*.66,h*.26,h*.48,'leaf');
  box(x-h*.12,h*.62,z+h*.025,h*.53,h*.22,h*.46,'leaf');
  box(x+h*.075,h*.8,z-h*.025,h*.36,h*.2,h*.34,'leaf');
 };
}
