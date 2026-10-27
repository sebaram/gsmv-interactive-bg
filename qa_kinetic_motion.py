"""Render actual 3D motion details, and guard against still assembled phases.

Uses the same saved configurations and wall renderer as the production editor.
The comparison crops the side artwork for visibility; it does not accelerate it.
"""
import base64
import json
import os
from pathlib import Path
import subprocess
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent
BASE = os.environ.get('META_STATIC_URL', 'http://127.0.0.1:8770/_site/').rstrip('/')+'/'
items = json.loads((ROOT/'looks/research-meaning-variations.json').read_text(encoding='utf-8'))['looks']
selected = [items[i] for i in [0, 4, 6, 2]]
host = ROOT/'previews/qa-kinetic-host.html'
frames = []
for item in selected:
    raw = json.dumps(item['look']).encode()
    fragment = base64.urlsafe_b64encode(raw).decode().rstrip('=')
    frames.append(f'<iframe src="{BASE}wall.html?view=front&capture=1#look=v1.{fragment}"></iframe>')
host.write_text('<style>body{margin:0;display:grid;grid-template-columns:640px 640px;background:#10171c}iframe{border:0;width:640px;height:360px}canvas{position:absolute;left:0;top:0;pointer-events:none}</style>'+''.join(frames)+'<canvas id="comparison" width="1280" height="800"></canvas>', encoding='utf-8')

with sync_playwright() as p:
    browser = p.chromium.launch(channel='chrome', headless=True)
    context = browser.new_context(viewport={'width':1280, 'height':800})
    page = context.new_page()
    errors = []
    context.on('page', lambda pg: pg.on('pageerror', lambda error: errors.append(str(error))))
    page.goto(BASE.split('/_site/')[0]+'/previews/qa-kinetic-host.html')
    page.wait_for_function('Array.from(document.querySelectorAll("iframe")).every(f=>f.contentWindow.META&&f.contentDocument.body.dataset.ready==="true")')
    page.evaluate('''() => {
      window.walls=Array.from(document.querySelectorAll('iframe'));
      window.detailFrame=t=>{
        for(const f of walls)f.contentWindow.META.renderAt(t);
      };
      window.composite=()=>{
        const canvas=document.querySelector('#comparison'),ctx=canvas.getContext('2d');
        const titles=['01 / CO-PRESENCE · interwoven ribbons','03 / SHARED COORDINATES · kinetic portals','04 / MUTUAL RESPONSE · travelling waves','02 / CO-CREATION · unfolding structure'];
        ctx.fillStyle='#10171c';ctx.fillRect(0,0,1280,800);
        walls.forEach((f,i)=>{
          const c=f.contentDocument.querySelector('#scene'),x=(i%2)*640,y=Math.floor(i/2)*400;
          ctx.drawImage(c,c.width*.45,c.height*.45,c.width*.55,c.height*.55,x,y+40,640,360);
          ctx.fillStyle='#dce8ee';ctx.font='16px sans-serif';ctx.fillText(titles[i],x+18,y+26);
        });
        return canvas.toDataURL('image/png').split(',')[1];
      };
    }''')
    def render(t):
        page.evaluate('t=>detailFrame(t)',t)
        page.wait_for_function('(t)=>walls.every(f=>f.contentWindow.META.renderedTime===t)', arg=t)
        return base64.b64decode(page.evaluate('composite()'))

    # Actual-pixel checks, during both the opening and the main joined phase.
    from PIL import Image, ImageChops
    from io import BytesIO
    for t in [0, 12, 15, 25]:
        before = Image.open(BytesIO(render(t))).convert('RGB')
        after = Image.open(BytesIO(render(t+.75))).convert('RGB')
        for i in range(4):
            x,y = (i%2)*640,(i//2)*400+40
            diff = ImageChops.difference(before.crop((x,y,x+640,y+360)),after.crop((x,y,x+640,y+360)))
            active = sum(1 for pixel in diff.getdata() if max(pixel)>12)
            assert active>1000,(selected[i]['name'], t, active)
        print(f'PASS Visible 3D motion in all four detail views at {t}s', flush=True)

    fps,duration = 24,28
    destination = ROOT/'previews/meaning-motion.mp4'
    process = subprocess.Popen(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','image2pipe','-framerate',str(fps),'-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','21','-pix_fmt','yuv420p','-movflags','+faststart',str(destination)], stdin=subprocess.PIPE)
    try:
        for frame in range(fps*duration):
            process.stdin.write(render(frame/fps))
            if frame%(fps*4)==0:print(f'RENDER Motion comparison {frame//fps}/{duration}s', flush=True)
    finally:
        process.stdin.close()
        code = process.wait(timeout=60)
    assert code==0
    assert not errors,errors
    browser.close()
    print('PASS Real-time 28-second motion comparison:', destination.name, flush=True)
