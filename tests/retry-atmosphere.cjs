const{chromium}=require('playwright'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:3005',W=1672,H=941;
const decode=file=>execFileSync('ffmpeg',['-v','error','-i',file,'-frames:v','1','-vf','scale=1672:941:flags=neighbor','-threads','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1'],{maxBuffer:10*1024*1024});
function changes(a,b,[x,y,w,h],threshold=4){let count=0;for(let py=y;py<y+h;py++)for(let px=x;px<x+w;px++){const i=(py*W+px)*3;if(Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2])>threshold)count++;}return count;}
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});try{
 const p=await b.newPage({viewport:{width:W,height:1100}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{sessionStorage.setItem('save-file-me:opening:v1','seen');if(!localStorage.getItem('ambient-test-seeded')){localStorage.setItem('ambient-test-seeded','yes');localStorage.setItem('save-file-me:v1',JSON.stringify({completed:2,scene:'chapter3'}));localStorage.setItem('save-file-me:retry:v1',JSON.stringify({failures:0,view:'battle'}));}});
 const ready=async()=>{await p.waitForSelector('.retry-atmosphere',{timeout:60000});await p.waitForFunction(()=>!document.body.classList.contains('chapter-intro-active'));await p.waitForSelector('#retry-attack');};
 const freeze=async t=>p.locator('.retry-atmosphere').evaluate((root,t)=>{for(const a of root.getAnimations({subtree:true})){a.pause();a.currentTime=t;}},t);
 const shot=async name=>{const file='/tmp/retry-ambient-'+name+'.png';await p.locator('#visual').screenshot({path:file});const buffer=decode(file);assert.equal(buffer.length,W*H*3);return buffer;};
 await p.goto(base);await ready();await freeze(0);const rest=await shot('rest');
 assert.equal(await p.locator('.retry-atmosphere').count(),1);assert.equal(await p.locator('[data-boss-part]').count(),3);assert.equal(await p.locator('[data-atmosphere-kind=tower-piece]').count(),10);assert.equal(await p.locator('[data-atmosphere-kind=rubble]').count(),14);assert.equal(await p.locator('[data-atmosphere-kind=paper-lightning]').count(),2);
 await freeze(1350);const tear=await shot('tear');assert(changes(rest,tear,[490,0,220,285])>1500,'The torn paper lightning must visibly open');assert(changes(rest,tear,[740,20,790,270])>1500,'The claws and torso must move');
 await freeze(4800);const fallen=await shot('fallen');assert(changes(rest,fallen,[460,290,260,270])>8000,'The building must fall in separate pieces');
 await freeze(9000);const rebuilt=await shot('rebuilt');assert(changes(rest,rebuilt,[485,290,210,245])<changes(rest,fallen,[485,290,210,245])*.15,'The building must reconstruct');
 for(const buffer of [tear,fallen,rebuilt])for(const rect of [[0,0,480,175],[790,700,670,230],[1390,310,230,370],[0,710,650,220]])assert.equal(changes(rest,buffer,rect),0,'Health, cards, phone and player art are protected');
 assert.equal(await p.locator('.retry-atmosphere').evaluate(el=>getComputedStyle(el).pointerEvents),'none');
 // Normal card interactions and the original video must take over cleanly.
 await p.locator('#retry-defend').click();await p.waitForSelector('.retry-boss-warning');assert.equal(await p.locator('.retry-atmosphere').count(),1);
 assert(await p.locator('.retry-atmosphere').evaluate(el=>el.getAnimations({subtree:true}).some(a=>a.playbackRate===1.6)));
 await p.waitForSelector('.retry-action-video');assert.equal(await p.locator('.retry-atmosphere').count(),0);await p.waitForSelector('#retry-again',{timeout:20000});assert.equal(await p.locator('.retry-atmosphere').count(),0);assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('save-file-me:retry:v1')).failures),1);
 // The duo's larger original source must share the same visible coordinate system.
 await p.evaluate(()=>localStorage.setItem('save-file-me:retry:v1',JSON.stringify({failures:3,joined:true,view:'battle'})));await p.reload();await ready();assert.equal(await p.locator('.retry-atmosphere').getAttribute('data-source'),'3_9.JPG');await freeze(4800);await shot('duo');
 const rects=await p.evaluate(()=>{const a=document.querySelector('.retry-atmosphere').getBoundingClientRect(),v=document.querySelector('#visual').getBoundingClientRect();return{dw:a.width-v.width,dh:a.height-v.height};});assert(Math.abs(rects.dw)<1&&Math.abs(rects.dh)<1,JSON.stringify(rects));
 await p.setViewportSize({width:390,height:844});await p.screenshot({path:'/tmp/retry-ambient-mobile.png'});assert(await p.locator('#retry-attack').isEnabled());assert(await p.evaluate(()=>document.documentElement.scrollWidth===innerWidth));
 await p.emulateMedia({reducedMotion:'reduce'});await p.waitForFunction(()=>!document.querySelector('.retry-atmosphere'));assert.match(await p.locator('.scene-image').getAttribute('src'),/3_9.JPG/);
 await p.emulateMedia({reducedMotion:'no-preference'});await p.waitForSelector('.retry-atmosphere');assert.equal(await p.locator('.retry-atmosphere').count(),1);
 await p.evaluate(()=>localStorage.setItem('save-file-me:v1',JSON.stringify({completed:2,scene:'prologue'})));await p.reload();await p.waitForSelector('#entry-3');assert.equal(await p.locator('.retry-atmosphere').count(),0);assert.deepEqual(errors,[]);
 console.log('PASS native paper lightning, separate boss parts, building collapse/rebuild and rubble; pixel-protected UI/player/phone; card lock and original boss video/defeat; duo alignment, mobile, live reduced motion and scene cleanup');
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
