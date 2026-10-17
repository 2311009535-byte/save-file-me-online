export const FINAL_PRELUDE='I thought I was only playing.';
export const FINAL_LINES=[
 FINAL_PRELUDE,
 'But I carried something out of every world.',
 'The curiosity to look a little further.',
 'A place to pause when things felt too much.',
 'The courage to try again. And someone to try with.',
 'Then, the desire to make something of my own.',
 'I don’t know what comes next.',
 'But I can begin.'
];
export const FINAL_LINE_SECONDS=3.6;
export const FINAL_STORY_SECONDS=FINAL_LINES.length*FINAL_LINE_SECONDS;
export function storyCaption(time){return FINAL_LINES[Math.min(FINAL_LINES.length-1,Math.max(0,Math.floor(time/FINAL_LINE_SECONDS)))];}
export function mountFinalPrelude(root){
 const p=document.createElement('p');p.className='final-prelude';p.textContent=FINAL_PRELUDE;
 Object.assign(p.style,{position:'absolute',left:'8%',right:'8%',top:'50%',transform:'translateY(-50%)',margin:0,textAlign:'center',color:'#f3e7d5',font:'calc(25px * var(--scene-ui,1)) Georgia,serif',lineHeight:'1.5',textShadow:'0 2px 5px #000',pointerEvents:'none'});root.append(p);return()=>p.remove();
}
