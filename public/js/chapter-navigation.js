export const navigationScenes=[['prologue','PROLOGUE'],['chapter1','01 · WONDER'],['chapter2','02 · ESCAPE'],['chapter3','03 · RETRY'],['chapter4','04 · CREATION'],['final','FINAL']];
export function mountChapterNavigation(onNavigate){
 const root=document.createElement('nav');root.className='chapter-navigation';root.setAttribute('aria-label','Chapter navigation');
 const toggle=document.createElement('button');toggle.type='button';toggle.className='chapter-navigation-toggle';toggle.textContent='CHAPTERS';toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls','chapter-navigation-links');
 const links=document.createElement('div');links.id='chapter-navigation-links';links.hidden=true;
 function close(){links.hidden=true;toggle.setAttribute('aria-expanded','false');}
 for(const[scene,label]of navigationScenes){const b=document.createElement('button');b.type='button';b.dataset.navigate=scene;b.textContent=label;b.onclick=()=>{close();toggle.focus();onNavigate(scene);};links.append(b);}
 toggle.onclick=()=>{links.hidden=!links.hidden;toggle.setAttribute('aria-expanded',String(!links.hidden));};root.append(toggle,links);document.body.append(root);
 const outside=e=>{if(!root.contains(e.target))close();},key=e=>{if(e.key==='Escape'&&!links.hidden){close();toggle.focus();e.stopImmediatePropagation();}};
 document.addEventListener('pointerdown',outside);document.addEventListener('keydown',key,true);
 return{update(scene){links.querySelectorAll('button').forEach(b=>{if(b.dataset.navigate===scene)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});},dispose(){root.remove();document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',key,true);}};
}
