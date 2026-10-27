import {timeline,screenAspect} from './state.js';
import {placement,videoNeedsFile,videoElementId} from './video-layers.js';
import {youtubePlayer} from './youtube-player.js';
import {clockTime} from './motion.js';

export function videoOverlay(container,clips,{view,preview,motionAllowed}){
 const entries=new Map();let state,lastSync=0;
 const info=entry=>({id:entry.layer.id,time:entry.video?.currentTime||0,paused:entry.video?.paused??state.paused,muted:true,ready:entry.video?.readyState||0,source:entry.layer.youtube?'youtube/'+entry.layer.youtube.id:entry.layer.videoId||'local',provider:entry.kind,error:entry.error.hidden?null:entry.error.textContent});
 function sync(entry,force=false){
  const v=entry.video;if(entry.failed||!v||v.readyState<1)return;
  const duration=v.duration,start=entry.layer.youtube?.start<duration?entry.layer.youtube.start:0;
  if(Number.isFinite(duration)&&duration>0){const time=clockTime(timeline(state),entry.layer),length=duration-start,target=start+(motionAllowed()?((time%length)+length)%length:0);if(force||Math.abs(v.currentTime-target)>(entry.kind==='youtube'?1.5:.28))v.currentTime=target;}
  if(!state.showVideo||!entry.rect.enabled||state.paused||state.speed===0||entry.layer.motionSpeed===0||!motionAllowed())v.pause();
  else {v.playbackRate=Math.max(.0625,state.speed*(entry.layer.motionSpeed??1));if(v.paused){if(entry.kind==='youtube')v.play();else v.play().then(()=>entry.blocked=false).catch(()=>entry.blocked=true);}}
 }
 function position(entry){
  const sc=state.screens.find(s=>s.id===view)||state.screens[0],v=entry.video;
  entry.rect=placement(entry.layer,sc.id,screenAspect(sc),entry.kind==='youtube'?entry.layer.sourceAspect:v.videoWidth/v.videoHeight||16/9);
  const r=entry.rect;Object.assign(entry.wrap.style,{left:r.x+'%',top:r.y+'%',width:r.width+'%',height:r.height+'%'});
  entry.wrap.hidden=!state.showVideo||!r.enabled||videoNeedsFile(entry.layer);
  entry.wrap.classList.toggle('editing',preview&&state.editVideos);
  entry.wrap.classList.toggle('selected',state.activeVideoLayer===entry.layer.id);
  if(preview)entry.wrap.tabIndex=0;
  if(entry.kind==='youtube'){
   const width=innerWidth*r.width/100,height=innerHeight*r.height/100,aspect=entry.layer.sourceAspect;
   const playerHeight=Math.max(height,200,200/aspect),playerWidth=playerHeight*aspect;
   entry.wrap.style.setProperty('--youtube-width',playerWidth+'px');entry.wrap.style.setProperty('--youtube-height',playerHeight+'px');entry.wrap.style.setProperty('--youtube-scale-x',width/playerWidth);entry.wrap.style.setProperty('--youtube-scale-y',height/playerHeight);
  }
 }
 function create(layer){
  const wrap=document.createElement('div'),label=document.createElement('span'),kind=layer.youtube?'youtube':'file';
  wrap.className='video-layer';wrap.dataset.layer=layer.id;wrap.dataset.provider=kind;
  label.className='video-unavailable';label.textContent='Video unavailable. Choose this file again in the studio.';label.hidden=true;
  wrap.append(label);container.append(wrap);
  const entry={wrap,video:null,kind,layer,blocked:false,url:null,rect:null,error:label};
  if(kind==='youtube'){
   const host=document.createElement('div');host.className=preview?'youtube-placement':'youtube-media';wrap.prepend(host);
   if(preview){const title=document.createElement('strong'),note=document.createElement('span');title.textContent=layer.youtube.title;note.textContent='YouTube / plays on wall output';host.append(title,note);}
   else entry.video=youtubePlayer(host,layer.youtube,{onReady:()=>{position(entry);sync(entry,true);},onEnded:()=>sync(entry,true),onPlaying:()=>entry.blocked=false,onBlocked:()=>entry.blocked=true,onError:message=>{entry.failed=true;label.textContent=message;label.hidden=false;entry.video?.pause();}});
  }else{
   const video=document.createElement('video');video.muted=true;video.defaultMuted=true;video.loop=true;video.playsInline=true;video.preload='auto';entry.video=video;wrap.prepend(video);
   video.onloadedmetadata=()=>{position(entry);sync(entry,true);const sourceAspect=video.videoWidth/video.videoHeight;if(preview&&Number.isFinite(sourceAspect)&&Math.abs(sourceAspect-entry.layer.sourceAspect)>.0001)parent.METAStudio?.updateVideoLayer(layer.id,{sourceAspect},'all');};video.onerror=()=>{label.hidden=false;if(preview&&entry.layer.fileName&&entry.url?.startsWith('blob:'))parent.METAStudio?.missingVideoFile(layer.id,entry.url);};
  }
  if(preview){
   const tag=document.createElement('span'),handle=document.createElement('button');tag.className='video-edit-label';handle.className='video-resize';handle.type='button';handle.setAttribute('aria-label','Resize video');tag.textContent='Move video';wrap.append(tag,handle);
   wrap.onpointerdown=e=>{
    if(e.button!==0)return;e.preventDefault();e.stopPropagation();wrap.focus({preventScroll:true});
    parent.METAStudio?.selectVideoLayer(layer.id,view);
    parent.METAStudio?.beginElementGesture();
    const start={...entry.rect,pointerX:e.clientX,pointerY:e.clientY},resize=e.target===handle,pointer=e.pointerId;wrap.setPointerCapture(pointer);
    const change=event=>{
     const dx=(event.clientX-start.pointerX)/innerWidth*100,dy=(event.clientY-start.pointerY)/innerHeight*100;
     const patch=resize?{width:start.width+dx*2}:{x:start.x+dx,y:start.y+dy};
     parent.METAStudio?.updateVideoLayer(layer.id,patch,view);
    };
    wrap.onpointermove=change;const finish=()=>{wrap.onpointermove=null;wrap.onpointerup=null;wrap.onpointercancel=null;if(wrap.hasPointerCapture(pointer))wrap.releasePointerCapture(pointer);parent.METAStudio?.endElementGesture();};wrap.onpointerup=finish;wrap.onpointercancel=finish;
   };
   wrap.oncontextmenu=e=>{e.preventDefault();e.stopPropagation();const frame=frameElement.getBoundingClientRect();parent.METAStudio?.elementMenu(videoElementId(layer.id),frame.left+e.clientX,frame.top+e.clientY);};
   wrap.onkeydown=e=>{if(!state.editVideos||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const step=e.shiftKey?5:1,r=entry.rect;parent.METAStudio?.updateVideoLayer(layer.id,{x:r.x+(e.key==='ArrowLeft'?-step:e.key==='ArrowRight'?step:0),y:r.y+(e.key==='ArrowUp'?-step:e.key==='ArrowDown'?step:0)},view);};
  }
  return entry;
 }
 function dispose(entry){if(entry.kind==='youtube')entry.video?.destroy();else{entry.video.pause();entry.video.removeAttribute('src');entry.video.load();}entry.wrap.remove();}
 function update(next){
  const previous=state;state=next;
  for(const [id,entry] of entries)if(!state.videoLayers.some(l=>l.id===id)){dispose(entry);entries.delete(id);}
  for(const layer of state.videoLayers){
   let entry=entries.get(layer.id);if(entry&&(entry.kind!==(layer.youtube?'youtube':'file')||entry.layer.youtube?.id!==layer.youtube?.id||entry.layer.youtube?.start!==layer.youtube?.start)){dispose(entry);entries.delete(layer.id);entry=null;}if(!entry){entry=create(layer);entries.set(layer.id,entry);}entry.layer=layer;
   const clip=layer.customClip||(!layer.fileName&&clips.find(c=>c.id===layer.videoId)),url=clip?.url||'';
   if(entry.kind==='file'&&url!==entry.url){entry.video.pause();entry.url=url;entry.error.hidden=true;if(url)entry.video.src=url;else{entry.video.removeAttribute('src');entry.error.hidden=false;}entry.video.load();}
   position(entry);sync(entry,previous&&(previous.paused!==state.paused||previous.speed!==state.speed||previous.offset!==state.offset));
  }
 }
 return {update,resize(){if(state)for(const entry of entries.values())position(entry);},tick(now){if(now-lastSync<500)return;lastSync=now;for(const entry of entries.values())sync(entry);},play(){for(const entry of entries.values())sync(entry,true);},get stats(){return [...entries.values()].filter(e=>!e.wrap.hidden).map(info);},get blocked(){return [...entries.values()].some(e=>!e.wrap.hidden&&e.blocked);}};
}
