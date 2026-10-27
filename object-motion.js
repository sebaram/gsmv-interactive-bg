import * as T from './vendor/three.module.js';
import {clockTime,motionPose} from './motion.js';

export function motionContext(object,time,amount=1){
 const chain=[];for(let node=object;node;node=node.parent)if(node.userData.authorMotion)chain.unshift(node.userData.authorMotion);
 let parentTime=time,speed=1;for(const settings of chain){parentTime=time;time=clockTime(time,settings);speed*=settings.motionSpeed??1;amount*=settings.motionAmount??1;}
 return {time,parentTime,amount,speed};
}
export function recordMotion(object,spec){object.userData.motionSpec={...spec,position:object.position.toArray(),rotation:[object.rotation.x,object.rotation.y,object.rotation.z],scale:object.scale.toArray()};}
export function sampledTransform(object,time,amount=1,pointer=null){
 const spec=object.userData.motionSpec;if(!spec)return {position:object.position.clone(),quaternion:object.quaternion.clone(),scale:object.scale.clone()};
 const position=new T.Vector3(...spec.position),rotation=new T.Euler(...spec.rotation),scale=new T.Vector3(...spec.scale),pose=motionPose(spec.type,time,spec.phase||0,amount),slow=time*.24;
 if(spec.type==='orbit')rotation.set(spec.base[0]+pose.x,spec.base[1]+pose.y,spec.base[2]+pose.z);
 if(spec.type==='knot')rotation.set(.2+Math.sin(slow*amount)*.2,.5+slow*.65*amount,-.35+Math.sin(slow*.7*amount)*.16);
 if(spec.type==='ribbon'||spec.type==='network')rotation.set(pose.x,pose.y,pose.z);
 if(spec.type==='float')position.y=spec.y+pose.lift;
 if(spec.type==='gallery'){rotation.set(pose.x,pose.y,pose.z);position.y=spec.y+pose.lift;}
 if(spec.type==='hero'){position.y=Math.sin(time*.5*amount)*.24+spec.baseY;rotation.x=pointer?-pointer.y*.1:0;rotation.y=pointer?pointer.x*.12:0;}
 if(spec.type==='secondary')rotation.y=Math.sin(slow*.6*amount)*.13;
 return {position,quaternion:new T.Quaternion().setFromEuler(rotation),scale};
}
export function applySample(object,time,amount,pointer=null){const sample=sampledTransform(object,time,amount,pointer);object.position.copy(sample.position);object.quaternion.copy(sample.quaternion);object.scale.copy(sample.scale);}
export function sampledWorld(object,time,amount,wrappers,copyRoots=new Map()){
 const chain=[];let matrix=new T.Matrix4();for(let node=object;node&&node.parent;node=node.parent){if(wrappers.has(node))continue;if(copyRoots.has(node)){matrix=sampledWorld(copyRoots.get(node),time,amount,wrappers,copyRoots);break;}chain.unshift(node);}
 for(const node of chain){const p=sampledTransform(node,time,amount);matrix.multiply(new T.Matrix4().compose(p.position,p.quaternion,p.scale));}return matrix;
}
