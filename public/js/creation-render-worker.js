// Color conversion happens off the game/model thread. Original files stay intact.
self.onmessage=({data:{id,buffer}})=>{
 const pixels=new Uint8ClampedArray(buffer);
 for(let i=0;i<pixels.length;i+=4){
  if(pixels[i]>160&&pixels[i+1]>140&&Math.min(pixels[i],pixels[i+1])-pixels[i+2]>25)continue;
  const ink=Math.max(0,Math.min(1,(pixels[i+2]-(pixels[i]+pixels[i+1])/2)/200));
  // Shared 4_4 paper and blue; preserve antialiasing and pale construction lines.
  const light=ink<=.3,t=light?ink/.3:(ink-.3)/.7;
  pixels[i]=(light?246:160)+((light?160:18)-(light?246:160))*t;
  pixels[i+1]=(light?242:203)+((light?203:18)-(light?242:203))*t;
  pixels[i+2]=(light?233:232)+((light?232:207)-(light?233:232))*t;
 }
 self.postMessage({id,buffer},[buffer]);
};
