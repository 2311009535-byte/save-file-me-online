import test from 'node:test';
import assert from 'node:assert/strict';
import {calendarFallFrames,buildingFrames,buildingSillY,buildingLayers} from '../public/js/retry-atmosphere-layers.js';
import {swordBreathFrames} from '../public/js/retry-foreground-life.js';
import {RETRY_ATMOSPHERE_ART} from '../public/js/retry-atmosphere-art.js';
test('All towers withdraw vertically, without changing perspective, and three native sheets fall',()=>{
 for(const art of Object.values(RETRY_ATMOSPHERE_ART)){assert.deepEqual(art.stillTowers,[]);assert.deepEqual(art.calendarPages,[0,1,2]);}
 const frames=buildingFrames(240);assert(frames.every(f=>/^translateY\([0-9]+px\)$/.test(f.transform)));assert.equal(frames[2].transform,'translateY(256px)');assert.equal(frames[0].transform,frames.at(-1).transform);
});
test('Calendar pages travel downward and reset only while invisible',()=>{
 const frames=calendarFallFrames([0,578,202,126],135,0),ys=frames.map(f=>Number(f.transform.match(/translate\([^,]+,([-.0-9]+)px/)[1]));assert(ys.every((y,i)=>i===0||y>=ys[i-1]));assert.equal(frames[0].opacity,0);assert.equal(frames.at(-1).opacity,0);assert(578+ys.at(-1)>941);
});
test('Arm and sword breathing translates one unaltered native cutout',()=>{
 for(const art of Object.values(RETRY_ATMOSPHERE_ART))assert(art.sword.outline.length>10);
 const frames=swordBreathFrames();assert(frames.every(f=>/^translateY\(-?[0-9]+px\)$/.test(f.transform)));assert.equal(frames[1].transform,'translateY(-7px)');assert.equal(frames[0].transform,frames.at(-1).transform);
});

test('Every tower has a foreground roof or cliff edge, separate from its crop rectangle',()=>{
 for(const art of Object.values(RETRY_ATMOSPHERE_ART)){assert.equal(art.towerSills.length,art.towers.length);for(const edge of art.towerSills){assert(edge.length>=3);assert(edge.every((p,i)=>!i||p[0]>edge[i-1][0]));}}
 const solo=RETRY_ATMOSPHERE_ART['3_1.png'],duo=RETRY_ATMOSPHERE_ART['3_9.JPG'];
 assert(buildingSillY(solo.towerSills[1],620)<485);assert(buildingSillY(duo.towerSills[4],690)<445);assert(buildingSillY(duo.towerSills[2],420)>620);
 const layers=buildingLayers(duo),rear=layers.find(t=>t.index===2),front=layers.find(t=>t.index===1);assert(layers.indexOf(rear)<layers.indexOf(front));assert(rear.slot[3]>200);assert(buildingSillY(rear.ground,370)>640);
});
