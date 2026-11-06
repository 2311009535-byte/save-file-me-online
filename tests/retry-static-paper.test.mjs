import test from 'node:test';
import assert from 'node:assert/strict';
import {calendarFallFrames,buildingFrames} from '../public/js/retry-atmosphere-layers.js';
import {swordLift} from '../public/js/retry-foreground-life.js';
import {RETRY_ATMOSPHERE_ART} from '../public/js/retry-atmosphere-art.js';
test('All towers withdraw vertically, without changing perspective, and three native sheets fall',()=>{
 for(const art of Object.values(RETRY_ATMOSPHERE_ART)){assert.deepEqual(art.stillTowers,[]);assert.deepEqual(art.calendarPages,[0,1,2]);}
 const frames=buildingFrames(240);assert(frames.every(f=>/^translateY\([0-9]+px\)$/.test(f.transform)));assert.equal(frames[2].transform,'translateY(256px)');assert.equal(frames[0].transform,frames.at(-1).transform);
});
test('Calendar pages travel downward and reset only while invisible',()=>{
 const frames=calendarFallFrames([0,578,202,126],135,0),ys=frames.map(f=>Number(f.transform.match(/translate\([^,]+,([-.0-9]+)px/)[1]));assert(ys.every((y,i)=>i===0||y>=ys[i-1]));assert.equal(frames[0].opacity,0);assert.equal(frames.at(-1).opacity,0);assert(578+ys.at(-1)>941);
});
test('Sword breathing includes each grip but leaves cards and faces stable',()=>{
 for(const art of Object.values(RETRY_ATMOSPHERE_ART)){const [x,y]=art.sword.grip;assert(swordLift(art,x,y)<-3);for(const point of [[1200,800],[1100,100],[500,540],[100,100]])assert.equal(swordLift(art,...point),0);}
});
