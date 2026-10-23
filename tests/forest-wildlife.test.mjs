import test from 'node:test';
import assert from 'node:assert/strict';
import {rabbitTravel} from '../public/js/forest-rabbit.js';
import {butterflyPosition} from '../public/js/forest-wildlife.js';
import {createForestObservations,FOREST_OBSERVATIONS} from '../public/js/forest-observations.js';
import {forestCamera} from '../public/js/forest-route.js';
import {walkingCamera} from '../public/js/forest-walk.js';
test('The rabbit waits for the greeting, then hops a bounded distance and settles',()=>{
 assert.equal(rabbitTravel(-1),0);assert.equal(rabbitTravel(.5),0);
 assert(rabbitTravel(1.25)>0);assert.equal(rabbitTravel(4.3),96);assert.equal(rabbitTravel(100),96);
});
test('An interacting butterfly approaches the viewer, circles, and returns to its original flight',()=>{
 const anchor={x:0,y:55,z:4800},a=butterflyPosition(0,10,4700,{id:0,time:2,anchor}),b=butterflyPosition(0,10,4700,{id:0,time:3,anchor});
 assert(Math.hypot(a.x-anchor.x,a.y-anchor.y,a.z-anchor.z)<55);assert(Math.hypot(a.x-b.x,a.y-b.y)>20);
 assert.deepEqual(butterflyPosition(0,10,4700,{id:0,time:7,anchor}),butterflyPosition(0,10,4700,null));
});
test('Animal encounters allow enough time to see the response; the sky moment covers the complete scene',()=>{
 const controller=createForestObservations(forestCamera),beat=FOREST_OBSERVATIONS.find(b=>b.animal==='butterfly');
 let current=controller.update(beat.progress-.01,beat.progress+.01,.2,true);controller.react('butterfly');
 assert(controller.active.hold>=7.1);assert.match(controller.active.label,/flutter/);
 controller.skip();current=controller.update(beat.progress,beat.progress,.25,true);assert.equal(current.focus,null);
 const sky=FOREST_OBSERVATIONS.find(b=>b.id==='passing-clouds');controller.reset();current=controller.update(sky.progress-.01,sky.progress+.01,.25,true);
 const camera=walkingCamera(forestCamera(current.progress),{offset:0,yaw:0,pitch:0,focus:current.focus});assert.equal(camera.fullSky,1);
});
