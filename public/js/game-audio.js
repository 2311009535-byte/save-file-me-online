import {musicLoop} from './audio-loop.js';
import {forestMusicUrl,recordedSounds,chapterMusic} from './audio-config.js';
import {profiles,sceneProfile,midiFrequency,riverLevel} from './audio-score.js';
const KEY='save-file-me:audio:v1',clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export function createGameAudio(){
 let prefs={muted:false,music:.5,effects:.5,ambience:.4,mixVersion:2};try{const p=JSON.parse(localStorage.getItem(KEY));if(p){prefs.muted=p.muted===true;for(const k of ['music','effects','ambience'])if(p.mixVersion===2&&Number.isFinite(p[k]))prefs[k]=clamp(p[k]);}}catch{}
 let ctx,master,music,fx,env,analyser,noiseBuffer,clock=0,scene='prologue',profile='prologue',reading=false,videoActive=false,built=0,forestZ=0,ambient=null,pencil=null,initialized=false,disposed=false,controls=null,button=null,origin=0,nextBird=0,duckUntil=0;
 let forestFile=null,forestSource=null,customForestPlaying=false,forestBuffer=null,forestOffset=0,forestStarted=0,forestRequest=0;
 let trackEpoch=0,forestOverride=forestMusicUrl;
 let wonderGame=false;
 const recordedKey=name=>name==='chapter1'&&wonderGame?'chapter1-game':name==='retry-diary'?'retry-together':name;
 const videoRoutes=new Map();
 const decoded=new Map();
 const samples=new Map(),sampleRequests=new Set(),combatSources=new Set();
 const tracks=new Set(),sources=new Set(),cooldowns=new Map(),stats={effects:{},transitions:0};
 const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch{}};
 const ramp=(param,value,seconds=.25)=>{if(!ctx)return;param.cancelScheduledValues(ctx.currentTime);param.setTargetAtTime(value,ctx.currentTime,Math.max(.01,seconds/3));};
 function mix(){if(!ctx)return;ramp(master.gain,prefs.muted?0:.65);ramp(music.gain,prefs.music*.55*(reading?.78:1)*(videoActive?.4:1),.6);ramp(fx.gain,prefs.effects*.65);ramp(env.gain,prefs.ambience*.8);}
 function register(source,nodes,group){sources.add(source);group?.add(source);source.onended=()=>{sources.delete(source);group?.delete(source);for(const n of [source,...nodes])try{n.disconnect();}catch{}};return source;}
 function tone(bus,note,time,length=.8,amp=.12,type='sine',group=null,endNote=null){
  if(!ctx||!Number.isFinite(note))return;const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(midiFrequency(note),time);if(endNote!==null)o.frequency.exponentialRampToValueAtTime(midiFrequency(endNote),time+length*.8);g.gain.setValueAtTime(.00001,time);g.gain.linearRampToValueAtTime(amp,time+.015);g.gain.exponentialRampToValueAtTime(.00001,time+length);o.connect(g).connect(bus);register(o,[g],group);o.start(time);o.stop(time+length+.03);
 }
 function noise(bus,time,length,amp,frequency=1800,kind='bandpass',loop=false){
  if(!ctx)return null;const s=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),g=ctx.createGain();s.buffer=noiseBuffer;s.loop=loop;filter.type=kind;filter.frequency.value=frequency;filter.Q.value=.6;s.connect(filter).connect(g).connect(bus);g.gain.setValueAtTime(loop?amp:.00001,time);if(!loop){g.gain.linearRampToValueAtTime(amp,time+.02);g.gain.exponentialRampToValueAtTime(.00001,time+length);}register(s,[filter,g]);s.start(time);if(!loop)s.stop(time+length+.03);let stopped=false;return{gain:g.gain,filter,stop(){if(stopped)return;stopped=true;ramp(g.gain,0,.06);try{s.stop(ctx.currentTime+.12);}catch{}}};
 }
 function padTone(bus,note,time,length,amp,group){
  const o=ctx.createOscillator(),g=ctx.createGain();o.type='triangle';o.frequency.value=midiFrequency(note);g.gain.setValueAtTime(.00001,time);g.gain.linearRampToValueAtTime(amp,time+1.2);g.gain.linearRampToValueAtTime(.00001,time+length);o.connect(g).connect(bus);register(o,[g],group);o.start(time);o.stop(time+length+.03);
 }
 function scoreStep(track){
  const p=profiles[track.name],i=track.step,t=track.next,beat=60/p.bpm,step=beat/2,chord=p.chords[Math.floor(i/8)%p.chords.length],level=p.level;
  if(track.recorded||p.silent){track.next+=step;track.step++;return;}
  if(p.glitch){if([0,1,3].includes(i%4)){tone(track.bus,42+i%3*19,t,.055,.022,'square',track.voices);tone(track.bus,70-i%5,t+.085,.035,.011,'triangle',track.voices);}track.next+=step;track.step++;return;}
  const note=p.melody[i%p.melody.length];
  if(p.dark){if(i%8===0)for(const n of chord)padTone(track.bus,p.root+n,t,beat*5,.045*level,track.voices);if(note!==null)padTone(track.bus,p.root+note+12,t,beat*3,.025,track.voices);}
  else{
   if(note!==null)tone(track.bus,p.root+12+note,t,p.retro?.24:p.combat?.4:p.creation?.38:1.1,.09*level,p.type,track.voices);
   if(i%8===0){tone(track.bus,p.root+chord[0]-12,t,beat*3.6,.1*level,p.retro?'triangle':'sine',track.voices);if(p.pad)for(const n of chord)tone(track.bus,p.root+n,t,beat*4.5,.027*level,'sine',track.voices);}
   if((p.retro||p.arp)&&i%2===0)tone(track.bus,p.root+chord[(i/2)%3],t,p.retro?.13:.4,.04*level,p.retro?'triangle':'sine',track.voices);
   if(p.duet&&i%2===1)tone(track.bus,p.root+chord[(i>>1)%3]+12,t,beat,.05*level,'sine',track.voices);
   if((p.rhythm||p.creation&&built>=3)&&i%4===0)tone(track.bus,34,t,.2,.07,'sine',track.voices,22);
   if(p.combat&&i%4===0){tone(track.bus,28,t,.4,.09,'triangle',track.voices,24);tone(track.bus,39,t+.12,.06,.04,'square',track.voices);}
  }
  track.next+=step;track.step++;
 }
 function startTrack(name){
  if(!ctx||disposed)return;
  const epoch=++trackEpoch,key=recordedKey(name);
  const spec=name==='forest'&&forestOverride?{url:forestOverride,gain:.418}:chapterMusic[key];
  for(const tr of [...tracks])if(tr.pending)stopTrack(tr);
  const same=[...tracks].find(t=>!t.retiring&&t.recorded===key&&t.recordedPlaying);
  if(spec&&same){same.name=name;return;}
  const now=ctx.currentTime,p=profiles[name],bus=ctx.createGain(),filter=ctx.createBiquadFilter();
  filter.type='lowpass';
  filter.frequency.value=spec?22000:p.cutoff||6000;
  bus.gain.value=0;
  bus.connect(filter).connect(music);
  const tr={
   name,bus,filter,next:now+.05,
   step:Math.floor((now-origin)/(60/p.bpm/2)),
   voices:new Set(),retiring:false,
   recorded:spec?key:null,pending:Boolean(spec)
  };
  tracks.add(tr);
  stats.transitions++;
  for(const old of tracks){
   if(old===tr||old.retiring)continue;
   const at=ctx.currentTime;
   old.retiring=true;
   const value=old.bus.gain.value;
   old.bus.gain.cancelScheduledValues(at);
   old.bus.gain.setValueAtTime(value,at);
   old.bus.gain.linearRampToValueAtTime(0,at+.4);
   old.until=at+.5;
  }
  function fade(){
   const at=ctx.currentTime;
   tr.pending=false;
   bus.gain.setValueAtTime(0,at);
   bus.gain.linearRampToValueAtTime(1,at+.45);
  }
  if(!spec){fade();return;}
  decodeUrl(spec.url).then(buffer=>{
   if(disposed||epoch!==trackEpoch||!tracks.has(tr)){
    if(tracks.has(tr))stopTrack(tr);
    return;
   }
   const source=ctx.createBufferSource(),gain=ctx.createGain(),dynamics=ctx.createDynamicsCompressor();
   source.buffer=musicLoop(ctx,buffer,spec.start||0);
   source.loop=true;
   gain.gain.value=spec.gain;
   dynamics.threshold.value=-17;
   dynamics.knee.value=6;
   dynamics.ratio.value=8;
   dynamics.attack.value=.004;
   dynamics.release.value=.2;
   source.connect(gain).connect(dynamics).connect(bus);
   register(source,[gain,dynamics],tr.voices);
   source.start();
   tr.recordedPlaying=true;
   fade();
  }).catch(()=>{
   if(epoch===trackEpoch&&tracks.has(tr))fade();
  });
 }
 function stopTrack(tr){for(const s of tr.voices)try{s.stop();}catch{}tr.bus.disconnect();tr.filter?.disconnect();tracks.delete(tr);}
 function playSample(name,bus,amp=1,loop=false){const buffer=samples.get(name);if(!ctx||!buffer)return null;const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=buffer;source.loop=loop;gain.gain.value=amp;source.connect(gain).connect(bus);register(source,[gain]);source.start();let stopped=false;return{gain:gain.gain,stop(){if(stopped)return;stopped=true;ramp(gain.gain,0,.06);try{source.stop(ctx.currentTime+.12);}catch{}}};}
 function decodeUrl(url){let parsed;try{parsed=new URL(url,location.href);}catch{return Promise.reject(Error('Invalid audio URL'));}if(parsed.origin!==location.origin)return Promise.reject(Error('External audio URL'));if(!decoded.has(parsed.href))decoded.set(parsed.href,fetch(parsed.href).then(r=>{if(!r.ok)throw Error('Audio unavailable');return r.arrayBuffer();}).then(b=>ctx.decodeAudioData(b)));return decoded.get(parsed.href);}
 function audioClip(buffer,spec={}){const rate=buffer.sampleRate,start=Math.max(0,Math.floor((spec.start||0)*rate)),end=Math.min(buffer.length,Math.floor((spec.end||buffer.duration)*rate)),length=end-start;if(length<rate*.02)throw Error('Audio clip too short');const overlap=Math.min(Math.floor((spec.seam||0)*rate),Math.floor(length/4)),out=ctx.createBuffer(buffer.numberOfChannels,length-overlap,rate);for(let ch=0;ch<buffer.numberOfChannels;ch++){const src=buffer.getChannelData(ch),dst=out.getChannelData(ch);dst.set(src.subarray(start+overlap,end));for(let i=0;i<overlap;i++){const t=i/Math.max(1,overlap-1),at=dst.length-overlap+i;dst[at]=src[end-overlap+i]*(1-t)+src[start+i]*t;}}return out;}
 function balanceSample(buffer){let sum=0,peak=0,count=0;for(let c=0;c<buffer.numberOfChannels;c++)for(const v of buffer.getChannelData(c)){sum+=v*v;peak=Math.max(peak,Math.abs(v));count++;}const rms=Math.sqrt(sum/Math.max(1,count)),gain=Math.min(.1/Math.max(rms,.00001),.55/Math.max(peak,.00001),8);for(let c=0;c<buffer.numberOfChannels;c++){const d=buffer.getChannelData(c);for(let i=0;i<d.length;i++)d[i]*=gain;}return buffer;}
 function loadSamples(){if(!ctx)return;const tasks=[];for(const[name,value]of Object.entries(recordedSounds)){if(!value||sampleRequests.has(name))continue;sampleRequests.add(name);const spec=typeof value==='string'?{url:value}:value;tasks.push(decodeUrl(spec.url).then(buffer=>{if(!disposed)samples.set(name,balanceSample(audioClip(buffer,spec)));}).catch(()=>{}));}Promise.all(tasks).then(()=>{if(!disposed&&scene==='forest'){stopAmbience();ambience();}});}
 function ambience(){if(!ctx||scene!=='forest')return;const wind=playSample('wind',env,.25,true),grass=playSample('grass',env,.18,true),river=playSample('river',env,riverLevel(forestZ),true);ambient=wind||grass||river||samples.has('birds')?{wind,grass,river}:null;nextBird=ctx.currentTime+2;}
 function stopAmbience(){if(!ambient)return;for(const a of Object.values(ambient))a?.stop();ambient=null;}
 function schedule(){if(!ctx||ctx.state!=='running'||disposed)return;const now=ctx.currentTime;if(duckUntil&&now>=duckUntil){duckUntil=0;mix();}for(const tr of tracks){if(tr.retiring){if(now>=tr.until)stopTrack(tr);continue;}if(customForestPlaying&&tr.name==='forest')continue;if(tr.next<now-.5)tr.next=now+.02;while(tr.next<now+.3)scoreStep(tr);}if(ambient&&now>nextBird){playSample('birds',env,.18);nextBird=now+8+Math.random()*9;}}
 async function unlock(){if(disposed)return;try{if(!ctx){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;ctx=new AC();master=ctx.createGain();master.gain.value=prefs.muted?0:.65;music=ctx.createGain();fx=ctx.createGain();env=ctx.createGain();analyser=ctx.createAnalyser();analyser.fftSize=1024;const limiter=ctx.createDynamicsCompressor();limiter.threshold.value=-12;limiter.ratio.value=8;music.connect(master);const effectsLimiter=ctx.createDynamicsCompressor();effectsLimiter.threshold.value=-25;effectsLimiter.knee.value=6;effectsLimiter.ratio.value=12;effectsLimiter.attack.value=.003;effectsLimiter.release.value=.12;fx.connect(effectsLimiter).connect(master);env.connect(master);master.connect(limiter).connect(analyser).connect(ctx.destination);noiseBuffer=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);const d=noiseBuffer.getChannelData(0);let last=0;for(let i=0;i<d.length;i++){last=(last+.15*(Math.random()*2-1))/1.15;d[i]=last*2.8;}origin=ctx.currentTime;loadSamples();for(const key of ['prologue','prologue-glitch'])if(chapterMusic[key])decodeUrl(chapterMusic[key].url).catch(()=>{});mix();startTrack(profile);ambience();clock=setInterval(schedule,100);}if(prefs.muted||document.hidden){if(ctx.state==='running')await ctx.suspend();}else{if(ctx.state!=='running')await ctx.resume();if(scene==='forest')playForestFile();}}catch{/* Unsupported audio must never block gameplay. */}}
 function playForestFile(){}
 function setForestMusic(url){
  let parsed;
  try{parsed=new URL(url,location.href);}catch{return;}
  if(parsed.origin!==location.origin)return;
  forestOverride=parsed.href;
  if(ctx&&scene==='forest')startTrack('forest');
 }
 function setScene(value,progress={}){const nextProfile=sceneProfile(value,progress);if(scene===value&&(value!=='prologue'||profile===nextProfile))return;stopCombat();forestFile?.pause();customForestPlaying=false;scene=value;if(scene!=='chapter1')wonderGame=false;profile=nextProfile;pencil?.stop();pencil=null;duckUntil=0;mix();cooldowns.clear();stopAmbience();if(ctx){startTrack(profile);ambience();if(scene==='forest')playForestFile();}updateButton();}
 function setWonderGame(active){if(scene!=='chapter1')return;const next=Boolean(active);if(next===wonderGame)return;wonderGame=next;if(ctx)startTrack(profile);}
 function setRetry({joined,view,won}){if(scene!=='chapter3')return;const next=won||['diary','switch','victory'].includes(view)?'retry-diary':joined?'retry-together':'retry-alone';if(next===profile)return;profile=next;if(ctx)startTrack(profile);}
 function effect(name,{chapter=1,delay=0}={}){
  if(scene==='chapter4')return;
  if(scene==='chapter2'&&name==='paper')return;if(scene==='chapter1'&&name!=='boot')return;if(name==='boot'&&(![1,2].includes(chapter)||!['chapter1','chapter2'].includes(scene)))return;
  if(!ctx||ctx.state!=='running'||prefs.muted||document.hidden)return;const now=ctx.currentTime;if(now-(cooldowns.get(name)??-10)<.12)return;cooldowns.set(name,now);stats.effects[name]=(stats.effects[name]||0)+1;const t=now+Math.max(0,Math.min(3,delay));duckUntil=t+.65;mix();
  if(name==='bossCharge'){stopCombat();const o=ctx.createOscillator(),g=ctx.createGain();o.type='triangle';o.frequency.setValueAtTime(48,t);o.frequency.exponentialRampToValueAtTime(145,t+1.6);g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.13,t+1.5);g.gain.linearRampToValueAtTime(.0001,t+1.8);o.connect(g).connect(fx);register(o,[g],combatSources);o.start(t);o.stop(t+1.82);}
  else if(name==='playerAttack'){tone(fx,91,t,.12,.08,'triangle',combatSources,55);tone(fx,46,t+.07,.2,.13,'sine',combatSources,29);}
  else if(name==='duoAttack'){tone(fx,91,t,.12,.08,'triangle',combatSources,55);tone(fx,46,t+.07,.22,.13,'sine',combatSources,29);tone(fx,98,t+.14,.18,.07,'sine',combatSources,67);}
  else if(name==='bossAttack'){stopCombat();tone(fx,38,t,.7,.19,'sine',combatSources,19);tone(fx,57,t,.23,.075,'triangle',combatSources,27);}
  else if(name==='boot'){const root=chapter===1?60:57+chapter;[0,7,12,16].forEach((n,i)=>tone(fx,root+n,t+i*.12,.65,.1,chapter===1?'triangle':'sine'));noise(fx,t,.12,.06,800,'lowpass');}
  else if(name==='unlock'){tone(fx,79,t,.14,.1);tone(fx,84,t+.1,.25,.08);}
  else if(name==='window'){noise(fx,t,.65,.09,850,'lowpass');tone(fx,42,t,.4,.03,'triangle',null,39);}
  else if(name==='box'){noise(fx,t,.45,.12,1100,'bandpass');tone(fx,38,t,.18,.055,'triangle');}
  else if(['paper','map','note','page'].includes(name)){noise(fx,t,.32,.11,2300,'highpass');noise(fx,t+.12,.25,.07,1100,'bandpass');}
  else if(name==='sword'){noise(fx,t,.24,.07,3300,'highpass');[79,86,91].forEach((n,i)=>tone(fx,n,t+i*.065,.6,.065));}
  else if(['meteor','success','join'].includes(name)){[72,76,79,84].forEach((n,i)=>tone(fx,n,t+i*.1,.7,.065));}
  else if(name==='jump'){tone(fx,60,t,.18,.055,'square',null,76);}
  else if(name==='install'){noise(fx,t,.13,.06,600,'lowpass');tone(fx,72,t,.25,.06);tone(fx,79,t+.08,.35,.05);}
  else if(name==='switch'){noise(fx,t,.05,.12,1800);tone(fx,45,t,.04,.04,'triangle');}
  else if(name==='dismiss'){noise(fx,t,.2,.065,1800,'highpass');}
  else if(name==='card'){tone(fx,70,t,.08,.04,'triangle');}
 }
 function bindVideoAudio(video,level=1){
  if(disposed)return()=>{};
  if(!ctx)unlock();
  if(!ctx)return()=>{};
  let route=videoRoutes.get(video);
  try{
   if(!route){
    const source=ctx.createMediaElementSource(video),gain=ctx.createGain();
    gain.gain.value=0;
    source.connect(gain).connect(fx);
    route={source,gain};
    videoRoutes.set(video,route);
   }
   route.gain.gain.value=clamp(level,0,2);
   video.volume=1;
   video.muted=false;
   video.dataset.audio='original';
  }catch{return()=>{};}
  let stopped=false;
  return()=>{
   if(stopped)return;
   stopped=true;
   route.gain.gain.value=0;
   video.muted=true;
   video.dataset.audio='stopped';
  };
 }
 function stopCombat(){for(const source of combatSources)try{source.stop();}catch{}combatSources.clear();}
 function setPencil(active){if(!active){pencil?.stop();pencil=null;mix();return;}if(pencil||!ctx||ctx.state!=='running'||prefs.muted)return;pencil=playSample('pencil',fx,1.1,true);if(pencil)stats.effects.pencil=(stats.effects.pencil||0)+1;mix();}
 function forestPosition(z){if(!Number.isFinite(z)||scene!=='forest')return;forestZ=clamp(z,-10000,100000);if(ambient?.river)ramp(ambient.river.gain,riverLevel(forestZ),.8);}
 function setPreferences(update){for(const k of ['music','effects','ambience'])if(Number.isFinite(update[k]))prefs[k]=clamp(update[k]);if(typeof update.muted==='boolean')prefs.muted=update.muted;if(prefs.muted){stopCombat();setPencil(false);}persist();mix();updateButton();if(ctx&&prefs.muted)ctx.suspend().catch(()=>{});else unlock();}
 function setReading(value){reading=Boolean(value);mix();}
 function videoMix(){videoActive=[...document.querySelectorAll('video')].some(v=>!v.paused&&!v.ended&&!v.muted&&v.volume>0&&!v.hidden);mix();}
 function gesture(e){if(!e.isTrusted)return;unlock();}
 function visibility(){if(!ctx)return;if(document.hidden)ctx.suspend().catch(()=>{});else if(!prefs.muted)unlock();}
 function updateButton(){if(!button)return;button.textContent=prefs.muted?'声音：关':'声音：开';button.setAttribute('aria-pressed',String(!prefs.muted));}
 function init(){if(initialized||disposed)return;initialized=true;if(forestMusicUrl)setForestMusic(forestMusicUrl);document.addEventListener('pointerdown',gesture,true);document.addEventListener('keydown',gesture,true);document.addEventListener('visibilitychange',visibility);for(const name of ['playing','pause','ended','volumechange'])document.addEventListener(name,videoMix,true);window.addEventListener('pagehide',suspend);window.addEventListener('pageshow',visibility);
  controls=document.createElement('aside');controls.className='game-audio-controls';controls.setAttribute('aria-label','声音设置');const style=document.createElement('style');style.textContent='.game-audio-controls{position:fixed;right:12px;bottom:10px;z-index:10020;color:#eee6d5;font:12px monospace}.game-audio-controls button{padding:7px 10px;color:inherit;background:#101817dd;border:1px solid #ddd5;cursor:pointer}.game-audio-settings{position:absolute;right:0;bottom:38px;width:210px;padding:14px;background:#101817f5;border:1px solid #ddd5}.game-audio-settings label{display:grid;grid-template-columns:55px 1fr;gap:8px;align-items:center;margin:8px 0}.game-audio-settings input{width:140px;accent-color:#d5c494}.game-audio-controls [hidden]{display:none!important}';controls.append(style);button=document.createElement('button');button.type='button';button.onclick=()=>setPreferences({muted:!prefs.muted});controls.append(button);const more=document.createElement('button');more.type='button';more.textContent='音量';more.setAttribute('aria-expanded','false');const panel=document.createElement('div');panel.className='game-audio-settings';panel.hidden=true;more.onclick=()=>{panel.hidden=!panel.hidden;more.setAttribute('aria-expanded',String(!panel.hidden));};controls.append(more,panel);for(const [key,label]of [['music','音乐'],['effects','音效'],['ambience','环境']]){const row=document.createElement('label');row.textContent=label;const input=document.createElement('input');input.type='range';input.min=0;input.max=100;input.value=String(prefs[key]*100);input.setAttribute('aria-label',label+'音量');input.oninput=()=>setPreferences({[key]:Number(input.value)/100});row.append(input);panel.append(row);}document.body.append(controls);updateButton();
 }
 function suspend(){stopCombat();forestFile?.pause();customForestPlaying=false;setPencil(false);ctx?.suspend().catch(()=>{});}
 function dispose(){if(disposed)return;disposed=true;for(const[video,route]of videoRoutes){video.muted=true;route.source.disconnect();route.gain.disconnect();}videoRoutes.clear();forestFile?.pause();forestSource?.disconnect();clearInterval(clock);stopAmbience();pencil?.stop();for(const s of sources)try{s.stop();}catch{}tracks.clear();ctx?.close().catch(()=>{});controls?.remove();document.removeEventListener('pointerdown',gesture,true);document.removeEventListener('keydown',gesture,true);document.removeEventListener('visibilitychange',visibility);for(const n of ['playing','pause','ended','volumechange'])document.removeEventListener(n,videoMix,true);window.removeEventListener('pagehide',suspend);window.removeEventListener('pageshow',visibility);}
 function snapshot(){let peak=0;if(analyser&&ctx.state==='running'){const samples=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(samples);for(const s of samples)peak=Math.max(peak,Math.abs(s));}return{scene,profile,context:ctx?.state||'locked',preferences:{...prefs},tracks:[...tracks].filter(t=>!t.retiring).map(t=>t.name),bgm:[...tracks].filter(t=>!t.retiring&&t.recorded).map(t=>t.recorded),playingBgm:[...tracks].filter(t=>!t.retiring&&t.recordedPlaying).map(t=>t.recorded),activeSources:sources.size,river:riverLevel(forestZ),pencil:Boolean(pencil),reading,videoActive,peak,effects:{...stats.effects},transitions:stats.transitions,recordings:[...samples.keys()],forestMusic:[...tracks].some(t=>!t.retiring&&t.name==='forest'&&t.recordedPlaying)?'file':'none'};}
 return{init,unlock,setScene,setWonderGame,setRetry,setForestMusic,setReading,effect,bindVideoAudio,stopCombat,setPencil,forestPosition,setPreferences,suspend,dispose,snapshot,setCreation(count){built=clamp(count,0,5);}};
}
export const gameAudio=createGameAudio();
