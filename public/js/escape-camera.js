export const cameraProfiles={phone:{room:[.31,.49,.07],detail:[.5,.5,.26],turn:-1.5},exam:{room:[.444,.285,.046],detail:[.6,.45,.60],turn:1},computer:{room:[.508,.204,.079],detail:[.71,.30,.34],turn:1.5}};
export function cameraPose(x,y,scale,turn=0){return `translate(${x*100}%,${y*100}%) perspective(2200px) rotateY(${turn}deg) scale(${scale})`;}
