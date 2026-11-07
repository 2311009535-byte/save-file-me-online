// Extend the original clip at its defeated-Boss beat, before the baked-in
// victory card. The native video resumes afterwards; it is never substituted.
export function createVictoryAfterglow(visual){
 let root=null,timer=null,resolveHold=null,disposed=false;const animations=new Set(),NS='http://www.w3.org/2000/svg';
 const el=(tag,attrs={})=>{const n=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,v);return n;};
 function clear(){clearTimeout(timer);timer=null;resolveHold?.(false);resolveHold=null;for(const a of animations)a.cancel();animations.clear();root?.remove();root=null;}
 function motion(node,frames,options){const a=node.animate(frames,{fill:'forwards',easing:'ease-in-out',...options});animations.add(a);return a;}
 return{async play(){
  clear();if(disposed)return false;
  root=document.createElement('div');root.className='retry-victory-afterglow';root.dataset.phase='release';root.dataset.startedAt=String(performance.now());root.setAttribute('aria-hidden','true');visual.append(root);
  const svg=el('svg',{viewBox:'0 0 1672 941',preserveAspectRatio:'none'});root.append(svg);
  const defs=el('defs'),filter=el('filter',{id:'victory-paper-grain',x:'-35%',y:'-50%',width:'170%',height:'200%'});filter.append(el('feTurbulence',{type:'fractalNoise',baseFrequency:'.035',numOctaves:'2',seed:'9',result:'grain'}),el('feDisplacementMap',{in:'SourceGraphic',in2:'grain',scale:'13',xChannelSelector:'R',yChannelSelector:'G'}));defs.append(filter);svg.append(defs);
  const light=el('g',{'data-victory-light':'warm',fill:'#ffe8b5'});svg.append(light);
  for(const points of ['1200,-80 1340,-80 550,941 320,941','1400,-80 1500,-80 1000,941 720,941','1530,-80 1672,-80 1550,941 1230,941'])light.append(el('polygon',{points}));
  light.style.mixBlendMode='soft-light';motion(light,[{opacity:0},{offset:.22,opacity:0},{offset:.72,opacity:.24},{opacity:.17}],{duration:5000});
  const wash=document.createElement('div');wash.className='retry-victory-warmth';root.append(wash);motion(wash,[{opacity:0},{offset:.2,opacity:0},{opacity:.36}],{duration:5000});
  const smoke=el('g',{'data-victory-smoke':'paper',filter:'url(#victory-paper-grain)'});svg.append(smoke);
  for(let i=0;i<7;i++){
   const x=680+i*95,y=205+(i%3)*58,p=el('path',{d:`M${x-120},${y+25} l38,-29 37,11 35,-25 53,18 47,-9 45,33 -42,18 -58,-7 -50,20 -59,-12 -43,10 Z`,fill:i%2?'#4d4540':'#292625'});smoke.append(p);
   motion(p,[{opacity:0,transform:'translate(0px,0px)'},{offset:.12,opacity:.23},{offset:.48,opacity:.1},{opacity:0,transform:`translate(${-90-i*20}px,${-90-i*12}px) rotate(${-3+i}deg)`}],{duration:4200+i*90});
  }
  for(let i=0;i<32;i++){
   const x=740+(i*83%760),y=160+(i*47%300),p=el('path',{d:`M${x},${y} l${3+i%5},-3 5,4 -4,6 -5,-2 Z`,fill:i%3?'#403a34':'#c7bca6'});svg.append(p);
   motion(p,[{opacity:0,transform:'translate(0px,0px)'},{offset:.13,opacity:.58},{opacity:0,transform:`translate(${-35-i%7*14}px,${-70-i%9*16}px) rotate(${i%2?75:-65}deg)`}],{duration:3000+i%7*220,delay:i%5*100});
  }
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduced){for(const a of animations)a.finish();}
  const done=await new Promise(resolve=>{resolveHold=resolve;timer=setTimeout(()=>{resolveHold=null;timer=null;resolve(true);},reduced?700:5000);});
  if(!done||disposed||!root)return false;
  root.dataset.phase='settle';const fading=root;motion(fading,[{opacity:1},{opacity:0}],{duration:reduced?150:2000}).finished.then(()=>{fading.remove();if(root===fading)root=null;},()=>{});return true;
 },dispose(){disposed=true;clear();}};
}
