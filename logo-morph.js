// Coordinates copied from the six colored polylines in assets/identity.svg.
export const facets=[
 {color:'#0066b3',points:[[0,63.33],[0,0],[45.45,0]]},
 {color:'#0066b3',points:[[85.89,0],[59.13,37.32],[59.13,0]]},
 {color:'#0066b3',points:[[126.33,0],[99.54,37.32],[99.54,0]]},
 {color:'#ed1c24',points:[[42.21,70.87],[42.21,33.55],[15.42,70.87]]},
 {color:'#ed1c24',points:[[82.63,70.87],[82.63,33.55],[55.86,70.87]]},
 {color:'#ed1c24',points:[[141.73,7.52],[141.73,70.87],[96.28,70.87]]}
];
const smooth=x=>{const n=Math.max(0,Math.min(1,x));return n*n*(3-2*n);};
export function cycle(time){
 const phase=((time%36)+36)%36/36;
 const assembly=smooth((phase-.17)/.18)*(1-smooth((phase-.59)/.21));
 return {phase,assembly,morph:1-assembly};
}
export function facetPose(time,index){
 const {phase,assembly,morph}=cycle(time);
 if(assembly===1)return {x:0,y:0,z:0,rotationX:0,rotationY:0,rotationZ:0,morph:0};
 const pair=index%3,blue=index<3,a=phase*Math.PI*2+pair*Math.PI*2/3+(blue?0:Math.PI);
 return {x:morph*(Math.cos(a)*.36+(blue?-.12:.12)),y:morph*Math.sin(a)*.3,z:morph*Math.sin(a+.7)*.28,rotationX:morph*Math.sin(phase*Math.PI*2)*.22,rotationY:morph*Math.sin(a)*.85,rotationZ:morph*Math.cos(a+.3)*.32,morph};
}
export function morphSurface(x,y,radial,depth,morph,time,radius=.55,side=1){
 const len=Math.hypot(x,y),angle=len>1e-8?Math.atan2(y,x):0;
 const r=radial*radius*(1+.055*Math.sin(angle*3+time*.45));
 const tx=len>1e-8?Math.cos(angle)*r:0,ty=len>1e-8?Math.sin(angle)*r:0;
 const z=side*Math.sqrt(Math.max(0,1-radial*radial))*radius*.62+Math.sin(angle*2+time*.5)*radial*.025;
 return [x+(tx-x)*morph,y+(ty-y)*morph,side*depth/2+(z-side*depth/2)*morph];
}
