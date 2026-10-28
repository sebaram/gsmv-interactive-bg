import test from 'node:test';
import assert from 'node:assert/strict';
import {variants,sanitize,createScreen} from './state.js';
import {addElement,patchElement} from './authoring.js';
import {patchAppearance} from './appearance.js';
import {encodeLook,decodeLook} from './look-url.js';

test('the four kinetic graphics are independent presets with portable authoring and appearance',()=>{
 assert.deepEqual(variants.slice(8).map(v=>v.name),['Co-presence','Shared coordinates','Mutual response','Co-creation']);
 let state=createScreen(sanitize({variant:8}));
 for(const variant of [8,9,10,11]){
  state=sanitize({...state,variant});state=addElement(state,'sphere');state=patchElement(state,'preset-main',{motionSpeed:.7,x:83});state=patchAppearance(state,{lighting:.8});
 }
 const restored=decodeLook(encodeLook(state));
 assert.equal(restored.variant,11);assert.equal(restored.screens.length,3);
 for(const variant of [8,9,10,11]){
  assert.equal(restored.authored[variant].objects[0].type,'sphere');
  assert.equal(restored.authored[variant].edits['preset-main'].motionSpeed,.7);
  assert.equal(restored.appearance[variant].lighting,.8);
 }
 assert.equal(sanitize({variant:12}).variant,0);
});
