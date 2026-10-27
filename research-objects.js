import * as T from './vendor/three.module.js';

// Editorial sculptures inspired by co-presence, spatial registration, reciprocal
// interaction and co-creation. These are not visualizations of research data.
export const researchObjectTypes=[['presence','Co-presence · shared table'],['registration','Shared coordinates · registration'],['feedback','Mutual response · exchange'],['cocreation','Co-creation · shared pavilion']];
const red='#ed1c24',blue='#0066b3';
function finish(color,metalness=.48,roughness=.27){return new T.MeshPhysicalMaterial({color,metalness,roughness,clearcoat:.65,clearcoatRoughness:.18,envMapIntensity:.95});}
function mesh(parent,name,geometry,material,x=0,y=0,z=0){const o=new T.Mesh(geometry,material);o.name=name;o.position.set(x,y,z);parent.add(o);return o;}
function group(parent,name,x=0,y=0,z=0){const o=new T.Group();o.name=name;o.position.set(x,y,z);parent.add(o);return o;}
function roundedShape(w,h,r){const s=new T.Shape(),x=-w/2,y=-h/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;}
function slab(w,h,d,r=.12){const g=new T.ExtrudeGeometry(roundedShape(w,h,r),{depth:d,bevelEnabled:true,bevelThickness:.035,bevelSize:.035,bevelSegments:3,curveSegments:16});g.translate(0,0,-d/2);return g;}
function beam(parent,name,a,b,width,depth,material){const start=new T.Vector3(...a),end=new T.Vector3(...b),o=mesh(parent,name,new T.BoxGeometry(width,start.distanceTo(end),depth),material);o.position.copy(start.add(end).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(...b).sub(new T.Vector3(...a)).normalize());return o;}
function plinth(root,w=4.7,d=2.5){const o=mesh(root,'Shared ground',new T.CylinderGeometry(1,1,.14,80),finish('#8796a4',.55,.4),0,-1.98,0);o.scale.set(w/2,1,d/2);return o;}
function animate(addMotion,o,story,part,extra={}){addMotion({o,type:'relation',story,part,...extra});return o;}
function copresence(root,addMotion){
 plinth(root,4.8,2.6);
 const pearl=finish('#dce1de',.32,.34),table=group(root,'Common workspace');
 mesh(table,'Workspace pedestal',new T.CylinderGeometry(.15,.25,1.25,40),pearl,0,-1.3,.28);
 const top=mesh(table,'Shared tabletop',new T.CylinderGeometry(.82,.85,.13,80),pearl,0,-.64,.28);top.scale.z=.78;
 for(const side of [-1,1]){
  const color=side<0?red:blue,person=group(root,side<0?'Physical presence':'Remote presence',side*1.05,-1.89,0);
  // Sculptural seats share a floor and turn toward the same work surface.
  mesh(person,'Seat',slab(.88,.18,.82,.08),finish(color),0,.82,.06);
  const back=mesh(person,'Upright presence',slab(.88,1.38,.16,.38),finish(color),0,1.52,-.36);back.rotation.x=-.08;
  for(const x of [-.3,.3])beam(person,'Seat support',[x,0,-.26],[x,.76,.18],.09,.09,finish('#778693',.7,.3));
  const head=mesh(person,'Presence highlight',new T.SphereGeometry(.2,32,20),finish(side<0?'#f8b0a7':'#a5daf2',.5,.2),0,2.53,-.3);head.scale.set(1,.85,.75);
  animate(addMotion,person,'presence','participant',{side});
  const contribution=mesh(table,side<0?'Warm contribution':'Blue contribution',slab(.45,.035,.34,.07),finish(color),side*.24,-.55,.28);
  animate(addMotion,contribution,'presence','contribution',{side});
 }
}
function contour(parent,name,w,h,r,z,material,tube=.027){const points=roundedShape(w,h,r).getPoints(72).map(p=>new T.Vector3(p.x,p.y,z));return mesh(parent,name,new T.TubeGeometry(new T.CatmullRomCurve3(points,true,'centripetal'),220,tube,8,true),material);}
function coordinates(root,addMotion){
 root.rotation.y=-.18;
 plinth(root,4.7,2.9);
 const solid=group(root,'Physical coordinate frame',0,0,.03),virtual=group(root,'Virtual coordinate frame',0,0,.03),warm=finish(red,.35,.3),cool=finish(blue,.6,.21);
 const shape=roundedShape(2.65,3.65,.27),hole=roundedShape(2.29,3.29,.16);shape.holes.push(new T.Path(hole.getPoints(64).reverse()));
 mesh(solid,'Solid room opening',new T.ExtrudeGeometry(shape,{depth:.23,bevelEnabled:true,bevelThickness:.035,bevelSize:.03,bevelSegments:3,curveSegments:32}),warm,0,0,-.115);
 // The blue volume retains the exact aperture proportions, with offset depth.
 for(const z of [-.28,.28]){
  contour(virtual,'Registered outer contour',2.73,3.73,.28,z,cool,.035);
  contour(virtual,'Registered inner contour',2.23,3.23,.14,z,cool,.025);
 }
 for(const x of [-1.365,1.365])for(const y of [-1.52,1.52])beam(virtual,'Depth registration edge',[x,y,-.28],[x,y,.28],.035,.035,cool);
 animate(addMotion,solid,'registration','frame',{side:-1});animate(addMotion,virtual,'registration','frame',{side:1});
 const passage=mesh(root,'Passage through shared space',new T.SphereGeometry(.15,32,20),finish('#d8edee',.4,.15),0,-1.15,0);
 animate(addMotion,passage,'registration','passage');
}
function response(root,addMotion){
 plinth(root,4.8,2.7);
 mesh(root,'Reciprocal connection',slab(2.8,.055,.12,.02),finish('#8798a9',.7,.32),0,-1.36,.38);
 for(const side of [-1,1]){
  const color=side<0?red:blue,body=group(root,side<0?'Physical responsive surface':'Virtual responsive surface',side*1.28,-.2,0);
  body.rotation.y=-side*.23;
  mesh(body,'Surface pedestal',new T.CylinderGeometry(.36,.47,.60,48),finish('#84919c',.6,.35),0,-1.41,0);
  for(let i=0;i<9;i++){
   const p=(i-4)/4,width=.6+.68*Math.sqrt(Math.max(0,1-p*p));
   const rib=mesh(body,'Responsive fold '+(i+1),slab(width,.23,.22,.09),finish(color,.5,.24),0,p*1.08,.08+.12*(1-p*p));
   animate(addMotion,rib,'feedback','fold',{side,index:i});
  }
  const pulse=mesh(root,side<0?'Outgoing response':'Returning response',new T.SphereGeometry(.105,24,16),new T.MeshPhysicalMaterial({color,emissive:color,emissiveIntensity:.35,metalness:.3,roughness:.2}),0,-1.36,.48);
  animate(addMotion,pulse,'feedback','pulse',{side});
 }
}
function cocreation(root,addMotion){
 root.rotation.y=.32;
 plinth(root,5,2.8);
 for(const side of [-1,1]){
  const half=group(root,side<0?'Warm contribution to pavilion':'Blue contribution to pavilion'),mat=finish(side<0?red:blue,.45,.28);
  // Each half is incomplete alone. Their complementary roof edges meet exactly.
  for(let i=0;i<3;i++){
   const s=new T.Shape();s.moveTo(0,1.3);s.lineTo(side*1.3,.16);s.lineTo(side*1.3,-1.87);s.lineTo(side*1.08,-1.87);s.lineTo(side*1.08,.06);s.lineTo(0,1.03);s.closePath();
   const fold=mesh(half,'Folded pavilion bay '+(i+1),new T.ExtrudeGeometry(s,{depth:.44,bevelEnabled:true,bevelSize:.035,bevelThickness:.035,bevelSegments:3}),mat,0,0,-.93+i*.7);
   animate(addMotion,fold,'cocreation','half',{side,index:i});
  }
 }
 const ridge=mesh(root,'Shared roof seam',slab(.13,.15,2.04,.04),finish('#dce7e8',.6,.2),0,1.19,-.01);
 animate(addMotion,ridge,'cocreation','shared');
}
const builders={presence:copresence,registration:coordinates,feedback:response,cocreation};
export function createResearchObject(type,addMotion){
 const build=builders[type];if(!build)return null;
 const root=new T.Group();root.name=researchObjectTypes.find(t=>t[0]===type)[1];build(root,addMotion);return root;
}
