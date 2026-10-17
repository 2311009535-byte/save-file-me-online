// Static asset slot until real, independently layered parallax art is supplied.
export const escapeGameAssets=Object.freeze({reference:'/assets/escape/game.png',layers:Object.freeze([])});
// Future adapter: mount({host,assets,input,complete}) -> optional cleanup function.
// input receives "input" events: {kind:'click'|'wheel', point, deltaY, direction}.
// Only the actual game's endpoint calls complete(); input itself never completes.
export function createEscapeGame({onComplete,adapter=null,host=null}){
 const input=new EventTarget();let alive=true,finished=false;
 const complete=()=>{if(!alive||finished)return;finished=true;onComplete();};
 const cleanup=adapter?.mount({host,assets:escapeGameAssets,input,complete});
 return {
  handleInput(detail){if(alive&&!finished)input.dispatchEvent(new CustomEvent('input',{detail:Object.freeze({...detail})}));},
  dispose(){if(!alive)return;alive=false;if(typeof cleanup==='function')cleanup();}
 };
}
