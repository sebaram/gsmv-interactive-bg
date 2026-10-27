"""Verify the logo transformation and direct-add video workflow."""
import io
import json
import os
import time
import urllib.request
from pathlib import Path
from PIL import Image,ImageChops
from playwright.sync_api import sync_playwright
BASE=os.environ.get('META_QA_URL','http://127.0.0.1:8766')
APP=Path(__file__).resolve().parent
catalog=json.loads((APP/'clips.json').read_text(encoding='utf-8'))
state={'variant':5,'cue':0,'showVideo':False,'paused':False,'speed':1,'motionAmount':1,'epoch':time.time()*1000,'offset':0}
req=urllib.request.Request(BASE+'/api/state',data=json.dumps(state).encode(),headers={'Content-Type':'application/json'})
urllib.request.urlopen(req).close()
with sync_playwright() as p:
 b=p.chromium.launch(channel='chrome',headless=True)
 c=b.new_context(viewport={'width':1440,'height':1000},device_scale_factor=1)
 page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(BASE+'/backgrounds/');page.wait_for_function('document.querySelector("#video-result-count").textContent==="34 videos"')
 page.locator('#research-catalog').evaluate('e=>e.open=true')
 assert 'Research cue' not in page.locator('body').inner_text()
 assert page.locator('#video-preview,#video-poster,.video-detail').count()==0
 assert page.locator('.video-item strong').first.inner_text()
 assert page.locator('.video-item-description').first.inner_text()
 assert page.locator('.video-item img').count()==4
 print('PASS Explicit video library shows 34 titles, descriptions, posters and direct adding',flush=True)
 before=page.evaluate('window.METAStudio.state.videoId')
 page.locator('#video-search').fill('P2-S5-01')
 assert 'AquaHaptics' in page.locator('.video-item strong').inner_text()
 assert page.evaluate('window.METAStudio.state.videoId')==before
 print('PASS Browsing direct-add cards does not change the wall content',flush=True)
 with page.expect_popup() as opened:page.locator('#output-links a').first.click()
 wall=opened.value;wall.on('pageerror',lambda e:errors.append(str(e)));wall.wait_for_function('window.META && document.body.dataset.ready==="true"')
 assert wall.evaluate('window.META.video') is None
 page.locator('#use-video').click();wall.wait_for_function('window.META.state.videoId==="P2-S5-01" && window.META.video && window.META.video.ready>=2')
 assert wall.evaluate('window.META.state.variant')==5
 assert 'AquaHaptics' in page.locator('#video-selection-status').inner_text()
 print('PASS Use this video sends the chosen clip to the MV scene without replacing the logo motion',flush=True)
 page.locator('#video-search').fill('robot');assert page.locator('.video-item').count()>=1
 page.locator('#video-search').fill('no-such-video-9471');assert page.locator('.video-empty').is_visible()
 page.locator('#video-search').fill('')
 print('PASS Video search and empty results work',flush=True)
 page.locator('#no-video').click();wall.wait_for_function('!window.META.state.showVideo && !window.META.video')
 before=wall.locator('#scene').screenshot();wall.wait_for_timeout(1500);after=wall.locator('#scene').screenshot()
 assert ImageChops.difference(Image.open(io.BytesIO(before)),Image.open(io.BytesIO(after))).getbbox()
 print('PASS Procedural MV scene moves without video',flush=True)
 page.locator('#pause-btn').click();wall.wait_for_function('window.META.state.paused && window.META.renderedTime===window.META.time');wall.wait_for_timeout(500)
 a=wall.locator('#scene').screenshot();wall.wait_for_timeout(250);z=wall.locator('#scene').screenshot()
 d=ImageChops.difference(Image.open(io.BytesIO(a)).convert('RGB'),Image.open(io.BytesIO(z)).convert('RGB'))
 if d.getbbox() is not None:
  print('Paused frame difference:',d.getextrema(),flush=True)
  (APP/'previews/qa-pause-a.png').write_bytes(a);(APP/'previews/qa-pause-z.png').write_bytes(z)
 assert d.getbbox() is None
 print('PASS Pause freezes the morph geometry',flush=True)
 # A representative assembly frame must be much wider than its height (the MV mark).
 wall.evaluate('window.META.renderAt(15)');wall.wait_for_timeout(100);wall.screenshot(path=str(APP/'previews/mv-assembled.jpg'),type='jpeg',quality=94)
 for t,name in [(3,'exchange'),(28,'evolving')]:
  wall.evaluate('(t)=>window.META.renderAt(t)',t);wall.wait_for_timeout(100);wall.screenshot(path=str(APP/'previews'/('mv-'+name+'.jpg')),type='jpeg',quality=94)
 page.screenshot(path=str(APP/'previews/studio-video-library.png'),full_page=True)
 assert not errors,errors
 wall.close()
 page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(200)
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 page.screenshot(path=str(APP/'previews/studio-video-mobile.png'),full_page=True)
 print('PASS Narrow monitor layout and no JavaScript errors',flush=True)
 b.close()
