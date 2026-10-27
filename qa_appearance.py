"""Rendered scene appearance, live outputs, per-preset state and bookmark restoration."""
import base64,io,json,os
from pathlib import Path
from PIL import Image,ImageChops
from playwright.sync_api import sync_playwright
BASE=os.environ.get('META_STATIC_URL','http://127.0.0.1:8770/_site/')
APP=Path(__file__).resolve().parent
def address(state):return BASE.split('#')[0]+'#look=v1.'+base64.urlsafe_b64encode(json.dumps(state).encode()).decode().rstrip('=')
def rendered(frame):return Image.open(io.BytesIO(base64.b64decode(frame.evaluate('document.querySelector("#scene").toDataURL().split(",")[1]')))).convert('RGB')
def color(page,key,value):page.locator('#appearance-'+key+'-hex').fill(value);page.locator('#appearance-mode').focus()
with sync_playwright() as p:
 b=p.chromium.launch(channel='chrome',headless=True);page=b.new_page(viewport={'width':1600,'height':1400});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(address({'variant':5,'brightness':100,'paused':True,'offset':15,'branding':False,'videoLayers':[]}));page.wait_for_function('window.METAStudio&&document.querySelectorAll(".paired iframe").length===2')
 frames=page.frames[1:];[f.wait_for_function('window.META&&document.body.dataset.ready==="true"') for f in frames];baseline=[rendered(f) for f in frames]
 page.locator('#appearance-mode').select_option('solid');color(page,'backgroundColor','#24784c');page.locator('#appearance-floor').fill('0');[f.wait_for_function('window.META.state.appearance[5]?.floor===0&&window.META.state.appearance[5]?.backgroundColor==="#24784c"') for f in frames];page.wait_for_timeout(120)
 for frame in frames:
  image=rendered(frame);sample=image.getpixel((5,5));assert max(abs(a-b) for a,b in zip(sample,(36,120,76)))<=3,sample
  assert frame.evaluate('''()=>{for(let y=innerHeight*.5;y<innerHeight;y+=6)for(let x=0;x<innerWidth;x+=8){if(window.META.pickElement(x,y)?.name==='Stage floor')return false;}return true;}''')
 with page.expect_popup() as opened:page.locator('#output-links a').first.click()
 wall=opened.value;wall.wait_for_function('window.META&&document.body.dataset.ready==="true"');assert max(abs(a-b) for a,b in zip(rendered(wall).getpixel((5,5)),(36,120,76)))<=3
 actual=Image.open(io.BytesIO(wall.screenshot())).convert('RGB');assert max(abs(a-b) for a,b in zip(actual.getpixel((5,5)),(36,120,76)))<=3,actual.getpixel((5,5))
 page.bring_to_front()
 print('PASS Custom solid color renders accurately on both wall shapes and a live output',flush=True)
 color(page,'backgroundColor','#f2eee0');frames[0].wait_for_function('document.body.classList.contains("light")');assert frames[0].locator('#wall-logo').get_attribute('src').endswith('logo-color.png')
 page.locator('#appearance-mode').select_option('gradient');color(page,'backgroundColor','#101726');color(page,'glowColor','#bd386d');page.locator('#appearance-glow').fill('0');page.wait_for_timeout(150);flat=rendered(frames[1]);page.locator('#appearance-glow').fill('1.8');page.wait_for_timeout(180);glow=rendered(frames[1]);assert ImageChops.difference(flat,glow).getbbox()
 page.locator('#appearance-lighting').fill('0');page.wait_for_timeout(150);dark=rendered(frames[1]);page.locator('#appearance-lighting').fill('1.5');page.wait_for_timeout(180);lit=rendered(frames[1]);assert ImageChops.difference(dark,lit).getbbox()
 page.locator('#appearance-floor').fill('1');page.wait_for_timeout(150);floor=rendered(frames[1]);page.locator('#appearance-floor').fill('0');page.wait_for_timeout(150);assert ImageChops.difference(floor,rendered(frames[1])).getbbox()
 # Background controls do not rebuild native video decoders or authored objects.
 page.locator('#clear-local-video').click();frames[1].wait_for_function('window.META.video?.ready>=2');frames[1].evaluate('window.originalDecoder=document.querySelector(".video-layer video")');page.locator('#appearance-lighting').fill('0.65');page.wait_for_timeout(150);assert frames[1].evaluate('window.originalDecoder===document.querySelector(".video-layer video")')
 settings=page.evaluate('window.METAStudio.state.appearance[5]');page.locator('[data-variant="1"]').click();page.wait_for_function('document.querySelector("#appearance-mode").value==="preset"');assert page.locator('#appearance-lighting').input_value()=='1';page.locator('[data-variant="5"]').click();assert page.locator('#appearance-lighting').input_value()=='0.65';assert page.evaluate('window.METAStudio.state.appearance[5]')==settings
 page.locator('#copy-look-link').click();fresh=b.new_context();restored=fresh.new_page();restored.goto(page.url);restored.wait_for_function('window.METAStudio');assert restored.evaluate('window.METAStudio.state.appearance[5]')==settings;fresh.close()
 print('PASS Glow, lights and floor change rendered pixels; contrast, decoder identity and per-preset saved settings work',flush=True)
 page.locator('#scene-appearance').screenshot(path=str(APP/'previews/qa-appearance-desktop.png'));page.set_viewport_size({'width':390,'height':844});page.locator('#scene-appearance').screenshot(path=str(APP/'previews/qa-appearance-mobile.png'));assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
 page.locator('#reset-appearance').click();assert page.evaluate('window.METAStudio.state.appearance[5]||null') is None;assert page.locator('#appearance-mode').input_value()=='preset';assert page.locator('#appearance-floor').input_value()=='1';assert page.evaluate('window.METAStudio.state.videoLayers.length')==1
 # After resetting, switching away and back must not compound light intensities.
 page.locator('[data-variant="1"]').click();page.locator('[data-variant="5"]').click();page.wait_for_function('[...document.querySelectorAll(".paired iframe")].every(f=>f.contentWindow.META?.state.variant===5)');page.set_viewport_size({'width':1600,'height':1400});page.wait_for_timeout(200)
 for i,frame in enumerate(frames):
  frame.evaluate('window.META.renderAt(15)');frame.wait_for_function('window.META.renderedTime===15');page.wait_for_timeout(150);assert rendered(frame).size==baseline[i].size;assert ImageChops.difference(rendered(frame),baseline[i]).getbbox() is None
 for variant in range(6):
  page.locator(f'[data-variant="{variant}"]').click();page.locator('#appearance-mode').select_option('solid');color(page,'backgroundColor','#203040');page.locator('#appearance-floor').fill('0');page.wait_for_function('(v)=>[...document.querySelectorAll(".paired iframe")].every(f=>f.contentWindow.META?.state.variant===v&&f.contentWindow.META.state.appearance[v]?.floor===0)',arg=variant);page.wait_for_timeout(150)
  for frame in frames:assert max(abs(a-b) for a,b in zip(rendered(frame).getpixel((5,5)),(32,48,64)))<=3
  page.locator('#reset-appearance').click()
 assert wall.locator('#scene-appearance').count()==0;assert not errors,errors
 print('PASS All six presets support appearance edits; reset preserves videos, mobile fits and wall outputs stay clean',flush=True);b.close()
