const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:1536,height:1024},recordVideo:{dir:'/workspace/artifacts/retry-effects',size:{width:1536,height:1024}}});
 const p=await context.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://localhost:3000');
 await p.evaluate(()=>localStorage.setItem('save-file-me:v1',JSON.stringify({completed:2,scene:'prologue'})));await p.reload();await p.locator('#entry-3').hover();
 await p.waitForFunction(()=>document.querySelector('.prologue-selection').dataset.target==='computer');
 const outline=await p.locator('#entry-3').evaluate(b=>{const s=getComputedStyle(b);return {outline:s.outlineWidth,bg:s.backgroundColor,shadow:s.boxShadow};});assert.equal(outline.outline,'0px');assert.equal(outline.shadow,'none');
 const sample=()=>p.locator('.prologue-selection').evaluate(c=>Array.from(c.getContext('2d').getImageData(860,315,210,155).data));
 const a=await sample();await p.screenshot({path:'/workspace/artifacts/computer-particles-start.png'});await p.waitForTimeout(5100);const b=await sample();assert.notDeepEqual(a,b);assert(a.some(n=>n));await p.screenshot({path:'/workspace/artifacts/computer-particles-end.png'});
 await p.evaluate(()=>{localStorage.setItem('save-file-me:v1',JSON.stringify({completed:3,scene:'chapter3'}));localStorage.setItem('save-file-me:retry:v1',JSON.stringify({failures:3,joined:true,won:true,view:'diary',page:3}));});await p.reload();await p.waitForSelector('#retry-painting');
 const glow=()=>p.locator('.retry-painting-glow path').evaluate(e=>getComputedStyle(e).opacity);const first=await glow();await p.waitForTimeout(950);assert.notEqual(await glow(),first);await p.screenshot({path:'/workspace/artifacts/diary-painting-glow.png'});await p.waitForTimeout(4200);
 await p.locator('#retry-painting').click();await p.waitForFunction(()=>document.querySelector('.scene-image').src.endsWith('0_3.jpg'));assert.equal(await p.locator('.prologue-player2').count(),0);await p.screenshot({path:'/workspace/artifacts/prologue-original-cursor.png'});
 assert.deepEqual(errors,[]);await context.close();await browser.close();console.log('PASS recorded > 5 s flowing COMPUTER contour particles and > 5 s painting contour breathing; no yellow frame; original source cursor preserved; painting click returns 0_3');
})().catch(e=>{console.error(e);process.exit(1)});
