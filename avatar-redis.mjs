// Atomic quotas persist across Vercel instances and deployments.
const script=`
local used=tonumber(redis.call('HGET',KEYS[1],ARGV[1]) or '0')
if redis.call('HEXISTS',KEYS[3],ARGV[2])==1 then return {409,'This generation was already submitted. No automatic retry was made.'} end
if used>=tonumber(ARGV[3]) then return {429,'Your two avatar generation attempts are used up. Use the default avatar.'} end
local total=tonumber(redis.call('GET',KEYS[4]) or '0')
if tonumber(ARGV[4])>0 and total>=tonumber(ARGV[4]) then return {429,'The total avatar allowance is used up.'} end
local dailyPlayer=tonumber(redis.call('HGET',KEYS[2],ARGV[1]) or '0')
local daily=tonumber(redis.call('HGET',KEYS[2],'total') or '0')
local spent=tonumber(redis.call('HGET',KEYS[2],'spent') or '0')
if dailyPlayer>=tonumber(ARGV[5]) or daily>=tonumber(ARGV[6]) or spent+tonumber(ARGV[8])>tonumber(ARGV[7]) then return {429,'The daily avatar allowance is used up. Use the default avatar.'} end
redis.call('HINCRBY',KEYS[1],ARGV[1],1)
redis.call('HSET',KEYS[3],ARGV[2],'1')
redis.call('INCR',KEYS[4])
redis.call('HINCRBY',KEYS[2],ARGV[1],1)
redis.call('HINCRBY',KEYS[2],'total',1)
redis.call('HINCRBY',KEYS[2],'spent',ARGV[8])
redis.call('EXPIRE',KEYS[2],172800)
return {200,'reserved'}
`;
export function createRedisStore(env=process.env,request=fetch){
 const url=env.KV_REST_API_URL||env.UPSTASH_REDIS_REST_URL;
 const token=env.KV_REST_API_TOKEN||env.UPSTASH_REDIS_REST_TOKEN;
 if(!url||!token||!url.startsWith('https://'))return null;
 async function command(args){
  const response=await request(url,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(args),signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw Error('Quota storage unavailable');
  const data=await response.json();if(data.error)throw Error('Quota storage unavailable');return data.result;
 }
 const prefix='{sfm-avatar-v1}:';
 return {
  async used(player){const value=await command(['HGET',prefix+'players',player]);const used=value===null?0:Number(value);if(!Number.isSafeInteger(used)||used<0)throw Error('Invalid quota');return used;},
  async reserve(player,id,config){
   const day=new Date().toISOString().slice(0,10);
   const result=await command(['EVAL',script,'4',prefix+'players',prefix+'day:'+day,prefix+'requests',prefix+'total',player,player+':'+id,String(config.perPlayerTotal),String(config.totalLimit),String(config.perPlayer),String(config.daily),String(config.budget),String(config.cost)]);
   if(!Array.isArray(result)||result.length!==2)throw Error('Invalid quota response');
   if(Number(result[0])!==200){const e=Error(String(result[1]));e.status=Number(result[0]);throw e;}
  }
 };
}
