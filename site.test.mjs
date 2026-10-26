import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,stat,access,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
test('public bundle works under a GitHub project path without exposing local media or Git',async()=>{
 const temp=await mkdtemp(join(tmpdir(),'gsmv-pages-')),root=dirname(fileURLToPath(import.meta.url));
 try{
  execFileSync(process.execPath,[join(root,'scripts/build-site.mjs'),'--out',join(temp,'site')],{cwd:root});
  const html=await readFile(join(temp,'site/index.html'),'utf8'),wall=await readFile(join(temp,'site/wall.html'),'utf8');
  assert.match(html,/data-hosting="static"/);assert.match(wall,/data-hosting="static"/);
  assert.ok(!html.includes('href="/backgrounds/'));
  const clips=JSON.parse(await readFile(join(temp,'site/clips.json'),'utf8'));
  assert.ok(clips.every(c=>c.url==='previews/demo-motion.mp4'));
  assert.ok((await stat(join(temp,'site/previews/demo-motion.mp4'))).size>1000);
  await access(join(temp,'site/vendor/three.module.js'));
  await assert.rejects(access(join(temp,'site/.git')));await assert.rejects(access(join(temp,'site/serve.py')));
 }finally{await rm(temp,{recursive:true,force:true});}
});
