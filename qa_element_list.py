"""Exercise the searchable element hierarchy, CRUD, selection sync and focus."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = os.environ.get('META_STATIC_URL', 'http://127.0.0.1:8770/_site/')
APP = Path(__file__).resolve().parent
with sync_playwright() as p:
    browser = p.chromium.launch(channel='chrome', headless=True)
    context = browser.new_context(viewport={'width': 1600, 'height': 1100})
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(BASE)
    page.wait_for_function('window.METAStudio && document.querySelectorAll("#author-element option").length > 0')
    assert page.locator('#element-search').count() == 1, 'A visible searchable element list is required'
    page.locator('[data-variant="3"]').click()
    page.wait_for_function('window.METAStudio.state.variant === 3 && [...document.querySelectorAll(".paired iframe")].every(f => f.contentWindow.META?.state.variant === 3)')
    page.wait_for_function('document.querySelector("#author-element").options.length === document.querySelector(".paired iframe").contentWindow.META.elements.length')
    elements = page.evaluate('document.querySelector(".paired iframe").contentWindow.META.elements')
    first = next(e for e in elements if e.get('parentId'))
    root, part = first['parentId'], first['id']
    second = next(e['id'] for e in elements if e.get('parentId') == root and e['id'] != part)
    total = page.locator('#author-element option').count()
    assert page.locator('.author-row-select:visible').count() < total
    page.locator(f'.author-disclosure[data-element-id="{root}"]').click()
    page.locator(f'.author-row-select[data-element-id="{part}"]').wait_for(state='visible')
    page.locator(f'.author-disclosure[data-element-id="{root}"]').click()
    page.locator('#element-search').fill(part)
    page.locator(f'.author-row-select[data-element-id="{part}"]').wait_for(state='visible')
    assert page.locator(f'.author-row-select[data-element-id="{root}"]').is_visible()
    assert page.locator('.author-row-select:visible').count() < total
    page.locator(f'.author-row-select[data-element-id="{part}"]').click()
    page.wait_for_function('(id) => window.METAStudio.state.activeElement === id && document.querySelector("#author-element").value === id', arg=part)
    assert page.locator('#mv-variation').is_hidden()
    page.locator('#element-search').focus()
    page.wait_for_timeout(1300)
    assert page.locator('#element-search').evaluate('e => document.activeElement === e')
    page.locator(f'.author-visibility[data-element-id="{part}"]').click()
    page.wait_for_function('(id) => window.METAStudio.state.authored[3].edits[id].visible === false', arg=part)
    assert page.locator(f'.author-row-select[data-element-id="{part}"]').get_attribute('aria-pressed') == 'true'
    assert page.locator(f'.author-visibility[data-element-id="{part}"]').inner_text() == 'Show'
    page.locator('#clear-element-selection').click()
    page.wait_for_timeout(1300)
    assert page.evaluate('window.METAStudio.state.activeElement === null')
    assert page.locator('#author-x').is_disabled()
    assert page.locator('#randomize-mv').is_disabled()
    assert page.locator('.author-row-select[aria-pressed="true"]').count() == 0
    print('PASS Collapsed hierarchy, nested search context, selection, visibility, clear selection and stable search focus', flush=True)

    # Programmatic canvas selection reveals the selected part and its parents.
    page.evaluate('(id) => window.METAStudio.selectElement(id)', second)
    page.locator(f'.author-row-select[data-element-id="{second}"]').wait_for(state='visible')
    assert page.locator(f'.author-row-select[data-element-id="{second}"]').get_attribute('aria-pressed') == 'true'
    page.locator('#author-x').focus()
    page.wait_for_timeout(1300)
    assert page.locator('#author-x').evaluate('e => document.activeElement === e')
    page.locator('#duplicate-element').click()
    page.wait_for_function('document.querySelector("#author-element").value === "object-1"')
    page.locator('.author-row-select[data-element-id="object-1"]').wait_for(state='visible')
    page.locator('#remove-element').click()
    page.wait_for_function('!document.querySelector(".author-row-select[data-element-id=object-1]")')
    page.locator('#add-element-type').select_option('logo')
    page.locator('#add-element').click()
    page.wait_for_function('document.querySelector("#author-element").value === "object-1"')
    page.locator('.author-row-select[data-element-id="object-1"]').wait_for(state='visible')
    page.locator('#mv-seed').wait_for(state='visible')
    before = page.locator('#mv-seed').input_value()
    page.locator('#randomize-mv').click()
    page.wait_for_function('(before) => document.querySelector("#mv-seed").value !== before', arg=before)
    page.locator('#mv-randomness').fill('1.5')
    page.wait_for_function('window.METAStudio.state.authored[3].objects[0].randomness === 1.5')
    print('PASS Canvas selection reveals nested parts, input focus persists, duplicate/remove/add and MV variation controls work', flush=True)

    page.locator('#element-list').scroll_into_view_if_needed()
    assert page.locator('#element-list').evaluate('''pane=>{const box=pane.getBoundingClientRect();for(const button of pane.querySelectorAll('button')){const r=button.getBoundingClientRect(),left=Math.max(box.left,r.left),right=Math.min(box.right,r.right),top=Math.max(box.top,r.top),bottom=Math.min(box.bottom,r.bottom);if(right-left<4||bottom-top<4)continue;const hit=document.elementFromPoint((left+right)/2,(top+bottom)/2);if(hit&&!button.contains(hit)&&!hit.contains(button))return false;}return true;}''')
    page.set_viewport_size({'width': 390, 'height': 844})
    page.screenshot(path=str(APP / 'previews/qa-element-list-mobile.png'), full_page=True)
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')
    assert page.locator('#element-list').evaluate('e => e.clientHeight <= 390')
    assert not errors, errors
    print('PASS Narrow layout fits and element list has bounded height without JavaScript errors', flush=True)
    context.close()
    browser.close()
