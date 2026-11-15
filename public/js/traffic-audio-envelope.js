// A passing vehicle approaches from silence, peaks nearby, then recedes.
// Zero slope at both ends avoids an audible step at the light boundaries.
export function trafficAudioLevel(phase){
 const p=Math.max(0,Math.min(1,Number.isFinite(phase)?phase:0));
 return Math.sin(Math.PI*p)**2;
}
