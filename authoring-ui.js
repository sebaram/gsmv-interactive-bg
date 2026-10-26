import {objectTypes,presetEdits,patchElement,addElement,removeElement,resetElement} from './authoring.js';

export function authoringControls(container,{getState,getElements,commit}){
 let selected='',listKey='',screenKey='';
 container.innerHTML=`<div class="layer-heading"><div><h3>Author the preset</h3><p class="note" id="author-status">Choose an element and arrange it on any screen.</p></div><label class="switch-row">Edit in preview<input id="edit-elements" type="checkbox"></label></div><div class="layer-fields"><label for="author-element">Element<select id="author-element"></select></label><label for="author-screen">Screen<select id="author-screen"></select></label></div><div class="author-position"><label for="author-x">Horizontal position (%)<input id="author-x" type="number" min="-50" max="150" step="0.5"></label><label for="author-y">Vertical position (%)<input id="author-y" type="number" min="-50" max="150" step="0.5"></label><label for="author-size">Size multiplier<input id="author-size" type="number" min="0.05" max="6" step="0.05"></label><label for="author-rotation">Rotation (°)<input id="author-rotation" type="number" min="-180" max="180" step="1"></label></div><div class="layer-toolbar"><label class="switch-row">Visible<input type="checkbox" id="author-visible"></label><span class="note">Drag the selected element or its corner in the monitor.</span></div><div class="layer-buttons"><button type="button" class="subtle" id="duplicate-element">Duplicate element</button><button type="button" class="subtle" id="reset-element">Reset element</button><button type="button" class="subtle" id="remove-element">Hide element</button><button type="button" class="subtle" id="reset-preset">Reset this preset</button></div><div class="author-add"><label for="add-element-type">Add a moving object<select id="add-element-type"></select></label><button type="button" class="subtle" id="add-element">Add element</button></div><p class="note">Each preset keeps its own edits. Videos remain independent. Your address updates as you author; copy the link to reopen this arrangement.</p>`;
 const $=s=>container.querySelector(s);
 $('#add-element-type').replaceChildren(...objectTypes.map(([value,title])=>new Option(title,value)));
 function elementsNow(){const preset=presetEdits(getState());return getElements().filter(e=>!e.custom||preset.objects.some(o=>o.id===e.id&&!o.archived)).map(e=>({...e,...e.base,...(e.custom?preset.objects.find(o=>o.id===e.id):preset.edits[e.id])}));}
 function current(){return elementsNow().find(e=>e.id===selected);}
 function paint(){
  const state=getState(),elements=elementsNow(),preset=presetEdits(state);
  if(state.activeElement&&elements.some(e=>e.id===state.activeElement))selected=state.activeElement;
  if(!elements.some(e=>e.id===selected))selected=(elements.find(e=>e.id==='preset-main')||elements.find(e=>e.name==='MV sculpture')||elements[0])?.id||'';
  const key=JSON.stringify(elements.map(e=>[e.id,e.name,e.screen]));if(key!==listKey){listKey=key;$('#author-element').replaceChildren(...elements.map(e=>new Option(e.name+' / '+(state.screens.find(sc=>sc.id===e.screen)?.name||e.screen),e.id)));}$('#author-element').value=selected;
  const screenNames=JSON.stringify(state.screens.map(s=>[s.id,s.name]));if(screenKey!==screenNames){screenKey=screenNames;$('#author-screen').replaceChildren(...state.screens.map(sc=>new Option(sc.name,sc.id)));}
  const element=current();$('#edit-elements').checked=state.editElements;
  $('#author-status').textContent=elements.length?elements.length+' elements in this preset. '+(Object.keys(preset.edits).length+preset.objects.length?'Custom arrangement.':'Original arrangement.'):'Preparing preset elements…';
  for(const input of container.querySelectorAll('input:not(#edit-elements),#author-screen,#duplicate-element,#reset-element,#remove-element'))input.disabled=!element;
  if(!element)return;
  $('#author-screen').value=state.screens.some(sc=>sc.id===element.screen)?element.screen:state.screens[0].id;$('#author-screen').disabled=element.dom;$('#author-visible').checked=element.visible;
  for(const key of ['x','y','size','rotation'])if(document.activeElement!==$('#author-'+key))$('#author-'+key).value=Number(element[key].toFixed(2));
  $('#remove-element').textContent=element.custom?'Remove element':'Hide element';$('#reset-element').disabled=element.custom;$('#add-element').disabled=preset.objects.length>=32;$('#duplicate-element').disabled=element.dom||preset.objects.length>=32;
 }
 function change(patch){if(selected)commit(patchElement({...getState(),activeElement:selected},selected,patch));}
 $('#author-element').onchange=e=>{selected=e.target.value;commit({...getState(),activeElement:selected});};
 $('#author-screen').onchange=e=>change({screen:e.target.value});$('#author-visible').onchange=e=>change({visible:e.target.checked});
 $('#edit-elements').onchange=e=>commit({...getState(),activeElement:selected,editElements:e.target.checked,editVideos:e.target.checked?false:getState().editVideos});
 for(const key of ['x','y','size','rotation'])$('#author-'+key).oninput=e=>{if(e.target.value!==''&&e.target.validity.valid)change({[key]:+e.target.value});};
 $('#add-element').onclick=()=>commit(addElement(getState(),$('#add-element-type').value,{screen:$('#author-screen').value||getState().screens[0].id}));
 $('#duplicate-element').onclick=()=>{const e=current();if(e)commit(addElement(getState(),'copy',{screen:e.screen,x:Math.min(140,e.x+5),y:e.y,size:e.size,rotation:e.rotation},e.id));};
 $('#remove-element').onclick=()=>commit(removeElement(getState(),selected));$('#reset-element').onclick=()=>commit(resetElement(getState(),selected));
 $('#reset-preset').onclick=()=>{const state=getState(),authored={...state.authored};delete authored[state.variant];commit({...state,authored,activeElement:null,editElements:false});};
 paint();return {paint};
}
