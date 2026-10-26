import {KEY,variants,cues,read,save,sanitize,setPaused,setSpeed,timeline,currentTime,screenAspect} from './state.js';
import {connectSync,staticMode} from './sync.js';
import {screenEditor} from './screens-ui.js';
import {videoLibrary,chooseVideo} from './video-library.js';
let state=read();save(state);
const channel=new BroadcastChannel(KEY),$=s=>document.querySelector(s);
const buildVersion=document.querySelector('meta[name="studio-build"]')?.content||'';
let previewIds='',networkOrigin=location.origin;
const editor=screenEditor($('#screen-configs'),()=>state,next=>{state=next;publish();},toast);
const clips=await fetch('./clips.json').then(r=>r.json());
let pendingVideo=null;
const library=videoLibrary($('#video-library'),clips,{getState:()=>state,commit:next=>{state=next;publish();},publicMode:staticMode,chooseFile:clip=>{pendingVideo=clip;$('#local-video').click();}});
$('.style-grid').innerHTML=variants.map((v,i)=>`<button type="button" class="style-card" data-variant="${i}" aria-pressed="false"><div class="thumb" style="background-image:url(previews/style-${i}.jpg)"><span class="chosen"></span></div><div class="card-copy"><strong>${v.name}</strong><small>${v.tag.toLowerCase()}</small></div></button>`).join('');
function publish(){state=sanitize(state);save(state);channel.postMessage(state);paint();sync.send(state);}
function paint(){
 document.querySelectorAll('[data-variant]').forEach(el=>{const on=+el.dataset.variant===state.variant;el.classList.toggle('selected',on);el.setAttribute('aria-pressed',on);el.querySelector('.chosen').textContent=on?'✓':'';});
 $('#current-name').textContent=variants[state.variant].name;$('#style-description').textContent=staticMode&&!state.customClip&&state.showVideo&&[3,4,5].includes(state.variant)?'Preview the moving gallery, then choose a research video from your computer. Your file stays local.':variants[state.variant].desc;
 $('#swatch').style.background=['#101d35','#874453','#ded9c9','#143e46','#565b93','#315e91'][state.variant];
 const active=clips.find(c=>c.id===(state.videoId||cues[state.cue].clip));
 $('#monitor-video-status').textContent=state.showVideo&&[3,4,5].includes(state.variant)?'Video: '+(state.customClip?.name||(staticMode?'animation demo':active?.title||'none')):'No video. Motion graphic only.';
 $('#preview-caption').textContent=state.showVideo&&[3,4,5].includes(state.variant)?(state.customClip?.name||(staticMode?'Animation demo':active?.title||'Video gallery')):state.variant===5?'Forms exchange, consolidate, and evolve':'Procedural motion';
 for(const k of ['brightness','speed','motionAmount'])$('#'+k).value=state[k];
 $('#brightness-value').textContent=state.brightness+'%';$('#speed-value').textContent=state.speed.toFixed(2)+'×';$('#motionAmount-value').textContent=state.motionAmount.toFixed(2)+'×';
 for(const k of ['branding','headlines','interactive','calibration'])$('#'+k).checked=state[k];
 $('#pause-btn').textContent=state.paused?'Resume':'Pause';$('#guide-btn').classList.toggle('active',state.guide);
 $('#resolution-label').textContent=state.screens.length+' screens / '+state.screens.map(sc=>sc.width+' × '+sc.height).join(' + ');
 const ids=state.screens.map(sc=>sc.id).join('/');
 if(ids!==previewIds){previewIds=ids;$('.paired').innerHTML='';for(const sc of state.screens){const wrap=document.createElement('div');wrap.className='screen-preview';wrap.dataset.preview=sc.id;const iframe=document.createElement('iframe');iframe.src=`wall.html?view=${encodeURIComponent(sc.id)}&preview=1`+(buildVersion?'&v='+buildVersion:'');iframe.title=sc.name+' live preview';iframe.tabIndex=-1;const label=document.createElement('span');label.className='screen-label';wrap.append(iframe,label);$('.paired').append(wrap);}}
 for(const sc of state.screens){const wrap=document.querySelector(`[data-preview="${sc.id}"]`);wrap.style.flex=screenAspect(sc);wrap.style.aspectRatio=screenAspect(sc);wrap.querySelector('.screen-label').textContent=sc.name;}
 editor.paint();library.paint();paintOutputs();
}
function paintOutputs(){
 const outputs=$('#output-links'),net=$('#network-links');outputs.innerHTML='';net.innerHTML='';
 const ordered=[...state.screens].sort((a,b)=>(b.id==='front')-(a.id==='front'));
 for(const sc of ordered){const a=document.createElement('a');a.className='output'+(sc.id==='front'?' primary':'');a.href='wall.html?view='+sc.id;a.target='meta-'+sc.id;a.textContent='Open '+sc.name;outputs.append(a);const label=document.createElement('label');label.textContent=sc.name;const input=document.createElement('input');input.readOnly=true;input.value=staticMode?new URL('wall.html?view='+sc.id,location.href).href:networkOrigin+'/backgrounds/wall.html?view='+sc.id;input.setAttribute('aria-label',sc.name+' network URL');input.onclick=()=>input.select();label.append(input);net.append(label);}
 if(buildVersion){for(const link of document.querySelectorAll('a[href^="wall.html?"]')){const url=new URL(link.href);url.searchParams.set('v',buildVersion);link.href=url.href;}if(staticMode)for(const input of net.querySelectorAll('input')){const url=new URL(input.value);url.searchParams.set('v',buildVersion);input.value=url.href;}}
}
document.querySelectorAll('[data-variant]').forEach(el=>el.onclick=()=>{state.variant=+el.dataset.variant;if(state.variant===5){state.showVideo=false;state.offset=10/Math.max(.1,state.motionAmount);state.epoch=currentTime();}else if([3,4].includes(state.variant))state.showVideo=true;publish();});
for(const k of ['branding','headlines','interactive','calibration'])$('#'+k).onchange=e=>{state[k]=e.target.checked;publish();};
for(const k of ['brightness','motionAmount'])$('#'+k).oninput=e=>{state[k]=+e.target.value;publish();};
$('#speed').oninput=e=>{state=setSpeed(state,+e.target.value);publish();};
$('#pause-btn').onclick=()=>{state=setPaused(state,!state.paused);publish();};
$('#guide-btn').onclick=()=>{state.guide=!state.guide;publish();};
$('#motion-demo').onclick=()=>{state=setPaused(state,false);state=setSpeed(state,1);state.motionAmount=1.3;state.motionConsent=true;publish();};
$('#add-screen').onclick=()=>editor.add();
$('#clean-btn').onclick=()=>{Object.assign(state,{guide:false,calibration:false,interactive:false,bezel:0,screens:state.screens.map(sc=>({...sc,grid:false}))});publish();toast('Clean take ready · all screen overlays off');};
$('#save-look').onclick=()=>{const blob=new Blob([JSON.stringify({...state,customClip:undefined,offset:timeline(state),epoch:currentTime(),savedAt:new Date().toISOString(),styleName:variants[state.variant].name},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='META-'+variants[state.variant].name.toLowerCase().replaceAll(' ','-')+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast('Look and screen setup saved');};
$('#load-look').onclick=()=>$('#look-file').click();
$('#look-file').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const raw=JSON.parse(await f.text());if(typeof raw!=='object'||raw===null||!Number.isInteger(raw.variant))throw Error();state=sanitize({...raw,epoch:currentTime()});publish();toast('Look and screen setup loaded');}catch{toast('Choose a META look JSON file');}e.target.value='';};
let toastTimer;function toast(t){$('#toast').textContent=t;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3500);}
channel.onmessage=e=>{state=sanitize(e.data);paint();};
window.addEventListener('storage',e=>{if(e.key===KEY){state=read();paint();}});
const sync=connectSync(next=>{state=next;save(state);channel.postMessage(state);paint();},{controller:true,initial:state,onStatus:ok=>{$('#network-status').textContent=staticMode?'Browser playback':ok?'Network ready':'Reconnecting';},onInfo:urls=>{networkOrigin=new URL(urls.front).origin;paintOutputs();}});
if(staticMode){$('#network-help').textContent='Public preview controls synchronize windows in this browser. For separate computers, run the LAN server from the repository.';$('#local-video-controls').hidden=false;}
let localVideoUrl;
$('#local-video').onchange=e=>{const file=e.target.files[0];if(!file)return;const previous=localVideoUrl;localVideoUrl=URL.createObjectURL(file);state=chooseVideo(state,pendingVideo||library.inspected);pendingVideo=null;state.customClip={url:localVideoUrl,name:file.name};$('#local-video-status').textContent=file.name+' (stays on this computer)';publish();if(previous)setTimeout(()=>URL.revokeObjectURL(previous),2000);};
$('#clear-local-video').onclick=()=>{delete state.customClip;state.showVideo=true;$('#local-video').value='';$('#local-video-status').textContent='Demo animation. Choose your own research video.';publish();};
window.METAStudio={now:currentTime,get state(){return state;}};
let previousTime=null;
setInterval(()=>{
 const frames=[...document.querySelectorAll('.paired iframe')].map(f=>{try{return f.contentWindow.META;}catch{return null;}}).filter(Boolean),first=frames[0];
 if(!first){$('#playback-status').textContent='Starting renderers…';return;}
 const time=first.time,advancing=previousTime!==null&&time>previousTime+.03;previousTime=time;
 const reduced=frames.some(f=>f.stats.reducedMotion),frozen=state.paused||state.speed===0||state.motionAmount===0||reduced;
 const fps=Math.round(Math.min(...frames.map(f=>f.stats.fps)));
 const blocked=frames.some(f=>f.stats.videoBlocked);
 $('#playback-status').textContent=blocked?'Click the wall output to start video':reduced?'Reduced motion preference':frozen?'Motion held, '+fps+' fps':advancing?'Playing at '+fps+' fps, '+time.toFixed(1)+' s':'Checking motion';
 $('#playback-status').classList.toggle('held',frozen||blocked);
},600);
paint();
