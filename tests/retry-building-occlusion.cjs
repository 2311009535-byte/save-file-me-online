const {chromium}=require('playwright'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const W=1672,H=941,decode=file=>execFileSync('ffmpeg',['-v','error','-i',file,'-frames:v','1','-vf','scale=1672:941:flags=neighbor','-threads','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1'],{maxBuffer:10*1024*1024});
(async()=>{const {RETRY_ATMOSPHERE_ART}=await import('../public/js/retry-atmosphere-art.js'),{buildingSillY,buildingLayers}=await import('../public/js/retry-atmosphere-layers.js');const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const p=await browser.newPage({viewport:{width:W,height:1100}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.addInitScript(()=>{sessionStorage.setItem('save-file-me:opening:v1','seen');localStorage.setItem('save-file-me:v1',JSON.stringify({completed:2,scene:'chapter3'}));if(!localStorage.getItem('save-file-me:retry:v1'))localStorage.setItem('save-file-me:retry:v1',JSON.stringify({failures:0,view:'battle'}));});
 for(const [file,art]of Object.entries(RETRY_ATMOSPHERE_ART)){
  await p.goto(process.env.TEST_BASE_URL||'http://127.0.0.1:3005');if(file==='3_9.JPG'){await p.evaluate(()=>localStorage.setItem('save-file-me:retry:v1',JSON.stringify({failures:3,joined:true,view:'battle'})));await p.reload();}
  await p.waitForSelector('.retry-atmosphere');await p.waitForFunction(()=>!document.body.classList.contains('chapter-intro-active'));
  await p.locator('.retry-atmosphere').evaluate(root=>{for(const a of root.getAnimations({subtree:true})){a.pause();const t=a.effect.getTiming();a.currentTime=t.delay+t.duration*(a.effect.target.dataset.atmosphereKind==='building-withdraw'?.21:0);}for(const slot of root.querySelectorAll('.retry-building-slot'))slot.style.visibility='hidden';});
  const capture=async name=>{const f='/tmp/retry-occlusion-'+name+'.png';await p.locator('#visual').screenshot({path:f});return decode(f);};const base=await capture(file+'-base');
  const order=await p.locator('.retry-building-slot').evaluateAll(es=>es.map(e=>Number(e.dataset.building)));assert.equal(new Set(order).size,art.towers.length);
  for(const index of order){
   const slot=p.locator(`.retry-building-slot[data-building="${index}"]`);await slot.evaluate(e=>e.style.visibility='visible');const frame=await capture(file+'-'+index),layer=buildingLayers(art).find(t=>t.index===index),[x,y,w,h]=layer.slot;let above=0,below=0;
   for(let py=y;py<y+h;py++)for(let px=x;px<x+w;px++){const k=(py*W+px)*3,delta=Math.abs(frame[k]-base[k])+Math.abs(frame[k+1]-base[k+1])+Math.abs(frame[k+2]-base[k+2]);if(delta<15)continue;if(py>=buildingSillY(layer.ground,px)+2)below++;else above++;}
   assert.equal(below,0,`${file} tower ${index} paints through its foreground roof/cliff`);
   if((file==='3_1.png'&&index===1)||(file==='3_9.JPG'&&index===4))assert(above>1000,'Partly descended main left tower must still be visible above the ridge');
   await slot.evaluate(e=>e.style.visibility='hidden');
  }
  if(file==='3_9.JPG'){
   const rear=p.locator('.retry-building-slot[data-building="2"]'),front=p.locator('.retry-building-slot[data-building="1"]');
   await front.evaluate(e=>{e.style.visibility='visible';const a=e.firstChild.getAnimations()[0];a.currentTime=a.effect.getTiming().delay;});const frontOnly=await capture('front-rest');
   await rear.evaluate(e=>{e.style.visibility='visible';const a=e.firstChild.getAnimations()[0],t=a.effect.getTiming();a.currentTime=t.delay+t.duration*.19;});const behind=await capture('rear-behind-roof');
   let leak=0;for(let y=540;y<575;y++)for(let x=350;x<370;x++){const k=(y*W+x)*3;if(Math.abs(frontOnly[k]-behind[k])+Math.abs(frontOnly[k+1]-behind[k+1])+Math.abs(frontOnly[k+2]-behind[k+2])>15)leak++;}assert.equal(leak,0,'Rear tower must disappear at the front roof, not paint over its facade');
   await front.evaluate(e=>{const a=e.firstChild.getAnimations()[0],t=a.effect.getTiming();a.currentTime=t.delay+t.duration*.37;});const revealed=await capture('front-withdrawn-rear-visible');await rear.evaluate(e=>e.style.visibility='hidden');const noRear=await capture('front-withdrawn-no-rear');let visible=0;for(let y=515;y<605;y++)for(let x=350;x<390;x++){const k=(y*W+x)*3;if(Math.abs(noRear[k]-revealed[k])+Math.abs(noRear[k+1]-revealed[k+1])+Math.abs(noRear[k+2]-revealed[k+2])>15)visible++;}assert(visible>100,'Moving the front tower must remove its old roof barrier');
  }
  await p.locator('.retry-building-slot').evaluateAll(es=>es.forEach(e=>e.style.visibility=''));
  for(const phase of [.19,.24,.53,.58]){await p.locator('[data-atmosphere-kind=building-withdraw]').evaluateAll((es,t)=>es.forEach(e=>{const a=e.getAnimations()[0],s=a.effect.getTiming();a.currentTime=s.delay+s.duration*t;}),phase);await capture(file+'-all-'+phase);}
 }
 assert.deepEqual(errors,[]);console.log('PASS all 29 towers: no pixels below native foreground contours during partial descent; solo/duo main left towers remain visible above the ridge; moving foreground roof occlusion and reveal; rise/descent visual captures');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
