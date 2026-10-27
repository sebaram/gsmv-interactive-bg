import test from 'node:test';
import * as motionTools from './motion.js';
import assert from 'node:assert/strict';
import {motionPose} from './motion.js';

test('per-object clocks retime continuously and freeze independently',()=>{
 assert.equal(typeof motionTools.clockTime,'function');assert.equal(typeof motionTools.retimeMotion,'function');
 const changed=motionTools.retimeMotion({},2,10);assert.equal(motionTools.clockTime(10,changed),10);assert.equal(motionTools.clockTime(12,changed),14);
 const held=motionTools.retimeMotion(changed,0,12);assert.equal(motionTools.clockTime(20,held),14);assert.equal(motionTools.clockTime(20,{}),20);
 assert.equal(motionTools.clockTime(motionTools.clockTime(10,{motionSpeed:2}),{motionSpeed:.5}),10);
});
test('ribbons rotate visibly over a short take on both main and companion walls',()=>{
 for(const phase of [0,2,3]){const a=motionPose('ribbon',10,phase,1),b=motionPose('ribbon',12,phase,1);assert.ok(Math.abs(b.y-a.y)>.14);}
});
test('research network and floating gallery visibly move',()=>{
 const a=motionPose('network',10,0,1),b=motionPose('network',12,0,1);assert.ok(b.y-a.y>.2);
 const c=motionPose('gallery',0,0,1),d=motionPose('gallery',3,0,1);assert.ok(Math.abs(c.lift-d.lift)>.08);
});
test('motion amount zero holds all decorative transforms',()=>{
 for(const type of ['ribbon','network','gallery','orbit','float'])assert.deepEqual(motionPose(type,1,2,0),motionPose(type,20,2,0));
});
