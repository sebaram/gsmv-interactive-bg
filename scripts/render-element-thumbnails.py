"""Capture real wall-rendered artwork for element choices and kinetic presets."""
import base64
import io
import hashlib
import json
from pathlib import Path
import os
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parent.parent
BASE=os.environ.get('META_STATIC_URL','http://127.0.0.1:8770/_site/').rstrip('/')+'/'
DEST=ROOT/'assets/element-thumbnails';DEST.mkdir(parents=True,exist_ok=True)
def address(state):
    raw=json.dumps(state).encode();fragment=base64.urlsafe_b64encode(raw).decode().rstrip('=')
    return BASE+'wall.html?view=front&capture=1&render='+hashlib.sha256(raw).hexdigest()[:12]+'#look=v1.'+fragment
with sync_playwright() as p:
    browser=p.chromium.launch(channel='chrome',headless=True)
    page=browser.new_page(viewport={'width':1280,'height':720})
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    base={'variant':8,'paused':True,'offset':4,'branding':False,'screens':[{'id':'front','name':'Front LED wall','width':3840,'height':2160}],'brightness':100}
    page.goto(address(base));page.wait_for_function('window.META&&document.body.dataset.ready==="true"')
    roots=page.evaluate('window.META.elements.filter(e=>!e.parentId&&!e.dom).map(e=>e.id)')
    types=['logo','ribbons','orbits','network','sphere','arch','presence','registration','feedback','cocreation']
    for kind in types:
        state={**base,'offset':15 if kind=='logo' else 4,'authored':{'8':{'edits':{id:{'visible':False} for id in roots},'objects':[{'id':'thumbnail','type':kind,'screen':'front','x':50,'y':50,'size':1}]}},'appearance':{'8':{'mode':'solid','backgroundColor':'#101518','floor':0}}}
        page.goto(address(state));page.wait_for_function('window.META&&document.body.dataset.ready==="true"')
        page.evaluate('t=>window.META.renderAt(t)',state['offset']);page.wait_for_function('t=>window.META.renderedTime===t',arg=state['offset'])
        raw=page.evaluate('document.querySelector("#scene").toDataURL().split(",")[1]')
        image=Image.open(io.BytesIO(base64.b64decode(raw))).convert('RGB')
        image.crop((370,90,910,630)).resize((256,256),Image.Resampling.LANCZOS).save(DEST/(kind+'.jpg'),quality=94)
        print('Rendered element:',kind,flush=True)
    for variant in range(8,12):
        page.goto(address({**base,'variant':variant,'branding':True,'brightness':85}));page.wait_for_function('window.META&&document.body.dataset.ready==="true"')
        page.evaluate('window.META.renderAt(6)');page.wait_for_function('window.META.renderedTime===6')
        page.screenshot(path=str(ROOT/f'previews/kinetic-{variant}.jpg'),type='jpeg',quality=94)
        image=Image.open(ROOT/f'previews/kinetic-{variant}.jpg')
        image.crop((660,280,1270,710)).save(ROOT/f'previews/style-{variant}.jpg',quality=94)
    assert not errors,errors
    browser.close()
