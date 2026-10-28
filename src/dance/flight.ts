export type Vec3=[number,number,number];
export const WIRE_Y=-.15,WIRE_Z=-3,LANDING_TIME=25;
export function smooth(a:number,b:number,t:number){const p=Math.max(0,Math.min(1,(t-a)/(b-a)));return p*p*(3-2*p);}
export function wireHeight(x:number,time:number){const impact=Math.max(0,time-LANDING_TIME);return WIRE_Y+.04*(x/8)**2+(time>=LANDING_TIME?.009*Math.sin(impact*9)*Math.exp(-impact*1.8)*Math.exp(-x*x*.7):0);}
export function birdMotion(time:number){
 const t=Math.max(0,Math.min(30,time)),glide=smooth(7,10,t)*(1-smooth(17,20,t)),landing=smooth(18,25,t),fold=smooth(25,28.5,t);
 const cruise=1-smooth(18,25,t),phase=2*Math.PI*(1.35*t-.16*Math.max(0,t-18));
 const flap=(.08+(.76*(1-glide)+.035*glide)*Math.sin(phase))*(1-smooth(23,25,t))+.48*smooth(23,25,t);
 const advance=smooth(0,25,t),y=1.25*(1-landing)+.08*Math.sin(t*.8)*cruise;
 const position:Vec3=[.34*Math.sin(t*.45)*cruise,y+(t>=25?wireHeight(0,t)-WIRE_Y:0),3.2-6.2*advance];
 return {time:t,position,flap,fold,glide,phase,feet:smooth(20,24,t),contact:t>=LANDING_TIME,pitch:.04*Math.sin(t*.7)*cruise+.28*smooth(18,23,t)*(1-smooth(24,27,t)),roll:.12*Math.sin(t*.55)*cruise,yaw:.18*Math.sin(t*.35)*cruise};
}
export function birdModel(time:number){
 const s=birdMotion(time),cy=Math.cos(s.yaw),sy=Math.sin(s.yaw),cp=Math.cos(s.pitch),sp=Math.sin(s.pitch),cr=Math.cos(s.roll),sr=Math.sin(s.roll);
 // Yaw * pitch * roll, column-major, followed by translation.
 return new Float32Array([cy*cr+sy*sp*sr,cp*sr,-sy*cr+cy*sp*sr,0,-cy*sr+sy*sp*cr,cp*cr,sy*sr+cy*sp*cr,0,sy*cp,-sp,cy*cp,0,...s.position,1]);
}
export function transformPoint(matrix:Float32Array,p:Vec3):Vec3{return [0,1,2].map(i=>matrix[i]*p[0]+matrix[4+i]*p[1]+matrix[8+i]*p[2]+matrix[12+i]) as Vec3;}
/** Both complete textures become aerodynamic wings, then fold against the body. */
export function wingPosition(uv:Vec3,time:number,side:number,ratio=1,root=.16):Vec3{
 const s=birdMotion(time),height=Math.min(1.05,.9/ratio),width=height*ratio,u=uv[0],v=uv[1],reach=(u-root)*width,flex=.045*(1-s.fold)*Math.sin(s.phase-.7)*Math.sin(u*Math.PI);
 const flight:Vec3=[side*(.025+reach*Math.cos(s.flap)),.09+reach*Math.sin(s.flap)+flex,(v-.5)*height*(1-.65*u)+.18*u*u];
 const folded:Vec3=[side*(.07+.06*u),.12-.11*u+.015*Math.sin(v*Math.PI),(v-.5)*.36+.20*u+.05];
 return flight.map((value,i)=>value*(1-s.fold)+folded[i]*s.fold) as Vec3;
}
/** A following drone circles the bird, opens the glide, then stays close to the perch. */
export function flightPose(time:number,aspect=9/16,_focus:readonly Vec3[]=[],_ratio=1,_root=.16){
 const s=birdMotion(time),t=s.time,angle=.60+2*Math.PI*smooth(0,30,t),portrait=Math.max(.60,Math.min(1,(9/16)/aspect));
 const radius=(2.9-.35*s.glide+.12*Math.sin(t*.22))*(1-.35*smooth(24,28,t))*portrait;
 const target:Vec3=[s.position[0],s.position[1]+.10,s.position[2]];
 const eye:Vec3=[target[0]+Math.sin(angle)*radius,target[1]+.52+.12*Math.sin(t*.3),target[2]+Math.cos(angle)*radius];
 return {eye,target,roll:.08*Math.sin(t*.35)*(1-smooth(23,27,t))};
}
const sub=(a:Vec3,b:Vec3):Vec3=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const dot=(a:Vec3,b:Vec3)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a:Vec3,b:Vec3):Vec3=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const normal=(a:Vec3):Vec3=>{const n=Math.hypot(...a)||1;return a.map(v=>v/n) as Vec3;};
export function flightMatrix(time:number,aspect:number,focus:readonly Vec3[]=[],ratio=1,root=.16){
 const {eye,target,roll}=flightPose(time,aspect,focus,ratio,root),z=normal(sub(eye,target)),up:Vec3=[Math.sin(roll),Math.cos(roll),0],x=normal(cross(up,z)),y=cross(z,x);
 const view=[x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1];
 const f=1/Math.tan(Math.PI/6),near=.035,far=12,projection=[f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0];
 return new Float32Array(Array.from({length:16},(_,i)=>{const col=Math.floor(i/4),row=i%4;return [0,1,2,3].reduce((s,k)=>s+projection[k*4+row]*view[col*4+k],0);}));
}
/** Aim close passes at real pigment, rather than at the empty middle of a sheet. */
export function pigmentFocus(pixels:Uint8ClampedArray,width:number,height:number,paper:number[],ratio:number):Vec3[]{
 const candidates:{x:number;y:number;weight:number}[]=[];const columns=8,rows=8;
 for(let cy=0;cy<rows;cy++)for(let cx=0;cx<columns;cx++){let weight=0,xsum=0,ysum=0;
  for(let y=Math.floor(cy*height/rows);y<Math.floor((cy+1)*height/rows);y++)for(let x=Math.floor(cx*width/columns);x<Math.floor((cx+1)*width/columns);x++){
   const index=(y*width+x)*4,d=Math.max(0,Math.hypot(...paper.map((p,c)=>Math.max(0,p-pixels[index+c]/255)))-.04);weight+=d;xsum+=(x+.5)*d;ysum+=(y+.5)*d;
  }if(weight>0)candidates.push({x:xsum/weight/width,y:ysum/weight/height,weight});
 }
 candidates.sort((a,b)=>b.weight-a.weight);const first=candidates[0];if(!first)return [[.5,.5,0],[.5,.5,0]];
 const second=candidates.find(c=>Math.hypot(c.x-first.x,c.y-first.y)>.24)??first;
 return [first,second].map(p=>[p.x,p.y,0]);
}
/** Indexed mesh density scales with the device while the colour texture stays HD. */
export function flightMesh(compact:boolean){
 return surfaceMesh(compact?128:192,compact?176:256);
}
export function surfaceMesh(nx:number,ny:number){
 const vertices=new Float32Array((nx+1)*(ny+1)*2),indices=new Uint16Array(nx*ny*6);let v=0,j=0;
 for(let y=0;y<=ny;y++)for(let x=0;x<=nx;x++){vertices[v++]=x/nx;vertices[v++]=y/ny;}
 for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){const a=y*(nx+1)+x,b=a+1,c=a+nx+1,d=c+1;indices.set([a,b,c,b,d,c],j);j+=6;}
 return {vertices,indices};
}
/** Register the mirror near the first substantial pigment, not the blank crop margin. */
export function pigmentRoot(pixels:Uint8ClampedArray,width:number,height:number,paper:number[]){
 const weights=new Float64Array(width);let total=0;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=(y*width+x)*4,d=Math.max(0,Math.hypot(...paper.map((p,c)=>Math.max(0,p-pixels[i+c]/255)))-.05);weights[x]+=d;total+=d;}
 if(!total)return .16;
 let sum=0;for(let x=0;x<width;x++){sum+=weights[x];if(sum>=total*.03)return Math.max(.06,Math.min(.25,(x+.5)/width));}
 return .16;
}

export function birdFeet(time:number):Vec3[]{
 const s=birdMotion(time);if(s.feet<=0)return [];
 const matrix=birdModel(time),points:Vec3[]=[],grasp=smooth(24,25,time);
 for(const side of [-1,1]){
  const root=transformPoint(matrix,[side*.045,.04,-.04]),free=transformPoint(matrix,[side*.045,-.15*s.feet,0]),grip:Vec3=[side*.045,wireHeight(side*.045,time),WIRE_Z];
  const toe=free.map((v,i)=>v*(1-grasp)+grip[i]*grasp) as Vec3,joint=root.map((v,i)=>v*.45+toe[i]*.55) as Vec3;joint[2]+=.025;
  points.push(root,joint,joint,toe);
  for(const direction of [-1,0,1])points.push(toe,[toe[0]+direction*.015,toe[1]-.004,toe[2]+(direction===0?-.03:.025)]);
 }
 return points;
}
