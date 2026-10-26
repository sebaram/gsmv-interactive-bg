import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chooseVideo,withoutVideo} from './video-library.js';
import {sanitize} from './state.js';
test('every video is selectable by title, explanation, poster and playable source',async()=>{
 const clips=JSON.parse(await readFile(new URL('./clips.json',import.meta.url),'utf8'));
 assert.ok(clips.length>=5);for(const c of clips){assert.ok(c.title);assert.ok(c.description);assert.ok(c.poster);assert.ok(c.url);assert.ok(c.duration>0);}
});
test('using a video keeps the logo motion and enables its video gallery',()=>{
 const s=chooseVideo(sanitize({variant:5,showVideo:false}),{id:'P2-S5-01',cue:4});
 assert.equal(s.variant,5);assert.equal(s.videoId,'P2-S5-01');assert.equal(s.cue,4);assert.equal(s.showVideo,true);
});
test('a procedural-only style switches to the video combination when a video is used',()=>{
 const s=chooseVideo(sanitize({variant:1}),{id:'P2-S1-02',cue:0});assert.equal(s.variant,4);
 assert.equal(withoutVideo(s).showVideo,false);assert.equal(withoutVideo(s).customClip,undefined);
});
