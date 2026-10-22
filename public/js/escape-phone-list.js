// Original artwork supplied in wechat.zip; only its screen is mapped into the phone.
export const phoneListAsset='wechat.png';
// Corners of the screen in the supplied 1676×939 artwork, clockwise.
const source=[[671/1676,65/939],[1029/1676,65/939],[1040/1676,880/939],[642/1676,885/939]];
const target=[[.398,.063],[.609,.061],[.612,.932],[.396,.932]];
function perspective(width,height){
 const rows=[];
 source.forEach(([sx,sy],i)=>{const x=sx*width,y=sy*height,u=target[i][0]*width,v=target[i][1]*height;rows.push([x,y,1,0,0,0,-u*x,-u*y,u],[0,0,0,x,y,1,-v*x,-v*y,v]);});
 for(let i=0;i<8;i++){let pivot=i;for(let j=i+1;j<8;j++)if(Math.abs(rows[j][i])>Math.abs(rows[pivot][i]))pivot=j;[rows[i],rows[pivot]]=[rows[pivot],rows[i]];const value=rows[i][i];for(let k=i;k<9;k++)rows[i][k]/=value;for(let j=0;j<8;j++){if(j===i)continue;const factor=rows[j][i];for(let k=i;k<9;k++)rows[j][k]-=factor*rows[i][k];}}
 const [a,b,c,d,e,f,g,h]=rows.map(r=>r[8]);return `matrix3d(${a},${d},0,${g},${b},${e},0,${h},0,0,1,0,${c},${f},0,1)`;
}
export function mountPhoneList(host,{fade=false,onReady=()=>{}}={}){
 if(!phoneListAsset)return null;
 const image=document.createElement('img');image.className='escape-wechat-screen';image.src='/assets/escape/'+phoneListAsset;image.alt='WeChat chat list';image.draggable=false;host.append(image);
 const align=()=>{if(host.clientWidth&&host.clientHeight)image.style.transform=perspective(host.clientWidth,host.clientHeight);};align();const observer=new ResizeObserver(align);observer.observe(host);
 let alive=true,animation=null;
 image.decode().then(async()=>{if(!alive)return;align();image.style.visibility='visible';if(fade){animation=image.animate([{opacity:0},{opacity:1}],{duration:180,easing:'ease-out'});try{await animation.finished;}catch{return;}}if(alive){image.dataset.ready='true';onReady();}}).catch(()=>{});
 return ()=>{alive=false;observer.disconnect();animation?.cancel();image.remove();};
}
