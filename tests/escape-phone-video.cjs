const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const p=await b.newPage({viewport:{width:1440,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(process.env.TEST_BASE_URL||'http://127.0.0.1:3002',{waitUntil:'domcontentloaded'});await p.keyboard.press('Shift+KeyD');await p.locator('[data-jump="2"]').click();await p.keyboard.press('Escape');
 const settle=()=>p.waitForFunction(()=>document.querySelector('#stage').dataset.escapeView!=='loading'&&!document.querySelector('#stage').dataset.motion);
 await settle();let fail=true;await p.route('**/assets/escape/videos/phone_enter.mp4',r=>fail?r.abort():r.continue());
 await p.locator('#escape-phone').click();await p.locator('.wonder-video-loading button').waitFor();assert.equal(await p.locator('#stage').getAttribute('data-escape-view'),'room');fail=false;await p.locator('.wonder-video-loading button').click();
 await p.waitForFunction(()=>{const v=document.querySelector('.escape-video-overlay video');return v&&!v.paused&&v.currentTime>0;});assert.equal(await p.locator('#stage').getAttribute('data-escape-view'),'room');
 assert.equal(await p.getByText('LOADING ANIMATION',{exact:false}).count(),0);assert.equal(await p.locator('#back').textContent(),'BACK');await p.locator('#escape-phone').dispatchEvent('click');assert.equal(await p.locator('.escape-video-overlay video').count(),1);
 await settle();assert.equal(await p.locator('#stage').getAttribute('data-escape-view'),'phone');assert.equal(await p.locator('.escape-message').count(),2);assert.deepEqual(await p.evaluate(()=>JSON.parse(localStorage.getItem('save-file-me:escape:v1')).messages),[false,false]);
 await p.locator('#back').click();await settle();assert.equal(await p.locator('#stage').getAttribute('data-escape-view'),'room');
 await p.locator('#escape-phone').click();await p.waitForFunction(()=>document.querySelector('.escape-video-overlay video')?.currentTime>0);await p.locator('#back').click();await settle();await p.waitForTimeout(4500);assert.equal(await p.locator('#stage').getAttribute('data-escape-view'),'room');assert.equal(await p.locator('.escape-video-overlay').count(),0);
 await p.locator('#back').click();await p.waitForFunction(()=>JSON.parse(localStorage.getItem('save-file-me:v1')).scene==='prologue');assert.equal(await p.locator('.escape-video-overlay').count(),0);assert.deepEqual(errors,[]);
 console.log('PASS uploaded phone clip plays, retries after failure, does not solve notifications, preserves return and cancels without late navigation.');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
