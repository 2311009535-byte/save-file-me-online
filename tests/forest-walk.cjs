const {chromium}=require('playwright'),assert=require('node:assert/strict');
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:3005';
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});try{
 const page=await browser.newPage({viewport:{width:1100,height:760},reducedMotion:'reduce'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{sessionStorage.setItem('save-file-me:opening:v1','seen');if(!localStorage.getItem('forest-walk-seeded')){localStorage.setItem('forest-walk-seeded','yes');localStorage.setItem('save-file-me:v1',JSON.stringify({completed:1,scene:'chapter2'}));localStorage.setItem('save-file-me:escape:v1',JSON.stringify({view:'game',exam:true,messages:[true,true],floorVersion:2,papers:Array(7).fill(true)}));}});
 await page.goto(base);
 await page.waitForFunction(()=>document.querySelector('.escape-parallax')?.dataset.ready==='true',null,{timeout:90000});
 const frame=page.frames().find(f=>f.url().includes('forest-bridge-study.html'));
 assert(frame,'Real chapter two forest mounted');console.log('Forest ready');const value=key=>frame.evaluate(key=>Number(document.body.dataset[key]),key);
 assert.equal(await value('cameraZ'),300);
 await frame.locator('[data-look=sky]').click();await frame.waitForFunction(()=>Number(document.body.dataset.cameraPitch)>.21);
 assert.equal(await value('cameraZ'),300);await page.screenshot({path:'/tmp/forest-walk-game-sky.png'});
 await frame.locator('[data-look=flowers]').click();await frame.waitForFunction(()=>Number(document.body.dataset.cameraPitch)<.10&&Math.abs(Number(document.body.dataset.cameraYaw))>.10);assert.equal(await value('cameraZ'),300);
 await page.screenshot({path:'/tmp/forest-walk-game-flowers.png'});
 await frame.locator('[data-look=path]').click();await frame.waitForFunction(()=>Math.abs(Number(document.body.dataset.cameraPitch))<.001);
 const canvas=frame.locator('#view > canvas').first(),box=await canvas.boundingBox();
 await page.mouse.move(box.x+box.width*.5,box.y+box.height*.45);await page.mouse.down();await page.mouse.move(box.x+box.width*.7,box.y+box.height*.60,{steps:3});await page.mouse.up();
 await frame.waitForFunction(()=>Number(document.body.dataset.cameraYaw)<-.15&&Number(document.body.dataset.cameraPitch)>.07);
 await page.keyboard.press('KeyR');await frame.waitForFunction(()=>Math.abs(Number(document.body.dataset.cameraYaw))<.001);
 await page.keyboard.down('KeyW');await frame.waitForFunction(()=>Number(document.body.dataset.cameraZ)>440,null,{timeout:20000});await page.keyboard.up('KeyW');
 await page.waitForTimeout(500);const stopped=await value('cameraZ');await page.waitForTimeout(600);assert.equal(await value('cameraZ'),stopped,'Releasing W stops the walk');
 await page.mouse.wheel(0,900);await page.waitForTimeout(500);assert.equal(await value('cameraZ'),stopped,'Wheel no longer drives movement');
 await page.keyboard.down('KeyS');await frame.waitForFunction(z=>Number(document.body.dataset.cameraZ)<z-35,stopped,{timeout:10000});await page.keyboard.up('KeyS');
 await page.keyboard.down('KeyD');await frame.waitForFunction(()=>Number(document.body.dataset.cameraX)>30,null,{timeout:10000});await page.keyboard.up('KeyD');
 // A lost keyup must not leave the walker moving when the iframe loses focus.
 await page.keyboard.down('KeyW');await frame.evaluate(()=>window.dispatchEvent(new Event('blur')));await page.keyboard.up('KeyW');await page.waitForTimeout(300);const blurred=await value('cameraZ');await page.waitForTimeout(400);assert.equal(await value('cameraZ'),blurred);
 // Touch controls are real hold controls, and remain reachable in portrait.
 await page.setViewportSize({width:390,height:844});await frame.locator('[data-look=path]').click();const forward=frame.locator('[data-move=forward]');await forward.waitFor({state:'visible'});const touchBox=await forward.boundingBox();assert(touchBox.y+touchBox.height<=844);
 await page.mouse.move(touchBox.x+touchBox.width/2,touchBox.y+touchBox.height/2);await page.mouse.down();await frame.waitForFunction(z=>Number(document.body.dataset.cameraZ)>z+30,blurred,{timeout:10000});await forward.dispatchEvent('pointercancel',{pointerId:1,pointerType:'mouse'});await page.mouse.up();
 await page.waitForTimeout(300);const released=await value('cameraZ');await page.waitForTimeout(400);assert.equal(await value('cameraZ'),released);
 await page.screenshot({path:'/tmp/forest-walk-game-mobile.png'});
 console.log('Movement, look, focus and mobile controls passed');await page.setViewportSize({width:1100,height:760});await canvas.focus();await page.keyboard.down('ArrowUp');
 await frame.waitForFunction(()=>Number(document.body.dataset.cameraZ)>6030,null,{timeout:180000});await page.keyboard.up('ArrowUp');
 await frame.locator('[data-look=sky]').click();await frame.waitForFunction(()=>Number(document.body.dataset.cameraPitch)>.21);
 // Door hit target follows the pitched view, rather than staying at its old position.
 const projected=await frame.evaluate(async()=>{const {projectForestPoint}=await import('/js/forest-walk.js');const d=document.body.dataset;const c={x:+d.cameraX,y:105,z:+d.cameraZ,yaw:+d.cameraYaw,pitch:+d.cameraPitch};const p=projectForestPoint(c,-680,80,6500),r=document.querySelector('canvas').getBoundingClientRect();return{x:r.left+p.x*r.width/1672,y:r.top+p.y*r.width/1672};});
 await frame.waitForFunction(({x,y})=>document.elementFromPoint(x,y)?.id==='forest-door-enter',projected);
 await page.screenshot({path:'/tmp/forest-walk-game-door.png'});
 await frame.locator('#forest-door-enter').click();await page.waitForFunction(()=>JSON.parse(localStorage.getItem('save-file-me:v1')).completed>=2,null,{timeout:20000});
 assert.equal(await page.locator('.escape-parallax').count(),0,'Completion disposes the forest iframe');
 assert.equal(await page.locator('.forest-walk-controls').count(),0);// Ordinary motion eases the look; restarting and the reference overlay do not auto-walk.
 await page.emulateMedia({reducedMotion:'no-preference'});await page.goto(base+'/forest-bridge-study.html');await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:60000});
 await page.locator('[data-look=sky]').click();await page.waitForFunction(()=>Number(document.body.dataset.cameraPitch)>.21);assert.equal(await page.evaluate(()=>Number(document.body.dataset.cameraZ)),300);
 await page.locator('#restart').click();await page.waitForFunction(()=>Math.abs(Number(document.body.dataset.cameraPitch))<.001);
 await page.locator('#original').click();await page.keyboard.down('KeyW');await page.waitForTimeout(400);await page.keyboard.up('KeyW');assert.equal(await page.evaluate(()=>Number(document.body.dataset.cameraZ)),300);
 // Shared bridge renderer keeps its standalone scroll controls.
 await page.goto(base+'/road-bridge-study.html');await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:60000});
 await page.locator('#scroll').focus();await page.mouse.wheel(0,900);await page.waitForFunction(()=>Number(document.body.dataset.progress)>.001);
 assert.deepEqual(errors,[]);
 console.log('PASS real embedded forest: held keyboard movement, stop/reverse/sidestep, wheel disabled, drag/sky/flower look, recenter, blur reset, touch hold/cancel, actual route endpoint and pitched door return');
 }finally{await browser.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
