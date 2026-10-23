const{chromium}=require('playwright'),assert=require('node:assert/strict');
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:3005';
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});try{
 const p=await b.newPage({viewport:{width:900,height:600}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/__cloud-check',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><canvas width="836" height="470" style="width:836px;height:470px"></canvas>'}));await p.goto(base+'/__cloud-check');
 const stats=await p.evaluate(async()=>{
  const {createBridgeRenderer}=await import('/js/bridge-study.js');
  const load=src=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=src;});
  const [deck,left,right,sky]=await Promise.all(['/assets/bridge-study/deck.png','/assets/bridge-study/left.png','/assets/bridge-study/right.png','/assets/escape/parallax/sky-panorama.png'].map(load));
  const water=document.createElement('canvas');water.width=water.height=2;
  let fullSky=0;const scenery={sky,water,camera:()=>({x:0,y:105,z:300,yaw:0,pitch:.22,fullSky}),add({texture,quad}){
   const depth=17700,height=700*depth/900,width=height*3,top=105+540*depth/900;
   quad(texture(sky),[{p:[-width/2,top,18000],uv:[0,0]},{p:[width/2,top,18000],uv:[1,0]},{p:[width/2,top-height,18000],uv:[1,1]},{p:[-width/2,top-height,18000],uv:[0,1]}],[1,0,0,0,1,0,0,0,1],undefined,false,-1,true);
  }};
  const canvas=document.querySelector('canvas'),renderer=createBridgeRenderer(canvas,{deck,left,right},scenery),gl=canvas.getContext('webgl');
  const capture=time=>{renderer.render(0,time);const pixels=new Uint8Array(836*470*4);gl.readPixels(0,0,836,470,gl.RGBA,gl.UNSIGNED_BYTE,pixels);return pixels;};
  const first=capture(0),later=capture(2);let skyChanges=0,sunChanges=0,hillChanges=0;
  for(let y=0;y<470;y++)for(let x=0;x<836;x++){
   const i=((469-y)*836+x)*4,delta=Math.abs(first[i]-later[i])+Math.abs(first[i+1]-later[i+1])+Math.abs(first[i+2]-later[i+2]);
   if(y<100&&delta>12)skyChanges++;
   if(Math.abs(x-561)<7&&Math.abs(y-147)<7&&delta>0)sunChanges++;
   if(y>280&&y<310&&x<80&&delta>0)hillChanges++;
  }
  fullSky=1;const onlySky=capture(0);let green=0,dark=0;for(let i=0;i<onlySky.length;i+=4){if(onlySky[i+1]>onlySky[i])green++;if(onlySky[i]+onlySky[i+1]+onlySky[i+2]<90)dark++;}
  renderer.dispose();return{skyChanges,sunChanges,hillChanges,green,dark};
 });
 assert(stats.skyChanges>2500,JSON.stringify(stats));assert.equal(stats.sunChanges,0,JSON.stringify(stats));assert.equal(stats.hillChanges,0,JSON.stringify(stats));assert.equal(stats.green,0,JSON.stringify(stats));assert.equal(stats.dark,0,JSON.stringify(stats));assert.deepEqual(errors,[]);console.log('PASS actual sky shader: visible cloud drift in two seconds, sun/horizon fixed, complete sky view without ground or dark gaps',stats);
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
