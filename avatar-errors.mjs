import {mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
// Retain only predefined diagnostic fields. Provider text may echo secrets/photos.
export function safeProviderError(status,data={}){
 const raw=String(data?.error?.code||''),text=String(data?.error?.message||'');
 let kind='provider_rejected';
 if(status===401)kind='authentication';
 else if(/Insufficient|Overdue|Balance|Credit|Unpaid|Arrear/i.test(raw)||status===402)kind='billing';
 else if(/Content|Safety|Sensitive|Risk/i.test(raw))kind='content_review';
 else if(status===403||/Permission|AccessDenied|NotOpen|NotActivated/i.test(raw))kind='access';
 else if(status===404||/ModelNotFound|InvalidModel/i.test(raw))kind='model';
 else if(status===429)kind='rate_limit';
 else if(status===400)kind='parameters';
 else if(status>=500)kind='provider_unavailable';
 const fields=['model','image','size','output_format','response_format','watermark','sequential_image_generation'];
 const field=kind==='parameters'?fields.find(name=>(data?.error?.param===name||new RegExp('(?:parameter\\s*[:=]?\\s*|[\"\'`])'+name+'\\b','i').test(text))):undefined;
 const messages={authentication:'The provider rejected the API key.',billing:'Check the provider account balance and billing status.',access:'Check model activation and API key permissions.',model:'The provider could not find or access this model.',rate_limit:'The provider request limit was reached.',parameters:'The provider rejected a request parameter.',content_review:'The provider declined the image or prompt.',provider_unavailable:'The provider is temporarily unavailable.',provider_rejected:'The provider rejected the request.'};
 return {status:Number.isInteger(status)?status:0,kind,...(field?{field}:{}),message:messages[kind]+(field?' Parameter: '+field+'.':'')};
}
export function saveAvatarDiagnostic(config,info){
 try{const file=path.join(path.dirname(config.ledger),'avatar-last-error.json');mkdirSync(path.dirname(file),{recursive:true,mode:0o700});writeFileSync(file,JSON.stringify({time:new Date().toISOString(),provider:config.provider==='seedream'?'seedream':'openai',...info}),{mode:0o600});}catch{}
}
