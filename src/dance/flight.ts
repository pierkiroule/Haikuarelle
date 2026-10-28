export type Vec3=[number,number,number];
interface Key{time:number;eye:Vec3;target:Vec3;roll:number}
const keys:Key[]=[
 {time:0,eye:[0,-.12,2.5],target:[0,0,.05],roll:0},
 {time:1.8,eye:[-.56,-.22,1.65],target:[-.07,.02,.06],roll:-.19},
 {time:3.6,eye:[.20,.14,.87],target:[0,0,.09],roll:.25},
 {time:5.2,eye:[-.22,-.10,.78],target:[0,0,.08],roll:-.24},
 {time:7.2,eye:[.62,.18,1.65],target:[.06,0,.05],roll:.16},
 {time:9,eye:[0,-.12,2.5],target:[0,0,.05],roll:0},
];
function hermite(a:number,b:number,ma:number,mb:number,t:number,span:number){const t2=t*t,t3=t2*t;return (2*t3-3*t2+1)*a+(t3-2*t2+t)*ma*span+(-2*t3+3*t2)*b+(t3-t2)*mb*span;}
/** A cyclic, continuous FPV route: reveal, bank, approach, skim, pull away. */
export function flightPose(time:number,aspect=9/16,focus:readonly Vec3[]=[]){
 const t=Math.max(0,Math.min(9,time)),segment=Math.min(keys.length-2,Math.max(0,keys.findIndex((k,i)=>i<keys.length-1&&t>=k.time&&t<=keys[i+1].time))),a=keys[segment],b=keys[segment+1];
 const before=segment===0?{...keys[4],time:keys[4].time-9}:keys[segment-1],after=segment+2>=keys.length?{...keys[1],time:keys[1].time+9}:keys[segment+2],span=b.time-a.time,u=(t-a.time)/span;
 const focal=(index:number)=>index===2?(focus[0]??[0,0,0]):index===3?(focus[1]??focus[0]??[0,0,0]):[0,0,0];
 const value=(key:Key,index:number,kind:'eye'|'target',c:number)=>key[kind][c]+focal(index)[c];
 const sample=(kind:'eye'|'target',c:number)=>hermite(value(a,segment,kind,c),value(b,segment+1,kind,c),(value(b,segment+1,kind,c)-value(before,(segment+keys.length-2)%(keys.length-1),kind,c))/(b.time-before.time),(value(after,(segment+2)%(keys.length-1),kind,c)-value(a,segment,kind,c))/(after.time-a.time),u,span);
 const eye=[0,1,2].map(c=>sample('eye',c)) as Vec3,target=[0,1,2].map(c=>sample('target',c)) as Vec3;
 // A narrow screen needs an initial pull-back; close passes retain their scale.
 const framing=Math.max(1,(9/16)/Math.max(.2,aspect));eye[2]+=Math.max(0,framing-1)*1.3;
 const roll=hermite(a.roll,b.roll,(b.roll-before.roll)/(b.time-before.time),(after.roll-a.roll)/(after.time-a.time),u,span);
 return {eye,target,roll};
}
const sub=(a:Vec3,b:Vec3):Vec3=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const dot=(a:Vec3,b:Vec3)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a:Vec3,b:Vec3):Vec3=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const normal=(a:Vec3):Vec3=>{const n=Math.hypot(...a)||1;return a.map(v=>v/n) as Vec3;};
export function flightMatrix(time:number,aspect:number,focus:readonly Vec3[]=[]){
 const {eye,target,roll}=flightPose(time,aspect,focus),z=normal(sub(eye,target)),up:Vec3=[Math.sin(roll),Math.cos(roll),0],x=normal(cross(up,z)),y=cross(z,x);
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
 candidates.sort((a,b)=>b.weight-a.weight);const first=candidates[0];if(!first)return [[0,0,0],[0,0,0]];
 const second=candidates.find(c=>Math.hypot(c.x-first.x,c.y-first.y)>.24)??first,fit=Math.min(1,.9/ratio);
 return [first,second].map(p=>[(p.x-.5)*ratio*fit,-(p.y-.5)*fit,0]);
}
/** Indexed mesh density scales with the device while the colour texture stays HD. */
export function flightMesh(compact:boolean){
 const nx=compact?128:192,ny=compact?176:256,vertices=new Float32Array((nx+1)*(ny+1)*2),indices=new Uint16Array(nx*ny*6);let v=0,j=0;
 for(let y=0;y<=ny;y++)for(let x=0;x<=nx;x++){vertices[v++]=x/nx;vertices[v++]=y/ny;}
 for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){const a=y*(nx+1)+x,b=a+1,c=a+nx+1,d=c+1;indices.set([a,b,c,b,d,c],j);j+=6;}
 return {vertices,indices};
}
