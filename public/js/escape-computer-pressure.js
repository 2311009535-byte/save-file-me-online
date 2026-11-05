import {pressurePocket} from './escape-wall-pressure.js';
// Silhouette keyframes follow the authored camera clip, in normalized pixels.
const poses=[
 [0,pressurePocket],
 [1,[[.465,.184],[.593,.193],[.588,.287],[.629,.214],[.695,.243],[.682,.510],[.657,.514],[.643,.660],[.566,.905],[.446,.911],[.414,.761],[.406,.617],[.350,.481],[.330,.441],[.375,.350],[.414,.282],[.464,.286]]],
 [2,[[.473,.195],[.695,.184],[.689,.44],[.773,.238],[.844,.271],[.829,.754],[.792,.769],[.67,.85],[.62,1.10],[.30,1.10],[.29,.88],[.28,.67],[.22,.57],[.17,.44],[.28,.42],[.355,.45],[.468,.433]]],
 [3,[[.48,.15],[.873,.065],[.845,.65],[.94,.44],[.985,.47],[1.1,1],[.9,1],[.8,1.2],[.6,1.3],[-.1,1.2],[-.1,.9],[-.05,.8],[-.05,.75],[0,.69],[.12,.59],[.23,.56],[.46,.54]]],
 [4.1,[[.49,.07],[1.01,-.03],[1.01,.65],[1.1,.44],[1.2,.47],[1.3,1],[1.1,1],[1,1.2],[.8,1.3],[-.1,1.2],[-.1,.9],[-.05,.8],[-.05,.75],[0,.69],[.10,.64],[.20,.60],[.46,.59]]]
];
const heads=[
 [0,[[.50,.29],[.505,.27],[.53,.26],[.55,.28],[.56,.33],[.55,.36],[.51,.36],[.50,.33]]],
 [1,[[.45,.36],[.46,.32],[.48,.31],[.51,.33],[.52,.40],[.52,.43],[.45,.43],[.44,.39]]],
 [2,[[.36,.39],[.37,.36],[.41,.34],[.47,.36],[.49,.43],[.50,.51],[.36,.52],[.35,.46]]],
 [3,[[.22,.38],[.24,.32],[.31,.29],[.38,.33],[.41,.43],[.41,.57],[.22,.57],[.21,.48]]],
 [4.1,[[.12,.36],[.14,.28],[.25,.25],[.36,.30],[.39,.44],[.40,.64],[.12,.64],[.10,.48]]]
];
function interpolate(frames,time){let a=frames[0],b=frames.at(-1);for(let i=1;i<frames.length;i++)if(time<=frames[i][0]){a=frames[i-1];b=frames[i];break;}const mix=Math.max(0,Math.min(1,(time-a[0])/(b[0]-a[0])));return a[1].map((p,i)=>p.map((v,j)=>v+(b[1][i][j]-v)*mix));}
export const computerPocketAt=time=>interpolate(poses,time);

export function mountComputerPressure(video,host,room){
 const sources=[...room.querySelectorAll('.escape-wall-pressure')];
 const canvas=document.createElement('canvas');canvas.width=960;canvas.height=540;canvas.className='escape-computer-pressure';canvas.setAttribute('aria-hidden','true');Object.assign(canvas.style,{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none'});host.append(canvas);
 const ctx=canvas.getContext('2d'),texture=document.createElement('canvas');texture.width=960;texture.height=540;const ink=texture.getContext('2d');
 ink.fillStyle='#0b0d0f';ink.fillRect(0,0,960,540);sources.forEach(source=>ink.drawImage(source,0,0,960,540));
 // Fill the stationary hole; only the moving silhouette may expose the film.
 ink.fillStyle='#101214';ink.beginPath();pressurePocket.forEach(([x,y],i)=>ink[i?'lineTo':'moveTo'](x*960,y*540));ink.closePath();ink.fill();
 let alive=true,request=0,raf=0,lastTime=0;
 function paint(time){lastTime=time;const w=960,h=540,scale=1+time*.55;ctx.clearRect(0,0,w,h);ctx.drawImage(texture,(1-scale)*w*.5,(1-scale)*h*.38,w*scale,h*scale);
  ctx.save();ctx.globalCompositeOperation='destination-out';ctx.fillStyle='#000';ctx.beginPath();computerPocketAt(time).forEach(([x,y],i)=>ctx[i?'lineTo':'moveTo'](x*w,y*h));ctx.closePath();ctx.fill();
  ctx.beginPath();interpolate(heads,time).forEach(([x,y],i)=>ctx[i?'lineTo':'moveTo'](x*w,y*h));ctx.closePath();ctx.fill();
  ctx.restore();canvas.dataset.time=time.toFixed(3);canvas.dataset.ready='true';
 }
 function frame(now,metadata){if(!alive)return;paint(metadata?.mediaTime??video.currentTime);if(video.requestVideoFrameCallback)request=video.requestVideoFrameCallback(frame);else raf=requestAnimationFrame(frame);}
 const paused=()=>paint(lastTime);video.addEventListener('pause',paused);paint(0);if(video.requestVideoFrameCallback)request=video.requestVideoFrameCallback(frame);else raf=requestAnimationFrame(frame);
 return()=>{alive=false;video.removeEventListener('pause',paused);if(request)video.cancelVideoFrameCallback?.(request);cancelAnimationFrame(raf);canvas.remove();};
}
