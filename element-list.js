// The list only rebuilds for structural changes, search or group expansion.
// Frequent preview paints update row state without replacing focused controls.
export function elementList(container,{select,toggleVisible,deleteElement,contextMenu}){
 container.innerHTML=`<div class="author-list-heading"><h4>Layers</h4><button type="button" class="subtle" id="clear-element-selection">Deselect</button></div><label class="author-search-label" for="element-search">Find a layer or part</label><input id="element-search" type="search" placeholder="Name, line, part or screen" autocomplete="off"><p class="note" id="element-list-status" role="status"></p><div id="element-list" aria-label="Look elements"><ul></ul></div>`;
 const search=container.querySelector('#element-search'),list=container.querySelector('#element-list'),status=container.querySelector('#element-list-status'),clear=container.querySelector('#clear-element-selection');
 const expanded=new Set(),collapsedScreens=new Set(),rows=new Map();let elements=[],screens=[],selected='',previousSelection='',structure='',dirty=true;
 const children=new Map(),byId=new Map();
 function matching(element){if(!element)return false;const root=byId.get(ancestors(element.id).at(-1))||element,sc=screens.find(s=>s.id===root.screen);return [element.id,element.name,sc?.name,root.screen,root.screenLabel].join(' ').toLowerCase().includes(search.value.trim().toLowerCase());}
 function ancestors(id){const result=[];let parent=byId.get(id)?.parentId;while(parent&&byId.has(parent)){result.push(parent);parent=byId.get(parent).parentId;}return result;}
 function screenGroup(element){return element.screen==='all'?(element.screenLabel==='No screens'?'unassigned':'all'):screens.some(s=>s.id===element.screen)?element.screen:'unassigned';}
 function render(){
  const query=search.value.trim(),shown=new Set();
  if(query)for(const element of elements)if(matching(element)){shown.add(element.id);for(const id of ancestors(element.id))shown.add(id);}
  const active=document.activeElement,focus=active&&list.contains(active)?{id:active.dataset.elementId,screen:active.dataset.screenId,action:active.dataset.action}:null,scroll=list.scrollTop;
  rows.clear();
  function branch(parent,roots=null){const ul=document.createElement('ul');for(const element of roots||children.get(parent)||[]){
   if(query&&!shown.has(element.id))continue;
   const nested=children.get(element.id)||[],li=document.createElement('li'),row=document.createElement('div');row.className='author-element-row';row.dataset.elementId=element.id;row.oncontextmenu=event=>{event.stopPropagation();contextMenu?.(element.id,event);};
   if(nested.length){const toggle=document.createElement('button');toggle.type='button';toggle.className='author-disclosure';toggle.dataset.elementId=element.id;toggle.dataset.action='expand';const opened=!!query||expanded.has(element.id);toggle.textContent=opened?'▾':'▸';toggle.setAttribute('aria-expanded',String(opened));toggle.setAttribute('aria-label',(opened?'Collapse ':'Expand ')+element.name);toggle.title=opened?'Collapse contents':'Show contents (Ungroup enables part editing)';toggle.disabled=!!query;toggle.onclick=()=>{expanded.has(element.id)?expanded.delete(element.id):expanded.add(element.id);dirty=true;paint(elements,selected,screens);};row.append(toggle);}
   else {const spacer=document.createElement('span');spacer.className='author-disclosure-space';row.append(spacer);}
   const button=document.createElement('button');button.type='button';button.className='author-row-select';button.dataset.elementId=element.id;button.dataset.action='select';button.title=element.name;button.setAttribute('aria-label','Select '+element.name);const label=document.createElement('span'),detail=document.createElement('small');label.textContent=element.name.split(' / ').at(-1);button.append(label,detail);button.onclick=()=>select(element.id);row.append(button);
   const visibility=document.createElement('button');visibility.type='button';visibility.className='author-visibility';visibility.dataset.elementId=element.id;visibility.dataset.action='visibility';visibility.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';visibility.onclick=()=>{const current=byId.get(element.id);if(!current.locked)toggleVisible(element.id,current.visible===false);};row.append(visibility);const remove=document.createElement('button');remove.type='button';remove.className='author-delete';remove.dataset.elementId=element.id;remove.dataset.action='delete';remove.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7"/></svg>';remove.setAttribute('aria-label','Delete '+element.name);remove.title='Delete '+element.name;remove.onclick=()=>{if(!byId.get(element.id)?.locked)deleteElement(element.id);};row.append(remove);li.append(row);rows.set(element.id,{row,button,detail,visibility,remove});
   if(nested.length&&(query||expanded.has(element.id)))li.append(branch(element.id));ul.append(li);
  }return ul;}
  const tree=document.createElement('ul'),groups=[...screens,{id:'all',name:'Shared across screens'},{id:'unassigned',name:'Unassigned'}];
  for(const screen of groups){
   const roots=(children.get(null)||[]).filter(e=>screenGroup(e)===screen.id&&(!query||shown.has(e.id)));if(!roots.length)continue;
   const li=document.createElement('li'),toggle=document.createElement('button'),name=document.createElement('span'),count=document.createElement('small'),opened=!!query||!collapsedScreens.has(screen.id);li.className='author-screen-group';li.dataset.screenId=screen.id;toggle.type='button';toggle.className='author-screen-toggle';toggle.dataset.screenId=screen.id;toggle.setAttribute('aria-expanded',String(opened));toggle.setAttribute('aria-label',(opened?'Collapse ':'Expand ')+screen.name);toggle.innerHTML='<span class="screen-chevron" aria-hidden="true">'+(opened?'▾':'▸')+'</span><svg viewBox="0 0 24 18" aria-hidden="true"><rect x="1" y="1" width="22" height="16" rx="1"/>'+(screen.mode==='tiles'?'<path d="M8 1v16M16 1v16M1 9h22"/>':'')+'</svg>';name.textContent=screen.name;count.textContent=roots.length;count.title=roots.length+' top-level layers';toggle.append(name,count);toggle.disabled=!!query;toggle.onclick=()=>{opened?collapsedScreens.add(screen.id):collapsedScreens.delete(screen.id);dirty=true;paint(elements,selected,screens);};li.append(toggle);if(opened)li.append(branch(null,roots));tree.append(li);
  }
  list.replaceChildren(tree);list.scrollTop=scroll;
  if(focus?.screen)list.querySelectorAll('.author-screen-toggle').forEach(b=>{if(b.dataset.screenId===focus.screen)b.focus({preventScroll:true});});
  else if(focus)rows.get(focus.id)?.row.querySelector('[data-action="'+focus.action+'"]')?.focus({preventScroll:true});
  status.textContent=query?`${[...rows.keys()].filter(id=>matching(byId.get(id))).length} matching elements. Parent groups show context.`:`${elements.length} elements. Expand a group to see its parts.`;
  if(!tree.children.length){const empty=document.createElement('p');empty.className='note author-list-empty';empty.textContent=query?'No elements match your search.':'Preparing look elements…';list.append(empty);}
 }
 function paint(nextElements,nextSelected,nextScreens){
  elements=nextElements;selected=nextSelected;screens=nextScreens;byId.clear();children.clear();for(const e of elements)byId.set(e.id,e);for(const e of elements){const parent=byId.has(e.parentId)?e.parentId:null;if(!children.has(parent))children.set(parent,[]);children.get(parent).push(e);}
  const key=JSON.stringify([elements.map(e=>[e.id,e.name,e.parentId,e.screen]),screens.map(s=>[s.id,s.name])]);if(key!==structure){structure=key;dirty=true;}
  const changedSelection=selected!==previousSelection;
  if(changedSelection&&selected){if(search.value&& !matching(byId.get(selected))){search.value='';dirty=true;}const path=ancestors(selected),root=byId.get(path.at(-1)||selected);if(root&&collapsedScreens.delete(screenGroup(root)))dirty=true;for(const id of path)if(!expanded.has(id)){expanded.add(id);dirty=true;}}
  if(dirty){render();dirty=false;}
  for(const element of elements){const controls=rows.get(element.id);if(!controls)continue;const visible=element.visible!==false,hiddenParent=ancestors(element.id).some(id=>byId.get(id).visible===false),screen=element.screenLabel||screens.find(s=>s.id===element.screen)?.name||element.screen,parts=(children.get(element.id)||[]).length;
   controls.row.classList.toggle('selected',element.id===selected);controls.row.classList.toggle('element-hidden',!visible||hiddenParent);controls.row.classList.toggle('element-locked',!!element.locked);controls.button.setAttribute('aria-pressed',String(element.id===selected));controls.detail.textContent=[element.screen==='all'?screen:'',parts?(element.ungrouped?'Ungrouped':'Grouped')+' · '+parts:'',element.locked?'Part · ungroup to edit':!visible?'Hidden':hiddenParent?'Hidden by group':''].filter(Boolean).join(' · ');controls.visibility.setAttribute('aria-label',(visible?'Hide ':'Show ')+element.name);controls.visibility.title=element.locked?'Ungroup its parent to edit this part':(visible?'Hide ':'Show ')+element.name;controls.visibility.setAttribute('aria-pressed',String(visible));controls.visibility.disabled=!!element.locked;controls.remove.disabled=!!element.locked;controls.remove.title=element.locked?'Ungroup its parent to delete this part':'Delete '+element.name;
  }
  clear.disabled=!selected;
  if(changedSelection&&rows.has(selected)){const bounds=list.getBoundingClientRect(),row=rows.get(selected).row.getBoundingClientRect();if(row.top<bounds.top)list.scrollTop-=bounds.top-row.top;else if(row.bottom>bounds.bottom)list.scrollTop+=row.bottom-bounds.bottom;}
  previousSelection=selected;
 }
 search.oninput=()=>{dirty=true;paint(elements,selected,screens);};clear.onclick=()=>select(null);
 return {paint};
}
