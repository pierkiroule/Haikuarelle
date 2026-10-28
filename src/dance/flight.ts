export type Vec3=[number,number,number];
interface Key{time:number;eye:Vec3;target:Vec3;roll:number;focus?:number}
const keys:Key[]=[
 {time:0,eye:[.18,-.09,.80],target:[0,0,0],roll:-.12,focus:0},
 {time:3.5,eye:[-.38,.14,1.25],target:[0,0,0],roll:.16,focus:0},
 {time:7.5,eye:[0,.10,3.0],target:[0,0,.16],roll:0},
 {time:11.5,eye:[.70,.24,1.10],target:[0,0,0],roll:.23,focus:1},
 {time:15,eye:[0,-.10,2.9],target:[0,0,.18],roll:0},
];
function hermite(a:number,b:number,ma:number,mb:number,t:number,span:number){const t2=t*t,t3=t2*t;return (2*t3-3*t2+1)*a+(t3-2*t2+t)*ma*span+(-2*t3+3*t2)*b+(t3-t2)*mb*span;}
/** The whole painting is mapped once per wing. The second is a geometric mirror. */
export function wingPosition(uv:Vec3,time:number,side:number,ratio=1,root=.16):Vec3{
 const height=Math.min(1.2,1/ratio),width=height*ratio,t=time/15,open=t*t*(3-2*t),angle=1.04*(1-open)+.14+.10*Math.sin(time*.55)*Math.sin(Math.PI*t);
 const reach=(uv[0]-root)*width,y=(.5-uv[1])*height;
 const curl=Math.sin(uv[1]*7-time*.55)*Math.sin(uv[0]*Math.PI)*(.055+.05*open);
 return [side*(.006+reach*Math.cos(angle)),y+.025*Math.sin(time*.6+uv[0]*3)*uv[0],reach*Math.sin(angle)+curl];
}
/** Macro → mirrored reveal → bank along a wing → full opening. */
export function flightPose(time:number,aspect=9/16,focus:readonly Vec3[]=[],ratio=1,root=.16){
 const t=Math.max(0,Math.min(15,time)),segment=Math.min(keys.length-2,Math.max(0,keys.findIndex((k,i)=>i<keys.length-1&&t>=k.time&&t<=keys[i+1].time))),a=keys[segment],b=keys[segment+1],span=b.time-a.time,u=(t-a.time)/span;
 const value=(index:number,kind:'eye'|'target',c:number)=>{
  const key=keys[index];let value=key[kind][c];
  if(key.focus!==undefined){const point=wingPosition(focus[key.focus]??focus[0]??[.5,.5,0],key.time,1,ratio,root);value+=point[c];}
  else if(kind==='eye'&&c===2)value*=Math.max(.55,Math.min(1,(9/16)/aspect));
  return value;
 };
 const sample=(kind:'eye'|'target',c:number)=>{
  const before=Math.max(0,segment-1),after=Math.min(keys.length-1,segment+2);
  const ma=segment===0?0:(value(segment+1,kind,c)-value(before,kind,c))/(b.time-keys[before].time);
  const mb=segment+1===keys.length-1?0:(value(after,kind,c)-value(segment,kind,c))/(keys[after].time-a.time);
  return hermite(value(segment,kind,c),value(segment+1,kind,c),ma,mb,u,span);
 };
 const eye=[0,1,2].map(c=>sample('eye',c)) as Vec3,target=[0,1,2].map(c=>sample('target',c)) as Vec3;
 const before=Math.max(0,segment-1),after=Math.min(keys.length-1,segment+2);
 const roll=hermite(a.roll,b.roll,segment===0?0:(b.roll-keys[before].roll)/(b.time-keys[before].time),segment+1===keys.length-1?0:(keys[after].roll-a.roll)/(keys[after].time-a.time),u,span);
 return {eye,target,roll};
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
 const nx=compact?128:192,ny=compact?176:256,vertices=new Float32Array((nx+1)*(ny+1)*2),indices=new Uint16Array(nx*ny*6);let v=0,j=0;
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
