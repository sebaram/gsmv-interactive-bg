"""Verify motion, network clients and configurable screens on an isolated server."""
import io
import json
import os
from pathlib import Path
import time
import urllib.request
import urllib.error
import urllib.parse
from PIL import Image, ImageChops
from playwright.sync_api import sync_playwright

BASE=os.environ.get('META_QA_URL','http://127.0.0.1:8766')
APP=Path(__file__).resolve().parent
OUT=APP/'previews'
OUT.mkdir(exist_ok=True)
checks=[]

def check(name,condition):
    assert condition,name
    checks.append(name)
    print('PASS',name,flush=True)

def wait(page,expression):
    page.wait_for_function(expression,timeout=30000)

def post(state):
    req=urllib.request.Request(BASE+'/api/state',data=json.dumps(state).encode(),headers={'Content-Type':'application/json'})
    with urllib.request.urlopen(req) as r: assert r.status==200

def image(page):
    return Image.open(io.BytesIO(page.locator('#scene').screenshot())).convert('RGB')

def changed(a,b):
    d=ImageChops.difference(a,b)
    return sum(max(rgb)>12 for rgb in d.get_flattened_data())/(a.width*a.height)

# This test server is separate from the user's active port 8765.
post({'variant':4,'cue':0,'showVideo':True,'paused':False,'epoch':time.time()*1000,'offset':0,'speed':1,'motionAmount':1,'brightness':70,'headlines':False,'branding':True})
with sync_playwright() as p:
    browser=p.chromium.launch(channel='chrome',headless=True,args=['--autoplay-policy=no-user-gesture-required'])
    errors=[]
    controller=browser.new_context(viewport={'width':1600,'height':1000},device_scale_factor=1)
    # Test that preview iframes inherit the controller's corrected server clock.
    controller.add_init_script('const nativeNow=Date.now.bind(Date);Date.now=()=>nativeNow()+120000;')
    page=controller.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(BASE+'/backgrounds/')
    wait(page,"document.querySelector('#network-status').textContent.toLowerCase()==='network ready'")
    check('All six directions are selectable',page.locator('[data-variant]').count()==6)
    clients=[]
    for view,skew,width,height in [('front',-90000,960,540),('left',70000,960,360)]:
        context=browser.new_context(viewport={'width':width,'height':height},device_scale_factor=1)
        context.add_init_script(f'const nativeNow=Date.now.bind(Date);Date.now=()=>nativeNow()+({skew});')
        wall=context.new_page();wall.on('pageerror',lambda e:errors.append(str(e)))
        wall.goto(BASE+'/backgrounds/wall.html?view='+view)
        wait(wall,"window.META && document.body.dataset.ready==='true'")
        clients.append((context,wall))
    front,left=clients[0][1],clients[1][1]
    page.wait_for_timeout(700)
    for i in range(6):
        page.locator(f'[data-variant="{i}"]').click()
        for wall in [front,left]:wait(wall,f'window.META.state.variant==={i}')
        check(f'Style {i+1} reaches both independent clients',all(w.evaluate('window.META.state.variant')==i for w in [front,left]))
    page.locator('[data-variant="4"]').click()
    wait(front,'window.META.video && window.META.video.ready>=2')
    wait(left,'window.META.video && window.META.video.ready>=2')
    check('Combined style plays muted research on both walls',front.evaluate('window.META.video.muted') and left.evaluate('window.META.video.muted'))
    t1=front.evaluate('window.META.time');t2=left.evaluate('window.META.time')
    check('Clock correction aligns independent machines',abs(t1-t2)<.35)
    preview=page.frames[1]
    pt=preview.evaluate('window.META.time')
    check('Preview inherits the corrected clock from skewed controller',abs(pt-front.evaluate('window.META.time'))<.4)
    wait(page,"document.querySelector('#playback-status').textContent.includes('Playing')")
    check('Live playback indicator reports rendering', 'fps' in page.locator('#playback-status').inner_text())
    for style in [1,3,4]:
        page.locator(f'[data-variant="{style}"]').click()
        for wall in [front,left]:wait(wall,f'window.META.state.variant==={style}')
        for name,wall in [('front',front),('left',left)]:
            wall.wait_for_timeout(350)
            a=image(wall);start=wall.evaluate('window.META.time');wall.wait_for_timeout(1300);b=image(wall)
            fraction=changed(a,b)
            check(f'Visible pixel motion: style {style+1} / {name} ({fraction:.1%})',fraction>.005 and wall.evaluate('window.META.time')>start+.7)
    page.locator('[data-variant="1"]').click();wait(front,'window.META.state.variant===1')
    page.locator('#pause-btn').click();wait(front,'window.META.state.paused')
    front.wait_for_timeout(200);a=image(front);front.wait_for_timeout(300);b=image(front)
    check('Pause freezes rendered pixels',a.tobytes()==b.tobytes())
    page.locator('#motion-demo').click();wait(front,'!window.META.state.paused && window.META.state.speed===1 && window.META.state.motionAmount===1.3')
    check('Show visible motion resumes and resets movement controls',not front.evaluate('window.META.state.paused'))
    page.locator('#motionAmount').fill('0');wait(front,"document.body.dataset.motionAmount==='0'")
    front.wait_for_timeout(100);a=image(front);before=front.evaluate('({amount:window.META.state.motionAmount,variant:window.META.state.variant,time:window.META.time})');front.wait_for_timeout(300);b=image(front)
    # GPU rounding can change isolated channel values by one, without movement.
    delta=ImageChops.difference(a,b)
    check('Zero movement holds decorative output within GPU rounding',max(hi for lo,hi in delta.getextrema())<=1)
    page.locator('#motionAmount').fill('1')
    page.locator('#brightness').fill('45');wait(left,'window.META.state.brightness===45')
    check('Brightness updates both outputs',front.locator('#art').evaluate('e=>e.style.filter')=='brightness(0.45)')
    page.locator('#branding').uncheck();wait(front,'!window.META.state.branding')
    check('Department signature toggles',not front.locator('#branding').is_visible())
    page.locator('#branding').check();page.locator('#headlines').check();wait(front,'window.META.state.headlines')
    check('Bilingual research titles toggle',front.locator('#headline').is_visible())
    page.locator('#guide-btn').click();wait(front,'window.META.state.guide')
    check('Subject guide displays',front.locator('#frame-guide').is_visible())
    page.locator('#interactive').check();wait(front,'window.META.state.interactive')
    check('Pointer interaction is configurable',front.evaluate('window.META.state.interactive'))

    page.locator('#display-setup summary').click()
    def configure(id,patch):
        row=page.locator(f'[data-screen="{id}"]')
        if 'mode' in patch:row.locator('[data-field="mode"]').select_option(patch['mode'])
        for key,value in patch.items():
            if key=='mode':continue
            field=row.locator(f'[data-field="{key}"]')
            if isinstance(value,bool):field.set_checked(value)
            else:field.fill(str(value))
        row.locator('[data-action="apply"]').click()
    configure('front',{'name':'Front wide LED','width':4096,'height':2160,'mode':'custom','aspectW':21,'aspectH':9,'cols':5,'rows':2,'grid':True})
    wait(front,"window.META.state.screens.find(s=>s.id==='front').aspectW===21")
    check('Front has editable resolution, custom physical ratio and 5 by 2 grid',front.locator('#tile-grid').is_visible() and front.locator('#tile-grid').evaluate('e=>e.style.backgroundSize')=='20% 50%')
    configure('left',{'mode':'tiles','cols':4,'rows':3,'tileW':16,'tileH':9,'grid':True})
    wait(left,"window.META.state.screens.find(s=>s.id==='left').cols===4")
    check('Left has an independent arbitrary tile layout',left.locator('#tile-grid').evaluate('e=>e.style.backgroundSize').startswith('25% 33.3333'))
    page.locator('#calibration').check();wait(left,'window.META.state.calibration')
    check('Calibration follows each screen dimensions',front.locator('.cal-circle').is_visible() and '4096' in front.locator('#cal-label').inner_text())
    page.locator('#add-screen').click()
    check('Adding a screen creates preview, setup and output link',page.locator('.screen-config').count()==3 and page.locator('.paired iframe').count()==3 and page.locator('#output-links a').count()==3)
    extra_id=page.locator('.screen-config').last.get_attribute('data-screen')
    configure(extra_id,{'name':'Portrait research','width':2160,'height':3840,'mode':'custom','aspectW':9,'aspectH':16,'cols':2,'rows':3,'grid':True})
    extra_context=browser.new_context(viewport={'width':405,'height':720})
    extra=extra_context.new_page();extra.on('pageerror',lambda e:errors.append(str(e)));extra.goto(BASE+'/backgrounds/wall.html?view='+extra_id)
    wait(extra,'window.META && document.body.dataset.ready==="true"')
    check('Added portrait screen has a working independent output',extra.evaluate(f'window.META.state.screens.find(s=>s.id==="{extra_id}").name')=='Portrait research')
    page.locator('[data-variant="4"]').click();wait(extra,'window.META.state.variant===4 && window.META.video && window.META.video.ready>=2')
    check('Combined research also plays on the added screen',extra.evaluate('window.META.video.muted'))
    page.locator(f'[data-screen="{extra_id}"] [data-action="up"]').click()
    wait(front,f'window.META.state.screens[1].id==="{extra_id}"')
    check('Screen reordering propagates without changing output identity',extra.evaluate(f'window.META.state.screens[1].id==="{extra_id}"'))
    page.locator('#clean-btn').click();wait(left,'!window.META.state.calibration && !window.META.state.guide && window.META.state.screens.every(s=>!s.grid)')
    check('Clean take clears grids for every screen',not extra.locator('#tile-grid').is_visible())
    clip_ids=['P2-S1-02','P2-S2-02','P2-S3-01','P2-S4-01','P2-S5-01']
    for cue,clip_id in enumerate(clip_ids):
        page.locator('#video-search').fill(clip_id)
        page.locator(f'[data-preview-video="{clip_id}"]').click()
        page.locator('#no-video').click();page.locator('#use-video').click()
        for wall in [front,left]:wait(wall,f'window.META.state.cue==={cue} && window.META.video && window.META.video.ready>=2')
        check(f'Video selection {cue+1} plays on both walls',not front.locator('#error').is_visible() and not left.locator('#error').is_visible())
    page.locator('#no-video').click();wait(front,'!window.META.state.showVideo && !window.META.video')
    check('No video produces a procedural-only background',front.evaluate('window.META.video') is None)
    with page.expect_download() as download:page.locator('#save-look').click()
    look=OUT/'qa-look.json';download.value.save_as(look)
    data=json.loads(look.read_text())
    check('Saved look includes all screen layouts',len(data['screens'])==3 and data['screens'][1]['aspectW']==9)
    page.locator('[data-variant="1"]').click();page.locator('#look-file').set_input_files(look);look.unlink()
    wait(front,'window.META.state.variant===4 && window.META.state.cue===4')
    check('Imported look restores style and screens',len(front.evaluate('window.META.state.screens'))==3)
    page.locator(f'[data-screen="{extra_id}"] [data-action="remove"]').click();wait(front,'window.META.state.screens.length===2')
    check('Removing a screen updates previews and outputs',page.locator('.paired iframe').count()==2 and page.locator('#output-links a').count()==2)
    wait(extra,"document.querySelector('#error').textContent.includes('removed')")
    check('Removed outputs clearly report their status',extra.locator('#error').is_visible())
    extra_context.close()
    configure('front',{'name':'Front LED wall','width':3840,'height':2160,'mode':'raster','cols':1,'rows':1,'grid':False})
    configure('left',{'cols':3,'rows':2,'grid':False})
    page.locator('#video-search').fill('P2-S1-02');page.locator('[data-preview-video="P2-S1-02"]').click();page.locator('#use-video').click();page.locator('#video-search').fill('');page.locator('#brightness').fill('70');page.locator('#headlines').uncheck()
    page.locator('#motion-demo').click();page.locator('#motionAmount').fill('1')
    page.locator('#display-setup summary').click()
    page.wait_for_timeout(700)
    front.locator('#scene').click(position={'x':20,'y':20});front.wait_for_timeout(300)
    check('Fullscreen hides output hint',front.evaluate('!!document.fullscreenElement') and front.locator('#hint').evaluate('e=>getComputedStyle(e).opacity')=='0')
    for context,wall in clients:context.close()
    page.wait_for_timeout(3000)
    page.screenshot(path=str(OUT/'studio.png'),full_page=True)
    mobile=browser.new_context(viewport={'width':390,'height':844});m=mobile.new_page();m.on('pageerror',lambda e:errors.append(str(e)));m.goto(BASE+'/backgrounds/');m.wait_for_timeout(1000)
    m.locator('#display-setup summary').click()
    check('Screen editor and controls fit a narrow viewport',m.evaluate('document.documentElement.scrollWidth<=innerWidth'))
    m.screenshot(path=str(OUT/'studio-mobile.png'),full_page=True);mobile.close()
    check('No JavaScript errors across all checks',not errors)
    controller.close();browser.close()

for path in ['/output/clips.csv','/backgrounds/.git/config']:
    try:urllib.request.urlopen(BASE+path);check('Restricted route '+path,False)
    except urllib.error.HTTPError as e:check('Restricted route '+path,e.code==404)
clips=json.loads((APP/'clips.json').read_text(encoding='utf-8'))
url=BASE+'/output/clips/'+urllib.parse.quote(clips[0]['url'].split('/')[-1])
with urllib.request.urlopen(urllib.request.Request(url,headers={'Range':'bytes=0-127'})) as response:
    check('Local research video supports precise byte ranges',response.status==206 and len(response.read())==128)
(APP/'QA.md').write_text('# Verification\n\nGoogle Chrome through Python Playwright; test server '+BASE+'.\n\n'+'\n'.join('- PASS: '+name for name in checks)+'\n\nAlso run: `npm test` (27 motion, logo geometry, video-selection, screen-state, migration, timeline and public-bundle tests). Independent browser contexts and deliberately skewed clocks exercise network synchronization. Actual display mapping, camera exposure and separate physical machines require on-set validation.\n',encoding='utf-8')
print(str(len(checks))+' browser/server checks passed',flush=True)
