import test from 'node:test';
import assert from 'node:assert/strict';
import {particleField} from '../public/js/prologue-particle-field.js';
test('Halo pushes nearby marks outward without changing their base coordinates; release settles back',()=>{
 const p={x:105,y:100,g:2,a:1},field={x:100,y:100};let result;
 for(let i=0;i<90;i++)result=particleField(p,p.x,p.y,field,1/60);
 assert(result.x>200);assert(result.shift<115);assert.equal(p.x,105);assert.equal(p.y,100);
 for(let i=0;i<180;i++)result=particleField(p,p.x,p.y,null,1/60);
 assert(result.shift<.01);
});
test('Exact center stays finite, distant marks stay untouched and large frame gaps are bounded',()=>{
 const p={g:0,a:0};const center=particleField(p,100,100,{x:100,y:100},500);
 assert(Number.isFinite(center.x)&&Number.isFinite(center.y));assert(center.shift<35);
 assert.deepEqual(particleField({},400,400,{x:100,y:100},.04),{x:400,y:400,shift:0});
});
