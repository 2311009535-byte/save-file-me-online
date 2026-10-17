const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--enable-unsafe-swiftshader']});
 try{
 const p=await browser.newPage({permissions:['camera'],viewport:{width:1440,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{window.cameraRequests=0;const get=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);navigator.mediaDevices.getUserMedia=(...a)=>{window.cameraRequests++;return get(...a);};});
 await p.goto(process.env.TEST_BASE_URL||'http://127.0.0.1:3002');await p.keyboard.press('Shift+KeyD');await p.locator('[data-jump="4"]').click();await p.keyboard.press('Escape');await p.locator('#creation-photo').click();await p.locator('#avatar-start').click();await p.waitForFunction(()=>document.querySelector('#avatar-camera').videoWidth>0);await p.locator('#avatar-default').click();await p.locator('#avatar-continue').click();
 let frames=0;await p.exposeFunction('testFrameObserved',()=>frames++);
 await p.addScriptTag({url:'/vendor/mediapipe-hands/hands.js'});
 await p.evaluate(()=>{const RealHands=window.Hands;window.Hands=class extends RealHands{onResults(callback){super.onResults(r=>{window.testFrameObserved();return callback(r);});}};});
 await p.locator('#hand-start').click();await p.waitForFunction(()=>document.querySelector('#hand-status').textContent.includes('Tracking ready'),{},{timeout:60000});
 await p.waitForFunction(()=>document.querySelector('#hand-camera').videoWidth>0);for(let i=0;i<100&&frames<3;i++)await p.waitForTimeout(100);
 assert(frames>=3,'real MediaPipe model must process camera frames');assert.equal(await p.evaluate(()=>window.cameraRequests),1);
 await p.locator('#hand-stop').click();await p.waitForFunction(()=>document.querySelector('#hand-camera').srcObject.getTracks().every(t=>t.readyState==='ended'));assert.deepEqual(errors,[]);
 console.log('PASS real bundled MediaPipe WASM/model initialization and '+frames+' fake-camera frames, shared stream and stop cleanup. Human hand accuracy still requires a real camera test.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
