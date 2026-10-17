export const STORAGE_KEY='save-file-me:v1';
export function normalize(value){
 const completed=Number.isInteger(value?.completed)?Math.max(0,Math.min(4,value.completed)):0;
 const scene=value?.scene;
 const valid=scene==='prologue'||(scene==='final'&&completed===4)||(/^chapter[1-4]$/.test(scene)&&Number(scene.slice(-1))<=completed+1);
 return {version:1,completed,scene:valid?scene:'prologue',ended:completed===4&&value?.ended===true};
}
export function canEnter(state,n){return n>=1&&n<=4&&n<=state.completed+1;}
export function enter(state,n){return canEnter(state,n)?{...state,scene:`chapter${n}`}:state;}
export function complete(state,n){
 if(state.scene!==`chapter${n}`||!canEnter(state,n))return state;
 return {...state,completed:Math.max(state.completed,n),scene:'prologue'};
}
export function exit(state){return state.completed===4?{...state,scene:'final'}:state;}
