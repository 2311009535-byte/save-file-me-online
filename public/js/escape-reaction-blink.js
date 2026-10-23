export const reactionBlinkAsset='/assets/escape/computer-blink-closed.png';
export function mountReactionBlink(host){
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),id='reaction-eyes-'+crypto.randomUUID();
 svg.classList.add('escape-reaction-blink');svg.setAttribute('viewBox','0 0 1672 941');svg.setAttribute('preserveAspectRatio','xMidYMid meet');svg.setAttribute('aria-hidden','true');Object.assign(svg.style,{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',opacity:0});
 // Only the eyelids change; the supplied head, smile and lighting stay still.
 svg.innerHTML=`<defs><clipPath id="${id}" clipPathUnits="userSpaceOnUse"><path d="M588 472 L621 461 L677 462 L722 476 L756 511 L763 549 L705 563 L640 564 L595 554 L580 515 Z M844 450 L872 420 L920 405 L979 403 L988 441 L983 478 L956 505 L900 529 L844 525 Z"/></clipPath></defs><g clip-path="url(#${id})"><image href="${reactionBlinkAsset}" width="1561" height="1008" transform="matrix(.416383909 .000073082 -.000089882 .418999796 429.884951 278.818648)"/></g>`;
 host.append(svg);return svg;
}
export const blinkKeyframes=[
 {opacity:0,offset:0},{opacity:0,offset:.4},
 {opacity:1,offset:.43},{opacity:1,offset:.465},
 {opacity:0,offset:.51},{opacity:0,offset:1}
];
