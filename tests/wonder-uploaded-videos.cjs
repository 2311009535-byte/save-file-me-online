const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const p=await b.newPage({viewport:{width:1440,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(process.env.TEST_BASE_URL||'http://127.0.0.1:3002',{waitUntil:'domcontentloaded'});await p.keyboard.press('Shift+KeyD');await p.locator('[data-jump="1"]').click();await p.keyboard.press('Escape');
 const settle=()=>p.waitForFunction(()=>!document.querySelector('#stage').dataset.motion);
 await settle();
 let failWindow=true;await p.route('**/assets/wonder/videos/window_enter.mp4',async route=>{if(failWindow)return route.abort();await new Promise(resolve=>setTimeout(resolve,500));return route.continue();});
 for(const name of ['window','box']){
  await p.locator('#wonder-'+name).click();if(name==='window'){await p.locator('.wonder-video-loading button').waitFor();assert.equal(await p.locator('#stage').getAttribute('data-wonder-view'),'room');failWindow=false;await p.locator('.wonder-video-loading button').click();await p.waitForTimeout(100);assert.equal(await p.locator('.wonder-video-overlay').count(),0,'loading must preserve the room without an overlay');assert.equal(await p.getByText('LOADING ANIMATION',{exact:false}).count(),0);}await p.waitForFunction(()=>{const v=document.querySelector('.wonder-video-overlay video');return v&&!v.paused&&v.currentTime>0;});
  assert.equal(await p.locator('#stage').getAttribute('data-wonder-view'),'room');assert.equal(await p.locator('.wonder-video-overlay video').count(),1);await p.locator('#wonder-'+name).dispatchEvent('click');assert.equal(await p.locator('.wonder-video-overlay video').count(),1);await settle();
  assert.equal(await p.locator('#stage').getAttribute('data-wonder-view'),name);assert.equal(await p.evaluate(n=>JSON.parse(localStorage.getItem('save-file-me:wonder:v1')).done[n],name),false,'transition cannot solve the puzzle');
  if(name==='window'){await p.locator('#wonder-meteor').click();await p.waitForFunction(()=>JSON.parse(localStorage.getItem('save-file-me:wonder:v1')).done.window);}else{await p.locator('#wonder-sword').click();await p.waitForFunction(()=>JSON.parse(localStorage.getItem('save-file-me:wonder:v1')).done.box);}
  await p.locator('#back').click();await settle();assert.equal(await p.locator('#stage').getAttribute('data-wonder-view'),'room');
 }
 await p.locator('#wonder-window').click();await p.locator('.wonder-video-overlay').waitFor();await p.locator('#back').click();await settle();await p.waitForTimeout(4500);assert.equal(await p.locator('#stage').getAttribute('data-wonder-view'),'room');assert.equal(await p.locator('.wonder-video-overlay').count(),0);
 assert.deepEqual(errors,[]);console.log('PASS failed video loading stays in room and retries; uploaded window/box clips play, complete, retain unsolved puzzles, return and cancel safely.');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
