import test from 'node:test';
import assert from 'node:assert/strict';
import {headlightSurfaces,surfacePoint,projectQuad} from '../public/js/escape-headlight-projection.js';
const byName=name=>headlightSurfaces.find(s=>s.name===name);
const close=(a,b)=>a.forEach((v,i)=>assert(Math.abs(v-b[i])<1e-7,`${a} != ${b}`));
test('Projected surface cells meet their drawn corners without mirroring or infinity',()=>{
 for(const surface of headlightSurfaces)for(let j=0;j<surface.v.length-1;j++)for(let i=0;i<surface.u.length-1;i++){
  const quad=[surface.grid[j][i],surface.grid[j][i+1],surface.grid[j+1][i+1],surface.grid[j+1][i]],m=projectQuad(quad,700,500);
  for(const [n,[x,y]]of [[0,0],[700,0],[700,500],[0,500]].entries()){
   const w=m[3]*x+m[7]*y+1;assert(w>0);close([(m[0]*x+m[4]*y+m[12])/w,(m[1]*x+m[5]*y+m[13])/w],quad[n]);
  }
 }
});
test('Floor/wall and mattress/bedside share the same curved seams',()=>{
 for(const depth of [0,.1,.3,.5,.7,.9,1])close(surfacePoint(byName('floor'),1,depth),surfacePoint(byName('wall'),depth,0));
 for(const depth of [.05,.2,.4,.6,.75])close(surfacePoint(byName('bed'),.25,depth),surfacePoint(byName('bedside'),depth,.22));
 // The mesh follows the bowed illustration rather than one straight quad.
 const start=surfacePoint(byName('floor'),1,0),end=surfacePoint(byName('floor'),1,1),middle=surfacePoint(byName('floor'),1,.5);
 assert(Math.abs(middle[0]-(start[0]+end[0])/2)>100);
});
