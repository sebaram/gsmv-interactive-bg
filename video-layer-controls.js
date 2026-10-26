import {patchLayer,removeLayer,placement,addLayer} from './video-layers.js';
import {screenAspect} from './state.js';

export function videoLayerControls(container,clips,{getState,commit}){
 let scope='all',listKey='',screenKey='';
 container.innerHTML=`<div class="layer-heading"><div><h3>Video layers <span id="layer-count"></span></h3><p class="note">Optional on every background. Add clips below, then arrange them here.</p></div><label class="switch-row">Show videos<input type="checkbox" id="show-videos"></label></div><div id="layer-empty" class="note">No videos added. <a href="#video-library">Browse videos</a> or add a file from your computer.</div><div id="layer-editor" hidden><div class="layer-fields"><label for="active-video-layer">Selected video<select id="active-video-layer"></select></label><label for="video-placement-screen">Apply placement to<select id="video-placement-screen"></select></label></div><div class="layer-toolbar"><label class="switch-row">Edit in preview<input type="checkbox" id="edit-video-layers"></label><label class="switch-row">Visible here<input type="checkbox" id="layer-visible"></label></div><p class="note" id="placement-help">Drag a video to move it. Drag its lower-right corner to resize. Arrow keys move a focused video; Shift moves faster.</p><div class="layer-position"><label for="video-x">Horizontal center (%)<input id="video-x" type="number" min="0" max="100" step="0.5"></label><label for="video-y">Vertical center (%)<input id="video-y" type="number" min="0" max="100" step="0.5"></label><label for="video-width">Width (%)<input id="video-width" type="number" min="5" max="100" step="0.5"></label></div><div class="layer-buttons"><button type="button" class="subtle" id="reset-video-placement">Reset placement</button><button type="button" class="subtle" id="duplicate-video-layer">Duplicate</button><button type="button" class="subtle" id="remove-video-layer">Remove video</button></div></div>`;
 const $=s=>container.querySelector(s),current=()=>getState().videoLayers.find(l=>l.id===getState().activeVideoLayer);
 function change(patch){const layer=current();if(layer)commit(patchLayer(getState(),layer.id,patch,scope));}
 function paint(){
  const state=getState(),layer=current(),count=state.videoLayers.length;
  $('#layer-count').textContent=count?'('+count+'/8)':'';$('#show-videos').checked=state.showVideo;$('#show-videos').disabled=!count;
  $('#layer-empty').hidden=!!count;$('#layer-editor').hidden=!count;
  const key=JSON.stringify(state.videoLayers.map(l=>[l.id,l.videoId,l.customClip?.name]));
  if(key!==listKey){listKey=key;$('#active-video-layer').replaceChildren(...state.videoLayers.map((l,i)=>new Option((i+1)+'. '+(l.customClip?.name||clips.find(c=>c.id===l.videoId)?.title||'Video'),l.id)));}
  $('#active-video-layer').value=state.activeVideoLayer||'';
  const screens=JSON.stringify(state.screens.map(sc=>[sc.id,sc.name]));
  if(screens!==screenKey){screenKey=screens;if(scope!=='all'&&!state.screens.some(sc=>sc.id===scope))scope='all';$('#video-placement-screen').replaceChildren(new Option('All screens','all'),...state.screens.map(sc=>new Option(sc.name,sc.id)));}
  $('#video-placement-screen').value=scope;
  if(!layer)return;
  const sc=state.screens.find(sc=>sc.id===scope),r=sc?placement(layer,scope,screenAspect(sc)):layer;
  $('#edit-video-layers').checked=state.editVideos;$('#layer-visible').checked=r.enabled;
  for(const key of ['x','y','width']){const input=$('#video-'+key);if(document.activeElement!==input)input.value=Number(r[key].toFixed(1));}
  $('#duplicate-video-layer').disabled=count>=8;
 }
 $('#show-videos').onchange=e=>commit({...getState(),showVideo:e.target.checked});
 $('#edit-video-layers').onchange=e=>commit({...getState(),editVideos:e.target.checked});
 $('#active-video-layer').onchange=e=>commit({...getState(),activeVideoLayer:e.target.value});
 $('#video-placement-screen').onchange=e=>{scope=e.target.value;paint();};
 $('#layer-visible').onchange=e=>change({enabled:e.target.checked});
 for(const key of ['x','y','width'])$('#video-'+key).oninput=e=>{if(e.target.value!==''&&e.target.validity.valid)change({[key]:+e.target.value});};
 $('#reset-video-placement').onclick=()=>change({x:70,y:48,width:36,enabled:true});
 $('#remove-video-layer').onclick=()=>commit(removeLayer(getState(),getState().activeVideoLayer));
 $('#duplicate-video-layer').onclick=()=>{const layer=current();if(!layer)return;let next=addLayer(getState(),{id:layer.videoId},layer.customClip);const id=next.activeVideoLayer;next.videoLayers=next.videoLayers.map(l=>l.id===id?{...layer,id,x:Math.min(90,layer.x+3),y:Math.min(90,layer.y+3)}:l);commit(next);};
 paint();return {paint,setScope(screen){scope=screen;}};
}
