// Coordinates describe the physical display, independent of its input raster.
const number=(v,fallback,min,max)=>Number.isFinite(+v)?Math.min(max,Math.max(min,+v)):fallback;
const rect=raw=>({x:number(raw.x,70,0,100),y:number(raw.y,48,0,100),width:number(raw.width,36,5,100),enabled:raw.enabled!==false});
export function sanitizeLayers(raw=[]){
 const ids=new Set();return (Array.isArray(raw)?raw:[]).slice(0,8).map((value,i)=>{
  const layer=value&&typeof value==='object'?value:{};
  let id=String(layer.id||'video-'+(i+1)).replace(/[^a-zA-Z0-9_-]/g,'').slice(0,60)||'video-'+(i+1);while(ids.has(id))id+='-2';ids.add(id);
  const screens={};for(const [key,value] of Object.entries(layer.screens||{}).slice(0,8)){if(!value||typeof value!=='object')continue;const normalized=rect(value);screens[key]={};for(const k of ['x','y','width','enabled'])if(k in value)screens[key][k]=normalized[k];}
  const out={id,videoId:typeof layer.videoId==='string'?layer.videoId.slice(0,60):null,sourceAspect:number(layer.sourceAspect,16/9,.1,32),...rect(layer),screens};
  if(layer.customClip&&typeof layer.customClip.url==='string')out.customClip={url:layer.customClip.url,name:String(layer.customClip.name||'Local video').slice(0,160)};
  return out;
 });
}
export function addLayer(state,clip,customClip){
 if(state.videoLayers.length>=8)return state;
 let n=1;while(state.videoLayers.some(l=>l.id==='video-'+n))n++;
 const layer={id:'video-'+n,videoId:clip.id,x:70,y:48,width:36,enabled:true,screens:{}};
 if(customClip)layer.customClip=customClip;
 return {...state,videoLayers:[...state.videoLayers,layer],activeVideoLayer:layer.id,showVideo:true,editVideos:true};
}
export function patchLayer(state,id,patch,screen='all'){
 return {...state,videoLayers:state.videoLayers.map(layer=>{
  if(layer.id!==id)return layer;
  if(screen!=='all')return {...layer,screens:{...layer.screens,[screen]:{...layer.screens[screen],...patch}}};
  const screens=Object.fromEntries(Object.entries(layer.screens).map(([key,value])=>{const next={...value};for(const k of Object.keys(patch))delete next[k];return [key,next];}));
  return {...layer,...patch,screens};
 })};
}
export function removeLayer(state,id){const videoLayers=state.videoLayers.filter(l=>l.id!==id);return {...state,videoLayers,activeVideoLayer:videoLayers.at(-1)?.id||null,showVideo:videoLayers.length>0&&state.showVideo};}
export function placement(layer,screenId,physicalAspect,sourceAspect=layer.sourceAspect||16/9){
 const r={...layer,...layer.screens?.[screenId]},width=Math.min(r.width,100*sourceAspect/physicalAspect),height=width*physicalAspect/sourceAspect;
 return {...r,width,height,x:Math.min(100-width/2,Math.max(width/2,r.x)),y:Math.min(100-height/2,Math.max(height/2,r.y))};
}
export function portableLook(state){return {...state,customClip:undefined,editVideos:false,videoLayers:state.videoLayers.map(({customClip,...layer})=>customClip&&!customClip.url.startsWith('blob:')?{...layer,customClip}:layer)};}
