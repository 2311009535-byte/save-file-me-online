import {createWonderLoadingMotion} from './wonder-loading-motion.js';
import {prepareImage} from './image-cache.js';
// Native source pixels remain intact outside the progress strip.
export function createChapterLoading(host){
 let cancel=null;
 return {dispose(){cancel?.();},play(chapter,urls){
  cancel?.();
  return new Promise(resolve=>{
   let stopped=false,raf=0,loaded=0,elapsed=0,last=0,complete=0;
   const layer=document.createElement('div');layer.className='chapter-loading-art';layer.dataset.chapter=chapter;
   Object.assign(layer.style,{position:'absolute',inset:'0',zIndex:'6',background:chapter===4?'#f7f4ed':'#090b16',display:'grid',placeItems:'center'});
   const canvas=document.createElement('canvas');canvas.width=1672;canvas.height=941;Object.assign(canvas.style,{width:'100%',height:'100%',objectFit:'contain'});canvas.setAttribute('role','progressbar');canvas.setAttribute('aria-label','Loading chapter');canvas.setAttribute('aria-valuemin','0');canvas.setAttribute('aria-valuemax','100');layer.append(canvas);host.append(layer);
   const c=canvas.getContext('2d');let art,wonderMotion=null;
   const finish=ok=>{if(stopped)return;stopped=true;cancelAnimationFrame(raf);layer.remove();cancel=null;resolve(ok);};cancel=()=>finish(false);
   function render(p){
    c.drawImage(art,0,0,1672,941);if(wonderMotion)layer.dataset.archiveOpen=String(wonderMotion(c,p,elapsed));const w=chapter===3?488:chapter===4?398:370,x=chapter===3?590:chapter===4?637:652,y=chapter===3?547:chapter===4?548:548;
    if(chapter===3){
     // Remove the baked roll, then rebuild a connected torn strip and curling edge.
     c.drawImage(art,0,700,520,90,574,510,520,90);
     c.save();c.beginPath();c.moveTo(588,546);for(let i=0;i<=w;i+=8)c.lineTo(590+i,541+[0,3,-1,2][i/8%4]);c.lineTo(1085,585);for(let i=w;i>=0;i-=8)c.lineTo(590+i,584+[0,2,-2,1][Math.floor(i/8)%4]);c.closePath();c.clip();
     for(let t=0;t<w;t+=75)c.drawImage(art,970,552,75,25,590+t,540,75,48);
     c.save();c.beginPath();c.rect(590,538,w*p,53);c.clip();for(let t=0;t<w;t+=180)c.drawImage(art,610,551,180,25,590+t,548,180,33);c.restore();c.restore();
     if(p<1){const edge=x+w*p;c.save();c.translate(edge,561);c.rotate(-.22);c.shadowColor='#0007';c.shadowBlur=7;const g=c.createLinearGradient(-12,0,22,0);g.addColorStop(0,'#9a8674');g.addColorStop(.45,'#f4e7d5');g.addColorStop(1,'#c8b39c');c.fillStyle=g;c.beginPath();c.moveTo(-12,-22);c.quadraticCurveTo(18,-32,22,-13);c.lineTo(22,24);c.quadraticCurveTo(3,13,-12,26);c.closePath();c.fill();c.restore();}
    }else{
     c.fillStyle=chapter===4?'#faf7ef':'#090b18';c.fillRect(x,y,w,20);
     if(p>0){c.save();c.beginPath();c.rect(x,y,w*p,20);c.clip();if(chapter===4){for(let t=0;t<w;t+=100)c.drawImage(art,650,551,100,18,x+t,y,100,20);}else{const g=c.createLinearGradient(x,0,x+w,0);g.addColorStop(0,'#e9b3a7');g.addColorStop(1,'#ab6d92');c.fillStyle=g;c.fillRect(x,y,w,20);}c.restore();}
    }
    layer.dataset.progress=String(p);canvas.setAttribute('aria-valuenow',String(Math.round(p*100)));
   }
   async function attempt(){
    loaded=0;elapsed=0;last=0;complete=0;layer.querySelector('button')?.remove();
    try{
     art=await prepareImage(chapter===1?'/assets/wonder/1_0.png':`/assets/loading/chapter${chapter}.png`);if(stopped)return;
     wonderMotion=chapter===1?createWonderLoadingMotion(art):null;
     const min=chapter===3?2300:1800;
     const tick=now=>{if(stopped)return;if(last&&!document.hidden)elapsed+=Math.min(80,now-last);last=now;const p=Math.min(loaded/Math.max(1,urls.length),elapsed/min);render(p);if(p===1){complete+=16;if(complete>=180){finish(true);return;}}raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);
     await Promise.all(urls.map(async src=>{await prepareImage(src);loaded++;}));if(!urls.length)loaded=1;
    }catch{cancelAnimationFrame(raf);if(stopped)return;const retry=document.createElement('button');retry.textContent='LOAD FAILED — RETRY';Object.assign(retry.style,{position:'absolute',top:'69%',padding:'12px',font:'18px monospace',cursor:'pointer'});retry.onclick=attempt;layer.append(retry);}
   }
   attempt();
  });
 }};
}
