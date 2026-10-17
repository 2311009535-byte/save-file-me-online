// Persistent display history only; these strings are never executed.
export function createCodeAnimation(element){
 const storageKey='save-file-me:creation-code:v1';let entries=[];
 try{const saved=JSON.parse(localStorage.getItem(storageKey));if(Array.isArray(saved))entries=saved.filter(e=>typeof e.key==='string'&&Array.isArray(e.lines)&&e.lines.every(l=>typeof l==='string')).slice(-100);}catch{}
 let frame=null,version=0;
 const format=()=>entries.flatMap(e=>e.lines).map((line,i)=>`${String(i+1).padStart(2,' ')}  ${line}`).join('\n');
 function paint(text){element.textContent=text;element.scrollTop=element.scrollHeight;}
 function stop(){version++;cancelAnimationFrame(frame);frame=null;}
 function append(key,lines){
  stop();const before=format();if(entries.some(e=>e.key===key)){paint(before);element.dataset.typing='false';return;}
  entries.push({key,lines});try{localStorage.setItem(storageKey,JSON.stringify(entries));}catch{}
  const text=format(),token=version;paint(before);element.dataset.typing='true';
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){paint(text);element.dataset.typing='false';return;}
  const start=performance.now();let shown=-1;
  function tick(now){if(token!==version)return;const count=Math.min(text.length,before.length+Math.floor((now-start)/14));if(count!==shown){paint(text.slice(0,count));shown=count;}if(count<text.length)frame=requestAnimationFrame(tick);else{element.dataset.typing='false';frame=null;}}
  frame=requestAnimationFrame(tick);
 }
 function reset(){stop();entries=[];try{localStorage.removeItem(storageKey);}catch{}paint('');}
 return {append,stop,reset,hasHistory:()=>entries.length>0};
}
