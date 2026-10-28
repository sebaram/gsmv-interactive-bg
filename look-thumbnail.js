// Capture the actual main-wall artwork without editor handles. The JPEG stays
// with its saved record; it is never part of the address-bar composition.
export async function captureLookThumbnail(state){
 const frames=[...document.querySelectorAll('.paired iframe')],frame=frames.find(f=>new URL(f.src,location.href).searchParams.get('view')==='front')||frames[0];
 if(!frame)return null;
 try{
  const win=frame.contentWindow,doc=win.document;
  const ready=()=>win.META?.state.variant===state.variant&&win.META.state.brightness===state.brightness&&JSON.stringify(win.META.state.authored)===JSON.stringify(state.authored)&&JSON.stringify(win.META.state.appearance)===JSON.stringify(state.appearance)&&win.META.renderedTime!==null;
  for(let i=0;i<40&&!ready();i++)await new Promise(r=>setTimeout(r,50));
  if(!ready())return null;
  await new Promise(r=>win.requestAnimationFrame(()=>win.requestAnimationFrame(r)));
  const source=doc.querySelector('#scene');if(!source?.width)return null;
  const canvas=document.createElement('canvas');canvas.width=480;canvas.height=270;const ctx=canvas.getContext('2d'),sx=480/win.innerWidth,sy=270/win.innerHeight;
  ctx.fillStyle='#101518';ctx.fillRect(0,0,480,270);ctx.filter='brightness('+state.brightness+'%)';ctx.drawImage(source,0,0,480,270);
  function visible(el){if(!el||!el.getClientRects().length)return false;for(let node=el;node&&node!==doc.body;node=node.parentElement){const style=win.getComputedStyle(node);if(style.display==='none'||style.visibility==='hidden')return false;}return true;}
  function image(el,source=el){if(!visible(el))return;const b=el.getBoundingClientRect();ctx.drawImage(source,b.x*sx,b.y*sy,b.width*sx,b.height*sy);}
  for(const video of doc.querySelectorAll('#wall-video-layers video'))if(video.readyState>=2)image(video);
  const logo=doc.querySelector('#wall-logo');if(logo?.complete&&logo.naturalWidth)image(logo);
  const text=[...doc.querySelectorAll('#cue-index,#cue-title,#cue-en,.institution,#wall-caption span')];
  for(const el of text){if(!visible(el))continue;const b=el.getBoundingClientRect(),style=win.getComputedStyle(el),size=parseFloat(style.fontSize)*sy;ctx.font=style.fontStyle+' '+style.fontWeight+' '+size+'px '+style.fontFamily;ctx.fillStyle=style.color;ctx.textBaseline='top';ctx.fillText(el.textContent,b.x*sx,b.y*sy,b.width*sx);}
  return canvas.toDataURL('image/jpeg',.78);
 }catch{return null;}
}
