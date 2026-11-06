import test from 'node:test';
import assert from 'node:assert/strict';
import {fatigueOffset} from '../public/js/escape-fatigue.js';
test('Fatigue lowers the head and shoulders and rounds the upper back',()=>{
 assert(fatigueOffset(.532,.303)[1]>10);
 assert(fatigueOffset(.515,.383)[1]>5);
 assert(fatigueOffset(.490,.416)[0]<-10);
});
test('The monitor, desk, hands, elbows and chair remain anchored',()=>{
 for(const point of [[.51,.20],[.43,.29],[.48,.31],[.455,.35],[.58,.39],[.49,.49],[.54,.55]])assert.deepEqual(fatigueOffset(...point),[0,0]);
});
