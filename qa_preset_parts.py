"""Check individual preset parts, independent copies, handles and portable edits."""
import os
from playwright.sync_api import sync_playwright

BASE=os.environ.get('META_STATIC_URL','http://127.0.0.1:8770/_site/')
with sync_playwright() as p:
 browser=p.chromium.launch(channel='chrome',headless=True)
 context=browser.new_context(viewport={'width':1600,'height':1100})
 page=context.new_page();errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
 page.goto(BASE);page.wait_for_function('window.METAStudio && document.querySelectorAll("#author-element option").length>0')
 for variant in range(6):
  page.locator(f'[data-variant="{variant}"]').click()
  page.wait_for_function('(v)=>[...document.querySelectorAll(".paired iframe")].every(f=>f.contentWindow.META?.state.variant===v && f.contentWindow.META.elements.some(e=>e.parentId))',arg=variant)
  elements=page.evaluate('document.querySelector(".paired iframe").contentWindow.META.elements')
  parts=[e for e in elements if e.get('parentId')]
  assert all(' / ' in e['name'] and '-part-' in e['id'] for e in parts)
  assert len({e['id'] for e in elements})==len(elements)
  print(f'PASS Preset {variant}: {len(parts)} semantic individual parts',flush=True)
 page.locator('[data-variant="1"]').click();page.wait_for_function('document.querySelector("#author-element option[value=preset-main-part-1]")')
 page.locator('#author-element').select_option('preset-main-part-1');page.locator('#author-x').fill('77');page.locator('#author-y').fill('42');page.locator('#author-size').fill('0.55');page.locator('#author-rotation').fill('30');page.locator('#author-visible').uncheck()
 page.wait_for_function('window.METAStudio.state.authored[1].edits["preset-main-part-1"].visible===false')
 assert page.evaluate('!window.METAStudio.state.authored[1].edits["preset-main"]')
 page.locator('#author-visible').check();page.locator('#duplicate-element').click()
 page.wait_for_function('window.METAStudio.state.authored[1].objects[0]?.source==="preset-main-part-1"')
 page.wait_for_function('document.querySelector("#author-element").value==="object-1"')
 page.locator('#author-screen').select_option('left');page.locator('#author-size').fill('0.8')
 page.wait_for_function('[...document.querySelectorAll(".paired iframe")].every(f=>f.contentWindow.META.elements.some(e=>e.id==="object-1"&&e.screen==="left"&&e.size===.8))')
 page.locator('#author-element').select_option('preset-main-part-1');page.locator('#reset-element').click()
 assert page.evaluate('!window.METAStudio.state.authored[1].edits["preset-main-part-1"]')
 print('PASS A ribbon has independent position, size, rotation, visibility, reset and a cross-screen duplicate',flush=True)
 # Duplicate a group with a modified child, then modify only the copy's child.
 page.locator('#author-element').select_option('preset-main-part-2');page.locator('#author-size').fill('0.6')
 page.locator('#author-element').select_option('preset-main');page.locator('#duplicate-element').click()
 page.wait_for_function('document.querySelector("#author-element option[value=object-2-part-2]")')
 page.locator('#author-element').select_option('object-2-part-2');page.locator('#author-size').fill('1.3')
 assert page.evaluate('window.METAStudio.state.authored[1].edits["preset-main-part-2"].size===.6 && window.METAStudio.state.authored[1].edits["object-2-part-2"].size===1.3')
 page.locator('#edit-elements').check();page.locator('#author-screen').select_option('front');page.locator('#author-x').fill('75')
 front=next(frame for frame in page.frames if 'view=front' in frame.url)
 front.locator('.element-handle').wait_for(state='visible')
 assert 'Interwoven ribbon' in front.locator('.element-handle-label').inner_text()
 page.locator('.preview-room').scroll_into_view_if_needed();handle=front.locator('.element-handle');box=handle.locator('.element-handle-label').bounding_box();before=page.evaluate('window.METAStudio.state.authored[1].edits["object-2-part-2"].x')
 page.mouse.move(box['x']+8,box['y']+5);page.mouse.down();page.mouse.move(box['x']+23,box['y']+11,steps=4);page.mouse.up()
 page.wait_for_function('(x)=>window.METAStudio.state.authored[1].edits["object-2-part-2"].x!==x',arg=before)
 print('PASS Copied group parts stay independent and their selection handles drag in the monitor',flush=True)
 page.locator('#pause-btn').click();front.wait_for_function('window.META.state.paused')
 page.locator('#author-element').select_option('preset-main');page.locator('#author-size').fill('1.4');page.locator('#author-rotation').fill('35')
 page.locator('#author-element').select_option('preset-main-part-3');page.locator('.preview-room').scroll_into_view_if_needed();page.wait_for_timeout(150)
 box=front.locator('.element-handle').bounding_box();start_x=box['x']+box['width']/2;start_y=box['y']+box['height']/2
 label=front.locator('.element-handle-label').bounding_box();pointer_x=label['x']+8;pointer_y=label['y']+5
 page.mouse.move(pointer_x,pointer_y);page.mouse.down();page.mouse.move(pointer_x+20,pointer_y,steps=4);page.mouse.up();page.wait_for_timeout(100)
 after=front.locator('.element-handle').bounding_box();dx=after['x']+after['width']/2-start_x;dy=after['y']+after['height']/2-start_y
 assert abs(dx-20)<3 and abs(dy)<3,(dx,dy)
 print('PASS Part dragging follows the pointer after its parent is resized and rotated',flush=True)
 # A selected group outline must still allow clicking a visible child beneath it.
 click_x=after['x']+after['width']/2;click_y=after['y']+after['height']/2
 page.locator('#author-element').select_option('preset-main');page.wait_for_timeout(100);page.mouse.click(click_x,click_y)
 page.wait_for_function('window.METAStudio.state.activeElement.includes("-part-")')
 print('PASS Clicking a child through its parent selection outline selects an individual part',flush=True)
 page.wait_for_timeout(300);address=page.url;expected=page.evaluate('window.METAStudio.state.authored')
 fresh=browser.new_context();restored=fresh.new_page();restored.on('pageerror',lambda error:errors.append(str(error)));restored.goto(address);restored.wait_for_function('window.METAStudio && document.querySelector("#author-element option[value=object-2-part-2]")')
 assert restored.evaluate('window.METAStudio.state.authored')==expected
 assert not errors,errors
 print('PASS Individual part and copy edits survive a portable URL in fresh storage without JavaScript errors',flush=True)
 fresh.close();context.close();browser.close()
