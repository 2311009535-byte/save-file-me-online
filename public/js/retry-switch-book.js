import {prepareImage} from './image-cache.js';
// Keep the video desk fixed; only a flexible paper sheet and ink move.
export function createSwitchBook(visual){
 const image=visual.querySelector('.scene-image'),leaf=document.createElement('canvas'),writing=document.createElement('canvas'),shadow=document.createElement('canvas'),paper=document.createElement('canvas');
 for(const c of [writing,shadow,leaf,paper]){c.width=1672;c.height=941;Object.assign(c.style,{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none'});}
 leaf.className='retry-switch-page';writing.className='retry-switch-writing';writing.setAttribute('aria-label','Diary entries');shadow.className='retry-switch-shadow';visual.append(writing,shadow,leaf);
 if(!document.getElementById('retry-soft-book-hint')){const style=document.createElement('style');style.id='retry-soft-book-hint';style.textContent='.retry-scene .retry-diary-glow path{stroke:#e1cda8!important;stroke-width:2.5!important;filter:none!important;animation:retry-soft-book 3.8s ease-in-out infinite!important}@keyframes retry-soft-book{0%,100%{opacity:.07}50%{opacity:.24}}@media(prefers-reduced-motion:reduce){.retry-scene .retry-diary-glow path{animation:none!important;opacity:.15!important}}';document.head.append(style);}
 const ctx=leaf.getContext('2d'),ink=writing.getContext('2d'),sc=shadow.getContext('2d'),light=paper.getContext('2d');
 const sx=1672/1918,sy=941/1080;
 const right=[[1459,552],[1863,609],[1874,1000],[1372,909]].map(([x,y])=>[x*sx,y*sy]);
 const left=[[1125,511],[1459,552],[1372,909],[949,843]].map(([x,y])=>[x*sx,y*sy]);
 let disposed=false,completed=false,raf=0,resolveTurn=null,pages=null,finalArt=null;
 const point=(q,u,v)=>{const top=q[0].map((a,i)=>a+(q[1][i]-a)*u),bottom=q[3].map((a,i)=>a+(q[2][i]-a)*u);return top.map((a,i)=>a+(bottom[i]-a)*v);};
 function triangle(context,texture,src,dst,shade=0){
  const [p,r,z]=src,[A,B,C]=dst,D=(r[0]-p[0])*(z[1]-p[1])-(z[0]-p[0])*(r[1]-p[1]);if(Math.abs(D)<.00001)return;
  const a=((B[0]-A[0])*(z[1]-p[1])-(C[0]-A[0])*(r[1]-p[1]))/D,b=((B[1]-A[1])*(z[1]-p[1])-(C[1]-A[1])*(r[1]-p[1]))/D,c=((C[0]-A[0])*(r[0]-p[0])-(B[0]-A[0])*(z[0]-p[0]))/D,d=((C[1]-A[1])*(r[0]-p[0])-(B[1]-A[1])*(z[0]-p[0]))/D;
  const center=[(A[0]+B[0]+C[0])/3,(A[1]+B[1]+C[1])/3];context.save();context.beginPath();dst.forEach(([x,y],i)=>{const dx=x-center[0],dy=y-center[1],n=Math.hypot(dx,dy)||1;context[i?'lineTo':'moveTo'](x+dx/n*.5,y+dy/n*.5);});context.closePath();context.clip();context.setTransform(a,b,c,d,A[0]-a*p[0]-c*p[1],A[1]-b*p[0]-d*p[1]);context.drawImage(texture,0,0);context.restore();
 }
 function quad(context,texture,source,target){triangle(context,texture,source.slice(0,3),target.slice(0,3));triangle(context,texture,[source[0],source[2],source[3]],[target[0],target[2],target[3]]);}
 async function prepare(){
  const art=await prepareImage('/assets/retry/3_14.png?desk-ink=1');if(disposed)return false;finalArt=art;
  const source=document.createElement('canvas');source.width=1672;source.height=941;const c=source.getContext('2d');c.drawImage(art,0,0,1672,941);
  const blur=document.createElement('canvas');blur.width=1672;blur.height=941;const bc=blur.getContext('2d');bc.filter='blur(3px)';bc.drawImage(source,0,0);
  const pixels=c.getImageData(0,0,1672,941),smooth=bc.getImageData(0,0,1672,941).data;
  for(let i=0;i<pixels.data.length;i+=4){const p=pixels.data,l=.3*p[i]+.59*p[i+1]+.11*p[i+2],mean=.3*smooth[i]+.59*smooth[i+1]+.11*smooth[i+2];p[i+3]=l<155?Math.round(255*Math.max(0,Math.min(1,(mean-l-12)/34))):0;p[i]=50;p[i+1]=51;p[i+2]=61;}c.putImageData(pixels,0,0);
  pages=document.createElement('canvas');pages.width=1672;pages.height=941;const pc=pages.getContext('2d');
  const sources=[[[987,459],[1250,488],[1182,746],[862,721]],[[1311,499],[1603,531],[1604,812],[1248,761]]];
  const targets=[left,right];
  sources.forEach((q,i)=>{const dst=targets[i];const a=i===0?.08:.15,b=i===0?.89:.94;const target=[point(dst,a,.06),point(dst,b,.06),point(dst,b,.93),point(dst,a,.93)];quad(pc,source,q,target);});
  return true;
 }
 function render(p){
  ctx.clearRect(0,0,1672,941);ink.clearRect(0,0,1672,941);sc.clearRect(0,0,1672,941);leaf.dataset.progress=String(p);
  // Writing on the next right page is exposed underneath the moving blank sheet.
  ink.save();ink.beginPath();right.forEach(([x,y],i)=>ink[i?'lineTo':'moveTo'](x,y));ink.closePath();ink.clip();ink.globalAlpha=Math.min(1,p/.12);ink.drawImage(pages,0,0);ink.restore();
  const n=36,angle=p*Math.PI,positions=[[0,0]];let x=0,z=0;
  light.clearRect(0,0,1672,941);light.drawImage(image,0,0,1672,941);
  const darkness=Math.sin(angle),gradient=light.createLinearGradient(1190,0,1660,0);
  gradient.addColorStop(0,'rgba(52,42,33,'+(.018*darkness)+')');gradient.addColorStop(.55,'rgba(52,42,33,'+(.065*darkness)+')');gradient.addColorStop(1,'rgba(52,42,33,'+(.025*darkness)+')');light.fillStyle=gradient;light.fillRect(0,0,1672,941);
  for(let i=0;i<n;i++){const u=(i+.5)/n,a=angle+.48*Math.sin(angle)*Math.sin(u*Math.PI);x+=Math.cos(a)/n;z+=Math.sin(a)/n;positions.push([x,z]);}
  const project=(i,v)=>{const [xx,zz]=positions[i],spine=point(right,0,v),edge=point(right,1,v),outer=point(left,0,v),mix=p*p*(3-2*p),width=(edge[0]-spine[0])*(1-mix)+(spine[0]-outer[0])*mix,dy=(edge[1]-spine[1])*(1-mix)+(spine[1]-outer[1])*mix;return[spine[0]+xx*width,spine[1]+xx*dy-zz*width*.48];};
  // A broad, low-opacity shadow follows the raised sheet and softens with height.
  sc.save();sc.filter='blur('+(3+12*darkness)+'px)';sc.fillStyle='rgba(43,33,24,'+(.13*darkness)+')';sc.beginPath();
  const footprint=(i,v)=>{const q=project(i,v),height=positions[i][1]*330;return[q[0]+height*.12,q[1]+height*.55+3*darkness];};
  for(let i=0;i<=n;i++){const q=footprint(i,0);sc[i?'lineTo':'moveTo'](...q);}for(let i=n;i>=0;i--)sc.lineTo(...footprint(i,1));sc.closePath();sc.fill();sc.restore();
  for(let i=0;i<n;i++)for(let j=0;j<2;j++){
   const u=i/n,U=(i+1)/n,v=j/2,V=(j+1)/2,uv=[[u,v],[U,v],[U,V],[u,V]],s=uv.map(([a,b])=>point(right,a,b)),t=[project(i,v),project(i+1,v),project(i+1,V),project(i,V)],shade=.09*Math.sin(angle);
   triangle(ctx,paper,s.slice(0,3),t.slice(0,3),shade);triangle(ctx,paper,[s[0],s[2],s[3]],[t[0],t[2],t[3]],shade);
   if(p>.5){const from=uv.map(([a,b])=>point(left,1-a,b));triangle(ctx,pages,from.slice(0,3),t.slice(0,3));triangle(ctx,pages,[from[0],from[2],from[3]],[t[0],t[2],t[3]]);}
  }
  // Let the sheet settle into the exact supplied photograph without a hard cut.
  const settle=Math.max(0,Math.min(1,(p-.88)/.12));if(settle){ink.save();ink.globalAlpha=settle*settle*(3-2*settle);ink.drawImage(finalArt,0,0,1672,941);ink.restore();}
 }
 return {async play(){if(!await prepare())return false;return new Promise(resolve=>{resolveTurn=resolve;const start=performance.now(),duration=matchMedia('(prefers-reduced-motion: reduce)').matches?150:1650;const tick=now=>{if(disposed)return;const t=Math.min(1,(now-start)/duration),p=t*t*(3-2*t);render(p);if(t<1)raf=requestAnimationFrame(tick);else{image.src=finalArt.src;image.closest('#stage')?.setAttribute('data-retry-frame','3_14.png');writing.remove();shadow.remove();leaf.remove();completed=true;resolveTurn=null;resolve(true);}};raf=requestAnimationFrame(tick);});},dispose(){disposed=true;cancelAnimationFrame(raf);leaf.remove();shadow.remove();if(!completed)writing.remove();resolveTurn?.(false);resolveTurn=null;}};
}
