import {sanitize} from './state.js';
import {addLayer} from './video-layers.js';
import {parseYoutube,videoTitle} from './youtube-source.js';

export function chooseVideo(state,clip,customClip){
 const next=addLayer(sanitize(state),clip,customClip);next.videoId=clip.id;next.cue=clip.cue??0;
 delete next.customClip;return sanitize(next);
}
export function chooseYoutube(state,url,title=''){
 const source=parseYoutube(url);if(!source)throw new Error('Enter a YouTube watch, share, Shorts or embed URL.');
 const base=sanitize(state);if(base.videoLayers.length>=8)return base;
 const next=addLayer(base,{id:null}),layer=next.videoLayers.at(-1);
 layer.youtube={id:source.id,start:source.start,title:title.trim().slice(0,160)||'YouTube / '+source.id};layer.sourceAspect=source.sourceAspect;
 return sanitize(next);
}
export function withoutVideo(state){const next={...state,showVideo:false,videoId:null,videoLayers:[],activeVideoLayer:null};delete next.customClip;return sanitize(next);}
const duration=seconds=>{const n=Math.round(seconds);return Math.floor(n/60)+':'+String(n%60).padStart(2,'0');};

export function videoLibrary(container,clips,{getState,commit,chooseFile,publicMode=false}){
 let inspected=clips[0],query='',pageIndex=0,pages=1;const pageSize=4;
 container.innerHTML=`<div class="video-library-head"><div><h3>Add a video</h3><p id="video-selection-status" role="status"></p></div><button type="button" id="no-video" class="subtle">No video</button></div><form id="youtube-form" class="youtube-form"><h4>YouTube</h4><div class="youtube-fields"><label for="youtube-url">Video URL<input id="youtube-url" type="text" inputmode="url" placeholder="https://www.youtube.com/watch?v=…" required autocomplete="off"></label><label for="youtube-title">Title (optional)<input id="youtube-title" type="text" maxlength="160" placeholder="Name this layer"></label><button type="submit" id="add-youtube">Add YouTube</button></div><p class="note">Watch, share, Shorts and embed links work. Needs internet and an embeddable video; YouTube may show player overlays.</p><p id="youtube-error" role="alert" hidden></p></form><h4 class="video-catalog-heading">Research video library</h4><p id="video-library-help" class="note"></p><label class="video-search-label" for="video-search">Find a video</label><input id="video-search" type="search" placeholder="Search titles, descriptions or topics" autocomplete="off"><p id="video-result-count"></p><div id="video-list" class="video-list" aria-label="Video library"></div><div class="video-pagination"><button type="button" id="video-prev" class="subtle">Previous</button><span id="video-page"></span><button type="button" id="video-next" class="subtle">Next</button></div>`;
 const $=selector=>container.querySelector(selector),list=$('#video-list');
 $('#video-library-help').textContent=publicMode?'Choose your copy of a listed clip, or add any file from your computer below. Files stay in this browser.':'Add a clip directly to your current background. Adjust its placement for each screen above.';
 function drawList(){
  list.replaceChildren();const found=clips.filter(c=>(c.title+' '+c.description+' '+c.category+' '+c.id).toLowerCase().includes(query));
  pages=Math.max(1,Math.ceil(found.length/pageSize));pageIndex=Math.min(pageIndex,pages-1);
  $('#video-result-count').textContent=found.length+' videos';$('#video-page').textContent=(pageIndex+1)+' of '+pages;$('#video-prev').disabled=pageIndex===0;$('#video-next').disabled=pageIndex>=pages-1;
  for(const [i,clip] of found.slice(pageIndex*pageSize,(pageIndex+1)*pageSize).entries()){
   const row=document.createElement('article');row.className='video-item';row.dataset.video=clip.id;
   const button=document.createElement('button');button.type='button';button.className='subtle video-add-button';button.dataset.addVideo=clip.id;button.textContent=publicMode?'Choose file':'Add video';button.setAttribute('aria-label','Add '+clip.title+(publicMode?' from file':''));if(i===0)button.id='use-video';
   const image=document.createElement('img');image.src=clip.poster;image.alt='';image.width=160;image.height=90;image.loading='lazy';
   const text=document.createElement('div'),title=document.createElement('strong'),description=document.createElement('p'),meta=document.createElement('small'),onScreen=document.createElement('span');title.textContent=clip.title;description.textContent=clip.description;description.className='video-item-description';meta.textContent=clip.category+' / '+duration(clip.originalDuration||clip.duration)+' / '+clip.id;onScreen.className='video-on-screen';onScreen.textContent='Added';text.append(title,description,meta,onScreen);
   row.append(image,text,button);button.onclick=()=>{inspected=clip;if(publicMode)chooseFile(clip);else commit(chooseVideo(getState(),clip));};list.append(row);
  }
  if(!found.length){const empty=document.createElement('p');empty.className='video-empty';empty.textContent='No matching videos. Try a different title or topic.';list.append(empty);}
 }
 function paint(){
  const state=getState(),enabled=state.showVideo&&state.videoLayers.length>0,full=state.videoLayers.length>=8;
  $('#video-selection-status').textContent=!enabled?'Video is optional. Add a file or YouTube link to any background.':state.videoLayers.length+' video layer'+(state.videoLayers.length===1?'':'s')+': '+state.videoLayers.map(l=>videoTitle(l,clips)).join(', ');
  $('#no-video').classList.toggle('active',!enabled);$('#add-youtube').disabled=full;
  for(const item of list.querySelectorAll('[data-video]')){const onScreen=enabled&&state.videoLayers.some(l=>l.videoId===item.dataset.video);item.classList.toggle('on-screens',onScreen);item.querySelector('.video-on-screen').hidden=!onScreen;item.querySelector('button').disabled=full;}
 }
 $('#youtube-form').onsubmit=e=>{e.preventDefault();try{commit(chooseYoutube(getState(),$('#youtube-url').value,$('#youtube-title').value));$('#youtube-error').hidden=true;$('#youtube-url').value='';$('#youtube-title').value='';}catch(error){$('#youtube-error').textContent=error.message;$('#youtube-error').hidden=false;}};
 $('#video-search').oninput=e=>{query=e.target.value.trim().toLowerCase();pageIndex=0;drawList();paint();};
 $('#video-prev').onclick=()=>{pageIndex=Math.max(0,pageIndex-1);drawList();paint();};
 $('#video-next').onclick=()=>{pageIndex=Math.min(pages-1,pageIndex+1);drawList();paint();};
 $('#no-video').onclick=()=>commit(withoutVideo(getState()));
 drawList();paint();return {paint,get inspected(){return inspected;}};
}
