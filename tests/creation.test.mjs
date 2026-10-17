import test from 'node:test';
import assert from 'node:assert/strict';
import {CreationGame,normalizeCreation,objects} from '../public/js/creation-state.js';
import {PinchRecognizer} from '../public/js/hand-tracker.js';
test('Creation counts only successful release after full lift and preserves completed objects',()=>{
 const saved=[];const game=new CreationGame(null,s=>saved.push({...s}));
 assert.equal(game.state.phase,'room-place');assert.equal(game.choose('window'),false);assert(game.placed());game.raise(.2);assert.equal(game.release(true),false);game.raise(.2);assert(game.release());assert.equal(game.state.built,0);
 for(let i=0;i<5;i++){
  assert.equal(game.choose(objects[(i+1)%5]),false);assert(game.choose(objects[i]));assert(game.solve());assert(game.placed());
  game.raise(.1);assert.equal(game.release(),false);assert.equal(game.state.built,i);
  game.raise(.2);assert.equal(game.release(true),false);assert.equal(game.state.built,i);
  game.raise(.2);assert(game.release());assert.equal(game.state.built,i+1);
 }
 assert.equal(game.state.phase,'complete');assert.deepEqual(normalizeCreation(saved.at(-1)),game.state);
});
const landmarks=(x,y,pinch)=>{const p=Array.from({length:21},()=>({x:.5,y:.5}));p[8]={x,y};p[4]={x:x+(pinch?.01:.2),y};p[5]={x:.4,y:.5};p[17]={x:.6,y:.5};return p;};
test('Short pinch releases then clicks; moving pinch drags without a click',()=>{
 let events=[];const r=new PinchRecognizer((type,p)=>events.push([type,p]));
 r.update(landmarks(.4,.4,false),0);r.update(landmarks(.4,.4,true),100);r.update(landmarks(.4,.4,false),250);
 assert.deepEqual(events.map(e=>e[0]).filter(e=>e!=='move'&&e!=='hold'),['grab','release','click']);
 events=[];r.update(landmarks(.4,.4,true),1000);r.update(landmarks(.4,.1,true),1400);r.update(landmarks(.4,.1,false),1800);
 assert(events.some(e=>e[0]==='lift'));assert(!events.some(e=>e[0]==='click'));assert(events.find(e=>e[0]==='release'));
});
test('Lost hand cancels pending pinch instead of clicking or placing',()=>{
 const events=[];const r=new PinchRecognizer((type,p)=>events.push([type,p]));r.update(landmarks(.4,.4,true),100);r.update(null,500);
 assert(events.some(([type,p])=>type==='release'&&p.cancelled));assert(!events.some(e=>e[0]==='click'));
});

test('Existing chapter-four saves retain their room and new saves require base construction',()=>{assert.equal(normalizeCreation({built:2,phase:'choose'}).roomCreated,true);assert.equal(normalizeCreation(null).roomCreated,false);assert.equal(normalizeCreation({roomCreated:false,built:0,phase:'room-raise'}).phase,'room-raise');});

test('Pinch uses scale normalization, image aspect and separate close/open thresholds',()=>{
 for(const scale of [.035,.1,.25]){
  const events=[],states=[];const r=new PinchRecognizer((type,p)=>events.push([type,p]),s=>states.push(s));
  const hand=ratio=>{const l=Array.from({length:21},()=>({x:.5,y:.5}));l[5]={x:.5-scale/2,y:.5};l[17]={x:.5+scale/2,y:.5};l[8]={x:.5,y:.35};l[4]={x:.5+scale*ratio,y:.35};return l;};
  r.update(hand(.9),0,16/9);r.update(hand(.48),100,16/9);r.update(hand(.60),300,16/9);r.update(hand(.52),600,16/9);
  assert.equal(states.at(-1).pinching,true);assert.equal(events.filter(([type])=>type==='grab').length,1);
  r.update(hand(.8),1200,16/9);assert.equal(events.filter(([type])=>type==='release').length,1);assert.equal(states.at(-1).pinching,false);
 }
});
