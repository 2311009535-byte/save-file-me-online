import test from 'node:test';
import assert from 'node:assert/strict';
import {paperOverlap,canReceivePaper,receiveZone} from '../public/js/escape-drop-zone.js';
test('Paper overlap accepts shoulders and back, rejects desk and slight edge contact',()=>{
 assert(canReceivePaper({x:.4325,y:.34,w:.051,h:.078}));
 assert(canReceivePaper({x:.49,y:.41,w:.051,h:.078}));
 assert(!canReceivePaper({x:.56,y:.34,w:.051,h:.078}));
 assert(!canReceivePaper({x:.59,y:.26,w:.051,h:.078}));
 assert.equal(paperOverlap({x:.8,y:.7,w:.05,h:.08}),0);
 assert(Math.abs(paperOverlap({x:.5,y:.35,w:.01,h:.01})-1)<1e-10);
 // Clipping relies on a convex, consistently oriented receiver polygon.
 for(let i=0;i<receiveZone.length;i++){const a=receiveZone[i],b=receiveZone[(i+1)%receiveZone.length],c=receiveZone[(i+2)%receiveZone.length];assert((b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0])>0);}
});
