// Card pixels and their positions come from the actual supplied video ending.
export const phoneCardRects=[[.411,.264,.195,.155],[.407,.417,.199,.159]];
export function createNativePhone(){
 let frame=null,background=null,cards=[],owned=null,abort=null,disposed=false;
 const wait=(v,event,ready)=>ready()?Promise.resolve(true):new Promise(resolve=>{let timer;const done=ok=>{clearTimeout(timer);v.removeEventListener(event,yes);v.removeEventListener('error',no);abort=null;resolve(ok&&!disposed);};const yes=()=>done(true),no=()=>done(false);abort=no;v.addEventListener(event,yes,{once:true});v.addEventListener('error',no,{once:true});timer=setTimeout(no,15000);});
 return {
  async prepare(source){
   if(frame)return true;if(disposed)return false;
   let video=source;
   if(!video||!video.src.endsWith('phone_enter.mp4')||video.readyState<2||video.currentTime<3.8){owned=document.createElement('video');video=owned;video.muted=true;video.playsInline=true;video.preload='auto';video.src='/assets/escape/videos/phone_enter.mp4';video.load();if(!await wait(video,'loadeddata',()=>video.readyState>=2))return false;video.currentTime=Math.max(0,video.duration-.1);if(!await wait(video,'seeked',()=>!video.seeking&&video.readyState>=2))return false;}
   if(disposed)return false;frame=document.createElement('canvas');frame.width=video.videoWidth;frame.height=video.videoHeight;frame.getContext('2d').drawImage(video,0,0);
   background=document.createElement('canvas');background.width=frame.width;background.height=frame.height;const c=background.getContext('2d');c.drawImage(frame,0,0);
   for(const [x,y,w,h] of phoneCardRects){const card=document.createElement('canvas');card.width=Math.round(w*frame.width);card.height=Math.round(h*frame.height);card.getContext('2d').drawImage(frame,x*frame.width,y*frame.height,w*frame.width,h*frame.height,0,0,card.width,card.height);cards.push(card.toDataURL());}
   // Reconstruct only the flat screen beneath the removable notification cards.
   const sample=(x,y)=>{const p=c.getImageData(Math.round(x*frame.width),Math.round(y*frame.height),1,1).data;return `rgb(${p[0]},${p[1]},${p[2]})`;};const g=c.createLinearGradient(.41*frame.width,0,.61*frame.width,0);g.addColorStop(0,sample(.415,.64));g.addColorStop(1,sample(.60,.64));c.fillStyle=g;c.fillRect(.405*frame.width,.262*frame.height,.204*frame.width,.317*frame.height);
   if(owned){owned.removeAttribute('src');owned.load();owned=null;}return true;
  },background(){return background;},card(index){return cards[index];},
  dispose(){disposed=true;abort?.();if(owned){owned.pause();owned.removeAttribute('src');owned.load();owned=null;}frame=null;background=null;cards=[];}
 };
}
