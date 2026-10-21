import {prepareImage} from './image-cache.js';
const W=1669,H=942;
export function mountClosedBox(visual){
 const root=document.createElement('div');root.className='wonder-box-lid';root.dataset.state='closed';root.dataset.source='room-closed-box-user.png';Object.assign(root.style,{position:'absolute',inset:0,zIndex:1,pointerEvents:'none'});visual.append(root);
 const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;Object.assign(canvas.style,{width:'100%',height:'100%',position:'absolute',inset:0});root.append(canvas);const ctx=canvas.getContext('2d');
 const ready=prepareImage('/assets/wonder/room-closed-box-user.png').then(image=>{if(!root.isConnected)return null;ctx.imageSmoothingEnabled=false;ctx.drawImage(image,1420,580,249,350,1420,580,249,350);return image;});
 return{ready,dispose(){root.remove();}};
}
