"""Render actual wall outputs and compose a six-style contact sheet."""
from pathlib import Path
import os
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw, ImageFont

OUT=Path(__file__).resolve().parent/'previews'
OUT.mkdir(exist_ok=True)
BASE=os.environ.get('META_PREVIEW_URL','http://127.0.0.1:8766')
NAMES=['Blue Hour','Common Ground','Soft Architecture','Living Research','Shared Reality','MV Symbiosis']
DESCRIPTIONS=['Orbital sculpture / a quiet setting for faculty interviews',
              'Blue + red ribbons / people, technology and shared worlds',
              'Porcelain architecture / warm, open and spatial',
              'Your research footage / a living digital gallery',
              'Real + virtual + research / the combined direction',
              'Official MV geometry / forms exchange, assemble and evolve']

with sync_playwright() as p:
    browser=p.chromium.launch(channel='chrome',headless=True,args=['--autoplay-policy=no-user-gesture-required'])
    context=browser.new_context(device_scale_factor=1)
    for i in range(6):
        for view,width in [('left',1920),('front',1280)]:
            page=context.new_page()
            page.add_init_script('localStorage.setItem("gsmv-interview-walls-v1",JSON.stringify({variant:'+str(i)+',showVideo:'+('false' if i==5 else 'true')+',epoch:Date.now()}))')
            page.set_viewport_size({'width':width,'height':720})
            page.goto(f'{BASE}/backgrounds/wall.html?view={view}&preview=1&capture=1&variant={i}')
            page.wait_for_function("document.body.dataset.ready==='true'")
            page.evaluate('window.META.renderAt(15)')
            page.wait_for_timeout(700)
            target=OUT/(f'style-{i}.jpg' if view=='front' else f'left-{i}.jpg')
            page.screenshot(path=str(target),type='jpeg',quality=94)
            page.close()
        print(f'Captured style {i+1}',flush=True)
    page=context.new_page()
    page.set_viewport_size({'width':3840,'height':2160})
    page.add_init_script('localStorage.setItem("gsmv-interview-walls-v1",JSON.stringify({variant:4,showVideo:true,epoch:Date.now()}))')
    for view,filename in [('front','front-4k.png'),('left','left-4k-input.png')]:
        page.goto(f'{BASE}/backgrounds/wall.html?view={view}&preview=1&capture=1&variant=4')
        page.wait_for_function("document.body.dataset.ready==='true'")
        page.evaluate('window.META.renderAt(15)')
        page.wait_for_timeout(400)
        page.screenshot(path=str(OUT/filename))
    page.close()
    page=context.new_page()
    page.set_viewport_size({'width':1600,'height':1000})
    page.goto(BASE+'/backgrounds/')
    page.wait_for_function("document.querySelector('#network-status').textContent.toLowerCase()==='network ready'")
    page.wait_for_timeout(1800)
    page.screenshot(path=str(OUT/'studio.png'),full_page=True)
    browser.close()

def font(size,bold=False):
    return ImageFont.truetype('C:/Windows/Fonts/'+('seguisb.ttf' if bold else 'segoeui.ttf'),size)

sheet=Image.new('RGB',(1680,3010),'#101416')
d=ImageDraw.Draw(sheet)
d.text((40,28),'KAIST / META',font=font(23,True),fill='#d6edb4')
d.text((40,66),'Interview backgrounds / six directions',font=font(36),fill='#edf1eb')
d.text((40,119),'LEFT: 3 × 2 TILES / 8:3 PHYSICAL SURFACE     +     FRONT: 4K LED / 16:9',font=font(14),fill='#879a91')
for i in range(6):
    y=175+i*465
    d.text((40,y),f'0{i+1}   {NAMES[i]}',font=font(25,True),fill='#edf1eb')
    d.text((40,y+35),DESCRIPTIONS[i],font=font(15),fill='#a1afa6')
    for view,x,size in [('left',40,(960,360)),('style',1000,(640,360))]:
        source=Image.open(OUT/f'{view}-{i}.jpg').resize(size,Image.Resampling.LANCZOS)
        sheet.paste(source,(x,y+70))
    d.line((1000,y+70,1000,y+430),fill='#a3b899',width=2)
    d.text((52,y+77),'LEFT WALL',font=font(10),fill='#9fada7')
    d.text((1012,y+77),'FRONT WALL',font=font(10),fill='#9fada7')
d.text((40,2970),'Live 3D / explicit video library / per-screen ratios & grids / local + network playback',font=font(14),fill='#879a91')
sheet.save(OUT/'comparison.jpg',quality=95)
print('Saved comparison, 4K stills and studio screenshot',flush=True)
