import {appearanceFor,patchAppearance,hexColor} from './appearance.js';

export function appearanceControls(container,{getState,commit}){
 const colorField=(key,title)=>`<div class="appearance-color"><label for="appearance-${key}">${title}</label><div><input id="appearance-${key}" type="color"><input id="appearance-${key}-hex" type="text" maxlength="7" pattern="#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})" spellcheck="false" autocomplete="off" aria-label="${title} hex color" placeholder="#17212f"></div></div>`;
 const range=(key,title,max)=>`<div class="appearance-range"><label for="appearance-${key}">${title}<output id="appearance-${key}-value"></output></label><input id="appearance-${key}" type="range" min="0" max="${max}" step="0.05"></div>`;
 container.innerHTML=`<details class="appearance-panel" open><summary>Scene appearance</summary><p class="note">Saved separately for each background preset.</p><label class="appearance-mode" for="appearance-mode">Background style<select id="appearance-mode"><option value="preset">Preset atmosphere</option><option value="gradient">Custom gradient</option><option value="solid">Solid color</option></select></label><div class="appearance-colors">${colorField('backgroundColor','Base color')}${colorField('glowColor','Glow color')}</div>${range('glow','Background glow',2)}${range('lighting','3D lighting',2)}${range('floor','Floor opacity',1)}<button type="button" class="subtle" id="reset-appearance">Reset preset appearance</button></details>`;
 const $=s=>container.querySelector(s);
 function change(patch){commit(patchAppearance(getState(),patch));}
 $('#appearance-mode').onchange=e=>change({mode:e.target.value});
 for(const key of ['backgroundColor','glowColor']){
  const apply=value=>{const color=hexColor(value);if(color){const mode=appearanceFor(getState()).mode;change({[key]:color,mode:mode==='preset'?'gradient':mode});}};
  $('#appearance-'+key).oninput=e=>apply(e.target.value);$('#appearance-'+key+'-hex').oninput=e=>apply(e.target.value);
  $('#appearance-'+key+'-hex').onblur=e=>{if(!hexColor(e.target.value))e.target.value=appearanceFor(getState())[key];};
 }
 for(const key of ['glow','lighting','floor'])$('#appearance-'+key).oninput=e=>change({[key]:+e.target.value});
 $('#reset-appearance').onclick=()=>{const state=getState(),appearance={...state.appearance};delete appearance[state.variant];commit({...state,appearance});};
 function paint(){const a=appearanceFor(getState());$('#appearance-mode').value=a.mode;
  for(const key of ['backgroundColor','glowColor'])for(const suffix of ['','-hex']){const input=$('#appearance-'+key+suffix);if(document.activeElement!==input)input.value=a[key];input.disabled=key==='glowColor'&&a.mode==='solid';}
  for(const key of ['glow','lighting','floor']){$('#appearance-'+key).value=a[key];$('#appearance-'+key+'-value').textContent=Math.round(a[key]*100)+'%';}
  $('#appearance-glow').disabled=a.mode==='solid';$('#reset-appearance').disabled=!Object.hasOwn(getState().appearance||{},getState().variant);
 }
 paint();return {paint};
}
