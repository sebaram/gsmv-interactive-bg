import {sanitize} from './state.js';
import {addLayer,playVideo,playVideosTogether,removeLayer,videoNeedsFile} from './video-layers.js';
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
 let inspected=clips[0],query='',pageIndex=0,pages=1,playlistKey='';const pageSize=4,rows=new Map();
 container.innerHTML=`<div class="video-library-head"><div><h3>Videos</h3><p id="video-selection-status" role="status"></p></div><button type="button" id="no-video" class="subtle">Hide video</button></div><div class="video-source-add"><div id="video-add-files"></div><form id="youtube-form" class="youtube-form"><h4>Add YouTube</h4><div class="youtube-fields"><label for="youtube-url">Video URL<input id="youtube-url" type="text" inputmode="url" placeholder="https://www.youtube.com/watch?v=…" required autocomplete="off"></label><label for="youtube-title">Title (optional)<input id="youtube-title" type="text" maxlength="160" placeholder="Name this video"></label><button type="submit" id="add-youtube">Add YouTube</button></div><p class="note">Requires internet and an embeddable video.</p><p id="youtube-error" role="alert" hidden></p></form></div><p id="video-playlist-empty" class="note">Choose video files or add a YouTube link. Your videos will appear here.</p><section id="video-playlist" aria-label="Your videos" hidden><div class="video-playlist-heading"><h4>Your videos <span id="video-playlist-count"></span></h4><button type="button" id="play-videos-together" class="subtle">Play together</button></div><p class="note">Click a video to show it by itself. Placement opens its screen settings.</p><div id="video-playlist-items"></div></section><details id="video-placement-settings" hidden><summary>Video placement and screen settings</summary><div id="video-properties-mount"></div></details><details id="research-catalog"><summary>Browse server research clips</summary><p id="video-library-help" class="note">Add a server clip to Your videos, then click it to switch playback.</p><label class="video-search-label" for="video-search">Find a server clip</label><input id="video-search" type="search" placeholder="Search titles, descriptions or topics" autocomplete="off"><p id="video-result-count"></p><div id="video-list" class="video-list" aria-label="Server research clips"></div><div class="video-pagination"><button type="button" id="video-prev" class="subtle">Previous</button><span id="video-page"></span><button type="button" id="video-next" class="subtle">Next</button></div></details>`;
 const $=selector=>container.querySelector(selector),list=$('#video-list');$('#research-catalog').hidden=publicMode;
 function drawList(){
  list.replaceChildren();if(publicMode)return;const found=clips.filter(c=>(c.title+' '+c.description+' '+c.category+' '+c.id).toLowerCase().includes(query));
  pages=Math.max(1,Math.ceil(found.length/pageSize));pageIndex=Math.min(pageIndex,pages-1);
  $('#video-result-count').textContent=found.length+' videos';$('#video-page').textContent=(pageIndex+1)+' of '+pages;$('#video-prev').disabled=pageIndex===0;$('#video-next').disabled=pageIndex>=pages-1;
  for(const [i,clip] of found.slice(pageIndex*pageSize,(pageIndex+1)*pageSize).entries()){
   const row=document.createElement('article');row.className='video-item';row.dataset.video=clip.id;
   const button=document.createElement('button');button.type='button';button.className='subtle video-add-button';button.dataset.addVideo=clip.id;button.textContent=publicMode?'Choose file':'Add video';button.setAttribute('aria-label','Add '+clip.title+(publicMode?' from file':''));if(i===0)button.id='use-video';
   const image=document.createElement('img');image.src=clip.poster;image.alt='';image.width=160;image.height=90;image.loading='lazy';
   const text=document.createElement('div'),title=document.createElement('strong'),description=document.createElement('p'),meta=document.createElement('small'),onScreen=document.createElement('span');title.textContent=clip.title;description.textContent=clip.description;description.className='video-item-description';meta.textContent=clip.category+' / '+duration(clip.originalDuration||clip.duration)+' / '+clip.id;onScreen.className='video-on-screen';onScreen.textContent='Added';text.append(title,description,meta,onScreen);
   row.append(image,text,button);button.onclick=()=>{inspected=clip;const next=chooseVideo(getState(),clip);commit(playVideo(next,next.activeVideoLayer));};list.append(row);
  }
  if(!found.length){const empty=document.createElement('p');empty.className='video-empty';empty.textContent='No matching videos. Try a different title or topic.';list.append(empty);}
 }
 function drawPlaylist(state){
  const key=JSON.stringify(state.videoLayers.map(l=>[l.id,videoTitle(l,clips),videoNeedsFile(l),l.youtube?.id,l.customClip?.url]));if(key===playlistKey)return;playlistKey=key;rows.clear();$('#video-playlist-items').replaceChildren();
  for(const layer of state.videoLayers){
   const row=document.createElement('article'),play=document.createElement('button'),text=document.createElement('span'),title=document.createElement('strong'),meta=document.createElement('small'),badge=document.createElement('span'),placement=document.createElement('button'),remove=document.createElement('button');row.className='video-playlist-item';row.dataset.layer=layer.id;play.className='video-play-choice';play.type=placement.type=remove.type='button';play.dataset.playVideo=layer.id;title.textContent=videoTitle(layer,clips);meta.textContent=layer.youtube?'YouTube · '+layer.youtube.id:layer.fileName?'Local file · '+(videoNeedsFile(layer)?'choose it again to play':'available in this browser'):layer.customClip?'Animation demo':'Server clip';text.append(title,meta);badge.className='video-play-badge';play.append(text,badge);play.onclick=()=>{const current=getState().videoLayers.find(l=>l.id===layer.id);if(!current)return;if(videoNeedsFile(current))chooseFile(null,layer.id);else commit(playVideo(getState(),layer.id));};placement.className=remove.className='subtle';placement.textContent='Placement';placement.dataset.videoPlacement=layer.id;placement.onclick=()=>{commit({...getState(),activeVideoLayer:layer.id,editVideos:true,editElements:false});$('#video-placement-settings').open=true;$('#video-placement-settings').scrollIntoView({block:'nearest'});};remove.textContent='Remove';remove.dataset.removeVideo=layer.id;remove.setAttribute('aria-label','Remove '+videoTitle(layer,clips));remove.onclick=()=>commit(removeLayer(getState(),layer.id));row.append(play,placement,remove);$('#video-playlist-items').append(row);rows.set(layer.id,{row,play,badge});
  }
 }
 function paint(){
  const state=getState(),enabled=state.showVideo&&state.videoLayers.length>0,full=state.videoLayers.length>=8,onScreen=state.videoLayers.filter(l=>enabled&&!videoNeedsFile(l)&&state.screens.some(sc=>(l.screens[sc.id]?.enabled??l.enabled)!==false));drawPlaylist(state);
  $('#video-selection-status').textContent=!state.videoLayers.length?'Optional. Add files or YouTube videos to any background.':!enabled?'Videos hidden. Your list is kept.':onScreen.length?'On screen'+(state.paused?' · paused':'')+': '+onScreen.map(l=>videoTitle(l,clips)).join(', '):'Choose a video to show on your screens.';
  $('#no-video').textContent=enabled?'Hide video':'Show video';$('#no-video').disabled=!state.videoLayers.some(l=>!videoNeedsFile(l));$('#no-video').classList.toggle('active',!enabled);$('#add-youtube').disabled=full;$('#video-playlist').hidden=!state.videoLayers.length;$('#video-placement-settings').hidden=!state.videoLayers.length;$('#video-playlist-empty').hidden=!!state.videoLayers.length;$('#video-playlist-count').textContent='('+state.videoLayers.length+'/8)';$('#play-videos-together').disabled=state.videoLayers.filter(l=>!videoNeedsFile(l)).length<2;
  for(const layer of state.videoLayers){const {row,play,badge}=rows.get(layer.id),playing=onScreen.some(l=>l.id===layer.id);row.classList.toggle('playing',playing);row.classList.toggle('selected',state.activeVideoLayer===layer.id);play.setAttribute('aria-pressed',String(playing));badge.textContent=videoNeedsFile(layer)?'Choose file again':playing?(state.paused?'On screen · paused':'Playing'):'Play';play.setAttribute('aria-label',(videoNeedsFile(layer)?'Choose file again for ':playing?'Playing ':'Play ')+videoTitle(layer,clips));}
  for(const item of list.querySelectorAll('[data-video]')){const onScreen=enabled&&state.videoLayers.some(l=>l.videoId===item.dataset.video);item.classList.toggle('on-screens',onScreen);item.querySelector('.video-on-screen').hidden=!onScreen;item.querySelector('button').disabled=full;}
 }
 $('#youtube-form').onsubmit=e=>{e.preventDefault();try{const next=chooseYoutube(getState(),$('#youtube-url').value,$('#youtube-title').value);commit(playVideo(next,next.activeVideoLayer));$('#youtube-error').hidden=true;$('#youtube-url').value='';$('#youtube-title').value='';}catch(error){$('#youtube-error').textContent=error.message;$('#youtube-error').hidden=false;}};
 $('#video-search').oninput=e=>{query=e.target.value.trim().toLowerCase();pageIndex=0;drawList();paint();};
 $('#video-prev').onclick=()=>{pageIndex=Math.max(0,pageIndex-1);drawList();paint();};
 $('#video-next').onclick=()=>{pageIndex=Math.min(pages-1,pageIndex+1);drawList();paint();};
 $('#no-video').onclick=()=>commit({...getState(),showVideo:!getState().showVideo});$('#play-videos-together').onclick=()=>commit(playVideosTogether(getState()));
 drawList();paint();return {paint,get inspected(){return inspected;}};
}
