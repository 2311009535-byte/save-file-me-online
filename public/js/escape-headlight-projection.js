// A small authored surface mesh follows this illustration's curved perspective.
// World x crosses the room, y runs towards the foreground, and z is height.
const floor=[[[745,420],[1040,420],[1330,460]],[[570,720],[990,740],[1375,700]],[[710,940],[955,1005],[1110,1000]]];
const wall=[floor.map(row=>row[2]),[[1410,230],[1560,565],[1230,960]],[[1480,0],[1720,430],[1350,920]]];
const bed=[[[640,245],[758,285]],[[530,400],[650,470]],[[440,575],[540,690]]];
const bedside=[[[760,330],[675,520],[570,750]],bed.map(row=>row[1])];
export const headlightSurfaces=[
 {name:'floor',u:[0,.5,1],v:[0,.5,1],grid:floor,kind:'horizontal',z:0},
 {name:'bed',u:[0,.25],v:[.05,.4,.75],grid:bed,kind:'horizontal',z:.22},
 {name:'bedside',u:[.05,.4,.75],v:[.03,.22],grid:bedside,kind:'vertical',x:.25},
 {name:'wall',u:[0,.5,1],v:[0,.5,1],grid:wall,kind:'vertical',x:1}
];
export function surfacePoint(surface,u,v){
 const index=(values,value)=>Math.max(0,Math.min(values.length-2,values.findIndex((n,i)=>i<values.length-1&&value<=values[i+1])));
 const i=index(surface.u,u),j=index(surface.v,v),a=(u-surface.u[i])/(surface.u[i+1]-surface.u[i]),b=(v-surface.v[j])/(surface.v[j+1]-surface.v[j]);
 return [0,1].map(k=>(1-b)*((1-a)*surface.grid[j][i][k]+a*surface.grid[j][i+1][k])+b*((1-a)*surface.grid[j+1][i][k]+a*surface.grid[j+1][i+1][k]));
}
// Rectangle-to-quad homography, column-major for CSS matrix3d().
export function projectQuad([p0,p1,p2,p3],width,height){
 const dx1=p1[0]-p2[0],dx2=p3[0]-p2[0],dx3=p0[0]-p1[0]+p2[0]-p3[0];
 const dy1=p1[1]-p2[1],dy2=p3[1]-p2[1],dy3=p0[1]-p1[1]+p2[1]-p3[1],det=dx1*dy2-dx2*dy1;
 const g=(dx3*dy2-dx2*dy3)/det,h=(dx1*dy3-dx3*dy1)/det;
 return [(p1[0]-p0[0]+g*p1[0])/width,(p1[1]-p0[1]+g*p1[1])/width,0,g/width,(p3[0]-p0[0]+h*p3[0])/height,(p3[1]-p0[1]+h*p3[1])/height,0,h/height,0,0,1,0,p0[0],p0[1],0,1];
}
