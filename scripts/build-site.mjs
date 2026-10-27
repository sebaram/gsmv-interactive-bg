import {copyFile,cp,mkdir,readFile,writeFile,stat} from 'node:fs/promises';
import {dirname,resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2),index=args.indexOf('--out');
const out=resolve(index>=0?args[index+1]:join(root,'_site'));
if(out===root)throw Error('The site output must be a separate directory');
await mkdir(out,{recursive:true});
const files=['index.html','wall.html','studio.css','wall.css','tokens.css','base.css','state.js','appearance.js','appearance-ui.js','motion.js','object-motion.js','logo-morph.js','logo-scene.js','video-library.js','youtube-source.js','youtube-player.js','authoring.js','authoring-scene.js','authoring-ui.js','element-list.js','look-url.js','video-layers.js','video-overlay.js','video-layer-controls.js','sync.js','sync-worker.js','scene.js','studio.js','screens-ui.js','README.md'];
files.push('server-library.js','server-library.css','floor-scenes.js');
const sources=await Promise.all(files.map(file=>readFile(join(root,file),'utf8')));
const version=createHash('sha256').update(sources.join('\n')).digest('hex').slice(0,12);
for(let i=0;i<files.length;i++){
 const file=files[i];let source=sources[i];
 if(file.endsWith('.html'))source=source.replace('<html lang="en">','<html lang="en" data-hosting="static">').replace('<head>','<head><meta name="studio-build" content="'+version+'">').replace(/(src|href)="([^"?]+\.(?:js|css))"/g,'$1="$2?v='+version+'"');
 if(file.endsWith('.js')||file.endsWith('.css'))source=source.replace(/(['"])(\.\/[^'"?]+\.(?:js|css|json))\1/g,'$1$2?v='+version+'$1');
 await writeFile(join(out,file),source);
}
for(const dir of ['assets','vendor','previews','looks'])await cp(join(root,dir),join(out,dir),{recursive:true,filter:path=>!path.split(/[\\/]/).at(-1).startsWith('qa-')});
const demo=await stat(join(out,'previews/demo-motion.mp4'));
if(demo.size<1000)throw Error('The public animation demo is missing');
const clips=JSON.parse(await readFile(join(root,'clips.json'),'utf8')).map(c=>({...c,originalDuration:c.duration,url:'previews/demo-motion.mp4',duration:8,kind:'animation-demo'}));
await writeFile(join(out,'clips.json'),JSON.stringify(clips,null,2));
await writeFile(join(out,'.nojekyll'),'');
console.log('Static studio built at '+out);
