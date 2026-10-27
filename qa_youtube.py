"""Check direct video adding and the official-player adapter at its external boundary."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE=os.environ.get('META_STATIC_URL','http://127.0.0.1:8770/_site/')
APP=Path(__file__).resolve().parent
# A deterministic YouTube API boundary lets pause, seek, rate, teardown and failures
# be checked without relying on an external stream's advertisements or availability.
PLAYER_API=r"""
window.ytPlayers=[];
window.YT={Player:class {
 constructor(mount,options){this.options=options;this.time=0;this.epoch=performance.now();this.rate=1;this.state=2;this.frame=document.createElement('iframe');this.frame.src='about:blank';mount.replaceWith(this.frame);window.ytPlayers.push(this);setTimeout(()=>options.events.onReady({target:this}),5);}
 getIframe(){return this.frame;} getDuration(){return 180;}
 getCurrentTime(){return this.time+(this.state===1?(performance.now()-this.epoch)/1000*this.rate:0);}
 seekTo(time){this.time=time;this.epoch=performance.now();}
 getPlayerState(){return this.state;} mute(){this.isMuted=true;}
 playVideo(){if(this.state!==1){this.epoch=performance.now();this.state=1;this.options.events.onStateChange({data:1});}}
 pauseVideo(){this.time=this.getCurrentTime();this.epoch=performance.now();this.state=2;}
 getAvailablePlaybackRates(){return [.25,.5,1,1.5,2];} getPlaybackRate(){return this.rate;}
 setPlaybackRate(rate){this.time=this.getCurrentTime();this.epoch=performance.now();this.rate=rate;}
 destroy(){this.destroyed=true;this.frame.remove();}
 fail(code){this.options.events.onError({data:code});}
}};
"""
with sync_playwright() as p:
 b=p.chromium.launch(channel='chrome',headless=True)
 c=b.new_context(viewport={'width':1440,'height':1000},permissions=['clipboard-read','clipboard-write']);c.add_init_script(PLAYER_API)
 page=c.new_page();errors=[];requests=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('request',lambda r:requests.append(r.url))
 page.goto(BASE);page.wait_for_function('window.METAStudio')
 assert page.locator('#video-preview,#video-poster,.video-detail,[data-preview-video]').count()==0
 assert page.locator('#video-playlist').is_hidden() and page.locator('.video-item').count()==0
 source=next((APP.parent/'output'/'clips').glob('P2-S5-01*'))
 page.locator('#local-video').set_input_files(source);page.wait_for_function('window.METAStudio.state.videoLayers.length===1')
 page.locator('#no-video').click();page.locator('#youtube-url').fill('https://evil.example/video');page.locator('#add-youtube').click();assert page.locator('#youtube-error').is_visible();assert page.evaluate('window.METAStudio.state.videoLayers.length')==1
 page.locator('#youtube-url').fill('https://youtu.be/M7lc1UVf-VE?t=30');page.locator('#youtube-title').fill('KAIST identity film');page.locator('#add-youtube').click()
 page.wait_for_function('window.METAStudio.state.videoLayers.at(-1)?.youtube.id==="M7lc1UVf-VE"')
 assert 'KAIST identity film' in page.locator('#active-video-layer').text_content()
 assert not any('youtube.com' in url or 'ytimg.com' in url for url in requests)
 for frame in page.frames[1:]:assert frame.locator('.youtube-media iframe').count()==0
 print('PASS Direct-add cards replace separate previews; local files and validated YouTube links add without editor video requests',flush=True)
 with page.expect_popup() as opened:page.locator('#output-links a').first.click()
 wall=opened.value;wall.on('pageerror',lambda e:errors.append(str(e)));wall.wait_for_function('window.META?.video?.provider==="youtube" && window.META.video.ready===4 && !window.META.video.paused')
 options=wall.evaluate('window.ytPlayers[0].options');assert options['videoId']=='M7lc1UVf-VE';assert options['playerVars']['start']==30 and options['playerVars']['loop']==1
 assert wall.evaluate('window.ytPlayers[0].isMuted')
 page.locator('#video-placement-settings').evaluate('e=>e.open=true')
 page.locator('#pause-btn').click();wall.wait_for_function('window.META.video.paused');before=wall.evaluate('window.META.video.time');wall.wait_for_timeout(650);assert abs(wall.evaluate('window.META.video.time')-before)<.02
 page.locator('#pause-btn').click();wall.wait_for_function('!window.META.video.paused')
 page.locator('#video-speed').fill('1.5');wall.wait_for_function('window.ytPlayers[0].rate===1.5')
 page.locator('#video-placement-screen').select_option('front');page.locator('#video-x').fill('35');wall.wait_for_function('document.querySelector(".video-layer[data-provider=youtube]").style.left==="35%"')
 page.locator('#show-videos').uncheck();wall.wait_for_function('window.ytPlayers[0].state===2 && window.META.videos.length===0');page.locator('#show-videos').check();wall.wait_for_function('window.META.videos.length===1 && !window.META.video.paused')
 print('PASS YouTube player adapter starts muted, follows pause/rate/visibility and retains per-screen placement',flush=True)
 page.locator('#video-width').fill('5');wall.wait_for_function('parseFloat(document.querySelector(".video-layer[data-provider=youtube]").style.width)===5')
 assert wall.locator('.youtube-media iframe').evaluate('e=>parseFloat(getComputedStyle(e).width)>=200 && parseFloat(getComputedStyle(e).height)>=200')
 page.locator('#youtube-shape').select_option('0.5625');wall.wait_for_function('window.META.state.videoLayers[1].sourceAspect===.5625')
 page.locator('#duplicate-video-layer').click();wall.wait_for_function('window.META.videos.length===2')
 page.locator('#copy-look-link').click();address=page.evaluate('navigator.clipboard.readText()')
 fresh=b.new_context();fresh.add_init_script(PLAYER_API);restored=fresh.new_page();restored.goto(address);restored.wait_for_function('window.METAStudio?.state.videoLayers.length===3')
 assert restored.evaluate('window.METAStudio.state.videoLayers.filter(l=>l.youtube).every(l=>l.youtube.id==="M7lc1UVf-VE" && l.sourceAspect===.5625)')
 wall.evaluate('window.ytPlayers[0].fail(101)');wall.wait_for_function('window.META.videos[0].error?.includes("does not allow embedding")')
 page.locator('#remove-video-layer').click();wall.wait_for_function('window.META.videos.length===1');assert wall.evaluate('window.ytPlayers[1].destroyed')
 print('PASS YouTube source/shape survives duplication and bookmarks; embedding errors are visible and removed players are destroyed',flush=True)
 page.set_viewport_size({'width':390,'height':844});page.screenshot(path=str(APP/'previews/qa-youtube-mobile.png'),full_page=True);assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1');assert not errors,errors
 print('PASS Narrow video controls fit with no JavaScript errors',flush=True)
 fresh.close();c.close();b.close()
