import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {avatarConfig,createAvatarService} from '../avatar-service.mjs';

const photo=Buffer.concat([Buffer.from([255,216,255]),Buffer.alloc(100)]);
// Provider fixture only; these tests never contact an image-generation service.
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAABCAYAAAD0In+KAAAAEUlEQVR4nGNgYPj/n4GBgQEACv4B/7jjPowAAAAASUVORK5CYII=','base64');
async function fixture(t,overrides={},provider){
 const dir=await mkdtemp(path.join(tmpdir(),'avatar-budget-'));t.after(()=>rm(dir,{recursive:true,force:true}));
 const config={enabled:true,key:'test-key',model:'gpt-image-1',secret:'test-session-secret-long-enough-12345',ledger:path.join(dir,'ledger.json'),perPlayer:2,daily:4,budget:40,cost:10,...overrides};
 let calls=0;
 let handler=createAvatarService(config,async(...args)=>{calls++;return provider?provider(...args):{ok:true,json:async()=>({data:[{b64_json:png.toString('base64')}]})};});
 const server=http.createServer((req,res)=>handler(req,res));await new Promise(r=>server.listen(0,'127.0.0.1',r));
 t.after(()=>new Promise(r=>{server.closeAllConnections();server.close(r);}));
 const base='http://127.0.0.1:'+server.address().port;
 const getCookie=async()=>{const r=await fetch(base+'/api/avatar/config');return r.headers.get('set-cookie').split(';')[0];};
 const cookie=await getCookie();
 const post=(id=randomUUID(),opts={})=>fetch(base+'/api/avatar/generate',{method:'POST',headers:{Origin:base,Cookie:cookie,'Content-Type':'image/jpeg','Idempotency-Key':id,...opts.headers},body:photo});
 return {config,post,base,cookie,getCookie,calls:()=>calls,restart:()=>{handler=createAvatarService(config,async()=>{calls++;return {ok:true,json:async()=>({data:[{b64_json:png.toString('base64')}]})};});}};
}
test('Missing key or explicit budget configuration keeps paid generation disabled',()=>{
 assert.equal(avatarConfig({}).enabled,false);
 assert.equal(avatarConfig({AVATAR_API_KEY:'secret'}).enabled,false);
});
test('Idempotent successful request invokes provider once; limits survive restart',async t=>{
 const f=await fixture(t);const id=randomUUID();assert.equal((await f.post(id)).status,200);assert.equal((await f.post(id)).status,200);assert.equal(f.calls(),1);
 f.restart();assert.equal((await f.post(id)).status,409);assert.equal((await f.post()).status,200);assert.equal((await f.post()).status,429);assert.equal(f.calls(),2);
 const ledger=await readFile(f.config.ledger,'utf8');assert(!ledger.includes('test-key'));assert(!ledger.includes(photo.toString('base64')));
});
test('Global cost ceiling blocks a different browser after budget reservation',async t=>{
 const f=await fixture(t,{budget:10});assert.equal((await f.post()).status,200);
 const other=await f.getCookie();assert.equal((await f.post(randomUUID(),{headers:{Cookie:other}})).status,429);assert.equal(f.calls(),1);
});
test('Simultaneous double submission cannot cause a second charge',async t=>{
 let release;const wait=new Promise(r=>release=r);
 const f=await fixture(t,{},async()=>{await wait;return {ok:true,json:async()=>({data:[{b64_json:png.toString('base64')}]})};});
 const first=f.post();while(f.calls()===0)await new Promise(r=>setTimeout(r,5));
 assert.equal((await f.post()).status,409);release();assert.equal((await first).status,200);assert.equal(f.calls(),1);
});
test('Provider failure is charged against quota; wrong origin never invokes provider',async t=>{
 const f=await fixture(t,{perPlayer:1},async()=>({ok:false}));
 assert.equal((await f.post(randomUUID(),{headers:{Origin:'https://other.example'}})).status,403);
 assert.equal((await f.post()).status,502);assert.equal((await f.post()).status,429);assert.equal(f.calls(),1);
});
