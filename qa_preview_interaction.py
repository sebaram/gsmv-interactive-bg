"""Exercise list highlighting and first-gesture preview dragging."""
import base64
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE=os.environ.get('META_STATIC_URL','http://127.0.0.1:8770/_site/')
APP=Path(__file__).resolve().parent
state={'variant':1,'paused':True,'offset':3,'showVideo':False,'videoLayers':[],'branding':True}
address=BASE.split('#')[0]+'#look=v1.'+base64.urlsafe_b64encode(json.dumps(state).encode()).decode().rstrip('=')
with sync_playwright() as p:
 b=p.chromium.launch(channel='chrome',headless=True);context=b.new_context(viewport={'width':1600,'height':1000})
 page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(address)
 page.wait_for_function('window.METAStudio && document.querySelector("#author-element option[value=preset-main-part-3]")')
 page.locator('#element-search').fill('preset-main-part-3');page.locator('.author-row-select[data-element-id="preset-main-part-3"]').click()
 assert page.evaluate('window.METAStudio.state.editElements'), 'Selecting a list item must immediately reveal its preview highlight'
 front=next(f for f in page.frames if 'view=front' in f.url)
 front.locator('.element-handle[data-element-id="preset-main-part-3"]').wait_for(state='visible')
 assert page.locator('.preview-room').evaluate('e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight*.55}')
 assert page.locator('.author-row-select[data-element-id="preset-main-part-3"]').get_attribute('aria-pressed')=='true'
 print('PASS List selection immediately highlights the element while the monitor stays visible',flush=True)
 page.locator('#clear-element-selection').click();page.locator('#edit-elements').uncheck()
 # Locate a rendered sphere through the same read-only hit test used by hover.
 point=front.evaluate('''()=>{for(let y=innerHeight*.15;y<innerHeight*.8;y+=3)for(let x=innerWidth*.5;x<innerWidth*.98;x+=3){const hit=window.META.pickElement(x,y);if(hit?.id==="preset-main-part-3")return {x,y};}return null;}''')
 assert point,'The sphere must be hit-testable'
 iframe=page.locator('.paired iframe[title="Front LED wall live preview"]').bounding_box();x=iframe['x']+point['x'];y=iframe['y']+point['y']
 page.mouse.move(x,y);front.locator('.element-hover[data-element-id="preset-main-part-3"]').wait_for(state='visible')
 original=front.locator('.element-hover').bounding_box()
 page.mouse.down();page.mouse.move(x+25,y+12,steps=6);page.mouse.up()
 page.wait_for_function('window.METAStudio.state.activeElement==="preset-main-part-3" && !!window.METAStudio.state.authored[1]?.edits["preset-main-part-3"]')
 front.wait_for_timeout(150);moved=front.locator('.element-handle').bounding_box();assert abs((moved['x']+moved['width']/2)-(original['x']+original['width']/2)-25)<3;assert abs((moved['y']+moved['height']/2)-(original['y']+original['height']/2)-12)<3
 assert page.locator('.author-row-select[data-element-id="preset-main-part-3"]').get_attribute('aria-pressed')=='true'
 print('PASS An unselected object is hovered, selected and moved in one gesture without enabling an edit toggle',flush=True)
 page.locator('#author-element').select_option('preset-main');before=page.evaluate('window.METAStudio.state.authored[1]?.edits["preset-main"]||null')
 front.locator('.element-handle[data-element-id="preset-main"]').wait_for(state='visible')
 label=front.locator('.element-handle-label');label.wait_for(state='visible');box=label.bounding_box()
 page.mouse.move(box['x']+8,box['y']+5);page.mouse.down();page.mouse.move(box['x']+28,box['y']+13,steps=5);page.mouse.up()
 page.wait_for_function('!!window.METAStudio.state.authored[1].edits["preset-main"]')
 assert page.evaluate('window.METAStudio.state.activeElement')=='preset-main'
 print('PASS The group selection label moves its group while direct surface picking selects parts',flush=True)
 page.locator('#author-element').select_option('branding-left');left=next(f for f in page.frames if 'view=left' in f.url)
 left.locator('.element-handle[data-element-id="branding-left"]').wait_for(state='visible')
 box=left.locator('.element-handle-label').bounding_box();page.mouse.move(box['x']+8,box['y']+5);page.mouse.down();page.mouse.move(box['x']+20,box['y']+11,steps=4);page.mouse.up()
 page.wait_for_function('!!window.METAStudio.state.authored[1].edits["branding-left"]')
 assert left.locator('#branding').evaluate('e=>e.style.left')!=''
 with page.expect_popup() as opened:page.locator('#output-links a').first.click()
 output=opened.value;output.wait_for_function('window.META && document.body.dataset.ready==="true"')
 assert output.locator('.element-handle,.element-hover').count()==0
 print('PASS Signature dragging works and actual wall outputs contain no editor highlights',flush=True)
 page.set_viewport_size({'width':390,'height':844});page.locator('#element-search').fill('sphere');assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
 assert page.locator('.preview-room').evaluate('e=>e.getBoundingClientRect().height<=innerHeight*.52')
 page.screenshot(path=str(APP/'previews/qa-preview-interaction-mobile.png'),full_page=True)
 portrait={**state,'variant':2,'screens':[{'id':'front','name':'Portrait','width':2160,'height':3840,'mode':'raster'}]}
 page.goto(BASE.split('#')[0]+'#look=v1.'+base64.urlsafe_b64encode(json.dumps(portrait).encode()).decode().rstrip('='));page.wait_for_function('window.METAStudio && document.querySelectorAll(".paired iframe").length===1')
 box=page.locator('.paired iframe').bounding_box();assert abs(box['width']/box['height']-9/16)<.02;assert page.locator('.preview-room').evaluate('e=>e.offsetHeight<=innerHeight*.52')
 assembled={**state,'variant':5,'offset':15}
 page.goto(BASE.split('#')[0]+'#look=v1.'+base64.urlsafe_b64encode(json.dumps(assembled).encode()).decode().rstrip('='));page.wait_for_function('window.METAStudio && document.querySelector(".paired iframe").contentWindow.META?.renderedTime===15')
 front=next(f for f in page.frames if 'view=front' in f.url)
 assert front.evaluate('''()=>{for(let y=0;y<innerHeight;y+=6)for(let x=0;x<innerWidth;x+=6){const hit=window.META.pickElement(x,y);if(hit&&/preset-logo-front-part-[789]$/.test(hit.id))return false;}return true;}''')
 network={**state,'variant':3}
 page.goto(BASE.split('#')[0]+'#look=v1.'+base64.urlsafe_b64encode(json.dumps(network).encode()).decode().rstrip('='));page.wait_for_function('[...document.querySelectorAll(".paired iframe")].every(f=>f.contentWindow.META?.state.variant===3)')
 line=page.frames[1].evaluate('window.META.elements.find(e=>!e.parentId&&e.name.startsWith("Connection line")).id');page.locator('#author-element').select_option(line)
 page.wait_for_function('(id)=>[...document.querySelectorAll(".paired iframe")].some(f=>{const e=f.contentDocument.querySelector(".element-handle");return e?.dataset.elementId===id&&!e.hidden})',arg=line)
 assert not errors,errors
 print('PASS Responsive pinned preview and no JavaScript errors',flush=True)
 context.close();b.close()
