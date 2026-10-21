// The supplied window film was made from screenshots and contains a baked-in
// BACK label. Restore only that tiny wall patch, beside the real hidden UI.
export function mountWindowBackMask(host,source,{back=false}={}){
 const layer=document.createElement('canvas');layer.className='wonder-window-ui-mask';layer.setAttribute('aria-hidden','true');layer.width=source.videoWidth||source.naturalWidth||1910;layer.height=source.videoHeight||source.naturalHeight||1084;Object.assign(layer.style,{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:2});host.append(layer);const c=layer.getContext('2d');let alive=true,raf=0;
 function paint(){if(!alive)return;if(!(source.videoWidth||source.naturalWidth))return;const w=layer.width,h=layer.height;c.clearRect(0,0,w,h);c.drawImage(source,w*.948,h*.085,w*.052,h*.060,w*.948,h*.008,w*.052,h*.060);const film=source instanceof HTMLVideoElement,time=source.currentTime||0,duration=Number.isFinite(source.duration)?source.duration:5;if(!film||(back?time<.5:duration-time<.5))c.drawImage(source,w*.15,h*.980,w*.70,h*.012,w*.15,h*.916,w*.70,h*.061);if(source instanceof HTMLVideoElement&&!source.ended)raf=requestAnimationFrame(paint);}
 source.addEventListener('load',paint,{once:true});paint();return()=>{alive=false;source.removeEventListener('load',paint);cancelAnimationFrame(raf);layer.remove();};
}
