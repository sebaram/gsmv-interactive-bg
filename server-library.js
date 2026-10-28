import {portableLook} from './video-layers.js';
import {currentTime,timeline,variants} from './state.js';
import {captureLookThumbnail} from './look-thumbnail.js';

const size=bytes=>bytes>=1024**3?(bytes/1024**3).toFixed(1)+' GB':(bytes/1024**2).toFixed(1)+' MB';

export async function serverLibrary(options){
 const {getState,loadLook,addVideo,notify,getLoadedProject=()=>null,canUpdate=()=>true,onSaved=()=>{},onRenamed=()=>{},onDeleted=()=>{}}=options;
 if(document.documentElement.dataset.library!=='server')return;
 const panel=document.createElement('section');panel.className='server-library';panel.setAttribute('aria-label','Saved looks');panel.setAttribute('aria-busy','true');
 panel.innerHTML='<h4>Saved looks</h4><p class="note" role="status">Loading saved editor looks…</p>';document.querySelector('.backgrounds').append(panel);
 let session;
 try{const response=await fetch('/api/session',{cache:'no-store'});if(!response.ok)throw Error();session=await response.json();if(typeof session.authenticated!=='boolean')throw Error();}
 catch{panel.setAttribute('aria-busy','false');panel.innerHTML='<h4>Saved looks</h4><p class="note" role="status">Could not load saved looks. Check the connection and try again.</p><button type="button" class="subtle">Retry loading</button>';panel.querySelector('button').onclick=()=>{panel.remove();serverLibrary(options);};return;}
 panel.innerHTML=`<h4>Saved looks</h4><p class="note">Named compositions saved from the web editor. Load one to continue editing it.</p><p class="note" id="server-project-count" role="status">Loading saved looks…</p><div id="saved-look-cards" class="saved-look-grid" aria-label="Saved editor looks"></div><details id="earlier-saved-looks" hidden><summary>Earlier saved looks</summary><p class="note">Previous starter variations. Load one and save it from the editor to capture your own composition.</p><div id="earlier-look-cards" class="saved-look-grid"></div></details><p class="note" id="server-auth-status"></p><form id="server-login"><label for="admin-password">Admin password<input id="admin-password" type="password" autocomplete="current-password" required maxlength="256"></label><button type="submit">Sign in</button></form><button id="server-logout" type="button" class="subtle" hidden>Sign out</button><label for="server-project">Saved looks<select id="server-project"><option value="">Choose a saved look</option></select></label><button id="server-load" type="button" class="subtle">Load selected look</button><div id="server-project-admin" hidden><label for="server-project-name">Look name<input id="server-project-name" type="text" maxlength="160" placeholder="Interview setup"></label><div class="server-actions"><button id="server-save" type="button">Save new look</button><button id="server-update" type="button" class="subtle">Update loaded look</button><p class="note" id="server-update-hint"></p><button id="server-rename" type="button" class="subtle">Rename selected</button><button id="server-delete" type="button" class="subtle">Delete selected</button></div></div><button id="server-refresh" type="button" class="subtle">Refresh library</button><p class="note" id="server-library-status" role="status"></p>`;
 const videos=document.createElement('section');videos.className='server-videos';videos.setAttribute('aria-label','Server videos');
 videos.innerHTML=`<h3>Server videos</h3><p class="note">Uploaded videos are available to anyone with their link and can play on other computers.</p><div id="server-upload-controls" hidden><label for="server-video-file">Upload MP4, MOV or WebM<input id="server-video-file" type="file" accept=".mp4,.mov,.webm,video/mp4,video/quicktime,video/webm"></label><p class="note" id="server-upload-limit"></p><progress id="server-upload-progress" max="100" value="0" hidden></progress></div><p class="note" id="server-media-status" role="status"></p><div id="server-media-items"></div>`;
 document.querySelector('.video-section').append(videos);
 const $=selector=>panel.querySelector(selector)||videos.querySelector(selector);
 let projects=[],media=[],busy=false,uploading=false;
 function authPaint(){
  $('#server-auth-status').textContent=session.authenticated?'Signed in as admin. Save looks and upload videos.':'Sign in to save looks or upload videos. Loading and playback are public.';
  $('#server-login').hidden=session.authenticated;$('#server-logout').hidden=!session.authenticated;
  $('#server-project-admin').hidden=!session.authenticated;$('#server-upload-controls').hidden=!session.authenticated;
  $('#server-upload-limit').textContent='Up to '+size(session.maxUpload)+' per video. '+size(session.quota)+' total storage.';
 }
 async function request(path,{method='GET',body}={}){
  const response=await fetch(path,{method,cache:'no-store',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});
  const data=await response.json();
  if(!response.ok){if(response.status===401){session.authenticated=false;authPaint();}throw Error(data.error||'Server request failed');}return data;
 }
 function selected(){return $('#server-project').value;}
 function controls(){
  for(const id of ['server-load','server-update','server-rename','server-delete'])$('#'+id).disabled=busy||!selected();
  $('#server-update').disabled=busy||!selected()||!canUpdate(selected());$('#server-update-hint').textContent=selected()&&!canUpdate(selected())?'Load this saved look before updating it, or use Save new look.':'Update changes only the look loaded into this editor.';for(const button of panel.querySelectorAll('[data-saved-look]'))button.disabled=busy;$('#server-save').disabled=busy;$('#server-refresh').disabled=busy;$('#server-project').disabled=busy;
 }
 function mediaPaint(){
  $('#server-media-items').replaceChildren();
  for(const item of media){
   const row=document.createElement('article'),info=document.createElement('span'),name=document.createElement('strong'),meta=document.createElement('small'),add=document.createElement('button');
   row.className='server-media-row';name.textContent=item.name;meta.textContent=size(item.size);info.append(name,meta);add.type='button';add.className='subtle';add.textContent='Add to scene';add.dataset.serverVideo=item.id;
   add.onclick=()=>{if(getState().videoLayers.length>=8){notify('Up to 8 videos. Remove an entry before adding another.');return;}addVideo(item);notify('Server video added');};row.append(info,add);
   if(session.authenticated){const remove=document.createElement('button');remove.type='button';remove.className='subtle';remove.textContent='Delete';remove.setAttribute('aria-label','Delete server video '+item.name);remove.disabled=busy||uploading;
    remove.onclick=()=>run(async()=>{if(!confirm('Delete “'+item.name+'” from the server? This also removes its public video link.'))return;await request('/api/media/'+item.id,{method:'DELETE'});await refresh();notify('Server video deleted');});row.append(remove);}
   $('#server-media-items').append(row);
  }
 }
 function projectPaint(){
  const editor=projects.filter(p=>p.origin==='editor'),earlier=projects.filter(p=>p.origin!=='editor');
  $('#server-project-count').textContent=editor.length+' saved looks'+(editor.length?' from the editor.':' yet. Sign in and save your current composition.');
  $('#earlier-saved-looks').hidden=!earlier.length;$('#earlier-saved-looks summary').textContent='Earlier saved looks ('+earlier.length+')';
  for(const [target,items] of [['#saved-look-cards',editor],['#earlier-look-cards',earlier]]){
   $(target).replaceChildren();
   for(const project of items){const button=document.createElement('button'),image=document.createElement('img'),copy=document.createElement('span'),name=document.createElement('strong'),detail=document.createElement('small');button.type='button';button.className='saved-look-card subtle';button.dataset.savedLook=project.id;button.setAttribute('aria-label','Load '+project.name);button.setAttribute('aria-pressed',String(getLoadedProject()?.id===project.id));image.src=project.thumbnail?.startsWith('data:image/jpeg;base64,')?project.thumbnail:'previews/style-'+(project.variant||0)+'.jpg';image.alt='Preview of '+project.name;image.width=480;image.height=270;image.loading='lazy';name.textContent=project.name;detail.textContent=getLoadedProject()?.id===project.id?'Loaded in editor':variants[project.variant]?.name||'Saved composition';copy.append(name,detail);button.append(image,copy);button.onclick=()=>{$('#server-project').value=project.id;$('#server-project').onchange();$('#server-load').click();};$(target).append(button);}
  }
 }
 async function refresh(){
  const old=selected(),[saved,files]=await Promise.all([request('/api/projects'),request('/api/media')]);projects=saved.projects;media=files.media;
  const select=$('#server-project');select.replaceChildren(new Option('Choose a saved look',''));
  for(const [title,items] of [['Saved from editor',projects.filter(p=>p.origin==='editor')],['Earlier saved looks',projects.filter(p=>p.origin!=='editor')]]){if(!items.length)continue;const group=document.createElement('optgroup');group.label=title;for(const project of items)group.append(new Option(project.name,project.id));select.append(group);}
  if(projects.some(p=>p.id===old))select.value=old;
  $('#server-media-status').textContent=media.length+' video'+(media.length===1?'':'s')+' · '+size(files.used)+' of '+size(files.quota)+' used';mediaPaint();projectPaint();controls();
 }
 async function run(action){if(busy)return;busy=true;panel.setAttribute('aria-busy','true');controls();$('#server-library-status').textContent='Working…';try{await action();$('#server-library-status').textContent='';}catch(error){$('#server-library-status').textContent=error.message;notify(error.message);}finally{busy=false;panel.setAttribute('aria-busy','false');controls();mediaPaint();}}
 $('#server-login').onsubmit=e=>{e.preventDefault();run(async()=>{try{session={...session,...await request('/api/login',{method:'POST',body:{password:$('#admin-password').value}})};}finally{$('#admin-password').value='';}authPaint();await refresh();notify('Signed in as admin');});};
 $('#server-logout').onclick=()=>run(async()=>{await request('/api/logout',{method:'POST',body:{}});session.authenticated=false;authPaint();await refresh();});
 $('#server-project').onchange=()=>{const project=projects.find(p=>p.id===selected());if(project)$('#server-project-name').value=project.name;controls();};
 $('#server-load').onclick=()=>run(async()=>{const project=await request('/api/projects/'+selected());if(loadLook(project.look,{project,label:'Loading '+project.name})===false)return;projectPaint();$('#server-project-name').value=project.name;notify('Loaded '+project.name);});
 async function save(update){
  if(update&&!canUpdate(selected())){alert('Load this saved look before updating it. Use Save new look to save the current composition separately.');return;}
  if(!update&&projects.some(p=>p.name===$('#server-project-name').value.trim())&&!confirm('A saved look already has this name. Save another copy?'))return;
  const snapshot=structuredClone(getState()),look={...portableLook(snapshot),offset:timeline(snapshot),epoch:currentTime()},local=look.videoLayers.some(l=>l.fileName&&!l.customClip&&!l.youtube);
  if(local&&!confirm('Some videos are only on this computer. The saved look will need those files chosen again. Upload them under Server videos for playback on other computers. Save anyway?'))return;
  const thumbnail=await captureLookThumbnail(snapshot);const project=await request('/api/projects'+(update?'/'+selected():''),{method:update?'PUT':'POST',body:{name:$('#server-project-name').value,look,origin:'editor',...(thumbnail?{thumbnail}:{})}});onSaved(snapshot,project);
  await refresh();$('#server-project').value=project.id;controls();notify('Saved '+project.name+' to server');
 }
 $('#server-save').onclick=()=>run(()=>save(false));$('#server-update').onclick=()=>run(async()=>{if(confirm('Replace the selected saved look with the current scene?'))await save(true);});
 $('#server-rename').onclick=()=>run(async()=>{const project=await request('/api/projects/'+selected());await request('/api/projects/'+project.id,{method:'PUT',body:{name:$('#server-project-name').value,look:project.look}});onRenamed({id:project.id,name:$('#server-project-name').value});await refresh();notify('Look renamed');});
 $('#server-delete').onclick=()=>run(async()=>{if(!confirm('Delete the selected saved look from the server?'))return;const id=selected();await request('/api/projects/'+id,{method:'DELETE'});onDeleted(id);await refresh();notify('Saved look deleted');});
 $('#server-refresh').onclick=()=>run(refresh);
 $('#server-video-file').onchange=async event=>{
  const file=event.target.files[0];if(!file||uploading)return;
  if(file.size>session.maxUpload){notify('This video exceeds the '+size(session.maxUpload)+' upload limit.');event.target.value='';return;}
  uploading=true;event.target.disabled=true;$('#server-upload-progress').hidden=false;$('#server-upload-progress').value=0;mediaPaint();$('#server-media-status').textContent='Uploading '+file.name+'…';
  try{
   await new Promise((resolve,reject)=>{const xhr=new XMLHttpRequest();xhr.open('POST','/api/media');xhr.setRequestHeader('Content-Type',file.type||'application/octet-stream');xhr.setRequestHeader('X-File-Name',encodeURIComponent(file.name));
    xhr.upload.onprogress=e=>{if(e.lengthComputable)$('#server-upload-progress').value=e.loaded/e.total*100;};
    xhr.onload=()=>{let data;try{data=JSON.parse(xhr.responseText);}catch{reject(Error('The server could not finish this upload.'));return;}
     if(xhr.status>=200&&xhr.status<300)resolve(data);else{if(xhr.status===401){session.authenticated=false;authPaint();}reject(Error(data.error||'Upload failed'));}};
    xhr.onerror=()=>reject(Error('Upload interrupted. Check your connection and try again.'));xhr.send(file);
   });await refresh();notify('Video uploaded. Choose Add to scene to use it.');
  }catch(error){$('#server-media-status').textContent=error.message;notify(error.message);}
  finally{uploading=false;event.target.disabled=false;event.target.value='';$('#server-upload-progress').hidden=true;mediaPaint();}
 };
 document.addEventListener('meta-look-state',()=>{controls();for(const button of panel.querySelectorAll('[data-saved-look]')){const loaded=getLoadedProject()?.id===button.dataset.savedLook;button.setAttribute('aria-pressed',String(loaded));const project=projects.find(p=>p.id===button.dataset.savedLook);button.querySelector('small').textContent=loaded?'Loaded in editor':variants[project?.variant]?.name||'Saved composition';}});
 authPaint();await run(refresh);
}
