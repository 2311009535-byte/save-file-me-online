const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export function createFinalFrontier(canvas,video){
 canvas.width=1920;canvas.height=1080;const ctx=canvas.getContext('2d'),still=document.createElement('canvas');still.width=1920;still.height=1080;const sw=video.videoWidth,sh=video.videoHeight,fit=Math.min(1920/sw,1080/sh);const snapshot=still.getContext('2d');snapshot.fillStyle='#030405';snapshot.fillRect(0,0,1920,1080);snapshot.drawImage(video,(1920-sw*fit)/2,(1080-sh*fit)/2,sw*fit,sh*fit);
 let disposed=false;
 function render(seconds){
  if(disposed)return;const travel=72*seconds,edges=[];
  function box(x,z,w,d,h){const q=[[x,0,z],[x+w,0,z],[x+w,h,z],[x,h,z],[x,0,z+d],[x+w,0,z+d],[x+w,h,z+d],[x,h,z+d]];for(const[a,b]of [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[2,6],[3,7]])edges.push([q[a],q[b]]);}
  // World coordinates stay fixed; only the camera moves. Recycle distant chunks.
  const first=Math.max(0,Math.floor(travel/730)-1);
  for(let i=first;i<first+15;i++){const z=450+i*730;box(-650-i%2*90,z,240,420,260+i%3*90);box(520+i%3*40,z+260,280,400,300+i%2*110);}
  const start=Math.floor(travel/330)*330;
  for(let z=start;z<start+11000;z+=330)edges.push([[-1700,0,z],[1700,0,z]]);
  for(let x=-1500;x<=1500;x+=300)edges.push([[x,0,travel+70],[x,0,travel+11000]]);
  ctx.globalAlpha=1;ctx.fillStyle='#030405';ctx.fillRect(0,0,1920,1080);
  const opacity=1-smooth((seconds-3)/5),scale=1+Math.min(seconds,8)*.045;
  if(opacity>0){ctx.save();ctx.globalAlpha=opacity;ctx.translate(1050,430);ctx.scale(scale,scale);ctx.drawImage(still,-1050,-430);ctx.restore();}
  ctx.strokeStyle='#ffffff';ctx.fillStyle='#ffffff';ctx.lineWidth=1.15;
  const strength=smooth((seconds-3)/5),project=([x,y,z])=>[1050+1000*x/(z-travel),430+1000*(130-y)/(z-travel),z-travel];
  edges.forEach(([a,b],index)=>{
   const near=travel+70;if(a[2]<near&&b[2]<near)return;
   if(a[2]<near){const u=(near-a[2])/(b[2]-a[2]);a=a.map((v,i)=>v+(b[i]-v)*u);}
   if(b[2]<near){const u=(near-b[2])/(a[2]-b[2]);b=b.map((v,i)=>v+(a[i]-v)*u);}
   const A=project(a),B=project(b),depth=(A[2]+B[2])/2;
   const growth=smooth((10500-depth)/2800)*smooth((seconds-3)/4);
   ctx.globalAlpha=strength*Math.pow(Math.max(0,1-depth/11000),2)*(index%4===0?.5:.3);
   ctx.beginPath();ctx.moveTo(A[0],A[1]);ctx.lineTo(A[0]+(B[0]-A[0])*growth,A[1]+(B[1]-A[1])*growth);ctx.stroke();
  });ctx.globalAlpha=1;canvas.dataset.progress=String(Math.min(1,seconds/12));canvas.dataset.cameraZ=travel.toFixed(2);canvas.dataset.edgeCount=String(edges.length);
 }
 return{render,dispose(){disposed=true;still.width=still.height=0;}};
}
