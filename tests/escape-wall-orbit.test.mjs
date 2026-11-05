import test from 'node:test';
import assert from 'node:assert/strict';
import {wallTravel} from '../public/js/escape-window-traffic.js';
import {computerPocketAt} from '../public/js/escape-computer-pressure.js';
test('Car light follows the curved wall from below the window to above it',()=>{
 const route=[[.2,.5],[.2,.8],[.5,.95],[.85,.5],[.8,.1],[.5,.05],[.25,.05]].map(([x,y])=>wallTravel(x,y));
 assert(route[0]<.1);assert(route.at(-1)>.9);for(let i=1;i<route.length;i++)assert(route[i]>route[i-1]);
});
test('Computer clean pocket follows the enlarging monitor through the shot',()=>{
 const inside=(x,y,p)=>{let yes=false;for(let i=0,j=p.length-1;i<p.length;j=i++)if((p[i][1]>y)!==(p[j][1]>y)&&x<(p[j][0]-p[i][0])*(y-p[i][1])/(p[j][1]-p[i][1])+p[i][0])yes=!yes;return yes;};
 for(const [t,x,y]of [[0,.51,.2],[1,.53,.26],[2,.58,.3],[3,.65,.35],[4,.7,.35]]){const p=computerPocketAt(t);assert(inside(x,y,p));assert(!inside(.05,.05,p));}
});
