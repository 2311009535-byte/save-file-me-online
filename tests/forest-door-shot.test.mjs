import test from 'node:test';
import assert from 'node:assert/strict';
import {forestDoorShot,DOOR_Z} from '../public/js/forest-door.js';
import {projectForestPoint} from '../public/js/forest-walk.js';
test('Door transition pushes through world space, opens the leaf, then covers before returning',()=>{
 const start={x:-650,y:105,z:6200,yaw:.18,pitch:-.12,roll:.01,zoom:.98};let z=start.z;
 for(const ms of [0,200,500,900,1300,1700,1900]){const shot=forestDoorShot(start,ms);assert(shot.camera.z>=z);assert(shot.camera.z<DOOR_Z);z=shot.camera.z;if(ms<1200)assert.equal(shot.flash,0);}
 const end=forestDoorShot(start,1900);assert.equal(end.camera.z,DOOR_Z-80);assert.equal(end.open,1);assert.equal(end.flash,1);assert(end.done);const center=projectForestPoint(end.camera,-680,80,DOOR_Z);assert(Math.abs(center.x-836)<1e-6);assert(Math.abs(center.y-470)<1e-6);
});
test('Reduced motion retains the door location and completes with a short fade',()=>{const start={x:-680,y:105,z:6200,yaw:0,pitch:0};const end=forestDoorShot(start,300,true);assert.equal(end.camera.z,start.z);assert.equal(end.camera.x,start.x);assert(end.done);assert.equal(end.flash,1);});
