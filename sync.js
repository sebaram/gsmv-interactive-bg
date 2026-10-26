import {sanitize,currentTime,setClockOffset,timeline} from './state.js';
export const staticMode=typeof location!=='undefined'&&(location.hostname.endsWith('.github.io')||document.documentElement.dataset.hosting==='static'||new URLSearchParams(location.search).has('offline'));

// SSE carries settings; clock offset is estimated with a round trip to the server.
// Each renderer uses the same absolute timeline. This is software sync, not genlock.
export function connectSync(onState,{controller=false,initial=null,onStatus=()=>{},onInfo=()=>{}}={}){
 if(staticMode){queueMicrotask(()=>{onStatus(true);onInfo({mode:'browser',front:new URL('wall.html?view=front',location.href).href,left:new URL('wall.html?view=left',location.href).href});});return {send(){},close(){}};}
 let pending=null,sending=false,ready=false,events,stopped=false,wasDisconnected=false,latest=initial;
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
  if(stopped)return;events=new EventSource('/api/events');
  events.onmessage=e=>{try{const data=JSON.parse(e.data);if(data.state){latest=sanitize(data.state);onState(latest);}onStatus(true);}catch{}};
  events.onopen=()=>{onStatus(true);if(wasDisconnected){snapshot().catch(()=>onStatus(false));wasDisconnected=false;}};
  events.onerror=()=>{onStatus(false);wasDisconnected=true;};
 }
 snapshot().then(stream).catch(()=>{onStatus(false);wasDisconnected=true;stream();});
 const timer=setInterval(()=>snapshot().catch(()=>{onStatus(false);wasDisconnected=true;}),30000);
 return {send,close(){stopped=true;clearInterval(timer);events?.close();}};
}
