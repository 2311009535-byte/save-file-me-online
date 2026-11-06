import test from 'node:test';
import assert from 'node:assert/strict';
import {buildingAxis,withdrawFrames} from '../public/js/retry-atmosphere-layers.js';
import {RETRY_ATMOSPHERE_ART} from '../public/js/retry-atmosphere-art.js';
test('Leaning buildings withdraw towards their own feet instead of screen vertical',()=>{
 const left=buildingAxis([[80,0],[110,0],[60,200],[30,200]]),right=buildingAxis([[0,0],[30,0],[90,200],[60,200]]);assert(left.x<0);assert(right.x>0);assert.equal(left.y,216);
 for(const art of Object.values(RETRY_ATMOSPHERE_ART))for(const [i,points]of art.towers.entries()){if(art.stillTowers.includes(i))continue;const axis=buildingAxis(points),frames=withdrawFrames(axis.y-16,axis.x);assert(axis.y>0);assert(Math.abs(axis.x)<=axis.y*.75);assert(frames.every(f=>!f.transform.includes('rotate')&&!f.transform.includes('scale')));assert.equal(frames[0].transform,frames.at(-1).transform);}
});
