"""Render and check the sixteen Astra floor-wall compositions."""
import base64
import hashlib
import io
import json
import os
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFont
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent
BASE = os.environ.get('META_STATIC_URL', 'http://127.0.0.1:8770/_site/')
COLLECTION = json.loads((ROOT/'looks/floor-wall-variations.json').read_text(encoding='utf-8'))


def address(look, view='front'):
    encoded = json.dumps(look).encode()
    fragment = base64.urlsafe_b64encode(encoded).decode().rstrip('=')
    key = hashlib.sha256(encoded).hexdigest()[:12]
    return BASE.split('#')[0].split('?')[0]+'wall.html?view='+view+'&capture=1&composition='+key+'#look=v1.'+fragment


def pixels(page):
    data = page.evaluate('document.querySelector("#scene").toDataURL().split(",")[1]')
    return Image.open(io.BytesIO(base64.b64decode(data))).convert('RGB')


with sync_playwright() as p:
    browser = p.chromium.launch(channel='chrome', headless=True)
    context = browser.new_context(viewport={'width': 1280, 'height': 720})
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    previews = []
    for index, item in enumerate(COLLECTION['looks']):
        variant = item['look']['variant']
        page.goto(address(item['look']))
        page.wait_for_function('window.META&&document.body.dataset.ready==="true"')
        assert page.evaluate('window.META.state.variant') == variant
        assert page.evaluate('window.META.state.authored[window.META.state.variant].edits["branding-front"].size') == .62
        assert page.evaluate('window.META.elements.some(e=>e.animated)')
        known = set(page.evaluate('window.META.elements.map(e=>e.id)'))
        assert set(item['look']['authored'][str(variant)]['edits']).issubset(known), item['name']
        page.evaluate('window.META.renderAt(12)')
        page.wait_for_function('window.META.renderedTime===12')
        page.wait_for_timeout(120)
        before = pixels(page)
        filename = f'floor-{variant+1:02}{"b" if index%2 else "a"}.jpg'
        page.screenshot(path=str(ROOT/'previews'/filename), type='jpeg', quality=92)
        previews.append(filename)
        # MV has an intentional assembled hold; sample beyond that hold too.
        page.evaluate('window.META.renderAt(42)')
        page.wait_for_function('window.META.renderedTime===42')
        delta = ImageChops.difference(before, pixels(page))
        assert max(hi for lo, hi in delta.getextrema()) >= 3, item['name']
        page.evaluate('window.META.renderAt(12)')
        page.wait_for_function('window.META.renderedTime===12')
        page.wait_for_timeout(120)
        assert max(hi for lo, hi in ImageChops.difference(before, pixels(page)).getextrema()) <= 2, item['name']
        if variant >= 6:
            assert page.locator('.element-handle,.video-resize').count() == 0
            scene_roots = page.evaluate('window.META.elements.filter(e=>!e.parentId&&e.animated).map(e=>e.id)')
            assert all('atelier-' in root or 'court-' in root for root in scene_roots)
        print('PASS Render, authored appearance, motion and held phase:', item['name'], flush=True)
    for variant in [6, 7]:
        item = COLLECTION['looks'][variant*2]
        page.set_viewport_size({'width': 1920, 'height': 720})
        page.goto(address(item['look'], 'left'))
        page.wait_for_function('window.META&&document.body.dataset.ready==="true"')
        page.evaluate('window.META.renderAt(12)')
        page.wait_for_function('window.META.renderedTime===12')
        page.screenshot(path=str(ROOT/f'previews/left-{variant}.jpg'), type='jpeg', quality=92)
        media_look = {**item['look'], 'showVideo': True, 'videoLayers': [{'id': 'demo', 'customClip': {'url': 'previews/demo-motion.mp4', 'name': 'Test demo'}, 'x': 20, 'y': 70, 'width': 20, 'enabled': True, 'screens': {}}]}
        page.goto(address(media_look))
        page.wait_for_function('window.META?.video?.ready>=2')
        assert page.evaluate('document.querySelector(".video-layer video").videoWidth>0')
        assert page.locator('.video-resize').count() == 0
    print('PASS New presets retain optional native-video playback and companion-wall outputs', flush=True)
    assert not errors, errors
    browser.close()

font = lambda size, bold=False: ImageFont.truetype('C:/Windows/Fonts/'+('seguisb.ttf' if bold else 'segoeui.ttf'), size)
sheet = Image.new('RGB', (1680, 3520), '#10171c')
draw = ImageDraw.Draw(sheet)
draw.text((40, 25), 'Astra / floor-wall interview collection', font=font(34, True), fill='#e5edf0')
draw.text((40, 78), '4.44 m wide x 2.50 m high / lower edge at floor / seated and standing', font=font(21), fill='#a8bcc8')
for index, (item, filename) in enumerate(zip(COLLECTION['looks'], previews)):
    col, row = index%2, index//2
    x, y = 40+col*820, 140+row*415
    image = Image.open(ROOT/'previews'/filename).resize((780, 439), Image.Resampling.LANCZOS)
    # A slightly smaller 16:9 image leaves room for a legible label in each row.
    image.thumbnail((780, 365))
    draw.text((x, y), item['name'], font=font(19, True), fill='#e5edf0')
    sheet.paste(image, (x, y+36))
sheet.save(ROOT/'previews/floor-variations.jpg', quality=93)
for variant in [6, 7]:
    image = Image.open(ROOT/f'previews/floor-{variant+1:02}a.jpg')
    image.save(ROOT/f'previews/style-{variant}.jpg', quality=94)
print('PASS Sixteen comparison previews and new preset thumbnails saved', flush=True)
