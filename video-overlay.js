import {timeline,screenAspect} from './state.js';
import {placement} from './video-layers.js';

export function videoOverlay(container,clips,{view,preview,motionAllowed}){
 const entries=new Map();let state,lastSync=0;
 const info=entry=>({id:entry.layer.id,time:entry.video.currentTime,paused:entry.video.paused,muted:entry.video.muted,ready:entry.video.readyState,source:entry.layer.videoId||'local'});
 function sync(entry,force=false){
  const v=entry.video;if(v.readyState<1||!Number.isFinite(v.duration)||!v.duration)return;
  const target=motionAllowed()?timeline(state)%v.duration:0;
  if(force||Math.abs(v.currentTime-target)>.28)v.currentTime=target;
  if(!state.showVideo||!entry.rect.enabled||state.paused||state.speed===0||!motionAllowed())v.pause();
  else {v.playbackRate=Math.max(.0625,state.speed);if(v.paused)v.play().then(()=>entry.blocked=false).catch(()=>entry.blocked=true);}
 }
 function position(entry){
  const sc=state.screens.find(s=>s.id===view)||state.screens[0],v=entry.video;
  entry.rect=placement(entry.layer,sc.id,screenAspect(sc),v.videoWidth/v.videoHeight||16/9);
  const r=entry.rect;Object.assign(entry.wrap.style,{left:r.x+'%',top:r.y+'%',width:r.width+'%',height:r.height+'%'});
  entry.wrap.hidden=!state.showVideo||!r.enabled;
  entry.wrap.classList.toggle('editing',preview&&state.editVideos);
  entry.wrap.classList.toggle('selected',state.activeVideoLayer===entry.layer.id);
  if(preview)entry.wrap.tabIndex=state.editVideos?0:-1;
 }
 function create(layer){
  const wrap=document.createElement('div'),video=document.createElement('video'),label=document.createElement('span');
  wrap.className='video-layer';wrap.dataset.layer=layer.id;video.muted=true;video.defaultMuted=true;video.loop=true;video.playsInline=true;video.preload='auto';
  label.className='video-unavailable';label.textContent='Video unavailable. Choose this file again in the studio.';label.hidden=true;
  wrap.append(video,label);container.append(wrap);
  const entry={wrap,video,layer,blocked:false,url:null,rect:null};
  video.onloadedmetadata=()=>{position(entry);sync(entry,true);const sourceAspect=video.videoWidth/video.videoHeight;if(preview&&Number.isFinite(sourceAspect)&&Math.abs(sourceAspect-entry.layer.sourceAspect)>.0001)parent.METAStudio?.updateVideoLayer(layer.id,{sourceAspect},'all');};video.onerror=()=>{label.hidden=false;};
  entry.error=label;
  if(preview){
   const tag=document.createElement('span'),handle=document.createElement('button');tag.className='video-edit-label';handle.className='video-resize';handle.type='button';handle.setAttribute('aria-label','Resize video');tag.textContent='Move video';wrap.append(tag,handle);
   wrap.onpointerdown=e=>{
    if(!state.editVideos||e.button!==0)return;e.preventDefault();e.stopPropagation();
    parent.METAStudio?.selectVideoLayer(layer.id,view);
    const start={...entry.rect,pointerX:e.clientX,pointerY:e.clientY},resize=e.target===handle,pointer=e.pointerId;wrap.setPointerCapture(pointer);
    const change=event=>{
     const dx=(event.clientX-start.pointerX)/innerWidth*100,dy=(event.clientY-start.pointerY)/innerHeight*100;
     const patch=resize?{width:start.width+dx*2}:{x:start.x+dx,y:start.y+dy};
     parent.METAStudio?.updateVideoLayer(layer.id,patch,view);
    };
    wrap.onpointermove=change;const finish=()=>{wrap.onpointermove=null;wrap.onpointerup=null;wrap.onpointercancel=null;if(wrap.hasPointerCapture(pointer))wrap.releasePointerCapture(pointer);};wrap.onpointerup=finish;wrap.onpointercancel=finish;
   };
   wrap.onkeydown=e=>{if(!state.editVideos||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const step=e.shiftKey?5:1,r=entry.rect;parent.METAStudio?.updateVideoLayer(layer.id,{x:r.x+(e.key==='ArrowLeft'?-step:e.key==='ArrowRight'?step:0),y:r.y+(e.key==='ArrowUp'?-step:e.key==='ArrowDown'?step:0)},view);};
  }
  return entry;
 }
 function update(next){
  const previous=state;state=next;
  for(const [id,entry] of entries)if(!state.videoLayers.some(l=>l.id===id)){entry.video.pause();entry.video.removeAttribute('src');entry.video.load();entry.wrap.remove();entries.delete(id);}
  for(const layer of state.videoLayers){
   let entry=entries.get(layer.id);if(!entry){entry=create(layer);entries.set(layer.id,entry);}entry.layer=layer;
   const clip=layer.customClip||clips.find(c=>c.id===layer.videoId),url=clip?.url||'';
   if(url!==entry.url){entry.video.pause();entry.url=url;entry.error.hidden=true;if(url)entry.video.src=url;else{entry.video.removeAttribute('src');entry.error.hidden=false;}entry.video.load();}
   position(entry);sync(entry,previous&&(previous.paused!==state.paused||previous.speed!==state.speed||previous.offset!==state.offset));
  }
 }
 return {update,resize(){if(state)for(const entry of entries.values())position(entry);},tick(now){if(now-lastSync<500)return;lastSync=now;for(const entry of entries.values())sync(entry);},play(){for(const entry of entries.values())sync(entry,true);},get stats(){return [...entries.values()].filter(e=>!e.wrap.hidden).map(info);},get blocked(){return [...entries.values()].some(e=>!e.wrap.hidden&&e.blocked);}};
}
