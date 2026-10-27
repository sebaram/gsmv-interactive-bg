"""Exercise mouse actions and editor shortcuts in both the list and preview."""
import base64
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE=os.environ.get('META_STATIC_URL','http://127.0.0.1:8770/_site/')
state={'variant':1,'paused':True,'offset':3,'authored':{'1':{'edits':{'preset-main':{'ungrouped':True}},'objects':[]}},'branding':True,'videoLayers':[]}
address=BASE.split('#')[0]+'#look=v1.'+base64.urlsafe_b64encode(json.dumps(state).encode()).decode().rstrip('=')
with sync_playwright() as p:
 b=p.chromium.launch(channel='chrome',headless=True);page=b.new_page(viewport={'width':1600,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(address);page.wait_for_function('window.METAStudio && document.querySelector("#author-element option[value=preset-main-part-3]")')
 page.locator('#element-search').fill('preset-main-part-3');row=page.locator('.author-row-select[data-element-id="preset-main-part-3"]');row.click();page.keyboard.press('Control+d')
 page.wait_for_function('window.METAStudio.state.activeElement==="object-1"',timeout=3000)
 print('PASS Ctrl+D duplicates the selected list element',flush=True)
 front=next(f for f in page.frames if 'view=front' in f.url);front.locator('.element-handle[data-element-id="object-1"]').wait_for(state='visible');front.locator('.element-handle-label').click();page.keyboard.press('Control+c');page.keyboard.press('Delete')
 page.wait_for_function('!document.querySelector("#author-element option[value=object-1]")');page.keyboard.press('Control+v')
 page.wait_for_function('window.METAStudio.state.activeElement && document.querySelector("#author-element").value===window.METAStudio.state.activeElement')
 pasted=page.evaluate('window.METAStudio.state.activeElement');assert pasted
 page.keyboard.press('Control+z');page.wait_for_function('(id)=>!document.querySelector("#author-element option[value="+id+"]")',arg=pasted)
 page.keyboard.press('Control+Shift+z');page.wait_for_function('(id)=>!!document.querySelector("#author-element option[value="+id+"]")',arg=pasted)
 print('PASS Preview copy/delete/paste retains the source and undo/redo restores edits',flush=True)
 page.locator('#element-search').fill('');page.locator('.author-row-select[data-element-id="'+pasted+'"]').click(button='right');page.locator('#element-context-menu').screenshot(path=str(Path(__file__).resolve().parent/'previews/qa-author-context-menu.png'));page.locator('#element-context-menu [data-command="delete"]').click();page.wait_for_function('(id)=>!document.querySelector("#author-element option[value="+id+"]")',arg=pasted)
 page.keyboard.press('Control+z');page.wait_for_function('(id)=>!!document.querySelector("#author-element option[value="+id+"]")',arg=pasted)
 page.locator('#author-element').select_option('preset-main-part-3');front.locator('.element-handle[data-element-id="preset-main-part-3"]').wait_for(state='visible');front.locator('.element-handle-label').click(button='right');page.locator('#element-context-menu [data-command="duplicate"]').click()
 page.wait_for_function('window.METAStudio.state.activeElement.startsWith("object-")')
 print('PASS Right-click menus select and act on list rows and preview elements',flush=True)
 selected=page.evaluate('window.METAStudio.state.activeElement');page.locator('#element-search').fill('typing');page.keyboard.press('Control+a');page.keyboard.press('Control+c');page.keyboard.press('Delete');assert page.locator('#element-search').input_value()=='';assert page.evaluate('window.METAStudio.state.activeElement')==selected
 page.locator('#author-x').fill('42');page.keyboard.press('Control+z');assert page.locator('#author-element option[value="'+selected+'"]').count()==1
 page.locator('#add-element-type').select_option('sphere');page.locator('#add-element').focus();page.keyboard.press('Insert');page.wait_for_function('window.METAStudio.state.activeElement!=='+json.dumps(selected));added=page.evaluate('window.METAStudio.state.activeElement')
 assert page.evaluate('(id)=>window.METAStudio.state.authored[1].objects.find(o=>o.id===id)?.type',added)=='sphere'
 page.keyboard.press('Control+x');page.wait_for_function('(id)=>!document.querySelector("#author-element option[value="+id+"]")',arg=added);page.keyboard.press('Control+v');page.wait_for_function('window.METAStudio.state.activeElement!==null')
 page.keyboard.press('Escape');assert page.evaluate('window.METAStudio.state.activeElement') is None
 page.locator('#author-element').select_option('preset-main-part-3');front.locator('.element-handle[data-element-id="preset-main-part-3"]').wait_for(state='visible');label=front.locator('.element-handle-label');box=label.bounding_box();before=page.evaluate('JSON.stringify(window.METAStudio.state.authored)')
 page.mouse.move(box['x']+8,box['y']+5);page.mouse.down();page.mouse.move(box['x']+38,box['y']+17,steps=12);page.mouse.up();page.keyboard.press('Control+z');assert page.evaluate('JSON.stringify(window.METAStudio.state.authored)')==before
 page.keyboard.press('Control+y');assert page.evaluate('JSON.stringify(window.METAStudio.state.authored)')!=before
 page.keyboard.press('Meta+c');count=page.evaluate('window.METAStudio.state.authored[1].objects.length');page.keyboard.press('Meta+v');page.wait_for_function('(n)=>window.METAStudio.state.authored[1].objects.length===n+1',arg=count)
 label=front.locator('.element-handle-label');label.wait_for(state='visible');label.click();count=page.evaluate('window.METAStudio.state.authored[1].objects.length');page.keyboard.press('Control+v');page.wait_for_function('(n)=>window.METAStudio.state.authored[1].objects.length===n+1',arg=count)
 page.set_viewport_size({'width':390,'height':844});page.locator('#author-copy').click(button='right');page.locator('.author-row-select[aria-pressed="true"]').click(button='right');page.wait_for_function('!document.querySelector("#element-context-menu").hidden');assert page.locator('#element-context-menu').evaluate('e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight}');page.keyboard.press('End');assert page.locator('#element-context-menu [data-command="add"]').evaluate('e=>e===document.activeElement');page.keyboard.press('Escape');assert page.locator('#element-context-menu').is_hidden()
 assert not errors,errors
 print('PASS Typing keeps native shortcuts; Insert, cut/paste, drag undo, Mac keys, single paste and mobile menus work',flush=True)
 authored=page.evaluate('JSON.stringify(window.METAStudio.state.authored)');page.locator('#copy-look-link').click();saved=page.url;fresh=b.new_context();restored=fresh.new_page();restored.goto(saved);restored.wait_for_function('window.METAStudio && document.querySelector("#author-element option")');assert restored.evaluate('JSON.stringify(window.METAStudio.state.authored)')==authored;assert restored.locator('#author-undo').is_disabled();assert restored.locator('#author-paste').is_disabled()
 with restored.expect_popup() as opened:restored.locator('#output-links a').first.click()
 output=opened.value;output.wait_for_function('window.META && document.body.dataset.ready==="true"');assert output.locator('#element-context-menu,.element-handle').count()==0;assert output.evaluate('document.onkeydown===null')
 print('PASS Pasted arrangements survive bookmarked URLs; clipboard/history stay local and outputs stay clean',flush=True)
 fresh.close()
 b.close()
