// Additional restored wireframe objects in 0_3. Source-pixel masks include
// nearby broken lines, rather than filling rectangular bounding boxes.
const areas={computer:{x:745,y:296,w:447,h:380},bed:{x:80,y:638,w:414,h:143},shelf:{x:1218,y:283,w:287,h:309}};
const quiltOutline=[[155,646],[217,657],[349,657],[420,646],[486,697],[185,704],[157,731],[96,767],[96,711]];
const quiltFolds=[[[185,704],[157,731]],[[157,731],[96,767]]];
function inside(x,y,p){let yes=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
function distance(x,y,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],f=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(x-a[0]-f*dx,y-a[1]-f*dy);}
function drawQuilt(l){
 const {a,ctx,data,mask,canvas}=l,out=ctx.createImageData(a.w,a.h),t=performance.now()/1000;
 for(let y=0;y<a.h;y++)for(let x=0;x<a.w;x++){
  const i=(y*a.w+x)*4,m=mask[y*a.w+x];if(!m)continue;
  // Asynchronous local fields, small displacement; the grid never scrolls as a whole.
  const zone=Math.floor(x/63)+Math.floor(y/35)*7,phase=t*(.85+zone%4*.13)+zone*1.73;
  const envelope=Math.sin(t*4.3+zone*2.17),tear=envelope>.92?(envelope-.92)/.08:0;
  const dx=Math.sin(phase)*1.15+tear*Math.sin(zone*3.1)*1.5,dy=Math.sin(phase*.73+zone)*.35;
  const sx=Math.max(0,Math.min(a.w-1,Math.round(x-dx))),sy=Math.max(0,Math.min(a.h-1,Math.round(y-dy))),j=(sy*a.w+sx)*4;
  // Keep white structural lines and their shading untouched, even when sampling nearby.
  const hi=Math.max(data[j],data[j+1],data[j+2]),lo=Math.min(data[j],data[j+1],data[j+2]);if(hi>80&&hi-lo<28)continue;
  const scan=Math.abs((y+zone*3)%31-(Math.floor(t*7+zone)%31))<.7&&Math.sin(t*2.9+zone)>.75;
  const gain=scan?.76:1+Math.sin(phase*1.3)*.045;
  out.data[i]=data[j]*gain;out.data[i+1]=data[j+1]*gain;out.data[i+2]=data[j+2]*gain;out.data[i+3]=m*225;
 }
 ctx.putImageData(out,0,0);canvas.dataset.frames=String(++l.frames);canvas.dataset.effect='quilt-grid';
}
export function mountObjectGlitches(visual){
 const image=visual.querySelector('.scene-image');let alive=true,timer=0,layers=[];
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function stop(){clearTimeout(timer);for(const l of layers)l.ctx.clearRect(0,0,l.a.w,l.a.h);}
 function tick(){if(!alive||document.hidden||reduced.matches)return;
  for(const l of layers){if(l.canvas.dataset.object==='bed'){drawQuilt(l);continue;}const {a,ctx,data,mask,canvas}=l,out=ctx.createImageData(a.w,a.h),shift=1+Math.floor(Math.random()*3),phase=Math.floor(performance.now()/30),gain=.95+Math.random()*.12;
   const strips=Array.from({length:6},()=>({y:Math.floor(Math.random()*a.h),h:1+Math.floor(Math.random()*3),dx:Math.random()<.5?-4:4}));
   for(let y=0;y<a.h;y++){const offset=strips.find(s=>y>=s.y&&y<s.y+s.h)?.dx||0;for(let x=0;x<a.w;x++){const i=(y*a.w+x)*4,m=mask[y*a.w+x];if(!m)continue;
    const sample=(dx,c)=>data[(y*a.w+Math.max(0,Math.min(a.w-1,x+dx)))*4+c];
    out.data[i]=sample(-offset-shift,0)*gain;out.data[i+1]=sample(-offset+shift,1)*gain;out.data[i+2]=sample(-offset,2);out.data[i+3]=m*(85+Math.random()*60);
    if(Math.random()<.18){const red=Math.random()<.5;out.data[i]=red?225:40;out.data[i+1]=red?40:210;out.data[i+2]=60;out.data[i+3]=m*(25+Math.random()*60);}
    else if((y+phase)%5===0){out.data[i]=phase%2?170:30;out.data[i+1]=phase%2?40:160;out.data[i+2]=40;out.data[i+3]=m*40;}
   }}
   ctx.putImageData(out,0,0);
   // Sparse tiny ASCII fragments remain attached to existing source wire lines.
   if(Math.random()<.38){const p=l.anchors[Math.floor(Math.random()*l.anchors.length)];if(p){ctx.font='9px monospace';ctx.fillStyle=Math.random()<.5?'#f4575b88':'#60e68788';ctx.fillText(['|','+','01','/','_'][Math.floor(Math.random()*5)],p[0],p[1]);}}
   canvas.dataset.frames=String(++l.frames);
  }timer=setTimeout(tick,30+Math.random()*8);
 }
 async function start(){try{await image.decode();}catch{return;}if(!alive||!image.isConnected)return;
  for(const [name,a] of Object.entries(areas)){
   const canvas=document.createElement('canvas');canvas.width=a.w;canvas.height=a.h;canvas.className='prologue-object-glitch';canvas.dataset.object=name;canvas.setAttribute('aria-hidden','true');
   Object.assign(canvas.style,{position:'absolute',pointerEvents:'none',imageRendering:'pixelated',left:a.x/1536*100+'%',top:a.y/1024*100+'%',width:a.w/1536*100+'%',height:a.h/1024*100+'%'});
   const ctx=canvas.getContext('2d');ctx.drawImage(image,a.x,a.y,a.w,a.h,0,0,a.w,a.h);const data=ctx.getImageData(0,0,a.w,a.h).data,mask=new Float32Array(a.w*a.h),anchors=[];
   for(let y=0;y<a.h;y++)for(let x=0;x<a.w;x++){const i=(y*a.w+x)*4;
    if(name==='bed'){
     const gx=x+a.x,gy=y+a.y;if(!inside(gx,gy,quiltOutline))continue;
     const edge=Math.min(...quiltOutline.map((p,k)=>distance(gx,gy,p,quiltOutline[(k+1)%quiltOutline.length]))),fold=Math.min(...quiltFolds.map(([p,q])=>distance(gx,gy,p,q)));
     if(edge<4||fold<3)continue;
     const hi=Math.max(data[i],data[i+1],data[i+2]),lo=Math.min(data[i],data[i+1],data[i+2]);if(hi>70&&hi-lo<28)continue;
     let colored=false;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=a.w||ny>=a.h)continue;const j=(ny*a.w+nx)*4,r=data[j],g=data[j+1];if((r>g*1.35&&r>30)||(g>r*1.35&&g>30))colored=true;}
     if(colored)mask[y*a.w+x]=Math.min(1,(edge-4)/5,(fold-3)/4);continue;
    }
    if(Math.max(data[i],data[i+1],data[i+2])<40)continue;
    if(x%9===0&&y%9===0)anchors.push([x,y]);
    for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=a.w||ny>=a.h)continue;const feather=Math.max(0,Math.min(1,nx/10,(a.w-1-nx)/10,ny/10,(a.h-1-ny)/10));mask[ny*a.w+nx]=Math.max(mask[ny*a.w+nx],feather*(1-Math.hypot(dx,dy)/5));}
   }
   layers.push({a,canvas,ctx,data,mask,anchors,frames:0});visual.append(canvas);
  }tick();
 }
 const resume=()=>{stop();if(layers.length&&!document.hidden)tick();};document.addEventListener('visibilitychange',resume);reduced.addEventListener('change',resume);start();
 return()=>{alive=false;stop();layers.forEach(l=>l.canvas.remove());document.removeEventListener('visibilitychange',resume);reduced.removeEventListener('change',resume);};
}
