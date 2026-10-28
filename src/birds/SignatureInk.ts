import {BIRD_COLOURS} from './colourPalettes';
import {PLUMAGE_PIGMENTS} from '../engine/palettes';
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
 private last:Point|null=null;private point:Point;private energy=.3;private brightness=.5;private heading:number;private turn=0;private attackAt=-Infinity;private rng:()=>number;
 private sx:number;private sy:number;private radius:number;private center:Point;private burst=0;private turnDirection=1;private spectralPrev=.5;private pressure=.12;private lastEnergy=0;private paletteIndex=0;private strokes=0;
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
  const energy=Math.max(0,Math.min(1,f.energy)),flux=Math.max(0,Math.min(1,f.flux));
  const rise=Math.max(0,energy-this.lastEnergy),spectralChange=f.brightness-this.spectralPrev;this.spectralPrev=f.brightness;
  this.energy+=(energy-this.energy)*(energy>this.energy?.65:.2);this.brightness+=(f.brightness-this.brightness)*.3;
  const attack=f.active&&energy>0&&(flux>.62||rise>.24)&&time-this.attackAt>.16;
  if(attack){this.burst=1;this.turnDirection=Math.sign(f.treble-f.bass)||Math.sign(f.brightness-.5)||1;this.heading+=this.turnDirection*(.65+1.4*flux);}
  else this.burst*=.78;
  // Sound dominates the steering: seeded wandering is only a small undertone.
  this.turn=this.turn*.78+(this.rng()-.5)*.035;
  this.heading+=this.turn+(this.brightness-.5)*(.06+.22*energy)+spectralChange*2.8+(f.treble-f.bass)*.16*energy+this.turnDirection*this.burst*.34;
  this.heading+=Math.sin(f.time*(12+18*f.treble))*(.035+.14*flux)*energy;
  // A soft inward turn prevents clipped/bouncing squares at the territory edge.
  const dx=(this.point.x-this.center.x)/this.sx,dy=(this.point.y-this.center.y)/this.sy,d=Math.hypot(dx,dy);
  if(d>this.radius*.72){const inward=Math.atan2(-dy,-dx),angle=Math.atan2(Math.sin(inward-this.heading),Math.cos(inward-this.heading));this.heading+=angle*Math.min(.5,(d/this.radius-.72)*1.5);}
  const stride=this.radius*(.004+.09*Math.pow(energy,1.7)+.11*this.burst),from=this.last??this.point;
  let x=dx+Math.cos(this.heading)*stride,y=dy+Math.sin(this.heading)*stride;const distance=Math.hypot(x,y);
  if(distance>this.radius){x*=this.radius/distance;y*=this.radius/distance;}
  const point={x:Math.max(.025,Math.min(.975,this.center.x+x*this.sx)),y:Math.max(.025,Math.min(.975,this.center.y+y*this.sy))};
  if(point.x<=.026||point.x>=.974)this.heading=Math.atan2(Math.sin(this.heading),point.x<=.026?Math.abs(Math.cos(this.heading)):-Math.abs(Math.cos(this.heading)));
  if(point.y<=.026||point.y>=.974)this.heading=Math.atan2(point.y<=.026?Math.abs(Math.sin(this.heading)):-Math.abs(Math.sin(this.heading)),Math.cos(this.heading));this.point=point;
  const palette=BIRD_COLOURS[this.bird.id]??[];
  if(attack&&this.strokes>12&&palette.length&&this.bird.pigmentSlot===undefined){const options=palette.map((c,i)=>({i,l:parseInt(c.hex.slice(1,3),16)+parseInt(c.hex.slice(3,5),16)+parseInt(c.hex.slice(5,7),16)})).filter(c=>c.l<650);this.paletteIndex=options[Math.floor(this.rng()*options.length)]?.i??0;this.strokes=0;}
  const hex=this.bird.pigmentSlot===undefined?(palette[this.paletteIndex]?.hex??this.bird.color):this.bird.color;
  const slot=this.bird.pigmentSlot??(palette.length?PLUMAGE_PIGMENTS.length+this.paletteIndex:this.bird.slot);
  this.flight={point:{...point},heading:this.heading,color:hex};
  if(!f.active||f.energy<=0||this.opacity<=0){this.last=null;this.lastEnergy=0;this.pressure*=.35;return empty();}
  const bounded=(x:number,y:number):Point=>{const px=(x-this.center.x)/this.sx,py=(y-this.center.y)/this.sy,l=Math.hypot(px,py),k=l>this.radius?this.radius/l:1;return {x:Math.max(.025,Math.min(.975,this.center.x+px*k*this.sx)),y:Math.max(.025,Math.min(.975,this.center.y+py*k*this.sy))};};
  const points=Array.from({length:9},(_,i)=>{const t=i/8,bow=Math.sin(Math.PI*t)*this.radius*.035*this.burst*this.turnDirection;return bounded(from.x+(point.x-from.x)*t-Math.sin(this.heading)*bow*this.sx,from.y+(point.y-from.y)*t+Math.cos(this.heading)*bow*this.sy);});
  // Sonic pressure, independent of territory size: hairlines, full strokes, tears.
  const impulse=Math.max(0,f.energy-this.lastEnergy);this.lastEnergy=f.energy;
  const target=.035+Math.pow(Math.max(0,Math.min(1,f.energy)),2.2)*(.35+.9*f.flux)+impulse*1.7;
  this.pressure+=(Math.min(1.8,target)-this.pressure)*(target>this.pressure?.8:.32);
  const radius=.00022+.0038*this.pressure;this.strokes++;
  const color=(hex.match(/[a-f\d]{2}/gi)??['28','24','23']).map(v=>parseInt(v,16)/255) as [number,number,number];
  const ink:BrushFrame['ink']=[{points,start:time,duration:1/30,width:radius*2*768,opacity:this.opacity*(.55+.45*this.energy),seed:this.seed,continuous:true,color}];
  const segments:BrushFrame['segments']=[{a:from,b:point,radius:radius*1.5,load:this.opacity*.3,slot,water:false,waterAmount:0,strength:.32,coupling:.025,wetOnly:false,effect:'wash'}];
  // Split dry-brush fibres beside forceful strokes; only brief sonic accents.
  if(attack&&this.pressure>.45){
   const feather=points.map(p=>({x:Math.max(.025,Math.min(.975,p.x-Math.sin(this.heading)*radius*2*this.sx)),y:Math.max(.025,Math.min(.975,p.y+Math.cos(this.heading)*radius*2*this.sy))}));
   ink.push({...ink[0],points:feather,width:Math.max(.28,ink[0].width*.15),opacity:this.opacity*.4});
  }
  if(attack&&energy>.35){
   const length=this.radius*(.035+.1*flux),whip=Array.from({length:7},(_,i)=>{const t=i/6,a=this.heading+this.turnDirection*t*.9;return bounded(point.x+Math.cos(a)*length*t*this.sx,point.y+Math.sin(a)*length*t*this.sy);});
   ink.push({...ink[0],points:whip,width:Math.max(.35,ink[0].width*.32),opacity:this.opacity*.65,continuous:false});
  }
  let splashes=0;
  if(attack){this.attackAt=time;for(let i=0;i<3+Math.floor(4*flux);i++){
   const angle=this.heading+(this.rng()-.5)*2.4+(this.rng()<.2?Math.PI:0),spread=.003+(.025+.035*this.burst)*Math.sqrt(this.rng()),tip={x:Math.max(.025,Math.min(.975,point.x+Math.cos(angle)*spread*this.sx)),y:Math.max(.025,Math.min(.975,point.y+Math.sin(angle)*spread*this.sy))};
   segments.push({...segments[0],a:tip,b:tip,radius:.0003+.004*Math.pow(this.rng(),2),load:this.opacity*(.3+.4*this.rng()),effect:'splash'});splashes++;
  }}
  // A falling transient can lift the nib briefly instead of drawing an outline.
  const torn=f.energy<.12&&f.flux>.35;if(torn){this.last=null;return {segments:[],ink:[],point:null,feedback:{speed:this.energy,radius,splashes:0}};}
  this.last=point;return {segments,ink,point,feedback:{speed:this.energy,radius,splashes}};
 }
}
