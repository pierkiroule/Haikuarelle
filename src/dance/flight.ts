export type Vec3=[number,number,number];
export const FLOCK_COUNT=6;
export function smooth(a:number,b:number,t:number){const p=Math.max(0,Math.min(1,(t-a)/(b-a)));return p*p*(3-2*p);}
/** Six phase-shifted, continuous wind ribbons. Depth separation keeps crossings airy. */
export function birdMotion(time:number,index=0){
 const t=Math.max(0,Math.min(30,time)),a=t*.27+index*Math.PI/3;
 const glide=(Math.sin(t*.48+index*1.7)+1)/2,phase=t*(5.3+index*.13)+index*1.8;
 const position:Vec3=[1.65*Math.cos(a),.55*Math.sin(2*a)+.16*Math.sin(t*.7+index),.85*Math.sin(a)+.20*Math.cos(2*a+index*.3)];
 return {time:t,position,flap:.12+(.12+.55*(1-glide))*Math.sin(phase),fold:0,glide,phase,feet:0,contact:false,pitch:.13*Math.sin(a*2),roll:.30*Math.sin(a+.6),yaw:-a-.4,scale:.70+index*.025};
}
export function birdModel(time:number,index=0){
 const s=birdMotion(time,index),cy=Math.cos(s.yaw),sy=Math.sin(s.yaw),cp=Math.cos(s.pitch),sp=Math.sin(s.pitch),cr=Math.cos(s.roll),sr=Math.sin(s.roll),k=s.scale;
 return new Float32Array([(cy*cr+sy*sp*sr)*k,cp*sr*k,(-sy*cr+cy*sp*sr)*k,0,(-cy*sr+sy*sp*cr)*k,cp*cr*k,(sy*sr+cy*sp*cr)*k,0,sy*cp*k,-sp*k,cy*cp*k,0,...s.position,1]);
}
export function transformPoint(matrix:Float32Array,p:Vec3):Vec3{return [0,1,2].map(i=>matrix[i]*p[0]+matrix[4+i]*p[1]+matrix[8+i]*p[2]+matrix[12+i]) as Vec3;}
/** Two complete mirrored paintings, joined without any anatomical body. */
export function wingPosition(uv:Vec3,time:number,side:number,ratio=1,root=.16):Vec3{
 const s=birdMotion(time),height=Math.min(1.05,.9/ratio),width=height*ratio,u=uv[0],v=uv[1],reach=(u-root)*width,flex=.045*Math.sin(s.phase-.7)*Math.sin(u*Math.PI);
 return [side*(.025+reach*Math.cos(s.flap)),.09+reach*Math.sin(s.flap)+flex,(v-.5)*height*(1-.65*u)+.18*u*u];
}
/** A slow orbit alternates breathing room and a closer escort of the flock. */
export function flightPose(time:number,aspect=9/16,_focus:readonly Vec3[]=[],_ratio=1,_root=.16){
 const t=Math.max(0,Math.min(30,time)),angle=.6+t*.19,close=(1-Math.cos(t*Math.PI/15))/2;
 const portrait=Math.max(1,(9/16)/aspect),radius=(9.2-1.0*close)*portrait;
 const lead=birdMotion(t,0).position;
 const target:Vec3=[lead[0]*.16*close,.12+lead[1]*.12,lead[2]*.12*close];
 const eye:Vec3=[target[0]+Math.sin(angle)*radius,target[1]+1.25+.35*Math.sin(t*.21),target[2]+Math.cos(angle)*radius];
 return {eye,target,roll:.055*Math.sin(t*.23)};
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
 return surfaceMesh(compact?64:96,compact?88:128);
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
