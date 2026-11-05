import {mountWindowDarkness} from './wonder-window-darkness.js';
export function hideRoomMeteor(visual,completed){if(completed)return null;const source=visual.querySelector('.scene-image');return source?mountWindowDarkness(source,visual):null;}
