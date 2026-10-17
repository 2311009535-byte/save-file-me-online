import test from 'node:test';
import assert from 'node:assert/strict';
import {DwellSelection} from '../public/js/creation-dwell.js';
test('Dwell waits 1.5 seconds and fires once until leaving the target',()=>{
 const dwell=new DwellSelection(),target={};dwell.update(target,0);
 for(let t=100;t<1500;t+=100)assert.equal(dwell.update(target,t).activate,false);
 assert.deepEqual(dwell.update(target,1500),{progress:1,activate:true});
 assert.equal(dwell.update(target,1600).activate,false);
 dwell.update(null,1700);assert.equal(dwell.update(target,1800).progress,0);
});
test('Target changes, pinching, lost hand and stalled camera reset the dwell',()=>{
 const dwell=new DwellSelection(),a={},b={};dwell.update(a,0);dwell.update(a,300);
 assert.equal(dwell.update(b,500).progress,0);dwell.update(b,700);
 assert.equal(dwell.update(b,800,false).progress,0);
 assert.equal(dwell.update(b,900).progress,0);dwell.update(null,1000);
 assert.equal(dwell.update(b,1100).progress,0);
 assert.equal(dwell.update(b,2000).progress,0);
});
