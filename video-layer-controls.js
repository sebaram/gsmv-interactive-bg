import {patchLayer,removeLayer,placement,duplicateVideo,assignVideoSource,assignVideoScreens,selectVideoElement} from './video-layers.js';
import {screenAspect,timeline} from './state.js';
import {videoTitle,parseYoutube} from './youtube-source.js';
import {retimeMotion} from './motion.js';

export function videoLayerControls(container,clips,{getState,commit,chooseFile=()=>{}}){
 let scope='all',listKey='',screenKey='',sourceKey='';
 container.innerHTML=`<div class="layer-heading"><div><h3>Video properties <span id="layer-count"></span></h3><p class="note">Position the selected video on all screens or one screen.</p></div><label class="switch-row">Show videos<input type="checkbox" id="show-videos"></label></div><div id="layer-empty" class="note">No videos added. <a href="#video-library">Browse videos</a> or add a file from your computer.</div><div id="layer-editor" hidden><div class="layer-fields"><label for="active-video-layer">Video to position<select id="active-video-layer"></select></label><label for="video-placement-screen">Apply placement to<select id="video-placement-screen"></select></label></div><div class="layer-toolbar"><label class="switch-row">Edit in preview<input type="checkbox" id="edit-video-layers"></label><label class="switch-row">Visible here<input type="checkbox" id="layer-visible"></label></div><p class="note" id="placement-help">Drag a video to move it. Drag its lower-right corner to resize. Arrow keys move a focused video; Shift moves faster.</p><label class="youtube-shape-field" for="youtube-shape" hidden>YouTube shape<select id="youtube-shape"><option value="1.7777777777777777">Widescreen (16:9)</option><option value="0.5625">Portrait (9:16)</option><option value="1">Square (1:1)</option></select></label><div class="layer-position"><label for="video-x">Horizontal center (%)<input id="video-x" type="number" min="0" max="100" step="0.5"></label><label for="video-y">Vertical center (%)<input id="video-y" type="number" min="0" max="100" step="0.5"></label><label for="video-width">Width (%)<input id="video-width" type="number" min="5" max="100" step="0.5"></label></div><div class="layer-buttons"><button type="button" class="subtle" id="reset-video-placement">Reset placement</button><button type="button" class="subtle" id="duplicate-video-layer">Duplicate</button><button type="button" class="subtle" id="remove-video-layer">Remove video</button></div></div>`;
 const $=s=>container.querySelector(s),current=()=>getState().videoLayers.find(l=>l.id===getState().activeVideoLayer);
 const source=document.createElement('section');source.className='video-element-source';source.innerHTML=`<label for="video-name">Element name<input id="video-name" type="text" maxlength="160" placeholder="Name this video element"></label><p class="note" id="video-source-status"></p><label for="video-source-copy">Use source from another video<select id="video-source-copy"></select></label><button type="button" id="replace-video-file" class="subtle">Choose / replace file</button><label for="replace-video-youtube">Replace with YouTube URL<input id="replace-video-youtube" type="text" inputmode="url" placeholder="https://youtu.be/…"></label><button type="button" id="apply-video-youtube" class="subtle">Assign YouTube</button><p id="video-source-error" role="alert" hidden></p><fieldset id="video-targets"><legend>Show on screens</legend></fieldset><div class="control-block"><label for="video-speed">Playback rate<output id="video-speed-value"></output></label><input id="video-speed" type="range" min="0" max="3" step="0.05"></div>`;$('#layer-editor').prepend(source);
 const replace=document.createElement('details');replace.className='video-source-replace';replace.innerHTML='<summary>Replace with file or YouTube</summary>';for(const node of [$('#replace-video-file'),$('#replace-video-youtube').parentElement,$('#apply-video-youtube'),$('#video-source-error')])replace.append(node);$('#video-source-copy').parentElement.after(replace);
 function change(patch){const layer=current();if(layer)commit(patchLayer(getState(),layer.id,patch,scope));}
 function paint(){
  const state=getState(),layer=current(),count=state.videoLayers.length;
  $('#layer-count').textContent=count?'('+count+'/8)':'';$('#show-videos').checked=state.showVideo;$('#show-videos').disabled=!count;
  $('#layer-empty').hidden=!!count;$('#layer-editor').hidden=!count;
  const key=JSON.stringify(state.videoLayers.map(l=>[l.id,videoTitle(l,clips)]));
  if(key!==listKey){listKey=key;$('#active-video-layer').replaceChildren(...state.videoLayers.map((l,i)=>new Option((i+1)+'. '+videoTitle(l,clips),l.id)));}
  $('#active-video-layer').value=state.activeVideoLayer||'';
  if(layer){if(document.activeElement!==$('#video-name'))$('#video-name').value=layer.name||'';$('#video-source-status').textContent=layer.youtube?'YouTube · '+layer.youtube.id:layer.fileName||layer.customClip?.name||layer.videoId||'No source. Choose a file, YouTube URL, or another video.';$('#video-speed').value=layer.motionSpeed??1;$('#video-speed-value').textContent=(layer.motionSpeed??1).toFixed(2)+'×';}
  const sources=JSON.stringify(state.videoLayers.map(l=>[l.id,videoTitle(l,clips)]))+state.activeVideoLayer;if(sourceKey!==sources){sourceKey=sources;$('#video-source-copy').replaceChildren(new Option('Choose a placed video…',''),...state.videoLayers.filter(l=>l.id!==state.activeVideoLayer).map(l=>new Option(videoTitle(l,clips)+' · '+l.id,l.id)));}
  const screens=JSON.stringify(state.screens.map(sc=>[sc.id,sc.name]));
  if(screens!==screenKey){screenKey=screens;if(scope!=='all'&&!state.screens.some(sc=>sc.id===scope))scope='all';$('#video-placement-screen').replaceChildren(new Option('All screens','all'),...state.screens.map(sc=>new Option(sc.name,sc.id)));$('#video-targets').replaceChildren(Object.assign(document.createElement('legend'),{textContent:'Show on screens'}));for(const sc of state.screens){const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.dataset.videoTarget=sc.id;input.onchange=()=>{const layer=current();if(layer)commit(assignVideoScreens(getState(),layer.id,[...$('#video-targets').querySelectorAll('input:checked')].map(i=>i.dataset.videoTarget)));};label.append(input,document.createTextNode(sc.name));$('#video-targets').append(label);}}
  $('#video-placement-screen').value=scope;
  if(!layer)return;
  for(const input of $('#video-targets').querySelectorAll('input'))input.checked=!layer.targets||layer.targets.includes(input.dataset.videoTarget);
  const sc=state.screens.find(sc=>sc.id===scope),r=sc?placement(layer,scope,screenAspect(sc)):layer;
  $('#youtube-shape').parentElement.hidden=!layer.youtube;$('#youtube-shape').value=String(layer.sourceAspect);$('#edit-video-layers').checked=state.editVideos;$('#layer-visible').checked=r.enabled;
  for(const key of ['x','y','width']){const input=$('#video-'+key);if(document.activeElement!==input)input.value=Number(r[key].toFixed(1));}
  $('#duplicate-video-layer').disabled=count>=8;
 }
 $('#show-videos').onchange=e=>commit({...getState(),showVideo:e.target.checked});
 $('#edit-video-layers').onchange=e=>commit({...getState(),editVideos:e.target.checked,editElements:e.target.checked?false:getState().editElements});
 $('#active-video-layer').onchange=e=>commit(selectVideoElement(getState(),e.target.value));
 $('#video-name').oninput=e=>{const layer=current();if(layer)commit(patchLayer(getState(),layer.id,{name:e.target.value}));};
 $('#video-source-copy').onchange=e=>{const target=current(),source=getState().videoLayers.find(l=>l.id===e.target.value);if(target&&source)commit(assignVideoSource(getState(),target.id,source));e.target.value='';};
 $('#replace-video-file').onclick=()=>{const layer=current();if(layer)chooseFile(layer.id);};
 $('#apply-video-youtube').onclick=()=>{const layer=current(),source=parseYoutube($('#replace-video-youtube').value);if(!source){$('#video-source-error').textContent='Enter a valid YouTube URL.';$('#video-source-error').hidden=false;return;}if(layer)commit(assignVideoSource(getState(),layer.id,{youtube:{...source,title:'YouTube / '+source.id},sourceAspect:source.sourceAspect}));$('#video-source-error').hidden=true;$('#replace-video-youtube').value='';};
 $('#video-speed').oninput=e=>{const layer=current();if(layer)commit(patchLayer(getState(),layer.id,retimeMotion(layer,+e.target.value,timeline(getState()))));};
 $('#video-placement-screen').onchange=e=>{scope=e.target.value;paint();};
 $('#layer-visible').onchange=e=>change({enabled:e.target.checked});
 for(const key of ['x','y','width'])$('#video-'+key).oninput=e=>{if(e.target.value!==''&&e.target.validity.valid)change({[key]:+e.target.value});};
 $('#youtube-shape').onchange=e=>{const layer=current();if(layer)commit(patchLayer(getState(),layer.id,{sourceAspect:+e.target.value},'all'));};
 $('#reset-video-placement').onclick=()=>change({x:70,y:48,width:36,enabled:true});
 $('#remove-video-layer').onclick=()=>commit(removeLayer(getState(),getState().activeVideoLayer));
 $('#duplicate-video-layer').onclick=()=>{const layer=current();if(layer)commit(duplicateVideo(getState(),layer));};
 paint();return {paint,setScope(screen){scope=screen;}};
}
