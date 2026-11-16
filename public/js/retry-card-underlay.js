// Repair the baked card beneath a moving card. Feather into the surrounding
// paper so the repair never reads as a rectangular backing panel.
export function createCardUnderlay(background,[x,y,w,h],name){
 const margin=12,padX=margin/1672*100,padY=margin/941*100;
 const canvas=document.createElement('canvas');canvas.width=Math.ceil(background.naturalWidth*(w+padX*2)/100);canvas.height=Math.ceil(background.naturalHeight*(h+padY*2)/100);canvas.className='retry-card-underlay';canvas.dataset.card=name;canvas.hidden=true;canvas.setAttribute('aria-hidden','true');
 Object.assign(canvas.style,{left:(x-padX)+'%',top:(y-padY)+'%',width:(w+padX*2)+'%',height:(h+padY*2)+'%',position:'absolute',pointerEvents:'none'});
 const ctx=canvas.getContext('2d');ctx.drawImage(background,background.naturalWidth*(x-padX)/100,background.naturalHeight*(y-padY)/100,background.naturalWidth*(w+padX*2)/100,background.naturalHeight*(h+padY*2)/100,0,0,canvas.width,canvas.height);
 ctx.globalCompositeOperation='destination-in';
 for(const vertical of [false,true]){const length=vertical?canvas.height:canvas.width,pad=(vertical?padY:padX)/((vertical?h:w)+(vertical?padY:padX)*2),gradient=ctx.createLinearGradient(0,0,vertical?0:length,vertical?length:0);gradient.addColorStop(0,'transparent');gradient.addColorStop(pad,'#000');gradient.addColorStop(1-pad,'#000');gradient.addColorStop(1,'transparent');ctx.fillStyle=gradient;ctx.fillRect(0,0,canvas.width,canvas.height);}
 return canvas;
}
