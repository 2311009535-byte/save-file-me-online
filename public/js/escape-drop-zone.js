// Normalized room coordinates: head, shoulders and back, with a small margin.
// The same polygon is used for both the visible receiver and overlap detection.
export const receiveZone=Object.freeze([
 [.465,.235],[.540,.237],[.578,.300],[.593,.390],[.573,.480],
 [.532,.528],[.464,.500],[.423,.415],[.425,.315]
].map(p=>Object.freeze(p)));
export const receiveZonePoints=receiveZone.map(([x,y])=>`${x*100},${y*100}`).join(' ');
const cross=(a,b)=>a[0]*b[1]-a[1]*b[0];
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1]];
export function paperOverlap(rect){
 if(!(rect.w>0&&rect.h>0))return 0;
 let clipped=[[rect.x,rect.y],[rect.x+rect.w,rect.y],[rect.x+rect.w,rect.y+rect.h],[rect.x,rect.y+rect.h]];
 for(let i=0;i<receiveZone.length&&clipped.length;i++){
  const a=receiveZone[i],b=receiveZone[(i+1)%receiveZone.length],edge=sub(b,a),input=clipped;clipped=[];
  const inside=p=>cross(edge,sub(p,a))>=-1e-12;
  const intersect=(s,e)=>{const delta=sub(e,s),t=cross(edge,sub(a,s))/cross(edge,delta);return [s[0]+delta[0]*t,s[1]+delta[1]*t];};
  let previous=input[input.length-1];
  for(const current of input){if(inside(current)){if(!inside(previous))clipped.push(intersect(previous,current));clipped.push(current);}else if(inside(previous))clipped.push(intersect(previous,current));previous=current;}
 }
 const area=Math.abs(clipped.reduce((sum,p,i)=>{const q=clipped[(i+1)%clipped.length];return sum+p[0]*q[1]-q[0]*p[1];},0))/2;
 return Math.min(1,area/(rect.w*rect.h));
}
export const canReceivePaper=rect=>paperOverlap(rect)>=.12;
