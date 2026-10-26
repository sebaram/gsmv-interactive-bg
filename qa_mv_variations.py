"""Verify independent MV copies, seeded visuals, pause and portable looks."""
import base64
import io
import os
from pathlib import Path
from PIL import Image,ImageChops
from playwright.sync_api import sync_playwright

BASE=os.environ.get('META_STATIC_URL','http://127.0.0.1:8770/_site/')
APP=Path(__file__).resolve().parent
state={'variant':5,'paused':True,'offset':3,'branding':False,'showVideo':False,'videoLayers':[],'authored':{'5':{'edits':{'preset-logo-front':{'visible':False},'preset-logo-left':{'visible':False}},'objects':[]}}}
import json
address=BASE.split('#')[0]+'#look=v1.'+base64.urlsafe_b64encode(json.dumps(state).encode()).decode().rstrip('=')
with sync_playwright() as p:
 b=p.chromium.launch(channel='chrome',headless=True);context=b.new_context(viewport={'width':1600,'height':1100})
 page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(address);page.wait_for_function('window.METAStudio && document.querySelectorAll("#author-element option").length>0')
 page.locator('#add-element-type').select_option('logo');page.locator('#add-element').click();page.wait_for_function('document.querySelector("#author-element").value==="object-1"')
 page.locator('#author-screen').select_option('front');page.locator('#author-x').fill('28');page.locator('#author-y').fill('50');page.locator('#author-size').fill('0.5')
 page.locator('#duplicate-element').click();page.wait_for_function('document.querySelector("#author-element").value==="object-2"');page.locator('#author-x').fill('75')
 objects=page.evaluate('window.METAStudio.state.authored[5].objects');assert objects[0]['seed']!=objects[1]['seed'];assert all(o['randomness']==1 for o in objects)
 assert page.locator('#mv-variation').is_visible()
 print('PASS Added and duplicated MV sculptures have distinct saved seeds and variation controls',flush=True)
 with page.expect_popup() as opened:page.locator('#output-links a').first.click()
 wall=opened.value;wall.on('pageerror',lambda e:errors.append(str(e)));wall.wait_for_function('window.META?.elements.some(e=>e.id==="object-2" && e.mv) && window.META.renderedTime===3');wall.wait_for_timeout(650)
 a=Image.open(io.BytesIO(wall.locator('#scene').screenshot())).convert('RGB')
 old=objects[1]['seed'];page.locator('#randomize-mv').click();wall.wait_for_function('(old)=>window.META.state.authored[5].objects[1].seed!==old',arg=old);wall.wait_for_timeout(650)
 z=Image.open(io.BytesIO(wall.locator('#scene').screenshot())).convert('RGB');diff=ImageChops.difference(a,z)
 left=diff.crop((int(a.width*.1),int(a.height*.15),int(a.width*.45),int(a.height*.85)))
 right=diff.crop((int(a.width*.55),int(a.height*.15),int(a.width*.95),int(a.height*.85)))
 assert max(hi for lo,hi in left.getextrema())<=1
 assert max(hi for lo,hi in right.getextrema())>12
 assert page.evaluate('window.METAStudio.state.authored[5].objects[0].seed')==objects[0]['seed']
 print('PASS Changing one MV variation changes its rendered shape while the other sculpture remains unchanged',flush=True)
 page.locator('#author-element').select_option('object-2-part-1');assert page.locator('#mv-variation').is_hidden();page.locator('#author-size').fill('.7');assert page.evaluate('window.METAStudio.state.authored[5].edits["object-2-part-1"].size')==.7
 page.locator('#author-element').select_option('object-2');page.wait_for_timeout(300);saved=page.url;expected=page.evaluate('window.METAStudio.state.authored')
 fresh=b.new_context(viewport={'width':1600,'height':1100});restored=fresh.new_page();restored.goto(saved);restored.wait_for_function('window.METAStudio && document.querySelector("#author-element option[value=object-2]")');assert restored.evaluate('window.METAStudio.state.authored')==expected
 page.locator('#pause-btn').click();wall.wait_for_function('!window.META.state.paused');before=wall.locator('#scene').screenshot();wall.wait_for_timeout(1100);after=wall.locator('#scene').screenshot();assert ImageChops.difference(Image.open(io.BytesIO(before)),Image.open(io.BytesIO(after))).getbbox()
 page.locator('#pause-btn').click();wall.wait_for_function('window.META.state.paused && window.META.renderedTime===window.META.time');wall.wait_for_timeout(650);before=wall.locator('#scene').screenshot();wall.wait_for_timeout(500);after=wall.locator('#scene').screenshot();assert max(hi for lo,hi in ImageChops.difference(Image.open(io.BytesIO(before)).convert('RGB'),Image.open(io.BytesIO(after)).convert('RGB')).getextrema())<=1
 page.locator('.preview-room').scroll_into_view_if_needed();page.screenshot(path=str(APP/'previews/qa-mv-variations.png'),full_page=True)
 assert not errors,errors
 print('PASS Independent facet editing, bookmarked seed restoration, motion and pause work with multiple sculptures',flush=True)
 fresh.close();context.close();b.close()
