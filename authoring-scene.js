import * as T from './vendor/three.module.js';
import {panorama,screenAspect} from './state.js';
import {presetEdits,objectTypes} from './authoring.js';

// Animation remains inside a wrapper; authored transforms never overwrite it.
export function authoringScene(group,camera,state,{background,hero,secondary,createObject,view,preview}){
 const entries=[],copies=[],p=panorama(state),full=camera.clone();full.clearViewOffset();full.left=-p.width/p.height*5;full.right=-full.left;full.updateProjectionMatrix();full.updateMatrixWorld();
 let current=state;const counts=new Map();
 const screenFor=x=>p.screens.find(sc=>x>=sc.x&&x<sc.x+sc.width)||p.screens.at(-1);
 function defaultName(object){if(object===hero)return 'Main sculpture';if(object===secondary)return 'Companion sculpture';if(object.name)return object.name;const type=object.geometry?.type||object.type;return ({SphereGeometry:'Accent sphere',TorusGeometry:'Orbital ring',TubeGeometry:'Connecting ribbon',CylinderGeometry:'Pedestal',ExtrudeGeometry:'Architectural arch',Line:'Connection line',Group:'Research network',PlaneGeometry:object.material?.map?'Soft shadow':'Stage floor'})[type]||'Sculptural element';}
 function register(object,custom=null){
  group.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(object),anchor=bounds.getCenter(new T.Vector3());if(!Number.isFinite(anchor.x))anchor.copy(object.position);
  const ndc=anchor.clone().project(full),pixel=(ndc.x+1)/2*p.width,sc=screenFor(pixel),name=defaultName(object),key=sc.id+'-'+name.toLowerCase().replace(/[^a-z0-9]+/g,'-');
  const n=(counts.get(key)||0)+1;counts.set(key,n);
  const id=custom?.id||object.userData.authorId||(object===hero?'preset-main':object===secondary?'preset-companion':key+'-'+n);
  const defaults={screen:sc.id,x:(pixel-sc.x)/sc.width*100,y:(1-ndc.y)/2*100,size:1,rotation:0,visible:true};
  const wrap=new T.Group();group.add(wrap);wrap.add(object);
  const entry={id,name:custom?(custom.type==='copy'?'Copy of '+(entries.find(e=>e.id===custom.source)?.name||'element'):objectTypes.find(t=>t[0]===custom.type)?.[1]||name):name+(n>1?' '+n:''),object,wrap,anchor,bounds,defaults,custom:!!custom};entries.push(entry);return entry;
 }
 for(const object of [...group.children])if(object!==background)register(object);
 for(const custom of presetEdits(state).objects){
  if(custom.type==='copy'){
   const source=entries.find(e=>e.id===custom.source);if(!source)continue;
   const clone=source.object.clone(true),pairs=[];function pair(a,b){pairs.push([a,b]);for(let i=0;i<a.children.length;i++)pair(a.children[i],b.children[i]);}pair(source.object,clone);copies.push(pairs);group.add(clone);const entry=register(clone,custom);entry.anchor.copy(source.anchor);entry.defaults={...source.defaults};
  }else {const object=createObject(custom.type);if(object)register(object,custom);}
 }
 for(const sc of p.screens)for(const [domId,name,y] of [['branding','Department signature',9],['headline','Research titles',70],['wall-caption','Topic footer',90]])entries.push({id:domId+'-'+sc.id,name,domId,custom:false,defaults:{screen:sc.id,x:7,y,size:1,rotation:0,visible:true}});
 function resolved(entry){const preset=presetEdits(current),patch=entry.custom?preset.objects.find(o=>o.id===entry.id):preset.edits[entry.id];return {...entry.defaults,...patch};}
 function target(r,z){
  const sc=p.screens.find(sc=>sc.id===r.screen)||p.screens[0],x=(sc.x+sc.width*r.x/100)/p.width*2-1,y=1-r.y/50;
  const near=new T.Vector3(x,y,-1).unproject(full),far=new T.Vector3(x,y,1).unproject(full),direction=far.sub(near);return near.addScaledVector(direction,(z-near.z)/direction.z);
 }
 function applyDom(entry){const r=resolved(entry);if(entry.defaults.screen!==view)return;const el=document.getElementById(entry.domId),edited=presetEdits(current).edits[entry.id],sc=current.screens.find(s=>s.id===view)||current.screens[0],correction=(innerWidth/innerHeight)/screenAspect(sc);el.style.left=edited?r.x+'%':'';el.style.top=edited?r.y+'%':'';el.style.bottom=edited?'auto':'';el.style.transform=`scaleX(${correction}) scale(${r.size}) rotate(${r.rotation}deg)`;el.style.transformOrigin='left top';el.style.display=(entry.domId==='headline'?current.headlines:current.branding)&&r.visible?'':'none';}
 function apply(next){current=next;for(const entry of entries){if(entry.domId){applyDom(entry);continue;}const r=resolved(entry),position=target(r,entry.anchor.z),rotation=r.rotation*Math.PI/180;const anchor=entry.anchor.clone().multiplyScalar(r.size).applyAxisAngle(new T.Vector3(0,0,1),rotation);entry.wrap.scale.setScalar(r.size);entry.wrap.rotation.z=rotation;entry.wrap.position.copy(position.sub(anchor));entry.wrap.visible=r.visible;}}
 function draw(){for(const pairs of copies)for(const [a,b] of pairs){b.position.copy(a.position);b.quaternion.copy(a.quaternion);b.scale.copy(a.scale);b.visible=a.visible;}drawHandle();}
 let handle;
 if(preview){
  handle=document.createElement('div');handle.className='element-handle';handle.hidden=true;handle.tabIndex=0;handle.setAttribute('role','group');handle.setAttribute('aria-label','Selected element. Use arrow keys to move.');const title=document.createElement('span'),resize=document.createElement('button');title.className='element-handle-label';resize.className='element-resize';resize.type='button';resize.setAttribute('aria-label','Resize selected element');handle.append(title,resize);document.querySelector('#element-handles').replaceChildren(handle);
  handle.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();const entry=entries.find(e=>e.id===current.activeElement);if(!entry)return;const r=resolved(entry),start={x:e.clientX,y:e.clientY},bounds=handle.getBoundingClientRect(),resizing=!!e.target.closest('.element-resize')||(e.clientX>=bounds.right-20&&e.clientY>=bounds.bottom-20),width=bounds.width;handle.setPointerCapture(e.pointerId);handle.onpointermove=event=>{const dx=event.clientX-start.x,dy=event.clientY-start.y;parent.METAStudio?.updateElement(entry.id,resizing?{size:r.size*Math.max(.1,1+dx*2/Math.max(20,width))}:{x:r.x+dx/innerWidth*100,y:r.y+dy/innerHeight*100});};const finish=()=>{if(handle.hasPointerCapture(e.pointerId))handle.releasePointerCapture(e.pointerId);handle.onpointermove=null;handle.onpointerup=null;handle.onpointercancel=null;};handle.onpointerup=finish;handle.onpointercancel=finish;};
  handle.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const entry=entries.find(e=>e.id===current.activeElement);if(!entry)return;const r=resolved(entry),step=e.shiftKey?5:1;parent.METAStudio?.updateElement(entry.id,{x:r.x+(e.key==='ArrowLeft'?-step:e.key==='ArrowRight'?step:0),y:r.y+(e.key==='ArrowUp'?-step:e.key==='ArrowDown'?step:0)});};
 }
 function drawHandle(){
  if(!handle)return;const entry=entries.find(e=>e.id===current.activeElement),r=entry&&resolved(entry);
  handle.hidden=!current.editElements||!entry||!r.visible||r.screen!==view;if(handle.hidden)return;
  if(entry.domId){const el=document.getElementById(entry.domId),rect=el.getBoundingClientRect();if(!rect.width||!rect.height){handle.hidden=true;return;}Object.assign(handle.style,{left:rect.left/innerWidth*100+'%',top:rect.top/innerHeight*100+'%',width:rect.width/innerWidth*100+'%',height:rect.height/innerHeight*100+'%'});handle.querySelector('span').textContent=entry.name;return;}
  group.updateMatrixWorld(true);const box=entry.bounds,points=[];for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])points.push(new T.Vector3(x,y,z).applyMatrix4(entry.wrap.matrixWorld).project(camera));
  const xs=points.map(v=>(v.x+1)*50),ys=points.map(v=>(1-v.y)*50),left=Math.max(0,Math.min(...xs)),top=Math.max(0,Math.min(...ys)),right=Math.min(100,Math.max(...xs)),bottom=Math.min(100,Math.max(...ys));
  Object.assign(handle.style,{left:left+'%',top:top+'%',width:Math.max(5,right-left)+'%',height:Math.max(5,bottom-top)+'%'});handle.querySelector('span').textContent=entry.name;
 }
 apply(state);return {apply,draw,get manifest(){return entries.filter(entry=>!resolved(entry).archived).map(entry=>({id:entry.id,name:entry.name,custom:entry.custom,dom:!!entry.domId,base:entry.defaults,...resolved(entry)}));}};
}
