import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import { defaults, sanitize, timeline, setPaused, setSpeed, panorama, leftAspect, variants } from './state.js';
import {encodeLook,decodeLook} from './look-url.js';
import {sceneMeanings,researchMeaningActive} from './meaning-ui.js';

test('invalid saved settings cannot break wall projection', () => {
  const s = sanitize({variant:99, frontW:0, leftH:'bad', brightness:900, speed:-2});
  assert.equal(s.variant,0); assert.equal(s.frontW,3840); assert.equal(s.leftH,2160);
  assert.equal(s.brightness,100); assert.equal(s.speed,0);
});
test('3 by 2 tiles use physical 8:3 aspect independently of 4K input', () => {
 const s={...defaults,leftW:3840,leftH:2160,leftShape:'tiles'};
 assert.equal(leftAspect(s),8/3);assert.equal(panorama(s).left.width,2880);
 assert.equal(leftAspect({...s,leftShape:'raster'}),16/9);
});
test('pause freezes time and resume does not jump', () => {
  const s={...defaults,epoch:1000,offset:0,speed:1,paused:false};
  const frozen=setPaused(s,true,4000);
  assert.equal(timeline(frozen,12000),3);
  const resumed=setPaused(frozen,false,15000);
  assert.equal(timeline(resumed,16000),4);
});
test('speed change preserves the current animation phase', () => {
  const s={...defaults,epoch:1000,offset:0,speed:1,paused:false};
  const fast=setSpeed(s,2,4000);
  assert.equal(timeline(fast,4000),3); assert.equal(timeline(fast,5000),5);
});
test('front and left views have an exactly shared edge', () => {
  const p=panorama({...defaults,frontW:3840,frontH:1080,leftW:1920,leftH:1080});
  assert.equal(p.front.x,p.left.width); assert.equal(p.front.width+p.left.width,p.width);
  assert.equal(p.front.height,p.left.height);
});

test('floor-level presets retain authored parts and appearance through shared URLs',()=>{
 assert.deepEqual(variants.slice(6,8).map(v=>v.name),['Serein Atelier','MV Light Court']);
 for(const variant of [6,7]){
  const state=sanitize({variant,authored:{[variant]:{edits:{'court-glass-front':{x:83,size:.8,motionSpeed:.4}},objects:[]}},appearance:{[variant]:{floor:.65,lighting:.8}},videoLayers:[]});
  const loaded=decodeLook(encodeLook(state));
  assert.equal(loaded.variant,variant);assert.deepEqual(loaded.authored,state.authored);assert.deepEqual(loaded.appearance,state.appearance);assert.deepEqual(loaded.videoLayers,[]);
 }
 assert.equal(sanitize({variant:12}).variant,0);
});

test('all sixteen floor-wall variations retain their authored composition in portable looks',()=>{
 const collection=JSON.parse(readFileSync(new URL('./looks/floor-wall-variations.json',import.meta.url),'utf8'));
 assert.equal(collection.looks.length,16);assert.equal(new Set(collection.looks.map(x=>x.name)).size,16);
 for(const {look} of collection.looks){
  const saved=decodeLook(encodeLook(look));assert.equal(saved.variant,look.variant);
  assert.deepEqual(saved.authored,look.authored);assert.deepEqual(saved.appearance,look.appearance);
  assert.equal(saved.screens.find(s=>s.id==='front').width/saved.screens.find(s=>s.id==='front').height,16/9);
  assert.equal(saved.videoLayers.length,0);
 }
});

test('research compositions retain the relational objects and report when their interpretation is active',()=>{
 const collection=JSON.parse(readFileSync(new URL('./looks/research-meaning-variations.json',import.meta.url),'utf8'));
 assert.equal(collection.looks.length,16);assert.equal(sceneMeanings.length,variants.length);
 for(const {look} of collection.looks){
  const saved=decodeLook(encodeLook(look));assert.deepEqual(saved.authored,look.authored);
  assert.equal(researchMeaningActive(saved),true);assert.deepEqual(saved.appearance,look.appearance);
  assert.ok(sceneMeanings[saved.variant].sources.every(([,url])=>url.startsWith('https://')));
 }
 assert.equal(researchMeaningActive(sanitize({variant:0})),false);
 assert.equal(researchMeaningActive(sanitize({variant:0,authored:{0:{objects:[{id:'object-1',type:'presence',visible:false}]}}})),false);
 assert.equal(researchMeaningActive(sanitize({variant:0,authored:{0:{objects:[{id:'source',type:'presence',archived:true,visible:false},{id:'copy',type:'copy',source:'source'}]}}})),true);
 assert.equal(researchMeaningActive(sanitize({variant:0,authored:{0:{objects:[{id:'a',type:'copy',source:'b'},{id:'b',type:'copy',source:'a'}]}}})),false);
});
