"""Verify Delete in the list is distinct from visibility and survives look links."""
import base64
import json
import os
from playwright.sync_api import sync_playwright

BASE=os.environ.get('META_STATIC_URL','http://127.0.0.1:8770/_site/')
state={'variant':1,'paused':True,'offset':3,'showVideo':False,'videoLayers':[]}
address=BASE.split('#')[0]+'#look=v1.'+base64.urlsafe_b64encode(json.dumps(state).encode()).decode().rstrip('=')
with sync_playwright() as p:
 browser=p.chromium.launch(channel='chrome',headless=True);context=browser.new_context(viewport={'width':1600,'height':1000});page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(address);page.wait_for_function('window.METAStudio && document.querySelector("#author-element option[value=preset-main-part-3]")')
 page.locator('#element-search').fill('preset-main-part-3');page.locator('.author-visibility[data-element-id="preset-main-part-3"]').click();assert page.locator('.author-row-select[data-element-id="preset-main-part-3"]').count()==1
 assert page.locator('.author-visibility[data-element-id="preset-main-part-3"]').inner_text()=='Show'
 page.locator('.author-delete[data-element-id="preset-main-part-3"]').click()
 page.wait_for_function('!document.querySelector("#author-element option[value=preset-main-part-3]")');assert page.locator('.author-row-select[data-element-id="preset-main-part-3"]').count()==0
 front=next(f for f in page.frames if 'view=front' in f.url);front.wait_for_function('!window.META.elements.some(e=>e.id==="preset-main-part-3")')
 assert page.evaluate('window.METAStudio.state.authored[1].edits["preset-main-part-3"].deleted')
 print('PASS Hide retains a list item; Delete removes the preset part from the list and scene',flush=True)
 page.locator('#element-search').fill('');page.locator('#author-element').select_option('preset-main');page.locator('#duplicate-element').click();page.wait_for_function('document.querySelector("#author-element").value==="object-1"')
 page.locator('.author-delete[data-element-id="preset-main"]').click();page.wait_for_function('!document.querySelector("#author-element option[value=preset-main]")')
 assert page.locator('#author-element option[value^="preset-main-part-"]').count()==0
 assert page.locator('#author-element option[value="object-1"]').count()==1
 assert page.evaluate('window.METAStudio.state.activeElement')=='object-1'
 print('PASS Deleting a preset group removes its children and keeps an independent selected copy',flush=True)
 page.locator('#copy-look-link').click();saved=page.url;fresh=browser.new_context();restored=fresh.new_page();restored.goto(saved);restored.wait_for_function('window.METAStudio && document.querySelector("#author-element option[value=object-1]")')
 assert restored.locator('#author-element option[value="preset-main"]').count()==0
 assert restored.evaluate('window.METAStudio.state.authored[1].edits["preset-main"].deleted')
 page.locator('.author-delete[data-element-id="object-1"]').evaluate('button=>{button.click();button.click();}');page.wait_for_function('!document.querySelector("#author-element option[value=object-1]")')
 assert not page.evaluate('window.METAStudio.state.authored[1].edits["object-1"]?.deleted')
 page.locator('#add-element-type').select_option('sphere');page.locator('#add-element').click();page.wait_for_function('!!document.querySelector(".author-row-select[data-element-id=object-1]")')
 page.locator('#reset-preset').click();page.wait_for_function('!!document.querySelector("#author-element option[value=preset-main-part-3]")')
 assert not page.evaluate('window.METAStudio.state.authored[1]||null')
 assert not errors,errors
 print('PASS Deletions survive fresh-storage URLs, custom Delete removes objects, and Reset preset restores defaults',flush=True)
 fresh.close();context.close();browser.close()
