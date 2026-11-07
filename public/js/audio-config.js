// Supplied recordings.
export const forestMusicUrl='/assets/audio/forest-music.m4a';
const nature='/assets/audio/forest-environment.m4a';
export const recordedSounds={
 phoneVibration:{url:'/assets/audio/escape-phone-continuous.m4a',seam:.08},
 carPass:{url:'/assets/audio/escape-car-ambient.m4a',seam:.25},
 pencil:{url:'/assets/audio/pencil.m4a',start:.6,end:7.8,seam:.08},
 wind:{url:nature,start:.4,end:2.5,seam:.2},
 grass:{url:nature,start:3.2,end:5.2,seam:.2},
 birds:{url:nature,start:6.3,end:9.5,seam:.04},
 river:{url:nature,start:10.1,end:11.6,seam:.18}
};
export const chapterMusic={
 'chapter1':{url:'/assets/audio/chapter1.m4a',gain:.48473},
 'chapter1-game':{url:'/assets/audio/chapter1-game.m4a',start:1.87,gain:.380189},
 'chapter2':{url:'/assets/audio/chapter2.m4a',gain:.474242},
 'retry-alone':{url:'/assets/audio/retry-before-v3.m4a',gain:.32},
 'retry-together':{url:'/assets/audio/retry-before-v3.m4a',gain:.32},
 'retry-diary':{url:'/assets/audio/retry-after-v3.m4a',gain:.34},
 'chapter4':{url:'/assets/audio/chapter4.m4a',gain:.257929}
};

// prologue-recordings-v2
Object.assign(chapterMusic,{"prologue":{"url":"/assets/audio/prologue-opening-v2.m4a","gain":0.149796},"prologue-glitch":{"url":"/assets/audio/prologue-fault-v2.m4a","gain":0.273212},"chapter1":{"url":"/assets/audio/chapter1-v2.m4a","gain":0.401328}});
