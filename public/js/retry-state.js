export const RETRY_KEY='save-file-me:retry:v1';
export function normalizeRetry(raw){
 const failures=Number.isInteger(raw?.failures)?Math.max(0,Math.min(3,raw.failures)):0;
 const joined=failures===3&&raw?.joined===true,won=joined&&raw?.won===true;
 let view=raw?.view;
 const allowed=won?['victory','switch','diary']:joined?['battle']:failures===3?['discovered','invite']:['battle','defeat'];
 if(!allowed.includes(view))view=won?'switch':joined?'battle':failures===3?'discovered':'battle';
 if(view==='defeat'&&failures===0)view='battle';
 return {version:1,failures,joined,won,view,warningSeen:raw?.warningSeen===true||failures>1,page:Number.isInteger(raw?.page)?Math.max(0,Math.min(3,raw.page)):0};
}
export function settleRetryRound(state){
 if(state.won||state.view!=='battle')return state;
 if(state.failures===3&&state.joined)return {...state,won:true,view:'victory'};
 const failures=Math.min(3,state.failures+1);return {...state,failures,view:failures===3?'discovered':'defeat'};
}
export function retryRound(state){return state.view==='defeat'?{...state,view:'battle'}:state.view==='discovered'?{...state,view:'invite'}:state;}
export function joinPartner(state){return state.failures===3&&state.view==='invite'?{...state,joined:true,view:'battle'}:state;}
export function resetRetry(){try{localStorage.removeItem(RETRY_KEY);}catch{}}
