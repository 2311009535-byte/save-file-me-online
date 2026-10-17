
const token=typeof location==='undefined'?null:new URLSearchParams(location.search).get('embedded');
if(token&&window.parent!==window){
 document.documentElement.classList.add('embedded-forest');
 const style=document.createElement('style');
 style.textContent='.embedded-forest header,.embedded-forest #restart,.embedded-forest #original{display:none}.embedded-forest body[data-error=true] header{display:block}.embedded-forest footer{bottom:12px;font-size:12px}';
 document.head.append(style);
 const send=type=>parent.postMessage({type,token},location.origin);
 let announced=false;
 const observer=new MutationObserver(()=>{
  if(document.body.dataset.error==='true')send('forest-error');
  if(!announced&&document.body.dataset.ready==='true'){
   announced=true;send('forest-ready');
   document.querySelector('#scroll').focus({preventScroll:true});
  }
 });
 observer.observe(document.body,{attributes:true,attributeFilter:['data-ready','data-error']});
 function wheel(e){
  if(e.origin!==location.origin||e.source!==parent||e.data?.token!==token||e.data.type!=='forest-wheel')return;
  const scroll=document.querySelector('#scroll'),mode=e.data.deltaMode;
  const m=mode===1?24:mode===2?scroll.clientHeight:1;
  scroll.scrollTop+=Math.max(-1000,Math.min(1000,Number(e.data.deltaY)||0))*m;
 }
 window.addEventListener('message',wheel);
 window.addEventListener('pagehide',()=>{
  observer.disconnect();window.removeEventListener('message',wheel);
 },{once:true});
}
