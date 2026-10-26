"""Smoke-check the public bundle under a project subpath, without the LAN API."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright
BASE=os.environ.get('META_STATIC_URL','http://127.0.0.1:8770/_site/')
APP=Path(__file__).resolve().parent
with sync_playwright() as p:
    browser=p.chromium.launch(channel='chrome',headless=True)
    context=browser.new_context(viewport={'width':1440,'height':900},device_scale_factor=1)
    page=context.new_page();errors=[];api=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('request',lambda r:api.append(r.url) if '/api/' in r.url else None)
    page.goto(BASE)
    page.wait_for_function("document.querySelector('#network-status').textContent==='Browser playback'")
    page.wait_for_function("document.querySelectorAll('.paired iframe').length===2")
    assert page.locator('#local-video-controls').is_visible()
    for frame in page.frames[1:]:
        frame.wait_for_function('window.META && window.META.video && window.META.video.ready>=2')
        assert not frame.locator('#error').is_visible()
    print('PASS Public project-path editor loads with demo video and no server',flush=True)
    with page.expect_popup() as opened:page.locator('#output-links a').first.click()
    wall=opened.value;wall.on('pageerror',lambda e:errors.append(str(e)))
    wall.wait_for_function('window.META && window.META.video && window.META.video.ready>=2')
    assert '_site/wall.html' in wall.url or 'gsmv-interactive-bg/wall.html' in wall.url
    page.locator('#pause-btn').click();wall.wait_for_function('window.META.state.paused')
    page.locator('#pause-btn').click();wall.wait_for_function('!window.META.state.paused')
    print('PASS Public output opens at the correct subpath and follows controls',flush=True)
    page.locator('[data-variant="5"]').click();wall.wait_for_function('window.META.state.variant===5 && !window.META.video')
    page.locator('#video-search').fill('P2-S5-01');page.locator('[data-preview-video="P2-S5-01"]').click()
    assert page.locator('#video-poster').is_visible()
    assert 'AquaHaptics' in page.locator('#video-title').inner_text()
    source=next((APP.parent/'output'/'clips').glob('P2-S5-01*'))
    with page.expect_file_chooser() as selected:page.locator('#use-video').click()
    selected.value.set_files(source)
    wall.wait_for_function('window.META.state.customClip && window.META.video && window.META.video.ready>=2')
    assert wall.evaluate('window.META.state.customClip.url').startswith('blob:')
    assert not wall.locator('#error').is_visible()
    assert wall.evaluate('window.META.state.variant')==5
    print('PASS Research video selected locally plays in the public wall output',flush=True)
    page.locator('#clear-local-video').click();wall.wait_for_function('!window.META.state.customClip && window.META.video && window.META.video.ready>=2')
    assert not api,api
    assert not errors,errors
    page.screenshot(path=str(APP/'previews'/'public-studio.png'),full_page=True)
    print('PASS Demo restore, no API calls and no JavaScript errors',flush=True)
    context.close()
    reduced=browser.new_context(viewport={'width':1280,'height':800},reduced_motion='reduce')
    page=reduced.new_page();page.goto(BASE);page.wait_for_timeout(1500)
    frame=page.frames[1];frame.wait_for_function('window.META && window.META.stats.reducedMotion')
    assert frame.evaluate('window.META.video.paused')
    page.locator('#motion-demo').click();frame.wait_for_function('!window.META.stats.reducedMotion && !window.META.video.paused')
    print('PASS Reduced-motion preference is respected until explicit playback',flush=True)
    reduced.close();browser.close()
