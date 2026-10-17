// One activation per visit. Time comes from detector results, so a stalled
// camera cannot silently complete a dwell using an independent UI timer.
export class DwellSelection{
 constructor(duration=1500){this.duration=duration;this.reset();}
 reset(){this.target=null;this.since=0;this.last=0;this.fired=false;}
 update(target,time,allowed=true){
  if(!allowed||!target){this.reset();return {progress:0,activate:false};}
  if(target!==this.target||time-this.last>350){this.target=target;this.since=time;this.fired=false;}
  this.last=time;
  const progress=Math.min(1,(time-this.since)/this.duration);
  const activate=progress===1&&!this.fired; if(activate)this.fired=true;
  return {progress,activate};
 }
}
