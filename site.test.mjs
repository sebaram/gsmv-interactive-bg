import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,stat,access,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {objectTypes} from './authoring.js';
test('public bundle works under a GitHub project path without exposing local media or Git',async()=>{
 const temp=await mkdtemp(join(tmpdir(),'gsmv-pages-')),root=dirname(fileURLToPath(import.meta.url));
 try{
  execFileSync(process.execPath,[join(root,'scripts/build-site.mjs'),'--out',join(temp,'site')],{cwd:root});
  const html=await readFile(join(temp,'site/index.html'),'utf8'),wall=await readFile(join(temp,'site/wall.html'),'utf8');
  assert.match(html,/data-hosting="static"/);assert.match(wall,/data-hosting="static"/);
  assert.match(html,/name="studio-build"/);assert.match(html,/studio\.js\?v=[a-f0-9]{12}/);
  assert.match(await readFile(join(temp,'site/studio.js'),'utf8'),/state\.js\?v=[a-f0-9]{12}/);
  assert.ok(!html.includes('href="/backgrounds/'));
  const clips=JSON.parse(await readFile(join(temp,'site/clips.json'),'utf8'));
  assert.ok(clips.every(c=>c.url==='previews/demo-motion.mp4'));
  assert.ok((await stat(join(temp,'site/previews/demo-motion.mp4'))).size>1000);
  assert.ok((await stat(join(temp,'site/previews/meaning-motion.mp4'))).size>1000);
  await access(join(temp,'site/vendor/three.module.js'));
  assert.equal(JSON.parse(await readFile(join(temp,'site/looks/floor-wall-variations.json'),'utf8')).looks.length,16);
  assert.equal(JSON.parse(await readFile(join(temp,'site/looks/research-meaning-variations.json'),'utf8')).looks.length,16);
  await access(join(temp,'site/meaning-ui.js'));
  await access(join(temp,'site/preset-catalog.js'));
  await access(join(temp,'site/look-thumbnail.js'));
  for(const [type] of objectTypes)assert.ok((await stat(join(temp,'site/assets/element-thumbnails/'+type+'.jpg'))).size>1000);
  await access(join(temp,'site/assets/element-thumbnails/video.svg'));
  for(const variant of [8,9,10,11])await access(join(temp,'site/previews/style-'+variant+'.jpg'));
  await access(join(temp,'site/docs/scene-meanings.md'));
  await access(join(temp,'site/floor-scenes.js'));
  assert.match(await readFile(join(temp,'site/scene.js'),'utf8'),/floor-scenes\.js\?v=[a-f0-9]{12}/);
  await assert.rejects(access(join(temp,'site/.git')));await assert.rejects(access(join(temp,'site/serve.py')));
 }finally{await rm(temp,{recursive:true,force:true});}
});
