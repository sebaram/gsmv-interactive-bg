import test from 'node:test';
import assert from 'node:assert/strict';
import {sanitize} from './state.js';
import {addElement,patchElement,removeElement,presetEdits,resetElement} from './authoring.js';

test('fresh backgrounds are unmodified presets',()=>{
 assert.deepEqual(sanitize().authored,{});assert.equal(sanitize().editElements,false);
});
test('individual objects can be duplicated across screens and reset without changing another preset',()=>{
 let state=addElement(sanitize({variant:1}),'logo',{screen:'front',x:80,size:2});
 const first=state.activeElement;state=addElement(state,'copy',{screen:'left',x:20,size:.4},first);
 const second=state.activeElement;assert.notEqual(first,second);assert.equal(presetEdits(state).objects[0].size,2);assert.equal(presetEdits(state).objects[1].size,.4);
 state=patchElement(state,'preset-main',{x:15,size:.5});assert.equal(presetEdits(state).edits['preset-main'].x,15);
 state=resetElement(state,'preset-main');assert.equal(presetEdits(state).edits['preset-main'],undefined);
 assert.deepEqual(presetEdits({...state,variant:5}),{edits:{},objects:[]});
 state=removeElement(state,first);assert.ok(presetEdits(state).objects.some(o=>o.id===second));assert.ok(presetEdits(state).objects.find(o=>o.id===first).archived);
 state=removeElement(state,second);assert.equal(presetEdits(state).objects.length,0);
});
test('authoring transforms are bounded and independent for each preset and screen',()=>{
 const s=sanitize({authored:{1:{edits:{main:{screen:'front',x:80,y:40,size:2,visible:true},companion:{screen:'left',x:20,y:65,size:.4,visible:false}},objects:[]},5:{edits:{main:{screen:'front',x:2000,size:-3}},objects:[]}}});
 assert.equal(s.authored[1].edits.main.size,2);assert.equal(s.authored[1].edits.companion.size,.4);
 assert.equal(s.authored[5].edits.main.x,150);assert.equal(s.authored[5].edits.main.size,.05);
});
