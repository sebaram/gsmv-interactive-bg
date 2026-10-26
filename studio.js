import {KEY,variants,cues,read,save,sanitize,setPaused,setSpeed,timeline,currentTime,screenAspect} from './state.js';
import {connectSync,staticMode} from './sync.js';
import {screenEditor} from './screens-ui.js';
let state=read();save(state);
const channel=new BroadcastChannel(KEY),$=s=>document.querySelector(s);
let previewIds='',networkOrigin=location.origin;
const editor=screenEditor($('#screen-configs'),()=>state,next=>{state=next;publish();},toast);
$('.style-grid').innerHTML=variants.map((v,i)=>`<button class="style-card" data-variant="${i}" aria-pressed="false"><div class="thumb" style="background-image:url(previews/style-${i}.jpg);background-color:${['#102447','#533743','#d0c9bb','#17343a','#393a55'][i]}"><span class="num">0${i+1}</span><span class="chosen"></span></div><div class="card-copy"><strong>${v.name}</strong><small>${v.tag}</small></div></button>`).join('');
$('.cue-grid').innerHTML=cues.map((v,i)=>`<button class="cue" data-cue="${i}" aria-pressed="false"><small>0${i+1}</small>${v.name}</button>`).join('');
function publish(){state=sanitize(state);save(state);channel.postMessage(state);paint();sync.send(state);}
function paint(){
 document.querySelectorAll('[data-variant]').forEach(el=>{const on=+el.dataset.variant===state.variant;el.classList.toggle('selected',on);el.setAttribute('aria-pressed',on);el.querySelector('.chosen').textContent=on?'✓':'';});
 document.querySelectorAll('[data-cue]').forEach(el=>{const on=+el.dataset.cue===state.cue;el.classList.toggle('selected',on);el.setAttribute('aria-pressed',on);});
 $('#current-name').textContent=variants[state.variant].name;$('#style-description').textContent=variants[state.variant].desc;
 $('#swatch').style.background=['#101d35','#874453','#ded9c9','#143e46','#565b93'][state.variant];
 $('#preview-caption').textContent=['Orbital motion','Real ↔ virtual · flowing ribbons','Floating architecture','Research footage · '+cues[state.cue].name,'Real + virtual + research · '+cues[state.cue].name][state.variant];
 for(const k of ['brightness','speed','motionAmount'])$('#'+k).value=state[k];
 $('#brightness-value').textContent=state.brightness+'%';$('#speed-value').textContent=state.speed.toFixed(2)+'×';$('#motionAmount-value').textContent=state.motionAmount.toFixed(2)+'×';
 for(const k of ['branding','headlines','interactive','calibration'])$('#'+k).checked=state[k];
 $('#pause-btn').textContent=state.paused?'▶ Resume':'Ⅱ Pause';$('#guide-btn').classList.toggle('active',state.guide);
 $('#resolution-label').textContent=state.screens.length+' SCREENS · '+state.screens.map(sc=>sc.width+' × '+sc.height).join(' + ');
 const ids=state.screens.map(sc=>sc.id).join('/');
 if(ids!==previewIds){previewIds=ids;$('.paired').innerHTML='';for(const sc of state.screens){const wrap=document.createElement('div');wrap.className='screen-preview';wrap.dataset.preview=sc.id;const iframe=document.createElement('iframe');iframe.src=`wall.html?view=${encodeURIComponent(sc.id)}&preview=1`;iframe.title=sc.name+' live preview';const label=document.createElement('span');label.className='screen-label';wrap.append(iframe,label);$('.paired').append(wrap);}}
 for(const sc of state.screens){const wrap=document.querySelector(`[data-preview="${sc.id}"]`);wrap.style.flex=screenAspect(sc);wrap.style.aspectRatio=screenAspect(sc);wrap.querySelector('.screen-label').textContent=sc.name;}
 $('#cue-note').textContent=[3,4].includes(state.variant)&&state.cue===5?'Society cue uses a conceptual connection network. No dedicated economics research clip is included.':'Cues set the accent and optional titles. Research styles play the selected footage on every screen.';
 editor.paint();paintOutputs();
}
function paintOutputs(){
 const outputs=$('#output-links'),net=$('#network-links');outputs.innerHTML='';net.innerHTML='';
 const ordered=[...state.screens].sort((a,b)=>(b.id==='front')-(a.id==='front'));
 for(const sc of ordered){const a=document.createElement('a');a.className='output'+(sc.id==='front'?' primary':'');a.href='wall.html?view='+sc.id;a.target='meta-'+sc.id;a.textContent='Open '+sc.name;outputs.append(a);const label=document.createElement('label');label.textContent=sc.name;const input=document.createElement('input');input.readOnly=true;input.value=staticMode?new URL('wall.html?view='+sc.id,location.href).href:networkOrigin+'/backgrounds/wall.html?view='+sc.id;input.setAttribute('aria-label',sc.name+' network URL');input.onclick=()=>input.select();label.append(input);net.append(label);}
}
document.querySelectorAll('[data-variant]').forEach(el=>el.onclick=()=>{state.variant=+el.dataset.variant;publish();});
document.querySelectorAll('[data-cue]').forEach(el=>el.onclick=()=>{state.cue=+el.dataset.cue;publish();});
for(const k of ['branding','headlines','interactive','calibration'])$('#'+k).onchange=e=>{state[k]=e.target.checked;publish();};
for(const k of ['brightness','motionAmount'])$('#'+k).oninput=e=>{state[k]=+e.target.value;publish();};
$('#speed').oninput=e=>{state=setSpeed(state,+e.target.value);publish();};
$('#pause-btn').onclick=()=>{state=setPaused(state,!state.paused);publish();};
$('#guide-btn').onclick=()=>{state.guide=!state.guide;publish();};
$('#motion-demo').onclick=()=>{state=setPaused(state,false);state=setSpeed(state,1);state.motionAmount=1.3;publish();toast('Visible motion · 1× speed · 1.3× movement');};
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
$('#local-video').onchange=e=>{const file=e.target.files[0];if(!file)return;const previous=localVideoUrl;localVideoUrl=URL.createObjectURL(file);state.customClip={url:localVideoUrl,name:file.name};$('#local-video-status').textContent=file.name+' (stays on this computer)';publish();if(previous)setTimeout(()=>URL.revokeObjectURL(previous),2000);};
$('#clear-local-video').onclick=()=>{delete state.customClip;$('#local-video').value='';$('#local-video-status').textContent='Demo animation. Choose your own research video.';publish();};
window.METAStudio={now:currentTime,get state(){return state;}};
let previousTime=null;
setInterval(()=>{
 const frames=[...document.querySelectorAll('.paired iframe')].map(f=>{try{return f.contentWindow.META;}catch{return null;}}).filter(Boolean),first=frames[0];
 if(!first){$('#playback-status').textContent='Starting renderers…';return;}
 const time=first.time,advancing=previousTime!==null&&time>previousTime+.03;previousTime=time;
 const frozen=state.paused||state.speed===0||state.motionAmount===0;
 const fps=Math.round(Math.min(...frames.map(f=>f.stats.fps)));
 const blocked=frames.some(f=>f.stats.videoBlocked);
 $('#playback-status').textContent=blocked?'Video needs a click on its wall output':frozen?'Motion held · '+fps+' fps':advancing?'● LIVE · '+fps+' fps · '+time.toFixed(1)+' s':'Checking motion…';
 $('#playback-status').classList.toggle('held',frozen||blocked);
},600);
paint();
