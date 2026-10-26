export const objectTypes=[['logo','MV sculpture'],['ribbons','Real / virtual ribbons'],['orbits','Orbital sculpture'],['network','Research network'],['sphere','Sculptural sphere'],['arch','Architectural arch']];
const limit=(v,min,max)=>Math.min(max,Math.max(min,+v));
export function cleanTransform(raw={}){
 const out={};for(const [key,min,max] of [['x',-50,150],['y',-50,150],['size',.05,6],['rotation',-180,180]])if(raw[key]!==undefined&&Number.isFinite(+raw[key]))out[key]=limit(raw[key],min,max);
 if(typeof raw.screen==='string')out.screen=raw.screen.replace(/[^a-zA-Z0-9_-]/g,'').slice(0,50);
 if('visible' in raw)out.visible=raw.visible!==false;return out;
}
export function sanitizeAuthored(raw={}){
 const out={};for(let i=0;i<6;i++){
  const preset=raw?.[i];if(!preset||typeof preset!=='object')continue;
  const edits={};for(const [id,patch] of Object.entries(preset.edits||{}).slice(0,160))if(/^[a-zA-Z0-9_-]{1,100}$/.test(id)&&patch&&typeof patch==='object')edits[id]=cleanTransform(patch);
  const ids=new Set(),objects=(Array.isArray(preset.objects)?preset.objects:[]).slice(0,32).filter(o=>o&&typeof o==='object'&&[...objectTypes.map(t=>t[0]),'copy'].includes(o.type)).map((o,i)=>{let id=String(o.id||'object-'+(i+1)).replace(/[^a-zA-Z0-9_-]/g,'').slice(0,80);while(ids.has(id))id+='-2';ids.add(id);return {id,type:o.type,source:typeof o.source==='string'?o.source.slice(0,100):null,archived:Boolean(o.archived),...cleanTransform(o)};});
  out[i]={edits,objects};
 }return out;
}
export function presetEdits(state){return state.authored[state.variant]||{edits:{},objects:[]};}
export function patchElement(state,id,patch){const preset=presetEdits(state),custom=preset.objects.some(o=>o.id===id);return {...state,authored:{...state.authored,[state.variant]:custom?{...preset,objects:preset.objects.map(o=>o.id===id?{...o,...cleanTransform(patch)}:o)}:{...preset,edits:{...preset.edits,[id]:{...preset.edits[id],...cleanTransform(patch)}}}}};}
export function addElement(state,type,transform={},source=null){const preset=presetEdits(state);if(preset.objects.length>=32)return state;let n=1;while(preset.objects.some(o=>o.id==='object-'+n))n++;const id='object-'+n;return {...state,authored:{...state.authored,[state.variant]:{...preset,objects:[...preset.objects,{id,type,source,screen:state.screens[0].id,x:50,y:50,size:1,rotation:0,visible:true,...cleanTransform(transform)}]}},activeElement:id,editElements:true,editVideos:false};}
export function removeElement(state,id){
 const preset=presetEdits(state);if(!preset.objects.some(o=>o.id===id))return patchElement(state,id,{visible:false});
 let objects=preset.objects.some(o=>o.source===id)?preset.objects.map(o=>o.id===id?{...o,archived:true,visible:false}:o):preset.objects.filter(o=>o.id!==id);
 let changed=true;while(changed){const previous=objects.length;objects=objects.filter(o=>!o.archived||objects.some(child=>child.source===o.id));changed=objects.length!==previous;}
 return {...state,activeElement:null,authored:{...state.authored,[state.variant]:{...preset,objects}}};
}
export function resetElement(state,id){const preset=presetEdits(state),edits={...preset.edits};delete edits[id];return {...state,authored:{...state.authored,[state.variant]:{...preset,edits}}};}
