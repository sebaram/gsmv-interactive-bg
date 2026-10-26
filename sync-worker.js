// Share one event stream across same-origin tabs so many outputs do not consume
// the browser's per-host HTTP connection limit. Each computer owns its worker.
const ports=new Set();
let events=null,latest=null,connected=false;
function broadcast(message){for(const port of ports){try{port.postMessage(message);}catch{ports.delete(port);}}}
function start(){
 if(events)return;
 events=new EventSource('/api/events');
 events.onopen=()=>{connected=true;broadcast({kind:'status',connected:true});};
 events.onerror=()=>{connected=false;broadcast({kind:'status',connected:false});};
 events.onmessage=e=>{try{latest=JSON.parse(e.data);broadcast({kind:'state',value:latest});}catch{}};
}
globalThis.onconnect=e=>{
 const port=e.ports[0];ports.add(port);port.start();start();
 port.postMessage({kind:'status',connected});if(latest)port.postMessage({kind:'state',value:latest});
 port.onmessage=e=>{if(e.data==='close'){ports.delete(port);port.close();if(!ports.size){events?.close();events=null;latest=null;connected=false;}}};
};
