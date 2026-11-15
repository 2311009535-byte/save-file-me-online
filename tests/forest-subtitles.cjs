const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const p=await b.newPage({viewport:{width:1100,height:760},reducedMotion:'reduce'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{sessionStorage.setItem('save-file-me:opening:v1','seen');localStorage.setItem('save-file-me:v1',JSON.stringify({completed:1,scene:'chapter2'}));localStorage.setItem('save-file-me:escape:v1',JSON.stringify({view:'game',exam:true,messages:[true,true],floorVersion:2,papers:Array(7).fill(true)}));});
 await p.goto(process.env.TEST_BASE_URL||'http://127.0.0.1:3000');await p.waitForFunction(()=>document.querySelector('.escape-parallax')?.dataset.ready==='true',null,{timeout:90000});
 const f=p.frames().find(f=>f.url().includes('forest-bridge-study.html'));assert.equal(await p.locator('.escape-story').count(),0);
 await f.locator('canvas').first().focus();await p.keyboard.down('KeyW');await f.waitForFunction(()=>document.body.dataset.observation==='pink-flowers'&&document.body.dataset.observationPhase==='holding',null,{timeout:60000});await p.keyboard.up('KeyW');
 for(const viewport of [{width:1100,height:760},{width:390,height:844}]){await p.setViewportSize(viewport);assert.equal(await p.locator('.escape-story').count(),0);assert.equal(await f.locator('.forest-observation p').textContent(),'A little pink, growing by the path.');assert(await f.locator('.forest-observation').isVisible());await p.screenshot({path:`/tmp/forest-subtitles-${viewport.width}.png`});}
 assert.deepEqual(errors,[]);console.log('PASS embedded forest retains its observation subtitle without duplicate outer narration on desktop and mobile');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
