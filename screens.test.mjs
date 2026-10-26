import test from 'node:test';
import assert from 'node:assert/strict';
import {sanitize,panorama,screenAspect,createScreen,removeScreen,updateScreen} from './state.js';

test('legacy saved two-wall look migrates without changing its input or layout',()=>{
 const s=sanitize({frontW:3840,frontH:2160,leftW:3840,leftH:2160,leftShape:'tiles',bezel:32});
 assert.equal(s.screens.length,2);
 assert.equal(screenAspect(s.screens.find(x=>x.id==='left')),8/3);
 assert.equal(s.screens.find(x=>x.id==='left').cols,3);
 assert.equal(s.screens.find(x=>x.id==='left').rows,2);
 assert.equal(s.screens.find(x=>x.id==='left').grid,true);
});
test('each screen has an independent physical ratio and arbitrary rectangular tile grid',()=>{
 const s=sanitize({screens:[{id:'front',name:'LED',width:3840,height:2160,mode:'custom',aspectW:21,aspectH:9,cols:5,rows:2,grid:true},{id:'left',name:'Tiles',width:3840,height:2160,mode:'tiles',cols:4,rows:3,tileW:16,tileH:9}]});
 assert.equal(screenAspect(s.screens[0]),21/9);
 assert.equal(screenAspect(s.screens[1]),64/27);
 assert.equal(s.screens[0].cols,5);assert.equal(s.screens[0].rows,2);
});
test('screens may be added, edited and removed with stable output identities',()=>{
 let s=sanitize({});s=createScreen(s);
 assert.equal(s.screens.length,3);
 const id=s.screens[2].id;
 s=updateScreen(s,id,{name:'Rear wall',mode:'custom',aspectW:9,aspectH:16,width:2160,height:3840});
 assert.equal(screenAspect(s.screens[2]),9/16);
 const p=panorama(s);assert.equal(p.screens.length,3);
 for(let i=1;i<p.screens.length;i++)assert.equal(p.screens[i].x,p.screens[i-1].x+p.screens[i-1].width);
 assert.equal(p.screens.at(-1).x+p.screens.at(-1).width,p.width);
 s=removeScreen(s,'left');assert.equal(s.screens.length,2);assert.equal(s.screens[1].id,id);
});
test('invalid imported screens are bounded and the last screen cannot be removed',()=>{
 let s=sanitize({screens:[{id:'front',width:0,height:-2,cols:0,rows:900,mode:'custom',aspectW:0,aspectH:NaN},{id:'front'}]});
 assert.equal(new Set(s.screens.map(x=>x.id)).size,2);
 assert.ok(screenAspect(s.screens[0])>0);assert.ok(s.screens[0].rows<=32);
 s=removeScreen(s,s.screens[1].id);s=removeScreen(s,s.screens[0].id);assert.equal(s.screens.length,1);
});
test('combined style remains selectable in shared state',()=>assert.equal(sanitize({variant:4}).variant,4));
