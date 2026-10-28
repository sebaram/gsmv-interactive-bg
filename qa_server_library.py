"""Real browser checks of the hosted library, using isolated local data."""
from pathlib import Path
import tempfile
import threading
from http.server import ThreadingHTTPServer

from playwright.sync_api import sync_playwright
import serve
from server_storage import Storage, password_hash

APP = Path(__file__).resolve().parent


def check(base, password, page, browser):
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('dialog', lambda dialog: dialog.accept())
    page.goto(base)
    page.locator('#server-login').wait_for()
    page.wait_for_function('window.METAStudio')
    assert page.locator('.backgrounds > .server-library').count() == 1
    assert page.locator('.server-library h4').text_content() == 'Saved looks'
    page.wait_for_function('document.querySelector(".server-library").getAttribute("aria-busy")==="false"')
    assert '0 saved looks' in page.locator('#server-project-count').text_content()
    page.locator('#admin-password').fill(password)
    page.locator('#server-login button').click()
    page.locator('#server-project-admin').wait_for(state='visible')
    assert page.locator('#admin-password').input_value() == ''
    page.locator('#server-video-file').set_input_files({
        'name': 'Library test.mp4', 'mimeType': 'video/mp4',
        'buffer': (APP / 'previews/demo-motion.mp4').read_bytes()})
    page.locator('[data-server-video]').wait_for()
    page.locator('[data-server-video]').first.click()
    page.wait_for_function('window.METAStudio.state.videoLayers[0]?.customClip?.url.startsWith("/media/")')
    page.locator('[data-variant="5"]').click()
    page.locator('#server-project-name').fill('Browser library check')
    page.locator('#server-save').click()
    page.wait_for_function('document.querySelector("#server-project").value.length===32')
    project_id = page.locator('#server-project').input_value()
    record = page.request.get(base+'api/projects/'+project_id).json()
    assert record['origin'] == 'editor'
    assert record['thumbnail'].startswith('data:image/jpeg;base64,')
    page.wait_for_function('document.querySelector("#saved-look-cards img")?.naturalWidth===480')
    assert page.locator('#saved-look-cards [data-saved-look="'+project_id+'"]').count() == 1
    page.locator('#server-project-name').fill('Renamed library check')
    page.locator('#server-rename').click()
    page.wait_for_function('document.querySelector("#server-project option:checked").textContent==="Renamed library check"')
    assert page.request.get(base+'api/projects/'+project_id).json()['thumbnail'] == record['thumbnail']
    page.locator('#brightness').fill('55')
    page.locator('#server-update').click()
    page.wait_for_function('!document.querySelector("#server-update").disabled')
    assert page.request.get(base+'api/projects/'+project_id).json()['thumbnail'] != record['thumbnail']
    page.locator('[data-variant="0"]').click()
    page.locator('#server-load').click()
    page.wait_for_function('window.METAStudio.state.variant===5')
    assert page.evaluate('window.METAStudio.state.brightness') == 55
    print('PASS Admin login, video upload, named look save/rename/load', flush=True)
    fresh = browser.new_context(viewport={'width': 1440, 'height': 1000})
    public = fresh.new_page()
    public.on('pageerror', lambda error: errors.append(str(error)))
    public.goto(base)
    public.locator('#server-project option[value="' + project_id + '"]').wait_for(state='attached')
    assert public.locator('#server-login').is_visible()
    assert public.locator('#server-project-admin').is_hidden()
    retry = fresh.new_page()
    retry.route('**/api/session', lambda route: route.fulfill(status=503, body='{}'))
    retry.goto(base)
    retry.get_by_role('button', name='Retry loading').wait_for()
    retry.unroute('**/api/session')
    retry.get_by_role('button', name='Retry loading').click()
    retry.locator('#server-project option[value="' + project_id + '"]').wait_for(state='attached')
    retry.close()
    public.locator('#server-project').select_option(project_id)
    public.locator('#server-load').click()
    public.wait_for_function('window.METAStudio?.state.variant===5 && window.METAStudio.state.videoLayers[0]?.customClip?.url.startsWith("/media/")')
    assert public.evaluate('window.METAStudio.state.brightness') == 55
    with public.expect_popup() as opened:
        public.locator('#output-links a').first.click()
    output = opened.value
    output.wait_for_function('window.META?.videos.some(v=>v.ready>=2)')
    assert output.locator('.element-handle,.video-resize').count() == 0
    print('PASS Fresh unauthenticated browser loads saved look and plays server video', flush=True)
    page.set_viewport_size({'width': 390, 'height': 844})
    page.locator('.server-library').scroll_into_view_if_needed()
    page.screenshot(path=str(APP / 'previews/qa-server-library-mobile.png'))
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+1')
    page.set_viewport_size({'width': 1440, 'height': 1000})
    page.locator('.server-library').scroll_into_view_if_needed()
    page.screenshot(path=str(APP / 'previews/qa-server-library-desktop.png'))
    page.locator('#server-delete').click()
    page.wait_for_function('document.querySelector("#server-project").options.length===1')
    page.locator('#server-media-items button[aria-label^="Delete server video"]').click()
    page.wait_for_function('document.querySelectorAll("[data-server-video]").length===0')
    page.locator('#server-logout').click()
    page.locator('#server-login').wait_for(state='visible')
    assert not errors, errors
    fresh.close()
    print('PASS Desktop/mobile bounds, look/media deletion, logout and no JS errors', flush=True)


with tempfile.TemporaryDirectory() as temporary:
    server = ThreadingHTTPServer(('127.0.0.1', 0), serve.Handler)
    origin = 'http://127.0.0.1:' + str(server.server_port)
    server.site_dir = (APP / '_site').resolve()
    server.storage = Storage(Path(temporary), password_hash('local-browser-test'), origin)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(channel='chrome', headless=True)
            page = browser.new_page(viewport={'width': 1440, 'height': 1000})
            check(origin + '/', 'local-browser-test', page, browser)
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
        thread.join()
