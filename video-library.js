import {cues,sanitize} from './state.js';
import {addLayer} from './video-layers.js';

export function chooseVideo(state,clip,customClip){
 const next=addLayer(sanitize(state),clip,customClip);next.videoId=clip.id;next.cue=clip.cue??0;
 delete next.customClip;return sanitize(next);
}
export function withoutVideo(state){const next={...state,showVideo:false,videoId:null,videoLayers:[],activeVideoLayer:null};delete next.customClip;return sanitize(next);}
const duration=seconds=>{const n=Math.round(seconds);return Math.floor(n/60)+':'+String(n%60).padStart(2,'0');};

export function videoLibrary(container,clips,{getState,commit,chooseFile,publicMode=false}){
 let inspected=clips.find(c=>c.id===(getState().videoId||cues[getState().cue].clip))||clips[0],query='',loadedKey='';
 const pageSize=4;let pageIndex=Math.floor(clips.indexOf(inspected)/pageSize),pages=1;
 container.innerHTML=`<div class="video-library-head"><div><h3>Choose a video</h3><p id="video-selection-status" role="status"></p></div><button type="button" id="no-video" class="subtle">No video</button></div><label class="video-search-label" for="video-search">Find a video</label><input id="video-search" type="search" placeholder="Search titles, descriptions or topics" autocomplete="off"><div class="video-browser"><div class="video-list-column"><p id="video-result-count"></p><div id="video-list" class="video-list" aria-label="Video library"></div><div class="video-pagination"><button type="button" id="video-prev" class="subtle">Previous</button><span id="video-page"></span><button type="button" id="video-next" class="subtle">Next</button></div></div><div class="video-detail"><video id="video-preview" controls muted playsinline preload="metadata"></video><img id="video-poster" width="640" height="360" alt="" hidden><h4 id="video-title"></h4><p id="video-description"></p><p id="video-meta"></p><p id="video-availability"></p><button type="button" id="use-video">Use this video</button></div></div>`;
 const $=selector=>container.querySelector(selector),list=$('#video-list'),player=$('#video-preview'),poster=$('#video-poster');
 function drawList(){
  list.innerHTML='';const found=clips.filter(c=>(c.title+' '+c.description+' '+c.category+' '+c.id).toLowerCase().includes(query));
  pages=Math.max(1,Math.ceil(found.length/pageSize));pageIndex=Math.min(pageIndex,pages-1);
  $('#video-result-count').textContent=found.length+' videos';$('#video-page').textContent=(pageIndex+1)+' of '+pages;$('#video-prev').disabled=pageIndex===0;$('#video-next').disabled=pageIndex>=pages-1;
  for(const clip of found.slice(pageIndex*pageSize,(pageIndex+1)*pageSize)){
   const row=document.createElement('article');row.className='video-item';row.dataset.video=clip.id;
   const button=document.createElement('button');button.type='button';button.className='subtle video-preview-button';button.dataset.previewVideo=clip.id;button.textContent='Preview';button.setAttribute('aria-label','Preview '+clip.title);
   const image=document.createElement('img');image.src=clip.poster;image.alt='';image.width=160;image.height=90;image.loading='lazy';
   const text=document.createElement('div'),title=document.createElement('strong'),meta=document.createElement('small'),onScreen=document.createElement('span');title.textContent=clip.title;meta.textContent=clip.category+' / '+duration(clip.originalDuration||clip.duration);onScreen.className='video-on-screen';onScreen.textContent='On screens';text.append(title,meta,onScreen);
   row.append(image,text,button);button.onclick=()=>{inspected=clip;paint();if(!player.hidden)player.play().catch(()=>{});};list.append(row);
  }
  if(!found.length){const empty=document.createElement('p');empty.className='video-empty';empty.textContent='No matching videos. Try a different title or topic.';list.append(empty);}
 }
 function paint(){
  const state=getState(),enabled=state.showVideo&&state.videoLayers.length>0;
  $('#video-selection-status').textContent=!enabled?'Video is optional. Add a clip to any background.':state.videoLayers.length+' video layer'+(state.videoLayers.length===1?'':'s')+': '+state.videoLayers.map(l=>l.customClip?.name||clips.find(c=>c.id===l.videoId)?.title||'Video').join(', ');
  $('#no-video').classList.toggle('active',!enabled);
  for(const item of list.querySelectorAll('[data-video]')){const selected=item.dataset.video===inspected.id,onScreen=enabled&&state.videoLayers.some(l=>l.videoId===item.dataset.video);item.classList.toggle('selected',selected);item.querySelector('button').setAttribute('aria-pressed',selected);item.classList.toggle('on-screens',onScreen);item.querySelector('.video-on-screen').hidden=!onScreen;}
  const custom=state.videoLayers.findLast(l=>l.videoId===inspected.id&&l.customClip)?.customClip;
  const available=!publicMode||Boolean(custom),url=custom?.url||inspected.url,key=inspected.id+'/'+(custom?.url||'');
  $('#video-title').textContent=inspected.title;$('#video-description').textContent=inspected.description;
  $('#video-meta').textContent=inspected.category+' / '+duration(inspected.originalDuration||inspected.duration)+' / '+inspected.id;
  $('#video-availability').textContent=custom?'Your file plays from this computer.':publicMode?'Preview image shown. Choose your copy below to add it as a video layer.':'Preview here, then add a layer. Adjust its placement for every screen above.';
  $('#use-video').textContent=publicMode?'Add this video from file':'Add video';$('#use-video').dataset.video=inspected.id;$('#use-video').disabled=state.videoLayers.length>=8;
  if(key!==loadedKey){loadedKey=key;player.pause();player.removeAttribute('src');player.load();if(available){player.src=url;player.poster=inspected.poster;}poster.src=inspected.poster;poster.alt=inspected.title+' preview image';}
  player.hidden=!available;poster.hidden=available;
 }
 $('#video-search').oninput=e=>{query=e.target.value.trim().toLowerCase();pageIndex=0;drawList();paint();};
 $('#video-prev').onclick=()=>{pageIndex=Math.max(0,pageIndex-1);drawList();paint();};
 $('#video-next').onclick=()=>{pageIndex=Math.min(pages-1,pageIndex+1);drawList();paint();};
 player.onerror=()=>{$('#video-availability').textContent='Original video unavailable. Check the media folder used by the LAN server, or choose your local file on the public studio.';};
 $('#use-video').onclick=()=>publicMode?chooseFile(inspected):commit(chooseVideo(getState(),inspected));
 $('#no-video').onclick=()=>commit(withoutVideo(getState()));
 drawList();paint();return {paint,get inspected(){return inspected;}};
}
