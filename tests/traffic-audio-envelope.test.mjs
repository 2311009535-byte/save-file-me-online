import test from 'node:test';
import assert from 'node:assert/strict';
import {trafficAudioLevel} from '../public/js/traffic-audio-envelope.js';
test('Traffic approaches and recedes smoothly within the headlight interval',()=>{
 assert.equal(trafficAudioLevel(-1),0);assert(trafficAudioLevel(1)<1e-20);assert.equal(trafficAudioLevel(2),trafficAudioLevel(1));assert.equal(trafficAudioLevel(NaN),0);
 assert.equal(trafficAudioLevel(.5),1);
 for(let i=1;i<=50;i++)assert(trafficAudioLevel(i/100)>trafficAudioLevel((i-1)/100));
 for(let i=51;i<=100;i++)assert(trafficAudioLevel(i/100)<trafficAudioLevel((i-1)/100));
 assert(trafficAudioLevel(.01)<.001);assert(trafficAudioLevel(.99)<.001);
});
