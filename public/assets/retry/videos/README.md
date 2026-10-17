Three battle animation placeholders (no actual clips supplied yet):

- player-attack.mp4: solo player attacking Boss.
- boss-attack.mp4: Boss attacking solo player.
- duo-attack.mp4: player1 and player2 attacking together.

Use the existing 16:9 composition. Avoid baking premature HP changes into a clip;
HP/round/win state is updated only by its ended callback. Do not loop the clips.

To connect a supplied clip, put it at the matching path and set that group's
`enabled: true` in public/js/retry-actions.js. Each clip preloads separately.
`play(group, {onEnded})` completes from HTMLVideoElement.ended, not an estimated
length. A stalled/paused clip keeps cards locked. Explicit media errors fall back
to the existing image demo; fallback completion is still required before settlement.
The image demo awaits each Web Animation.finished event in listed material order.
Leaving/refreshing the scene cancels playback without calling onEnded or counting a loss.

Existing victory-to-switch.mp4 is a separate later transition, configured in
public/js/retry-video.js. These paths do not change the three-loss/fourth-win rules.
