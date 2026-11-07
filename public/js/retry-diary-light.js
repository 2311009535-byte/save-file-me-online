// Clouds change the strength of the sunlight already painted into the pages.
// A shared timeline phase survives page redraws; no new hard shadow is drawn.
export function createDiaryLight(visual){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),period=14000;let root=null,animations=[];
 function clear(){animations.forEach(a=>a.cancel());animations=[];root?.remove();root=null;}
 function show(){clear();if(reduced.matches)return;root=document.createElement('div');root.className='retry-diary-daylight';root.setAttribute('aria-hidden','true');
  for(const kind of ['cloud','sun']){const layer=document.createElement('div');layer.className='retry-diary-'+kind;root.append(layer);const frames=kind==='cloud'?[{opacity:0},{offset:.28,opacity:.1},{offset:.55,opacity:.23},{offset:.82,opacity:.08},{opacity:0}]:[{opacity:.12},{offset:.28,opacity:.06},{offset:.55,opacity:0},{offset:.82,opacity:.08},{opacity:.12}];const a=layer.animate(frames,{duration:period,iterations:Infinity,easing:'ease-in-out'});a.currentTime=performance.now()%period;animations.push(a);}
  visual.append(root);
 }
 show();reduced.addEventListener('change',show);return{dispose(){reduced.removeEventListener('change',show);clear();}};
}
