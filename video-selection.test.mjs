import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chooseVideo,withoutVideo} from './video-library.js';
import {sanitize} from './state.js';
import {patchLayer,removeLayer,placement,portableLook} from './video-layers.js';
test('every video is selectable by title, explanation, poster and playable source',async()=>{
 const clips=JSON.parse(await readFile(new URL('./clips.json',import.meta.url),'utf8'));
 assert.ok(clips.length>=5);for(const c of clips){assert.ok(c.title);assert.ok(c.description);assert.ok(c.poster);assert.ok(c.url);assert.ok(c.duration>0);}
});
test('using a video keeps the logo motion and enables its video gallery',()=>{
 const s=chooseVideo(sanitize({variant:5,showVideo:false}),{id:'P2-S5-01',cue:4});
 assert.equal(s.variant,5);assert.equal(s.videoId,'P2-S5-01');assert.equal(s.cue,4);assert.equal(s.showVideo,true);
});
test('adding video is optional and preserves every background',()=>{
 for(let variant=0;variant<6;variant++){
 const s=chooseVideo(sanitize({variant,videoLayers:[]}),{id:'P2-S1-02',cue:0});assert.equal(s.variant,variant);
 assert.equal(s.videoLayers.length,1);
 }
 const s=chooseVideo(sanitize({variant:1}),{id:'P2-S1-02',cue:0});
 assert.equal(withoutVideo(s).showVideo,false);assert.equal(withoutVideo(s).customClip,undefined);
 assert.equal(withoutVideo(s).videoLayers.length,0);
});

test('multiple clips are independent layers with stable IDs',()=>{
 const first=chooseVideo(sanitize({videoLayers:[]}),{id:'P2-S1-02',cue:0});
 const second=chooseVideo(first,{id:'P2-S5-01',cue:4});
 assert.equal(second.videoLayers.length,2);
 assert.equal(second.videoLayers[0].id,first.videoLayers[0].id);
 assert.notEqual(second.videoLayers[0].id,second.videoLayers[1].id);
 assert.equal(second.activeVideoLayer,second.videoLayers[1].id);
});

test('fresh looks have no video; explicit legacy video looks migrate once',()=>{
 assert.equal(sanitize().showVideo,false);assert.deepEqual(sanitize().videoLayers,[]);
 const legacy=sanitize({showVideo:true,videoId:'P2-S1-02'});
 assert.equal(legacy.videoLayers.length,1);assert.equal(legacy.videoLayers[0].videoId,'P2-S1-02');
 assert.equal(sanitize(legacy).videoLayers.length,1);
 assert.equal(sanitize({showVideo:true,videoLayers:[]}).videoLayers.length,0);
});

test('per-screen positions and visibility are independent; all-screen changes reach overrides',()=>{
 let state=chooseVideo(sanitize(),{id:'P2-S1-02'}),id=state.activeVideoLayer;
 state=patchLayer(state,id,{x:25,width:20,enabled:false},'left');
 const layer=state.videoLayers[0];
 assert.equal(placement(layer,'left',8/3).x,25);assert.equal(placement(layer,'left',8/3).enabled,false);
 assert.equal(placement(layer,'front',16/9).x,70);assert.equal(placement(layer,'front',16/9).enabled,true);
 state=patchLayer(state,id,{x:40},'all');
 assert.equal(placement(state.videoLayers[0],'left',8/3).x,40);assert.equal(placement(state.videoLayers[0],'left',8/3).width,20);
 assert.equal(removeLayer(state,id).videoLayers.length,0);
});

test('video proportions follow the physical screen and remain inside extreme ratios',()=>{
 const layer=chooseVideo(sanitize(),{id:'P2-S1-02'}).videoLayers[0];
 const front=placement(layer,'front',16/9),left=placement(layer,'left',8/3);
 assert.equal(front.width/front.height*(16/9),16/9);assert.equal(left.width/left.height*(8/3),16/9);
 for(const a of [.1,9/16,16/9,8/3,32])for(const source of [9/16,16/9,4]){
 const r=placement({...layer,width:100,x:100,y:0},'front',a,source);
 assert.ok(r.x-r.width/2>=-1e-8&&r.x+r.width/2<=100+1e-8);assert.ok(r.y-r.height/2>=-1e-8&&r.y+r.height/2<=100+1e-8);
 assert.ok(Math.abs(r.width/r.height*a-source)<1e-8);
 }
});

test('look exports retain placement but remove browser-only file references',()=>{
 const state=chooseVideo(sanitize(),{id:'P2-S1-02'},{url:'blob:test',name:'my-file.mp4'}),out=portableLook(state);
 assert.equal(out.videoLayers[0].x,70);assert.equal(out.videoLayers[0].customClip,undefined);assert.equal(out.editVideos,false);
 assert.ok(state.videoLayers[0].customClip);
 const demo=chooseVideo(sanitize(),{id:'P2-S1-02'},{url:'previews/demo-motion.mp4',name:'Demo animation'});
 assert.equal(portableLook(demo).videoLayers[0].customClip.url,'previews/demo-motion.mp4');
});

test('actual video proportions survive shared state for accurate placement controls',()=>{
 const state=sanitize({videoLayers:[{id:'portrait',sourceAspect:9/16,width:36,y:10}]});
 assert.equal(state.videoLayers[0].sourceAspect,9/16);
 const r=placement(state.videoLayers[0],'front',16/9,state.videoLayers[0].sourceAspect);
 assert.equal(r.y,50);assert.ok(Math.abs(r.width-31.640625)<1e-6);
});
