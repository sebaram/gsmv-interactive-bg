let apiPromise;
function loadApi(){
 if(window.YT?.Player)return Promise.resolve(window.YT);
 if(apiPromise)return apiPromise;
 apiPromise=new Promise((resolve,reject)=>{
  const previous=window.onYouTubeIframeAPIReady,script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.async=true;
  const timer=setTimeout(()=>reject(new Error('YouTube could not connect. Check your internet connection.')),20000);
  window.onYouTubeIframeAPIReady=()=>{clearTimeout(timer);previous?.();resolve(window.YT);};
  script.onerror=()=>{clearTimeout(timer);reject(new Error('YouTube could not connect. Check your internet connection.'));};document.head.append(script);
 }).catch(error=>{apiPromise=null;throw error;});return apiPromise;
}

// Present the same playback surface used by local clips to the layer timeline.
export function youtubePlayer(host,source,{onReady,onError,onBlocked,onEnded,onPlaying}){
 let player,ready=false,destroyed=false;
 const driver={
  get readyState(){return ready?4:0;},get duration(){return ready?player.getDuration():0;},
  get currentTime(){return ready?player.getCurrentTime():0;},set currentTime(time){if(ready)player.seekTo(time,true);},
  get paused(){return !ready||player.getPlayerState()!==1;},get muted(){return true;},
  set playbackRate(rate){if(!ready)return;const rates=player.getAvailablePlaybackRates();if(!rates.length)return;const best=rates.reduce((a,b)=>Math.abs(b-rate)<Math.abs(a-rate)?b:a);if(player.getPlaybackRate()!==best)player.setPlaybackRate(best);},
  play(){if(ready){player.mute();player.playVideo();}return Promise.resolve();},pause(){if(ready)player.pauseVideo();},
  destroy(){destroyed=true;player?.destroy();}
 };
 loadApi().then(YT=>{
  if(destroyed)return;
  const mount=document.createElement('div');host.append(mount);
  player=new YT.Player(mount,{width:'100%',height:'100%',videoId:source.id,playerVars:{autoplay:0,controls:0,disablekb:1,fs:0,playsinline:1,rel:0,loop:1,playlist:source.id,start:source.start,origin:location.origin},events:{
   onReady:event=>{if(destroyed)return;player=event.target;ready=true;player.mute();const iframe=player.getIframe();iframe.title=source.title;iframe.referrerPolicy='strict-origin-when-cross-origin';onReady();},
   onStateChange:event=>{if(event.data===0)onEnded();if(event.data===1)onPlaying();},onAutoplayBlocked:()=>onBlocked(),
   onError:event=>onError([101,150].includes(event.data)?'This video does not allow embedding. Choose another YouTube video.':event.data===100?'This YouTube video is private or unavailable.':'YouTube playback is unavailable ('+event.data+'). Choose another video or use a local file.')
  }});
 }).catch(error=>{if(!destroyed)onError(error.message);});return driver;
}
