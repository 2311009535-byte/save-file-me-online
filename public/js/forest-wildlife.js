import {routeX} from './forest-route.js';
import {projectForestPoint} from './forest-walk.js';
import {RABBIT,rabbitTravel} from './forest-rabbit.js';
import {BUTTERFLIES} from './forest-meadow.js';
const clamp=n=>Math.max(0,Math.min(1,n));
const smooth=(a,b,n)=>{const t=clamp((n-a)/(b-a));return t*t*(3-2*t);};
export function butterflyPosition(id,time,cameraZ,interaction){
 const [offset,z,y,h]=BUTTERFLIES[id],phase=time*.8+id*2.1,near=1-smooth(120,450,z-cameraZ),side=id<1.5?-1:1;
 const p={x:routeX(z)+offset+Math.sin(phase)*20+side*near*70,y:y+h/2+Math.sin(phase*1.3)*10+near*35,z:z+Math.cos(phase*.7)*12};
 if(interaction?.id===id&&interaction.time>=0){const t=interaction.time,w=smooth(0,1,t)*(1-smooth(5.5,7,t)),a=interaction.anchor;for(const [key,v]of Object.entries({x:a.x+Math.sin(t*1.6)*44,y:a.y+Math.cos(t*1.6)*20,z:a.z+Math.sin(t*3.2)*8}))p[key]+=(v-p[key])*w;}
 return p;
}
export function mountForestWildlife(canvas){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');let rabbitStart=null,rabbitPending=false,butterflyStart=null,butterflyId=-1,butterflyPending=-1,anchor={x:0,y:0,z:0},camera,lastTime=0,dead=false;
 const root=document.createElement('div');root.className='forest-wildlife';document.body.append(root);
 const make=(label,kind,id)=>{const button=document.createElement('button');button.className='forest-wildlife-target';button.hidden=true;button.setAttribute('aria-label',label);button.dataset.kind=kind;button.dataset.animal=String(id);button.title=label;root.append(button);return button;};
 const rabbit=make('Say hello to the rabbit','rabbit',0),butterflies=BUTTERFLIES.map((_,i)=>make('Watch the butterfly','butterfly',i));
 const interact=kind=>document.dispatchEvent(new CustomEvent('forest-wildlife-interact',{detail:{kind}}));
 rabbit.onclick=()=>{if(dead||rabbit.disabled||rabbitStart!==null||rabbitPending)return;rabbitPending=true;rabbit.disabled=true;interact('rabbit');};
 butterflies.forEach((b,id)=>b.onclick=()=>{if(dead||b.hidden||b.disabled||butterflyPending>=0||butterflyStart!==null||!camera)return;butterflyPending=id;anchor={x:camera.x+Math.sin(camera.yaw||0)*130,y:camera.y-32,z:camera.z+Math.cos(camera.yaw||0)*130};interact('butterfly');});
 function place(button,p,w,h,enabled){
  const r=canvas.getBoundingClientRect(),s=r.width/1672,point=projectForestPoint(camera,p.x,p.y,p.z);
  const width=Math.max(44,w*900/point.depth*s),height=Math.max(44,h*900/point.depth*s),x=r.left+point.x*s,y=r.top+point.y*s;
  const visible=enabled&&(camera.fullSky||0)<.05&&point.depth>65&&point.depth<800&&x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom;
  button.hidden=!visible;if(!visible)return;
  Object.assign(button.style,{left:x-width/2+'px',top:y-height/2+'px',width:width+'px',height:height+'px'});
 }
 return {
  get active(){return rabbitPending||butterflyPending>=0||(rabbitStart!==null&&lastTime-rabbitStart<4.5)||butterflyStart!==null;},
  update(current,time){
   if(dead)return;camera=current;lastTime=time;
   if(rabbitPending){rabbitPending=false;rabbitStart=time;}
   if(butterflyPending>=0){butterflyId=butterflyPending;butterflyPending=-1;butterflyStart=time;}
   const rt=rabbitStart===null?-1:time-rabbitStart,bt=butterflyStart===null?-1:time-butterflyStart;
   if(bt>=7)butterflyStart=null;
   canvas.dataset.rabbit=rt<0?'waiting':rt<.65?'looking':rt<4.5?'hopping':'resting';canvas.dataset.butterfly=bt>=0&&bt<7?'circling':'meadow';
   const observation=document.body.dataset.observation,allowed=!observation||observation==='none'||observation==='rabbit-friend'||observation==='butterfly-visit';
   const travel=rt<0?0:rabbitTravel(rt);
   place(rabbit,{x:routeX(RABBIT.z)+RABBIT.offset+travel,y:RABBIT.h/2,z:RABBIT.z+travel*.35},RABBIT.w,RABBIT.h,allowed&&rabbitStart===null&&camera.z>=2600);
   butterflies.forEach((button,id)=>{const pos=butterflyPosition(id,reduced.matches?0:time,camera.z,bt>=0?{id:butterflyId,time:bt,anchor}:null);place(button,pos,BUTTERFLIES[id][3]*543/344,BUTTERFLIES[id][3],allowed&&bt<0);});
   const [offset,z,y,h]=BUTTERFLIES[Math.max(0,butterflyId)];
   return {rabbitTime:rt,butterflyTime:bt>=7?-1:bt,butterflyId,anchor,origin:{x:routeX(z)+offset,y:y+h/2,z}};
  },
  reset(){rabbitStart=null;rabbitPending=false;butterflyStart=null;butterflyPending=-1;butterflyId=-1;rabbit.disabled=false;},
  dispose(){dead=true;rabbit.onclick=null;butterflies.forEach(b=>b.onclick=null);root.remove();delete canvas.dataset.rabbit;delete canvas.dataset.butterfly;}
 };
}
