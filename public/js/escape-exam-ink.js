import {gameAudio} from './game-audio.js';
// Native exam.png coordinates; each pass follows the tilted red 58 at top right.
const strokes=[
 'M1438 268 Q1475 210 1557 178 Q1584 168 1562 212 Q1527 268 1452 286',
 'M1448 283 Q1508 271 1572 193 Q1580 173 1549 186 Q1476 227 1437 258',
 'M1431 244 Q1480 170 1539 156 Q1573 148 1546 187 Q1492 251 1438 282',
 'M1440 288 Q1505 293 1577 220 Q1590 204 1573 215 L1465 275',
 'M1443 262 L1566 183 L1453 279 L1555 205',
 'M1465 292 Q1440 255 1515 185 Q1559 157 1571 190 Q1577 225 1490 284',
 'M1436 273 L1553 193 L1447 258 L1563 230 L1467 289',
 'M1460 234 L1547 179 L1455 271 L1559 217 L1491 284',
 'M1473 277 Q1527 210 1550 196 L1472 260 L1557 232',
 'M1447 279 Q1495 297 1564 238 Q1603 215 1591 248 Q1555 281 1511 301'
];
export function mountExamInk({host,completed,onComplete,onState=()=>{}}){
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 1675 939');svg.setAttribute('preserveAspectRatio','none');svg.setAttribute('aria-hidden','true');svg.classList.add('escape-exam-ink');
 svg.innerHTML=strokes.map((d,i)=>`<path d="${d}" pathLength="1" fill="none" stroke="#070b0d" stroke-width="${[5.5,4,4.5,3.5,6,4,5,6.5,5,3.5][i]}" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
 host.append(svg);const paths=[...svg.children];paths.forEach(p=>{p.style.strokeDasharray='1';p.style.strokeDashoffset=completed?'0':'1';});
 let alive=true,playing=false,token=0;const animations=new Set();
 function cancel(){gameAudio.setPencil(false);token++;playing=false;animations.forEach(a=>a.cancel());animations.clear();onState(false);}
 return {
  async play(){if(!alive||completed||playing)return;playing=true;const run=++token;onState(true);gameAudio.setPencil(true);
   const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
   const results=await Promise.all(paths.map(async(p,i)=>{const a=p.animate([{strokeDashoffset:'1'},{strokeDashoffset:'0'}],{duration:reduced?1:145,delay:reduced?0:i*95,easing:'linear',fill:'both'});animations.add(a);try{await a.finished;return true;}catch{return false;}}));
   if(!alive||run!==token||!results.every(Boolean))return;
   completed=true;paths.forEach(p=>p.style.strokeDashoffset='0');cancel();onComplete();
  },cancel,
  dispose(){if(!alive)return;alive=false;cancel();svg.remove();}
 };
}
