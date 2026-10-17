// Future hand tracker feeds normalized {x,y} (0..1) into this shared adapter.
// Index finger -> move; pinch start -> grab; sustained pinch -> hold;
// upward pinch movement -> lift; pinch end -> release (+click for a short pinch).
export class NarrativeInput extends EventTarget{
 constructor(){super();this.source='unconnected';this.stream=null;this.status='not-started';this.cameraPending=null;this.cameraEpoch=0;}
 emit(type,detail={}){if(!['click','grab','move','release','lift','hold'].includes(type))throw Error('Unknown input event');this.dispatchEvent(new CustomEvent(type,{detail:{...detail,source:this.source}}));}
 connectHandTracker(tracker){this.source='camera-hand';return tracker.subscribe((type,detail)=>this.emit(type,detail));}
 async startCamera(video){
  if(!navigator.mediaDevices?.getUserMedia)throw Error('Camera unavailable. Use HTTPS or localhost.');
  const epoch=this.cameraEpoch;
  if(!this.stream?.getVideoTracks().some(t=>t.readyState==='live')){
   if(!this.cameraPending){
    const pending=navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:640},height:{ideal:480},frameRate:{ideal:24,max:30}},audio:false}).then(stream=>{
     if(epoch!==this.cameraEpoch){stream.getTracks().forEach(t=>t.stop());throw Error('Camera request cancelled');}
     this.stream=stream;return stream;
    });
    this.cameraPending=pending;
    pending.finally(()=>{if(this.cameraPending===pending)this.cameraPending=null;}).catch(()=>{});
   }
   await this.cameraPending;
  }
  if(epoch!==this.cameraEpoch)throw Error('Camera request cancelled');
  video.srcObject=this.stream;await video.play();this.status='preview-only';
 }
 stopCamera(){this.cameraEpoch++;this.cameraPending=null;this.stream?.getTracks().forEach(t=>t.stop());this.stream=null;this.status='not-started';}
}
export const input=new NarrativeInput();
