import test from 'node:test';
import assert from 'node:assert/strict';
import {createEscapeGame,escapeGameAssets} from '../public/js/escape-game.js';
test('Placeholder inputs never act as a game endpoint',()=>{
 let completed=0;const game=createEscapeGame({onComplete:()=>completed++});
 for(let i=0;i<200;i++)game.handleInput({kind:'click',point:{x:.5,y:.5}});
 for(const deltaY of [-200,200])game.handleInput({kind:'wheel',deltaY});
 assert.equal(completed,0);assert.deepEqual(escapeGameAssets.layers,[]);game.dispose();
});
test('Real adapter receives inputs; endpoint is once-only and cancelled on leaving',()=>{
 let endpoint,completed=0,cleaned=0;const received=[];
 const adapter={mount({input,complete}){endpoint=complete;input.addEventListener('input',e=>received.push(e.detail));return ()=>cleaned++;}};
 const game=createEscapeGame({adapter,onComplete:()=>completed++});
 game.handleInput({kind:'wheel',deltaY:-80,direction:'backward'});
 assert.equal(received[0].direction,'backward');assert.equal(completed,0);
 endpoint();endpoint();assert.equal(completed,1);game.dispose();assert.equal(cleaned,1);
 const abandoned=createEscapeGame({adapter,onComplete:()=>completed++});abandoned.dispose();endpoint();assert.equal(completed,1);
});
