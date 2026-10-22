// A fixed night-time exposure; collecting homework only adds wall marks.
export const ROOM_DARKNESS=.46;
export function mountSceneDimming(video,host,darkness){
 const before=video.style.filter;video.style.filter=darkness>0?`brightness(${1-darkness})`:'';host.dataset.sceneDarkness=String(darkness);
 return ()=>{video.style.filter=before;delete host.dataset.sceneDarkness;};
}
