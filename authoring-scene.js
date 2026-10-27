import * as T from './vendor/three.module.js';
import {panorama,screenAspect} from './state.js';
import {presetEdits,objectTypes,isElementDeleted,elementEditTarget} from './authoring.js';

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
  if(object.isLine)return parent?'Network link':'Connection line · floor grid';
  if(type==='TubeGeometry'&&!parent)return 'Long line · '+(object.material.color.r>object.material.color.b?'Red':'Blue')+' ribbon';
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
  const entry={id,label,name:parent?parent.name+' / '+label:label,parentId:parent?.id||null,rootId:rootId||id,depth:parent?parent.depth+1:0,kind:(custom?.type==='copy'?entries.find(e=>e.id===custom.source)?.kind:custom?.type)||((object.name==='MV sculpture')?'logo':name==='Research network'?'network':null),object,wrap,anchor,localAnchor,parentMatrix,defaults,custom:!!custom,owner:parent?.owner||custom?.id||null};if(entry.kind==='logo'&&!parent){defaults.seed=0;defaults.randomness=0;}entries.push(entry);return entry;
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
   const independentMV=source.kind==='logo'&&!source.parentId;
   const clone=independentMV?createObject('logo'):cloneAnimated(source.object);
   if(independentMV){clone.position.copy(source.object.position);clone.quaternion.copy(source.object.quaternion);clone.scale.copy(source.object.scale);}
   group.add(clone);const entry=registerTree(clone,custom);entry.defaults={...source.defaults,size:1,rotation:0,visible:true};
  }else {const object=createObject(custom.type);if(object)registerTree(object,custom);}
 }
 for(const sc of p.screens)for(const [domId,name,y] of [['branding','Department signature',9],['headline','Research titles',70],['wall-caption','Topic footer',90]])entries.push({id:domId+'-'+sc.id,name,domId,custom:false,defaults:{screen:sc.id,x:7,y,size:1,rotation:0,visible:true}});
 function resolved(entry){const preset=presetEdits(current),patch=entry.custom?preset.objects.find(o=>o.id===entry.id):preset.edits[entry.id];return {...entry.defaults,...patch};}
 function target(r,z){
  const sc=p.screens.find(sc=>sc.id===r.screen)||p.screens[0],x=(sc.x+sc.width*r.x/100)/p.width*2-1,y=1-r.y/50;
  const near=new T.Vector3(x,y,-1).unproject(full),far=new T.Vector3(x,y,1).unproject(full),direction=far.sub(near);return near.addScaledVector(direction,(z-near.z)/direction.z);
 }
 function applyDom(entry){const r=resolved(entry);if(entry.defaults.screen!==view)return;const el=document.getElementById(entry.domId),edited=presetEdits(current).edits[entry.id],sc=current.screens.find(s=>s.id===view)||current.screens[0],correction=(innerWidth/innerHeight)/screenAspect(sc);el.style.left=edited?r.x+'%':'';el.style.top=edited?r.y+'%':'';el.style.bottom=edited?'auto':'';el.style.transform=`scaleX(${correction}) scale(${r.size}) rotate(${r.rotation}deg)`;el.style.transformOrigin='left top';el.style.display=(entry.domId==='headline'?current.headlines:current.branding)&&r.visible&&!r.deleted?'':'none';}
 function apply(next){current=next;for(const entry of entries){if(entry.domId){applyDom(entry);continue;}const r=resolved(entry),rotation=r.rotation*Math.PI/180;
  if(entry.kind==='logo'&&!entry.parentId)entry.object.userData.mvSettings={seed:r.seed||0,randomness:r.randomness||0};
  const position=r.x===entry.defaults.x&&r.y===entry.defaults.y&&r.screen===entry.defaults.screen?entry.localAnchor.clone():target(r,entry.anchor.z).applyMatrix4(entry.parentMatrix.clone().invert());
  const anchor=entry.localAnchor.clone().multiplyScalar(r.size).applyAxisAngle(new T.Vector3(0,0,1),rotation);entry.wrap.scale.setScalar(r.size);entry.wrap.rotation.z=rotation;entry.wrap.position.copy(position.sub(anchor));entry.wrap.visible=r.visible&&!r.deleted;
 }}
 function draw(){for(const {pairs,source,clone} of copies){for(const [a,b] of pairs){b.position.copy(a.position);b.quaternion.copy(a.quaternion);b.scale.copy(a.scale);b.visible=a.visible;}baseWorld(source).decompose(clone.position,clone.quaternion,clone.scale);}drawHandle();}
 function dragOrigin(entry){if(entry.domId)return null;group.updateMatrixWorld(true);return {world:entry.localAnchor.clone().applyMatrix4(entry.wrap.matrixWorld),inverseParent:entry.wrap.parent.matrixWorld.clone().invert()};}
 function dragPatch(entry,r,dx,dy,origin){
  if(!origin)return {x:r.x+dx/innerWidth*100,y:r.y+dy/innerHeight*100};
  const ndc=origin.world.clone().project(camera),x=ndc.x+dx/innerWidth*2,y=ndc.y-dy/innerHeight*2,near=new T.Vector3(x,y,-1).unproject(camera),direction=new T.Vector3(x,y,1).unproject(camera).sub(near);
  const baseline=near.addScaledVector(direction,(origin.world.z-near.z)/direction.z).applyMatrix4(origin.inverseParent).applyMatrix4(entry.parentMatrix).project(full),screen=p.screens.find(sc=>sc.id===r.screen)||p.screens[0];
  return {x:((baseline.x+1)/2*p.width-screen.x)/screen.width*100,y:(1-baseline.y)/2*100};
 }
 let handle,hover,pickAt,hovered=null,dragging=false,pointerPosition=null;
 function visibleRect(entry){
  if(!entry||!resolved(entry).visible)return null;
  if(entry.domId){if(entry.defaults.screen!==view)return null;const r=document.getElementById(entry.domId).getBoundingClientRect();return r.width&&r.height?{left:r.left,top:r.top,right:r.right,bottom:r.bottom}:null;}
  for(let object=entry.object;object;object=object.parent)if(!object.visible)return null;
  group.updateMatrixWorld(true);entry.object.traverse(object=>object.geometry?.computeBoundingBox());
  const box=new T.Box3().setFromObject(entry.object),points=[];
  for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])points.push(new T.Vector3(x,y,z).project(camera));
  const xs=points.map(v=>(v.x+1)/2*innerWidth),ys=points.map(v=>(1-v.y)/2*innerHeight);
  const left=Math.max(0,Math.min(...xs)),top=Math.max(0,Math.min(...ys)),right=Math.min(innerWidth,Math.max(...xs)),bottom=Math.min(innerHeight,Math.max(...ys));
  return right>=left&&bottom>=top?{left,top,right,bottom}:null;
 }
 function paintMarker(marker,entry,selected=false){
  const r=visibleRect(entry);marker.hidden=!r;if(!r)return;
  const width=Math.min(innerWidth,Math.max(selected?42:12,r.right-r.left)),height=Math.min(innerHeight,Math.max(selected?36:12,r.bottom-r.top));
  const left=Math.max(0,Math.min(innerWidth-width,(r.left+r.right-width)/2)),top=Math.max(0,Math.min(innerHeight-height,(r.top+r.bottom-height)/2));
  Object.assign(marker.style,{left:left+'px',top:top+'px',width:width+'px',height:height+'px'});marker.dataset.elementId=entry.id;marker.querySelector('span').textContent=entry.name;
 }
 function selectEntry(entry){
  const id=entry?.id||null;current={...current,activeElement:id,editElements:!!entry||current.editElements,editVideos:entry?false:current.editVideos};
  parent.METAStudio?.selectElement(id);
 }
 if(preview){
  const canvas=document.querySelector('#scene'),layer=document.querySelector('#element-handles');
  handle=document.createElement('div');handle.className='element-handle';handle.hidden=true;handle.tabIndex=0;handle.setAttribute('role','group');handle.setAttribute('aria-label','Selected element. Drag its label to move the whole selection, or use arrow keys.');
  const title=document.createElement('span'),resize=document.createElement('button');title.className='element-handle-label';title.title='Drag this label to move the whole selection';resize.className='element-resize';resize.type='button';resize.setAttribute('aria-label','Resize selected element');handle.append(title,resize);
  hover=document.createElement('div');hover.className='element-hover';hover.hidden=true;hover.setAttribute('aria-hidden','true');hover.append(document.createElement('span'));layer.replaceChildren(hover,handle);
  const raycaster=new T.Raycaster(),boxVersions=new WeakMap(),objectEntries=new Map(entries.filter(e=>e.object?.geometry).map(e=>[e.object,e])),entriesById=new Map(entries.map(e=>[e.id,e]));
  pickAt=(x,y)=>{
   group.updateMatrixWorld(true);for(const object of objectEntries.keys()){const g=object.geometry,version=g.attributes.position?.version||0;if(boxVersions.get(g)!==version){g.computeBoundingBox();boxVersions.set(g,version);}}const rect=canvas.getBoundingClientRect();raycaster.params.Line.threshold=Math.max(.09,50/Math.max(1,rect.height));
   raycaster.setFromCamera(new T.Vector2((x-rect.left)/rect.width*2-1,1-(y-rect.top)/rect.height*2),camera);
   const hits=raycaster.intersectObjects([...objectEntries.keys()],false).filter(hit=>{for(let o=hit.object;o;o=o.parent)if(!o.visible)return false;const materials=Array.isArray(hit.object.material)?hit.object.material:[hit.object.material];return materials.some(m=>m.visible!==false&&(!m.transparent||m.opacity>.03));});
   const main=hits.find(hit=>!['Soft shadow','Stage floor'].includes(objectEntries.get(hit.object).label)),hit=objectEntries.get((main||hits[0])?.object);return entriesById.get(elementEditTarget(current,entriesById,hit?.id))||null;
  };
  function beginGesture(event,entry,resizing,owner){
   if(event.button!==0||!entry)return;event.preventDefault();event.stopPropagation();selectEntry(entry);owner.focus?.({preventScroll:true});
   parent.METAStudio?.beginElementGesture();
   const r=resolved(entry),origin=dragOrigin(entry),start={x:event.clientX,y:event.clientY},width=Math.max(30,visibleRect(entry)?.right-visibleRect(entry)?.left||30);
   let moved=false,pending=null,frame=null;dragging=true;hover.hidden=true;owner.setPointerCapture(event.pointerId);
   const flush=()=>{if(!pending)return;const patch=pending;pending=null;parent.METAStudio?.updateElement(entry.id,patch);if(parent.METAStudio)apply(parent.METAStudio.state);};
   const move=e=>{const dx=e.clientX-start.x,dy=e.clientY-start.y;moved=moved||Math.hypot(dx,dy)>=3;if(!moved)return;pending=resizing?{size:r.size*Math.max(.1,1+dx*2/width)}:dragPatch(entry,r,dx,dy,origin);if(frame===null)frame=requestAnimationFrame(()=>{frame=null;flush();});};
   const finish=()=>{if(frame!==null)cancelAnimationFrame(frame);flush();if(owner.hasPointerCapture(event.pointerId))owner.releasePointerCapture(event.pointerId);owner.removeEventListener('pointermove',move);owner.removeEventListener('pointerup',finish);owner.removeEventListener('pointercancel',finish);dragging=false;pointerPosition=null;parent.METAStudio?.endElementGesture();};
   owner.addEventListener('pointermove',move);owner.addEventListener('pointerup',finish);owner.addEventListener('pointercancel',finish);
  }
  handle.onpointerdown=event=>{
   const selected=entriesById.get(elementEditTarget(current,entriesById,current.activeElement));if(!selected)return;
   const bounds=handle.getBoundingClientRect(),resizing=!!event.target.closest('.element-resize')||(event.clientX>=bounds.right-14&&event.clientY>=bounds.bottom-14);
   const label=!!event.target.closest('.element-handle-label'),border=Math.min(event.clientX-bounds.left,bounds.right-event.clientX,event.clientY-bounds.top,bounds.bottom-event.clientY)<5;
   const entry=resizing||label||border||selected.domId?selected:pickAt(event.clientX,event.clientY)||selected;beginGesture(event,entry,resizing,handle);
  };
  function menuFor(event,entry){event.preventDefault();event.stopPropagation();const frame=frameElement.getBoundingClientRect();parent.METAStudio?.elementMenu(entry?.id||null,frame.left+event.clientX,frame.top+event.clientY);}
  handle.oncontextmenu=event=>{const selected=entriesById.get(elementEditTarget(current,entriesById,current.activeElement));menuFor(event,event.target.closest('.element-handle-label,.element-resize')?selected:pickAt(event.clientX,event.clientY)||selected);};
  canvas.oncontextmenu=event=>menuFor(event,pickAt(event.clientX,event.clientY));
  document.onkeydown=event=>parent.METAStudio?.elementKey(event);
  const keys=event=>{if(event.key==='Escape'){event.preventDefault();selectEntry(null);return;}if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;const entry=entriesById.get(elementEditTarget(current,entriesById,current.activeElement));if(!entry)return;event.preventDefault();const r=resolved(entry),step=event.shiftKey?5:1;parent.METAStudio?.updateElement(entry.id,dragPatch(entry,r,(event.key==='ArrowLeft'?-step:event.key==='ArrowRight'?step:0)*innerWidth/100,(event.key==='ArrowUp'?-step:event.key==='ArrowDown'?step:0)*innerHeight/100,dragOrigin(entry)));};
  handle.onpointermove=e=>{if(!dragging)pointerPosition={x:e.clientX,y:e.clientY};};handle.onpointerleave=()=>{if(!dragging){pointerPosition=null;hovered=null;hover.hidden=true;}};handle.onkeydown=keys;canvas.onkeydown=keys;canvas.tabIndex=0;canvas.setAttribute('aria-label','Interactive background preview. Click and drag an element to move it. Escape clears selection.');
  canvas.onpointerdown=event=>{if(event.button!==0)return;const entry=pickAt(event.clientX,event.clientY);if(entry)beginGesture(event,entry,false,canvas);else if(current.activeElement)selectEntry(null);};
  canvas.onpointermove=event=>{if(!dragging)pointerPosition={x:event.clientX,y:event.clientY};};canvas.onpointerleave=()=>{pointerPosition=null;hovered=null;hover.hidden=true;canvas.style.cursor='default';};
  for(const entry of entries.filter(e=>e.domId&&e.defaults.screen===view)){const el=document.getElementById(entry.domId);el.onpointerdown=e=>beginGesture(e,entry,false,el);el.oncontextmenu=e=>menuFor(e,entry);el.tabIndex=0;el.onkeydown=keys;el.onpointerenter=()=>{pointerPosition=null;hovered=entry;};el.onpointerleave=()=>{hovered=null;};for(const image of el.querySelectorAll('img'))image.draggable=false;}
 }
 function drawHandle(){
  if(!handle)return;
  const selected=entries.find(e=>e.id===elementEditTarget(current,entries,current.activeElement));if(current.editElements&&selected)paintMarker(handle,selected,true);else handle.hidden=true;
  if(!dragging&&pointerPosition){hovered=pickAt(pointerPosition.x,pointerPosition.y);document.querySelector('#scene').style.cursor=hovered?'grab':'default';}
  if(!dragging&&hovered&&hovered.id!==current.activeElement)paintMarker(hover,hovered);else hover.hidden=true;
 }
 apply(state);return {apply,draw,pick(x,y){const entry=pickAt?.(x,y);return entry?{id:entry.id,name:entry.name}:null;},get manifest(){return entries.filter(entry=>!isElementDeleted(current,entry.id)).map(entry=>({id:entry.id,name:entry.name,parentId:entry.parentId,rootId:entry.rootId,depth:entry.depth||0,owner:entry.owner,custom:entry.custom,dom:!!entry.domId,mv:entry.kind==='logo'&&!entry.parentId,base:entry.defaults,...resolved(entry)}));}};
}
