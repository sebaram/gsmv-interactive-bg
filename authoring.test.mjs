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
import * as T from './vendor/three.module.js';
import {authoringScene} from './authoring-scene.js';
import {encodeLook,decodeLook} from './look-url.js';

function fixture(){
 globalThis.innerWidth=1280;globalThis.innerHeight=720;
 globalThis.document={getElementById:()=>({style:{}})};
 const state=sanitize({variant:1}),group=new T.Group(),hero=new T.Group();hero.position.set(4,1,0);group.add(hero);
 const ribbon=new T.Mesh(new T.TorusGeometry(1,.1,6,12),new T.MeshBasicMaterial({color:'#0066b3'}));ribbon.position.set(1,0,0);hero.add(ribbon);
 const sphere=new T.Mesh(new T.SphereGeometry(.3,8,6),new T.MeshBasicMaterial({color:'#ed1c24'}));sphere.position.set(-1,1,0);hero.add(sphere);
 const camera=new T.OrthographicCamera(-20,20,5,-5,.1,140);camera.position.set(0,3.8,32);camera.lookAt(0,0,0);camera.updateMatrixWorld();
 return {state,group,hero,ribbon,sphere,camera};
}
function makeAuthor(f,state=f.state){return authoringScene(f.group,f.camera,state,{hero:f.hero,view:'front',preview:false,createObject:()=>null});}
function matrix(object){object.updateWorldMatrix(true,false);return object.matrixWorld.elements;}
function closeMatrix(a,b){a.forEach((v,i)=>assert.ok(Math.abs(v-b[i])<1e-9,`matrix component ${i}: ${v} != ${b[i]}`));}

test('preset groups expose semantic, stable paths for each nested part without changing defaults',()=>{
 const f=fixture(),before=matrix(f.ribbon).slice(),author=makeAuthor(f),part=author.manifest.find(e=>e.parentId==='preset-main');
 assert.ok(part,'nested part appears in the element registry');assert.equal(part.id,'preset-main-part-1');assert.match(part.name,/Main sculpture.*Orbital ring/);assert.equal(part.depth,1);
 closeMatrix(matrix(f.ribbon),before);
 const second=makeAuthor(fixture()).manifest.find(e=>e.parentId==='preset-main');assert.equal(part.id,second.id);
});

test('editing a part composes with animated parent motion and leaves siblings untouched',()=>{
 const f=fixture(),author=makeAuthor(f),id=author.manifest.find(e=>e.parentId==='preset-main')?.id;
 assert.ok(id,'nested part can be addressed');const sibling=matrix(f.sphere).slice();
 let state=patchElement(f.state,id,{size:2,rotation:45,visible:false});author.apply(state);
 closeMatrix(matrix(f.sphere),sibling);assert.equal(f.ribbon.parent.visible,false);assert.equal(f.ribbon.parent.scale.x,2);
 const wrapper=f.ribbon.parent,local=wrapper.matrix.clone();f.hero.rotation.z=.4;author.draw();closeMatrix(wrapper.matrix.elements,local.elements);
 author.apply(resetElement(state,id));assert.equal(wrapper.visible,true);assert.equal(wrapper.scale.x,1);assert.equal(wrapper.rotation.z,0);
});

test('a copied leaf has its source world placement and motion with independent authoring',()=>{
 const f=fixture(),first=makeAuthor(f),part=first.manifest.find(e=>e.parentId==='preset-main');assert.ok(part,'leaf is copyable');
 let state=addElement(f.state,'copy',{screen:part.screen,x:part.x,y:part.y},part.id);
 // Rebuild exactly as the production scene does when the object list changes.
 const g=fixture(),author=makeAuthor(g,state),copy=author.manifest.find(e=>e.id==='object-1');assert.ok(copy);
 const clone=g.group.children.find(w=>w.children[0]!==g.hero)?.children[0];assert.ok(clone);
 author.draw();closeMatrix(matrix(clone),matrix(g.ribbon));
 g.hero.rotation.z=.7;g.ribbon.rotation.y=.3;author.draw();closeMatrix(matrix(clone),matrix(g.ribbon));
 author.apply(patchElement(state,part.id,{visible:false}));assert.equal(clone.parent.visible,true);
});

test('copied groups retain independent child edits through portable URLs',()=>{
 let state=patchElement(sanitize({variant:1}),'preset-main-part-2',{size:.45,rotation:30,visible:false});
 state=addElement(state,'copy',{x:25,screen:'left'},'preset-main');
 assert.deepEqual(presetEdits(state).edits['object-1-part-2'],{size:.45,rotation:30,visible:false});
 state=patchElement(state,'object-1-part-2',{visible:true});assert.equal(presetEdits(state).edits['preset-main-part-2'].visible,false);
 assert.deepEqual(decodeLook(encodeLook(state)).authored,sanitize(state).authored);
});

test('removing a custom group preserves sources of copied descendants and clears orphaned part edits',()=>{
 let state=addElement(sanitize(),'orbits');state=patchElement(state,'object-1-part-2',{size:2});state=addElement(state,'copy',{},'object-1-part-2');
 state=removeElement(state,'object-1');assert.equal(presetEdits(state).objects.find(o=>o.id==='object-1')?.archived,true);
 state=removeElement(state,'object-2');assert.equal(presetEdits(state).objects.length,0);assert.equal(presetEdits(state).edits['object-1-part-2'],undefined);
});

test('a portable preset retains edits after the 160th network part',()=>{
 const edits=Object.fromEntries(Array.from({length:250},(_,i)=>['network-part-'+i,{size:.5+i/100,rotation:i%180}]));
 const state=sanitize({variant:3,authored:{3:{edits,objects:[]}}}),restored=decodeLook(encodeLook(state));
 assert.equal(Object.keys(restored.authored[3].edits).length,250);assert.deepEqual(restored.authored[3].edits['network-part-249'],edits['network-part-249']);
});

test('copying a nested subgroup remaps deeper child edits to its new root',()=>{
 let state=patchElement(sanitize({variant:1}),'preset-main-part-2-3',{size:.7});
 state=addElement(state,'copy',{},'preset-main-part-2');
 assert.deepEqual(presetEdits(state).edits['object-1-part-3'],{size:.7});
});

test('semantic part labels preserve legacy top-level element IDs in saved looks',()=>{
 const f=fixture(),line=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(0,0,0),new T.Vector3(1,1,0)]),new T.LineBasicMaterial());f.group.add(line);
 const author=makeAuthor(f),entry=author.manifest.find(e=>e.name==='Connection line');
 assert.ok(entry);assert.match(entry.id,/-sculptural-element-1$/);
});
