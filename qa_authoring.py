"""Verify authored presets, independent screens and portable address-based looks."""
import io
import base64
import json
import os
import time
import urllib.request
from pathlib import Path
from PIL import Image,ImageChops
from playwright.sync_api import sync_playwright

BASE=os.environ.get('META_STATIC_URL','http://127.0.0.1:8770/_site/')
APP=Path(__file__).resolve().parent
with sync_playwright() as p:
 b=p.chromium.launch(channel='chrome',headless=True)
 c=b.new_context(viewport={'width':1600,'height':1100},permissions=['clipboard-read','clipboard-write'])
 page=c.new_page();errors=[];api=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('request',lambda r:api.append(r.url) if '/api/' in r.url else None)
 page.on('dialog',lambda dialog:dialog.accept())
 page.goto(BASE);page.wait_for_function('window.METAStudio && document.querySelectorAll("#author-element option").length>0')
 for variant in range(page.locator('[data-variant]').count()):
  page.locator(f'[data-variant="{variant}"]').click()
  page.wait_for_function('(v)=>[...document.querySelectorAll(".paired iframe")].every(f=>f.contentWindow.META?.state.variant===v && f.contentWindow.META.elements.length>5)',arg=variant)
 print('PASS Every background is an editable preset with an element manifest',flush=True)
 page.locator('[data-variant="1"]').click();page.wait_for_function('document.querySelector("#author-element option[value=preset-main]")')
 page.locator('#author-element').select_option('preset-main');page.locator('#author-screen').select_option('front')
 page.locator('#author-x').fill('80');page.locator('#author-y').fill('45');page.locator('#author-size').fill('1.25')
 page.locator('#duplicate-element').click();page.wait_for_function('window.METAStudio.state.authored[1]?.objects.length===1')
 page.wait_for_function('document.querySelector("#author-element").value==="object-1"')
 page.locator('#author-screen').select_option('left');page.locator('#author-x').fill('25');page.locator('#author-size').fill('0.55')
 page.locator('#edit-elements').check()
 left=next(f for f in page.frames if 'view=left' in f.url);front=next(f for f in page.frames if 'view=front' in f.url)
 left.wait_for_function('window.META.elements.some(e=>e.id==="object-1" && e.screen==="left" && e.size===.55)')
 state=page.evaluate('window.METAStudio.state.authored[1]');assert state['edits']['preset-main']['size']==1.25 and state['objects'][0]['size']==.55
 print('PASS A large object on the right and a smaller duplicate on the left retain independent transforms',flush=True)
 page.locator('#pause-btn').click();left.wait_for_function('window.META.state.paused&&window.META.renderedTime===window.META.time')
 page.locator('.preview-room').scroll_into_view_if_needed();handle=left.locator('.element-handle[data-element-id="object-1"]');handle.wait_for(state='visible');box=handle.locator('.element-handle-label').bounding_box()
 page.mouse.move(box['x']+8,box['y']+5);page.mouse.down();page.mouse.move(box['x']+28,box['y']+13,steps=4);page.mouse.up()
 page.wait_for_function('window.METAStudio.state.authored[1].objects[0].x>26')
 resize=left.locator('.element-resize').bounding_box();before=page.evaluate('window.METAStudio.state.authored[1].objects[0].size')
 page.mouse.move(resize['x']+8,resize['y']+8);page.mouse.down();page.mouse.move(resize['x']+24,resize['y']+15,steps=4);page.mouse.up();page.wait_for_function('(s)=>window.METAStudio.state.authored[1].objects[0].size>s',arg=before)
 print('PASS Selected 3D elements drag and resize directly in the monitor',flush=True)
 page.locator('#pause-btn').click();left.wait_for_function('!window.META.state.paused')
 # Identity uses its own per-display transform, separate from the global signature switch.
 page.locator('#author-element').select_option('branding-left');page.locator('#author-x').fill('12');page.locator('#author-size').fill('0.7')
 left.wait_for_function('document.querySelector("#branding").style.left==="12%"')
 assert front.locator('#branding').evaluate('e=>e.style.left')==''
 page.locator('#author-element').select_option('object-1');page.locator('#author-visible').uncheck();left.wait_for_function('window.META.elements.find(e=>e.id==="object-1").visible===false');page.locator('#author-visible').check()
 page.locator('#add-element-type').select_option('logo');page.locator('#add-element').click();page.wait_for_function('window.METAStudio.state.authored[1].objects.length===2')
 page.wait_for_function('document.querySelector("#author-element").value==="object-2"');page.locator('#author-screen').select_option('front');page.locator('#author-size').fill('0.4')
 page.locator('#clear-local-video').click();front.wait_for_function('window.META.video && window.META.video.ready>=2');assert not page.evaluate('window.METAStudio.state.editElements');assert page.locator('.author-video-properties').is_visible()
 print('PASS Per-screen identity placement, element visibility, added MV objects and optional video coexist',flush=True)
 # Read the WebGL buffer so native videos/hover handles composited above the
 # canvas cannot masquerade as movement in the procedural scene.
 def canvas_image():return Image.open(io.BytesIO(base64.b64decode(front.locator('#scene').evaluate('e=>e.toDataURL("image/png").split(",")[1]')))).convert('RGB')
 before=canvas_image();front.wait_for_timeout(1000);after=canvas_image();assert ImageChops.difference(before,after).getbbox()
 page.locator('#pause-btn').click();front.wait_for_function('window.META.state.paused && window.META.renderedTime===window.META.time && window.META.videos.every(v=>v.paused)');before=canvas_image();front.wait_for_timeout(600);after=canvas_image();assert not ImageChops.difference(before,after).getbbox()
 print('PASS Authored originals and copies keep motion and pause correctly',flush=True)
 page.locator('#copy-look-link').click();address=page.evaluate('navigator.clipboard.readText()');assert '#look=v1.' in address
 expected=page.evaluate('({authored:window.METAStudio.state.authored,screens:window.METAStudio.state.screens,variant:window.METAStudio.state.variant})')
 fresh=b.new_context(viewport={'width':1440,'height':1000});restored=fresh.new_page();restored.on('pageerror',lambda e:errors.append(str(e)));restored.goto(address);restored.wait_for_function('window.METAStudio && document.querySelectorAll("#author-element option").length>0')
 actual=restored.evaluate('({authored:window.METAStudio.state.authored,screens:window.METAStudio.state.screens,variant:window.METAStudio.state.variant})');assert actual==expected
 assert restored.evaluate('!window.METAStudio.state.editElements && !window.METAStudio.state.editVideos')
 with restored.expect_popup() as opened:restored.locator('#output-links a').first.click()
 output=opened.value;output.on('pageerror',lambda e:errors.append(str(e)));output.wait_for_function('window.META && window.META.elements.some(e=>e.id==="object-1") && window.META.video && window.META.video.ready>=2')
 assert output.locator('.element-handle,.video-resize').count()==0
 standalone=output.url
 detached=b.new_context();wall=detached.new_page();wall.goto(standalone);wall.wait_for_function('window.META && window.META.elements.some(e=>e.id==="object-1")')
 assert wall.evaluate('window.META.state.authored[1].edits["preset-main"].size')==1.25
 print('PASS Copied/bookmarked editor and standalone output addresses restore in fresh browser storage',flush=True)
 page.locator('[data-variant="5"]').click();front.wait_for_function('window.META.state.variant===5');page.locator('[data-variant="1"]').click();front.wait_for_function('window.META.state.variant===1');page.wait_for_function('Object.keys(window.METAStudio.state.authored).length===0')
 saved_base,saved_hash=address.split('#',1);page.goto(saved_base+('&' if '?' in saved_base else '?')+'restore=authoring#'+saved_hash);page.wait_for_function('window.METAStudio.state.authored[1]?.objects.length===2')
 page.locator('.author-row-select[data-element-id="preset-main"]').click();page.locator('#reset-preset').click();page.wait_for_function('!window.METAStudio.state.authored[1]');assert page.evaluate('window.METAStudio.state.videoLayers.length')==1
 page.set_viewport_size({'width':390,'height':844});page.screenshot(path=str(APP/'previews/qa-authoring-mobile.png'),full_page=True);assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
 assert not errors,errors;assert not api,api
 print('PASS Preset reset preserves video layers, narrow controls fit, and no JS/API errors',flush=True)
 detached.close();fresh.close();c.close();b.close()
