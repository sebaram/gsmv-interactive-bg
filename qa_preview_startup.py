"""A preview delayed during module startup must adopt the latest editor state."""
import os
from playwright.sync_api import sync_playwright

BASE=os.environ.get('META_STATIC_URL','http://127.0.0.1:8770/_site/')
with sync_playwright() as p:
    browser=p.chromium.launch(channel='chrome',headless=True)
    context=browser.new_context(viewport={'width':1600,'height':1100})
    pending=[]
    def route(request):
        if 'view=left' in request.request.frame.url:pending.append(request)
        else:request.continue_()
    context.route('**/clips.json*',route)
    page=context.new_page();page.goto(BASE);page.wait_for_function('window.METAStudio')
    for _ in range(40):
        if pending:break
        page.wait_for_timeout(50)
    assert pending,'The left preview must be held before its startup handlers exist'
    page.locator('[data-variant="8"]').click()
    assert page.evaluate('window.METAStudio.state.variant')==8
    for request in pending:request.fulfill(response=request.fetch())
    page.wait_for_function('Array.from(document.querySelectorAll(".paired iframe")).every(f=>f.contentWindow.META?.state.variant===8&&f.contentDocument.body.dataset.ready==="true")',timeout=10000)
    print('PASS Delayed left preview adopts the latest preset before its first ready frame',flush=True)
    browser.close()
