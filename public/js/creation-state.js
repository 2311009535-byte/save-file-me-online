export const CREATION_KEY='save-file-me:creation:v1';
export const objects=['window','lamp','bed','computer','door'];
export function normalizeCreation(value){
 const count=Number.isInteger(value?.built)?Math.max(0,Math.min(5,value.built)):0;
 const roomCreated=value?.roomCreated ?? Boolean(value);
 return {roomCreated,built:count,phase:!roomCreated?(['room-place','room-raise'].includes(value?.phase)?value.phase:'room-place'):count===5?(['complete','transition','finished'].includes(value?.phase)?value.phase:'complete'):['choose','puzzle','place','raise'].includes(value?.phase)?value.phase:'choose',
  item:objects[count]||'door'};
}
export class CreationGame{
 constructor(saved,onChange){this.state=normalizeCreation(saved);this.onChange=onChange;this.resetTransient();}
 resetTransient(){this.stars=0;this.connected=false;this.progress=0;this.held=0;}
 commit(phase){this.state={...this.state,phase};this.onChange(this.state);}
 choose(item){if(this.state.phase!=='choose'||item!==this.state.item)return false;this.resetTransient();this.commit('puzzle');return true;}
 solve(){if(this.state.phase!=='puzzle')return false;this.commit('place');return true;}
 placed(){if(this.state.phase==='room-place'){this.progress=0;this.commit('room-raise');return true;}if(this.state.phase!=='place')return false;this.progress=0;this.commit('raise');return true;}
 raise(amount,required=.18){if(['raise','room-raise'].includes(this.state.phase))this.progress=Math.max(0,Math.min(1,amount/required));}
 release(cancelled=false){
  if(!['raise','room-raise'].includes(this.state.phase))return false;
  if(cancelled||this.progress<1){this.progress=0;return false;}
  if(this.state.phase==='room-raise'){this.state={...this.state,roomCreated:true,phase:'choose'};this.resetTransient();this.onChange(this.state);return true;}
  this.state=normalizeCreation({roomCreated:true,built:this.state.built+1,phase:this.state.built===4?'complete':'choose'});this.resetTransient();this.onChange(this.state);return true;
 }
}
