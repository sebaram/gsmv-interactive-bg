import test from 'node:test';
import assert from 'node:assert/strict';
import {motionPose} from './motion.js';
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
