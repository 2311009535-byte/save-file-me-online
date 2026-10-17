import {avatarConfig,createAvatarService} from './avatar-cloud-service.mjs';
import {createRedisStore} from './avatar-redis.mjs';
const config=avatarConfig({...process.env,AVATAR_LEDGER_PATH:'/tmp/sfm-avatar-diagnostics/ledger.json'});
config.store=createRedisStore();
config.enabled=Boolean(config.enabled&&config.store);
config.secureCookie=true;
const handle=createAvatarService(config);
export default async function handler(req,res){
 const pathname=new URL(req.url,'https://localhost').pathname;
 if(!['/api/avatar/config','/api/avatar/generate'].includes(pathname)){res.writeHead(404,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Endpoint not found.'}));return;}
 req.url=pathname;
 await handle(req,res);
}
