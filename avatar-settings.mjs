import {readFileSync} from 'node:fs';
import path from 'node:path';
import {homedir} from 'node:os';
export function loadAvatarSettings(env=process.env){
 const file=env.AVATAR_CONFIG_FILE||path.join(homedir(),'.config','save-file-me','avatar.json');
 let saved={};try{saved=JSON.parse(readFileSync(file,'utf8'));}catch(e){if(e.code!=='ENOENT')throw Error('Avatar settings file is invalid. Run the avatar setup again.');}
 // Existing deployment environment variables take precedence; never log values.
 for(const[k,v]of Object.entries(saved))if(/^AVATAR_[A-Z_]+$/.test(k)&&env[k]===undefined)env[k]=String(v);
 return env;
}
