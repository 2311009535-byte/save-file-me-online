export const operationHints={
 window:'Click the night sky. Something might pass by.',
 map:'Click the map. There’s more beyond this room.',
 box:'Click to open. Every adventure starts somewhere.',
 note:'Click to read. A small note might lead somewhere new.',
 phone:'Swipe the messages away. Take a little space for yourself.',
 papers:'Drag a paper toward me. There’s always one more.'
};
export function createChapterHints(stage){
 let panel=null;
 function hide(){panel?.remove();panel=null;}
 return {show(key){hide();if(!operationHints[key])return;panel=document.createElement('p');panel.className='chapter-operation-hint';panel.dataset.hint=key;panel.textContent=operationHints[key];panel.setAttribute('role','status');stage.append(panel);},hide,dispose:hide};
}
