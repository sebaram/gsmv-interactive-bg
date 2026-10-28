import {sanitize} from './state.js';
import {portableLook} from './video-layers.js';

const sorted=(_key,value)=>value&&typeof value==='object'&&!Array.isArray(value)?Object.fromEntries(Object.keys(value).sort().map(key=>[key,value[key]])):value;
export function draftFingerprint(raw){
 const state=portableLook(sanitize(raw)),keys=['variant','screens','brightness','branding','headlines','interactive','speed','motionAmount','cue','showVideo','videoId'];
 const value=Object.fromEntries(keys.map(key=>[key,state[key]]));
 value.authored=state.authored[state.variant]||{edits:{},objects:[]};value.appearance=state.appearance[state.variant]||{};
 value.videoLayers=state.videoLayers.map(({sourceAspect,...layer})=>layer);
 return JSON.stringify(value,sorted);
}
export function draftTracker(initial){
 const baselines=new Map();let project=null;
 function visit(state){if(!baselines.has(state.variant))baselines.set(state.variant,draftFingerprint(state));}
 function load(state,record=null){baselines.clear();visit(state);project=record?{id:record.id,name:record.name,variant:state.variant}:null;}
 load(initial);
 return {visit,load,get project(){return project;},dirty(state){return baselines.has(state.variant)&&baselines.get(state.variant)!==draftFingerprint(state);},
  saved(state,record){for(const variant of new Set([...baselines.keys(),state.variant]))baselines.set(variant,draftFingerprint({...state,variant}));if(record)project={id:record.id,name:record.name,variant:state.variant};},
  canUpdate(state,id){return !!project&&project.id===id&&project.variant===state.variant;},
  leaveProject(){project=null;},rename(record){if(project?.id===record.id)project={...project,name:record.name};},forget(id){if(project?.id===id)project=null;}
 };
}
