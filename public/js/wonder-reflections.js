export const wonderReflections={
 window:{text:'Games made me wonder what lay beyond my room.',duration:6000},
 map:{text:'My room was small. The worlds I explored were not.',duration:7000},
 note:{text:'I wanted to know what lay beyond the hill behind our school.',duration:8000},
 box:{text:'A cardboard box could hold a thousand adventures.',duration:6000}
};
export function createWonderReflections(stage,{canRead,onReturn}){
 let panel=null,raf=0,current=null,elapsed=0,last=null;
 function cancel(){cancelAnimationFrame(raf);panel?.remove();panel=null;current=null;last=null;elapsed=0;}
 function start(id){if(current===id)return;cancel();const copy=wonderReflections[id];if(!copy)return;current=id;panel=document.createElement('p');panel.className='wonder-reflection';panel.dataset.object=id;panel.textContent=copy.text;panel.setAttribute('role','status');Object.assign(panel.style,{position:'absolute',left:'12%',bottom:'3%',width:'76%',margin:0,padding:'14px 22px',zIndex:4,color:'#f9edd8',background:'linear-gradient(90deg,transparent,rgba(9,12,17,.82) 18%,rgba(9,12,17,.82) 82%,transparent)',font:'calc(22px * var(--scene-ui,1))/1.55 Georgia,serif',textAlign:'center',textWrap:'balance',textShadow:'0 2px 5px #000',pointerEvents:'none',opacity:0});stage.append(panel);
  function tick(now){if(!panel)return;const delta=last===null?0:Math.max(0,now-last);last=now;if(!document.hidden&&canRead(id))elapsed+=delta;const fadeIn=Math.min(1,elapsed/450),fadeOut=Math.min(1,Math.max(0,(copy.duration-elapsed)/500));panel.style.opacity=String(Math.min(fadeIn,fadeOut));panel.dataset.elapsed=String(Math.round(elapsed));if(elapsed>=copy.duration){cancel();onReturn(id);return;}raf=requestAnimationFrame(tick);}raf=requestAnimationFrame(tick);
 }
 const visibility=()=>{last=null;};document.addEventListener('visibilitychange',visibility);
 return{start,cancel,dispose(){cancel();document.removeEventListener('visibilitychange',visibility);}};
}
