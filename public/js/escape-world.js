// One forest, reconstructed from the supplied picture and registered cutouts.
// World units are shared by the path, bridge, house, vegetation and camera.
export const FOREST={width:1672,height:941,focal:900,horizon:440,travel:2600,bridgeNear:706,bridgeFar:1152,houseZ:1590,doorZ:3260};
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
export function forestCamera(p){return {x:0,y:160+90*smooth(p/.17),z:FOREST.travel*clamp(p)};}
export function projectForestPoint({x,y,z},camera){const depth=z-camera.z;if(depth<=1)return null;return {x:FOREST.width/2+(x-camera.x)*FOREST.focal/depth,y:FOREST.horizon+(camera.y-y)*FOREST.focal/depth,depth};}
export function createForestWorld(images){
 const {width:W,height:H,focal:F,horizon:HY}=FOREST;
 const surface=document.createElement('canvas'),gl=surface.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false});
 if(!gl)throw Error('WebGL unavailable');
 const vertex=`attribute vec3 aPosition;attribute vec2 aUV;uniform vec3 uCamera;varying vec2 vUV;varying float vDepth;void main(){vec3 p=aPosition-uCamera;float d=p.z;gl_Position=vec4(p.x*${2*F/W},p.y*${2*F/H}+d*${1-2*HY/H},d*1.000025-2.000025,d);vUV=aUV;vDepth=d;}`;
 const fragment=`precision mediump float;uniform sampler2D uTexture;uniform float uFog;varying vec2 vUV;varying float vDepth;void main(){vec4 col=texture2D(uTexture,vUV);if(col.a<0.06)discard;float mist=smoothstep(2400.0,8500.0,vDepth)*uFog;gl_FragColor=vec4(mix(col.rgb,vec3(.54,.49,.31),mist),col.a);}`;
 function shader(kind,source){const s=gl.createShader(kind);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
 const vs=shader(gl.VERTEX_SHADER,vertex),fs=shader(gl.FRAGMENT_SHADER,fragment),program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
 const position=gl.getAttribLocation(program,'aPosition'),uv=gl.getAttribLocation(program,'aUV'),cameraUniform=gl.getUniformLocation(program,'uCamera'),fog=gl.getUniformLocation(program,'uFog');gl.uniform1i(gl.getUniformLocation(program,'uTexture'),0);gl.enableVertexAttribArray(position);gl.enableVertexAttribArray(uv);gl.enable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.clearColor(0,0,0,0);
 const textures=[],meshes=[];
 function crop(im,x,y,w,h,size){const c=document.createElement('canvas');c.width=size||Math.ceil(w);c.height=size||Math.ceil(h);c.getContext('2d').drawImage(im,x,y,w,h,0,0,c.width,c.height);return c;}
 function texture(im,repeat=false){const t=gl.createTexture();textures.push(t);gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,im);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);if(repeat){gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);}else gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,repeat?gl.REPEAT:gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,repeat?gl.REPEAT:gl.CLAMP_TO_EDGE);return t;}
 const src=images.opening;
 // Small source patches tile in world space, instead of stretching the entire
 // perspective photograph into the distance. All are sampled from background.png.
 let seed=1847;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 function terrainPatch(road){const out=document.createElement('canvas');out.width=out.height=128;const ctx=out.getContext('2d');const sample=crop(src,road?804:1040,road?835:745,road?76:96,road?82:96,128).getContext('2d').getImageData(0,0,128,128).data;
 const colours=[];for(let i=0;i<sample.length;i+=4){const r=sample[i],g=sample[i+1],b=sample[i+2];if(road?r>g*1.12&&r>80&&r<210:g>r*.87&&g>50&&g<150&&b<g*.85)colours.push(`rgb(${r},${g},${b})`);}
 const tone=()=>colours[Math.floor(random()*colours.length)]||(road?'#ad8561':'#66733f');ctx.fillStyle=road?'#887347':'#626b39';ctx.fillRect(0,0,128,128);
 for(let i=0;i<(road?190:850);i++){ctx.fillStyle=tone();const x=Math.floor(random()*128),y=Math.floor(random()*128),w=road?4+Math.floor(random()*12):1+Math.floor(random()*4),h=road?2+Math.floor(random()*5):1+Math.floor(random()*3);ctx.fillRect(x,y,w,h);if(x+w>128)ctx.fillRect(x-128,y,w,h);if(y+h>128)ctx.fillRect(x,y-128,w,h);}
 return out;}
 const grass=texture(terrainPatch(false),true),path=texture(terrainPatch(true),true),water=texture(crop(src,430,593,96,48,128),true),wood=texture(crop(src,785,588,92,15,128),true),stone=texture(crop(src,310,551,64,24,128),true);
 const cabin=texture(crop(images.house,1190,337,296,272)),nearLeft=texture(images.left),nearRight=texture(images.right),player=texture(images.hero);
 function mesh(tex,vertices,mist=1){const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);const m={tex,buffer,count:vertices.length/5,mist};meshes.push(m);return m;}
 function quad(tex,a,b,c,d,u=1,v=1,mist=1){const p=(q,x,y)=>[...q,x,y];return mesh(tex,[...p(a,0,0),...p(b,u,0),...p(c,u,v),...p(a,0,0),...p(c,u,v),...p(d,0,v)],mist);}
 function ground(tex,x1,x2,z1,z2,y=0,tile=130){return quad(tex,[x1,y,z1],[x2,y,z1],[x2,y,z2],[x1,y,z2],(x2-x1)/tile,(z2-z1)/tile);}
 function box(tex,x,y,z,w,h,d){quad(tex,[x,y,z],[x+w,y,z],[x+w,y+h,z],[x,y+h,z],w/30,h/30);quad(tex,[x,y,z+d],[x,y,z],[x,y+h,z],[x,y+h,z+d],d/30,h/30);quad(tex,[x+w,y,z],[x+w,y,z+d],[x+w,y+h,z+d],[x+w,y+h,z],d/30,h/30);ground(tex,x,x+w,z,z+d,y+h,30);}
 // A continuous path crosses the river on an actual deck. The water is below it.
 ground(grass,-7500,7500,-500,706,-1,160);ground(grass,-7500,7500,1152,9000,-1,160);
 ground(path,-57,57,-500,706,.3,105);ground(path,-57,57,1152,9000,.3,105);
 ground(water,-7500,7500,706,1152,-8,190);
 ground(stone,-7500,7500,685,706,1,90);ground(stone,-7500,7500,1152,1173,1,90);
 ground(wood,-85,85,696,1162,3,58);
 // Rails and posts share the deck's geometry, so they cannot slide away from it.
 for(const x of [-91,85]){for(let z=700;z<=1160;z+=92)box(wood,x,3,z,6,42,8);for(const y of [18,38])box(wood,x,y,700,6,5,460);}
 function sprite(tex,x,z,width,height){return quad(tex,[x-width/2,0,z],[x+width/2,0,z],[x+width/2,height,z],[x-width/2,height,z],1,1);}
 // Full-canvas near cutouts are calibrated against the original camera.
 const nearZ=F*160/(H-HY);sprite(nearLeft,0,nearZ,W*nearZ/F,H*nearZ/F);sprite(nearRight,0,nearZ,W*nearZ/F,H*nearZ/F);
 const heroZ=F*160/(H*.91-HY);sprite(player,0,heroZ,150*heroZ/F*images.hero.width/images.hero.height,150*heroZ/F);
 const houseFoot=609/1080*H,houseDepth=F*160/(houseFoot-HY),houseX=((1190+148)/1920*W-W/2)*houseDepth/F;
 sprite(cabin,houseX,houseDepth,296/1920*W*houseDepth/F,272/1080*H*houseDepth/F);
 // Reuse the existing transparent foliage, with full-canvas margins removed
 // only at texture sampling time. No new theme or landscape is introduced.
 const treeCanvas=document.createElement('canvas');treeCanvas.width=180;treeCanvas.height=230;
 const tc=treeCanvas.getContext('2d');tc.translate(-440,-315);tc.beginPath();
 const outline=[[476,321],[541,321],[541,340],[557,340],[557,361],[580,361],[580,389],[598,389],[598,455],[558,455],[558,484],[542,484],[542,538],[509,538],[509,471],[474,471],[474,449],[446,449],[446,382],[462,382],[462,350],[476,350]];
 outline.forEach(([x,y],i)=>i?tc.lineTo(x,y):tc.moveTo(x,y));tc.closePath();tc.clip();tc.drawImage(src,0,0);
 const leafPixels=tc.getImageData(0,0,180,230);for(let y=0;y<230;y++)for(let x=0;x<180;x++){const k=(y*180+x)*4;if(!(x>=69&&x<=103&&y>=150)&&leafPixels.data[k]>leafPixels.data[k+1]*1.18)leafPixels.data[k+3]=0;}tc.putImageData(leafPixels,0,0);
 const tree=texture(treeCanvas),bush=texture(crop(images.right,1311,633,609,447));
 for(let i=0;i<22;i++){const z=430+i*295;if(z>680&&z<1200)continue;for(const side of [-1,1]){const x=side*((side===1?400:240)+(i*193%620));if(side===1&&Math.abs(z-houseDepth)<380)continue;sprite(tree,x,z,140+(i*13%90),190+(i*29%140));}}
 for(let i=0;i<23;i++){const z=360+i*238;for(const side of [-1,1]){if(z>680&&z<1190)continue;sprite(bush,side*(125+i*71%200),z,65+(i%3)*20,25+(i%4)*7);}}
 for(let i=0;i<42;i++)sprite(tree,(i-21)*190+(i*37%90),7000+i%3*240,220+(i%4)*40,260+(i%5)*35);
 // The final gate belongs to this same path and palette.
 box(wood,-66,0,FOREST.doorZ,10,195,12);box(wood,56,0,FOREST.doorZ,10,195,12);box(wood,-66,190,FOREST.doorZ,132,10,12);
 box(wood,-51,0,FOREST.doorZ+4,102,177,6);
 const handleCanvas=document.createElement('canvas');handleCanvas.width=handleCanvas.height=8;const hc=handleCanvas.getContext('2d');hc.fillStyle='#dfb874';hc.fillRect(0,0,8,8);box(texture(handleCanvas),33,84,FOREST.doorZ-2,6,7,7);
 const skyCanvas=document.createElement('canvas');skyCanvas.width=1920;skyCanvas.height=270;
 const sc=skyCanvas.getContext('2d');sc.drawImage(images.back,0,0,1920,270,0,0,1920,270);sc.globalCompositeOperation='destination-in';const skyMask=sc.createLinearGradient(0,180,0,260);skyMask.addColorStop(0,'#fff');skyMask.addColorStop(1,'#fff0');sc.fillStyle=skyMask;sc.fillRect(0,0,1920,270);
 const swatch=document.createElement('canvas');swatch.width=1;swatch.height=490;const st=swatch.getContext('2d',{willReadFrequently:true});st.drawImage(src,800,0,1,490,0,0,1,490);const skyPixels=st.getImageData(0,0,1,490).data;
 function paint(m){gl.bindTexture(gl.TEXTURE_2D,m.tex);gl.bindBuffer(gl.ARRAY_BUFFER,m.buffer);gl.vertexAttribPointer(position,3,gl.FLOAT,false,20,0);gl.vertexAttribPointer(uv,2,gl.FLOAT,false,20,12);gl.uniform1f(fog,m.mist);gl.drawArrays(gl.TRIANGLES,0,m.count);}
 function render(ctx,p,width,height){const camera=forestCamera(p);if(surface.width!==width||surface.height!==height){surface.width=width;surface.height=height;gl.viewport(0,0,width,height);}ctx.setTransform(width/W,0,0,height/H,0,0);ctx.globalAlpha=1;ctx.imageSmoothingEnabled=false;
  // The same sunset stays distant. Its clouds do not expand as the camera walks.
  const sunset=ctx.createLinearGradient(0,0,0,HY+30);for(let i=0;i<=7;i++){const k=Math.min(489,Math.round(i/7*489))*4;sunset.addColorStop(i/7,`rgb(${skyPixels[k]},${skyPixels[k+1]},${skyPixels[k+2]})`);}ctx.fillStyle=sunset;ctx.fillRect(0,0,W,H);ctx.drawImage(skyCanvas,0,0,W,270/1920*W);
  const haze=ctx.createLinearGradient(0,HY-60,0,H);haze.addColorStop(0,'#bf9674');haze.addColorStop(1,'#58633e');ctx.fillStyle=haze;ctx.fillRect(0,HY,W,H-HY);
  ctx.save();ctx.beginPath();ctx.arc(867,HY-10,25,0,Math.PI*2);ctx.clip();ctx.drawImage(src,842,405,56,55,839,HY-37,56,55);ctx.restore();
  gl.useProgram(program);gl.uniform3f(cameraUniform,camera.x,camera.y,camera.z);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);for(const m of meshes)paint(m);ctx.drawImage(surface,0,0,W,H);
  const vignette=ctx.createRadialGradient(W*.5,H*.46,W*.16,W*.5,H*.46,W*.7);vignette.addColorStop(0,'#352e2300');vignette.addColorStop(1,'#352e2350');ctx.fillStyle=vignette;ctx.fillRect(0,0,W,H);
  const a=projectForestPoint({x:-66,y:200,z:FOREST.doorZ},camera),b=projectForestPoint({x:66,y:0,z:FOREST.doorZ},camera);
  return {camera,housePassed:camera.z>houseDepth,bridge:camera.z<696?'before':camera.z>1162?'after':'crossing',door:{x:a.x,y:a.y,width:b.x-a.x,height:b.y-a.y}};
 }
 return {render,dispose(){for(const m of meshes)gl.deleteBuffer(m.buffer);for(const t of textures)gl.deleteTexture(t);gl.deleteProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);gl.getExtension('WEBGL_lose_context')?.loseContext();}};
}
