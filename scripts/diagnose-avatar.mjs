import {readFileSync} from 'node:fs';
import path from 'node:path';
import {loadAvatarSettings} from '../avatar-settings.mjs';
import {avatarConfig} from '../avatar-service.mjs';
import {safeProviderError} from '../avatar-errors.mjs';
export async function diagnoseAvatar(env=process.env,request=fetch,log=console.log){
 const cfg=avatarConfig(loadAvatarSettings(env));
 log('AVATAR DIAGNOSTIC (read-only; no photo or image-generation request)');
 log('Settings enabled: '+cfg.enabled+'; provider: '+(cfg.provider==='seedream'?'seedream':'other')+'; key present: '+Boolean(cfg.key));
 if(cfg.ledger){try{const ledger=JSON.parse(readFileSync(cfg.ledger,'utf8'));log('Reserved attempts: '+(ledger.lifetime??ledger.total)+'; total allowance: '+(cfg.totalLimit||'daily only'));}catch(e){log(e.code==='ENOENT'?'No local attempt ledger yet.':'Ledger cannot be read. Do not delete it.');}
  try{const info=JSON.parse(readFileSync(path.join(path.dirname(cfg.ledger),'avatar-last-error.json'),'utf8'));log('Last saved failure: '+JSON.stringify({time:info.time,kind:info.kind,status:info.status,field:info.field}));}catch{log('No detailed failure was saved by the old version.');}}
 if(cfg.provider!=='seedream'||!cfg.key){log('STOP: configure Seedream first.');return;}
 try{
  // An authenticated GET only. Some Ark accounts do not expose this catalogue;
  // a 404/405 here does NOT prove the configured generation model is invalid.
  const response=await request('https://ark.cn-beijing.volces.com/api/v3/models',{method:'GET',headers:{Authorization:'Bearer '+cfg.key},signal:AbortSignal.timeout(15000),redirect:'error'});
  log('Read-only model catalogue HTTP: '+response.status);
  if(response.status===404||response.status===405){log('Catalogue check unsupported; this does not diagnose the generation failure. Check Ark account balance, model access, and call records.');return;}
  if(response.ok){log('Catalogue request accepted. This does NOT verify image generation, balance, or model parameters.');return;}
  let data;try{data=await response.json();}catch{}const info=safeProviderError(response.status,data);log('Read-only check: '+info.kind+'. '+info.message);
 }catch{log('Read-only check could not connect. Check this Mac network; no generation was attempted.');}
}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname))diagnoseAvatar().catch(()=>{console.error('Diagnostic could not read settings. No secrets were printed.');process.exitCode=1;});
