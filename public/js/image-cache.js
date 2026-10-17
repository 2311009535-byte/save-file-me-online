const prepared=new Map();
export function prepareImage(src){
 let image=prepared.get(src);if(!image){image=new Image();image.src=src;image.ready=image.decode().then(()=>image).catch(error=>{prepared.delete(src);throw error;});prepared.set(src,image);}
 return image.ready;
}
export function sceneImage(src){const image=prepared.get(src);if(image)return image;prepareImage(src).catch(()=>{});return prepared.get(src);}
export async function warmImages(urls){const queue=[...urls];await Promise.all([0,1].map(async()=>{while(queue.length){const src=queue.shift();try{await prepareImage(src);}catch{}}}));}
