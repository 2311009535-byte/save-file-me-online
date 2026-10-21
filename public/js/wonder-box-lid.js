import {prepareImage} from './image-cache.js';
const W=1669,H=942;
const A=[1468,675],B=[1605,645],C=[1669,663],D=[1576,708];
export function mountClosedBox(visual){
 const root=document.createElement('div');root.className='wonder-box-lid';root.dataset.state='closed';Object.assign(root.style,{position:'absolute',inset:0,zIndex:1,pointerEvents:'none'});visual.append(root);
 const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;Object.assign(canvas.style,{width:'100%',height:'100%',position:'absolute',inset:0});root.append(canvas);const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
 const ready=prepareImage('/assets/wonder/room-closed-box.png').then(image=>{if(!root.isConnected)return null;ctx.clearRect(0,0,W,H);ctx.drawImage(image,1420,580,249,350,1420,580,249,350);return image;});
 const hint=document.createElement('canvas');hint.width=W;hint.height=H;hint.className='contour-light';hint.dataset.object='box';Object.assign(hint.style,{zIndex:3,filter:'none'});const hc=hint.getContext('2d');hc.strokeStyle='rgba(255,242,210,.75)';hc.lineWidth=2;
 function edge(points){hc.beginPath();points.forEach((p,i)=>i?hc.lineTo(...p):hc.moveTo(...p));hc.stroke();}
 edge([A,B,C,[1669,897],[1576,913],[1468,873],A]);edge([A,D,[1669,689]]);edge([D,[1576,913]]);visual.append(hint);
 return{ready,dispose(){root.remove();hint.remove();}};
}
