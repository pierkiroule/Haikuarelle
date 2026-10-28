import type {Point} from '../engine/types';
import {sheetFor,type ArtworkFormat} from '../engine/layout';
import {clamp} from '../engine/composition';

export const WET_FILM_THRESHOLD=.006;

export interface WetStroke {a:Point;b:Point;radius:number;amount:number;time:number}
export interface WetSite {point:Point;from:Point;distance:number}
export interface WetRegion {sites:WetSite[];radius:number;area:number}
// Shorter evaporation, with the same full settling tail (5.6 time constants).
export const dryingTime=(wetness:number)=>.82*(3.4+5.2*clamp(wetness));
// Conservative approximation of FIELD_STEP's clear-water shoulder (0.6..1.25).
const coverageAt=(d:number)=>{const t=clamp((d-.6)/.6);return 1-t*t*(3-2*t);};
/** A small CPU guide to the water actually deposited into the GPU's G channel.
 * It is used for drop targeting and capillary path selection, never for rendering
 * pigment. Coordinates and radii use the same short-edge metric as PaintEngine.
 */
export class WetPaper {
  private strokes:WetStroke[]=[];
  private raster:{width:number;height:number;water:Float32Array;time:number}|null=null;
  private sx:number;private sy:number;
  constructor(format:ArtworkFormat='portrait',public tau=6.15){
    const sheet=sheetFor(format),unit=Math.min(sheet.width,sheet.height);
    this.sx=sheet.width/unit;this.sy=sheet.height/unit;
  }
  clone():WetPaper{
    const copy=new WetPaper('portrait',this.tau);copy.sx=this.sx;copy.sy=this.sy;
    copy.strokes=this.strokes.map(s=>({...s,a:{...s.a},b:{...s.b}}));
    copy.raster=this.raster?{...this.raster,water:this.raster.water.slice()}:null;return copy;
  }
  replaceMoisture(snapshot:{width:number;height:number;water:Float32Array},time:number):void{
    if(snapshot.width<1||snapshot.height<1||snapshot.water.length!==snapshot.width*snapshot.height)return;
    this.raster={...snapshot,water:snapshot.water.slice(),time};this.strokes=[];
  }
  private sampled(p:Point,time:number):number{
    const r=this.raster;if(!r)return 0;
    const x=clamp(p.x*r.width-.5,0,r.width-1),y=clamp(p.y*r.height-.5,0,r.height-1);
    const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
    const at=(dx:number,dy:number)=>r.water[Math.min(r.height-1,iy+dy)*r.width+Math.min(r.width-1,ix+dx)];
    const v=(at(0,0)*(1-fx)+at(1,0)*fx)*(1-fy)+(at(0,1)*(1-fx)+at(1,1)*fx)*fy;
    return v*Math.exp(-Math.max(0,time-r.time)/this.tau);
  }
  hold(time:number):void{this.retime(time,Infinity);}
  retime(time:number,tau:number):void{
    if(this.raster){const r=this.raster,decay=Math.exp(-Math.max(0,time-r.time)/this.tau);r.water=r.water.map(v=>v*decay);r.time=time;}
    this.strokes=this.strokes.map(s=>({...s,amount:s.amount*Math.exp(-Math.max(0,time-s.time)/this.tau),time}));
    this.tau=tau;
  }
  add(a:Point,b:Point,radius:number,amount:number,time:number):void{
    if(![a.x,a.y,b.x,b.y,radius,amount,time].every(Number.isFinite))return;
    this.strokes=this.strokes.filter(s=>time-s.time<this.tau*5);
    this.strokes.push({a:{...a},b:{...b},radius:clamp(radius,.008,.2),amount:clamp(amount),time});
    if(this.strokes.length>1024)this.strokes=this.strokes.filter((_,i)=>i%2===0);
  }
  at(p:Point,time:number):number{
    let water=this.sampled(p,time);
    for(const s of this.strokes){
      const dx=(s.b.x-s.a.x)*this.sx,dy=(s.b.y-s.a.y)*this.sy;
      const px=(p.x-s.a.x)*this.sx,py=(p.y-s.a.y)*this.sy;
      const t=clamp((px*dx+py*dy)/(dx*dx+dy*dy||1));
      const d=Math.hypot(px-dx*t,py-dy*t)/s.radius;
      if(d>1.2)continue;
      const coverage=coverageAt(d);
      water=Math.max(water,s.amount*coverage*Math.exp(-Math.max(0,time-s.time)/this.tau));
    }
    return water;
  }
  /** Bounded force sites over the water already placed, including separate pools. */
  resonantSites(time:number):{point:Point;radius:number;amount:number}[]{
    const sites:{point:Point;radius:number;amount:number}[]=[];
    for(let i=this.strokes.length-1;i>=0&&sites.length<3;i--){
      const s=this.strokes[i],amount=s.amount*Math.exp(-Math.max(0,time-s.time)/this.tau);
      if(amount<.025)continue;
      const point={x:(s.a.x+s.b.x)/2,y:(s.a.y+s.b.y)/2};
      if(sites.some(p=>Math.hypot((p.point.x-point.x)*this.sx,(p.point.y-point.y)*this.sy)<Math.min(p.radius,s.radius)*.85))continue;
      sites.push({point,radius:s.radius,amount});
    }
    if(this.raster&&sites.length<3){
      const r=this.raster,stride=Math.max(1,Math.floor(Math.min(r.width,r.height)/18));
      for(let y=0;y<r.height&&sites.length<3;y+=stride)for(let x=0;x<r.width&&sites.length<3;x+=stride){
        const point={x:(x+.5)/r.width,y:(y+.5)/r.height},amount=this.sampled(point,time);
        if(amount<.025||sites.some(s=>Math.hypot((s.point.x-point.x)*this.sx,(s.point.y-point.y)*this.sy)<.12))continue;
        sites.push({point,radius:.045,amount});
      }
    }
    return sites;
  }
  /** Snapshot the connected basin, ordered by travel distance from the sample.
   * Rasterization is bounded (about 6k cells, 18k after a water snapshot), independent of screen resolution.
   * Disconnected pools and dry cuts are excluded before any pigment is scheduled.
   */
  region(origin:Point,time:number,maxSites=120,random:()=>number=()=>.5):WetRegion{
    const step=this.raster?.01:.018,nx=Math.ceil(this.sx/step),ny=Math.ceil(this.sy/step),count=nx*ny;
    const dx=this.sx/nx,dy=this.sy/ny,mask=new Float32Array(count),threshold=WET_FILM_THRESHOLD;
    const point=(i:number):Point=>({x:clamp((i%nx+.5)/nx,.025,.975),y:clamp((Math.floor(i/nx)+.5)/ny,.025,.975)});
    if(this.raster)for(let i=0;i<count;i++)mask[i]=this.sampled(point(i),time);
    for(const s of this.strokes){
      const water=s.amount*Math.exp(-Math.max(0,time-s.time)/this.tau);if(water<threshold)continue;
      const ax=s.a.x*this.sx,ay=s.a.y*this.sy,bx=s.b.x*this.sx,by=s.b.y*this.sy;
      const vx=bx-ax,vy=by-ay,length=vx*vx+vy*vy||1,r=s.radius*1.2;
      const x0=Math.max(0,Math.floor((Math.min(ax,bx)-r)/dx)),x1=Math.min(nx-1,Math.ceil((Math.max(ax,bx)+r)/dx));
      const y0=Math.max(0,Math.floor((Math.min(ay,by)-r)/dy)),y1=Math.min(ny-1,Math.ceil((Math.max(ay,by)+r)/dy));
      for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
        const px=(x+.5)*dx-ax,py=(y+.5)*dy-ay,t=clamp((px*vx+py*vy)/length);
        const coverage=coverageAt(Math.hypot(px-vx*t,py-vy*t)/s.radius),i=y*nx+x;
        mask[i]=Math.max(mask[i],water*coverage);
      }
    }
    let root=-1,closest=Infinity;
    const ox=Math.floor(origin.x*nx),oy=Math.floor(origin.y*ny);
    for(let y=Math.max(0,oy-2);y<=Math.min(ny-1,oy+2);y++)for(let x=Math.max(0,ox-2);x<=Math.min(nx-1,ox+2);x++){
      const i=y*nx+x;if(mask[i]<threshold)continue;
      const p=point(i),d=Math.hypot((p.x-origin.x)*this.sx,(p.y-origin.y)*this.sy);
      if(d<closest){closest=d;root=i;}
    }
    if(root<0)return {sites:[],radius:.025,area:0};
    const distances=new Float64Array(count).fill(Infinity),parents=new Int32Array(count).fill(-1),settled=new Uint8Array(count);
    // Binary heap for Dijkstra. Euclidean diagonal costs avoid square wavefronts.
    const heap:{i:number;d:number}[]=[];
    const push=(i:number,d:number)=>{
      let k=heap.length;heap.push({i,d});
      while(k>0){const parent=(k-1)>>1;if(heap[parent].d<=d)break;heap[k]=heap[parent];k=parent;}
      heap[k]={i,d};
    };
    const pop=()=>{
      const first=heap[0],last=heap.pop()!;
      if(heap.length){let k=0;while(k*2+1<heap.length){let child=k*2+1;if(child+1<heap.length&&heap[child+1].d<heap[child].d)child++;if(heap[child].d>=last.d)break;heap[k]=heap[child];k=child;}heap[k]=last;}
      return first;
    };
    const reached:number[]=[];distances[root]=0;push(root,0);
    while(heap.length){
      const {i,d}=pop();if(settled[i])continue;settled[i]=1;reached.push(i);
      const x=i%nx,y=Math.floor(i/nx);
      for(let sy=-1;sy<=1;sy++)for(let sx=-1;sx<=1;sx++){
        if((!sx&&!sy)||x+sx<0||x+sx>=nx||y+sy<0||y+sy>=ny)continue;
        const next=(y+sy)*nx+x+sx;if(mask[next]<threshold)continue;
        if(sx&&sy&&(mask[y*nx+x+sx]<threshold||mask[(y+sy)*nx+x]<threshold))continue;
        const cost=Math.hypot(sx*dx,sy*dy)*(1+.10/Math.max(.1,mask[next]));
        if(d+cost<distances[next]){distances[next]=d+cost;parents[next]=i;push(next,d+cost);}
      }
    }
    const area=reached.length*dx*dy,budget=Math.max(12,Math.min(160,Math.floor(maxSites)));
    let spacing=Math.max(.024,Math.sqrt(area/(budget*.62))),chosen:number[]=[];
    for(let attempt=0;attempt<5;attempt++){
      chosen=[];
      for(const i of reached){
        const x=(i%nx+.5)*dx,y=(Math.floor(i/nx)+.5)*dy;
        if(chosen.every(j=>Math.hypot(x-(j%nx+.5)*dx,y-(Math.floor(j/nx)+.5)*dy)>=spacing))chosen.push(i);
      }
      if(chosen.length<=budget)break;spacing*=1.16;
    }
    const sites=chosen.map(i=>{
      const p=point(i),jitter={x:clamp(p.x+(random()-.5)*.28/nx,.025,.975),y:clamp(p.y+(random()-.5)*.28/ny,.025,.975)};
      return {point:this.at(jitter,time)>=threshold?jitter:p,from:parents[i]>=0?point(parents[i]):{...origin},distance:distances[i]};
    });
    return {sites:sites.slice(0,budget),radius:spacing*.94,area};
  }
  get count():number{return this.strokes.length+(this.raster?1:0);}
}
