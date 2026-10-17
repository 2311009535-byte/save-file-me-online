// Boundaries traced against the supplied phone clip, in normalized video coordinates.
// The colour key alone is insufficient: yellow light on the floor/bed must remain intact.
const boundaries=[
 [0,[.43,.43,.24,.22,.30,.58],[.70,.77,.80,.74,.67,.58]],
 [.5,[.47,.39,.28,.23,.27,.36],[.74,.81,.87,.84,.76,.65]],
 [1,[.55,.42,.31,.23,.22,.35],[.98,.98,.99,1,1,1]],
 [1.5,[.37,.33,.28,.23,.19,.27],[1,1,1,1,1,1]],
 [2,[.28,.25,.22,.20,.18,.17],[1,1,1,1,1,1]],
 [2.5,[.14,.11,.09,.07,.055,.035],[1,1,1,1,1,1]],
 [3,[.10,.085,.065,.06,.05,.04],[1,1,1,1,1,1]],
 [3.5,[.055,.04,.035,.025,.02,.015],[1,1,1,1,1,1]],
 [4.064,[.04,.03,.025,.02,.015,.01],[1,1,1,1,1,1]]
];
export function mountPhoneWallDimming(video,host,darkness){
 if(!(darkness>0))return ()=>{};
 const canvas=document.createElement('canvas');canvas.className='escape-phone-wall-video';canvas.setAttribute('aria-hidden','true');
 const gl=canvas.getContext('webgl',{alpha:false,antialias:false,preserveDrawingBuffer:true});
 if(!gl){console.warn('Phone wall shading requires WebGL');return ()=>{};}
 let alive=true,raf=0,lastTime=-1;
 function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
 const vert=shader(gl.VERTEX_SHADER,'attribute vec2 position; varying vec2 uv; void main(){uv=vec2((position.x+1.0)*0.5,(1.0-position.y)*0.5);gl_Position=vec4(position,0.0,1.0);}');
 const frag=shader(gl.FRAGMENT_SHADER,`precision highp float; varying vec2 uv; uniform sampler2D image; uniform float darkness; uniform float leftEdge[6]; uniform float rightEdge[6];
 void main(){vec4 c=texture2D(image,uv);float l=leftEdge[5],r=rightEdge[5];
 for(int i=0;i<5;i++){if(uv.y>=float(i)*.2&&uv.y<float(i+1)*.2){float p=(uv.y-float(i)*.2)*5.0;l=mix(leftEdge[i],leftEdge[i+1],p);r=mix(rightEdge[i],rightEdge[i+1],p);}}
 float wall=max(1.0-smoothstep(l-.004,l,uv.x),smoothstep(r,r+.004,uv.x));
 float yellow=smoothstep(.035,.10,min(c.r,c.g)-c.b)*(1.0-smoothstep(.70,.85,c.b/max(.001,min(c.r,c.g))))*smoothstep(.55,.8,c.r/max(.001,c.g))*(1.0-smoothstep(1.6,2.0,c.r/max(.001,c.g)));
 gl_FragColor=vec4(c.rgb*(1.0-darkness*wall*yellow),1.0);}`);
 const program=gl.createProgram();gl.attachShader(program,vert);gl.attachShader(program,frag);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));gl.useProgram(program);
 const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
 const location=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,2,gl.FLOAT,false,0,0);
 const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 const left=gl.getUniformLocation(program,'leftEdge[0]'),right=gl.getUniformLocation(program,'rightEdge[0]');gl.uniform1f(gl.getUniformLocation(program,'darkness'),Math.min(.56,darkness));gl.uniform1i(gl.getUniformLocation(program,'image'),0);
 function draw(){if(!alive||video.readyState<2)return;
  const width=Math.max(1,Math.min(video.videoWidth,Math.ceil(host.getBoundingClientRect().width*(window.devicePixelRatio||1)))),height=Math.max(1,Math.round(width*video.videoHeight/video.videoWidth));
  if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;gl.viewport(0,0,width,height);}
  const t=video.currentTime;let i=0;while(i<boundaries.length-2&&t>boundaries[i+1][0])i++;
  const a=boundaries[i],b=boundaries[i+1],p=Math.max(0,Math.min(1,(t-a[0])/(b[0]-a[0])));
  gl.uniform1fv(left,a[1].map((v,j)=>v+(b[1][j]-v)*p));gl.uniform1fv(right,a[2].map((v,j)=>v+(b[2][j]-v)*p));
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,video);gl.drawArrays(gl.TRIANGLES,0,6);
  lastTime=t;canvas.dataset.wallDarkness=String(darkness);canvas.dataset.mediaTime=String(t);
  if(!canvas.isConnected)host.append(canvas);
 }
 function tick(){if(!alive)return;if(video.currentTime!==lastTime)draw();raf=requestAnimationFrame(tick);}
 video.addEventListener('seeked',draw);video.addEventListener('loadeddata',draw);tick();
 return ()=>{alive=false;cancelAnimationFrame(raf);video.removeEventListener('seeked',draw);video.removeEventListener('loadeddata',draw);video.style.visibility='';canvas.remove();gl.deleteTexture(texture);gl.deleteBuffer(buffer);gl.deleteProgram(program);gl.deleteShader(vert);gl.deleteShader(frag);gl.getExtension('WEBGL_lose_context')?.loseContext();};
}
