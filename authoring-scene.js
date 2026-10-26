import * as T from './vendor/three.module.js';
import {panorama,screenAspect} from './state.js';
import {presetEdits,objectTypes} from './authoring.js';

// Animation remains inside a wrapper; authored transforms never overwrite it.
export function authoringScene(group,camera,state,{background,hero,secondary,createObject,view,preview}){
 const entries=[],copies=[],wrappers=new Set(),p=panorama(state),full=camera.clone();full.clearViewOffset();full.left=-p.width/p.height*5;full.right=-full.left;full.updateProjectionMatrix();full.updateMatrixWorld();
 let current=state;const counts=new Map();
 const screenFor=x=>p.screens.find(sc=>x>=sc.x&&x<sc.x+sc.width)||p.screens.at(-1);
 // Existing root IDs are part of saved URLs, independent of improved display labels.
 function legacyName(object){if(object===hero)return 'Main sculpture';if(object===secondary)return 'Companion sculpture';if(object.name)return object.name;const type=object.geometry?.type||object.type;return ({SphereGeometry:'Accent sphere',TorusGeometry:'Orbital ring',TubeGeometry:'Connecting ribbon',CylinderGeometry:'Pedestal',ExtrudeGeometry:'Architectural arch',Line:'Connection line',Group:'Research network',PlaneGeometry:object.material?.map?'Soft shadow':'Stage floor'})[type]||'Sculptural element';}
 function defaultName(object,parent){if(object===hero)return 'Main sculpture';if(object===secondary)return 'Companion sculpture';if(object.name)return object.name;
  const type=object.geometry?.type||object.type,color=object.material?.color?.getHexString(),tint=color==='0066b3'?'Blue':color==='ed1c24'?'Red':'';
  if(parent?.object.name==='MV sculpture'||parent?.kind==='logo')return object.isLine?'MV connection link':(tint?tint+' ':'')+'MV facet';
  if(object.isLine)return parent?'Network link':'Connection line';
  return ({SphereGeometry:parent?.kind==='network'?'Network node':'Accent sphere',TorusGeometry:'Orbital ring',TorusKnotGeometry:'Central knot',TubeGeometry:'Connecting ribbon',CylinderGeometry:'Pedestal',ExtrudeGeometry:'Architectural arch',Group:'Research network',PlaneGeometry:object.material?.map?'Soft shadow':'Stage floor',BufferGeometry:(tint?tint+' ':'')+'Interwoven ribbon'})[type]||'Sculptural element';
 }
 function register(object,custom=null,parent=null,path=[]){
  group.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(object),anchor=bounds.getCenter(new T.Vector3());if(!Number.isFinite(anchor.x))anchor.copy(object.position);
  const ndc=anchor.clone().project(full),pixel=(ndc.x+1)/2*p.width,sc=screenFor(pixel),name=defaultName(object,parent),key=(parent?.id||sc.id)+'-'+(parent?name:legacyName(object)).toLowerCase().replace(/[^a-z0-9]+/g,'-');
  const n=(counts.get(key)||0)+1;counts.set(key,n);
  const rootId=parent?.rootId||parent?.id,id=parent?rootId+'-part-'+path.join('-'):custom?.id||object.userData.authorId||(object===hero?'preset-main':object===secondary?'preset-companion':key+'-'+n);
  const defaults={screen:sc.id,x:(pixel-sc.x)/sc.width*100,y:(1-ndc.y)/2*100,size:1,rotation:0,visible:true};
  const originalParent=object.parent||group,parentMatrix=originalParent.matrixWorld.clone(),localAnchor=anchor.clone().applyMatrix4(parentMatrix.clone().invert()),wrap=new T.Group();originalParent.add(wrap);wrap.add(object);wrappers.add(wrap);
  const label=custom?(custom.type==='copy'?'Copy of '+(entries.find(e=>e.id===custom.source)?.name||'element'):objectTypes.find(t=>t[0]===custom.type)?.[1]||name):name+(n>1?' '+n:'');
  const entry={id,label,name:parent?parent.name+' / '+label:label,parentId:parent?.id||null,rootId:rootId||id,depth:parent?parent.depth+1:0,kind:(custom?.type==='copy'?entries.find(e=>e.id===custom.source)?.kind:custom?.type)||((object.name==='MV sculpture')?'logo':name==='Research network'?'network':null),object,wrap,anchor,localAnchor,parentMatrix,defaults,custom:!!custom,owner:parent?.owner||custom?.id||null};entries.push(entry);return entry;
 }
 function registerTree(object,custom=null,parent=null,path=[]){const children=[...object.children],entry=register(object,custom,parent,path);for(const [i,child] of children.entries())if(child.isMesh||child.isLine||child.isGroup)registerTree(child,null,entry,[...path,i+1]);return entry;}
 for(const object of [...group.children])if(object!==background)registerTree(object);
 // Ignore authoring wrappers when cloning: original animation nodes remain paired,
 // while each copy gets its own authoring wrappers and descendant edit IDs.
 function cloneAnimated(source){
  const pairs=[];
  function cloneNode(object){if(wrappers.has(object))return cloneNode(object.children[0]);const clone=object.clone(false);pairs.push([object,clone]);for(const child of object.children)clone.add(cloneNode(child));return clone;}
  const clone=cloneNode(source);copies.push({pairs,source,clone});baseWorld(source).decompose(clone.position,clone.quaternion,clone.scale);return clone;
 }
 function baseWorld(object){const chain=[];for(let node=object;node&&node!==group;node=node.parent)if(!wrappers.has(node))chain.unshift(node);const matrix=new T.Matrix4();for(const node of chain){node.updateMatrix();matrix.multiply(node.matrix);}return matrix;}
 for(const custom of presetEdits(state).objects){
  if(custom.type==='copy'){
   const source=entries.find(e=>e.id===custom.source);if(!source)continue;
   const clone=cloneAnimated(source.object);group.add(clone);const entry=registerTree(clone,custom);entry.defaults={...source.defaults,size:1,rotation:0,visible:true};
  }else {const object=createObject(custom.type);if(object)registerTree(object,custom);}
 }
 for(const sc of p.screens)for(const [domId,name,y] of [['branding','Department signature',9],['headline','Research titles',70],['wall-caption','Topic footer',90]])entries.push({id:domId+'-'+sc.id,name,domId,custom:false,defaults:{screen:sc.id,x:7,y,size:1,rotation:0,visible:true}});
 function resolved(entry){const preset=presetEdits(current),patch=entry.custom?preset.objects.find(o=>o.id===entry.id):preset.edits[entry.id];return {...entry.defaults,...patch};}
 function target(r,z){
  const sc=p.screens.find(sc=>sc.id===r.screen)||p.screens[0],x=(sc.x+sc.width*r.x/100)/p.width*2-1,y=1-r.y/50;
  const near=new T.Vector3(x,y,-1).unproject(full),far=new T.Vector3(x,y,1).unproject(full),direction=far.sub(near);return near.addScaledVector(direction,(z-near.z)/direction.z);
 }
 function applyDom(entry){const r=resolved(entry);if(entry.defaults.screen!==view)return;const el=document.getElementById(entry.domId),edited=presetEdits(current).edits[entry.id],sc=current.screens.find(s=>s.id===view)||current.screens[0],correction=(innerWidth/innerHeight)/screenAspect(sc);el.style.left=edited?r.x+'%':'';el.style.top=edited?r.y+'%':'';el.style.bottom=edited?'auto':'';el.style.transform=`scaleX(${correction}) scale(${r.size}) rotate(${r.rotation}deg)`;el.style.transformOrigin='left top';el.style.display=(entry.domId==='headline'?current.headlines:current.branding)&&r.visible?'':'none';}
 function apply(next){current=next;for(const entry of entries){if(entry.domId){applyDom(entry);continue;}const r=resolved(entry),rotation=r.rotation*Math.PI/180;
  const position=r.x===entry.defaults.x&&r.y===entry.defaults.y&&r.screen===entry.defaults.screen?entry.localAnchor.clone():target(r,entry.anchor.z).applyMatrix4(entry.parentMatrix.clone().invert());
  const anchor=entry.localAnchor.clone().multiplyScalar(r.size).applyAxisAngle(new T.Vector3(0,0,1),rotation);entry.wrap.scale.setScalar(r.size);entry.wrap.rotation.z=rotation;entry.wrap.position.copy(position.sub(anchor));entry.wrap.visible=r.visible;
 }}
 function draw(){for(const {pairs,source,clone} of copies){for(const [a,b] of pairs){b.position.copy(a.position);b.quaternion.copy(a.quaternion);b.scale.copy(a.scale);b.visible=a.visible;}baseWorld(source).decompose(clone.position,clone.quaternion,clone.scale);}drawHandle();}
 function dragOrigin(entry){if(entry.domId)return null;group.updateMatrixWorld(true);return {world:entry.localAnchor.clone().applyMatrix4(entry.wrap.matrixWorld),inverseParent:entry.wrap.parent.matrixWorld.clone().invert()};}
 function dragPatch(entry,r,dx,dy,origin){
  if(!origin)return {x:r.x+dx/innerWidth*100,y:r.y+dy/innerHeight*100};
  const ndc=origin.world.clone().project(camera),x=ndc.x+dx/innerWidth*2,y=ndc.y-dy/innerHeight*2,near=new T.Vector3(x,y,-1).unproject(camera),direction=new T.Vector3(x,y,1).unproject(camera).sub(near);
  const baseline=near.addScaledVector(direction,(origin.world.z-near.z)/direction.z).applyMatrix4(origin.inverseParent).applyMatrix4(entry.parentMatrix).project(full),screen=p.screens.find(sc=>sc.id===r.screen)||p.screens[0];
  return {x:((baseline.x+1)/2*p.width-screen.x)/screen.width*100,y:(1-baseline.y)/2*100};
 }
 let handle,pickAt;
 if(preview){
  handle=document.createElement('div');handle.className='element-handle';handle.hidden=true;handle.tabIndex=0;handle.setAttribute('role','group');handle.setAttribute('aria-label','Selected element. Use arrow keys to move.');const title=document.createElement('span'),resize=document.createElement('button');title.className='element-handle-label';resize.className='element-resize';resize.type='button';resize.setAttribute('aria-label','Resize selected element');handle.append(title,resize);document.querySelector('#element-handles').replaceChildren(handle);
  handle.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();const entry=entries.find(e=>e.id===current.activeElement);if(!entry)return;const r=resolved(entry),start={x:e.clientX,y:e.clientY},origin=dragOrigin(entry),bounds=handle.getBoundingClientRect(),resizing=!!e.target.closest('.element-resize')||(e.clientX>=bounds.right-20&&e.clientY>=bounds.bottom-20),width=bounds.width;let moved=false;handle.setPointerCapture(e.pointerId);handle.onpointermove=event=>{const dx=event.clientX-start.x,dy=event.clientY-start.y;moved=moved||Math.hypot(dx,dy)>=3;if(moved)parent.METAStudio?.updateElement(entry.id,resizing?{size:r.size*Math.max(.1,1+dx*2/Math.max(20,width))}:dragPatch(entry,r,dx,dy,origin));};const finish=event=>{if(handle.hasPointerCapture(e.pointerId))handle.releasePointerCapture(e.pointerId);handle.onpointermove=null;handle.onpointerup=null;handle.onpointercancel=null;if(event.type==='pointerup'&&!moved&&!resizing&&!entry.domId)pickAt(event.clientX,event.clientY);};handle.onpointerup=finish;handle.onpointercancel=finish;};
  handle.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const entry=entries.find(e=>e.id===current.activeElement);if(!entry)return;const r=resolved(entry),step=e.shiftKey?5:1;parent.METAStudio?.updateElement(entry.id,dragPatch(entry,r,(e.key==='ArrowLeft'?-step:e.key==='ArrowRight'?step:0)*innerWidth/100,(e.key==='ArrowUp'?-step:e.key==='ArrowDown'?step:0)*innerHeight/100,dragOrigin(entry)));};
  const canvas=document.querySelector('#scene'),raycaster=new T.Raycaster();raycaster.params.Line.threshold=.09;
  pickAt=(x,y)=>{if(!current.editElements)return;group.updateMatrixWorld(true);const rect=canvas.getBoundingClientRect();raycaster.setFromCamera(new T.Vector2((x-rect.left)/rect.width*2-1,1-(y-rect.top)/rect.height*2),camera);const hit=raycaster.intersectObjects(entries.filter(entry=>entry.object?.geometry).map(entry=>entry.object),false).find(hit=>{for(let o=hit.object;o;o=o.parent)if(!o.visible)return false;return true;});const entry=hit&&entries.find(entry=>entry.object===hit.object);if(entry)parent.METAStudio?.selectElement?.(entry.id);};
  canvas.onpointerdown=e=>{if(e.button===0)pickAt(e.clientX,e.clientY);};
 }
 function drawHandle(){
  if(!handle)return;const entry=entries.find(e=>e.id===current.activeElement),r=entry&&resolved(entry);
  handle.hidden=!current.editElements||!entry||!r.visible;if(handle.hidden)return;
  if(entry.domId){if(entry.defaults.screen!==view){handle.hidden=true;return;}const el=document.getElementById(entry.domId),rect=el.getBoundingClientRect();if(!rect.width||!rect.height){handle.hidden=true;return;}Object.assign(handle.style,{left:rect.left/innerWidth*100+'%',top:rect.top/innerHeight*100+'%',width:rect.width/innerWidth*100+'%',height:rect.height/innerHeight*100+'%'});handle.querySelector('span').textContent=entry.name;return;}
  for(let object=entry.object;object;object=object.parent)if(!object.visible){handle.hidden=true;return;}
  group.updateMatrixWorld(true);entry.object.traverse(object=>object.geometry?.computeBoundingBox());const box=new T.Box3().setFromObject(entry.object),points=[];for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])points.push(new T.Vector3(x,y,z).project(camera));
  const xs=points.map(v=>(v.x+1)*50),ys=points.map(v=>(1-v.y)*50),left=Math.max(0,Math.min(...xs)),top=Math.max(0,Math.min(...ys)),right=Math.min(100,Math.max(...xs)),bottom=Math.min(100,Math.max(...ys));
  if(right<0||left>100||bottom<0||top>100||right<left||bottom<top){handle.hidden=true;return;}
  Object.assign(handle.style,{left:left+'%',top:top+'%',width:Math.max(5,right-left)+'%',height:Math.max(5,bottom-top)+'%'});handle.querySelector('span').textContent=entry.name;
 }
 apply(state);return {apply,draw,get manifest(){return entries.filter(entry=>!resolved(entry).archived&&(!entry.owner||!presetEdits(current).objects.find(o=>o.id===entry.owner)?.archived)).map(entry=>({id:entry.id,name:entry.name,parentId:entry.parentId,rootId:entry.rootId,depth:entry.depth||0,owner:entry.owner,custom:entry.custom,dom:!!entry.domId,base:entry.defaults,...resolved(entry)}));}};
}
