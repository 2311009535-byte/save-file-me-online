import {meadowTree} from './forest-meadow.js';
import {createVolumeTrees} from './forest-volume-trees.js';
import {WOODLAND_TREES} from './forest-route.js';
// All visible surfaces are sampled from the supplied cottage/forest artwork.
// No random forest, generated landscape or invented rear facade is introduced.
export const COTTAGE_GROVE={nearLeft:{x:-420,z:2150,height:500},farLeft:{x:-650,z:3650,height:390},rearRight:{x:1000,z:2550,height:740},cottage:{left:355.5,right:814.5,front:2200,back:2630,eave:142,ridge:285},chimney:{x:712,y:300,z:2285}};
export function addCottageGrove({texture,quad,homography},images){
 const identity=[1,0,0,0,1,0,0,0,1],treeCache=new Map(),treeSources=[];
 const card=(tex,x,z,w,h)=>quad(tex,[{p:[x-w/2,h,z],uv:[0,0]},{p:[x+w/2,h,z],uv:[1,0]},{p:[x+w/2,0,z],uv:[1,1]},{p:[x-w/2,0,z],uv:[0,1]}],identity);
 const volumeTree=createVolumeTrees({texture,quad},images.back);
 function drawTree(tex,ratio,p){if(p===COTTAGE_GROVE.nearLeft||(p.z===3065&&p.x>0))volumeTree(p);else card(tex,p.x,p.z,p.height*ratio,p.height);}
 function tree(rect,outline,placement){
  // Trim source grass below each trunk and register its clean foot at ground level.
  const rootFloor=({490:582,1508:568,1652:589})[rect[0]];
  if(rootFloor){rect=[rect[0],rect[1],rect[2],Math.min(rect[3],rootFloor-rect[1])];outline=outline.map(([x,y])=>[x,Math.min(y,rootFloor)]);}
  const key=rect.join(',');if(treeCache.has(key)){const cached=treeCache.get(key);drawTree(cached.tex,cached.ratio,placement);return;}
  treeSources.push({rect,outline});
  const [x,y,w,h]=rect,c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');
  ctx.beginPath();outline.forEach(([px,py],i)=>i?ctx.lineTo(px-x,py-y):ctx.moveTo(px-x,py-y));ctx.closePath();ctx.clip();ctx.drawImage(images.back,x,y,w,h,0,0,w,h);
  // Preserve every source pixel inside the silhouette, including sunlit leaves.
  // Remove neighboring scenery beside the bark, below the intact crown.
  const trunk=({490:[578,620,532],1508:[1556,1588,520],1652:[1755,1804,501]})[x];
  if(trunk){const [left,right,top]=trunk;ctx.clearRect(0,top-y,left-x,h);ctx.clearRect(right-x,top-y,w,h);}
  const tex=texture(c);treeCache.set(key,{tex,ratio:w/h});drawTree(tex,w/h,placement);
 }
 tree([490,369,208,234],[[561,372],[628,371],[644,378],[644,417],[658,418],[677,426],[677,459],[694,464],[694,518],[679,518],[676,523],[625,525],[625,596],[620,601],[608,602],[599,596],[584,599],[575,595],[575,529],[546,529],[545,525],[526,525],[523,520],[493,517],[493,458],[513,458],[513,417],[539,417],[539,397],[561,397]],COTTAGE_GROVE.nearLeft);
 tree([1508,402,136,180],[[1543,407],[1604,407],[1604,428],[1620,429],[1620,448],[1639,449],[1641,452],[1641,513],[1592,515],[1592,574],[1553,575],[1553,515],[1525,515],[1525,512],[1512,512],[1510,508],[1510,450],[1532,447],[1532,412]],COTTAGE_GROVE.farLeft);
 tree([1652,286,249,318],[[1753,290],[1829,290],[1829,334],[1857,334],[1857,359],[1896,360],[1897,482],[1872,484],[1872,490],[1830,490],[1828,494],[1808,494],[1808,596],[1803,602],[1790,599],[1773,603],[1751,599],[1751,495],[1693,495],[1693,492],[1655,488],[1655,379],[1672,374],[1672,368],[1689,368],[1689,334],[1704,330],[1726,328],[1726,298]],COTTAGE_GROVE.rearRight);
 // Fixed groups on the cottage's left, using the complete approved silhouettes.
 for(const [source,x,z,height]of [[0,-800,1900,520],[1,-1080,2370,560],[0,-530,2800,440],[2,-1050,3120,640],[1,-480,3400,450],[0,-1250,3950,660]]){const t=treeSources[source];tree(t.rect,t.outline,{x,z,height});}
 // Layered outer-bank trees fill the wide view while keeping the cottage clear.
 for(const side of [-1,1])for(let row=0;row<3;row++)for(let col=0;col<4;col++){
  const source=(row+col+(side>0?1:0))%3,t=treeSources[source];
  tree(t.rect,t.outline,{x:side*(1250+col*530+row*85),z:1860+row*590+col*70+(side>0?80:0),height:570+(row*73+col*47)%210});
 }
 for(const p of WOODLAND_TREES){const t=treeSources[p.source];tree(t.rect,t.outline,meadowTree(p));}
 const house=texture(images.house),c=COTTAGE_GROVE.cottage,mid=(c.front+c.back)/2;
 function face(points,source){const map=homography(source.map(([x,y])=>[x/1920,y/1080]));quad(house,points.map((p,i)=>({p,uv:[[0,0],[1,0],[1,1],[0,1]][i]})),map);}
 // The long wall faces the approach; the existing gable faces the path.
 face([[c.left,0,c.front],[c.right,0,c.front],[c.right,c.eave,c.front],[c.left,c.eave,c.front]],[[1294,597],[1473,597],[1473,522],[1294,519]]);
 face([[c.left,0,c.front],[c.left,0,c.back],[c.left,c.eave,c.back],[c.left,c.eave,c.front]],[[1294,597],[1205,599],[1205,520],[1294,519]]);
 face([[c.left,c.eave,c.front],[c.right,c.eave,c.front],[c.right,c.ridge,mid],[c.left,c.ridge,mid]],[[1294,518],[1475,519],[1443,440],[1267,436]]);
 // One triangle for the supplied gable; the second quad triangle is degenerate.
 const gable=[[c.left,c.eave,c.front],[c.left,c.eave,c.back],[c.left,c.ridge,mid]],guv=[[1294,518],[1196,518],[1267,436]];
 quad(house,[0,1,2,2].map(i=>({p:gable[i],uv:[guv[i][0]/1920,guv[i][1]/1080]})),identity);
 // Source chimney remains an upright detail on the roof; smoke uses this anchor.
 const chimney=document.createElement('canvas');chimney.width=59;chimney.height=74;chimney.getContext('2d').drawImage(images.house,1390,414,59,74,0,0,59,74);
 const h=COTTAGE_GROVE.chimney;quad(texture(chimney),[{p:[h.x-40,h.y,h.z],uv:[0,0]},{p:[h.x+40,h.y,h.z],uv:[1,0]},{p:[h.x+40,h.y-100,h.z],uv:[1,1]},{p:[h.x-40,h.y-100,h.z],uv:[0,1]}],identity);
 // Original low plants hide the foundation join without adding a flat ground slab.
 const plants=document.createElement('canvas');plants.width=296;plants.height=13;plants.getContext('2d').drawImage(images.house,1190,596,296,13,0,0,296,13);
 card(texture(plants),(c.left+c.right)/2,c.front-3,c.right-c.left+32,23);
}
