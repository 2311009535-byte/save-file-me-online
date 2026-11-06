import test from 'node:test';
import assert from 'node:assert/strict';
import {createForestObservations,FOREST_OBSERVATIONS} from '../public/js/forest-observations.js';
import {forestCamera} from '../public/js/forest-route.js';
import {walkingCamera,projectForestPoint} from '../public/js/forest-walk.js';
const start=(id,reduced=false)=>{const c=createForestObservations(forestCamera),b=FOREST_OBSERVATIONS.find(b=>b.id===id);c.update(b.progress-.001,b.progress+.001,.01,reduced);return[c,b];};
const sample=(c,b,seconds)=>{let r;for(let i=0;i<Math.ceil(seconds*100);i++)r=c.update(b.progress,b.progress,.01,false);return r;};
test('The rabbit surprise is brief, bounded and disabled with reduced motion',()=>{
 for(const reduced of [false,true]){const[c,b]=start('rabbit-friend',reduced);sample(c,b,1.3);c.react('rabbit');const values=[];for(let i=0;i<150;i++)values.push(c.update(b.progress,b.progress,.01,reduced).focus.camera.roll||0);assert(values.every(v=>Math.abs(v)<.013));assert.equal(values.some(v=>Math.abs(v)>.001),!reduced);assert(Math.abs(values.at(-1))<1e-8);}
});
test('Following a butterfly changes position, yaw, pitch and perspective before returning',()=>{
 const[c,b]=start('butterfly-visit');sample(c,b,1.3);c.react('butterfly');const a=sample(c,b,1.5).focus.camera,d=sample(c,b,2.5).focus.camera;assert(Math.abs(a.yaw-d.yaw)>.2);assert(Math.abs(a.x-d.x)>15);assert(a.zoom>1);assert(d.pitch>a.pitch);c.skip();assert.equal(sample(c,b,1.2).focus,null);
});
test('The meadow rest leaves the path, lowers the viewpoint, then looks fully skyward',()=>{
 const[c,b]=start('meadow-rest'),base=forestCamera(b.progress),low=sample(c,b,1.4).focus.camera,sky=sample(c,b,3).focus.camera;assert(low.y<base.y);assert(low.x>base.x+100);assert(low.fullSky<.2);assert.equal(sky.fullSky,1);assert.equal(sky.y,18);assert(sky.pitch>1);assert(Math.abs(sky.roll)>.04);c.skip();assert.equal(sample(c,b,2.3).focus,null);
});
test('Walking perspective and rolling projection share the same camera transform',()=>{
 const base={x:0,y:105,z:300},cam=walkingCamera(base,{offset:0,yaw:0,pitch:0,gaitMix:1,gaitPhase:1});assert(cam.zoom<1);assert.notEqual(cam.y,105);const a=projectForestPoint(base,80,150,700),b=projectForestPoint({...base,roll:.1,zoom:1.05},80,150,700);assert.notEqual(a.x,b.x);assert.notEqual(a.y,b.y);
});
