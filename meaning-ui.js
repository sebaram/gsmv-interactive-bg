import {kineticPresets} from './preset-catalog.js';
const identity=['KAIST logo and vision','https://meta.kaist.ac.kr/logo'];
const labs=['KAIST research areas','https://meta.kaist.ac.kr/labs/'];
const objects=['Meta-Objects and shared XR','https://uvrlab.org/research'];
export const sceneMeanings=[
 {title:'Co-presence',idea:'Being in different places need not mean being alone.',motion:'Two thick red and blue ribbons turn, approach and interweave around a shared core. Travelling contributions circulate in depth; the ribbons keep their own identities.',types:['presence'],sources:[labs,objects]},
 {title:'Co-creation',idea:'Different contributions can build something neither makes alone.',motion:'Complementary bays hinge and assemble into a shared pavilion. Contribution panels keep orbiting while the whole structure turns in depth, then unfolds.',types:['cocreation'],sources:[identity,objects]},
 {title:'Shared coordinates',idea:'A shared experience begins by finding a common spatial frame.',motion:'Red solid and blue virtual portals rotate out of alignment and register together. Moving scan arcs and orbiting markers reveal depth while a courier crosses the shared opening.',types:['registration'],sources:[labs,objects]},
 {title:'Mutual response',idea:'An experience becomes interactive when an action receives a response.',motion:'Folded surfaces ripple continuously in 3D. Signals travel along a curved exchange path, produce a deformation in the other surface, and return with a reply.',types:['feedback'],sources:[objects,labs]},
 {title:'A place to meet',idea:'Shared reality requires both compatible spaces and social presence.',motion:'Kinetic portals align on the front wall while distinct ribbons interweave around a shared core on the companion wall. Both graphics keep moving through the shared phase.',types:['registration','presence'],sources:[objects,labs]},
 {title:'MV Symbiosis',idea:'People and technology develop together while keeping their identities.',motion:'The official six-facet mark separates into soft forms, exchanges positions, reassembles as MV, and opens into another cycle.',types:[],sources:[identity]},
 {title:'A commons made together',idea:'Space is a shared outcome, shaped by the people who use it.',motion:'Hinged bays unfold and reassemble inside the atelier. Orbiting contribution panels and changing depth keep the shared structure alive throughout its cycle.',types:['cocreation'],sources:[labs,identity]},
 {title:'A responsive counterpart',idea:'A virtual counterpart should respond to a physical action, and influence it in return.',motion:'Rippling red and blue forms exchange couriers along a spatial loop inside the light court. A deformation receives a visible reply: an abstract metaphor for bidirectional interaction.',types:['feedback'],sources:[objects,identity]}
];
sceneMeanings.push(...kineticPresets.map(p=>sceneMeanings[p.meaning]));

export function researchMeaningActive(state){
 if(state.variant===5||state.variant>=8)return true;const meaning=sceneMeanings[state.variant],objects=state.authored?.[state.variant]?.objects||[],byId=new Map(objects.map(o=>[o.id,o]));
 function carriesMeaning(object,seen=new Set()){if(!object||seen.has(object.id))return false;seen.add(object.id);if(meaning?.types.includes(object.type))return true;return object.type==='copy'&&carriesMeaning(byId.get(object.source),seen);}
 return objects.some(o=>!o.archived&&o.visible!==false&&carriesMeaning(o));
}

export function meaningPanel({getState,loadLook,notify}){
 const panel=document.createElement('details');panel.className='setup scene-meaning';panel.id='scene-meaning';
 panel.innerHTML='<summary>Meaning and research</summary><p class="note" id="meaning-mode"></p><h3 id="meaning-title"></h3><p id="meaning-idea"></p><p class="note" id="meaning-motion"></p><p class="note">These scenes interpret research themes. The identity connects blue with creativity and technology, red with human warmth and inclusion; physical/virtual is our editorial metaphor.</p><p class="note" id="meaning-sources"></p><p class="note"><a href="docs/scene-meanings.md" target="_blank" rel="noopener noreferrer">Read the concept and source notes</a></p><div class="meaning-actions"><label for="meaning-variation">Research variation<select id="meaning-variation"><option value="0">A</option><option value="1">B</option></select></label><button type="button" class="subtle" id="load-research-look">Load research version</button></div><p class="note meaning-load-note">Loads the complete two-wall look with video off.</p><p class="note"><a href="previews/meaning-motion.mp4" target="_blank" rel="noopener noreferrer">Watch the 3D motion comparison</a></p><p class="note" id="meaning-result" role="status"></p>';
 document.querySelector('.scene-info').after(panel);
 const $=selector=>panel.querySelector(selector);let shown=-1;
 function paint(){const state=getState(),meaning=sceneMeanings[state.variant];if(!meaning)return;
  $('#meaning-mode').textContent=researchMeaningActive(state)?'Research interpretation active':'Original atmospheric version. Load the research version to see the idea expressed through motion.';
  $('.meaning-actions').hidden=state.variant>=8;$('.meaning-load-note').hidden=state.variant>=8;if(shown===state.variant)return;shown=state.variant;$('#meaning-title').textContent=meaning.title;$('#meaning-idea').textContent=meaning.idea;$('#meaning-motion').textContent=meaning.motion;
  $('#meaning-result').textContent='';$('#meaning-sources').replaceChildren(document.createTextNode('Research basis: '));
  for(const [i,[title,url]] of meaning.sources.entries()){if(i)$('#meaning-sources').append(document.createTextNode(' / '));const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=title;$('#meaning-sources').append(a);}
 }
 $('#load-research-look').onclick=async()=>{const button=$('#load-research-look'),variant=getState().variant,alternate=+$('#meaning-variation').value;button.disabled=true;
  try{const response=await fetch('./looks/research-meaning-variations.json');if(!response.ok)throw Error('Could not load the research collection.');const data=await response.json(),item=data.looks[variant*2+alternate];if(!item||item.look.variant!==variant)throw Error('This research version is unavailable.');if(getState().variant!==variant)throw Error('Choose the research version again after changing presets.');loadLook(item.look);$('#meaning-result').textContent='Loaded '+item.name;notify('Research composition loaded.');}
  catch(error){$('#meaning-result').textContent=error.message;}finally{button.disabled=false;}
 };
 paint();return {paint};
}
