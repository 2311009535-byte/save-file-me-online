// Final chapter interactions call the same completion callback as the temporary controls.
export const chapters=[
 {id:1,name:'Wonder',word:'好奇，是第一道光。',image:'wonder/1_1.png',steps:['窗户 · 特写 → 流星','箱子 · 特写 → 剑的变化','地图 · 鼠标显露下层，返回即完成','便签 · 查看后返回即完成','四项完成 → 电脑 1_15（跳过 1_14）','平台游戏 · 自动前进 / Space 跳跃 / 掉坑重试 → 门'],future:{observations:['window','box','map','note'],computer:'1_15',backgrounds:['1_8','1_9','1_10','1_11','1_12'],character:'character.png'}},
 {id:2,name:'Escape',word:'暂时离开，也是一种选择。',steps:['手机 · 逐条滑动删除两条消息','地上试卷 · 拖给小人，逐次趴下','桌上试卷 · 特写并划掉 58 分','三项完成 → 电脑 → YES','鼠标点击 / 滚动推进视差动画'],future:{tasks:['messages','floor-paper','score'],input:['click','scroll']}},
 {id:3,name:'Retry & Connection',word:'重来一次。这次，我们一起。',steps:['Attack / Defend / Heal 三张卡','前三次战斗固定失败','邀请 player2 → 共同获胜','战后过渡 → 桌面 Switch 胜利结算','日记特写 → PREV/NEXT 翻页，可随时 BACK','胜利即记录通关 → SAVE ROOM 返回序章 0_3'],future:{forcedFailures:3,cards:['Attack','Defend','Heal'],knownIssue:'素材 attempt 03 与前三次固定失败的新规则不一致，后续需修正。'}},
 {id:4,name:'Creation',word:'把记忆，建造成可以停留的地方。',steps:['建造房间底座和墙体','窗户 · 两颗星星拖入窗户','落地灯 · 停留 1.5 秒点亮','床 · 停留 1.5 秒抓取被子，再向上拖动','电脑与书桌 · 连电源，停留 1.5 秒开机','门 · 存档拖入槽位','每项完成 → 返回建造区 → 放置并向上拉起','4_37 → 4_41 真实化过渡'],future:{input:'camera-hand',events:['click','grab','move','release','lift','hold'],transition:['4_37','4_38','4_39','4_40','4_41']}}
];
