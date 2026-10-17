import {addForestDoor} from './forest-door.js';
import {addForestMeadow} from './forest-meadow.js';
import {addForestRabbit} from './forest-rabbit.js';
import {addForestProps} from './forest-props.js';
import {FOREST_ROUTE,ROUTE_LENGTH,forestCamera} from './forest-route.js';
import {addForestPlants} from './forest-plants.js';
import {addCottageGrove,COTTAGE_GROVE} from './cottage-grove.js';
import {createForestAtmosphere} from './forest-atmosphere.js';
// Opt-in scenery for the accepted path/bridge study. Every image comes from the
// supplied background and registered cutouts; no generated landscape or props.
export const FOREST_PLACEMENT={backgroundZ:18000,houseZ:2200,houseX:585,houseWidth:459,houseHeight:421};
export function prepareForestLayers(images){
 const background=document.createElement('canvas');background.width=1920;background.height=1080;const bc=background.getContext('2d');
 // Remove the baked cabin before placing its independent card on the far bank.
 // These are in-memory composites only; the supplied PNG files stay unchanged.
 bc.drawImage(images.back,0,0,1920,1080);
 // The two supplied edits have slightly different cabin silhouettes. Cover the
 // full old silhouette, not only the new PNG's alpha, to avoid an old roof edge.
 const patch=document.createElement('canvas');patch.width=500;patch.height=430;const pc=patch.getContext('2d');pc.drawImage(images.cleared,1060,220,500,430,0,0,500,430);
 pc.globalCompositeOperation='destination-in';const edge=18;for(const [x0,y0,x1,y1]of [[0,0,edge,0],[500,0,500-edge,0],[0,0,0,edge],[0,430,0,430-edge]]){const mask=pc.createLinearGradient(x0,y0,x1,y1);mask.addColorStop(0,'#fff0');mask.addColorStop(1,'#fff');pc.fillStyle=mask;pc.fillRect(0,0,500,430);}bc.drawImage(patch,1060,220);
 const water=document.createElement('canvas');water.width=512;water.height=128;const wc=water.getContext('2d');wc.imageSmoothingEnabled=false;wc.drawImage(images.opening,300,600,100,20,0,0,512,128);
 function add({texture,quad,homography}){
  const identity=[1,0,0,0,1,0,0,0,1],W=1672,H=941,F=900,HY=240,initialCameraZ=300,cameraY=105;
  const panel=(tex,left,right,bottom,top,z,effect=0,backdrop=false)=>quad(tex,[{p:[left,top,z],uv:[0,0]},{p:[right,top,z],uv:[1,0]},{p:[right,bottom,z],uv:[1,1]},{p:[left,bottom,z],uv:[0,1]}],identity,undefined,false,effect,backdrop);
  // Same original photographic sky/woodland. The crop follows the accepted
  // camera's lower horizon rather than inventing a new sky or recolouring it.
  const z=FOREST_PLACEMENT.backgroundZ,depth=z-initialCameraZ;
  const skyHeight=700*depth/F,skyWidth=skyHeight*images.panorama.width/images.panorama.height;
  const skyTop=cameraY+(HY+300)*depth/F;
  panel(texture(images.panorama),-skyWidth/2,skyWidth/2,skyTop-skyHeight,skyTop,z,-1,true);
  const fullCard=(image,x,z,referenceDepth,scale=1)=>{const width=W*referenceDepth/F*scale,height=H*referenceDepth/F*scale;panel(texture(image),x-width/2,x+width/2,0,height,z,1);};
  // Full source canvases retain their original registration and transparency.
  // Their ground feet are fixed outside the accepted central walkway.
  const nearDepth=F*cameraY/(H+180-HY);
  // Keep the original cutouts' bottom canvas edges below the viewport; those
  // edges must not become visible vertical walls of grass over the walkway.
  fullCard(images.left,16,initialCameraZ+nearDepth,nearDepth,1.4);
  fullCard(images.right,-10,initialCameraZ+nearDepth,nearDepth,1.4);
  // Reuse the supplied player. The shared camera passes above its head without
  // an independent image scale/translation track or camera speed change.
  const heroDepth=F*cameraY/(H*.91-HY),heroHeight=150*heroDepth/F,heroWidth=heroHeight*images.hero.width/images.hero.height;
  panel(texture(images.hero),-heroWidth/2,heroWidth/2,0,heroHeight,initialCameraZ+heroDepth);
  addCottageGrove({texture,quad,homography},images);
  addForestPlants({texture,quad},images);
  addForestProps({texture,quad},images);
  addForestRabbit({texture,quad},images.rabbitSheet);
  addForestMeadow({texture,quad},images.butterflySheet);
  addForestDoor({texture,quad},images.forestDoor);
 }
 return {water,sky:images.panorama,add,end:FOREST_ROUTE.end,length:ROUTE_LENGTH,camera:forestCamera,houseZ:FOREST_PLACEMENT.houseZ,...createForestAtmosphere(images.house,COTTAGE_GROVE.chimney)};
}
