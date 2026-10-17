const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
 try{
 const context=await browser.newContext({permissions:['camera'],viewport:{width:1440,height:900}}),page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));let uploads=0,fail=false;
 await page.addInitScript(()=>{window.cameraRequests=0;const get=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);navigator.mediaDevices.getUserMedia=(...args)=>{window.cameraRequests++;return get(...args);};});
 await page.route('**/api/avatar/config',r=>r.fulfill({json:{enabled:true,playerDailyLimit:3}}));
 await page.route('**/api/avatar/generate',async r=>{
  uploads++;assert.equal(r.request().headers()['content-type'],'image/jpeg');assert(r.request().postDataBuffer().length>100);
  await new Promise(r=>setTimeout(r,400));
  await r.fulfill({status:fail?502:200,json:fail?{error:'测试服务失败'}:{image:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAABCAYAAAD0In+KAAAAEUlEQVR4nGNgYPj/n4GBgQEACv4B/7jjPowAAAAASUVORK5CYII='}});
 });
 await page.goto(process.env.TEST_BASE_URL||'http://127.0.0.1:3001');await page.evaluate(async()=>{document.querySelector('#visual').replaceChildren();const {mountAvatar}=await import('/js/avatar.js');window.avatarFixtureDispose=mountAvatar(document.querySelector('#visual'));});
 await page.waitForFunction(()=>document.querySelector('#avatar-status').textContent.includes('每天'));
 assert.equal(await page.evaluate(()=>window.cameraRequests),0);assert.equal(uploads,0);
 await page.locator('#avatar-start').click();await page.waitForFunction(()=>document.querySelector('#avatar-camera').videoWidth>0);
 await page.locator('#avatar-take').click();await page.locator('#avatar-photo').waitFor({state:'visible'});assert.equal(uploads,0);assert(await page.locator('#avatar-notice').isVisible());
 await page.locator('#avatar-retake').click();await page.locator('#avatar-take').waitFor({state:'visible'});assert.equal(await page.evaluate(()=>window.cameraRequests),1);
 await page.locator('#avatar-take').click();await page.locator('#avatar-use').click();await page.evaluate(()=>document.querySelector('#avatar-use').click());
 await page.locator('.creation-portrait>img').waitFor();assert.equal(uploads,1);assert(await page.locator('#avatar-photo').isHidden());assert.equal(await page.locator('.creation-portrait').evaluate(e=>getComputedStyle(e).pointerEvents),'none');
 const before=await page.locator('.creation-portrait').boundingBox();await page.mouse.move(1300,250);assert.deepEqual(await page.locator('.creation-portrait').boundingBox(),before);
 // The developer preview and player photography attach the same live stream.
 await page.evaluate(async()=>{const {input}=await import('/js/input.js');await input.startCamera(document.querySelector('#camera-video'));});assert.equal(await page.evaluate(()=>window.cameraRequests),1);
 await page.locator('#avatar-change').click();await page.locator('#avatar-start').click();await page.locator('#avatar-take').click();fail=true;await page.locator('#avatar-use').click();await page.locator('#avatar-retry').waitFor({state:'visible'});
 await page.locator('#avatar-retry').click();await page.locator('#avatar-retry').waitFor({state:'visible'});assert.equal(uploads,3);await page.locator('#avatar-default').click();assert(await page.locator('.creation-portrait svg').isVisible());
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth===innerWidth),true);await page.screenshot({path:'/tmp/avatar-mobile.png'});
 await page.evaluate(async()=>{window.avatarFixtureDispose();const {input}=await import('/js/input.js');input.stopCamera();});assert.equal(await page.evaluate(()=>document.querySelector('#camera-video').srcObject.getTracks().every(t=>t.readyState==='ended')),true);
 assert.deepEqual(errors,[]);await context.close();
 const second=await browser.newContext(),p=await second.newPage();await p.goto(process.env.TEST_BASE_URL||'http://127.0.0.1:3001');await p.evaluate(async()=>{document.querySelector('#visual').replaceChildren();const {mountAvatar}=await import('/js/avatar.js');mountAvatar(document.querySelector('#visual'));});await p.waitForFunction(()=>document.querySelector('#avatar-status').textContent.includes('尚未配置'));assert(await p.locator('.creation-portrait svg').isVisible());await p.locator('#avatar-default').click();assert(await p.locator('#avatar-change').isVisible());await second.close();
 console.log('PASS camera consent, photo confirmation/no early upload, retake/shared camera, duplicate lock, transparent avatar/fixed position, explicit retry/default, cleanup/mobile, independent player and unconfigured service. Generation response was a test fixture; no paid API calls.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
