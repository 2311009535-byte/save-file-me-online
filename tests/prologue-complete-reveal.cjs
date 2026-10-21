const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(process.env.TEST_BASE_URL||'http://127.0.0.1:3005');await page.waitForFunction(()=>document.querySelector('.prologue-assembly')?.dataset.frame);
 const move=async(x,y)=>{const r=await page.locator('#stage').boundingBox();await page.mouse.move(r.x+r.width*x/1536,r.y+r.height*y/1024);};
 for(const [id,box]of [['computer',[774,320,395,364]],['bed',[102,557,342,285]],['door',[1231,691,145,153]]]){
  await move(box[0]+box[2]/2,box[1]+box[3]/2);await page.waitForTimeout(1750);assert.equal(await page.locator('.prologue-assembly').getAttribute('data-'+id+'-progress'),'1.000');
  const missing=await page.evaluate(async box=>{const im=document.querySelector('.scene-image');await im.decode();const source=document.createElement('canvas');source.width=1536;source.height=1024;const ctx=source.getContext('2d');ctx.drawImage(im,0,0);const original=ctx.getImageData(...box).data,actual=document.querySelector('.prologue-assembly').getContext('2d').getImageData(...box).data;let total=0,missing=0;for(let i=0;i<original.length;i+=4)if(Math.max(original[i],original[i+1],original[i+2])>180){total++;if(Math.max(actual[i],actual[i+1],actual[i+2])<100)missing++;}return missing/total;},box);
  assert(missing<.005,id+' must render all source linework, missing='+missing);
  await move(760,900);await page.waitForTimeout(850);assert(Number(await page.locator('.prologue-assembly').getAttribute('data-'+id+'-progress'))<.005);
 }
 const dots=new Set(),typed=new Set();for(let i=0;i<65;i++){const values=await page.locator('.prologue-ui-motion').evaluate(c=>[c.dataset.loadingDots,c.dataset.typed80,c.dataset.uiStyle]);dots.add(values[0]);typed.add(values[1]);assert.equal(values[2],'erase-and-type');await page.waitForTimeout(100);}
 assert.equal(dots.size,4);assert(typed.size>2);assert.deepEqual(errors,[]);await page.screenshot({path:'/tmp/prologue-typed-ui.png'});console.log('PASS full computer/bed/door source geometry, fade on leave, looping loading dots and erase/type UI');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
