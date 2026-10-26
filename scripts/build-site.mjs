import {copyFile,cp,mkdir,readFile,writeFile,stat} from 'node:fs/promises';
import {dirname,resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2),index=args.indexOf('--out');
const out=resolve(index>=0?args[index+1]:join(root,'_site'));
if(out===root)throw Error('The site output must be a separate directory');
await mkdir(out,{recursive:true});
for(const file of ['index.html','wall.html','studio.css','wall.css','tokens.css','base.css','state.js','motion.js','sync.js','sync-worker.js','scene.js','studio.js','screens-ui.js','README.md']){
 if(file.endsWith('.html')){const html=await readFile(join(root,file),'utf8');await writeFile(join(out,file),html.replace('<html lang="en">','<html lang="en" data-hosting="static">'));}
 else await copyFile(join(root,file),join(out,file));
}
for(const dir of ['assets','vendor','previews'])await cp(join(root,dir),join(out,dir),{recursive:true,filter:path=>!path.split(/[\\/]/).at(-1).startsWith('qa-')});
const demo=await stat(join(out,'previews/demo-motion.mp4'));
if(demo.size<1000)throw Error('The public animation demo is missing');
const clips=JSON.parse(await readFile(join(root,'clips.json'),'utf8')).map(c=>({...c,url:'previews/demo-motion.mp4',duration:8,kind:'animation-demo'}));
await writeFile(join(out,'clips.json'),JSON.stringify(clips,null,2));
await writeFile(join(out,'.nojekyll'),'');
console.log('Static studio built at '+out);
