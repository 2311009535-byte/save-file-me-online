// A short red-pencil annotation. It never captures focus or blocks the build.
export function createCreationSuccess(root){
 let timer=0,notice=null;
 function clear(){clearTimeout(timer);notice?.remove();notice=null;}
 return {show(message){clear();notice=document.createElement('div');notice.className='creation-success';notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 72 58');svg.setAttribute('aria-hidden','true');svg.innerHTML='<path pathLength="100" d="M8 31 Q16 36 25 49 Q42 19 65 7"/><path class="creation-success-echo" pathLength="100" d="M10 32 L25 46 Q45 17 63 9"/>';
  const words=document.createElement('span');words.textContent=message;notice.append(svg,words);root.append(notice);timer=setTimeout(clear,2800);
 },dispose:clear};
}
