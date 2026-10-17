
export const CHANNEL_LEVEL=-32;
export const CHANNEL_BED=-68;
export function addRiverChannel({texture,quad},ground,extent){
 const identity=[1,0,0,0,1,0,0,0,1];
 function canvas(w,h){
  const c=document.createElement('canvas');c.width=w;c.height=h;return c;
 }
 const lip=canvas(256,32),lc=lip.getContext('2d');
 lc.imageSmoothingEnabled=false;
 lc.drawImage(ground,0,ground.height-48,240,48,0,0,256,32);
 const soil=canvas(256,128),ctx=soil.getContext('2d');
 const gradient=ctx.createLinearGradient(0,0,0,128);
 gradient.addColorStop(0,'#77715a');
 gradient.addColorStop(.55,'#5c604e');
 gradient.addColorStop(1,'#374f4b');
 ctx.fillStyle=gradient;ctx.fillRect(0,0,256,128);
 let seed=17;
 const rnd=()=>{
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  return seed/4294967296;
 };
 for(let i=0;i<700;i++){
  ctx.fillStyle=i%3?'rgba(29,43,36,.18)':'rgba(179,162,113,.18)';
  ctx.fillRect(Math.floor(rnd()*128)*2,Math.floor(rnd()*64)*2,2+rnd()*5,2+rnd()*3);
 }
 const bed=canvas(256,128),bc=bed.getContext('2d');
 bc.fillStyle='#376b6e';bc.fillRect(0,0,256,128);
 for(let i=0;i<180;i++){
  const v=Math.floor(65+rnd()*28);
  bc.fillStyle='rgb('+v+','+(v+33)+','+(v+35)+')';
  bc.beginPath();
  bc.ellipse(rnd()*256,rnd()*128,2+rnd()*4,1+rnd()*2,0,0,Math.PI*2);
  bc.fill();
 }
 const grass=texture(lip),earth=texture(soil),bottom=texture(bed);
 function strip(tex,z1,y1,z2,y2,t1=0,t2=1){
  quad(tex,[
   {p:[-extent,y1,z1],uv:[-extent/240,t1]},
   {p:[extent,y1,z1],uv:[extent/240,t1]},
   {p:[extent,y2,z2],uv:[extent/240,t2]},
   {p:[-extent,y2,z2],uv:[-extent/240,t2]}
  ],identity,undefined,-1);
 }
 for(const [rim,side]of [[700,1],[1500,-1]]){
  strip(grass,rim,0,rim+side*10,-5);
  strip(earth,rim+side*10,-5,rim+side*45,-28,0,.55);
  strip(earth,rim+side*45,-28,rim+side*90,CHANNEL_BED,.55,1);
 }
 strip(bottom,790,CHANNEL_BED,1410,CHANNEL_BED,0,620/240);
}
