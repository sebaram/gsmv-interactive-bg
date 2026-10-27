"""Exercise optional video composition and physical placement through the real editor."""
import json
import os
import time
import urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE=os.environ.get('META_QA_URL','http://127.0.0.1:8766')
APP=Path(__file__).resolve().parent
seed={'variant':1,'showVideo':False,'videoLayers':[],'paused':False,'epoch':time.time()*1000,'offset':0}
urllib.request.urlopen(urllib.request.Request(BASE+'/api/state',data=json.dumps(seed).encode(),headers={'Content-Type':'application/json'})).close()
with sync_playwright() as p:
 b=p.chromium.launch(channel='chrome',headless=True)
 c=b.new_context(viewport={'width':1600,'height':1100},device_scale_factor=1)
 page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(BASE+'/backgrounds/');page.wait_for_function('window.METAStudio && document.querySelectorAll(".paired iframe").length===2')
 assert 'No videos added' in page.locator('#layer-empty').text_content()
 page.locator('#research-catalog').evaluate('e=>e.open=true')
 with page.expect_popup() as opened:page.locator('#output-links a').first.click()
 wall=opened.value;wall.on('pageerror',lambda e:errors.append(str(e)))
 wall.wait_for_function('window.META && document.body.dataset.ready==="true"');assert wall.evaluate('window.META.video') is None
 for variant in range(6):
  page.locator(f'[data-variant="{variant}"]').click()
  page.locator('#use-video').click()
  wall.wait_for_function(f'window.META.state.variant==={variant} && window.META.video && window.META.video.ready>=2')
  assert wall.locator('.video-resize').count()==0
  page.locator('#no-video').click();wall.wait_for_function('window.META.videos.length===0');page.locator('[data-remove-video]').click()
 print('PASS Video can be added and removed on all six backgrounds without changing styles',flush=True)
 page.locator('#use-video').click();wall.wait_for_function('window.META.video && window.META.video.ready>=2')
 first=page.evaluate('window.METAStudio.state.activeVideoLayer')
 wall.evaluate('window.firstDecoder=document.querySelector(".video-layer video")')
 page.locator('#video-search').fill('P2-S5-01');page.locator('#use-video').click();page.locator('#play-videos-together').click();page.locator('#video-placement-settings').evaluate('e=>e.open=true')
 wall.wait_for_function('window.META.videos.length===2 && window.META.videos.every(v=>v.ready>=2)')
 assert wall.evaluate('window.firstDecoder===document.querySelector(".video-layer video")')
 assert len(set(page.evaluate('window.METAStudio.state.videoLayers.map(l=>l.id)')))==2
 print('PASS Multiple clips play independently and existing video decoders survive additions',flush=True)
 page.locator('#video-placement-screen').select_option('left')
 for key,value in [('x','32'),('y','60'),('width','24')]:page.locator('#video-'+key).fill(value)
 layer=page.evaluate('window.METAStudio.state.videoLayers.at(-1)')
 assert layer['screens']['left']['x']==32 and layer['x']==70
 left=next(f for f in page.frames if 'view=left' in f.url)
 left.wait_for_function('window.META && window.META.videos.length===2')
 active=page.evaluate('window.METAStudio.state.activeVideoLayer')
 target=left.locator(f'[data-layer="{active}"]')
 assert target.evaluate('e=>Math.abs(parseFloat(e.style.width)/parseFloat(e.style.height)*(8/3)-e.querySelector("video").videoWidth/e.querySelector("video").videoHeight)<.001')
 page.locator('.preview-room').scroll_into_view_if_needed();box=target.bounding_box()
 page.mouse.move(box['x']+box['width']*.5,box['y']+box['height']*.5);page.mouse.down();page.mouse.move(box['x']+box['width']*.5+24,box['y']+box['height']*.5+10,steps=5);page.mouse.up()
 page.wait_for_function('window.METAStudio.state.videoLayers.at(-1).screens.left.x>34')
 width=page.evaluate('window.METAStudio.state.videoLayers.at(-1).screens.left.width')
 handle=target.locator('.video-resize').bounding_box();page.mouse.move(handle['x']+8,handle['y']+8);page.mouse.down();page.mouse.move(handle['x']+28,handle['y']+15,steps=5);page.mouse.up()
 page.wait_for_function('(w)=>window.METAStudio.state.videoLayers.at(-1).screens.left.width>w',arg=width)
 assert wall.evaluate('window.META.state.videoLayers.at(-1).x')==70
 print('PASS Preview drag and resize update only the chosen screen, with tiled aspect compensation',flush=True)
 page.locator('#video-placement-screen').select_option('left');page.locator('#layer-visible').uncheck()
 left.wait_for_function('window.META.videos.length===1');assert wall.evaluate('window.META.videos.length')==2
 page.locator('#layer-visible').check()
 page.locator('#show-videos').uncheck();wall.wait_for_function('window.META.videos.length===0');assert page.evaluate('window.METAStudio.state.videoLayers.length')==2
 page.locator('#show-videos').check();wall.wait_for_function('window.META.videos.length===2')
 print('PASS Per-screen visibility and master visibility preserve the composition',flush=True)
 page.locator('#video-placement-screen').select_option('all');page.locator('#video-x').fill('45')
 left.wait_for_function('parseFloat(document.querySelectorAll(".video-layer")[1].style.left)===45')
 wall.wait_for_function('parseFloat(document.querySelectorAll(".video-layer")[1].style.left)===45')
 # A separate browser context exercises the LAN state transport, rather than BroadcastChannel.
 remote=b.new_context(viewport={'width':1280,'height':720});other=remote.new_page();other.on('pageerror',lambda e:errors.append(str(e)))
 other.goto(BASE+'/backgrounds/wall.html?view=left');other.wait_for_function('window.META && window.META.videos.length===2 && window.META.videos.every(v=>v.ready>=2)')
 assert float(other.locator('.video-layer').nth(1).evaluate('e=>parseFloat(e.style.left)'))==45
 page.locator('#pause-btn').click();other.wait_for_function('window.META.videos.every(v=>v.paused)')
 times=other.evaluate('window.META.videos.map(v=>v.time)');other.wait_for_timeout(800)
 assert all(abs(a-b)<.05 for a,b in zip(times,other.evaluate('window.META.videos.map(v=>v.time)')))
 page.locator('#pause-btn').click();other.wait_for_function('window.META.videos.every(v=>!v.paused)')
 page.locator('#video-speed').fill('1.4');other.wait_for_function('window.META.state.videoLayers.at(-1).motionSpeed===1.4&&document.querySelectorAll(".video-layer video")[1].playbackRate===1.4');assert other.evaluate('document.querySelector(".video-layer video").playbackRate')==1
 print('PASS All-screen placement and multi-video pause/resume synchronize to a separate playback client',flush=True)
 with page.expect_download() as download:page.locator('#save-look').click()
 saved=json.loads(Path(download.value.path()).read_text(encoding='utf-8'));assert len(saved['videoLayers'])==2 and not saved['editVideos']
 page.locator('#no-video').click();page.locator('#look-file').set_input_files({'name':'look.json','mimeType':'application/json','buffer':json.dumps(saved).encode()})
 wall.wait_for_function('window.META.videos.length===2')
 page.locator(f'.author-row-select[data-element-id="media:{saved["activeVideoLayer"]}"]').click();page.locator('#duplicate-video-layer').click();wall.wait_for_function('window.META.videos.length===3')
 page.locator('#remove-video-layer').click();wall.wait_for_function('window.META.videos.length===2')
 page.locator('#display-setup').evaluate('e=>e.open=true');page.locator('#add-screen').click()
 page.wait_for_function('window.METAStudio.state.screens.length===3')
 assert page.locator('#video-placement-screen option').count()==4
 new_frame=next(f for f in page.frames if 'view=screen-1' in f.url);new_frame.wait_for_function('window.META && window.META.videos.length===2')
 print('PASS Save/load, duplicate/remove and new-screen placement controls retain all layers',flush=True)
 page.locator('#clean-btn').click();assert not page.locator('#edit-video-layers').is_checked()
 page.locator('.preview-room').scroll_into_view_if_needed();page.screenshot(path=str(APP/'previews/qa-video-layers-desktop.png'),full_page=True)
 page.set_viewport_size({'width':390,'height':844});page.screenshot(path=str(APP/'previews/qa-video-layers-mobile.png'),full_page=True)
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
 assert not errors,errors
 print('PASS Clean outputs, desktop/mobile layouts and no JavaScript errors',flush=True)
 # A retained LAN snapshot must not revive an expired browser-only file.
 expired={'variant':1,'showVideo':True,'videoLayers':[{'id':'expired','fileName':'Previous session.mp4','customClip':{'url':BASE.replace('http:','blob:http:')+'/expired','name':'Previous session.mp4'},'enabled':True}]}
 page.close();urllib.request.urlopen(urllib.request.Request(BASE+'/api/state',data=json.dumps(expired).encode(),headers={'Content-Type':'application/json'})).close();reopened=b.new_context();reopened_page=reopened.new_page();reopened_page.goto(BASE+'/backgrounds/');reopened_page.wait_for_function('window.METAStudio?.state.videoLayers[0]?.fileName==="Previous session.mp4"&&!window.METAStudio.state.videoLayers[0].customClip')
 assert 'Choose file again' in reopened_page.locator('[data-play-video="expired"]').inner_text();reopened.close()
 print('PASS Expired local files in retained LAN state become relinkable instead of falsely ready',flush=True)
 remote.close();c.close();b.close()
