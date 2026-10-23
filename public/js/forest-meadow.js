import {routeX} from './forest-route.js';
export const BUTTERFLIES=[[-205,4930,48,18],[-250,5080,62,16],[205,5150,55,17]];
export const MEADOW_VERTEX=`if(uEffect>4.5&&uEffect<5.5){float id=floor((uEffect-5.)*10.+.5),phase=uTime*.8+id*2.1;float near=1.-smoothstep(120.,450.,aPosition.z-uCamera.z),side=id<1.5?-1.:1.;world.x+=sin(phase)*20.+side*near*70.;world.y+=sin(phase*1.3)*10.+near*35.;world.z+=cos(phase*.7)*12.;if(abs(id-uButterflyId)<.1&&uButterflyTime>=0.){float t=uButterflyTime,weight=smoothstep(0.,1.,t)*(1.-smoothstep(5.5,7.,t));vec3 orbit=vec3(sin(t*1.6)*44.,cos(t*1.6)*20.,sin(t*3.2)*8.);world=mix(world,uButterflyAnchor+orbit+(aPosition-uButterflyOrigin),weight);}}`;
export const MEADOW_FRAGMENT=`if(uEffect>4.5&&uEffect<5.5){float id=floor((uEffect-5.)*10.+.5),frame=mod(floor(uTime*10.+id),4.);uv.x=(clamp(uv.x,.002,.998)+frame)/4.;}`;
export function meadowTree(p){const t=(p.z-4300)/1050;if(t<=0||t>=1)return p;const side=p.x<routeX(p.z)?-1:1;return{...p,x:p.x+side*160*Math.sin(Math.PI*t)};}
export function addForestMeadow({texture,quad},image){
 const c=document.createElement('canvas');c.width=2172;c.height=344;
 const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(image,0,200,2172,344,0,0,2172,344);
 const tex=texture(c),identity=[1,0,0,0,1,0,0,0,1];
 const group=BUTTERFLIES;
 group.forEach(([offset,z,y,h],i)=>{const x=routeX(z)+offset,w=h*543/344;quad(tex,[{p:[x-w/2,y+h,z],uv:[0,0]},{p:[x+w/2,y+h,z],uv:[1,0]},{p:[x+w/2,y,z],uv:[1,1]},{p:[x-w/2,y,z],uv:[0,1]}],identity,undefined,false,5+i*.1);});
}
