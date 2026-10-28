export type Vec3=[number,number,number];
export function smooth(a:number,b:number,t:number){const p=Math.max(0,Math.min(1,(t-a)/(b-a)));return p*p*(3-2*p);}
/** A poetic reconstruction from the finished texture, not a recording of brush history. */
export function processState(time:number){
 const t=Math.max(0,Math.min(30,time));
 return {time:t,emergence:smooth(.5,10,t),diffusion:smooth(4,14,t),drying:smooth(19,28,t),fluidity:1-smooth(19,28,t)};
}
/** One complete, unmirrored sheet of pigment, with asymmetric liquid motion. */
export function surfacePosition(u:number,v:number,time:number,ratio=1):Vec3{
 const s=processState(time),height=2/Math.max(1,ratio),width=height*ratio;
 const x=(u-.5)*width,y=(.5-v)*height,f=s.fluidity;
 const twist=f*(.95*Math.sin(v*4.7+time*.38)+.35*Math.sin(time*.27));
 const wave=.30*Math.sin(u*5.1+v*3.7-time*.65)+.13*Math.cos(v*8.3-u*2.6+time*.43);
 return [x*Math.cos(twist)+.09*f*Math.sin(v*7+time*.32),y+.09*f*Math.cos(u*6-time*.4),-x*Math.sin(twist)+f*wave];
}
/** Two sweeping close passes at actual pigment, followed by a full, calm reveal. */
export function flightPose(time:number,aspect=9/16,focus:readonly Vec3[]=[],ratio=1,_root=0){
 const t=Math.max(0,Math.min(30,time)),s=processState(t),height=2/Math.max(1,ratio),width=height*ratio;
 const wide=Math.max(height*1.5,width/aspect*1.15);
 const pass=smooth(2,6,t)*(1-smooth(8,12,t))+.85*smooth(13,16,t)*(1-smooth(19,24,t));
 const between=smooth(10,17,t),first=focus[0]??[.35,.42,0],second=focus[1]??[.65,.6,0];
 const uv=first.map((v,i)=>v*(1-between)+second[i]*between) as Vec3;
 const point=surfacePosition(uv[0],uv[1],t,ratio),follow=pass*.72;
 const target=point.map(v=>v*follow) as Vec3;
 const distance=wide*(1-pass*.57),angle=.48*Math.sin(t*.27)*s.fluidity;
 const eye:Vec3=[target[0]+distance*Math.sin(angle),target[1]+.48*Math.cos(t*.31)*s.fluidity,target[2]+distance*Math.cos(angle)];
 return {eye,target,roll:.15*Math.sin(t*.33)*s.fluidity};
}

const sub=(a:Vec3,b:Vec3):Vec3=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const dot=(a:Vec3,b:Vec3)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a:Vec3,b:Vec3):Vec3=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const normal=(a:Vec3):Vec3=>{const n=Math.hypot(...a)||1;return a.map(v=>v/n) as Vec3;};
export function flightMatrix(time:number,aspect:number,focus:readonly Vec3[]=[],ratio=1,root=.16){
 const {eye,target,roll}=flightPose(time,aspect,focus,ratio,root),z=normal(sub(eye,target)),up:Vec3=[Math.sin(roll),Math.cos(roll),0],x=normal(cross(up,z)),y=cross(z,x);
 const view=[x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1];
 const f=1/Math.tan(Math.PI/6),near=.035,far=30,projection=[f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0];
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
