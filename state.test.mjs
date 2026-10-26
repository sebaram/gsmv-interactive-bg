import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, sanitize, timeline, setPaused, setSpeed, panorama, leftAspect } from './state.js';

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
