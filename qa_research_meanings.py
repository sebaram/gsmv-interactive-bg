"""Actual research-composition pixels, causal motion, editor explanations and authoring."""
import base64
import hashlib
import io
import json
import os
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageFont
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parent
BASE=os.environ.get('META_STATIC_URL','http://127.0.0.1:8770/_site/').split('#')[0].split('?')[0]
ITEMS=json.loads((ROOT/'looks/research-meaning-variations.json').read_text(encoding='utf-8'))['looks']
def url(look,wall=True,view='front'):
    raw=json.dumps(look).encode();fragment=base64.urlsafe_b64encode(raw).decode().rstrip('=')
    return BASE+('wall.html?view='+view+'&capture=1&' if wall else '?')+'composition='+hashlib.sha256(raw).hexdigest()[:12]+'#look=v1.'+fragment
def image(page):
    return Image.open(io.BytesIO(base64.b64decode(page.evaluate('document.querySelector("#scene").toDataURL().split(",")[1]')))).convert('RGB')
def pose(page,time):
    page.evaluate('t=>window.META.renderAt(t)',time);page.wait_for_function('(t)=>window.META.renderedTime===t',arg=time);page.wait_for_timeout(80)

with sync_playwright() as p:
    browser=p.chromium.launch(channel='chrome',headless=True)
    context=browser.new_context(viewport={'width':1280,'height':720})
    errors=[];context.on('page',lambda page:page.on('pageerror',lambda e:errors.append(str(e))))
    page=context.new_page()
    for index,item in enumerate(ITEMS):
        variant=item['look']['variant'];page.goto(url(item['look']));page.wait_for_function('window.META&&document.body.dataset.ready==="true"')
        assert page.evaluate('window.META.state.variant')==variant
        if variant!=5:
            page.wait_for_function('window.META.elements.some(e=>e.id==="meaning-front"&&e.animated)')
            pose(page,2);apart=image(page);pose(page,13);together=image(page)
            assert max(hi for lo,hi in ImageChops.difference(apart,together).getextrema())>=4,item['name']
        pose(page,10.5 if variant in [3,7] else 13)
        page.screenshot(path=str(ROOT/f'previews/meaning-{variant+1:02}{"b" if index%2 else "a"}.jpg'),type='jpeg',quality=93)
        assert page.locator('.element-handle,.video-resize').count()==0
        print('PASS Meaning composition renders and its relational motion changes:',item['name'],flush=True)
    # The front and companion can tell complementary stories.
    page.goto(url(ITEMS[8]['look'],view='left'));page.wait_for_function('window.META&&document.body.dataset.ready==="true"')
    assert page.evaluate('window.META.state.authored[4].objects.find(o=>o.screen==="left").type')=='presence'
    context.close()
    context=browser.new_context(viewport={'width':1600,'height':1100})
    context.on('page',lambda page:page.on('pageerror',lambda e:errors.append(str(e))))
    page=context.new_page();page.goto(BASE);page.wait_for_function('window.METAStudio&&document.querySelector("#scene-meaning")')
    page.locator('[data-variant="0"]').click();page.locator('#scene-meaning').evaluate('e=>e.open=true')
    assert 'Original atmospheric' in page.locator('#meaning-mode').text_content()
    assert page.locator('#meaning-sources a').count()==2
    page.locator('#meaning-variation').select_option('1');page.locator('#load-research-look').click()
    page.wait_for_function('window.METAStudio.state.authored[0]?.objects.some(o=>o.type==="presence")')
    assert 'active' in page.locator('#meaning-mode').text_content()
    page.locator('.author-row-select[data-element-id="meaning-front"]').click()
    page.locator('#speed').fill('0');front=next(f for f in page.frames if 'view=front' in f.url)
    front.wait_for_function('window.META.state.authored[0].objects.find(o=>o.id==="meaning-front").motionSpeed===0')
    page.wait_for_timeout(120);held=front.evaluate('window.META.elements.find(e=>e.id==="meaning-front").clock.time');page.wait_for_timeout(400)
    assert front.evaluate('window.META.elements.find(e=>e.id==="meaning-front").clock.time')==held
    page.locator('.author-row-select[data-element-id="meaning-front"]').click();page.keyboard.press('Control+d')
    page.wait_for_function('window.METAStudio.state.authored[0].objects.length===3')
    page.locator('.author-row-select[data-element-id="object-1"]').click()
    page.keyboard.press('Delete');page.wait_for_function('window.METAStudio.state.authored[0].objects.length===2');page.keyboard.press('Control+z');page.wait_for_function('window.METAStudio.state.authored[0].objects.length===3')
    page.locator('#scene-meaning').screenshot(path=str(ROOT/'previews/qa-meaning-panel.png'))
    page.set_viewport_size({'width':390,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
    assert not errors,errors;browser.close()
    print('PASS Editor research loading, sourced meaning, independent clocks, duplicate/delete/undo and mobile layout',flush=True)

font=lambda size,bold=False:ImageFont.truetype('C:/Windows/Fonts/'+('seguisb.ttf' if bold else 'segoeui.ttf'),size)
sheet=Image.new('RGB',(1680,4100),'#10171c');draw=ImageDraw.Draw(sheet)
draw.text((40,25),'Meaning / research-inspired interview collection',font=font(33,True),fill='#e5edf0')
draw.text((40,80),'16 interpretations / shared presence, space, response and creation / 4.44 x 2.5 m wall',font=font(20),fill='#a8bcc8')
for index,item in enumerate(ITEMS):
    variant=item['look']['variant'];x,y=40+(index%2)*820,145+(index//2)*490
    draw.text((x,y),item['name'],font=font(20,True),fill='#e5edf0')
    preview=Image.open(ROOT/f'previews/meaning-{variant+1:02}{"b" if index%2 else "a"}.jpg').resize((780,439),Image.Resampling.LANCZOS)
    sheet.paste(preview,(x,y+34))
sheet.save(ROOT/'previews/meaning-variations.jpg',quality=93)
print('PASS Meaning comparison sheet saved',flush=True)
