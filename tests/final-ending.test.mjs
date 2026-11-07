import test from 'node:test';
import assert from 'node:assert/strict';
import {FINAL_LINES,FINAL_LINE_SECONDS,FINAL_STORY_SECONDS,FINAL_CLOSING_LINE,finalClosingFrame} from '../public/js/final-timeline.js';
test('Final holds its last thought two seconds, fades to black, then shows and fades the closing sentence',()=>{
 assert.equal(FINAL_STORY_SECONDS-(FINAL_LINES.length-1)*FINAL_LINE_SECONDS,2);
 assert.equal(finalClosingFrame(0).text,'But I can begin.');
 assert.equal(finalClosingFrame(1.3).shade,1);assert.equal(finalClosingFrame(1.3).text,'');
 const closing=finalClosingFrame(3);assert.equal(closing.shade,1);assert.equal(closing.text,FINAL_CLOSING_LINE);assert.equal(closing.opacity,1);
 assert(finalClosingFrame(5.8).opacity<1);assert.equal(finalClosingFrame(6.3).text,'');assert.equal(finalClosingFrame(6.3).done,true);
});
