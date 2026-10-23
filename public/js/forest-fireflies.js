
import {projectForestPoint} from './forest-walk.js';
import {routeX} from './forest-route.js';
export function drawForestFireflies(ctx,camera,time){
 ctx.save();ctx.globalCompositeOperation='lighter';
 for(let i=0;i<48;i++){
  const z=1640+i*110,side=i%2?1:-1,offset=side*(190+i*37%200);
  if(side>0&&offset>330&&z>2190&&z<2650)continue;
  const x=routeX(z)+offset+Math.sin(time*.65+i*2.3)*16;
  const y=32+(i*17%65)+Math.sin(time*.8+i)*12;
  const point=projectForestPoint(camera,x,y,z),depth=point.depth;
  if(depth<90||depth>1550)continue;
  const sx=point.x,sy=point.y;
  if(sx<0||sx>1672||sy<0||sy>941)continue;
  const fade=Math.min(1,(depth-90)/100,(1550-depth)/350);
  const pulse=.35+.65*Math.pow(.5+.5*Math.sin(time*1.8+i*2.4),2);
  const radius=Math.max(1.2,Math.min(3,1300/depth));
  const glow=ctx.createRadialGradient(sx,sy,0,sx,sy,radius*4);
  glow.addColorStop(0,'rgba(255,246,174,.8)');
  glow.addColorStop(1,'rgba(255,222,113,0)');
  ctx.globalAlpha=fade*pulse;ctx.fillStyle=glow;
  ctx.fillRect(sx-radius*4,sy-radius*4,radius*8,radius*8);
  ctx.fillStyle='#fffbd3';
  ctx.fillRect(Math.round(sx),Math.round(sy),radius,radius);
 }
 ctx.restore();
}
