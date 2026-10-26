import {screenAspect,createScreen,removeScreen,updateScreen,sanitize} from './state.js';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function screenEditor(container,getState,commit,toast){
 let ids='',dirty=new Set();
 const field=(key,label,type='number')=>`<label>${label}<input data-field="${key}" type="${type}" ${type==='number'?'min="0.1" step="any"':''}></label>`;
 function paint(){
  const state=getState(),next=state.screens.map(sc=>sc.id).join('/');
  if(ids!==next){ids=next;container.innerHTML=state.screens.map(sc=>`<article class="screen-config" data-screen="${sc.id}"><div class="screen-config-head"><strong>${escape(sc.name)}</strong><span class="screen-aspect"></span><div><button data-action="up" title="Move screen left">←</button><button data-action="down" title="Move screen right">→</button><button data-action="remove" title="Remove screen">Remove</button></div></div><div class="screen-fields">${field('name','Screen name','text')}${field('width','Input width (px)')}${field('height','Input height (px)')}<label>Physical surface<select data-field="mode"><option value="raster">Match input ratio</option><option value="tiles">Tile arrangement</option><option value="custom">Custom ratio</option></select></label>${field('cols','Grid columns')}${field('rows','Grid rows')}${field('tileW','Each tile ratio W')}${field('tileH','Each tile ratio H')}${field('aspectW','Custom ratio W')}${field('aspectH','Custom ratio H')}</div><div class="screen-config-foot"><label class="switch-row">Show tile grid<input type="checkbox" data-field="grid"></label><button data-action="apply" class="subtle">Apply screen</button><a href="wall.html?view=${sc.id}" target="meta-${sc.id}">Open output ↗</a></div></article>`).join('');}
  for(const sc of state.screens){const row=container.querySelector(`[data-screen="${sc.id}"]`);if(dirty.has(sc.id))continue;
   row.querySelector('strong').textContent=sc.name;row.querySelector('.screen-aspect').textContent=screenAspect(sc).toFixed(3)+':1';
   for(const el of row.querySelectorAll('[data-field]')){if(el.type==='checkbox')el.checked=sc[el.dataset.field];else el.value=sc[el.dataset.field];}
   showFields(row);
   row.querySelector('[data-action="remove"]').disabled=state.screens.length===1;
  }
 }
 function showFields(row){const mode=row.querySelector('[data-field="mode"]').value;for(const key of ['tileW','tileH','aspectW','aspectH'])row.querySelector(`[data-field="${key}"]`).parentElement.hidden=key.startsWith('tile')?mode!=='tiles':mode!=='custom';}
 container.addEventListener('input',e=>{const row=e.target.closest('[data-screen]');if(row){dirty.add(row.dataset.screen);showFields(row);}});
 container.addEventListener('click',e=>{const action=e.target.dataset.action,row=e.target.closest('[data-screen]');if(!action||!row)return;const id=row.dataset.screen;let state=getState();
  if(action==='apply'){const patch={};for(const el of row.querySelectorAll('[data-field]'))patch[el.dataset.field]=el.type==='checkbox'?el.checked:el.type==='number'?+el.value:el.value;state=updateScreen(state,id,patch);dirty.delete(id);toast('Screen applied · '+state.screens.find(sc=>sc.id===id).name);}
  if(action==='remove'){state=removeScreen(state,id);dirty.delete(id);}
  if(action==='up'||action==='down'){const i=state.screens.findIndex(sc=>sc.id===id),j=i+(action==='up'?-1:1);if(j<0||j>=state.screens.length)return;const screens=[...state.screens];[screens[i],screens[j]]=[screens[j],screens[i]];state=sanitize({...state,screens});}
  commit(state);
 });
 return {paint,add(){if(getState().screens.length>=8){toast('Up to eight screens are supported in this studio');return;}dirty.clear();commit(createScreen(getState()));}};
}
