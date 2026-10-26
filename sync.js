import {sanitize,currentTime,setClockOffset,timeline} from './state.js';
export const staticMode=typeof location!=='undefined'&&(location.hostname.endsWith('.github.io')||document.documentElement.dataset.hosting==='static'||new URLSearchParams(location.search).has('offline'));

// SSE carries settings; clock offset is estimated with a round trip to the server.
// Each renderer uses the same absolute timeline. This is software sync, not genlock.
export function connectSync(onState,{controller=false,initial=null,onStatus=()=>{},onInfo=()=>{}}={}){
 if(staticMode){queueMicrotask(()=>{onStatus(true);onInfo({mode:'browser',front:new URL('wall.html?view=front',location.href).href,left:new URL('wall.html?view=left',location.href).href});});return {send(){},close(){}};}
 let pending=null,sending=false,ready=false,events,worker,stopped=false,wasDisconnected=false,latest=initial;
 async function send(state){
  latest=state;pending=state;if(sending||!ready)return;sending=true;
  try{while(pending){const next=pending;pending=null;const response=await fetch('/api/state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(next)});if(!response.ok)throw Error('sync write failed');}}
  catch{onStatus(false);wasDisconnected=true;}
  finally{sending=false;}
 }
 async function snapshot(){
  const start=Date.now(),r=await fetch('/api/state',{cache:'no-store'});if(!r.ok)throw Error('sync server unavailable');const data=await r.json(),end=Date.now();
  const initialPhase=latest?timeline(latest):0;
  setClockOffset(data.serverTime-(start+end)/2);ready=true;
  if(data.state){latest=sanitize(data.state);onState(latest);}
  else if(controller&&latest)await send({...latest,epoch:currentTime(),offset:initialPhase});
  if(data.urls)onInfo(data.urls);
  onStatus(true);return data;
 }
 function stream(){
  if(stopped)return;
  if(typeof SharedWorker!=='undefined'){
   worker=new SharedWorker(new URL('./sync-worker.js',import.meta.url),{type:'module',name:'gsmv-wall-sync'});
   worker.port.onmessage=e=>{const message=e.data;if(message.kind==='state'){const data=message.value;if(data.state){latest=sanitize(data.state);onState(latest);}onStatus(true);}else if(message.kind==='status'){onStatus(message.connected);if(message.connected&&wasDisconnected){snapshot().catch(()=>onStatus(false));wasDisconnected=false;}if(!message.connected)wasDisconnected=true;}};
   worker.port.start();return;
  }
  events=new EventSource('/api/events');
  events.onmessage=e=>{try{const data=JSON.parse(e.data);if(data.state){latest=sanitize(data.state);onState(latest);}onStatus(true);}catch{}};
  events.onopen=()=>{onStatus(true);if(wasDisconnected){snapshot().catch(()=>onStatus(false));wasDisconnected=false;}};
  events.onerror=()=>{onStatus(false);wasDisconnected=true;};
 }
 snapshot().then(stream).catch(()=>{onStatus(false);wasDisconnected=true;stream();});
 const timer=setInterval(()=>snapshot().catch(()=>{onStatus(false);wasDisconnected=true;}),30000);
 const close=()=>{stopped=true;clearInterval(timer);events?.close();if(worker){worker.port.postMessage('close');worker.port.close();}};
 addEventListener('pagehide',close,{once:true});return {send,close};
}
