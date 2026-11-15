export const reactionBlinkAsset='/assets/escape/computer-resting-eyes-closed.png';
export function mountReactionBlink(host){
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),id='reaction-eyes-'+crypto.randomUUID();
 svg.classList.add('escape-reaction-blink');svg.setAttribute('viewBox','0 0 1555 1012');svg.setAttribute('preserveAspectRatio','xMidYMid meet');svg.setAttribute('aria-hidden','true');Object.assign(svg.style,{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',opacity:0});
 // Only the eyelids change; the supplied head, mouth and lighting stay still.
 svg.innerHTML=`<defs><clipPath id="${id}" clipPathUnits="userSpaceOnUse"><path d="M536 592 Q598 578 674 598 L678 631 Q604 646 539 630 Z M779 548 Q839 516 906 518 L909 565 Q846 599 781 591 Z"/></clipPath></defs><g clip-path="url(#${id})"><image href="${reactionBlinkAsset}" width="1555" height="1012"/></g>`;

 host.append(svg);return svg;
}
export const blinkKeyframes=[
 {opacity:0,offset:0},{opacity:0,offset:.4},
 {opacity:1,offset:.43},{opacity:1,offset:.465},
 {opacity:0,offset:.51},{opacity:0,offset:1}
];
