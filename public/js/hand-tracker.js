import {input} from './input.js';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export const PINCH_CLOSE=.50,PINCH_OPEN=.75;
export const HAND_WORKSPACE={left:.08,width:.84,top:.08,height:.72};
export class PinchRecognizer{
 constructor(emit,onState=()=>{}){this.emit=emit;this.onState=onState;this.point=null;this.pinch=null;}
 cancel(){if(this.pinch&&this.point)this.emit('release',{...this.point,cancelled:true});this.pinch=null;this.point=null;this.onState({detected:false,pinching:false,ratio:null});}
 update(landmarks,time,aspect=1){
  if(!landmarks){this.cancel();return;}
  const raw={x:Math.max(0,Math.min(1,(1-landmarks[8].x-HAND_WORKSPACE.left)/HAND_WORKSPACE.width)),y:Math.max(0,Math.min(1,(landmarks[8].y-HAND_WORKSPACE.top)/HAND_WORKSPACE.height))};
  this.point=this.point?{x:this.point.x*.3+raw.x*.7,y:this.point.y*.3+raw.y*.7}:raw;
  // Landmarks x/y have different units on a wide camera frame. Convert both
  // to image-height units before normalizing by the observed palm size.
  const metric=(a,b)=>Math.hypot((a.x-b.x)*aspect,a.y-b.y);
  const palm=Math.max(metric(landmarks[5],landmarks[17]),metric(landmarks[0],landmarks[9])*.65,1e-6);
  const ratio=metric(landmarks[4],landmarks[8])/palm;
  if(!this.pinch&&ratio<=PINCH_CLOSE){this.pinch={start:{...this.point},time,moved:false};this.emit('grab',{...this.point,pinching:true});}
  else if(this.pinch&&ratio>=PINCH_OPEN){
   const click=!this.pinch.moved&&time-this.pinch.time<2500;
   this.pinch=null;this.emit('release',{...this.point,pinching:false,cancelled:false});
   if(click)this.emit('click',{...this.point});
  }
  this.emit('move',{...this.point,pinching:Boolean(this.pinch)});
  if(this.pinch){
   if(distance(this.point,this.pinch.start)>.10)this.pinch.moved=true;
   this.emit('hold',{...this.point,duration:time-this.pinch.time});
   if(this.pinch.start.y-this.point.y>.03)this.emit('lift',{...this.point,amount:this.pinch.start.y-this.point.y});
  }
  this.onState({detected:true,pinching:Boolean(this.pinch),ratio});
 }
}
let library;
function loadLibrary(){
 if(window.Hands)return Promise.resolve();
 if(!library)library=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='/vendor/mediapipe-hands/hands.js';s.onload=resolve;s.onerror=()=>{library=null;s.remove();reject(Error('Hand tracking failed to load. Switch to mouse mode if needed.'));};document.head.append(s);});
 return library;
}
export function createHandTracker(video,onEvent,onStatus,onState=()=>{}){
 let running=false,epoch=0,model=null,raf=null,seen=false;
 let lastResult=0,inferenceStart=0,processingMs=null,frequency=null;
 const recognizer=new PinchRecognizer(onEvent,state=>onState({...state,inferenceMs:processingMs,fps:frequency}));
 async function stop(releaseCamera=false){
  running=false;seen=false;epoch++;cancelAnimationFrame(raf);recognizer.cancel();const old=model;model=null;
  if(old)await old.close().catch(()=>{});if(releaseCamera)input.stopCamera();
 }
 async function start(){
  if(running)return;lastResult=0;processingMs=null;frequency=null;running=true;const current=++epoch;
  try{
   onStatus('Loading camera and hand tracking...');await input.startCamera(video);await loadLibrary();if(current!==epoch)return;
   const hands=new window.Hands({locateFile:file=>'/vendor/mediapipe-hands/'+file});model=hands;
   hands.setOptions({maxNumHands:1,modelComplexity:0,minDetectionConfidence:.6,minTrackingConfidence:.6});
   hands.onResults(results=>{
    if(!running||current!==epoch)return;
    const now=performance.now();processingMs=inferenceStart?now-inferenceStart:null;if(lastResult){const rate=1000/(now-lastResult);frequency=frequency==null?rate:frequency*.8+rate*.2;}lastResult=now;
    const landmarks=results.multiHandLandmarks?.[0];recognizer.update(landmarks,performance.now(),video.videoWidth/video.videoHeight||1);
    if(Boolean(landmarks)!==seen){seen=Boolean(landmarks);onStatus(seen?'Hand detected: move your index finger; dwell 1.5s to select or grab; pinch to lift.':'Place one hand in front of the camera with good lighting.');}
   });
   await hands.initialize();if(current!==epoch){await hands.close();return;}
   onStatus('Tracking ready. Place one hand in front of the camera.');
   let last=0;const inference=document.createElement('canvas'),context=inference.getContext('2d');
   const frame=async time=>{
    if(!running||current!==epoch)return;
    try{if(time-last>=50&&video.readyState>=2){last=time;const aspect=video.videoWidth/video.videoHeight||4/3;const inferenceHeight=Math.round(480/aspect);if(inference.width!==480||inference.height!==inferenceHeight){inference.width=480;inference.height=inferenceHeight;}context.drawImage(video,0,0,inference.width,inference.height);inferenceStart=performance.now();await hands.send({image:inference});}}
    catch{if(current===epoch){await stop();onStatus('Tracking temporarily failed. Retry or switch to mouse mode.');}return;}
    if(running&&current===epoch)raf=requestAnimationFrame(frame);
   };
   raf=requestAnimationFrame(frame);
  }catch(e){if(current===epoch){await stop();onStatus('Unable to enable hands: '+e.message+' Switch to mouse mode if needed.');}}
 }
 return {start,stop,get running(){return running;}};
}
