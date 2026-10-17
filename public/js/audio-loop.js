export function musicLoop(ctx,buffer,start=0){
 const rate=buffer.sampleRate,step=Math.max(1,Math.round(rate*.05)),mono=buffer.getChannelData(0);
 const audible=at=>{
  let energy=0;
  const end=Math.min(buffer.length,at+step);
  for(let i=at;i<end;i++)energy+=mono[i]*mono[i];
  return Math.sqrt(energy/Math.max(1,end-at))>.003;
 };
 let first=Math.max(0,Math.floor(start*rate)),last=buffer.length;
 while(first+step<last&&!audible(first))first+=step;
 while(last-step>first&&!audible(last-step))last-=step;
 if(last-first<rate){first=Math.max(0,Math.floor(start*rate));last=buffer.length;}
 const overlap=Math.min(Math.floor(rate*2.5),Math.floor((last-first)*.15));
 const out=ctx.createBuffer(buffer.numberOfChannels,last-first-overlap,rate);
 for(let c=0;c<buffer.numberOfChannels;c++){
  const src=buffer.getChannelData(c),dst=out.getChannelData(c);
  dst.set(src.subarray(first+overlap,last));
  for(let i=0;i<overlap;i++){
   const t=i/Math.max(1,overlap-1)*Math.PI/2;
   dst[dst.length-overlap+i]=src[last-overlap+i]*Math.cos(t)+src[first+i]*Math.sin(t);
  }
 }
 return out;
}
