// The list only rebuilds for structural changes, search or group expansion.
// Frequent preview paints update row state without replacing focused controls.
export function elementList(container,{select,toggleVisible,deleteElement}){
 container.innerHTML=`<div class="author-list-heading"><h4>Elements</h4><button type="button" class="subtle" id="clear-element-selection">Clear selection</button></div><label class="author-search-label" for="element-search">Search elements and parts</label><input id="element-search" type="search" placeholder="Name, part or screen" autocomplete="off"><p class="note" id="element-list-status" role="status"></p><div id="element-list" aria-label="Preset elements"><ul></ul></div>`;
 const search=container.querySelector('#element-search'),list=container.querySelector('#element-list'),status=container.querySelector('#element-list-status'),clear=container.querySelector('#clear-element-selection');
 const expanded=new Set(),rows=new Map();let elements=[],screens=[],selected='',previousSelection='',structure='',dirty=true;
 const children=new Map(),byId=new Map();
 function matching(element){const sc=screens.find(s=>s.id===element.screen);return [element.id,element.name,sc?.name,element.screen].join(' ').toLowerCase().includes(search.value.trim().toLowerCase());}
 function ancestors(id){const result=[];let parent=byId.get(id)?.parentId;while(parent&&byId.has(parent)){result.push(parent);parent=byId.get(parent).parentId;}return result;}
 function render(){
  const query=search.value.trim(),shown=new Set();
  if(query)for(const element of elements)if(matching(element)){shown.add(element.id);for(const id of ancestors(element.id))shown.add(id);}
  const active=document.activeElement,focus=active&&list.contains(active)?{id:active.dataset.elementId,action:active.dataset.action}:null,scroll=list.scrollTop;
  rows.clear();
  function branch(parent){const ul=document.createElement('ul');for(const element of children.get(parent)||[]){
   if(query&&!shown.has(element.id))continue;
   const nested=children.get(element.id)||[],li=document.createElement('li'),row=document.createElement('div');row.className='author-element-row';row.dataset.elementId=element.id;
   if(nested.length){const toggle=document.createElement('button');toggle.type='button';toggle.className='author-disclosure';toggle.dataset.elementId=element.id;toggle.dataset.action='expand';toggle.textContent=query||expanded.has(element.id)?'Collapse':'Expand';toggle.setAttribute('aria-expanded',String(!!query||expanded.has(element.id)));toggle.setAttribute('aria-label',toggle.textContent+' '+element.name);toggle.disabled=!!query;toggle.onclick=()=>{expanded.has(element.id)?expanded.delete(element.id):expanded.add(element.id);dirty=true;paint(elements,selected,screens);};row.append(toggle);}
   else {const spacer=document.createElement('span');spacer.className='author-disclosure-space';row.append(spacer);}
   const button=document.createElement('button');button.type='button';button.className='author-row-select';button.dataset.elementId=element.id;button.dataset.action='select';button.title=element.name;button.setAttribute('aria-label','Select '+element.name);const label=document.createElement('span'),detail=document.createElement('small');label.textContent=element.name.split(' / ').at(-1);button.append(label,detail);button.onclick=()=>select(element.id);row.append(button);
   const visibility=document.createElement('button');visibility.type='button';visibility.className='author-visibility';visibility.dataset.elementId=element.id;visibility.dataset.action='visibility';visibility.onclick=()=>{const current=byId.get(element.id);toggleVisible(element.id,current.visible===false);};row.append(visibility);const remove=document.createElement('button');remove.type='button';remove.className='author-delete';remove.dataset.elementId=element.id;remove.dataset.action='delete';remove.textContent='Delete';remove.setAttribute('aria-label','Delete '+element.name);remove.onclick=()=>deleteElement(element.id);row.append(remove);li.append(row);rows.set(element.id,{row,button,detail,visibility});
   if(nested.length&&(query||expanded.has(element.id)))li.append(branch(element.id));ul.append(li);
  }return ul;}
  list.replaceChildren(branch(null));list.scrollTop=scroll;
  if(focus)rows.get(focus.id)?.row.querySelector('[data-action="'+focus.action+'"]')?.focus({preventScroll:true});
  status.textContent=query?`${[...rows.keys()].filter(id=>matching(byId.get(id))).length} matching elements. Parent groups show context.`:`${elements.length} elements. Expand a group to see its parts.`;
  if(!rows.size){const empty=document.createElement('p');empty.className='note author-list-empty';empty.textContent=query?'No elements match your search.':'Preparing preset elements…';list.append(empty);}
 }
 function paint(nextElements,nextSelected,nextScreens){
  elements=nextElements;selected=nextSelected;screens=nextScreens;byId.clear();children.clear();for(const e of elements)byId.set(e.id,e);for(const e of elements){const parent=byId.has(e.parentId)?e.parentId:null;if(!children.has(parent))children.set(parent,[]);children.get(parent).push(e);}
  const key=JSON.stringify([elements.map(e=>[e.id,e.name,e.parentId,e.screen]),screens.map(s=>[s.id,s.name])]);if(key!==structure){structure=key;dirty=true;}
  const changedSelection=selected!==previousSelection;
  if(changedSelection&&selected){if(search.value&& !matching(byId.get(selected))){search.value='';dirty=true;}for(const id of ancestors(selected))if(!expanded.has(id)){expanded.add(id);dirty=true;}}
  if(dirty){render();dirty=false;}
  for(const element of elements){const controls=rows.get(element.id);if(!controls)continue;const visible=element.visible!==false,hiddenParent=ancestors(element.id).some(id=>byId.get(id).visible===false),screen=screens.find(s=>s.id===element.screen)?.name||element.screen,parts=(children.get(element.id)||[]).length;
   controls.row.classList.toggle('selected',element.id===selected);controls.row.classList.toggle('element-hidden',!visible||hiddenParent);controls.button.setAttribute('aria-pressed',String(element.id===selected));controls.detail.textContent=[screen,parts?parts+' parts':'',!visible?'Hidden':hiddenParent?'Hidden by group':'Visible'].filter(Boolean).join(' / ');controls.visibility.textContent=visible?'Hide':'Show';controls.visibility.setAttribute('aria-label',(visible?'Hide ':'Show ')+element.name);controls.visibility.setAttribute('aria-pressed',String(visible));
  }
  clear.disabled=!selected;
  if(changedSelection&&rows.has(selected)){const bounds=list.getBoundingClientRect(),row=rows.get(selected).row.getBoundingClientRect();if(row.top<bounds.top)list.scrollTop-=bounds.top-row.top;else if(row.bottom>bounds.bottom)list.scrollTop+=row.bottom-bounds.bottom;}
  previousSelection=selected;
 }
 search.oninput=()=>{dirty=true;paint(elements,selected,screens);};clear.onclick=()=>select(null);
 return {paint};
}
