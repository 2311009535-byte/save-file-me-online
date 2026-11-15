const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  for(const [built,item] of ['window','lamp','bed','computer','door'].entries()){
   const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(({built})=>{
    sessionStorage.setItem('save-file-me:opening:v1','seen');
    localStorage.setItem('save-file-me:v1',JSON.stringify({completed:3,scene:'chapter4'}));
    if(!localStorage.getItem('save-file-me:creation:v1'))localStorage.setItem('save-file-me:creation:v1',JSON.stringify({roomCreated:true,built,phase:'puzzle'}));
   },{built});
   await page.route('**/api/avatar/config*',r=>r.fulfill({json:{enabled:false}}));
   await page.goto(process.env.TEST_BASE_URL||'http://127.0.0.1:3006');
   await page.locator('#creation-hands-no').click();
   const drag=async(from,target,amount)=>{
    const a=await page.locator(from).boundingBox(),b=target?await page.locator(target).boundingBox():null,r=await page.locator('#visual').boundingBox();
    await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();
    await page.mouse.move(b?b.x+b.width/2:a.x+a.width/2,b?b.y+b.height/2:a.y+a.height/2-r.height*amount,{steps:12});await page.mouse.up();
   };
   if(item==='window'){await drag('[data-drag=star1]','[data-target=window]');assert.equal(await page.locator('[data-drag=raise]').count(),0);await drag('[data-drag=star2]','[data-target=window]');}
   if(item==='lamp'){const a=await page.locator('[data-drag=lamp]').boundingBox();await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();await page.waitForTimeout(2200);await page.mouse.up();}
   if(item==='bed')await drag('[data-drag=quilt]',null,.18);
   if(item==='computer'){assert(await page.locator('.computer-power').isDisabled());await page.locator('[data-drag=plug]').click();await page.locator('[data-target=socket]').click();await page.locator('.computer-power').click();}
   if(item==='door')await drag('[data-drag=save]','[data-target=slot]');
   await page.locator('[data-drag=raise]').waitFor();
   assert.equal(await page.locator('.creation-return').count(),0);
   const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('save-file-me:creation:v1')));
   assert.equal(state.phase,'raise');assert.equal(state.built,built);
   const history=await page.evaluate(()=>JSON.parse(localStorage.getItem('save-file-me:creation-code:v1')));
   assert(history.some(e=>e.key===`${built}:${item}:recovered`));
   await page.reload();await page.locator('#creation-hands-no').click();await page.locator('[data-drag=raise]').waitFor();
   assert.equal(await page.locator('.creation-return').count(),0);await drag('[data-drag=raise]',null,.23);
   assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('save-file-me:creation:v1')).built),built+1);
   assert.deepEqual(errors,[]);console.log(`PASS ${item}: automatic return, saved lift phase, refresh and successful build`);await page.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
