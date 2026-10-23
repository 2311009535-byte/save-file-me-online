import test from 'node:test';
import assert from 'node:assert/strict';
import {createForestObservations,FOREST_OBSERVATIONS,flowerCamera} from '../public/js/forest-observations.js';
import {forestCamera} from '../public/js/forest-route.js';
import {projectForestPoint} from '../public/js/forest-walk.js';
test('A flower closeup fills the frame and centres the real flower, rather than just turning the distant view',()=>{
 for(const beat of FOREST_OBSERVATIONS.filter(b=>b.plant)){
  const p=beat.plant,camera=flowerCamera(p),x=camera.x+Math.sign(p.x)*24;
  const centre=projectForestPoint(camera,x,p.h*.6,p.z),top=projectForestPoint(camera,x,p.h,p.z),bottom=projectForestPoint(camera,x,0,p.z);
  assert(Math.abs(centre.x-836)<.001);assert(Math.abs(centre.y-470)<.001);
  assert(bottom.y-top.y>300);assert(bottom.depth>50);assert(camera.y<105);
 }
});
test('Each route observation stops progress, holds, returns, and cannot retrigger on backtracking',()=>{
 const controller=createForestObservations(forestCamera),beat=FOREST_OBSERVATIONS[0];
 let r=controller.update(beat.progress-.01,beat.progress+.02,.1,false);
 assert.equal(r.progress,beat.progress);assert.equal(r.id,beat.id);assert.equal(r.phase,'approaching');
 for(let i=0;i<6;i++)r=controller.update(r.progress,1,.25,false);
 assert.equal(r.focus.amount,1);assert.equal(r.phase,'holding');assert.equal(r.progress,beat.progress);
 for(let i=0;i<16;i++)r=controller.update(r.progress,1,.25,false);
 assert.equal(controller.active,null);assert.equal(r.focus,null);
 r=controller.update(beat.progress+.01,beat.progress-.01,.1,false);assert.equal(r.focus,null);
 r=controller.update(beat.progress-.01,beat.progress+.01,.1,false);assert.equal(r.focus,null);
 controller.reset();r=controller.update(beat.progress-.01,beat.progress+.01,.1,true);assert(r.focus);
 controller.skip();r=controller.update(r.progress,1,.25,true);assert.equal(r.focus,null);assert.equal(controller.active,null);
});
test('Skipping during the approach returns from the current camera position without jumping further in',()=>{
 const controller=createForestObservations(forestCamera),beat=FOREST_OBSERVATIONS[0];
 const first=controller.update(beat.progress-.01,beat.progress+.01,.1,false);controller.skip();
 const returning=controller.update(beat.progress,beat.progress,.1,false);
 assert.equal(returning.phase,'returning');assert(returning.focus.amount<=first.focus.amount);
});
