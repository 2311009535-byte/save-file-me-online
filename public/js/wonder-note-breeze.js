import {prepareImage} from './image-cache.js';
const paper=[[283,149],[523,126],[549,380],[308,409]];
export function mountNoteBreeze(visual){
 const layer=document.createElement('canvas');layer.width=825;layer.height=466;layer.className='wonder-note-breeze';layer.setAttribute('aria-hidden','true');Object.assign(layer.style,{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none'});visual.append(layer);const ctx=layer.getContext('2d');let alive=true,raf=0;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const shape=()=>{ctx.beginPath();paper.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();};
 prepareImage('/assets/wonder/1_7.jpg').then(image=>{if(!alive||reduced)return;function tick(now){if(!alive)return;const angle=(Math.sin(now/1400)*.004+Math.sin(now/2900)*.002);ctx.clearRect(0,0,825,466);ctx.save();shape();ctx.fillStyle='#424638';ctx.fill();ctx.restore();ctx.save();ctx.translate(407,140);ctx.rotate(angle);ctx.transform(1,0,Math.sin(now/1800)*.002,1,0,0);ctx.translate(-407,-140);shape();ctx.clip();ctx.drawImage(image,0,0);ctx.restore();ctx.drawImage(image,386,108,50,55,386,108,50,55);layer.dataset.angle=angle.toFixed(5);raf=requestAnimationFrame(tick);}raf=requestAnimationFrame(tick);}).catch(()=>{});
 return()=>{alive=false;cancelAnimationFrame(raf);layer.remove();};
}
