"""Added-file/YouTube playlist, solo playback, relinking and portable names."""
import base64,json,os
from pathlib import Path
from playwright.sync_api import sync_playwright
BASE=os.environ.get('META_STATIC_URL','http://127.0.0.1:8770/_site/')
APP=Path(__file__).resolve().parent
def address(state):return BASE.split('#')[0]+'#look=v1.'+base64.urlsafe_b64encode(json.dumps(state).encode()).decode().rstrip('=')
media=(APP/'previews/demo-motion.mp4').read_bytes()
def file(name):return {'name':name,'mimeType':'video/mp4','buffer':media}
with sync_playwright() as p:
 b=p.chromium.launch(channel='chrome',headless=True);page=b.new_page(viewport={'width':1600,'height':1400});errors=[];requests=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('request',lambda r:requests.append(r.url))
 page.goto(address({'variant':5,'paused':False,'videoLayers':[]}));page.wait_for_function('window.METAStudio');assert page.locator('#video-playlist').is_hidden();assert page.locator('.video-item').count()==0;assert page.locator('#research-catalog').is_hidden()
 page.locator('#local-video').set_input_files([file('Alpha research.mp4'),file('Beta research.mp4')]);page.wait_for_function('window.METAStudio.state.videoLayers.length===2');assert page.locator('#video-playlist').is_visible();assert page.locator('.video-playlist-item').count()==2
 assert page.evaluate('window.METAStudio.state.videoLayers.map(l=>l.enabled)')==[True,False]
 with page.expect_popup() as opened:page.locator('#output-links a').first.click()
 wall=opened.value;wall.on('pageerror',lambda e:errors.append(str(e)));wall.wait_for_function('window.META && window.META.videos.length===1&&window.META.video.id==="video-1"&&window.META.video.ready>=2');page.locator('[data-play-video="video-2"]').click();wall.wait_for_function('window.META.videos.length===1&&window.META.video.id==="video-2"&&!window.META.video.paused')
 page.locator('[data-video-placement="video-2"]').click();page.locator('#video-placement-screen').select_option('front');page.locator('#video-x').fill('34');page.locator('#video-width').fill('27');page.locator('[data-play-video="video-1"]').click();page.locator('[data-play-video="video-2"]').click();assert page.evaluate('window.METAStudio.state.videoLayers[1].screens.front.x')==34
 page.locator('#play-videos-together').click();wall.wait_for_function('window.META.videos.length===2');page.locator('#no-video').click();wall.wait_for_function('window.META.videos.length===0');assert page.locator('.video-playlist-item').count()==2;page.locator('#no-video').click();wall.wait_for_function('window.META.videos.length===2',timeout=3000);page.locator('[data-play-video="video-1"]').click();wall.wait_for_function('window.META.videos.length===1&&window.META.video.id==="video-1"');wall.close()
 print('PASS Multiple local files appear only after choosing; click switches actual playback, preserves placement and Hide keeps the list',flush=True)
 page.locator('#youtube-url').fill('https://youtu.be/M7lc1UVf-VE?t=30');page.locator('#youtube-title').fill('Department film');page.locator('#add-youtube').click();page.wait_for_function('window.METAStudio.state.videoLayers.length===3');assert 'Department film' in page.locator('#video-playlist').inner_text();assert page.evaluate('window.METAStudio.state.videoLayers.map(l=>l.enabled)')==[False,False,True];assert not any('youtube.com' in u or 'ytimg.com' in u for u in requests)
 page.locator('[data-play-video="video-2"]').click();page.locator('#copy-look-link').click();saved=page.url;fresh=b.new_context();restored=fresh.new_page();restored.goto(saved);restored.wait_for_function('window.METAStudio&&document.querySelectorAll(".video-playlist-item").length===3');assert 'Alpha research.mp4' in restored.locator('#video-playlist').inner_text();assert restored.locator('[data-play-video="video-1"]').inner_text().endswith('Choose file again');assert 'Department film' in restored.locator('#video-playlist').inner_text()
 with restored.expect_popup() as opened:restored.locator('#output-links a').first.click()
 missing_wall=opened.value;missing_wall.wait_for_function('window.META&&document.body.dataset.ready==="true"');assert missing_wall.evaluate('window.META.videos.length')==0;assert missing_wall.locator('.video-unavailable:visible').count()==0
 with restored.expect_file_chooser() as chooser:restored.locator('[data-play-video="video-2"]').click()
 chooser.value.set_files(file('Beta relinked.mp4'));restored.wait_for_function('window.METAStudio.state.videoLayers[1].customClip?.name==="Beta relinked.mp4"');assert restored.evaluate('window.METAStudio.state.videoLayers.length')==3;assert restored.evaluate('window.METAStudio.state.videoLayers[1].screens.front.x')==34
 missing_wall.wait_for_function('window.META.video?.id==="video-2"&&window.META.video.ready>=2');missing_wall.close()
 restored.set_viewport_size({'width':390,'height':844});restored.locator('#video-library').screenshot(path=str(APP/'previews/qa-playlist-mobile.png'));assert restored.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
 full=restored.evaluate('window.METAStudio.state');full['videoLayers'] += [{'id':'extra-'+str(i),'fileName':'Missing '+str(i)+'.mp4'} for i in range(5)];restored.goto(address(full));restored.wait_for_function('window.METAStudio?.state.videoLayers.length===8');assert restored.locator('#local-video').is_disabled()
 with restored.expect_file_chooser() as chooser:restored.locator('[data-play-video="extra-4"]').click()
 chooser.value.set_files(file('Recovered.mp4'));restored.wait_for_function('window.METAStudio.state.videoLayers[7].customClip?.name==="Recovered.mp4"');assert restored.evaluate('window.METAStudio.state.videoLayers.length')==8;assert restored.locator('#local-video').is_disabled()
 page.locator('#video-placement-settings').evaluate('e=>e.open=false');page.locator('#video-library').scroll_into_view_if_needed();page.screenshot(path=str(APP/'previews/qa-playlist-desktop.png'),full_page=True);assert not errors,errors
 print('PASS YouTube joins the same list; URL names, in-place relinking at full capacity and mobile fit work without editor YouTube requests',flush=True)
 expired=b.new_context();expired.add_init_script('if(window===top)localStorage.setItem("gsmv-interview-walls-v1",'+json.dumps(json.dumps({'videoLayers':[{'id':'old','customClip':{'url':'blob:expired-reference','name':'Previous session.mp4'},'enabled':True}],'showVideo':True}))+')');resumed=expired.new_page();resumed.goto(BASE.split('#')[0]);resumed.wait_for_function('window.METAStudio');assert resumed.locator('[data-play-video="old"]').inner_text().endswith('Choose file again');assert resumed.evaluate('window.METAStudio.state.videoLayers[0].customClip||null') is None;expired.close()
 print('PASS Missing or expired files never render error boxes as on-screen videos and relinking restores playback',flush=True)
 fresh.close();b.close()
