import {textControls} from './text-controls.js';
import {objectTypes,presetEdits,patchElement,addElement,removeElement,resetElement,resetTextElement,randomizeElement,isElementDeleted,copyElement,pasteElement,authoringHistory,elementEditTarget} from './authoring.js';
import {elementList} from './element-list.js';
import {patchLayer,removeLayer,duplicateVideo,selectVideoElement,videoElementId,addLayer} from './video-layers.js';
import {retimeMotion} from './motion.js';

export function authoringControls(container,{getState,getElements,commit:publish,notify=()=>{},videoControls}){
 let selected='',listKey='',screenKey='',observedActive,selectionInitialized=false,clipboard=null,menuOrigin=null;
 const history=authoringHistory();
 function normalize(next){const target=elementEditTarget(next,getElements(),next.activeElement);return target&&target!==next.activeElement?{...next,activeElement:target}:next;}
 function commit(next){next=normalize(next);history.record(getState(),next);publish(next);}
 container.innerHTML=`<div class="layer-heading"><div><h3>Edit this look</h3><p class="note" id="author-status">Choose an element and arrange it on any screen.</p></div><label class="switch-row">Selection handles<input id="edit-elements" type="checkbox"></label></div><div class="author-element-list"></div><div class="layer-fields"><label for="author-element">Jump to element<select id="author-element"></select></label><label for="author-screen">Screen<select id="author-screen"></select></label></div><div class="author-position"><label for="author-x">Horizontal position (%)<input id="author-x" type="number" min="-50" max="150" step="0.5"></label><label for="author-y">Vertical position (%)<input id="author-y" type="number" min="-50" max="150" step="0.5"></label><label for="author-size">Size multiplier<input id="author-size" type="number" min="0.05" max="6" step="0.05"></label><label for="author-rotation">Rotation (°)<input id="author-rotation" type="number" min="-180" max="180" step="1"></label></div><div class="mv-variation" id="mv-variation" hidden><h4>MV variation</h4><div class="mv-variation-fields"><label for="mv-seed">Seed<input id="mv-seed" type="number" min="0" max="999999" step="1"></label><label for="mv-randomness">Randomness<input id="mv-randomness" type="number" min="0" max="2" step="0.05"></label><button type="button" class="subtle" id="randomize-mv">New variation</button></div><p class="note">The seed repeats a variation. Randomness controls how far its shape varies.</p></div><div class="layer-toolbar"><label class="switch-row">Visible<input type="checkbox" id="author-visible"></label><span class="note">Click and drag a part directly. Drag a selection label to move its whole group.</span></div><div class="layer-buttons"><button type="button" class="subtle" id="duplicate-element">Duplicate element</button><button type="button" class="subtle" id="reset-element">Reset element</button><button type="button" class="subtle" id="remove-element">Delete element</button><button type="button" class="subtle" id="reset-preset">Reset look elements</button></div><div class="author-add"><label for="add-element-type">Add an element<select id="add-element-type"></select></label><button type="button" class="subtle" id="add-element">Add element</button></div><p class="note">Edits belong to this working look. Built-in presets stay read-only. Save a look or copy its address to keep this arrangement.</p>`;
 const $=s=>container.querySelector(s);
 const tools=document.createElement('div');tools.className='layer-buttons author-command-tools';
 for(const [action,label,title] of [['undo','Undo','Ctrl/Cmd+Z'],['redo','Redo','Ctrl/Cmd+Shift+Z or Ctrl+Y'],['copy','Copy','Ctrl/Cmd+C'],['paste','Paste','Ctrl/Cmd+V']]){const button=document.createElement('button');button.type='button';button.className='subtle';button.id='author-'+action;button.textContent=label;button.title=title;button.onclick=()=>command(action);tools.append(button);}
 $('.author-element-list').before(tools);
 const help=document.createElement('p');help.className='note author-shortcut-help';help.textContent='Right-click an element for actions. Delete/Backspace removes it; Ctrl/Cmd+C/V/X copies, pastes or cuts within this preset. Ctrl/Cmd+D duplicates; Ctrl/Cmd+Z undoes; Shift+Ctrl/Cmd+Z redoes. Insert adds the chosen object. Arrow keys move; Shift moves faster; Escape clears selection.';tools.after(help);
 const menu=document.createElement('div');menu.id='element-context-menu';menu.className='element-context-menu';menu.hidden=true;menu.setAttribute('role','menu');menu.setAttribute('aria-label','Element actions');document.body.append(menu);
 const workspace=document.createElement('div'),layerPane=document.createElement('section'),properties=document.createElement('section'),propertyTitle=document.createElement('h4'),groupButton=document.createElement('button');workspace.className='author-workspace';layerPane.className='author-layers';layerPane.setAttribute('aria-label','Layers');properties.className='author-properties';properties.setAttribute('aria-label','Element properties');propertyTitle.id='author-property-title';propertyTitle.textContent='Properties';groupButton.id='group-element';groupButton.type='button';groupButton.className='subtle';groupButton.onclick=()=>command('group');
 const propertyLabel=document.createElement('span');propertyLabel.className='mini-label';propertyLabel.textContent='Properties';layerPane.append(tools,$('.author-element-list'),$('.author-add'));properties.append(propertyLabel,propertyTitle,groupButton,$('.layer-fields'),$('.author-position'),$('.mv-variation'),$('.layer-toolbar'),$('.layer-buttons:not(.author-command-tools)'));workspace.append(layerPane,properties);container.querySelector('.layer-heading').after(workspace);
 const artProperties=document.createElement('div'),videoProperties=document.createElement('div'),motionProperties=document.createElement('div');artProperties.className='author-art-properties';videoProperties.className='author-video-properties';motionProperties.id='author-motion';motionProperties.innerHTML='<h4>Object motion</h4><p class="note" id="object-motion-note">Select animated artwork to adjust its motion.</p>';for(const node of [groupButton,$('.layer-fields'),$('.author-position'),$('.mv-variation'),$('.layer-toolbar'),$('.layer-buttons:not(.author-command-tools)')])artProperties.append(node);artProperties.querySelector('.author-position').after(motionProperties);for(const id of ['speed','motionAmount'])motionProperties.append(document.getElementById(id).closest('.control-block'));videoProperties.append(document.querySelector('#video-layer-controls'));properties.append(artProperties,videoProperties);
 const shortcuts=document.createElement('details'),summary=document.createElement('summary');shortcuts.className='author-shortcuts';summary.textContent='Keyboard shortcuts';shortcuts.append(summary,help);workspace.after(shortcuts);properties.querySelector('.layer-toolbar .note').textContent='Groups edit as one unit. Ungroup to edit individual parts.';
 function select(id,screen='all'){id=elementEditTarget(getState(),getElements(),id);selected=id||'';const element=getElements().find(e=>e.id===id);if(element?.video){videoControls?.setScope(screen);commit(selectVideoElement(getState(),element.layerId));}else commit({...getState(),activeElement:id||null,editElements:id?true:getState().editElements,editVideos:false});}
 const typography=textControls(artProperties,{change:patch=>change(patch),reset:()=>{if(selected)commit(resetTextElement(getState(),selected));},begin:()=>history.begin(),end:()=>history.end()});artProperties.querySelector('.author-position').after(artProperties.querySelector('#text-properties'));
 const outliner=elementList($('.author-element-list'),{select,toggleVisible:(id,visible)=>{const e=elementsNow().find(e=>e.id===id);if(e?.video)commit({...patchLayer(getState(),e.layerId,{enabled:visible}),showVideo:visible||getState().showVideo});else commit(patchElement(getState(),id,{visible}));},deleteElement:id=>deleteElement(id),contextMenu:(id,event)=>{event.preventDefault();openMenu(id,event.clientX,event.clientY,event.currentTarget.querySelector('.author-row-select'));}});
 $('#add-element-type').replaceChildren(...[...objectTypes,['video','Video element']].map(([value,title])=>new Option(title,value)));
 const gallery=document.createElement('details');gallery.className='element-gallery';gallery.innerHTML='<summary>Browse element thumbnails</summary><div class="element-gallery-grid" aria-label="Add an element visually"></div>';
 for(const [type,title] of [...objectTypes,['video','Video element']]){
  const button=document.createElement('button'),image=document.createElement('img'),label=document.createElement('span');button.type='button';button.className='element-gallery-item';button.dataset.addType=type;button.setAttribute('aria-label','Add '+title);image.src='assets/element-thumbnails/'+type+(['video','text'].includes(type)?'.svg':'.jpg');image.alt='';image.width=88;image.height=72;image.loading='lazy';label.textContent=title.split(' · ')[0];button.append(image,label);
  button.onclick=()=>{$('#add-element-type').value=type;$('#add-element').click();gallery.open=false;notify('Added '+label.textContent);};gallery.querySelector('.element-gallery-grid').append(button);
 }
 $('.author-add').append(gallery);
 function elementsNow(){const preset=presetEdits(getState()),elements=getElements().filter(e=>!isElementDeleted(getState(),e.id)&&(!e.custom||preset.objects.some(o=>o.id===e.id))&&(!e.owner||preset.objects.some(o=>o.id===e.owner))).map(e=>{const patch=e.custom?preset.objects.find(o=>o.id===e.id):preset.edits[e.id],entry={...e,...e.base,...patch};if(e.dom&&!Object.hasOwn(patch||{},'visible'))entry.visible=e.visible;return entry;}),byId=new Map(elements.map(e=>[e.id,e])),children=new Map();for(const e of elements)if(e.parentId)children.set(e.parentId,(children.get(e.parentId)||0)+1);return elements.map(e=>({...e,ungrouped:(e.custom?preset.objects.find(o=>o.id===e.id):preset.edits[e.id])?.ungrouped===true,partCount:children.get(e.id)||0,group:children.has(e.id),locked:elementEditTarget(getState(),byId,e.id)!==e.id}));}
 function deleteElement(id){id=elementEditTarget(getState(),getElements(),id);const e=elementsNow().find(e=>e.id===id);if(e)commit(e.video?removeLayer(getState(),e.layerId):removeElement(getState(),id));}
 function current(){return elementsNow().find(e=>e.id===selected);}
 function paint(){
  const state=getState(),elements=elementsNow(),preset=presetEdits(state);
  history.observe(state);
  const desired=elementEditTarget(state,elements,state.activeElement);
  if(elements.length&&(!selectionInitialized||desired&&desired!==selected||state.activeElement!==observedActive||!elements.some(e=>e.id===selected&&!e.locked))){
   selected=desired||(!selectionInitialized?(elements.find(e=>e.id==='preset-main')||elements.find(e=>e.name==='MV sculpture')||elements.find(e=>e.id===videoElementId(state.activeVideoLayer))||elements[0])?.id||'':'');
   selectionInitialized=true;observedActive=state.activeElement;
  }
  const key=JSON.stringify(elements.map(e=>[e.id,e.name,e.screen,e.locked]));if(key!==listKey){listKey=key;$('#author-element').replaceChildren(...elements.filter(e=>!e.locked).map(e=>new Option((e.depth?'↳ ':'')+e.name+' / '+(state.screens.find(sc=>sc.id===e.screen)?.name||e.screen),e.id)));}$('#author-element').value=selected;
  const screenNames=JSON.stringify(state.screens.map(s=>[s.id,s.name]));if(screenKey!==screenNames){screenKey=screenNames;$('#author-screen').replaceChildren(...state.screens.map(sc=>new Option(sc.name,sc.id)));}
  const element=current();typography.paint(element);motionProperties.hidden=!!element?.text;$('#edit-elements').checked=element?.video?state.editVideos:state.editElements;artProperties.hidden=!!element?.video;videoProperties.hidden=!element?.video;
  propertyTitle.textContent=element?.name.split(' / ').at(-1)||'Select a layer';propertyTitle.title=element?.name||'';groupButton.hidden=!element?.group;groupButton.textContent=element?.ungrouped?'Regroup':'Ungroup';groupButton.title=element?.ungrouped?'Edit this artwork as one unit again':'Enable editing its individual parts';
  $('#author-undo').disabled=!history.canUndo;$('#author-redo').disabled=!history.canRedo;$('#author-copy').disabled=!element||element.dom&&!element.text;$('#author-paste').disabled=!clipboard||(clipboard.video?state.videoLayers.length>=8:clipboard.variant!==state.variant||preset.objects.length>=32);
  outliner.paint(elements,selected,state.screens);
  const parts=elements.filter(e=>e.parentId).length;
  $('#author-status').textContent=elements.length?elements.length+' elements, including '+parts+' individual parts. '+(Object.keys(preset.edits).length+preset.objects.length?'Custom arrangement.':'Original arrangement.'):'Preparing look elements…';
  for(const input of container.querySelectorAll('.author-position input,.mv-variation input,#author-visible,#author-screen,#duplicate-element,#reset-element,#remove-element'))input.disabled=!element;
  $('#mv-variation').hidden=!element?.mv;
  $('#randomize-mv').disabled=!element?.mv;
  $('#add-element').disabled=$('#add-element-type').value==='video'?state.videoLayers.length>=8:preset.objects.length>=32;
  for(const button of gallery.querySelectorAll('[data-add-type]'))button.disabled=button.dataset.addType==='video'?state.videoLayers.length>=8:preset.objects.length>=32;
  if(element?.mv)for(const key of ['seed','randomness'])if(document.activeElement!==$('#mv-'+key))$('#mv-'+key).value=element[key]??0;
  const animated=!!element?.animated;for(const id of ['speed','motionAmount'])document.getElementById(id).disabled=!animated;
  if(animated){document.getElementById('speed').value=element.motionSpeed??1;document.getElementById('motionAmount').value=element.motionAmount??1;document.getElementById('speed-value').textContent=(element.motionSpeed??1).toFixed(2)+'×';document.getElementById('motionAmount-value').textContent=(element.motionAmount??1).toFixed(2)+'×';}
  $('#object-motion-note').textContent=animated?'Applies to this artwork and its animated parts.':element?.parentId?'Animation is inherited from its parent group.':'This is a static layer.';
  if(!element||element.video)return;
  if(element.parentId)$('#author-status').textContent+=' Selected part follows its parent group.';
  $('#author-element').title=element.name;
  $('.author-position').title=element.parentId?'Part transforms follow their parent group. Reset the part to restore its original placement.':'';
  $('#author-screen').value=state.screens.some(sc=>sc.id===element.screen)?element.screen:state.screens[0].id;$('#author-screen').disabled=element.dom&&!element.custom;$('#author-visible').checked=element.visible;
  for(const key of ['x','y','size','rotation'])if(document.activeElement!==$('#author-'+key))$('#author-'+key).value=Number(element[key].toFixed(2));
  $('#remove-element').textContent='Delete element';$('#reset-element').disabled=element.custom;$('#add-element').disabled=$('#add-element-type').value==='video'?state.videoLayers.length>=8:preset.objects.length>=32;$('#duplicate-element').disabled=element.dom&&!element.text||preset.objects.length>=32;
 }
 function change(patch){if(selected)commit(patchElement({...getState(),activeElement:selected},selected,patch));}
 $('#author-element').onchange=e=>select(e.target.value);
 $('#author-screen').onchange=e=>change({screen:e.target.value});$('#author-visible').onchange=e=>change({visible:e.target.checked});
 $('#edit-elements').onchange=e=>commit({...getState(),activeElement:selected,editElements:current()?.video?false:e.target.checked,editVideos:current()?.video?e.target.checked:e.target.checked?false:getState().editVideos});
 document.getElementById('speed').oninput=e=>{const element=current();if(element?.animated)change(retimeMotion(element,+e.target.value,element.clock.parentTime));};document.getElementById('motionAmount').oninput=e=>{if(current()?.animated)change({motionAmount:+e.target.value});};
 for(const key of ['x','y','size','rotation'])$('#author-'+key).oninput=e=>{if(e.target.value!==''&&e.target.validity.valid)change({[key]:+e.target.value});};
 for(const key of ['seed','randomness'])$('#mv-'+key).oninput=e=>{if(e.target.value!==''&&e.target.validity.valid)change({[key]:+e.target.value});};
 $('#randomize-mv').onclick=()=>{if(current()?.mv)commit(randomizeElement({...getState(),activeElement:selected},selected));};
 $('#add-element').onclick=()=>{if($('#add-element-type').value==='video'){let next=addLayer(getState(),{id:null});if(next!==getState()){next=patchLayer(next,next.activeVideoLayer,{enabled:false});next.showVideo=getState().showVideo;}commit(next);}else commit(addElement(getState(),$('#add-element-type').value,{screen:$('#author-screen').value||getState().screens[0].id}));};
 $('#duplicate-element').onclick=()=>command('duplicate');
 $('#remove-element').onclick=()=>deleteElement(selected);$('#reset-element').onclick=()=>commit(resetElement(getState(),selected));
 $('#reset-preset').onclick=()=>{const state=getState(),authored={...state.authored};delete authored[state.variant];commit({...state,authored,activeElement:null,editElements:false});};
 function closeMenu(restoreFocus=false){menu.hidden=true;if(restoreFocus&&menuOrigin?.isConnected)menuOrigin.focus({preventScroll:true});}
 function command(action){
  closeMenu();const state=getState(),element=current();
  if(action==='undo'||action==='redo'){publish(normalize(history[action](state)));return;}
  if(action==='copy'||action==='cut'){const next=element?.video?{video:true,layer:structuredClone(state.videoLayers.find(l=>l.id===element.layerId))}:copyElement(state,element);if(!next)return;clipboard=next;if(action==='cut')deleteElement(element.id);else paint();notify(action==='cut'?'Element cut.':'Element copied.');return;}
  if(action==='paste'||action==='duplicate'){
   const clip=action==='duplicate'?(element?.video?{video:true,layer:state.videoLayers.find(l=>l.id===element.layerId)}:copyElement(state,element)):clipboard;if(!clip)return;
   if(clip.video){const next=duplicateVideo(state,clip.layer);if(next!==state)commit(next);else notify('Up to 8 video elements.');return;}
   if(clip.variant!==state.variant){notify('Switch back to the copied element’s preset to paste it.');return;}
   const next=pasteElement(state,clip);if(next===state){notify('Up to 32 authored objects. Delete an object before pasting.');return;}commit(next);return;
  }
  if(action==='delete'){if(element)deleteElement(element.id);return;}
  if(action==='visibility'){if(element?.video)commit({...patchLayer(state,element.layerId,{enabled:!element.visible}),showVideo:!element.visible||state.showVideo});else if(element)change({visible:element.visible===false});return;}
  if(action==='group'){if(element?.group)commit(patchElement({...state,activeElement:element.id},element.id,{ungrouped:!element.ungrouped}));return;}
  if(action==='add')$('#add-element').click();
  if(action==='clear')select(null);
 }
 function openMenu(id,x,y,origin=null){
  history.end();select(id);menuOrigin=origin||document.activeElement;menu.replaceChildren();
  const element=current(),copyable=!!element&&(!element.dom||element.text),room=element?.video?getState().videoLayers.length<8:presetEdits(getState()).objects.length<32;
  const actions=[['copy','Copy','Ctrl+C',copyable],['cut','Cut','Ctrl+X',copyable],['paste','Paste','Ctrl+V',!!clipboard&&(clipboard.video?getState().videoLayers.length<8:clipboard.variant===getState().variant&&presetEdits(getState()).objects.length<32)],['duplicate','Duplicate','Ctrl+D',copyable&&room],['group',element?.ungrouped?'Regroup':'Ungroup','',!!element?.group],['visibility',element?.visible===false?'Show':'Hide','',!!element],['delete','Delete','Del',!!element],['add','Add chosen object','Insert',room]];
  for(const [action,label,key,enabled] of actions){const button=document.createElement('button');button.type='button';button.dataset.command=action;button.setAttribute('role','menuitem');button.disabled=!enabled;const title=document.createElement('span'),hint=document.createElement('kbd');title.textContent=label;hint.textContent=key;button.append(title,hint);button.onclick=()=>{command(action);if(menuOrigin?.isConnected)menuOrigin.focus({preventScroll:true});};menu.append(button);}
  menu.hidden=false;const bounds=menu.getBoundingClientRect();menu.style.left=Math.max(8,Math.min(x,innerWidth-bounds.width-8))+'px';menu.style.top=Math.max(8,Math.min(y,innerHeight-bounds.height-8))+'px';menu.querySelector('button:not(:disabled)')?.focus({preventScroll:true});
 }
 menu.onkeydown=event=>{const items=[...menu.querySelectorAll('button:not(:disabled)')],index=items.indexOf(document.activeElement);if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();event.stopPropagation();items[event.key==='Home'?0:event.key==='End'?items.length-1:(index+(event.key==='ArrowDown'?1:-1)+items.length)%items.length]?.focus();}if(event.key==='Escape'){event.preventDefault();event.stopPropagation();closeMenu(true);}};
 document.addEventListener('pointerdown',event=>{if(!menu.contains(event.target))closeMenu();});window.addEventListener('blur',()=>closeMenu());window.addEventListener('resize',()=>closeMenu());window.addEventListener('wheel',event=>{if(!menu.contains(event.target))closeMenu();},{passive:true});
 function keydown(event){
  if(event.defaultPrevented||event.isComposing||event.target?.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"]'))return false;
  const mod=event.ctrlKey||event.metaKey,key=event.key.toLowerCase();let action;
  if(mod&&!event.altKey){if(key==='z')action=event.shiftKey?'redo':'undo';else if(key==='y')action='redo';else if(!event.shiftKey)action=({c:'copy',v:'paste',x:'cut',d:'duplicate',insert:'copy'})[key];}
  else if(!mod&&!event.altKey){if(key==='delete'||key==='backspace')action='delete';if(key==='insert')action=event.shiftKey?'paste':'add';if(key==='escape')action='clear';}
  if(!action||getState().editVideos&&!current()?.video&&!['undo','redo','clear'].includes(action))return false;event.preventDefault();if(!event.repeat)command(action);return true;
 }
 document.addEventListener('keydown',keydown);
 $('#add-element-type').onchange=()=>paint();
 for(const input of container.querySelectorAll('.author-position input,.mv-variation input,#author-motion input,#layer-editor input')){input.addEventListener('focus',()=>history.begin());input.addEventListener('blur',()=>history.end());}
 paint();return {paint,select,commit,accept(next){history.accept(next);publish(next);},command,keydown,openMenu,closeMenu,beginGesture:()=>history.begin(),endGesture:()=>history.end(),updateElement(id,patch){if(elementEditTarget(getState(),getElements(),id)===id)commit(patchElement({...getState(),activeElement:id},id,patch));}};
}
