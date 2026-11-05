const SEEN_KEY='save-file-me:room-help:v1';
export function createPrologueHints(visual,{eligible,box}){
 const root=document.createElement('div');root.className='prologue-help';root.setAttribute('role','status');root.setAttribute('aria-live','polite');
 const general=document.createElement('p'),local=document.createElement('p');general.className='prologue-help-general';local.className='prologue-help-local';root.append(general,local);visual.append(root);
 const center=Math.max(27,Math.min(73,(box[0]+box[2]/2)/1536*100));local.style.left=(center-25)+'%';local.style.top=Math.max(23,(box[1]-40)/1024*100)+'%';
 let seen=false,elapsed=0,idle=0,wasFormed=false;try{seen=sessionStorage.getItem(SEEN_KEY)==='seen';}catch{}
 const coarse=matchMedia('(pointer:coarse)').matches,reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
 function show(mode,text){root.dataset.mode=mode;general.hidden=mode==='stay'||mode==='click'||mode==='hidden';local.hidden=mode!=='stay'&&mode!=='click';const node=general.hidden?local:general;if(node.textContent!==text)node.textContent=text;}
 show('hidden','');
 return{
  update(dt,pointer,formed,blocked,touch=false){
   if(blocked){show('hidden','');return{pulse:0,near:false};}
   elapsed+=dt;idle+=dt;
   const [x,y,w,h]=box,inside=pointer&&pointer.x>=x-48&&pointer.x<=x+w+48&&pointer.y>=y-40&&pointer.y<=y+h+40,near=Boolean(pointer&&pointer.x>=x-72&&pointer.x<=x+w+72&&pointer.y>=y-64&&pointer.y<=y+h+64);
   if((inside&&!formed)||formed!==wasFormed)idle=0;wasFormed=formed;
   if(!seen&&elapsed>=8){seen=true;try{sessionStorage.setItem(SEEN_KEY,'seen');}catch{}}
   if(inside)show(formed?'click':'stay',formed?(coarse||touch?'Tap to explore':'Click to explore'):(coarse||touch?'Hold a little longer…':'Stay a little longer…'));
   else if(!seen)show('tutorial',coarse?'Touch and hold to let the room take shape.':'Move your cursor. Let the room take shape.');
   else if(idle>=12)show('idle',`Perhaps the ${eligible} holds a memory.`);
   else show('hidden','');
   const phase=(idle-12)%9,pulse=!reduced&&idle>=12&&phase<2.4?Math.sin(phase/2.4*Math.PI):0;
   root.dataset.target=eligible;
   return{pulse,near};
  },dispose(){root.remove();}
 };
}
