import type {Bird} from './catalog';
import type {AudioFrame} from '../audio/types';
import type {Point,EngineSettings} from '../engine/types';
import type {BrushFrame} from './ResonantBrush';
import {sheetFor} from '../engine/layout';
import {createRng} from '../vendor/pigment-drift/engine/params';
export interface InkbirdFlight{point:Point;heading:number;color:string}
/** A tap launches an autonomous, seeded flight. Size controls its territory,
 * never nib width. The hand cannot steer it after launch. */
export class SignatureInk{
 private last:Point|null=null;private point:Point;private phase=0;private energy=.3;private brightness=.5;private heading:number;private turn=0;private attackAt=-Infinity;private rng:()=>number;
 private sx:number;private sy:number;private radius:number;private center:Point;
 flight:InkbirdFlight|null=null;
 constructor(readonly bird:Bird,readonly seed:number,readonly origin:Point,settings:EngineSettings,size=.55,private opacity=1){
  const s=sheetFor(settings.format);this.sx=Math.min(s.width,s.height)/s.width;this.sy=Math.min(s.width,s.height)/s.height;
  this.radius=.05+.38*Math.max(0,Math.min(1,size));this.rng=createRng(seed^0x1b17d);this.heading=this.rng()*Math.PI*2;
  this.center={...origin};
  this.point={...origin};
 }
 /** Compatibility with the shared sound voice: pointer motion never steers. */
 move(_point:Point,_time:number,_connect=true){}
 step(f:AudioFrame|undefined,time:number):BrushFrame{
  const empty=():BrushFrame=>({segments:[],ink:[],point:null,feedback:{speed:0,radius:0,splashes:0}});
  if(!f){this.last=null;this.flight=null;return empty();}
  this.energy+=(Math.max(0,Math.min(1,f.energy))-this.energy)*.28;this.brightness+=(f.brightness-this.brightness)*.15;this.phase+=.13;
  const attack=f.active&&f.energy>0&&f.flux>.72&&time-this.attackAt>.2;
  this.turn+=(this.rng()-.5)*.22;this.turn*=.9;
  this.heading+=this.turn+(this.brightness-.5)*.16+Math.sin(this.phase*.73+this.seed)*.055+(attack?(this.rng()-.5)*1.1:0);
  // A soft inward turn prevents clipped/bouncing squares at the territory edge.
  const dx=(this.point.x-this.center.x)/this.sx,dy=(this.point.y-this.center.y)/this.sy,d=Math.hypot(dx,dy);
  if(d>this.radius*.55){const inward=Math.atan2(-dy,-dx),angle=Math.atan2(Math.sin(inward-this.heading),Math.cos(inward-this.heading));this.heading+=angle*Math.min(.32,(d/this.radius-.55)*.5);}
  const stride=this.radius*(.025+.055*this.energy+.018*f.flux),from=this.last??this.point;
  let x=dx+Math.cos(this.heading)*stride,y=dy+Math.sin(this.heading)*stride;const distance=Math.hypot(x,y);
  if(distance>this.radius){x*=this.radius/distance;y*=this.radius/distance;}
  const point={x:Math.max(.025,Math.min(.975,this.center.x+x*this.sx)),y:Math.max(.025,Math.min(.975,this.center.y+y*this.sy))};
  if(point.x<=.026||point.x>=.974)this.heading=Math.atan2(Math.sin(this.heading),point.x<=.026?Math.abs(Math.cos(this.heading)):-Math.abs(Math.cos(this.heading)));
  if(point.y<=.026||point.y>=.974)this.heading=Math.atan2(point.y<=.026?Math.abs(Math.sin(this.heading)):-Math.abs(Math.sin(this.heading)),Math.cos(this.heading));this.point=point;this.flight={point:{...point},heading:this.heading,color:this.bird.color};
  if(!f.active||f.energy<=0||this.opacity<=0){this.last=null;return empty();}
  const points=Array.from({length:5},(_,i)=>{const t=i/4;return {x:from.x+(point.x-from.x)*t,y:from.y+(point.y-from.y)*t};});
  // Deliberately fine at every territory size: only a small sonic pressure change.
  const radius=.00085*(.8+.45*this.energy);
  const color=(this.bird.color.match(/[a-f\d]{2}/gi)??['28','24','23']).map(v=>parseInt(v,16)/255) as [number,number,number];
  const ink:BrushFrame['ink']=[{points,start:time,duration:1/30,width:radius*2*768,opacity:this.opacity,seed:this.seed,continuous:true,color}];
  const segments:BrushFrame['segments']=[{a:from,b:point,radius:radius*1.5,load:this.opacity*.3,slot:this.bird.pigmentSlot??0,water:false,waterAmount:0,strength:.32,coupling:.025,wetOnly:false,effect:'wash'}];
  let splashes=0;
  if(attack){this.attackAt=time;for(let i=0;i<3;i++){
   const angle=this.rng()*Math.PI*2,spread=.002+.016*this.rng(),tip={x:Math.max(.025,Math.min(.975,point.x+Math.cos(angle)*spread*this.sx)),y:Math.max(.025,Math.min(.975,point.y+Math.sin(angle)*spread*this.sy))};
   segments.push({...segments[0],a:tip,b:tip,radius:.0005+.0016*this.rng(),load:this.opacity*(.3+.4*this.rng()),effect:'splash'});splashes++;
  }}
  this.last=point;return {segments,ink,point,feedback:{speed:this.energy,radius,splashes}};
 }
}
