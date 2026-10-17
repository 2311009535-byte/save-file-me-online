// Scroll-driven motion study. The supplied landscape is the opening plate;
// the later landscapes are procedural block/particle studies, not final artwork.
let engineJob;
function script(src){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>{s.remove();reject(Error('Animation engine unavailable'));};document.head.append(s);});}
function engine(){if(!engineJob)engineJob=(async()=>{if(!window.gsap)await script('/vendor/gsap/gsap.min.js');if(!window.ScrollTrigger)await script('/vendor/gsap/ScrollTrigger.min.js');window.gsap.registerPlugin(window.ScrollTrigger);return {gsap:window.gsap,ScrollTrigger:window.ScrollTrigger};})().catch(e=>{engineJob=null;throw e;});return engineJob;}
function image(src){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=src;});}
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=(a,b,x)=>{x=clamp((x-a)/(b-a));return x*x*(3-2*x);};
const W=1672,H=941;
const palettes=[['#72548c','#f9ad6e','#243f50','#8de4d2'],['#132547','#8a69c3','#172d52','#a0f6e8'],['#271347','#ce64b3','#2a2856','#ffd395'],['#08263a','#397b91','#163e54','#9dfff0'],['#32234a','#c18c8d','#29354a','#ffe4a2']];
function color(a,b,p){const rgb=x=>[1,3,5].map(i=>parseInt(x.slice(i,i+2),16));const x=rgb(a),y=rgb(b);return 'rgb('+x.map((v,i)=>Math.round(v+(y[i]-v)*p)).join(',')+')';}
function palette(p){const x=clamp(p)*4,i=Math.min(3,Math.floor(x));return palettes[i].map((v,j)=>color(v,palettes[i+1][j],x-i));}
export function mountEscapeParallax({host,input,complete}){
 let alive=true,ready=false,timeline,trigger,observer,completed=false,lastProgress=0;
 if(!document.getElementById('escape-parallax-style')){const l=document.createElement('link');l.id='escape-parallax-style';l.rel='stylesheet';l.href='/parallax.css';document.head.append(l);}
 const root=document.createElement('section');root.className='escape-parallax';root.setAttribute('aria-label','Escape — scroll forward through the world');
 root.innerHTML='<div class="journey-scroll" tabindex="0" aria-label="Scroll to move forward; scroll up to move back"><div class="journey-track"><div class="journey-view"><canvas aria-label="A journey beyond the room"></canvas><button class="journey-door" hidden aria-label="Open the door and return to the save room"><span>ENTER</span></button><div class="journey-hud"><p class="journey-help" role="status">SCROLL TO MOVE FORWARD</p><div class="journey-progress" role="progressbar" aria-label="Journey progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i></i></div></div></div></div></div>';
 host.append(root);const scroller=root.querySelector('.journey-scroll'),track=root.querySelector('.journey-track'),view=root.querySelector('.journey-view'),canvas=root.querySelector('canvas'),door=root.querySelector('.journey-door'),help=root.querySelector('.journey-help'),meter=root.querySelector('.journey-progress'),fill=meter.firstElementChild,c=canvas.getContext('2d',{alpha:false});
 const model={progress:0};let landscape,hero,forestLeft,forestRight,house;
 const objects=Array.from({length:84},(_,i)=>({z:900+i*100,x:(i%2?1:-1)*(300+(i*137%620)),height:100+(i*47%190),seed:i}));
 const motes=Array.from({length:100},(_,i)=>({x:(i*709%2400)-1200,y:(i*193%900)-600,z:500+(i*389%8700),size:2+i%4}));
 function resize(){const h=Math.max(1,host.clientHeight||innerHeight);root.style.setProperty('--journey-height',h+'px');canvas.width=Math.min(2560,Math.round((host.clientWidth||innerWidth)*Math.min(devicePixelRatio||1,1.5)));canvas.height=Math.round(canvas.width*H/W);track.style.height=h*8+'px';if(ready)draw(model.progress);trigger?.refresh();}
 function cubeTree(x,y,s,seed,colors){c.save();c.translate(x,y);c.scale(s,s);c.fillStyle='#493849';c.fillRect(-14,-140,28,145);const bx=seed%3*5;c.fillStyle=colors[2];c.fillRect(-83,-235,166,105);c.fillRect(-60,-292,128,115);c.fillStyle=colors[3];c.globalAlpha=.28;c.fillRect(-60,-292,128,15);c.fillRect(65,-235,18,105);c.globalAlpha=.8;for(let i=0;i<12;i++){c.fillStyle=i%3?colors[2]:colors[3];c.fillRect(-75+(i*37+bx)%148,-277+(i*47)%130,9,9);}c.restore();}
 function crystal(x,y,s,seed,colors){c.save();c.translate(x,y);c.scale(s,s);c.fillStyle=colors[3];c.globalAlpha=.85;c.beginPath();c.moveTo(0,-240);c.lineTo(48,-135);c.lineTo(30,0);c.lineTo(-25,14);c.lineTo(-50,-145);c.closePath();c.fill();c.fillStyle=colors[0];c.globalAlpha=.7;c.beginPath();c.moveTo(0,-240);c.lineTo(0,-40);c.lineTo(30,0);c.lineTo(48,-135);c.closePath();c.fill();c.strokeStyle=colors[3];c.lineWidth=3;c.stroke();c.globalAlpha=.32;c.fillStyle=colors[3];c.fillRect(-85,-4,170,5);c.restore();}
 function arch(x,y,s,colors){c.save();c.translate(x,y);c.scale(s,s);c.strokeStyle=colors[3];c.lineWidth=12;c.globalAlpha=.65;c.strokeRect(-100,-300,200,300);c.lineWidth=2;c.globalAlpha=.3;c.strokeRect(-120,-320,240,320);c.fillStyle=colors[3];for(let i=0;i<7;i++)c.fillRect(-115+i*32,-325,12,12);c.restore();}
 function draw(p){if(!alive||!landscape||!hero)return;lastProgress=p;const cols=palette(p),z=p*8500,ascent=230*smooth(0,.17,p);c.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);c.globalAlpha=1;c.imageSmoothingEnabled=false;const sky=c.createLinearGradient(0,0,0,H);sky.addColorStop(0,cols[0]);sky.addColorStop(.58,cols[1]);sky.addColorStop(1,cols[2]);c.fillStyle=sky;c.fillRect(0,0,W,H);
  // Distant blocks and the receding road share a stable vanishing point.
  for(let band=0;band<3;band++){c.globalAlpha=.18+band*.13;c.fillStyle=cols[2];for(let i=0;i<24;i++){const x=i*90-180+Math.sin(p*2+band)*20,y=400+band*55-(i*31%90);c.fillRect(x,y,100,H-y);}}c.globalAlpha=1;
  c.fillStyle=cols[2];c.beginPath();c.moveTo(W*.49,425);c.lineTo(W*.51,425);c.lineTo(W*.87,H);c.lineTo(W*.13,H);c.closePath();c.fill();c.strokeStyle=cols[3];c.globalAlpha=.2;c.lineWidth=2;for(let i=0;i<16;i++){const d=((i/16+p*5)%1);const y=430+d*d*520,w=(y-425)*.64;c.beginPath();c.moveTo(W/2-w,y);c.lineTo(W/2+w,y);c.stroke();}c.globalAlpha=1;
  for(const o of objects.slice().reverse()){const d=o.z-z+800;if(d<80||d>3800)continue;const s=700/d,x=W/2+o.x*s,y=435+(205+ascent*.15)*s;if(x<-700||x>W+700)continue;const depth=clamp((o.z-2400)/3500);if(depth<.25)cubeTree(x,y,s,o.seed,cols);else if(depth<.8)crystal(x,y,s*.85,o.seed,cols);else arch(x,y,s*.75,cols);}
  c.fillStyle=cols[3];for(const m of motes){const d=m.z-z+700;if(d<80||d>3200)continue;const s=700/d,x=W/2+m.x*s,y=420+m.y*s+Math.sin(p*12+m.z)*8;c.globalAlpha=Math.min(.8,Math.max(0,1-d/3200));c.fillRect(x,y,m.size*s,m.size*s);}c.globalAlpha=1;
  if(p<.52){
   // Keep the approved opening, then advance across the bridge before the
   // cabin passes on the right. All plates retain their full-canvas registration.
   const travel=smooth(0,.29,p),fade=1-smooth(.44,.52,p);
   const plate=(im,scale,lift)=>{c.globalAlpha=fade;c.drawImage(im,W/2-W*.5*scale,440-440*scale+lift,W*scale,H*scale);};
   const forward=smooth(.13,.47,p);
   plate(landscape,1+.7*travel+4.5*forward,ascent*.4);
   const cabinStart=1+.7*smooth(0,.29,.13);
   const cabinScale=p<=.13?1+.7*travel:cabinStart/(1-.98*clamp((p-.13)/.30));
   // The cabin exits through the viewport edge; it is not faded out mid-pass.
   const houseLeft=W/2+(1190/1920*W-W/2)*cabinScale;
   root.dataset.house=houseLeft>=W?'passed':'approaching';
   root.dataset.houseScale=cabinScale.toFixed(4);
   c.globalAlpha=1;
   if(houseLeft<W)c.drawImage(house,W/2-W*.5*cabinScale,440-440*cabinScale+ascent*.4,W*cabinScale,H*cabinScale);
   plate(forestLeft,1+2.3*travel+9*forward,ascent*.65);
   plate(forestRight,1+2.3*travel+9*forward,ascent*.65);
   c.globalAlpha=1;
  }else root.dataset.house='passed';
  if(p<.19){const distance=700-p*3400,s=700/Math.max(60,distance),h=150*s,w=h*hero.naturalWidth/hero.naturalHeight,y=H*.91+ascent*s;c.drawImage(hero,W/2-w/2,y-h,w,h);}
  // Final door is drawn and hit-tested in the same projected coordinates.
  const scale=700/(9200-z),dw=120*scale,dh=200*scale,dx=W/2-dw/2,dy=435+210*scale-dh;
  if(p>.8){c.globalAlpha=smooth(.8,.92,p);c.save();c.translate(dx,dy);c.fillStyle='#fff0b4';c.shadowColor='#fff2c0';c.shadowBlur=28;c.fillRect(0,0,dw,dh);c.shadowBlur=0;c.fillStyle='#6a5364';c.fillRect(7*scale,7*scale,dw-14*scale,dh-7*scale);c.fillStyle='#ffe5aa';c.fillRect(dw*.76,dh*.55,8*scale,8*scale);c.restore();c.globalAlpha=1;}
  const atDoor=p>=.985;door.hidden=!atDoor;door.disabled=!atDoor;Object.assign(door.style,{left:(dx-18*scale)/W*100+'%',top:(dy-12*scale)/H*100+'%',width:(dw+36*scale)/W*100+'%',height:(dh+24*scale)/H*100+'%'});help.textContent=atDoor?'CLICK THE DOOR TO RETURN':p<.18?'SCROLL TO RISE ABOVE THE PLAYER':'SCROLL TO MOVE FORWARD · SCROLL UP TO LOOK BACK';fill.style.width=p*100+'%';meter.setAttribute('aria-valuenow',String(Math.round(p*100)));root.dataset.progress=p.toFixed(4);root.dataset.phase=atDoor?'door':p<.19?'flyover':'journey';
 }
 const onInput=e=>{if(!alive||!ready)return;const d=e.detail;if(d.kind==='wheel'){const multiplier=d.deltaMode===1?24:d.deltaMode===2?scroller.clientHeight:1;scroller.scrollTop+=clamp(Number(d.deltaY)||0,-1000,1000)*multiplier;}};
 input?.addEventListener('input',onInput);
 const key=e=>{if(!ready||document.querySelector('#dev-panel:not([hidden])'))return;let amount;if(['ArrowDown','PageDown','Space'].includes(e.code))amount=scroller.clientHeight*.35;if(['ArrowUp','PageUp'].includes(e.code))amount=-scroller.clientHeight*.35;if(e.code==='Home')amount=-scroller.scrollHeight;if(e.code==='End')amount=scroller.scrollHeight;if(amount!==undefined){e.preventDefault();scroller.scrollTop+=amount;}};scroller.addEventListener('keydown',key);
 door.onclick=()=>{if(!alive||completed||!ready||lastProgress<.985)return;completed=true;door.disabled=true;complete();};
 resize();Promise.all([engine(),image('/assets/escape/parallax/forest-back.png'),image('/assets/escape/parallax/player.png'),image('/assets/escape/parallax/forest-left.png'),image('/assets/escape/parallax/forest-right.png'),image('/assets/escape/parallax/house-cleared.png'),image('/assets/escape/parallax/house.png')]).then(([lib,a,b,left,right,cleared,cabin])=>{if(!alive)return;
 // The new clean cabin plate includes baked near foliage. Remove its registered
 // foreground footprints and fill them from the earlier clean forest plate.
 // This is runtime layer compositing; source artwork remains untouched.
 const back=document.createElement('canvas');back.width=cleared.naturalWidth;back.height=cleared.naturalHeight;
 const bc=back.getContext('2d');bc.drawImage(cleared,0,0);bc.globalCompositeOperation='destination-out';bc.drawImage(left,0,0,back.width,back.height);bc.drawImage(right,0,0,back.width,back.height);bc.globalCompositeOperation='destination-over';bc.drawImage(a,0,0,back.width,back.height);
 landscape=back;hero=b;forestLeft=left;forestRight=right;house=cabin;ready=true;timeline=lib.gsap.timeline({paused:true}).to(model,{progress:1,duration:1,ease:'none',onUpdate:()=>draw(model.progress)});trigger=lib.ScrollTrigger.create({scroller,start:0,end:()=>Math.max(1,scroller.scrollHeight-scroller.clientHeight),animation:timeline,scrub:.45,invalidateOnRefresh:true});observer=new ResizeObserver(resize);observer.observe(host);draw(0);root.dataset.ready='true';}).catch(()=>{if(alive){help.textContent='SCENE COULD NOT LOAD. PLEASE RELOAD.';root.dataset.error='assets';}});
 return ()=>{if(!alive)return;alive=false;ready=false;observer?.disconnect();trigger?.kill();timeline?.kill();input?.removeEventListener('input',onInput);scroller.removeEventListener('keydown',key);root.remove();};
}
export const escapeParallaxAdapter={mount:mountEscapeParallax};
