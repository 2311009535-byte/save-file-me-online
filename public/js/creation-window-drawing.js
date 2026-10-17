// One opaque, continuously projected window layer; no image cross-fades.
export function drawWindow(context,progress){
 // Original 4_10/4_11 use a fixed bottom edge and vertical construction.
 // Keep the floor-facing width and position fixed; only grow along the room Z axis.
 const height=108*Math.max(0,Math.min(1,progress));
 const left=[734,402],right=[911,491];
 const corners=[[734,402-height],[911,491-height],right,left];
 const at=(u,v)=>corners[0].map((_,j)=>(1-v)*((1-u)*corners[0][j]+u*corners[1][j])+v*((1-u)*corners[3][j]+u*corners[2][j]));
 const trace=(points,close=false)=>{context.beginPath();points.forEach((p,i)=>{if(i===0)context.moveTo(...p);else context.lineTo(...p);});if(close)context.closePath();};
 context.lineJoin='round';context.lineCap='round';context.fillStyle='#f6f2e9';context.strokeStyle='#1212cf';context.lineWidth=2;
 trace(corners,true);context.fill();context.stroke();
 const outline=(u0,v0,u1,v1)=>{trace([at(u0,v0),at(u1,v0),at(u1,v1),at(u0,v1)],true);context.stroke();};
 outline(.025,.045,.975,.96);outline(.06,.10,.47,.91);outline(.53,.10,.94,.91);
 trace([at(.5,.05),at(.5,.96)]);context.stroke();
 if(height>30)for(const u of [.455,.545]){trace([at(u,.46),at(u,.57)]);context.stroke();}
 // Fixed slight irregularity preserves a pencil line instead of flickering noise.
 context.lineWidth=.7;for(const [u,v] of [[.06,.1],[.53,.1]]){const a=at(u,v),b=at(u+.39,v);trace([a,[(a[0]+b[0])/2+.6,(a[1]+b[1])/2-.5],b]);context.stroke();}
 const edge=[4,2];context.lineWidth=1.2;trace([corners[1],[corners[1][0]+edge[0],corners[1][1]+edge[1]],[corners[2][0]+edge[0],corners[2][1]+edge[1]],corners[2]]);context.stroke();
}
