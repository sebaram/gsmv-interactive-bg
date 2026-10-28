import test from 'node:test';
import assert from 'node:assert/strict';
import {sanitize,setPaused} from './state.js';
import {patchElement} from './authoring.js';
import {draftFingerprint,draftTracker} from './look-draft.js';

test('dirty detection ignores playback, selection and automatic video metadata',()=>{
 const state=sanitize({variant:8,videoLayers:[{id:'video-1',videoId:'one'}]});
 const runtime={...setPaused(state,true),offset:100,epoch:55,activeElement:'preset-main',editElements:true,guide:true,videoLayers:state.videoLayers.map(l=>({...l,sourceAspect:2}))};
 assert.equal(draftFingerprint(state),draftFingerprint(runtime));
 assert.notEqual(draftFingerprint(state),draftFingerprint(patchElement(state,'preset-main',{x:70})));
});
test('per-preset drafts remain dirty after switching back, and undo restores clean state',()=>{
 const initial=sanitize({variant:8}),tracker=draftTracker(initial),edited=patchElement(initial,'preset-main',{size:1.2});
 assert.equal(tracker.dirty(edited),true);
 tracker.visit({...edited,variant:9});assert.equal(tracker.dirty({...edited,variant:9}),false);
 tracker.visit(edited);assert.equal(tracker.dirty(edited),true);assert.equal(tracker.dirty(initial),false);
});
test('only the submitted snapshot is marked saved while edits made during a request remain dirty',()=>{
 const state=sanitize({variant:8}),tracker=draftTracker(state),submitted=patchElement(state,'preset-main',{size:1.2}),later=patchElement(submitted,'preset-main',{size:1.4});
 tracker.saved(submitted,{id:'a',name:'Saved',look:submitted});
 assert.equal(tracker.dirty(submitted),false);assert.equal(tracker.dirty(later),true);
 assert.equal(tracker.canUpdate(submitted,'a'),true);assert.equal(tracker.canUpdate(submitted,'b'),false);
 assert.equal(tracker.canUpdate({...submitted,variant:9},'a'),false);
 tracker.leaveProject();assert.equal(tracker.canUpdate(submitted,'a'),false);
});
test('loading a different composition replaces baselines and provenance without saving old edits',()=>{
 const state=sanitize({variant:8}),tracker=draftTracker(state),other=sanitize({variant:3,brightness:44});
 tracker.load(other,{id:'b',name:'Other',look:other});assert.equal(tracker.dirty(other),false);
 assert.equal(tracker.project.id,'b');tracker.rename({id:'b',name:'Renamed'});assert.equal(tracker.project.name,'Renamed');
 tracker.forget('b');assert.equal(tracker.project,null);
});
