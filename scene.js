import * as T from './vendor/three.module.js';
import {KEY,variants,cues,read,save,sanitize,timeline,setPaused,panorama,screenAspect,setClockOffset} from './state.js';
import {connectSync} from './sync.js';
import {videoOverlay} from './video-overlay.js';
import {motionPose} from './motion.js';
import {createLogoSculpture} from './logo-scene.js';

const params=new URLSearchParams(location.search),view=params.get('view')||'front',preview=params.has('preview');
const fixedVariant=params.has('variant')?Math.max(0,Math.min(variants.length-1,+params.get('variant'))):null;
let state=read();if(fixedVariant!==null)state.variant=fixedVariant;
const channel=new BroadcastChannel(KEY);
document.body.classList.add(view==='front'?'front':'left');if(preview)document.body.classList.add('preview');
document.title=`META / ${view} output`;
const canvas=document.querySelector('#scene');
let renderer;
try{renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance',preserveDrawingBuffer:true});}catch(e){document.querySelector('#error').hidden=false;throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,preview?1.4:2));
renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
const scene=new T.Scene();
const camera=new T.OrthographicCamera(-18,18,5,-5,.1,140);camera.position.set(0,3.8,32);camera.lookAt(0,0,0);
const group=new T.Group();scene.add(group);
const moving=[],logoSystems=[];
let hero,secondary,background,layout;
let lastConfig='',pointer={x:0,y:0},lastFrame=-1;
let frames=0,fps=0,statsEpoch=performance.now();
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const motionAllowed=()=>!reducedMotion.matches||state.motionConsent;
const clipList=await fetch('./clips.json').then(r=>r.json());
const videoLayers=videoOverlay(document.querySelector('#wall-video-layers'),clipList,{view,preview,motionAllowed});

// A locally generated studio environment supplies soft reflected highlights.
const envCanvas=document.createElement('canvas');envCanvas.width=1024;envCanvas.height=512;
const ec=envCanvas.getContext('2d');ec.fillStyle='#506070';ec.fillRect(0,0,1024,512);
const eg=ec.createLinearGradient(0,0,0,512);eg.addColorStop(0,'#dce7fa');eg.addColorStop(.45,'#7f9db8');eg.addColorStop(.6,'#182a42');eg.addColorStop(1,'#38485a');ec.fillStyle=eg;ec.fillRect(0,0,1024,512);
for(const [x,y,w,h] of [[100,60,100,300],[390,40,280,95],[800,100,70,260]]){ec.fillStyle='#f5fbff';ec.fillRect(x,y,w,h);}
const envTexture=new T.CanvasTexture(envCanvas);envTexture.mapping=T.EquirectangularReflectionMapping;envTexture.colorSpace=T.SRGBColorSpace;
const pmrem=new T.PMREMGenerator(renderer);const environment=pmrem.fromEquirectangular(envTexture);scene.environment=environment.texture;envTexture.dispose();pmrem.dispose();
scene.add(new T.HemisphereLight(0xb3dcff,0x14213a,2.4));
const keyLight=new T.DirectionalLight(0xd9ebff,5);keyLight.position.set(-7,12,14);scene.add(keyLight);
const rim=new T.DirectionalLight(0x5e9fff,4);rim.position.set(14,3,-7);scene.add(rim);
const redLight=new T.PointLight(0xff6775,80,30);redLight.position.set(8,1,5);scene.add(redLight);

function physical(color,roughness=.25,metalness=.45,extra={}){return new T.MeshPhysicalMaterial({color,roughness,metalness,clearcoat:1,clearcoatRoughness:.15,envMapIntensity:1.1,...extra});}
function mesh(geometry,material,parent=group){const m=new T.Mesh(geometry,material);parent.add(m);return m;}
function sphere(r,color,x,y,z,parent=group){const o=mesh(new T.SphereGeometry(r,48,32),physical(color,.19,.55),parent);o.position.set(x,y,z);return o;}
function torus(r,tube,color,parent=group){return mesh(new T.TorusGeometry(r,tube,20,150),physical(color,.2,.7),parent);}
function line(points,color,opacity=.2,parent=group){const g=new T.BufferGeometry().setFromPoints(points.map(p=>new T.Vector3(...p)));const o=new T.Line(g,new T.LineBasicMaterial({color,transparent:true,opacity}));parent.add(o);return o;}
function tube(points,r,color,parent=group){return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),150,r,12,false),physical(color,.28,.45),parent);}
function shadow(x,y,z,sx,sy,opacity=.25){const c=document.createElement('canvas');c.width=c.height=128;const cx=c.getContext('2d'),g=cx.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,`rgba(0,0,0,${opacity})`);g.addColorStop(1,'rgba(0,0,0,0)');cx.fillStyle=g;cx.fillRect(0,0,128,128);const tex=new T.CanvasTexture(c);const o=mesh(new T.PlaneGeometry(sx,sy),new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false}));o.rotation.x=-Math.PI/2;o.position.set(x,y,z);}
function stageFloor(color){
 const light=state.variant===2;
 const mat=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uLight:{value:light?1:0}},vertexShader:'varying vec3 vWorld;void main(){vec4 world=modelMatrix*vec4(position,1.);vWorld=world.xyz;gl_Position=projectionMatrix*viewMatrix*world;}',fragmentShader:'varying vec3 vWorld;uniform float uLight;void main(){float a=smoothstep(-23.,-3.,vWorld.z)*.65;vec3 dark=vec3(.025,.055,.105);vec3 pale=vec3(.72,.71,.67);gl_FragColor=vec4(mix(dark,pale,uLight),a);}'});
 const floor=mesh(new T.PlaneGeometry(180,100),mat);floor.rotation.x=-Math.PI/2;floor.position.set(0,-4,-7);
}
function atmosphere(light){
 const mat=new T.ShaderMaterial({depthWrite:false,uniforms:{uTime:{value:0},uLight:{value:light?1:0},uAccent:{value:new T.Color(cues[state.cue].color)}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:`varying vec2 vUv;uniform float uTime;uniform float uLight;uniform vec3 uAccent;
 void main(){vec2 p=vUv;float a=exp(-6.0*length((p-vec2(.76,.55))*vec2(1.,.8)));float b=exp(-7.0*length((p-vec2(.23,.48))*vec2(1.,.8)));float band=exp(-30.*abs(p.y-.35-.04*sin(p.x*4.+uTime*.02)));vec3 dark=vec3(.018,.038,.085)+vec3(.025,.09,.23)*a+vec3(.02,.05,.12)*b+uAccent*band*.018;vec3 pale=vec3(.78,.78,.74)+vec3(.13,.13,.12)*a-vec3(.035,.028,.02)*b;gl_FragColor=vec4(mix(dark,pale,uLight),1.);}`});
 background=mesh(new T.PlaneGeometry(Math.max(170,layout.width+100),60),mat);background.position.set(0,0,-24);
}
function clear(){
 const geometries=new Set(),materials=new Set();group.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);});
 for(const g of geometries)g.dispose();for(const m of materials){if(m.map&&m.map!==environment.texture)m.map.dispose();m.dispose();}
 group.clear();moving.length=0;logoSystems.length=0;hero=null;secondary=null;
}
function positions(){const p=panorama(state),width=p.width/p.height*10,main=p.screens.find(sc=>sc.id==='front')||p.screens[0],companion=p.screens.find(sc=>sc.id==='left')||p.screens.find(sc=>sc.id!==main.id)||main,frontWidth=main.width/p.height*10,leftWidth=companion.width/p.height*10;return {width,leftWidth,frontWidth,main,companion,screens:p.screens,seam:-width/2+main.x/p.height*10,hx:-width/2+main.x/p.height*10+frontWidth*.75,lx:-width/2+companion.x/p.height*10+leftWidth*.53};}

function blueHour(){
 atmosphere(false);stageFloor('#0a1830');const {hx,lx}=layout;
 hero=new T.Group();hero.position.set(hx,.1,0);group.add(hero);
 const pearl=physical('#6b9bdc',.12,.84);
 const shell=mesh(new T.TorusKnotGeometry(1.8,.47,220,32,2,3),pearl,hero);shell.rotation.set(.2,.5,-.35);moving.push({o:shell,type:'knot'});
 [[3.15,.055,'#8fb6e7',.8,.38,-.5],[2.85,.085,'#0066b3',-.8,.35,.5],[3.5,.035,'#abbdd7',1.15,-.3,.4]].forEach(([r,w,c,x,y,z],i)=>{const o=torus(r,w,c,hero);o.rotation.set(x,y,z);moving.push({o,type:'orbit',base:[x,y,z],phase:i});});
 sphere(.27,'#ed1c24',-2.6,1.2,.6,hero);sphere(.45,'#c3d0e4',2.5,-1.5,1.5,hero);
 shadow(hx,-3.98,0,11,6,.5);
 secondary=new T.Group();secondary.position.set(lx,-.3,-3);group.add(secondary);
 for(let i=0;i<3;i++){const r=torus(2.2-i*.27,.055,i===1?'#377ac7':'#6c9ecb',secondary);r.rotation.set(.85+i*.18,-.7+i*.4,-.25);moving.push({o:r,type:'orbit',base:[r.rotation.x,r.rotation.y,r.rotation.z],phase:i+4});}
 sphere(.7,'#2862a9',0,0,0,secondary);sphere(.2,'#ed1c24',1.6,1,1,secondary);
 for(let i=0;i<35;i++){const x=Math.sin(i*17.31)*layout.width*.48,y=Math.cos(i*13.73)*3.5,z=-4-Math.abs(Math.sin(i*4.4))*9;sphere(.018+(i%3)*.009,i%8===0?'#b77c8e':'#7b9ac4',x,y,z);}
 for(let i=0;i<5;i++){const y=-3.9+i*.02;line([[-layout.width,y,-i*6-2],[layout.width,y,-i*6-2]],'#2d4d75',.22);}
}
function ribbonGeometry(phase=0){
 const pos=[],uv=[],idx=[],N=220;
 for(let i=0;i<=N;i++){const u=i/N*Math.PI*2;const center=new T.Vector3(3.4*Math.sin(u),2.15*Math.sin(2*u),.9*Math.cos(u));const tangent=new T.Vector3(3.4*Math.cos(u),4.3*Math.cos(2*u),-.9*Math.sin(u)).normalize();const n=new T.Vector3(Math.cos(u*1.5+phase),Math.sin(u*1.5+phase),1.3).cross(tangent).normalize();for(let j=0;j<2;j++){const p=center.clone().addScaledVector(n,(j-.5)*.83);pos.push(p.x,p.y,p.z);uv.push(i/N,j);}if(i<N){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
}
function commonGround(){
 atmosphere(false);background.material.uniforms.uAccent.value.set('#e36b88');stageFloor('#151628');keyLight.color.set('#ffe4e1');rim.color.set('#538fff');
 const {hx,lx}=layout;hero=new T.Group();hero.position.set(hx-.6,.2,0);group.add(hero);
 const r1=mesh(ribbonGeometry(.3),physical('#0066b3',.22,.53,{side:T.DoubleSide}),hero);r1.rotation.set(.1,.4,-.2);moving.push({o:r1,type:'ribbon',phase:0});
 const r2=mesh(ribbonGeometry(1.1),physical('#ed1c24',.25,.35,{side:T.DoubleSide}),hero);r2.rotation.set(-.45,-.45,.8);r2.scale.setScalar(.81);r2.position.z=-.6;moving.push({o:r2,type:'ribbon',phase:2});
 sphere(.52,'#ccd6e2',.4,-.15,1.3,hero);sphere(.15,'#e08a8d',-2.2,2.5,1,hero);
 tube([[-layout.width/2-3,-2.6,-8],[lx-4,-2,-9],[lx+1,-1.8,-6],[layout.seam,-3,-8],[hx-4,-3.4,-6],[layout.width/2+5,-1.8,-6]],.105,'#366eaf');
 tube([[-layout.width/2-3,-2.85,-7],[lx-3,-2.35,-8],[lx+1,-2.15,-5.8],[layout.seam,-3.3,-7.8],[hx-4,-3.65,-5.8],[layout.width/2+5,-2.1,-5.8]],.075,'#c4596e');
 secondary=new T.Group();secondary.position.set(lx,.4,-1.5);group.add(secondary);
 const sr=mesh(ribbonGeometry(1),physical('#427ab8',.3,.45,{side:T.DoubleSide}),secondary);sr.scale.setScalar(.58);sr.rotation.set(.4,.5,-.6);moving.push({o:sr,type:'ribbon',phase:3});
 const s2=torus(1.7,.16,'#d35d70',secondary);s2.rotation.set(1,.5,.2);moving.push({o:s2,type:'orbit',base:[1,.5,.2],phase:5});
 shadow(hx,-3.98,0,12,6,.4);shadow(lx,-3.98,0,8,5,.3);
}
function arch(width,height,depth,material,parent=group){
 const shape=new T.Shape(),r=width/2;shape.moveTo(-r,-height/2);shape.lineTo(-r,height/2-r);shape.absarc(0,height/2-r,r,Math.PI,0,true);shape.lineTo(r,-height/2);shape.closePath();
 const inner=new T.Path(),ir=r-.32;inner.moveTo(-ir,-height/2+.24);inner.lineTo(ir,-height/2+.24);inner.lineTo(ir,height/2-r);inner.absarc(0,height/2-r,ir,0,Math.PI,false);inner.closePath();shape.holes.push(inner);
 return mesh(new T.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.065,bevelThickness:.065,curveSegments:45}),material,parent);
}
function softArchitecture(){
 atmosphere(true);stageFloor('#d1cbbf');keyLight.color.set('#fff0dc');keyLight.intensity=4;rim.color.set('#c8dfff');rim.intensity=3;redLight.intensity=12;
 const {hx,lx}=layout;const porcelain=physical('#e8e3d9',.47,.07);hero=new T.Group();hero.position.set(hx,-.55,-1);group.add(hero);
 for(let i=0;i<4;i++){const a=arch(4.3-i*.15,6.5-i*.1,.4,porcelain,hero);a.position.set(-i*.38,0,-i*1.1);a.rotation.y=-.23+i*.03;}
 const stone=sphere(.87,'#547da5',-.25,-1.2,1.1,hero);moving.push({o:stone,type:'float',y:-1.2,phase:1});
 const little=sphere(.24,'#c56468',1.8,.2,2,hero);moving.push({o:little,type:'float',y:.2,phase:3});
 const base=mesh(new T.CylinderGeometry(3.7,3.85,.32,100),physical('#c9c5b9',.62,.05));base.position.set(hx,-3.7,-1);shadow(hx,-3.98,1,12,8,.25);
 secondary=new T.Group();secondary.position.set(lx,-.7,-2);group.add(secondary);
 const arc=torus(1.85,.38,'#dddbd2',secondary);arc.rotation.set(.2,.5,.2);moving.push({o:arc,type:'orbit',base:[.2,.5,.2],phase:0});
 sphere(.65,'#7894ac',-.6,.1,1.2,secondary);sphere(.25,'#cb7776',1.5,-1,1,secondary);
 const pedestal=mesh(new T.CylinderGeometry(2.7,2.8,.22,80),physical('#cec9bb',.6,.03));pedestal.position.set(lx,-3.75,-1);shadow(lx,-3.98,1,8,6,.25);
 for(let i=0;i<6;i++){const a=arch(3.8,9,.22,physical('#d4cfc5',.7,0));a.position.set(-layout.width/2+1+i*5,-.1,-14);}
}
function connectionNetwork(x,y,z,size=1){const network=new T.Group();network.position.set(x,y,z);network.scale.setScalar(size);group.add(network);const nodes=[];for(let i=0;i<16;i++){const a=i*2.4,r=1.2+(i%3)*.48,p=[Math.cos(a)*r,Math.sin(a)*r,Math.sin(i*1.7)*.7];nodes.push(p);sphere(i%5===0?.16:.08,i%5===0?'#ed1c24':'#6bacae',...p,network);}for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){if(new T.Vector3(...nodes[i]).distanceTo(new T.Vector3(...nodes[j]))<1.8)line([nodes[i],nodes[j]],'#5d969f',.45,network);}moving.push({o:network,type:'network'});return network;}
function livingResearch(){
 atmosphere(false);background.material.uniforms.uAccent.value.set('#4eb6b0');stageFloor('#0b2029');keyLight.color.set('#cff4f2');rim.color.set('#78c8d3');redLight.intensity=20;
 addResearchScreens(false);
 for(let i=0;i<5;i++){const x=-layout.width/2+i*layout.width/4;line([[x,-3.95,-20],[x,-3.95,9]],'#3c7782',.16);}
 for(let i=0;i<4;i++)line([[-layout.width,-3.95,-i*5],[layout.width,-3.95,-i*5]],'#3c7782',.16);
}

function addResearchScreens(combined){
 for(const sc of layout.screens){
  const width=sc.width/1080*10,start=-layout.width/2+sc.x/1080*10,main=sc.id===layout.main.id;
  if(!combined)connectionNetwork(start+width*(main?.93:.29),main?-2:.2,main?-1:-2,main?.34:Math.min(.75,width*.047));
  if(!combined)connectionNetwork(start+width*.72,.5,1,Math.min(1.05,width*.065));
 }
}
function extraScreens(){
 for(const sc of layout.screens){
  if(sc.id===layout.main.id||sc.id===layout.companion.id)continue;
  const width=sc.width/1080*10,start=-layout.width/2+sc.x/1080*10,x=start+width*(state.variant===4?.28:.62);
  if(state.variant===1||state.variant===4){const o=mesh(ribbonGeometry(.8),physical('#0066b3',.22,.5,{side:T.DoubleSide}));o.position.set(x,.2,-1);o.scale.setScalar(Math.min(.78,width*.07));moving.push({o,type:'ribbon',phase:3});const red=torus(Math.min(1.8,width*.13),.12,'#ed1c24');red.position.set(x,.2,-1);red.rotation.set(.7,.5,.4);moving.push({o:red,type:'orbit',base:[.7,.5,.4],phase:2});}
  else if(state.variant===2){const o=torus(Math.min(1.8,width*.16),.25,'#dcdad2');o.position.set(x,0,-1);moving.push({o,type:'orbit',base:[.2,.4,.2],phase:3});}
  else if(state.variant===0)connectionNetwork(x,0,-1,Math.min(1,width*.07));
 }
}
function sharedReality(){
 commonGround();hero.scale.setScalar(1.22);
 if(secondary){const sc=layout.companion;secondary.position.x=-layout.width/2+sc.x/1080*10+sc.width/1080*10*.28;secondary.scale.setScalar(1.1);}
 extraScreens();addResearchScreens(true);
}
function mvSymbiosis(){
 atmosphere(false);background.material.uniforms.uAccent.value.set('#528bcc');stageFloor('#0b182c');keyLight.intensity=4;rim.intensity=3;
 for(const sc of layout.screens){
  const width=sc.width/1080*10,start=-layout.width/2+sc.x/1080*10,main=sc.id===layout.main.id;
  const system=createLogoSculpture(color=>physical(color,.23,.42,{side:T.DoubleSide}));
  const scale=Math.min(main?2.95:3.8,width*.17);
  system.root.scale.setScalar(scale);system.root.position.set(start+width*(main?.70:.54),.35,0);
  group.add(system.root);logoSystems.push(system);shadow(system.root.position.x,-3.98,0,scale*3,scale*1.4,.28);
 }
 const bottom=-3.4;
 for(const color of ['#0066b3','#ed1c24']){const dz=color==='#ed1c24'?.15:0;tube([[-layout.width/2-2,bottom-dz,-8],[-layout.width*.2,bottom+.1-dz,-7],[layout.width*.2,bottom-.15-dz,-7],[layout.width/2+2,bottom+.1-dz,-8]],.035,color);}
}

function rebuild(){
 clear();document.querySelector('#error').hidden=true;layout=positions();
 keyLight.color.set('#d9ebff');keyLight.intensity=5;rim.color.set('#5e9fff');rim.intensity=4;redLight.intensity=80;
 [blueHour,commonGround,softArchitecture,livingResearch,sharedReality,mvSymbiosis][state.variant]();
 if(state.variant<3)extraScreens();
 if(secondary&&layout.main.id===layout.companion.id)secondary.visible=false;
 resize();applyOverlay();lastConfig=configKey();
}
function configKey(){return `${state.variant}/${state.cue}/`+JSON.stringify(state.screens.map(({grid,name,...sc})=>sc));}
function resize(){
 renderer.setSize(innerWidth,innerHeight,false);
 const p=panorama(state),a=p.width/p.height;camera.left=-a*5;camera.right=a*5;camera.top=5;camera.bottom=-5;
 const crop=p.screens.find(sc=>sc.id===view)||p.screens[0];camera.setViewOffset(p.width,p.height,crop.x,0,crop.width,crop.height);camera.updateProjectionMatrix();
 const aspect=screenAspect(crop.config);
 const correction=(innerWidth/innerHeight)/aspect;
 for(const id of ['branding','headline','wall-caption']){const el=document.getElementById(id);el.style.transform=`scaleX(${correction})`;el.style.transformOrigin='left center';}
 // Use physical height for equal logo scale across the differently shaped walls.
 document.querySelector('#branding').style.width=`${innerHeight*(16/9)*.3}px`;
 document.querySelector('#calibration').style.setProperty('--aspect-correction',correction);videoLayers.resize();
}
function applyOverlay(){
 document.querySelector('#art').style.filter=`brightness(${state.brightness/100})`;document.body.classList.toggle('light',state.variant===2);
 document.querySelector('#wall-logo').src=state.variant===2?'assets/logo-color.png':'assets/logo-white.png';
 document.querySelector('#branding').style.display=state.branding?'':'none';
 document.querySelector('#headline').style.display=state.headlines?'':'none';
 videoLayers.update(state);
 document.querySelector('#wall-caption').style.display=state.branding?'':'none';
 document.querySelector('#cue-index').textContent=cues[state.cue].lab;
 document.querySelector('#cue-title').textContent=cues[state.cue].ko;
 document.querySelector('#cue-en').textContent=cues[state.cue].en;
 document.querySelector('#frame-guide').style.display=state.guide?'block':'none';
 document.querySelector('#calibration').style.display=state.calibration?'block':'none';
 const sc=state.screens.find(sc=>sc.id===view)||state.screens[0];
 document.title='META / '+sc.name;document.querySelector('#cal-label').textContent=sc.name+` · ${sc.width} × ${sc.height}`;
 document.querySelector('#tile-grid').style.display=sc.grid?'block':'none';
 const cols=sc.cols,rows=sc.rows;
 document.querySelector('#tile-grid').style.backgroundSize=`${100/cols}% ${100/rows}%`;
 if(!state.screens.some(sc=>sc.id===view)){document.querySelector('#error').hidden=false;document.querySelector('#error').textContent='This screen was removed. Open a current output link from the control room.';}
}
function update(next){state=sanitize(next);if(fixedVariant!==null)state.variant=fixedVariant;if(configKey()!==lastConfig)rebuild();else{applyOverlay();resize();}}
channel.onmessage=e=>update(e.data);addEventListener('storage',e=>{if(e.key===KEY)update(read());});addEventListener('resize',resize);
let hintTimer;addEventListener('pointermove',e=>{if(state.interactive){pointer.x=e.clientX/innerWidth-.5;pointer.y=e.clientY/innerHeight-.5;}if(!preview&&!document.fullscreenElement){document.body.classList.add('show-hint');clearTimeout(hintTimer);hintTimer=setTimeout(()=>document.body.classList.remove('show-hint'),1800);}});
addEventListener('pointerleave',()=>{pointer.x=pointer.y=0;});
addEventListener('click',()=>{if(preview)return;document.body.classList.remove('show-hint');if(!document.fullscreenElement)document.documentElement.requestFullscreen().catch(()=>{});videoLayers.play();});
function send(next){save(next);channel.postMessage(next);update(next);sync.send(next);}
addEventListener('keydown',e=>{if(preview)return;if(e.code==='Space'){e.preventDefault();send(setPaused(state,!state.paused));}if(/^[1-6]$/.test(e.key))send({...state,variant:+e.key-1});if(e.key.toLowerCase()==='g')send({...state,guide:!state.guide});});
rebuild();
const sync=params.has('capture')||preview?{send(){}}:connectSync(update);
function draw(now){
 requestAnimationFrame(draw);if(now-lastFrame<1000/(preview?25:60)-1)return;lastFrame=now;
 if(preview&&!params.has('capture')&&parent!==window&&parent.METAStudio)setClockOffset(parent.METAStudio.now()-Date.now());
 const t=motionAllowed()?timeline(state):0,slow=t*.24;
 if(background)background.material.uniforms.uTime.value=t*state.motionAmount;
 for(const system of logoSystems){system.update(motionAllowed()?t:15,motionAllowed()?state.motionAmount:1);system.root.rotation.y=state.interactive?pointer.x*.12:0;system.root.rotation.x=state.interactive?-pointer.y*.08:0;}
 for(const m of moving){const o=m.o;
  const pose=motionPose(m.type,t,m.phase||0,state.motionAmount);
  if(m.type==='orbit'){o.rotation.set(m.base[0]+pose.x,m.base[1]+pose.y,m.base[2]+pose.z);}
  if(m.type==='knot'){o.rotation.set(.2+Math.sin(slow*state.motionAmount)*.2,.5+slow*.65*state.motionAmount,-.35+Math.sin(slow*.7*state.motionAmount)*.16);}
  if(m.type==='ribbon'||m.type==='network')o.rotation.set(pose.x,pose.y,pose.z);
  if(m.type==='float')o.position.y=m.y+pose.lift;
  if(m.type==='gallery'){o.rotation.set(pose.x,pose.y,pose.z);o.position.y=m.y+pose.lift;}
 }
 if(hero){hero.position.y=Math.sin(t*.5*state.motionAmount)*.24+(state.variant===2?-.55:[1,4].includes(state.variant)?.2:0);if(state.interactive){hero.rotation.y+=(pointer.x*.12-hero.rotation.y)*.025;hero.rotation.x+=(-pointer.y*.1-hero.rotation.x)*.025;}else{hero.rotation.x=0;hero.rotation.y=0;}}
 if(secondary&&state.variant!==2)secondary.rotation.y=Math.sin(slow*.6*state.motionAmount)*.13;
 videoLayers.tick(now);
 renderer.render(scene,camera);
 frames++;if(now-statsEpoch>500){fps=frames*1000/(now-statsEpoch);frames=0;statsEpoch=now;}
 document.body.dataset.ready='true';document.body.dataset.variant=String(state.variant);
 document.body.dataset.motionAmount=String(state.motionAmount);
}
requestAnimationFrame(draw);
// Deterministic phase and ready state are useful for on-set stills and visual QA.
window.META={get state(){return state;},get time(){return timeline(state);},get stats(){return {fps,videoBlocked:videoLayers.blocked,reducedMotion:!motionAllowed(),movingObjects:moving.length+logoSystems.length*6};},get video(){return videoLayers.stats[0]||null;},get videos(){return videoLayers.stats;},renderAt(seconds){state={...state,paused:true,offset:seconds};videoLayers.update(state);videoLayers.play();},get renderer(){return renderer;}};
