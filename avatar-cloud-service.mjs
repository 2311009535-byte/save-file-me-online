import {safeProviderError,saveAvatarDiagnostic} from './avatar-errors.mjs';
import {prepareSeedreamAvatar} from './avatar-png.mjs';
import {createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
import {readFileSync,writeFileSync,renameSync,mkdirSync,openSync,closeSync,unlinkSync} from 'node:fs';
import path from 'node:path';

export const AVATAR_PROMPT='Create one simple childlike 2D bust avatar from the reference person. Preserve recognizable hairstyle and glasses when present. Naive uneven hand-drawn vivid blue outlines, simple flat colors, warm off-white clothing accents, minimal details, front facing friendly expression. Match a handmade blue-ink notebook game UI. Transparent background, no scene, frame, text or watermark. Do not include a photographic face. Return a transparent PNG.';
const integer=(v)=>/^\d+$/.test(String(v||''))?Number(v):0;
export function avatarConfig(env=process.env){
 const config={provider:env.AVATAR_PROVIDER||'openai',perPlayerTotal:integer(env.AVATAR_PLAYER_TOTAL_LIMIT||'2'),totalLimit:integer(env.AVATAR_TOTAL_LIMIT),key:env.AVATAR_API_KEY,model:env.AVATAR_MODEL,secret:env.AVATAR_SESSION_SECRET,
  ledger:env.AVATAR_LEDGER_PATH,perPlayer:integer(env.AVATAR_PLAYER_DAILY_LIMIT),daily:integer(env.AVATAR_DAILY_LIMIT),
  budget:integer(env.AVATAR_DAILY_BUDGET_MILLIS),cost:integer(env.AVATAR_COST_CEILING_MILLIS)};
 const ledgerSafe=config.ledger&&path.isAbsolute(config.ledger)&&!path.resolve(config.ledger).startsWith(path.resolve('public')+path.sep);
 config.enabled=Boolean(env.AVATAR_GENERATION_ENABLED==='yes'&&config.key&&(config.provider==='seedream'?config.model==='doubao-seedream-5-0-pro-260628':config.provider==='openai'&&['gpt-image-1','gpt-image-1.5'].includes(config.model))&&config.secret?.length>=32&&ledgerSafe&&
  config.perPlayerTotal>0&&config.perPlayerTotal<=2&&config.perPlayer>0&&config.perPlayer<=6&&config.daily>0&&config.daily<=100&&config.cost>0&&config.budget>=config.cost&&
  env.AVATAR_PROVIDER_BUDGET_CONFIRMED==='yes');
 return config;
}
class PublicError extends Error {constructor(status,message){super(message);this.status=status;}}
export function createAvatarService(config=avatarConfig(),providerFetch=fetch){
 const active=new Map(),results=new Map();
 const send=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
 function session(req,res){
  const value=/\bsfm_avatar=([^;]+)/.exec(req.headers.cookie||'')?.[1]||'';
  const [id,sig]=value.split('.');
  const sign=id=>createHmac('sha256',config.secret).update(id).digest('hex');
  const valid=/^[a-f0-9]{64}$/.test(id||'')&&/^[a-f0-9]{64}$/.test(sig||'')&&timingSafeEqual(Buffer.from(sig),Buffer.from(sign(id)));
  const next=valid?id:randomBytes(32).toString('hex');
  res.setHeader('Set-Cookie',`sfm_avatar=${next}.${sign(next)}; HttpOnly; SameSite=Strict; Path=/api/avatar; Max-Age=34560000${config.secureCookie?'; Secure':''}`);
  return next;
 }
 // All instances must share this durable directory. Exclusive creation prevents
 // simultaneous reservations; a stale lock fails closed instead of resetting budget.
 async function reserve(player,id){await config.store.reserve(player,id,config);}
 async function body(req){
  const chunks=[];let size=0;
  for await(const chunk of req){size+=chunk.length;if(size>800000)throw new PublicError(413,'Photo is too large. Please retake.');chunks.push(chunk);}
  const image=Buffer.concat(chunks);
  if(image.length<100||image[0]!==255||image[1]!==216||image[2]!==255)throw new PublicError(400,'Invalid photo. Please retake.');
  return image;
 }
 return async function handle(req,res){
  if(!req.url.split('?')[0].startsWith('/api/avatar'))return false;
  try{
   if(req.url==='/api/avatar/config'&&req.method==='GET'){
    let used=0;
    if(config.enabled){const player=session(req,res);used=await config.store.used(player);}
    const limit=config.enabled?(config.perPlayerTotal??2):0;
    send(res,200,{enabled:config.enabled,playerDailyLimit:config.enabled?config.perPlayer:0,playerTotalLimit:limit,playerAttemptsUsed:used,playerAttemptsRemaining:Math.max(0,limit-used),provider:config.enabled?(config.provider||'openai'):null});return true;
   }
   if(req.url!=='/api/avatar/generate'||req.method!=='POST'){send(res,404,{error:'Endpoint not found.'});return true;}
   if(!config.enabled)throw new PublicError(503,'AI avatar service is not configured. Use the default avatar.');
   // No cross-origin upload endpoint; the public reverse proxy must preserve Host.
   let origin;try{origin=new URL(req.headers.origin);}catch{throw new PublicError(403,'Submit your photo from the game page.');}
   if(!['http:','https:'].includes(origin.protocol)||origin.host!==req.headers.host)throw new PublicError(403,'Invalid photo submission origin.');
   if(req.headers['content-type']!=='image/jpeg')throw new PublicError(415,'Only captured JPEG photos are supported.');
   const player=session(req,res),id=req.headers['idempotency-key'];
   if(!/^[a-f0-9-]{36}$/.test(id||''))throw new PublicError(400,'Invalid request identifier.');
   const key=player+':'+id;
   if(results.has(key)){send(res,200,results.get(key));return true;}
   if(active.has(player))throw new PublicError(409,'Avatar is generating. Please wait.');
   const image=await body(req);
   if(active.has(player))throw new PublicError(409,'Avatar is generating. Please wait.');
   await reserve(player,id);active.set(player,true);
   try{
    let response;
    if(config.provider==='seedream'){
     const prompt=AVATAR_PROMPT.replace('Transparent background,','A perfectly solid bright green (#00ff00) background for later chroma-key removal, no green in the person or clothing, keep the entire hair and shoulders inside the canvas,');
     response=await providerFetch('https://ark.cn-beijing.volces.com/api/v3/images/generations',{method:'POST',headers:{Authorization:'Bearer '+config.key,'Content-Type':'application/json'},body:JSON.stringify({model:config.model,prompt,image:'data:image/jpeg;base64,'+image.toString('base64'),response_format:'b64_json',output_format:'png',size:'2K',stream:false,watermark:false}),signal:AbortSignal.timeout(120000)});
    }else{
     const form=new FormData();form.set('model',config.model);form.set('image',new Blob([image],{type:'image/jpeg'}),'photo.jpg');form.set('prompt',AVATAR_PROMPT);form.set('n','1');form.set('size','1024x1024');form.set('quality','low');form.set('background','transparent');form.set('output_format','png');
     response=await providerFetch('https://api.openai.com/v1/images/edits',{method:'POST',headers:{Authorization:'Bearer '+config.key},body:form,signal:AbortSignal.timeout(120000)});
    }
    if(!response.ok){let detail;try{detail=await response.json();}catch{}const info=safeProviderError(response.status,detail);saveAvatarDiagnostic(config,info);throw new PublicError(502,`AI service error ${info.status}: ${info.message}`);}
    const data=await response.json();if(!Array.isArray(data.data)||data.data.length!==1)throw new PublicError(502,'Expected one avatar image. No automatic retry was made.');let b64=data.data[0]?.b64_json;
    if(typeof b64!=='string'||b64.length>14000000)throw new PublicError(502,'Invalid generated image. Retry or use the default avatar.');
    let png=Buffer.from(b64,'base64');
    if(config.provider==='seedream'){try{png=prepareSeedreamAvatar(png);b64=png.toString('base64');}catch{throw new PublicError(502,'Could not prepare a transparent avatar. Retry or use the default avatar.');}}
    if(png.length<33||png.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||png[25]!==6)throw new PublicError(502,'No transparent PNG avatar received. Retry or use the default avatar.');
    if(b64.length>4000000)throw new PublicError(502,'Generated avatar is too large. Use the default avatar.');
    const result={image:'data:image/png;base64,'+b64};results.set(key,result);
    const expiry=setTimeout(()=>results.delete(key),300000);expiry.unref?.();
    send(res,200,result);
   }finally{active.delete(player);}
  }catch(e){send(res,e.status||503,{error:e.status?e.message:'Avatar service is unavailable. Use the default avatar.'});}
  return true;
 };
}
