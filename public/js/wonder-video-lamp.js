// Follow the lamp in each supplied camera move. Only warm lamp pixels are
// graded from the current video frame; no still-image cutout covers the film.
const paths={
 'window-enter-supplied.mp4':[[0,.687,.439,1],[.4,.771,.455,1.12],[.8,.878,.476,1.25],[1.2,1.018,.504,1.4],[1.6,1.2,.54,1.6]],
 'window-return-supplied.mp4':[[0,1.3,.54,1.6],[3.6,1.105,.52,1.5],[4,.96,.491,1.35],[4.4,.816,.464,1.16],[4.7,.739,.449,1.06],[5.1,.687,.439,1]],
 'box-enter-supplied.mp4':[[0,.692,.44,1],[.8,.691,.438,1],[1,.678,.432,1.03],[1.2,.652,.421,1.08],[1.6,.558,.341,1.18],[2,.405,.237,1.32],[2.4,.22,.07,1.5],[2.8,-.1,-.15,1.7]],
 'box_return.mp4':[[0,-.3,-.3,1.7],[1,-.04,-.08,1.6],[1.6,.15,.04,1.5],[2,.27,.135,1.4],[2.4,.405,.237,1.32],[2.8,.504,.313,1.23],[3.2,.589,.377,1.13],[3.6,.645,.42,1.06],[4.1,.692,.44,1]]
};
export function videoLampPose(src,time){const keys=paths[src.split('/').at(-1)];if(!keys)return null;let a=keys[0],b=keys.at(-1);for(let i=1;i<keys.length;i++)if(time<=keys[i][0]){a=keys[i-1];b=keys[i];break;}const t=Math.max(0,Math.min(1,(time-a[0])/Math.max(.001,b[0]-a[0])));return{x:a[1]+(b[1]-a[1])*t,y:a[2]+(b[2]-a[2])*t,scale:a[3]+(b[3]-a[3])*t};}
export function mountVideoLampOff(video,host){
 const c=document.createElement('canvas');c.width=834;c.height=471;c.className='wonder-video-lamp-off';c.setAttribute('aria-hidden','true');Object.assign(c.style,{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:3});host.append(c);
 const ctx=c.getContext('2d',{willReadFrequently:true});let alive=true,request=0,raf=0,last=-1;
 function paint(){if(!alive||video.readyState<2)return;const time=video.currentTime||0;if(time===last)return;last=time;ctx.clearRect(0,0,c.width,c.height);c.dataset.changedPixels='0';const pose=videoLampPose(video.currentSrc||video.src,time);if(!pose)return;
  const cx=pose.x*c.width,cy=pose.y*c.height,rx=55*pose.scale,ry=61*pose.scale,x=Math.max(0,Math.floor(cx-rx)),y=Math.max(0,Math.floor(cy-ry*.45)),w=Math.min(c.width-x,Math.ceil(rx*2)),h=Math.min(c.height-y,Math.ceil(ry*1.7));
  if(x>=c.width||y>=c.height||w<=0||h<=0||cx+rx<0||cy+ry<0)return;
  ctx.drawImage(video,x/c.width*video.videoWidth,y/c.height*video.videoHeight,w/c.width*video.videoWidth,h/c.height*video.videoHeight,x,y,w,h);const p=ctx.getImageData(x,y,w,h);let changed=0;
  for(let row=0;row<h;row++)for(let col=0;col<w;col++){const i=(row*w+col)*4,r=p.data[i],g=p.data[i+1],b=p.data[i+2],dx=x+col-cx,dy=y+row-cy;
   const core=Math.max(0,Math.min(1,(1-Math.hypot(dx/(22*pose.scale),dy/(18*pose.scale)))*4));
   const beam=Math.max(0,1-Math.hypot((dx+12*pose.scale)/rx,(dy-24*pose.scale)/ry));
   const warm=r>g*.96&&g>b*1.05&&r>85;
   if(!warm||(core===0&&beam===0)){p.data[i+3]=0;continue;}
   // Preserve the bulb's texture and shape; lower its emission to a material tone.
   const mouth=core*Math.max(0,Math.min(1,(g-95)/45)),wall=beam*.65;
   p.data[i]=r*(1-Math.max(mouth*.44,wall*.52));p.data[i+1]=g*(1-Math.max(mouth*.40,wall*.37));p.data[i+2]=b*(1-Math.max(mouth*.30,wall*.12));changed++;
  }
  ctx.putImageData(p,x,y);c.dataset.changedPixels=String(changed);c.dataset.time=time.toFixed(3);c.dataset.lampX=pose.x.toFixed(3);c.dataset.lampY=pose.y.toFixed(3);
 }
 function frame(){if(!alive)return;paint();if(video.requestVideoFrameCallback)request=video.requestVideoFrameCallback(frame);else raf=requestAnimationFrame(frame);}
 const seek=()=>{last=-1;paint();};video.addEventListener('seeked',seek);frame();
 return()=>{alive=false;if(request)video.cancelVideoFrameCallback?.(request);cancelAnimationFrame(raf);video.removeEventListener('seeked',seek);c.remove();};
}
