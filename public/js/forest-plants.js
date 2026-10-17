import {routeX} from './forest-route.js';
// Fixed placements on dry land; every sprite comes from the supplied flower pack.
// x/z are world coordinates, h is plant height. Keep the central path unobstructed.
const BASE_PLANTS=[
 ['grassSparse',-180,545,31],['whiteFlowers',210,590,25],['grassDense',-230,635,34],['pinkFlowers',-175,663,24],['grassSparse',190,654,29],
 ['grassDense',-205,1540,31],['yellowFlowers',180,1555,24],['grassSparse',235,1610,30],['mixedFlowers',-185,1660,29],['grassSparse',-250,1740,33],['pinkFlowers',205,1785,25],
 ['grassDense',-190,1850,32],['whiteFlowers',240,1930,24],['grassSparse',-225,2000,29],['yellowFlowers',190,2070,25],
 ['grassDense',-400,2115,31],['whiteFlowers',-470,2160,24],['mixedFlowers',-350,2190,28],
 ['pinkFlowers',390,2155,24],['grassSparse',495,2165,26],['yellowFlowers',620,2160,23],['mixedFlowers',765,2150,29],
 ['grassSparse',-190,2240,31],['whiteFlowers',210,2330,25],['grassDense',-240,2390,32],['pinkFlowers',185,2490,24],['grassSparse',-195,2570,30],
 ['mixedFlowers',230,2680,28],['yellowFlowers',-220,2760,25],['grassSparse',195,2840,29],['whiteFlowers',-250,2960,24],['grassDense',230,3100,32],['mixedFlowers',-185,3260,28],
 ['grassSparse',-620,3625,31],['whiteFlowers',-695,3640,24]
].map(([kind,x,z,h])=>({kind,x,z,h}));
// Deterministic companion clumps make broad, irregular verges rather than rows.
export const FOREST_PLANTS=[...BASE_PLANTS];
const kinds=['grassSparse','grassDense','whiteFlowers','yellowFlowers','pinkFlowers','mixedFlowers'];
function plant(kind,x,z,h){if(z>685&&z<1518)return;if(x>330&&x<850&&z>2190&&z<2650)return;FOREST_PLANTS.push({kind,x,z,h});}
BASE_PLANTS.forEach((p,i)=>{for(let j=0;j<3;j++){const side=Math.sign(p.x),x=p.x+side*(20+j*17+(i%3)*3),z=p.z+[-18,9,22][j];plant(j===2?kinds[(i+2)%6]:kinds[(i+j)%2],x,z,p.h*(.78+((i+j)%4)*.09));}});
for(let i=0;i<17;i++)for(const side of [-1,1]){const z=1570+i*113+Math.sin(i*2.7+side)*31,x=side*(320+(i*97%330));plant(kinds[(i+(side>0?2:0))%6],x,z,26+(i*7%13));}
for(let i=0;i<36;i++)for(const side of [-1,1]){const z=3330+i*140+Math.sin(i*2.1)*22;plant(kinds[(i+(side>0?2:0))%6],side*(195+(i*31%120)),z,26+(i*7%10));if(i%2===0)plant(kinds[(i+1)%6],side*(255+(i*17%105)),z+19,29+(i%5));}
// Flower islands around the clearing, clear of the central stone path.
for(let i=0;i<36;i++){const side=i%2?1:-1;plant(['whiteFlowers','yellowFlowers','pinkFlowers','mixedFlowers'][i%4],side*(210+i*43%220),4580+i*83%560,24+i*7%10);}
// Daisy meadow across both lawns in the same latter-half clearing.
for(let row=0;row<17;row++)for(const side of [-1,1])for(let col=0;col<11;col++){
 const seed=row*37+col*19+(side>0?11:0);
 const z=3940+row*100+(seed%41)-20;
 const x=side*(205+col*125+(seed%35));
 plant('daisies',x,z,62+seed%25);
}
export function addForestPlants({texture,quad},images){
 const cache=new Map(),identity=[1,0,0,0,1,0,0,0,1];
 function sprite(kind){
  if(cache.has(kind))return cache.get(kind);
  const im=images[kind],full=document.createElement('canvas');full.width=im.width;full.height=im.height;const ctx=full.getContext('2d',{willReadFrequently:true});ctx.drawImage(im,0,0);
  const pixels=ctx.getImageData(0,0,im.width,im.height).data;let x1=im.width,y1=im.height,x2=-1,y2=-1;
  for(let y=0;y<im.height;y++)for(let x=0;x<im.width;x++)if(pixels[(y*im.width+x)*4+3]>=102){x1=Math.min(x1,x);y1=Math.min(y1,y);x2=Math.max(x2,x);y2=Math.max(y2,y);}
  if(x2<0)throw Error('Plant artwork has no visible pixels: '+kind);
  // Crop transparent margins only. No colour keying or deletion inside a plant.
  x1=Math.max(0,x1-4);y1=Math.max(0,y1-4);x2=Math.min(im.width-1,x2+4);y2=Math.min(im.height-1,y2+4);
  const c=document.createElement('canvas');c.width=x2-x1+1;c.height=y2-y1+1;c.getContext('2d').drawImage(im,x1,y1,c.width,c.height,0,0,c.width,c.height);
  const result={tex:texture(c),ratio:c.width/c.height};cache.set(kind,result);return result;
 }
 for(const plant of FOREST_PLANTS){const {kind,z,h}=plant,x=plant.x+routeX(z),{tex,ratio}=sprite(kind),w=h*ratio;
  quad(tex,[{p:[x-w/2,h,z],uv:[0,0]},{p:[x+w/2,h,z],uv:[1,0]},{p:[x+w/2,0,z],uv:[1,1]},{p:[x-w/2,0,z],uv:[0,1]}],identity,undefined,false,2);
 }
}
