"""Kinetic preset selection, visual insertion and physical-screen layer groups."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE=os.environ.get('META_STATIC_URL','http://127.0.0.1:8770/_site/')
ROOT=Path(__file__).resolve().parent
with sync_playwright() as p:
    browser=p.chromium.launch(channel='chrome',headless=True)
    context=browser.new_context(viewport={'width':1600,'height':1200})
    page=context.new_page();errors=[]
    context.on('page',lambda pg:pg.on('pageerror',lambda e:errors.append(str(e))))
    page.goto(BASE);page.wait_for_function('window.METAStudio&&document.querySelectorAll("[data-variant]").length===12')
    for variant in range(8,12):
        page.locator(f'[data-variant="{variant}"]').click()
        page.wait_for_function('(v)=>window.METAStudio.state.variant===v&&Array.from(document.querySelectorAll(".paired iframe")).every(f=>f.contentWindow.META?.state.variant===v)',arg=variant)
        assert page.locator(f'[data-variant="{variant}"]').get_attribute('aria-pressed')=='true'
        assert page.locator('#current-name').text_content()==['Co-presence','Shared coordinates','Mutual response','Co-creation'][variant-8]
        assert page.locator('.meaning-actions').is_hidden()
        for frame in [f for f in page.frames if 'wall.html' in f.url]:
            frame.wait_for_function('window.META.elements.some(e=>e.id==="preset-main"&&e.animated)')
        page.locator('.author-row-select[data-element-id="preset-main"]').click()
        page.locator('#author-size').fill('0.85')
    page.locator('[data-variant="8"]').click()
    page.wait_for_function('window.METAStudio.state.variant===8')
    assert page.evaluate('window.METAStudio.state.authored[8].edits["preset-main"].size')==.85
    print('PASS Four independent kinetic preset cards keep per-preset edits',flush=True)

    page.locator('.element-gallery>summary').click()
    choices=page.locator('[data-add-type]');assert choices.count()==11
    page.wait_for_function('Array.from(document.querySelectorAll(".element-gallery-item img")).every(i=>i.complete&&i.naturalWidth>0)')
    page.locator('.element-gallery').screenshot(path=str(ROOT/'previews/qa-element-gallery.png'))
    page.locator('[data-add-type="registration"]').click()
    page.wait_for_function('window.METAStudio.state.authored[8].objects.some(o=>o.type==="registration")')
    page.wait_for_function('document.querySelector(".author-row-select[data-element-id=object-1]")')
    assert page.locator('.element-gallery').get_attribute('open') is None
    page.keyboard.press('Insert')
    page.wait_for_function('window.METAStudio.state.authored[8].objects.length===2')
    page.locator('.element-gallery>summary').click();page.locator('[data-add-type="video"]').click()
    page.wait_for_function('window.METAStudio.state.videoLayers.length===1')
    assert page.locator('.author-screen-group[data-screen-id="unassigned"]').count()==1
    print('PASS All eleven thumbnails load, visual insertion and Insert add the chosen type',flush=True)

    front=page.locator('.author-screen-group[data-screen-id="front"]')
    left=page.locator('.author-screen-group[data-screen-id="left"]')
    assert 'Front LED wall' in front.locator('.author-screen-toggle').text_content()
    assert 'Left tiled wall' in left.locator('.author-screen-toggle').text_content()
    assert front.locator('.author-row-select[data-element-id="preset-main"]').count()==1
    assert left.locator('.author-row-select[data-element-id="preset-companion"]').count()==1
    front.locator('.author-screen-toggle').click()
    assert front.locator('.author-row-select').count()==0
    page.evaluate('window.METAStudio.selectElement("preset-main")')
    front.locator('.author-row-select[data-element-id="preset-main"]').wait_for(state='visible')
    assert front.locator('.author-screen-toggle').get_attribute('aria-expanded')=='true'
    page.locator('#element-search').fill('Left tiled wall')
    assert page.locator('.author-screen-group[data-screen-id="front"]').count()==0, page.evaluate('({search:document.querySelector("#element-search").value,rows:[...document.querySelectorAll(".author-screen-group[data-screen-id=front] .author-row-select")].map(e=>e.title)})')
    assert page.locator('.author-screen-group[data-screen-id="left"] .author-row-select').count()>0
    page.locator('#element-search').fill('')
    page.locator('.author-row-select[data-element-id="object-1"]').click()
    page.locator('#author-screen').select_option('left')
    page.wait_for_function('document.querySelector(".author-screen-group[data-screen-id=left] .author-row-select[data-element-id=object-1]")')
    page.locator('#authoring-controls').screenshot(path=str(ROOT/'previews/qa-screen-layer-groups.png'))
    print('PASS Screen parent rows, collapse/reveal, search and moving elements between screens',flush=True)
    page.locator('#clear-local-video').click()
    page.wait_for_function('document.querySelector(".author-screen-group[data-screen-id=all]")')
    assert 'Shared across screens' in page.locator('.author-screen-group[data-screen-id="all"]').text_content()
    print('PASS Multi-screen videos have an explicit shared parent',flush=True)

    # The new preset is self-contained and portable to a fresh browser context.
    page.locator('#copy-look-link').click();page.wait_for_function('location.hash.startsWith("#look=")')
    fresh=browser.new_context(viewport={'width':390,'height':844});restored=fresh.new_page();restored.goto(page.url)
    restored.wait_for_function('window.METAStudio&&window.METAStudio.state.variant===8')
    assert restored.evaluate('window.METAStudio.state.authored[8].objects.length')==2
    assert restored.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
    restored.locator('.element-gallery>summary').click()
    restored.locator('.element-gallery').screenshot(path=str(ROOT/'previews/qa-element-gallery-mobile.png'))
    assert not errors,errors
    print('PASS Portable kinetic preset, screen assignments and mobile fit',flush=True)
    browser.close()
