import {drawWindow} from './creation-window-drawing.js';
export const buildSpecs={
 '2,3,4':{kind:'room',background:1},'9,10,11':{kind:'window',background:4},
 '16,17,18':{kind:'lamp',background:12},'22,23,23':{kind:'bed',background:19},
 '29,29,30':{kind:'computer',background:25},'35,35,36':{kind:'door',background:32}
};
export function drawBuild(c,kind,p){
 p=Math.max(0,Math.min(1,p));c.lineJoin='round';c.lineCap='round';c.lineWidth=2;c.strokeStyle='#1212cf';c.fillStyle='#f6f2e9';
 const path=(a,fill=false)=>{c.beginPath();a.forEach((v,i)=>i?c.lineTo(...v):c.moveTo(...v));if(fill){c.closePath();c.fill();}c.stroke();};
 const ellipse=(x,y,rx,ry,fill=true)=>{c.beginPath();c.ellipse(x,y,rx,Math.max(.2,ry),0,0,Math.PI*2);if(fill)c.fill();c.stroke();};
 const up=(a,h)=>a.map(([x,y])=>[x,y-h*p]);
 const plane=(left,right,height,detail=true)=>{const q=[...up([left,right],height),right,left];path(q,true);if(detail&&height*p>8){const u=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);path([u(q[0],q[3],.07),u(q[1],q[2],.07),u(q[1],q[2],.93),u(q[0],q[3],.93)],true);}return q;};
 const grid=q=>{const at=(u,v)=>q[0].map((_,j)=>(1-v)*((1-u)*q[0][j]+u*q[1][j])+v*((1-u)*q[3][j]+u*q[2][j]));c.save();c.strokeStyle='#b0d2df';c.lineWidth=.7;for(let i=1;i<8;i++){path([at(i/8,0),at(i/8,1)]);path([at(0,i/8),at(1,i/8)]);}c.restore();};
 if(kind==='window'){drawWindow(c,p);return;}
 if(kind==='room'){
  const floor=[[835,286],[1121,418],[835,581],[547,418]],h=192*p;
  path(floor,true);grid(floor);
  for(const a of [[[547,418],[835,286]],[[835,286],[1121,418]]]){const wall=[a[0],a[1],[a[1][0],a[1][1]-h],[a[0][0],a[0][1]-h]];path(wall,true);grid(wall);}
  path([[547,418],[835,581],[1121,418]]);return;
 }
 if(kind==='lamp'){
  ellipse(835,427,59,21);ellipse(835,427,28,9);path([[831,427],[831,427-204*p],[838,427-204*p],[838,427]]);
  const y=427-204*p,shade=58*p;path([[799,y],[819,y-shade],[851,y-shade],[871,y],[854,y+4*p],[819,y+4*p]],true);ellipse(835,y-shade,16,3*p);
  for(let i=1;i<8;i++)path([[819+4*i,y-shade],[799+8*i,y]]);return;
 }
 if(kind==='bed'){
  const ground=[[862,378],[960,433],[782,521],[684,466]],top=up(ground,30);
  for(const g of ground)path([[g[0]-2,g[1]],[g[0]-2,g[1]-30*p],[g[0]+3,g[1]-30*p],[g[0]+3,g[1]]],true);
  plane(ground[0],ground[1],60);path(top,true);path([top[3],top[2],[top[2][0],top[2][1]+10*p],[top[3][0],top[3][1]+10*p]],true);
  const at=(u,v)=>top[0].map((_,j)=>(1-v)*((1-u)*top[0][j]+u*top[1][j])+v*((1-u)*top[3][j]+u*top[2][j]));
  path([at(.07,.07),at(.93,.07),at(.93,.28),at(.07,.28)],true);path([at(0,.32),at(.52,.30),at(1,.32)]);for(const u of [.03,.97])path([at(u,.34),at(u,.92)]);return;
 }
 if(kind==='computer'){
  const chair=[[783,526],[815,544],[849,526],[817,508]],seat=up(chair,22);
  for(const g of chair)path([g,[g[0],g[1]-22*p]]);path(seat,true);plane(chair[0],chair[1],60);
  const ground=[[836,458],[944,512],[878,545],[770,491]],top=up(ground,55);
  for(const g of ground)path([[g[0]-2,g[1]],[g[0]-2,g[1]-55*p],[g[0]+3,g[1]-55*p],[g[0]+3,g[1]]],true);path(top,true);path([top[3],top[2],[top[2][0],top[2][1]+5*p],[top[3][0],top[3][1]+5*p]],true);
  const screenBase=up([[855,473],[907,500]],60);plane(screenBase[0],screenBase[1],43);
  const keys=up([[816,489],[857,511],[879,500],[838,478]],55);path(keys,true);grid(keys);ellipse(890,516-55*p,8,4);return;
 }
 if(kind==='door'){
  const left=[780,528],right=[858,488],height=192;
  const q=plane(left,right,height,false);const at=(u,v)=>q[0].map((_,j)=>(1-v)*((1-u)*q[0][j]+u*q[1][j])+v*((1-u)*q[3][j]+u*q[2][j]));
  for(const [a,b] of [[.08,.47],[.56,.93]])path([at(.12,a),at(.88,a),at(.88,b),at(.12,b)],true);
  if(p>.1){const k=at(.86,.52);ellipse(k[0],k[1],5,3);}path([q[1],[q[1][0]+4,q[1][1]+2],[q[2][0]+4,q[2][1]+2],q[2]]);return;
 }
}
