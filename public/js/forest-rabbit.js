import {routeX} from './forest-route.js';
export const RABBIT_VERTEX=`if(uEffect>3.5&&uEffect<4.5){float t=max(0.,uRabbitTime),hop=min(floor(t/1.2),3.),phase=mod(t,1.2);float travel=(hop+(hop<3.?smoothstep(.12,.72,phase):0.))*32.;world.x+=travel;world.z+=travel*.35;}`;
export const RABBIT_FRAGMENT=`if(uEffect>3.5&&uEffect<4.5){if(uRabbitTime<0.)discard;float hop=floor(uRabbitTime/1.2),phase=mod(uRabbitTime,1.2),frame=0.;if(hop<3.){if(phase>=.12&&phase<.24)frame=1.;else if(phase<.36&&phase>=.24)frame=2.;else if(phase<.48&&phase>=.36)frame=3.;else if(phase<.62&&phase>=.48)frame=4.;else if(phase<.78&&phase>=.62)frame=5.;}uv.x=(clamp(uv.x,.002,.998)+frame)/6.;}`;
export function addForestRabbit({texture,quad},image){
 const c=document.createElement('canvas');c.width=2172;c.height=370;
 const ctx=c.getContext('2d'),centers=[205.5,212,195,171.5,162,164.5];ctx.imageSmoothingEnabled=false;
 for(let i=0;i<6;i++)ctx.drawImage(image,i*362,200,362,370,i*362+Math.round(181-centers[i]),0,362,370);
 const z=3350,x=routeX(z)-300,h=72,w=h*362/370;
 quad(texture(c),[{p:[x-w/2,h,z],uv:[0,0]},{p:[x+w/2,h,z],uv:[1,0]},{p:[x+w/2,0,z],uv:[1,1]},{p:[x-w/2,0,z],uv:[0,1]}],[1,0,0,0,1,0,0,0,1],undefined,false,4);
}
