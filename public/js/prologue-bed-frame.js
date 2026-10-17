// Independent source-line overlay: fixed bed geometry, segmented signal disturbance.
const area={x:48,y:561,w:486,h:291};
const lines=[[[155,573],[429,575]],[[167,582],[421,584]],[[156,574],[156,647]],[[166,583],[166,639]],[[424,577],[424,647]],[[431,572],[431,652]],[[168,639],[222,640]],[[349,640],[420,640]],[[81,705],[175,705]],[[180,704],[496,704]],[[81,754],[496,754]],[[84,765],[494,765]],[[77,704],[77,809]],[[84,706],[84,802]],[[96,709],[96,808]],[[77,810],[98,810]],[[494,704],[494,805]],[[503,705],[503,810]],[[511,709],[511,810]],[[494,810],[512,810]]];
const quilt=[[155,646],[217,657],[349,657],[420,646],[486,697],[185,704],[157,731],[96,767],[96,711]];
function inside(x,y,p){let yes=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
function distance(x,y,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],f=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(x-a[0]-f*dx,y-a[1]-f*dy);}
export function mountBedFrameGlitch(visual){
 const image=visual.querySelector('.scene-image'),canvas=document.createElement('canvas');canvas.width=area.w;canvas.height=area.h;canvas.className='prologue-bed-frame-glitch';canvas.setAttribute('aria-hidden','true');
 Object.assign(canvas.style,{position:'absolute',pointerEvents:'none',imageRendering:'pixelated',left:area.x/1536*100+'%',top:area.y/1024*100+'%',width:area.w/1536*100+'%',height:area.h/1024*100+'%'});
 const ctx=canvas.getContext('2d'),reduced=matchMedia('(prefers-reduced-motion: reduce)');let alive=true,timer=0,data,mask,frames=0;
 function stop(){clearTimeout(timer);ctx.clearRect(0,0,area.w,area.h);}
 function tick(){if(!alive||document.hidden||reduced.matches)return;const out=ctx.createImageData(area.w,area.h),t=performance.now()/1000;
  for(let y=0;y<area.h;y++)for(let x=0;x<area.w;x++){const i=(y*area.w+x)*4,m=mask[y*area.w+x];if(!m)continue;
   const zone=Math.floor(x/49)+Math.floor(y/23)*11,phase=t*(5.7+zone%3*.6)+zone*1.91;
   const pulse=Math.sin(phase*1.7),tear=pulse>.82?Math.round((pulse-.82)/.18*2)*Math.sign(Math.sin(zone*2.3)):0,shift=Math.sin(phase)>.2?1:0;
   const sample=(dx,c)=>data[(y*area.w+Math.max(0,Math.min(area.w-1,x+dx)))*4+c],gain=.92+.1*Math.sin(phase*.7);
   out.data[i]=sample(-tear-shift,0)*gain;out.data[i+1]=sample(-tear+shift,1)*gain;out.data[i+2]=sample(-tear,2)*gain;
   // Frequent brief line interruptions, each section on its own phase.
   if(pulse>.95&&(y+zone)%7<2){out.data[i]*=.35;out.data[i+1]*=.35;out.data[i+2]*=.35;}
   out.data[i+3]=m*(160+30*Math.sin(phase*.9));
  }
  ctx.putImageData(out,0,0);canvas.dataset.frames=String(++frames);timer=setTimeout(tick,35);
 }
 async function start(){try{await image.decode();}catch{return;}if(!alive||!image.isConnected)return;
  ctx.drawImage(image,area.x,area.y,area.w,area.h,0,0,area.w,area.h);data=ctx.getImageData(0,0,area.w,area.h).data;mask=new Float32Array(area.w*area.h);
  for(let y=0;y<area.h;y++)for(let x=0;x<area.w;x++){const gx=x+area.x,gy=y+area.y;if(inside(gx,gy,quilt))continue;const near=Math.min(...lines.map(([a,b])=>distance(gx,gy,a,b)));if(near>5)continue;
   let lit=false;for(let dx=-2;dx<=2;dx++){const nx=x+dx;if(nx<0||nx>=area.w)continue;const i=(y*area.w+nx)*4;if(Math.max(data[i],data[i+1],data[i+2])>60)lit=true;}
   if(lit)mask[y*area.w+x]=Math.max(0,1-near/6);
  }
  ctx.clearRect(0,0,area.w,area.h);visual.append(canvas);tick();
 }
 const resume=()=>{stop();if(data&&!document.hidden)tick();};document.addEventListener('visibilitychange',resume);reduced.addEventListener('change',resume);start();
 return()=>{alive=false;stop();canvas.remove();document.removeEventListener('visibilitychange',resume);reduced.removeEventListener('change',resume);};
}
