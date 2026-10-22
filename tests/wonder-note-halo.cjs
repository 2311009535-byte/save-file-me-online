const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});try{
 const p=await browser.newPage({viewport:{width:1669,height:942}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{sessionStorage.setItem('save-file-me:opening:v1','seen');localStorage.setItem('save-file-me:v1',JSON.stringify({scene:'chapter1',completed:0}));});await p.goto(process.env.TEST_BASE_URL||'http://127.0.0.1:3005');
 await p.waitForFunction(()=>document.querySelector('.contour-light[data-object=note]')&&!document.querySelector('.chapter-intro'));
 // A fresh save must show a bright halo without hovering or clicking.
 assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('save-file-me:wonder:v1'))?.done?.note===true),false);
 for(let n=0;n<3;n++){
  const pixels=await p.locator('.contour-light[data-object=note]').evaluate(c=>{const d=c.getContext('2d').getImageData(1035,327,74,77).data;let bright=0;for(let i=0;i<d.length;i+=4)if(d[i]>220&&d[i+1]>200&&d[i+3]>140)bright++;return bright;});assert(pixels>150,'visible bright halo before interaction');await p.waitForTimeout(450);
 }
 assert.equal(await p.locator('.wonder-wall-paper,.wonder-note-breeze,.wonder-note-wind-hint').count(),0);await p.screenshot({path:'/tmp/wonder-note-halo-fixed.png'});
 await p.locator('#wonder-note').click();await p.waitForFunction(()=>document.querySelector('#stage').dataset.wonderView==='note'&&!document.querySelector('#stage').dataset.motion);assert.equal(await p.locator('.wonder-note-wind-hint').count(),0);assert.match(await p.locator('.wonder-reflection').textContent(),/hill behind our school/);
 await p.waitForFunction(()=>document.querySelector('#stage').dataset.wonderView==='room'&&!document.querySelector('#stage').dataset.motion);await p.waitForFunction(()=>document.querySelector('.wonder-clean-room')?.dataset.completed.includes('note'));
 assert(await p.evaluate(()=>JSON.parse(localStorage.getItem('save-file-me:wonder:v1')).done.note));assert.equal(await p.locator('.wonder-note-wind-hint').count(),0);assert.equal(await p.locator('.contour-light[data-object=note],.wonder-note-breeze').count(),0);assert.deepEqual(errors,[]);
 console.log('PASS untouched-save bright note halo, transparent surrounding wall, unchanged caption/automatic return, completed hint removal and no page errors');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
