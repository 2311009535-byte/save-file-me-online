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
export function mountForestDoor(canvas,draw){
 const button=document.createElement('button');button.id='forest-door-enter';button.textContent='';button.setAttribute('aria-label','打开小门，返回序章');button.title='打开小门，返回序章';
 Object.assign(button.style,{position:'fixed',zIndex:4,background:'transparent',border:0,cursor:'pointer',padding:0,display:'none'});document.body.append(button);
 const fade=document.createElement('div');Object.assign(fade.style,{position:'fixed',inset:0,zIndex:20,background:'#172023',opacity:0,pointerEvents:'none'});document.body.append(fade);
 let raf,opening=false,start=0,disposed=false;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 button.onclick=()=>{if(opening||button.disabled)return;opening=true;start=performance.now();button.disabled=true;document.body.dataset.door='opening';};
 function tick(now){
  if(disposed)return;
  const z=Number(document.body.dataset.cameraZ||300),x=Number(document.body.dataset.cameraX||0),yaw=Number(document.body.dataset.cameraYaw||0),dz=DOOR_Z-z,dx=routeX(DOOR_Z)-x,depth=Math.sin(yaw)*dx+Math.cos(yaw)*dz,px=Math.cos(yaw)*dx-Math.sin(yaw)*dz;
  const r=canvas.getBoundingClientRect(),s=r.width/1672,ready=z>=6030&&depth>100;
  button.style.display=ready&&!opening?'block':'none';button.disabled=!ready||opening;
  if(ready){Object.assign(button.style,{left:r.left+(836+900*px/depth-900*65/depth)*s+'px',top:r.top+(240+900*(105-160)/depth)*s+'px',width:900*130/depth*s+'px',height:900*160/depth*s+'px'});if(!opening)document.querySelector('#phase').textContent='点击小门 · 返回序章';}
  if(!opening)document.body.dataset.door=ready?'ready':'approaching';
  if(opening){const t=Math.min(1,(now-start)/(reduced.matches?100:1100)),ease=1-Math.pow(1-t,3);canvas.dataset.doorOpen=String(ease);fade.style.opacity=String(Math.max(0,(t-.5)*2));draw();if(t===1){const token=new URLSearchParams(location.search).get('embedded');if(token&&window.parent!==window)parent.postMessage({type:'forest-complete',token},location.origin);else location.assign('/?forestReturn=1');return;}}
  raf=requestAnimationFrame(tick);
 }
 raf=requestAnimationFrame(tick);
 return()=>{disposed=true;cancelAnimationFrame(raf);button.remove();fade.remove();delete canvas.dataset.doorOpen;};
}
