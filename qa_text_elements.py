"""Edit independent per-wall text, author new layers and reopen portable output."""
import base64
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parent
BASE=os.environ.get('META_STATIC_URL','http://127.0.0.1:8770/_site/')
initial={'variant':8,'branding':False,'headlines':False,'paused':True,'offset':3}
url=BASE+'#look=v1.'+base64.urlsafe_b64encode(json.dumps(initial).encode()).decode().rstrip('=')
with sync_playwright() as p:
    browser=p.chromium.launch(channel='chrome',headless=True)
    context=browser.new_context(viewport={'width':1600,'height':1200})
    page=context.new_page();errors=[]
    context.on('page',lambda pg:pg.on('pageerror',lambda e:errors.append(str(e))))
    page.on('dialog',lambda dialog:dialog.accept())
    page.goto(url);page.wait_for_function('window.METAStudio&&document.querySelector(".author-row-select[data-element-id=wall-caption-front]")')
    front=next(f for f in page.frames if 'view=front' in f.url);left=next(f for f in page.frames if 'view=left' in f.url)
    assert front.locator('#wall-caption').is_hidden()
    def select(id):
        page.locator('.author-row-select[data-element-id="'+id+'"]').click()
        page.wait_for_function('(id)=>window.METAStudio.state.activeElement===id',arg=id)
    def color(value):
        page.locator('#text-color').evaluate('(e,v)=>{e.value=v;e.dispatchEvent(new Event("input",{bubbles:true}));}',value)
    select('wall-caption-front')
    assert page.locator('#text-properties').is_visible()
    page.locator('#text-html').fill('<p>Physical <strong style="font-size:96px;font-family:Georgia">and virtual</strong> <em>together</em></p>')
    page.locator('#text-font').select_option('serif');page.locator('#text-size').fill('72');page.locator('#text-weight').fill('700');page.locator('#text-italic').check();color('#ffcc88');page.locator('#text-width').fill('55');page.locator('#text-line-height').fill('1.4');page.locator('#text-spacing').fill('0.02');page.locator('#text-opacity').fill('100')
    front.wait_for_function('document.querySelector("#wall-caption strong")?.textContent==="and virtual"')
    assert front.locator('#wall-caption').is_visible();assert left.locator('#wall-caption').is_hidden()
    style=front.locator('#wall-caption').evaluate('e=>{const s=getComputedStyle(e);return {font:s.fontFamily,weight:s.fontWeight,italic:s.fontStyle,color:s.color,size:parseFloat(s.fontSize),expected:72/2160*innerHeight}}')
    assert 'Georgia' in style['font'];assert style['weight']=='700';assert style['italic']=='italic';assert style['color']=='rgb(255, 204, 136)';assert abs(style['size']-style['expected'])<.1
    assert front.locator('#wall-caption strong').evaluate('e=>Math.abs(parseFloat(getComputedStyle(e).fontSize)-96/2160*innerHeight)<.1')
    select('wall-caption-left');page.locator('#text-html').fill('<p>함께 만드는 공간</p>');page.locator('#text-font').select_option('malgun');page.locator('#text-size').fill('58');color('#a0d0ff')
    left.wait_for_function('document.querySelector("#wall-caption").textContent.includes("함께")')
    assert 'Physical' in front.locator('#wall-caption').text_content()
    select('headline-front');page.locator('#text-html').fill('<h2>Research without distance</h2><p>Space, people, AI</p>')
    front.wait_for_function('document.querySelector("#headline h2")?.textContent==="Research without distance"')
    assert front.locator('#headline').is_visible()
    select('branding-front');page.locator('#text-html').fill('<p>KAIST <em>Metaverse</em></p>')
    front.wait_for_function('document.querySelector(".institution em")?.textContent==="Metaverse"')
    assert front.locator('#wall-logo').is_visible()
    print('PASS Independent footer, research titles and signature text with HTML and typography',flush=True)

    page.locator('#add-element-type').select_option('text');page.locator('#add-element').click()
    page.wait_for_function('document.querySelector(".author-row-select[data-element-id=object-1]")')
    select('object-1');page.locator('#text-html').fill('<p>Co-create <strong>together</strong></p>');page.locator('#text-font').select_option('host');page.locator('#text-size').fill('96');page.locator('#author-x').fill('15');page.locator('#author-y').fill('35')
    front.wait_for_function('document.querySelector("#authored-object-1 strong")?.textContent==="together"')
    select('object-1');page.keyboard.press('Control+d')
    page.wait_for_function('document.querySelector(".author-row-select[data-element-id=object-2]")')
    select('object-2');page.locator('#author-screen').select_option('left');page.locator('#text-html').fill('<p>Shared space</p>')
    left.locator('#authored-object-2').wait_for(state='visible');assert front.locator('#authored-object-2').is_hidden()
    select('object-2');page.keyboard.press('Delete');page.wait_for_function('window.METAStudio.state.authored[8].objects.length===1');page.keyboard.press('Control+z');page.wait_for_function('window.METAStudio.state.authored[8].objects.length===2')
    left.locator('#authored-object-2').wait_for(state='visible');assert left.locator('#authored-object-2').count()==1
    select('object-1');target=front.locator('#authored-object-1');box=target.bounding_box();before=page.evaluate('window.METAStudio.state.authored[8].objects[0].x');page.mouse.move(box['x']+20,box['y']+box['height']*.5);page.mouse.down();page.mouse.move(box['x']+40,box['y']+box['height']*.5+10,steps=5);page.mouse.up()
    page.wait_for_function('(x)=>window.METAStudio.state.authored[8].objects[0].x>x',arg=before)
    print('PASS New text layers, independent duplicates, cross-screen moves, delete/undo and preview drag',flush=True)

    page.locator('#text-html').fill('<p onclick="bad()">Safe <strong>content</strong></p><img src="https://invalid.example/test"><script>window.BAD=1</script><svg onload="bad()"></svg>')
    front.wait_for_function('document.querySelector("#authored-object-1").textContent==="Safe content"')
    assert front.locator('#authored-object-1 img,#authored-object-1 script,#authored-object-1 svg').count()==0
    thumb=page.evaluate('async()=>{const m=await import(new URL("look-thumbnail.js",location.href));return m.captureLookThumbnail(window.METAStudio.state);}')
    assert thumb.startswith('data:image/jpeg;base64,');(ROOT/'previews/qa-text-look-thumbnail.jpg').write_bytes(base64.b64decode(thumb.split(',')[1]))
    select('wall-caption-front');page.locator('#reset-text').click()
    front.wait_for_function('document.querySelector("#wall-caption").textContent.includes("SPACE")')
    assert page.evaluate('window.METAStudio.state.authored[8].edits["wall-caption-front"].textHtml') is None
    select('object-1');page.locator('#authoring-controls').screenshot(path=str(ROOT/'previews/qa-text-properties.png'))
    page.locator('#copy-look-link').click();page.wait_for_timeout(200)
    fresh=browser.new_context(viewport={'width':1280,'height':900});restored=fresh.new_page();restored.goto(page.url);restored.wait_for_function('window.METAStudio&&document.querySelector(".author-row-select[data-element-id=object-2]")')
    saved=restored.evaluate('window.METAStudio.state.authored[8]')
    assert saved['objects'][0]['textHtml']=='<p>Safe <strong>content</strong></p>'
    assert saved['objects'][1]['screen']=='left';assert saved['edits']['wall-caption-left']['textFont']=='malgun'
    with restored.expect_popup() as popup:restored.locator('#output-links a').first.click()
    output=popup.value;output.wait_for_function('document.querySelector("#authored-object-1 strong")?.textContent==="content"')
    assert output.locator('.element-handle,#text-properties').count()==0
    output.screenshot(path=str(ROOT/'previews/qa-text-wall.png'))
    page.set_viewport_size({'width':390,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
    assert not errors,errors
    print('PASS Safe HTML, text reset, thumbnail capture, portable typography, standalone output and mobile fit',flush=True)
    browser.close()
