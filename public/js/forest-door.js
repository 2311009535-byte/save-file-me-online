import {projectForestPoint} from './forest-walk.js';
import {routeX} from './forest-route.js';
export const DOOR_Z=6500;
export const DOOR_VERTEX=`if(uEffect>5.5&&uEffect<6.5){float hinge=-680.-(1303.*.5-470.)*180./1207.;float dx=world.x-hinge;world.x=hinge+dx*cos(uDoorOpen*1.48);world.z+=dx*sin(uDoorOpen*1.48);}`;
export function addForestDoor({texture,quad},image){
 const w=image.width,h=image.height,scale=180/h,x=routeX(DOOR_Z),identity=[1,0,0,0,1,0,0,0,1];
 const panel=(c,left,top,right,bottom,z,effect=0)=>quad(texture(c),[{p:[x+(left-w/2)*scale,(h-top)*scale,z],uv:[0,0]},{p:[x+(right-w/2)*scale,(h-top)*scale,z],uv:[1,0]},{p:[x+(right-w/2)*scale,(h-bottom)*scale,z],uv:[1,1]},{p:[x+(left-w/2)*scale,(h-bottom)*scale,z],uv:[0,1]}],identity,undefined,false,effect);
 const frame=document.createElement('canvas');frame.width=w;frame.height=h;const ctx=frame.getContext('2d');ctx.drawImage(image,0,0);ctx.clearRect(470,286,370,794);panel(frame,0,0,w,h,DOOR_Z);
 const light=document.createElement('canvas');light.width=light.height=2;const lc=light.getContext('2d');lc.fillStyle='#edc784';lc.fillRect(0,0,2,2);panel(light,470,286,840,1080,DOOR_Z+5);
 const leaf=document.createElement('canvas');leaf.width=370;leaf.height=794;leaf.getContext('2d').drawImage(image,470,286,370,794,0,0,370,794);panel(leaf,470,286,840,1080,DOOR_Z-1,6);
}
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export function forestDoorShot(start,elapsed,reduced=false){
 const t=Math.max(0,Math.min(1,elapsed/(reduced?300:1900))),push=reduced?0:smooth(t),aim=reduced?0:smooth(t/.55);
 const camera={...start,x:start.x+(routeX(DOOR_Z)-start.x)*push,y:start.y+(85-start.y)*push,z:start.z+(DOOR_Z-80-start.z)*push};
 const dx=routeX(DOOR_Z)-camera.x,dz=DOOR_Z-camera.z,targetYaw=Math.atan2(dx,dz),targetPitch=Math.atan2(80-camera.y,Math.hypot(dx,dz))+Math.atan(230/900);
 camera.yaw=(start.yaw||0)+(targetYaw-(start.yaw||0))*aim;camera.pitch=(start.pitch||0)+(targetPitch-(start.pitch||0))*aim;camera.roll=(start.roll||0)*(1-aim);camera.zoom=(start.zoom||1)+(1-(start.zoom||1))*aim;camera.fullSky=(start.fullSky||0)*(1-aim);
 return{camera,open:smooth((t-.20)/.65),flash:smooth((t-.65)/.35),done:t>=1};
}
export function mountForestDoor(canvas,draw){
 const button=document.createElement('button');button.id='forest-door-enter';button.textContent='';button.setAttribute('aria-label','打开小门，返回序章');button.title='打开小门，返回序章';
 Object.assign(button.style,{position:'fixed',zIndex:4,background:'transparent',border:0,cursor:'pointer',padding:0,display:'none'});document.body.append(button);
 const fade=document.createElement('div');Object.assign(fade.style,{position:'fixed',inset:0,zIndex:20,background:'#fff',opacity:0,pointerEvents:'none'});document.body.append(fade);
 let raf,opening=false,start=0,disposed=false,departure=null,shot=null;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 button.onclick=()=>{if(opening||button.disabled)return;opening=true;start=performance.now();departure=readCamera();button.disabled=true;document.body.dataset.door='opening';};
 function readCamera(){const d=document.body.dataset;return{x:Number(d.cameraX||0),y:Number(d.cameraY||105),z:Number(d.cameraZ||300),yaw:Number(d.cameraYaw||0),pitch:Number(d.cameraPitch||0),roll:Number(d.cameraRoll||0),zoom:Number(d.cameraZoom||1),fullSky:Number(d.fullSky||0)};}
 function tick(now){
  if(disposed)return;
  const camera=readCamera(),z=camera.z;
  const points=[[-65,160],[65,160],[65,0],[-65,0]].map(([dx,y])=>projectForestPoint(camera,routeX(DOOR_Z)+dx,y,DOOR_Z));
  const r=canvas.getBoundingClientRect(),s=r.width/1672,ready=z>=6030&&points.every(p=>p.depth>100);
  button.style.display=ready&&!opening?'block':'none';button.disabled=!ready||opening;
  if(ready){
   const left=Math.min(...points.map(p=>p.x)),top=Math.min(...points.map(p=>p.y)),width=Math.max(...points.map(p=>p.x))-left,height=Math.max(...points.map(p=>p.y))-top;
   Object.assign(button.style,{left:r.left+left*s+'px',top:r.top+top*s+'px',width:width*s+'px',height:height*s+'px',clipPath:'polygon('+points.map(p=>((p.x-left)/width*100)+'% '+((p.y-top)/height*100)+'%').join(',')+')'});
   if(!opening)document.querySelector('#phase').textContent='OPEN THE LITTLE DOOR · RETURN';
  }
  if(!opening)document.body.dataset.door=ready?'ready':'approaching';
  if(opening){shot=forestDoorShot(departure,now-start,reduced.matches);canvas.dataset.doorOpen=String(shot.open);canvas.dataset.doorPush=String(shot.camera.z-departure.z);fade.style.opacity=String(shot.flash);draw();if(shot.done){const token=new URLSearchParams(location.search).get('embedded');if(token&&window.parent!==window)parent.postMessage({type:'forest-complete',token},location.origin);else location.assign('/?forestReturn=1');return;}}
  raf=requestAnimationFrame(tick);
 }
 raf=requestAnimationFrame(tick);
 const dispose=()=>{disposed=true;shot=null;cancelAnimationFrame(raf);button.remove();fade.remove();delete canvas.dataset.doorOpen;delete canvas.dataset.doorPush;};Object.defineProperty(dispose,'camera',{get:()=>shot?.camera});return dispose;
}
