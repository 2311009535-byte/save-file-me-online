// Modulate only the warm diagonal sunlight already painted on the paper.
// Desk, ink and the blue window-frame shadows are excluded from the matte.
export function createDiaryLight(visual){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),period=10000;let root=null,animations=[];
 function clear(){animations.forEach(a=>a.cancel());animations=[];root?.remove();root=null;}
 function show(){clear();if(reduced.matches)return;const image=visual.querySelector('.scene-image');if(!image?.complete)return;
  const source=document.createElement('canvas');source.width=1672;source.height=941;const ctx=source.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0,1672,941);const pixels=ctx.getImageData(0,0,1672,941);
  root=document.createElement('div');root.className='retry-diary-daylight';root.dataset.scope='paper-sunlight';root.setAttribute('aria-hidden','true');
  for(const kind of ['cloud','sun']){const layer=document.createElement('canvas');layer.width=1672;layer.height=941;layer.className='retry-diary-'+kind;const out=layer.getContext('2d').createImageData(1672,941);
   for(let y=45;y<866;y++)for(let x=180;x<1505;x++){
    if(x>807&&x<858)continue;const k=(y*1672+x)*4,r=pixels.data[k],g=pixels.data[k+1],b=pixels.data[k+2],warm=Math.max(0,Math.min(1,(r-b-13)/28)),paper=Math.max(0,Math.min(1,(Math.min(r,g,b)-100)/55));
    const edge=Math.min(1,(x-180)/10,(1505-x)/10,(y-45)/10,(866-y)/10);out.data[k]=kind==='cloud'?150:255;out.data[k+1]=kind==='cloud'?168:229;out.data[k+2]=kind==='cloud'?188:181;out.data[k+3]=Math.round(255*warm*paper*Math.max(0,edge));
   }
   layer.getContext('2d').putImageData(out,0,0);root.append(layer);
   const frames=kind==='cloud'?[{opacity:0},{offset:.5,opacity:.68},{opacity:0}]:[{opacity:.16},{offset:.5,opacity:0},{opacity:.16}];const a=layer.animate(frames,{duration:period,iterations:Infinity,easing:'ease-in-out'});a.currentTime=performance.now()%period;animations.push(a);
  }visual.append(root);
 }
 show();reduced.addEventListener('change',show);return{dispose(){reduced.removeEventListener('change',show);clear();}};
}
