import {KEY,variants,cues,read,save,sanitize,setPaused,setSpeed,timeline,currentTime,screenAspect} from './state.js';
import {connectSync,staticMode} from './sync.js';
import {screenEditor} from './screens-ui.js';
import {videoLibrary,chooseVideo} from './video-library.js';
import {patchLayer,portableLook,playVideo,videoNeedsFile,videoElements,videoElementId,videoVisibleOn,assignVideoSource} from './video-layers.js';
import {videoLayerControls} from './video-layer-controls.js';
import {authoringControls} from './authoring-ui.js';
import {encodeLook,decodeLook,lookUrl} from './look-url.js';
import {appearanceControls} from './appearance-ui.js';
const addressLook=decodeLook(location.hash);
const storedLook=read();let state=addressLook||sanitize({...storedLook,videoLayers:portableLook(storedLook).videoLayers});save(state);
const channel=new BroadcastChannel(KEY),$=s=>document.querySelector(s);
const buildVersion=document.querySelector('meta[name="studio-build"]')?.content||'';
let addressTimer;
function updateAddress(){clearTimeout(addressTimer);addressTimer=setTimeout(()=>{try{const hash=encodeLook(state);if(location.hash!==hash)history.replaceState(null,'',location.pathname+location.search+hash);}catch{}},180);}
let previewIds='',networkOrigin=location.origin;
const editor=screenEditor($('#screen-configs'),()=>state,next=>{state=next;publish();},toast);
const clips=await fetch('./clips.json').then(r=>r.json());
let pendingVideo=null,pendingVideoLayer=null;
const library=videoLibrary($('#video-library'),clips,{getState:()=>state,commit:next=>author.commit(next),editVideo:id=>{author.select(videoElementId(id));$('#authoring-controls').scrollIntoView({block:'start'});},publicMode:staticMode,chooseFile:(clip,id)=>{pendingVideo=clip;pendingVideoLayer=id||null;$('#local-video').multiple=!id;$('#local-video').disabled=false;$('#local-video').click();}});
$('#video-add-files').append($('#local-video-controls'));
const layers=videoLayerControls($('#video-layer-controls'),clips,{getState:()=>state,commit:next=>author.commit(next),chooseFile:id=>library.replaceFile(id)});
document.querySelector('aside .panel-note').after($('#motion-demo'));$('#motion-demo').textContent='Enable playback';
const author=authoringControls($('#authoring-controls'),{getState:()=>state,getElements:()=>{let art=[];try{art=document.querySelector('.paired iframe')?.contentWindow.META?.elements||[];}catch{}return [...art,...videoElements(state,clips)];},videoControls:layers,commit:next=>{state=next;publish();},notify:toast});
const appearance=appearanceControls($('#scene-appearance'),{getState:()=>state,commit:next=>{state=next;publish();}});
$('.style-grid').innerHTML=variants.map((v,i)=>`<button type="button" class="style-card" data-variant="${i}" aria-pressed="false"><div class="thumb" style="background-image:url(previews/style-${i}.jpg)"><span class="chosen"></span></div><div class="card-copy"><strong>${v.name}</strong><small>${v.tag.toLowerCase()}</small></div></button>`).join('');
function publish(){state=sanitize(state);save(state);channel.postMessage(state);paint();sync.send(state);}
function paint(){
 document.querySelectorAll('[data-variant]').forEach(el=>{const on=+el.dataset.variant===state.variant;el.classList.toggle('selected',on);el.setAttribute('aria-pressed',on);el.querySelector('.chosen').textContent=on?'✓':'';});
 $('#current-name').textContent=variants[state.variant].name;$('#style-description').textContent=variants[state.variant].desc;
 $('#swatch').style.background=['#101d35','#874453','#ded9c9','#143e46','#565b93','#315e91'][state.variant];
 const visible=state.showVideo?state.videoLayers.filter(l=>!videoNeedsFile(l)&&state.screens.some(sc=>videoVisibleOn(l,sc.id))).length:0;
 $('#clear-local-video').disabled=state.videoLayers.length>=8;$('#local-video').disabled=state.videoLayers.length>=8;
 $('#monitor-video-status').textContent=visible?visible+' video'+(visible===1?'':'s')+' on screen':'Motion graphic only. Choose a video below.';
 $('#preview-caption').textContent=visible?'Video placement: '+(state.editVideos?'drag to move, corner to resize':'editing off'):state.variant===5?'Forms exchange, consolidate, and evolve':'Procedural motion';
 $('.paired').classList.toggle('editing-videos',state.editVideos&&!!visible);$('.paired').classList.toggle('editing-elements',state.editElements);
 $('#brightness').value=state.brightness;
 $('#brightness-value').textContent=state.brightness+'%';
 for(const k of ['branding','headlines','interactive','calibration'])$('#'+k).checked=state[k];
 $('#pause-btn').textContent=state.paused?'Resume':'Pause';$('#guide-btn').classList.toggle('active',state.guide);
 $('#resolution-label').textContent=state.screens.length+' screens / '+state.screens.map(sc=>sc.width+' × '+sc.height).join(' + ');
 const ids=state.screens.map(sc=>sc.id).join('/');
 if(ids!==previewIds){previewIds=ids;$('.paired').innerHTML='';for(const sc of state.screens){const wrap=document.createElement('div');wrap.className='screen-preview';wrap.dataset.preview=sc.id;const iframe=document.createElement('iframe');iframe.src=`wall.html?view=${encodeURIComponent(sc.id)}&preview=1`+(buildVersion?'&v='+buildVersion:'');iframe.title=sc.name+' live preview';iframe.tabIndex=-1;const label=document.createElement('span');label.className='screen-label';wrap.append(iframe,label);$('.paired').append(wrap);}}
 for(const sc of state.screens){const wrap=document.querySelector(`[data-preview="${sc.id}"]`);wrap.style.aspectRatio=screenAspect(sc);wrap.querySelector('.screen-label').textContent=sc.name;}
 layoutPreviews();
 editor.paint();library.paint();layers.paint();author.paint();appearance.paint();paintOutputs();updateAddress();
}
function layoutPreviews(){
 const paired=$('.paired'),room=$('.preview-room'),total=state.screens.reduce((sum,sc)=>sum+screenAspect(sc),0),style=getComputedStyle(paired),padding=parseFloat(style.paddingTop)+parseFloat(style.paddingBottom);
 const chrome=room.offsetHeight-paired.offsetHeight,maxHeight=Math.max(28,innerHeight*.46-chrome-padding),height=Math.min(paired.clientWidth/total,maxHeight);
 paired.style.height=(height+padding)+'px';
 for(const sc of state.screens){const wrap=paired.querySelector(`[data-preview="${sc.id}"]`);if(wrap)wrap.style.flex='0 1 '+height*screenAspect(sc)+'px';}
 document.documentElement.style.setProperty('--preview-height',(room.offsetHeight+20)+'px');
}
window.addEventListener('resize',layoutPreviews);
function paintOutputs(){
 const outputs=$('#output-links'),net=$('#network-links');outputs.innerHTML='';net.innerHTML='';
 const ordered=[...state.screens].sort((a,b)=>(b.id==='front')-(a.id==='front'));
 for(const sc of ordered){const a=document.createElement('a');a.className='output'+(sc.id==='front'?' primary':'');a.href='wall.html?view='+sc.id+(staticMode?encodeLook(state):'');a.target='meta-'+sc.id;a.textContent='Open '+sc.name;outputs.append(a);const label=document.createElement('label');label.textContent=sc.name;const input=document.createElement('input');input.readOnly=true;input.value=staticMode?new URL('wall.html?view='+sc.id,location.href).href:networkOrigin+'/backgrounds/wall.html?view='+sc.id;input.setAttribute('aria-label',sc.name+' network URL');input.onclick=()=>input.select();label.append(input);net.append(label);}
 if(staticMode){for(const link of document.querySelectorAll('a[href^="wall.html?"]')){const url=new URL(link.href);url.hash=encodeLook(state);link.href=url.href;}for(const input of net.querySelectorAll('input')){const url=new URL(input.value);url.hash=encodeLook(state);input.value=url.href;}}
 if(buildVersion){for(const link of document.querySelectorAll('a[href^="wall.html?"]')){const url=new URL(link.href);url.searchParams.set('v',buildVersion);link.href=url.href;}if(staticMode)for(const input of net.querySelectorAll('input')){const url=new URL(input.value);url.searchParams.set('v',buildVersion);input.value=url.href;}}
}
document.querySelectorAll('[data-variant]').forEach(el=>el.onclick=()=>{state.variant=+el.dataset.variant;if(state.variant===5){state.offset=10/Math.max(.1,state.motionAmount);state.epoch=currentTime();}publish();});
for(const k of ['branding','headlines','interactive','calibration'])$('#'+k).onchange=e=>{state[k]=e.target.checked;publish();};
for(const k of ['brightness'])$('#'+k).oninput=e=>{state[k]=+e.target.value;publish();};

$('#pause-btn').onclick=()=>{state=setPaused(state,!state.paused);publish();};
$('#guide-btn').onclick=()=>{state.guide=!state.guide;publish();};
$('#motion-demo').onclick=()=>{state=setPaused(state,false);state=setSpeed(state,1);state.motionAmount=1;state.motionConsent=true;publish();};
$('#add-screen').onclick=()=>editor.add();
$('#clean-btn').onclick=()=>{Object.assign(state,{guide:false,calibration:false,interactive:false,editVideos:false,editElements:false,bezel:0,screens:state.screens.map(sc=>({...sc,grid:false}))});publish();toast('Clean take ready · all screen overlays off');};
$('#save-look').onclick=()=>{const blob=new Blob([JSON.stringify({...portableLook(state),offset:timeline(state),epoch:currentTime(),savedAt:new Date().toISOString(),styleName:variants[state.variant].name},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='META-'+variants[state.variant].name.toLowerCase().replaceAll(' ','-')+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast('Look and screen setup saved');};
$('#copy-look-link').onclick=async()=>{try{const url=lookUrl(state,location.href);history.replaceState(null,'',url);await navigator.clipboard.writeText(url);toast('Look link copied. Bookmark it to reopen this arrangement.');}catch{toast('The current address contains your look. Copy it from the address bar.');}};
$('#load-look').onclick=()=>$('#look-file').click();
$('#look-file').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const raw=JSON.parse(await f.text());if(typeof raw!=='object'||raw===null||!Number.isInteger(raw.variant))throw Error();state=sanitize({...raw,epoch:currentTime()});publish();toast('Look and screen setup loaded');}catch{toast('Choose a META look JSON file');}e.target.value='';};
let toastTimer;function toast(t){$('#toast').textContent=t;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3500);}
channel.onmessage=e=>{state=sanitize(e.data);paint();};
window.addEventListener('hashchange',()=>{const next=decodeLook(location.hash);if(next){state=next;publish();}});
window.addEventListener('storage',e=>{if(e.key===KEY){state=read();paint();}});
const sync=connectSync(next=>{state=next;save(state);channel.postMessage(state);paint();},{controller:true,initial:state,preferInitial:!!addressLook,onStatus:ok=>{$('#network-status').textContent=staticMode?'Browser playback':ok?'Network ready':'Reconnecting';},onInfo:urls=>{networkOrigin=new URL(urls.front).origin;paintOutputs();}});
if(staticMode){$('#network-help').textContent='Public preview controls synchronize windows in this browser. For separate computers, run the LAN server from the repository.';$('#local-video-controls').hidden=false;}
$('#local-video').oncancel=()=>{pendingVideo=null;pendingVideoLayer=null;$('#local-video').multiple=true;paint();};
$('#local-video').onchange=e=>{
 const files=[...e.target.files];if(!files.length)return;let next=state,added=0,first=null;const replacing=!!pendingVideoLayer;
 if(pendingVideoLayer){const layer=next.videoLayers.find(l=>l.id===pendingVideoLayer);if(layer){const file=files[0];next=assignVideoSource(next,layer.id,{customClip:{url:URL.createObjectURL(file),name:file.name},fileName:file.name});first=layer.id;added=1;}}
 else for(const file of files){if(next.videoLayers.length>=8)break;next=chooseVideo(next,pendingVideo||{id:null,cue:next.cue},{url:URL.createObjectURL(file),name:file.name});first=first||next.activeVideoLayer;added++;}
 if(first&&!replacing)next=playVideo(next,first);pendingVideo=null;pendingVideoLayer=null;e.target.multiple=true;e.target.value='';$('#local-video-status').textContent=added?added+' file'+(added===1?'':'s')+' ready in Your videos. Files stay in this browser.':'Your list is full. Remove a video before adding another.';if(added<files.length)toast('Up to 8 videos. Extra files were not added.');author.commit(next);
};
$('#clear-local-video').onclick=()=>{const next=chooseVideo(state,{id:null,cue:state.cue},{url:'previews/demo-motion.mp4',name:'Demo animation'});author.commit(playVideo(next,next.activeVideoLayer));};
window.METAStudio={now:currentTime,missingVideoFile(id,url){const layer=state.videoLayers.find(l=>l.id===id);if(layer?.fileName&&layer.customClip?.url===url){author.accept(patchLayer(state,id,{customClip:undefined}));}},selectElement(id){author.closeMenu();author.select(id);},updateElement:(id,patch)=>author.updateElement(id,patch),elementKey:event=>author.keydown(event),elementMenu:(id,x,y)=>author.openMenu(id,x,y),beginElementGesture:()=>author.beginGesture(),endElementGesture:()=>author.endGesture(),get state(){return state;},selectVideoLayer(id,screen){author.select(videoElementId(id),screen||'all');},updateVideoLayer(id,patch,screen){const next=patchLayer(state,id,patch,screen);if(Object.keys(patch).length===1&&'sourceAspect' in patch)author.accept(next);else author.commit({...next,activeElement:videoElementId(id),activeVideoLayer:id});}};
let previousTime=null;
setInterval(()=>{
 const frames=[...document.querySelectorAll('.paired iframe')].map(f=>{try{return f.contentWindow.META;}catch{return null;}}).filter(Boolean),first=frames[0];
 if(!first){$('#playback-status').textContent='Starting renderers…';return;}
 author.paint();
 const time=first.time,advancing=previousTime!==null&&time>previousTime+.03;previousTime=time;
 const reduced=frames.some(f=>f.stats.reducedMotion),frozen=state.paused||state.speed===0||state.motionAmount===0||reduced;
 const fps=Math.round(Math.min(...frames.map(f=>f.stats.fps)));
 const blocked=frames.some(f=>f.stats.videoBlocked);
 $('#playback-status').textContent=blocked?'Click the wall output to start video':reduced?'Reduced motion preference':frozen?'Motion held, '+fps+' fps':advancing?'Playing at '+fps+' fps, '+time.toFixed(1)+' s':'Checking motion';
 $('#playback-status').classList.toggle('held',frozen||blocked);
},600);
paint();
