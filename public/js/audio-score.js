// Original arrangements. Supplied recordings may replace these via audio-config.
export const motif=[0,null,4,7,null,9,7,null,4,null,2,null,0,null,null,null,4,null,7,12,null,11,7,null,5,null,4,null,2,null,null,null];
export const profiles={
 prologue:{bpm:66,root:48,chords:[[0,4,7],[9,12,16],[5,9,12],[7,11,14]],melody:motif,type:'sine',level:.65,pad:true},
 'prologue-glitch':{bpm:68,root:36,chords:[[0,1,7],[0,1,7],[0,1,7],[0,1,7]],melody:[],level:.25,glitch:true},
 chapter1:{bpm:88,root:48,chords:[[0,4,7],[5,9,12],[9,12,16],[7,11,14]],melody:motif,type:'square',level:.55,retro:true},
 chapter2:{bpm:42,root:33,chords:[[0,7,10],[1,5,8],[-2,5,9],[0,6,10]],melody:[null,null,null,null,7,null,null,null,null,null,null,null,6,null,null,null,null,null,null,null,3,null,null,null,null,null,null,null,1,null,null,null],type:'sine',level:.48,dark:true,cutoff:600},
 // No synthetic forest music or fake wind/water while the requested files are absent.
 forest:{bpm:78,root:48,chords:[[0,4,7],[5,9,12],[9,12,16],[7,11,14]],melody:[],type:'sine',level:0,silent:true},
 'retry-alone':{bpm:64,root:33,chords:[[0,3,7],[0,5,8],[-2,3,7],[-1,2,6]],melody:[0,null,null,7,null,null,3,null,0,null,null,6,null,null,1,null],type:'triangle',level:.65,combat:true,cutoff:1600},
 'retry-together':{bpm:104,root:48,chords:[[0,4,7],[5,9,12],[9,12,16],[7,11,14]],melody:[12,7,9,null,7,4,5,null,7,9,12,16,14,null,12,null,9,12,14,null,12,9,7,null,5,7,9,7,4,null,0,null],type:'triangle',level:.6,duet:true,arp:true,rhythm:true,cutoff:4200},
 'retry-diary':{bpm:58,root:45,chords:[[0,3,7],[5,8,12],[3,7,10],[7,10,14]],melody:[0,null,null,null,7,null,3,null,5,null,null,null,3,null,null,null],type:'sine',level:.3,pad:true},
 chapter4:{bpm:92,root:55,chords:[[0,4,7],[2,5,9],[-3,0,4],[-5,-1,2]],melody:[0,7,12,null,11,7,4,null,2,9,14,null,12,9,5,null,4,7,12,16,14,12,7,null,2,7,11,null,7,2,0,null],type:'triangle',level:.5,creation:true,arp:true,cutoff:3000},
 final:{bpm:66,root:48,chords:[[0,4,7],[9,12,16],[5,9,12],[7,11,14]],melody:motif,type:'sine',level:.42,pad:true}
};
export function sceneProfile(scene,{completed=0}={}){if(scene==='prologue'&&completed>=1&&completed<4)return 'prologue-glitch';return scene==='chapter3'?'retry-alone':profiles[scene]?scene:'prologue';}
export const midiFrequency=n=>440*Math.pow(2,(n-69)/12);
export function riverLevel(z){return .008+.24*Math.exp(-Math.pow((z-1100)/1100,2));}
