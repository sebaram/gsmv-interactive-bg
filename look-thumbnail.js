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
  function opacity(el){let value=1;for(let node=el;node&&node!==doc.body;node=node.parentElement)value*=+win.getComputedStyle(node).opacity;return value;}
  function image(el,source=el){if(!visible(el))return;const b=el.getBoundingClientRect();ctx.globalAlpha=opacity(el);ctx.drawImage(source,b.x*sx,b.y*sy,b.width*sx,b.height*sy);ctx.globalAlpha=1;}
  for(const video of doc.querySelectorAll('#wall-video-layers video'))if(video.readyState>=2)image(video);
  const logo=doc.querySelector('#wall-logo');if(logo?.complete&&logo.naturalWidth)image(logo);
  // Ranges supply the browser's actual wrapping and inline emphasis positions.
  for(const target of doc.querySelectorAll('[data-text-layer]')){
   if(!visible(target))continue;const walker=doc.createTreeWalker(target,win.NodeFilter.SHOW_TEXT);let node,budget=4000;
   while((node=walker.nextNode())&&budget>0){if(!visible(node.parentElement))continue;const style=win.getComputedStyle(node.parentElement),range=doc.createRange();ctx.globalAlpha=opacity(node.parentElement);ctx.font=style.fontStyle+' '+style.fontWeight+' '+parseFloat(style.fontSize)*sy+'px '+style.fontFamily;ctx.fillStyle=style.color;ctx.textBaseline='top';
    for(let i=0;i<node.textContent.length&&budget-->0;i++){const char=node.textContent[i];if(/\s/.test(char))continue;range.setStart(node,i);range.setEnd(node,i+1);const b=range.getBoundingClientRect();if(b.width&&b.height)ctx.fillText(char,b.x*sx,b.y*sy,Math.max(1,b.width*sx));}
   }
   ctx.globalAlpha=1;
  }
  return canvas.toDataURL('image/jpeg',.78);
 }catch{return null;}
}
