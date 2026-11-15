export const reactionBlinkAsset='/assets/escape/computer-resting-eyes-closed-v2.png';
export function mountReactionBlink(host){
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),id='reaction-eyes-'+crypto.randomUUID();
 svg.classList.add('escape-reaction-blink');svg.setAttribute('viewBox','0 0 1554 1012');svg.setAttribute('preserveAspectRatio','xMidYMid meet');svg.setAttribute('aria-hidden','true');Object.assign(svg.style,{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',opacity:0});
 // Only the eyelids change; the supplied head, mouth and lighting stay still.
 svg.innerHTML=`<defs><clipPath id="${id}" clipPathUnits="userSpaceOnUse"><path d="M628 679 Q690 665 754 686 L756 718 Q692 734 630 719 Z M851 643 Q912 618 982 630 L984 672 Q919 701 853 687 Z"/></clipPath></defs><g clip-path="url(#${id})"><image href="${reactionBlinkAsset}" width="1554" height="1012"/></g>`;

 host.append(svg);return svg;
}
export const blinkKeyframes=[
 {opacity:0,offset:0},{opacity:0,offset:.4},
 {opacity:1,offset:.43},{opacity:1,offset:.465},
 {opacity:0,offset:.51},{opacity:0,offset:1}
];
