import {RABBIT} from './forest-rabbit.js';
import {FOREST_PLANTS} from './forest-plants.js';
import {progressAtZ,routeX} from './forest-route.js';
const pink=FOREST_PLANTS.find(p=>p.kind==='pinkFlowers'&&p.z===1785);
const daisies=FOREST_PLANTS.find(p=>p.kind==='daisies'&&p.x>0&&p.x<300&&p.z>4300);
export const FOREST_OBSERVATIONS=[
 {id:'pink-flowers',z:1700,plant:pink,hold:3.2,label:'A little pink, growing by the path.'},
 {id:'rabbit-friend',z:2990,hold:5,label:'A rabbit. Does it see me?',animal:'rabbit'},
 {id:'passing-clouds',z:3290,hold:2.8,label:'Even the clouds are taking their time.'},
 {id:'daisy-meadow',z:4210,plant:daisies,hold:3.2,label:'So many tiny suns in the grass.'},
 {id:'butterfly-visit',z:4770,hold:5,label:'A butterfly, right beside me.',animal:'butterfly'}
].map(beat=>({...beat,progress:progressAtZ(beat.z)}));
export function flowerCamera(plant){
 const distance=Math.max(65,plant.h*1.7),side=Math.sign(plant.x)||1;
 const x=routeX(plant.z)+plant.x-side*24,y=plant.h*.6+25,z=plant.z-distance;
 return {x,y,z,yaw:Math.atan2(side*24,distance),pitch:Math.atan2(-25,Math.hypot(24,distance))+Math.atan(230/900)};
}
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export function createForestObservations(cameraAt){
 const seen=new Set();let active=null;
 function start(beat,progress,reduced){
  const base=cameraAt(progress);
  let camera=beat.plant?flowerCamera(beat.plant):{...base,yaw:(base.yaw||0)-.04,pitch:.22,fullSky:1};
  if(beat.animal==='rabbit')camera={x:routeX(RABBIT.z)+RABBIT.offset+60,y:55,z:RABBIT.z-190,yaw:Math.atan2(-60,190),pitch:.10};
  if(beat.animal==='butterfly')camera={x:routeX(4930)-95,y:85,z:4770,yaw:Math.atan2(-110,160),pitch:.10};
  active={...beat,progress,time:0,enter:reduced ? .2 : 1.25,exit:reduced ? .2 : 1.1,camera};
 }
 return {
  get active(){return active;},
  react(kind){if(active?.animal===kind){active.label=kind==='rabbit'?'Oh! It noticed me.':'Hello, little flutter.';active.hold=Math.max(active.hold,active.time-active.enter+(kind==='rabbit'?4.6:7.1));}},
  skip(){if(active&&active.time<active.enter+active.hold){active.exitFrom=smooth(active.time/active.enter);active.time=active.enter+active.hold;}},
  reset(){active=null;seen.clear();},
  update(previous,next,dt,reduced){
   if(!active){const beat=FOREST_OBSERVATIONS.find(b=>!seen.has(b.id)&&previous<b.progress&&next>=b.progress);if(beat){seen.add(beat.id);start(beat,beat.progress,reduced);}}
   if(!active)return {progress:next,focus:null};
   const a=active;a.time+=Math.max(0,Math.min(dt,.25));
   const amount=a.time<a.enter?smooth(a.time/a.enter):(a.exitFrom??1)*(1-smooth((a.time-a.enter-a.hold)/a.exit));
   const result={progress:a.progress,focus:{camera:a.camera,amount},id:a.id,label:a.label,phase:a.time<a.enter?'approaching':a.time<a.enter+a.hold?'holding':'returning'};
   if(a.time>=a.enter+a.hold+a.exit){active=null;result.focus=null;result.phase='finished';}
   return result;
  }
 };
}
