// Gentle left bend after the cottage. Distances are world-space arc lengths.
export const FOREST_ROUTE={start:300,bendStart:2700,bendEnd:5300,end:6200,offset:-680};
export function routeX(z){const t=Math.max(0,Math.min(1,(z-FOREST_ROUTE.bendStart)/(FOREST_ROUTE.bendEnd-FOREST_ROUTE.bendStart)));return FOREST_ROUTE.offset*t*t*t*(10+t*(-15+6*t));}
export function routeSlope(z){const t=(z-FOREST_ROUTE.bendStart)/(FOREST_ROUTE.bendEnd-FOREST_ROUTE.bendStart);return t<=0||t>=1?0:FOREST_ROUTE.offset*30*t*t*(1-t)*(1-t)/(FOREST_ROUTE.bendEnd-FOREST_ROUTE.bendStart);}
const table=[{z:FOREST_ROUTE.start,d:0}];for(let z=FOREST_ROUTE.start+5;z<=FOREST_ROUTE.end;z+=5){const last=table[table.length-1],x=routeX(z)-routeX(last.z);table.push({z,d:last.d+Math.hypot(z-last.z,x)});}
export const ROUTE_LENGTH=table[table.length-1].d;
export function progressAtZ(z){const v=Math.max(FOREST_ROUTE.start,Math.min(FOREST_ROUTE.end,z)),i=Math.min(table.length-2,Math.floor((v-FOREST_ROUTE.start)/5)),a=table[i],b=table[i+1];return (a.d+(b.d-a.d)*(v-a.z)/5)/ROUTE_LENGTH;}
export function forestCamera(p){const d=Math.max(0,Math.min(1,p))*ROUTE_LENGTH;let lo=0,hi=table.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(table[m].d<d)lo=m;else hi=m;}const a=table[lo],b=table[hi],z=a.z+(b.z-a.z)*(d-a.d)/(b.d-a.d);return{x:routeX(z),y:105,z,yaw:Math.atan(routeSlope(z))};}
export const WOODLAND_TREES=[];
for(let i=0;i<15;i++)for(const side of [-1,1]){const z=2940+i*430+(side>0?125:0),offset=side*(440+(i*83%180));WOODLAND_TREES.push({source:(i+(side>0?1:0))%3,x:routeX(z)+offset,z,height:500+(i*67%210)});if(i%2===0)WOODLAND_TREES.push({source:(i+1)%3,x:routeX(z)+side*(820+(i*59%190)),z:z+165,height:620+(i*41%150)});}
