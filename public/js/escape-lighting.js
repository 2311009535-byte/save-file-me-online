export const roomDarkness=(count,total)=>total>0?.56*Math.min(total,Math.max(0,count))/total:0;
export function mountSceneDimming(video,host,darkness){
 const before=video.style.filter;video.style.filter=darkness>0?`brightness(${1-darkness})`:'';host.dataset.sceneDarkness=String(darkness);
 return ()=>{video.style.filter=before;delete host.dataset.sceneDarkness;};
}
