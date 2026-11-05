// Ephemeral shared state between the opening and the already mounted room.
// Nothing is saved: disposal immediately restores normal particle rendering.
const handoffs=new WeakMap();
export const getOpeningHandoff=stage=>handoffs.get(stage);
export function beginOpeningHandoff(stage){const state={progress:0,ambientOpacity:0};handoffs.set(stage,state);return state;}
export function endOpeningHandoff(stage,state){if(handoffs.get(stage)===state)handoffs.delete(stage);}
