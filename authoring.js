export const objectTypes=[['logo','MV sculpture'],['ribbons','Real / virtual ribbons'],['orbits','Orbital sculpture'],['network','Research network'],['sphere','Sculptural sphere'],['arch','Architectural arch']];
const limit=(v,min,max)=>Math.min(max,Math.max(min,+v));
export function cleanTransform(raw={}){
 const out={};for(const [key,min,max] of [['x',-50,150],['y',-50,150],['size',.05,6],['rotation',-180,180],['seed',0,999999],['randomness',0,2]])if(raw[key]!==undefined&&Number.isFinite(+raw[key]))out[key]=key==='seed'?Math.floor(limit(raw[key],min,max)):limit(raw[key],min,max);
 if(typeof raw.screen==='string')out.screen=raw.screen.replace(/[^a-zA-Z0-9_-]/g,'').slice(0,50);
 if('visible' in raw)out.visible=raw.visible!==false;if('deleted' in raw)out.deleted=Boolean(raw.deleted);return out;
}
export function sanitizeAuthored(raw={}){
 const out={};for(let i=0;i<6;i++){
  const preset=raw?.[i];if(!preset||typeof preset!=='object')continue;
  const edits={};for(const [id,patch] of Object.entries(preset.edits||{}).slice(0,4096))if(/^[a-zA-Z0-9_-]{1,160}$/.test(id)&&patch&&typeof patch==='object')edits[id]=cleanTransform(patch);
  const ids=new Set(),objects=(Array.isArray(preset.objects)?preset.objects:[]).slice(0,32).filter(o=>o&&typeof o==='object'&&[...objectTypes.map(t=>t[0]),'copy'].includes(o.type)).map((o,i)=>{let id=String(o.id||'object-'+(i+1)).replace(/[^a-zA-Z0-9_-]/g,'').slice(0,80);while(ids.has(id))id+='-2';ids.add(id);return {id,type:o.type,source:typeof o.source==='string'?o.source.slice(0,160):null,archived:Boolean(o.archived),...cleanTransform(o)};});
  out[i]={edits,objects};
 }return out;
}
export function presetEdits(state){return state.authored[state.variant]||{edits:{},objects:[]};}
export function inElementSubtree(id,root){return typeof id==='string'&&(id===root||id.startsWith(root+(root.includes('-part-')?'-':'-part-')));}
export function isElementDeleted(state,id){const preset=presetEdits(state);return Object.entries(preset.edits).some(([root,patch])=>patch.deleted&&inElementSubtree(id,root))||preset.objects.some(o=>(o.archived||o.deleted)&&inElementSubtree(id,o.id));}
export function isLogoElement(state,id){if(!id||id.includes('-part-'))return false;const seen=new Set(),objects=presetEdits(state).objects;while(id&&!seen.has(id)){if(id.startsWith('preset-logo-'))return true;seen.add(id);const object=objects.find(o=>o.id===id);if(object?.type==='logo')return true;id=object?.type==='copy'?object.source:null;}return false;}
export function nextLogoSeed(state){const values=Object.values(state.authored).flatMap(p=>[...p.objects,...Object.values(p.edits)]);const used=new Set(values.map(o=>o.seed||0));let seed=((Math.max(0,...used)+1)%1000000)||1;while(used.has(seed))seed=seed%999999+1;return seed;}
export function randomizeElement(state,id){const preset=presetEdits(state),settings=preset.objects.find(o=>o.id===id)||preset.edits[id]||{};return patchElement(state,id,{seed:nextLogoSeed(state),randomness:settings.randomness>0?settings.randomness:1});}
export function patchElement(state,id,patch){const preset=presetEdits(state),custom=preset.objects.some(o=>o.id===id);return {...state,authored:{...state.authored,[state.variant]:custom?{...preset,objects:preset.objects.map(o=>o.id===id?{...o,...cleanTransform(patch)}:o)}:{...preset,edits:{...preset.edits,[id]:{...preset.edits[id],...cleanTransform(patch)}}}}};}
export function addElement(state,type,transform={},source=null){
 const preset=presetEdits(state);if(preset.objects.length>=32)return state;let n=1;while(preset.objects.some(o=>o.id==='object-'+n))n++;const id='object-'+n,edits=Object.fromEntries(Object.entries(preset.edits).filter(([part])=>!inElementSubtree(part,id)));
 // Descendant edits are copied once so each duplicate can be authored independently.
 if(type==='copy'&&source){const prefix=source+(source.includes('-part-')?'-':'-part-');for(const [part,patch] of Object.entries(preset.edits))if(part.startsWith(prefix))edits[id+'-part-'+part.slice(prefix.length)]={...patch};}
 const variation=type==='logo'||type==='copy'&&isLogoElement(state,source)?{seed:nextLogoSeed(state),randomness:1}:{};
 return {...state,authored:{...state.authored,[state.variant]:{...preset,edits,objects:[...preset.objects,{id,type,source,screen:state.screens[0].id,x:50,y:50,size:1,rotation:0,visible:true,...variation,...cleanTransform(transform)}]}},activeElement:id,editElements:true,editVideos:false};
}
export function removeElement(state,id){
 if(isElementDeleted(state,id))return state;
 if(/^object-\d+(?:$|-part-)/.test(id)&&!presetEdits(state).objects.some(o=>inElementSubtree(id,o.id)))return state;
 const preset=presetEdits(state),activeElement=inElementSubtree(state.activeElement,id)?null:state.activeElement;if(!preset.objects.some(o=>o.id===id))return {...patchElement(state,id,{visible:false,deleted:true}),activeElement};
 const dependsOn=(object,root)=>object.source===root||object.source?.startsWith(root+'-part-');
 let objects=preset.objects.some(o=>dependsOn(o,id))?preset.objects.map(o=>o.id===id?{...o,archived:true,visible:false}:o):preset.objects.filter(o=>o.id!==id);
 let changed=true;while(changed){const previous=objects.length;objects=objects.filter(o=>!o.archived||objects.some(child=>dependsOn(child,o.id)));changed=objects.length!==previous;}
 const removed=preset.objects.filter(o=>!objects.some(remaining=>remaining.id===o.id)),edits=Object.fromEntries(Object.entries(preset.edits).filter(([part])=>!removed.some(o=>part===o.id||part.startsWith(o.id+'-part-'))));
 return {...state,activeElement,authored:{...state.authored,[state.variant]:{...preset,edits,objects}}};
}
export function resetElement(state,id){const preset=presetEdits(state),edits={...preset.edits};delete edits[id];return {...state,authored:{...state.authored,[state.variant]:{...preset,edits}}};}
