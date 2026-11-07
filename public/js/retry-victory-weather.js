// Effects follow media time: the original victory clip never pauses or seeks.
export function victoryWeather(video,visual){
 const ns='http://www.w3.org/2000/svg',make=(tag,attrs)=>{const e=document.createElementNS(ns,tag);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,v);return e;},svg=make('svg',{viewBox:'0 0 1672 941','aria-hidden':'true'});svg.classList.add('retry-victory-weather');visual.append(svg);let dead=false,frame=0;
 const light=make('g',{fill:'#ffe5b0','data-victory-light':'continuous'});light.style.mixBlendMode='soft-light';svg.append(light);for(const points of ['1220,-70 1350,-70 490,941 270,941','1410,-70 1510,-70 1040,941 740,941','1550,-70 1672,-70 1570,941 1270,941'])light.append(make('polygon',{points}));
 const smoke=[];for(let i=0;i<6;i++){const x=830+i*92,y=190+i%3*54,p=make('path',{d:`M${x-100},${y} l35,-16 36,10 32,-17 44,12 33,-5 29,20 -36,13 -41,-4 -36,14 -41,-12 Z`,fill:'#38322d'});svg.append(p);smoke.push(p);}
 const motes=[];for(let i=0;i<26;i++){const x=780+i*79%700,y=160+i*41%260,p=make('path',{d:`M${x},${y} l5,-3 4,5 -5,4 Z`,fill:i%3?'#51483e':'#d6c6a8'});svg.append(p);motes.push(p);}
 const clamp=n=>Math.max(0,Math.min(1,n)),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function paint(){if(dead)return;const t=video.currentTime,p=clamp((t-4.4)/2.3),visible=t>=4.4&&t<7.9;svg.style.opacity=visible?'1':'0';light.style.opacity=String(clamp((t-4.7)/1.8)*clamp((8-t)/1.1)*(reduced?.08:.24));
  smoke.forEach((e,i)=>{e.style.opacity=String(reduced?0:Math.sin(p*Math.PI)*.30*(1-p));e.style.transform=`translate(${-p*(65+i*15)}px,${-p*(55+i*12)}px) rotate(${-p*(i+2)}deg)`;});motes.forEach((e,i)=>{e.style.opacity=String(reduced?0:Math.sin(p*Math.PI)*.46);e.style.transform=`translate(${-p*(25+i%6*10)}px,${-p*(45+i%8*13)}px)`;});
  if(video.requestVideoFrameCallback)frame=video.requestVideoFrameCallback(paint);
 }video.addEventListener('timeupdate',paintFallback);function paintFallback(){if(!video.requestVideoFrameCallback)paint();}paint();return()=>{dead=true;if(frame)video.cancelVideoFrameCallback?.(frame);video.removeEventListener('timeupdate',paintFallback);svg.remove();};
}
