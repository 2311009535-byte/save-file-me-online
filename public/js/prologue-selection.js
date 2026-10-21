// Independent particles drift near fixed source contours; none orbit the object.
const ascii={
 window:[[208,281],[395,281],[395,432],[208,432]],
 lamp:[[598,286],[665,286],[689,350],[639,350],[639,583],[658,583],[666,599],[596,599],[604,583],[623,583],[623,350],[574,350]],
 computer:[[879,327],[1044,327],[1044,429],[978,429],[978,454],[937,454],[937,429],[879,429]],
 shelf:[[1250,365],[1433,365],[1433,590],[1250,590]],
 door:[[1241,699],[1361,699],[1361,839],[1241,839]]
};
const glitch={
 ...ascii,window:[[82,256],[477,256],[477,503],[82,503]],
 lamp:[[586,286],[662,286],[686,371],[633,371],[633,635],[658,635],[666,658],[582,658],[590,635],[615,635],[615,371],[560,371]]
};
const third={...glitch,window:[[83,264],[481,264],[481,512],[83,512]],
 lamp:[[583,280],[660,280],[682,359],[629,359],[629,613],[650,613],[658,630],[579,630],[588,613],[615,613],[615,359],[558,359]],
 computer:[[852,305],[1065,305],[1065,420],[974,420],[974,439],[995,449],[925,449],[949,439],[949,420],[852,420]],
 shelf:[[1234,287],[1252,296],[1460,297],[1480,288],[1480,582],[1464,582],[1464,571],[1250,571],[1250,582],[1234,582]]
};
const restored={
 window:[[76,236],[518,236],[518,505],[76,505]],
 lamp:[[553,366],[610,366],[628,434],[590,438],[590,682],[608,684],[615,696],[604,703],[557,703],[546,695],[553,685],[574,682],[574,438],[536,432]],
 computer:[[727,391],[922,391],[922,502],[834,502],[834,515],[851,524],[794,524],[810,515],[810,502],[727,502]],
 shelf:[[1089,290],[1282,290],[1282,714],[1089,714]],door:[[1361,259],[1487,215],[1487,802],[1361,731]]
};
const entries=[['window','#entry-1'],['lamp','#entry-2'],['computer','#entry-3'],['door','#entry-4']];
export function mountWindowSelection(visual){
 const stage=visual.parentElement,canvas=document.createElement('canvas');canvas.width=1536;canvas.height=1024;canvas.className='prologue-selection';canvas.setAttribute('aria-hidden','true');visual.append(canvas);
 const ctx=canvas.getContext('2d'),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const src=visual.querySelector('.scene-image')?.getAttribute('src')||'',paths=src.includes('0_4.')?restored:src.includes('0_3.')?third:src.includes('0_0.')?ascii:src.includes('0_1.')?{...ascii,window:glitch.window}:glitch;
 const rings=entries.map(([name,id],index)=>{const points=paths[name],segments=points.map((a,i)=>{const b=points[(i+1)%points.length];return {a,b,length:Math.hypot(b[0]-a[0],b[1]-a[1])};});return {name,id,index,segments,total:segments.reduce((n,s)=>n+s.length,0),mix:0,phase:index*.17};});
 let raf=0,disposed=false,last=0;
 const point=(ring,t)=>{let distance=((t%1+1)%1)*ring.total;const seg=ring.segments.find(s=>{if(distance<=s.length)return true;distance-=s.length;return false;})||ring.segments.at(-1),f=distance/seg.length;return {x:seg.a[0]+(seg.b[0]-seg.a[0])*f,y:seg.a[1]+(seg.b[1]-seg.a[1])*f,dx:(seg.b[0]-seg.a[0])/seg.length,dy:(seg.b[1]-seg.a[1])/seg.length};};
 function frame(now){if(disposed)return;raf=requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.05);last=now;ctx.clearRect(0,0,1536,1024);canvas.dataset.selected='false';
  if(document.hidden)return;
  const assembly=stage.querySelector('.prologue-assembly'),enabled=[];let hovered='';
  for(const ring of rings){
   const button=ring.name==='door'?(stage.querySelector('#entry-4')?.hidden?stage.querySelector('#exit'):stage.querySelector('#entry-4')):stage.querySelector(ring.id),visible=!assembly||assembly.dataset.assembled?.split(',').includes(ring.name);
   if(!button||button.disabled||button.hidden||!visible){ring.mix=0;canvas.dataset[ring.name+'Count']='0';continue;}
   const selected=button.matches(':hover')||button.matches(':focus-visible');ring.mix+=(Number(selected)-ring.mix)*(1-Math.exp(-dt*9));
   if(selected){hovered=ring.name;canvas.dataset.selected='true';}
   enabled.push(ring.name);
   if(ring.name==='window'){
    // Window-only trial: sparse, short-lived points attached to the contour.
    // Hover changes speed and luminance, never particle size or capacity.
    const capacity=54,t=reduced?0:now/1000;let visibleCount=0;
    if(!reduced)ring.phase+=dt*(12+26*ring.mix)/ring.total;
    for(let i=0;i<capacity;i++){
     const life=3.2+(i%5)*.25,age=reduced?.45:((t/life+i*.61803398875)%1),envelope=reduced?.65:Math.sin(Math.PI*age)**2;
     const alpha=envelope*(.32+.56*ring.mix);if(alpha<.035)continue;visibleCount++;
     const p=point(ring,i/capacity+ring.phase+age*36/ring.total),offset=3+Math.sin(i*2.17+t*.6)*1.2;
     const x=p.x-p.dy*offset,y=p.y+p.dx*offset,color=i%3===0?'194,242,246':'255,255,255';
     if(i%6===0){ctx.strokeStyle=`rgba(${color},${alpha*.4})`;ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(x-p.dx*3,y-p.dy*3);ctx.lineTo(x,y);ctx.stroke();}
     ctx.fillStyle=`rgba(${color},${alpha})`;ctx.beginPath();ctx.arc(x,y,.6+(i%3)*.08,0,Math.PI*2);ctx.fill();
    }
    canvas.dataset.windowCount=String(visibleCount);canvas.dataset.windowEmphasis=ring.mix.toFixed(3);canvas.dataset.windowStyle='sparse-contour-trial';continue;
   }
   const baseline=0,extra=128,count=extra;
   canvas.dataset[ring.name+'Count']=String(Math.round(baseline+extra*ring.mix));canvas.dataset[ring.name+'Emphasis']=ring.mix.toFixed(3);
   for(let i=0;i<count;i++){
    const fade=ring.mix;if(fade<.01)continue;
    const t=reduced?0:now/1000,p=point(ring,((i*.61803398875+ring.index*.13)%1)),spread=8+((i*37)%23);
    const dx=Math.sin(t*(.35+i%5*.05)+i*2.27)*8,dy=Math.sin(t*(.28+i%7*.04)+i*1.93)*12;
    const x=p.x-p.dy*spread+dx,y=p.y+p.dx*spread+dy,twinkle=reduced?.7:.55+.45*Math.sin(i*1.93-t*1.5+ring.index),alpha=(.5+.32*twinkle+.15*ring.mix)*fade;
    const size=1+(i%4)*.25;
    // Tiny white source-scaled points, with no colored halos or tails.
    ctx.fillStyle=`rgba(255,255,255,${alpha})`;ctx.fillRect(x-size/2,y-size/2,size,size);
   }
  }
  canvas.dataset.frame=String(now);canvas.dataset.target=hovered;canvas.dataset.enabled=enabled.join(',');
 }
 raf=requestAnimationFrame(frame);return()=>{disposed=true;cancelAnimationFrame(raf);canvas.remove();};
}
