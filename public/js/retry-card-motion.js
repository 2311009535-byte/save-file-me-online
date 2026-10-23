// One owned preview animation also serves touch/click activation. Battle waits
// for it and the caller locks input immediately, preventing duplicate rounds.
export function createRetryCardMotion(card){
 let animation=null,pending=null,raised=false,disposed=false;
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 function reset(){animation?.cancel();animation=null;pending=null;raised=false;card.classList.remove('is-selected');card.dataset.cardMotion='idle';}
 function play(){
  if(disposed)return Promise.resolve(false);
  if(pending)return pending;
  if(raised)return Promise.resolve(true);
  card.classList.add('is-selected');card.dataset.cardMotion='turning';
  const a=card.animate(reduced()?[{opacity:1},{opacity:1}]:[
   {opacity:1,transform:'perspective(1000px) rotateY(0deg) translateY(0) scale(1)'},
   {offset:.66,opacity:1,transform:'perspective(1000px) rotateY(360deg) translateY(0) scale(1)'},
   {offset:.85,opacity:1,transform:'perspective(1000px) rotateY(360deg) translateY(-7%) scale(1.10)'},
   {opacity:1,transform:'perspective(1000px) rotateY(360deg) translateY(-3%) scale(1.065)'}
  ],{duration:reduced()?1:720,easing:'ease-in-out',fill:'forwards'});
  animation=a;
  pending=a.finished.then(()=>{if(disposed||animation!==a)return false;raised=true;card.dataset.cardMotion='raised';return true;},()=>false);
  return pending;
 }
 card.dataset.cardMotion='idle';
 return{play,reset,dispose(){disposed=true;reset();}};
}
