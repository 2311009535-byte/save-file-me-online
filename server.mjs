import {loadAvatarSettings} from './avatar-settings.mjs';
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {createAvatarService,avatarConfig} from './avatar-service.mjs';
const avatarSettings=avatarConfig(loadAvatarSettings());avatarSettings.secureCookie=process.env.AVATAR_SECURE_COOKIE==='yes';
const avatarService=createAvatarService(avatarSettings);
const root=path.resolve('public');
let rewrites={};try{rewrites=JSON.parse(await readFile(path.join(root,'asset-rewrites.json'),'utf8'));}catch{}
const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.wasm':'application/wasm','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.mp4':'video/mp4','.webm':'video/webm','.webp':'image/webp'};
http.createServer(async(req,res)=>{
 if(await avatarService(req,res))return;
 try{
 const requested=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const pathname=rewrites[requested]||requested;
 const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 const data=await readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file).toLowerCase()]||'application/octet-stream','Cache-Control':'no-cache'});res.end(data);
 }catch{res.writeHead(404);res.end('Not found');}
}).listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log('Save File: Me running on port '+(process.env.PORT||3000)));
