const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});try{
 const context=await b.newContext({viewport:{width:1669,height:942}}),p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{sessionStorage.setItem('save-file-me:opening:v1','seen');localStorage.setItem('save-file-me:v1',JSON.stringify({completed:0,scene:'chapter1'}));});
 await p.goto(process.env.TEST_BASE_URL||'http://127.0.0.1:3005');
 await p.waitForFunction(()=>document.querySelectorAll('.wonder-wall-paper[data-angle]').length===13&&document.querySelector('.wonder-room-atmosphere')?.dataset.motion==='running'&&!document.querySelector('.chapter-intro'));
 const samples=()=>p.locator('.wonder-wall-paper').evaluateAll(es=>es.map(e=>[e.dataset.paper,Number(e.dataset.displacement)]));
 const first=await samples(),clock=Number(await p.locator('.wonder-room-atmosphere').getAttribute('data-clock-seconds'));
 await p.waitForTimeout(1200);const second=await samples();assert(second.every(([id,value],i)=>id===first[i][0]&&value!==first[i][1]));assert(new Set(second.map(e=>e[1])).size>10);
 assert(Number(await p.locator('.wonder-room-atmosphere').getAttribute('data-clock-seconds'))>clock+1);assert.equal(await p.locator('.wonder-room-atmosphere').getAttribute('data-dust-count'),'15');
 // No effect draws into either toy region, including across animated frames.
 for(const rect of [[346,530,96,58],[1314,405,42,70]])assert(await p.locator('.wonder-room-atmosphere,.wonder-wall-paper,.wonder-note-breeze').evaluateAll((es,r)=>es.every(c=>{const pixels=c.getContext('2d').getImageData(...r).data;return !pixels.some((v,i)=>i%4===3&&v);}),rect));
 const crops=()=>p.locator('.wonder-room-atmosphere').evaluate(c=>[[10,160,75,380],[1236,186,76,76],[1080,430,100,72]].map(r=>Array.from(c.getContext('2d').getImageData(...r).data)));
 const before=await crops();await p.waitForTimeout(1200);const after=await crops();for(let i=0;i<3;i++)assert.notDeepEqual(after[i],before[i],['curtain','clock','dust'][i]+' must change');
 await p.screenshot({path:'/tmp/wonder-room-atmosphere.png'});
 await p.locator('#wonder-note').click();await p.waitForFunction(()=>document.querySelector('#stage').dataset.wonderView==='note'&&!document.querySelector('#stage').dataset.motion);
 assert.equal(await p.locator('.wonder-room-atmosphere,.wonder-wall-paper').count(),0);assert.match(await p.locator('.wonder-reflection').textContent(),/hill behind our school/);
 await p.waitForFunction(()=>document.querySelector('#stage').dataset.wonderView==='room'&&!document.querySelector('#stage').dataset.motion);await p.waitForFunction(()=>document.querySelector('.wonder-room-atmosphere')?.dataset.motion==='running');
 assert(await p.evaluate(()=>JSON.parse(localStorage.getItem('save-file-me:wonder:v1')).done.note));
 await p.emulateMedia({reducedMotion:'reduce'});await p.reload();await p.waitForFunction(()=>document.querySelector('.wonder-room-atmosphere')?.dataset.motion==='static');assert.equal(await p.locator('.wonder-room-atmosphere').getAttribute('data-dust-count'),'0');const still=await samples();await p.waitForTimeout(200);assert.deepEqual(await samples(),still);assert.deepEqual(errors,[]);
 console.log('PASS independent wall papers, advancing clock, curtain/dust animation, untouched toys, detail cleanup, unchanged reflection/auto-return and reduced motion');
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
