import {input} from './input.js';
let avatarURL=null,chosen=false,inFlight=null;
const AVATAR_CACHE='save-file-me:generated-avatar:v1';
try{const saved=sessionStorage.getItem(AVATAR_CACHE);if(saved?.startsWith('data:image/png;base64,')&&saved.length<14000000){avatarURL=saved;chosen=true;}}catch{}

export function mountAvatar(root,{onContinue=null,generationAllowed=true}={}){
 root.classList.add('creation-avatar-scene');
 const area=document.createElement('section');area.className='avatar-setup';area.setAttribute('aria-label','Personal avatar');
 area.innerHTML=`<h1>PLAYER 01 · YOUR AVATAR</h1><p>Take a photo to create a hand-drawn avatar before building.</p>
 <video id="avatar-camera" muted playsinline hidden></video><img id="avatar-photo" alt="Photo preview, stored temporarily on this page only" hidden>
 <p id="avatar-status" role="status" aria-live="polite">Enable the camera to take a photo, or use the default avatar.</p>
 <p id="avatar-notice" hidden>After confirmation, your photo is sent to AI to generate an avatar. Original photos are not permanently saved.</p>
 <div class="avatar-buttons"><button id="avatar-start">ENABLE CAMERA</button><button id="avatar-take" hidden>TAKE PHOTO</button><button id="avatar-retake" hidden>RETAKE</button><button id="avatar-use" hidden>USE PHOTO</button><button id="avatar-retry" hidden>RETRY</button><button id="avatar-default">USE DEFAULT AVATAR</button><button id="avatar-change" hidden>CHANGE AVATAR</button></div>
 <p class="avatar-note">Prepare your avatar, then start building.</p>`;
 const portrait=document.createElement('div');portrait.className='creation-portrait';portrait.setAttribute('aria-label','PLAYER 01 AVATAR');
 root.append(area,portrait);
 let alive=true,photo=null,photoURL=null,requestId=null,enabled=false,cameraBusy=false,attemptsRemaining=null;let waitTimer=0,waitStarted=0;let available;const availability=new Promise(resolve=>available=resolve);
 const $=id=>area.querySelector('#avatar-'+id);
 if(onContinue){const b=document.createElement('button');b.id='avatar-continue';b.textContent='START BUILDING';b.hidden=true;area.querySelector('.avatar-buttons').append(b);b.onclick=()=>{clearPhoto();area.hidden=true;onContinue();};}
 if(!generationAllowed){avatarURL=null;area.querySelector('h1+p').textContent='Preview a photo or start with the default avatar.';area.querySelector('.avatar-note').textContent='AI generation is disabled. Photos stay on this page. Use the default avatar to start.';}
 const buttons=['start','take','retake','use','retry','default','change',...(onContinue?['continue']:[])];
 const status=text=>{$('status').textContent=text;};
 function allowance(config){if(!alive||!Number.isInteger(config?.playerTotalLimit))return;const remaining=Math.max(0,config.playerAttemptsRemaining??config.playerTotalLimit);attemptsRemaining=remaining;area.querySelector('.avatar-note').textContent=`AI avatar attempts remaining: ${remaining} / ${config.playerTotalLimit} total. Refreshing or re-entering does not reset attempts.`;$('use').disabled=!enabled||remaining===0;$('retry').disabled=remaining===0;}
 function clearPhoto(){photo=null;requestId=null;if(photoURL)URL.revokeObjectURL(photoURL);photoURL=null;$('photo').removeAttribute('src');$('photo').hidden=true;}
 function show(...ids){for(const id of buttons)$(id).hidden=!ids.includes(id);}
 function drawPortrait(){
  if(avatarURL){const im=document.createElement('img');im.src=avatarURL;im.alt='Your AI avatar';portrait.replaceChildren(im);}
  else portrait.innerHTML='<svg viewBox="65 1595 690 440" role="img" aria-label="Default PLAYER 01 avatar"><image href="/assets/creation/avatar-reference.jpg" width="3838" height="2160"/></svg>';
 }
 function ready(){clearPhoto();drawPortrait();$('camera').hidden=true;$('notice').hidden=true;show('change',...(onContinue?['continue']:[]));status('Avatar ready. Photo preview and hand tracking share one camera.');}
 async function start(){
  if(cameraBusy||inFlight)return;cameraBusy=true;$('start').disabled=true;$('retake').disabled=true;
  try{await input.startCamera($('camera'));if(!alive||chosen)return;clearPhoto();$('camera').hidden=false;$('notice').hidden=true;show('take','default');status('Get ready, then select TAKE PHOTO. No photo has been uploaded.');}
  catch(e){if(alive&&!chosen){status('Unable to enable camera: '+e.message);show('start','default');}}
  finally{cameraBusy=false;if(alive){$('start').disabled=false;$('retake').disabled=false;}}
 }
 $('start').onclick=start;$('retake').onclick=start;
 $('take').onclick=async()=>{
  if(cameraBusy||inFlight||!$('camera').videoWidth)return;cameraBusy=true;$('take').disabled=true;
  try{
   const video=$('camera'),canvas=document.createElement('canvas');const scale=Math.min(1,512/video.videoWidth,512/video.videoHeight);
   canvas.width=Math.round(video.videoWidth*scale);canvas.height=Math.round(video.videoHeight*scale);canvas.getContext('2d').drawImage(video,0,0,canvas.width,canvas.height);
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.85));canvas.width=canvas.height=0;
   if(!alive||chosen||!blob)return;clearPhoto();photo=blob;photoURL=URL.createObjectURL(blob);requestId=crypto.randomUUID();$('photo').src=photoURL;$('photo').hidden=false;$('camera').hidden=true;$('notice').hidden=false;
   show('retake',...(generationAllowed?['use']:[]),'default');$('use').disabled=!enabled||attemptsRemaining===0;$('notice').hidden=!generationAllowed;status(enabled?'Photo not uploaded. Select USE PHOTO to confirm generation.':generationAllowed?'Photo not uploaded. AI is unavailable; retake or use the default avatar.':'Photo preview only; nothing is uploaded. Use the default avatar to start.');
  }finally{cameraBusy=false;if(alive)$('take').disabled=false;}
 };
 async function transparentImage(data){
  if(typeof data!=='string'||!data.startsWith('data:image/png;base64,')||data.length>14000000)throw Error('Invalid avatar result');
  const im=new Image();im.src=data;await im.decode();if(im.width>2048||im.height>2048)throw Error('Invalid avatar dimensions');
  const canvas=document.createElement('canvas');canvas.width=im.width;canvas.height=im.height;const ctx=canvas.getContext('2d');ctx.drawImage(im,0,0);
  const pixels=ctx.getImageData(0,0,im.width,im.height).data;let clear=false,visible=false;for(let i=3;i<pixels.length;i+=4){if(pixels[i]===0)clear=true;if(pixels[i]>0)visible=true;}
  if(!clear||!visible)throw Error('Avatar has no valid transparent background. Please retry.');
  return URL.createObjectURL(await (await fetch(data)).blob());
 }
 async function generate(){
  if(!photo||!enabled||inFlight)return;if(attemptsRemaining===0){status('Your two avatar generation attempts are used up. Use the default avatar.');show('default');return;}
  show();$('notice').hidden=false;area.setAttribute('aria-busy','true');waitStarted=performance.now();status('Generating your avatar. Please wait…');clearInterval(waitTimer);waitTimer=setInterval(()=>{if(alive)status(`Generating your avatar… ${Math.floor((performance.now()-waitStarted)/1000)}s elapsed. Please wait.`);},1000);
  const blob=photo,id=requestId;
  const work=(async()=>{
   const res=await fetch('/api/avatar/generate',{method:'POST',headers:{'Content-Type':'image/jpeg','Idempotency-Key':id},body:blob});
   const data=await res.json();if(!res.ok)throw Error(data.error||'Generation failed');
   const url=await transparentImage(data.image);if(avatarURL)URL.revokeObjectURL(avatarURL);avatarURL=url;chosen=true;try{sessionStorage.setItem(AVATAR_CACHE,data.image);}catch{}
  })();inFlight=work;
  try{await work;if(alive)ready();}
  catch(e){if(alive){status(e.message+(e.message.includes('default avatar')?'':' Use the default avatar, or check the service before retrying.'));show('retry','retake','default');}}
  finally{clearInterval(waitTimer);if(inFlight===work)inFlight=null;if(alive){area.removeAttribute('aria-busy');fetch('/api/avatar/config',{signal:AbortSignal.timeout(8000)}).then(r=>r.ok?r.json():null).then(allowance).catch(()=>{});}}
 }
 $('use').onclick=generate;
 // A retry is explicit and consumes another attempt; transport duplicates use the
 // original key. The server reserves quota before every provider invocation.
 $('retry').onclick=()=>{requestId=crypto.randomUUID();generate();};
 $('default').onclick=()=>{if(inFlight)return;if(cameraBusy)input.stopCamera();if(avatarURL)URL.revokeObjectURL(avatarURL);avatarURL=null;chosen=true;try{sessionStorage.removeItem(AVATAR_CACHE);}catch{}ready();};
 $('change').onclick=()=>{chosen=false;show('start','default');status('Choose an avatar. Photos are submitted only after confirmation.');};
 drawPortrait();
 if(chosen)ready();
 if(inFlight){show();status('Your previous avatar is still generating. Please wait……');inFlight.then(()=>{if(alive)ready();},()=>{if(alive){show('start','default');status('Previous generation failed. Retake or use the default avatar.');}});}
 if(generationAllowed)fetch('/api/avatar/config',{signal:AbortSignal.timeout(8000)}).then(r=>r.ok?r.json():null).then(config=>{enabled=config?.enabled===true;available(enabled);if(!alive)return;$('use').disabled=!enabled||attemptsRemaining===0;allowance(config);if(enabled){if(!chosen&&!inFlight)status(photo?'Photo not uploaded. Select USE PHOTO to confirm generation.':`Enable the camera to take a photo. Total generation limit: ${config.playerTotalLimit??2}.`);}else if(!chosen&&!inFlight)status('AI Avatar service is not configured. Preview a photo or use the default avatar.');}).catch(()=>{available(false);if(alive&&!chosen&&!inFlight)status('AI Avatar service unavailable. Use the default avatar.');});
 else available(false);
 const dispose=()=>{alive=false;clearInterval(waitTimer);available(false);clearPhoto();area.remove();portrait.remove();root.classList.remove('creation-avatar-scene');};dispose.availability=availability;return dispose;
}
