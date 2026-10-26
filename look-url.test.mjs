import test from 'node:test';
import assert from 'node:assert/strict';
import {encodeLook,decodeLook,lookUrl} from './look-url.js';
import {sanitize} from './state.js';

const rawHash=value=>'#look=v1.'+Buffer.from(JSON.stringify(value)).toString('base64url');
const payload=hash=>JSON.parse(Buffer.from(hash.slice('#look=v1.'.length),'base64url').toString('utf8'));

test('bookmarked looks preserve Unicode screens and authored JSON',()=>{
 const state=sanitize({variant:2,brightness:82,speed:.6,motionAmount:.8,paused:true,offset:12.5,branding:false,headlines:true,interactive:true,screens:[{id:'front',name:'연구실 🪐',width:1920,height:1080}],authored:{2:{edits:{'orbit-1':{x:40,y:25}},objects:[{id:'object-1',type:'sphere',source:null,x:62,y:34,size:1.2,rotation:20,screen:'front',visible:true}]}}});
 const hash=encodeLook(state),restored=decodeLook(hash);
 assert.match(hash,/^#look=v1\.[A-Za-z0-9_-]+$/);
 assert.equal(restored.authored[2].edits['orbit-1'].x,40);
 assert.equal(restored.authored[2].objects[0].type,'sphere');
 for(const key of ['screens','variant','brightness','speed','motionAmount','paused','offset','branding','headlines','interactive','authored'])assert.deepEqual(restored[key],state[key],key);
 assert.equal(encodeLook(restored),hash);
});

test('URL configuration excludes runtime, network, and editing state',()=>{
 const state=sanitize({epoch:1,offset:99,paused:false,editVideos:true,activeVideoLayer:'video-1',editElements:true,activeElement:'shape-1',guide:true,calibration:true,serverUrl:'https://private.example',unknown:'secret',authored:{objects:[]}});
 const hash=encodeLook(state),saved=payload(hash),before=Date.now(),restored=decodeLook(hash);
 assert.equal(saved.offset,0);
 for(const key of ['epoch','editVideos','activeVideoLayer','editElements','activeElement','guide','calibration','serverUrl','unknown'])assert.equal(Object.hasOwn(saved,key),false,key);
 assert.ok(restored.epoch>=before&&restored.epoch<=Date.now());
 assert.equal(restored.offset,0);
 assert.equal(restored.editVideos,false);
 assert.equal(restored.unknown,undefined);
 assert.equal(state.offset,99);
 assert.equal(state.epoch,1);
});

test('equivalent configuration produces a stable hash regardless of object insertion order',()=>{
 const first={paused:true,offset:2,authored:{2:{edits:{orbit:{x:25,y:50}},objects:[]},1:{objects:[],edits:{sphere:{size:2,rotation:4}}}}};
 const second={authored:{1:{edits:{sphere:{rotation:4,size:2}},objects:[]},2:{objects:[],edits:{orbit:{y:50,x:25}}}},offset:2,paused:true};
 assert.equal(typeof encodeLook(first),'string');
 assert.equal(encodeLook(first),encodeLook(second));
 assert.equal(encodeLook({...first,epoch:1}),encodeLook({...second,epoch:9999}));
});

test('portable demo video URLs survive and local blob URLs are omitted',()=>{
 const state={showVideo:true,videoId:'P2-S1-02',videoLayers:[{id:'demo',customClip:{url:'/videos/demo.mp4',name:'공간 시연'}},{id:'local',customClip:{url:'blob:https://example.com/local',name:'Private'}}]};
 const hash=encodeLook(state),restored=decodeLook(hash);
 assert.equal(restored.showVideo,true);
 assert.equal(restored.videoId,'P2-S1-02');
 assert.deepEqual(restored.videoLayers[0].customClip,{url:'/videos/demo.mp4',name:'공간 시연'});
 assert.equal(restored.videoLayers[1].customClip,undefined);
 assert.equal(hash.includes('blob:'),false);
 assert.equal(state.videoLayers[1].customClip.name,'Private');
});

test('decode sanitizes incoming values and ignores unapproved properties',()=>{
 const restored=decodeLook(rawHash({brightness:999,speed:-1,motionAmount:20,variant:999,paused:true,offset:-9,epoch:1,unknown:'private',editVideos:true,editElements:true,activeElement:'bad',videoLayers:[{id:'local',customClip:{url:'blob:bad'}}]}));
 assert.equal(restored.brightness,100);
 assert.equal(restored.speed,0);
 assert.equal(restored.motionAmount,2);
 assert.equal(restored.variant,0);
 assert.equal(restored.offset,0);
 assert.equal(restored.unknown,undefined);
 assert.equal(restored.videoLayers[0].customClip,undefined);
 assert.equal(restored.editVideos,false);
 assert.notEqual(restored.epoch,1);
});

test('invalid, unrecognized, non-object, malformed UTF-8 and oversized hashes return null',()=>{
 const invalid=[undefined,null,42,'','#other=v1.e30','#look=v2.e30','#look=v1.','#look=v1.!!!!','#look=v1.A',rawHash(null),rawHash([]),rawHash('hello'),rawHash(1),'#look=v1.'+Buffer.from('{bad').toString('base64url'),'#look=v1._w','#look=v1.'+'a'.repeat(200001)];
 for(const hash of invalid)assert.equal(decodeLook(hash),null,String(hash).slice(0,60));
 assert.throws(()=>encodeLook({videoLayers:[{customClip:{url:'https://example.com/'+'한'.repeat(100000)}}]}),RangeError);
});

test('lookUrl preserves the base path and query while replacing its hash',()=>{
 const state={variant:1};
 const url=lookUrl(state,'https://walls.example/backgrounds/studio.html?screen=front#old');
 assert.equal(url,'https://walls.example/backgrounds/studio.html?screen=front'+encodeLook(state));
 assert.equal(lookUrl(state,'./studio.html?screen=left#old'),'./studio.html?screen=left'+encodeLook(state));
});
