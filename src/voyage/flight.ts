import type {Vec3} from './sculpture';
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
/** A continuous 360° route. Side passes stay outside the bounding sphere;
 * face passes approach the pigment without crossing its symmetrical shell. */
export function flightPose(time:number,radius:number,sites:readonly Vec3[]):{position:Vec3;target:Vec3}{
  const r=Math.max(.5,radius),phase=time*Math.PI*2/80;
  // Linger near the two coloured faces; pass the exposed sides more briskly.
  const theta=phase-.38*Math.sin(phase*2);
  const locations=sites.length?sites:[[0,0,0] as Vec3];
  const visit=Math.max(0,time-4)/12,i=Math.floor(visit)%locations.length;
  const t=Math.min(1,(visit-Math.floor(visit))*3),blend=t*t*(3-2*t);
  const a=locations[(i+locations.length-1)%locations.length],b=locations[i];
  const intro=Math.min(1,time/5),focus=a.map((v,j)=>mix(v,b[j],blend)*intro) as Vec3;
  const face=Math.pow(Math.abs(Math.cos(theta)),6)*intro;
  return {target:[focus[0],focus[1],0],position:[
    mix(Math.sin(theta)*(r+1),focus[0]+Math.sin(theta)*.3,face),
    mix(Math.sin(theta*2)*r*.35,focus[1]+.12*Math.sin(time*.2),face),
    Math.cos(theta)*mix(r*1.7+.9,.82,face),
  ]};
}

/** Rejoin the flight on the viewed hemisphere after manual orbiting, rather
 * than interpolating straight through the sculpture from back to front. */
export function resumeTime(position:Vec3,radius:number):number{
  const r=Math.max(.5,radius);let theta=Math.atan2(position[0]/(r+1),position[2]/(r*1.7+.9));
  if(theta<0)theta+=Math.PI*2;
  let a=0,b=Math.PI*2;
  for(let i=0;i<24;i++){const mid=(a+b)/2;if(mid-.38*Math.sin(mid*2)<theta)a=mid;else b=mid;}
  return 80+(a+b)/2/(Math.PI*2)*80;
}
