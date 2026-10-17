const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const p=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://localhost:3000');
for(const joined of [false,true]){
 await p.evaluate(joined=>{localStorage.setItem('save-file-me:v1',JSON.stringify({completed:2,scene:'chapter3'}));localStorage.setItem('save-file-me:retry:v1',JSON.stringify({failures:joined?3:0,joined,won:false,view:'battle'}));},joined);await p.reload();await p.waitForSelector('#retry-attack');
 for(const size of [{width:1440,height:900},{width:640,height:600}]){
  await p.setViewportSize(size);await p.mouse.move(10,10);await p.waitForTimeout(220);const rect=await p.locator('#stage').boundingBox();const region={x:Math.ceil(rect.x),y:Math.ceil(rect.y),width:Math.floor(rect.width),height:Math.floor(rect.height*.70)};const background=await p.screenshot({clip:region});
  for(const name of ['attack','defend','heal']){
   await p.locator('#retry-'+name).hover();await p.waitForTimeout(220);assert.equal(await p.locator('.retry-card-art.is-selected').count(),1);assert.equal(await p.locator('.retry-card-art.is-selected').getAttribute('data-card'),name);
   const css=await p.locator('.retry-card-art.is-selected').evaluate(c=>{const s=getComputedStyle(c);return {transform:s.transform,filter:s.filter,opacity:s.opacity};});assert.match(css.transform,/1\.045/);assert.equal(css.opacity,'1');assert.match(css.filter,/1\.18/);assert.equal(await p.locator('#retry-'+name).evaluate(b=>getComputedStyle(b).outlineWidth),'0px');
   assert.equal(await p.locator('#stage').getAttribute('data-retry-view'),'battle');assert.deepEqual(await p.screenshot({clip:region}),background);
   if(size.width===1440&&name==='defend')await p.screenshot({path:`/workspace/artifacts/retry-hover-${joined?'joined':'solo'}.png`});
  }
  await p.mouse.move(10,10);await p.waitForTimeout(220);assert.equal(await p.locator('.retry-card-art.is-selected').count(),0);assert.equal(await p.locator('.retry-card-art').first().evaluate(c=>getComputedStyle(c).opacity),'0');
 }
 await p.locator('#retry-attack').click();await p.waitForFunction(()=>document.getElementById('stage').dataset.retryView==='action');assert.equal(await p.locator('.retry-card-art.is-selected').count(),0);for(const name of ['attack','defend','heal'])assert(await p.locator('#retry-'+name).isDisabled());await p.evaluate(()=>{for(let i=0;i<20;i++)document.querySelector('#retry-heal').click();});await p.waitForSelector(joined?'#retry-continue':'#retry-again');assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('save-file-me:retry:v1')).failures),joined?3:1);
}
assert.deepEqual(errors,[]);await browser.close();console.log('PASS solo/joined: independent contour hover at desktop/small viewport; smooth reset; background unchanged; hover never triggers battle; click locks all cards and guards repeats');})().catch(e=>{console.error(e);process.exit(1)});
