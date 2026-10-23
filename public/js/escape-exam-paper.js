export const crumpledExamAsset='/assets/escape/exam-crumpled-detail.png';
// The replacement is confined to the original exam's footprint on the desk.
// Coordinates are in the untouched 3840 x 2160 room illustration.
export function mountCrumpledExam(visual){
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),id='crumpled-exam-'+crypto.randomUUID();
 svg.classList.add('escape-crumpled-exam');svg.setAttribute('viewBox','0 0 3840 2160');svg.setAttribute('preserveAspectRatio','none');svg.setAttribute('aria-hidden','true');Object.assign(svg.style,{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none'});
 svg.innerHTML=`<defs><clipPath id="${id}" clipPathUnits="userSpaceOnUse"><path d="M1600 611 L1655 566 L1699 562 L1742 580 L1781 600 L1754 651 L1709 668 L1653 643 Z"/></clipPath></defs><g clip-path="url(#${id})"><image href="${crumpledExamAsset}" width="1460" height="1078" transform="matrix(.287771156 -.000025385 .00011582 .287783675 1479.723694 489.779787)"/></g>`;
 visual.append(svg);return svg;
}
