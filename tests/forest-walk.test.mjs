import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceWalk,walkingCamera,projectForestPoint} from '../public/js/forest-walk.js';
import {forestCamera,ROUTE_LENGTH} from '../public/js/forest-route.js';
test('Walking stops on release, reverses, and stays inside the route and bridge rails',()=>{
 const s={progress:0,offset:0,yaw:0,pitch:0};
 for(let i=0;i<60;i++)advanceWalk(s,1,0,1/60);
 assert(Math.abs(s.progress*ROUTE_LENGTH-250)<1e-8);
 const stopped=s.progress;advanceWalk(s,0,0,.1);assert.equal(s.progress,stopped);
 for(let i=0;i<30;i++)advanceWalk(s,-1,1,1/30);
 assert(Math.abs(s.progress)<1e-8);assert.equal(s.offset,55);
 advanceWalk(s,-1,-1,100);assert.equal(s.progress,0);assert.equal(s.offset,36.25);
 s.progress=1;advanceWalk(s,1,0,.1);assert.equal(s.progress,1);
});
test('Looking changes the view without moving down the path; sidestepping follows the curved route',()=>{
 const base=forestCamera(.65),view={offset:55,yaw:.3,pitch:.22},cam=walkingCamera(base,view);
 assert(Math.abs(Math.hypot(cam.x-base.x,cam.z-base.z)-55)<1e-8);
 assert.equal(cam.pitch,.22);assert.equal(cam.yaw,base.yaw+.3);
 const target={x:base.x+Math.sin(base.yaw)*400,y:105,z:base.z+Math.cos(base.yaw)*400};
 const original=projectForestPoint(base,target.x,target.y,target.z);
 assert(Math.abs(original.x-836)<1e-8);assert.equal(original.y,240);
 const up=projectForestPoint({...base,pitch:.22},target.x,target.y,target.z);assert(up.y>original.y);
 const down=projectForestPoint({...base,pitch:-.26},target.x,target.y,target.z);assert(down.y<original.y);
 const turned=projectForestPoint({...base,yaw:base.yaw+.3},target.x,target.y,target.z);assert(turned.x<original.x);
});
