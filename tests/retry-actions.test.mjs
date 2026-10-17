import test from 'node:test';import assert from 'node:assert/strict';import {createRetryActions} from '../public/js/retry-actions.js';
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
test('Image demo waits for every frame completion, calls ended once, and forbids parallel groups',async()=>{
 const gates=[deferred(),deferred()],seen=[];let callbacks=0,held=0;
 const player=createRetryActions({assets:{attack:{enabled:false,frames:[['prepare',450],['hit',1300]]}},show:async file=>{seen.push(file);return true;},hold:()=>gates[held++].promise});
 const result=player.play('attack',{onEnded:()=>callbacks++});await new Promise(r=>setImmediate(r));assert.deepEqual(seen,['prepare']);assert.equal(callbacks,0);await assert.rejects(player.play('attack'),/already active/);
 gates[0].resolve(true);await new Promise(r=>setImmediate(r));assert.deepEqual(seen,['prepare','hit']);assert.equal(callbacks,0);gates[1].resolve(true);assert.equal(await result,'ended');assert.equal(callbacks,1);player.dispose();
});
test('Cancellation while a demo frame is pending resolves without callback or next frame',async()=>{
 const gate=deferred();let callbacks=0;const seen=[];const player=createRetryActions({assets:{boss:{enabled:false,frames:[['windup',650],['strike',1200]]}},show:async file=>{seen.push(file);return true;},hold:()=>gate.promise});
 const result=player.play('boss',{onEnded:()=>callbacks++});await new Promise(r=>setImmediate(r));player.dispose();assert.equal(await result,'cancelled');assert.equal(callbacks,0);assert.deepEqual(seen,['windup']);gate.resolve(true);
});
