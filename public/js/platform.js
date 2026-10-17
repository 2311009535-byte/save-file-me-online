// Coordinates correspond to the unmodified 1672 × 941 background art.
export const levels=[
 [[0,708,652],[708,1011,723],[1011,1183,600],[1183,1672,652]],
 [[0,210,613],[210,718,652],[718,1034,726],[1034,1285,652],[1285,1587,690],[1587,1672,652]],
 [[0,59,548],[59,163,590],[163,713,651],[774,991,620],[1036,1364,651],[1364,1545,690],[1545,1672,651]],
 [[0,743,652],[884,995,586],[1031,1383,652],[1383,1588,684],[1588,1672,652]],
 [[0,94,594],[94,620,652],[620,685,712],[685,825,618],[825,985,712],[985,1140,652],[1140,1308,680],[1308,1590,652],[1590,1672,594]]
];
export function createRunner(level=0){const y=levels[level].find(p=>p[0]<=100&&p[1]>100)[2];return {level,x:100,y,vy:0,grounded:true,deaths:0,safeX:100,safeY:y};}
export function jump(r){if(r.grounded){r.vy=-850;r.grounded=false;return true;}return false;}
export function step(r,dt){
 const terrain=levels[r.level],oldY=r.y,current=terrain.find(([a,b])=>r.x>=a&&r.x<b);let nextX=r.x+300*dt;
 if(r.grounded){const next=terrain.find(([a,b])=>nextX>=a&&nextX<b);if(current&&(!next||next[2]<r.y-1))nextX=Math.min(nextX,current[1]-1);}
 r.x=nextX;r.vy+=1700*dt;r.y+=r.vy*dt;r.grounded=false;
 const surface=terrain.find(([a,b,y])=>r.x>=a&&r.x<b&&oldY<=y+1&&r.y>=y&&r.vy>=0);
 if(surface){r.y=surface[2];r.vy=0;r.grounded=true;r.safeX=r.x;r.safeY=r.y;}
 const under=terrain.find(([a,b])=>r.x>=a&&r.x<b);if(under&&r.y<=under[2]+1){r.safeX=r.x;r.safeY=under[2];}
 if(!surface&&r.vy>=0&&((r.y>=(r.safeY??652)&&(!under||under[2]<(r.safeY??652)))||r.y>900)){
  r.x=r.safeX??100;r.y=r.safeY??652;r.vy=0;r.grounded=true;return 'blocked';
 }
 if(r.x>(r.level===4?1535:1660))return r.level===4?'win':'next';
 return 'running';
}
