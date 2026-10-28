import type {Bird} from './catalog';
import type {AudioFrame} from '../audio/types';
import type {Point,EngineSettings} from '../engine/types';
import type {BrushFrame} from './ResonantBrush';
import {sheetFor} from '../engine/layout';
/** One bounded calligraphic ribbon: the hand guides, the full sound writes.
 * Slow spectral curvature rather than a raw waveform/ECG. Silence lifts the nib.
 */
export class SignatureInk{
 private anchor:Point;private last:Point|null=null;private phase=0;private energy=0;private brightness=.5;private heading=0;private attackAt=-Infinity;
 constructor(readonly bird:Bird,readonly seed:number,readonly origin:Point,settings:EngineSettings,private size=.55,private opacity=1){this.anchor={...origin};const s=sheetFor(settings.format);this.sx=Math.min(s.width,s.height)/s.width;this.sy=Math.min(s.width,s.height)/s.height;}
 private sx:number;private sy:number;
 move(point:Point,_time:number,connect=true){const dx=(point.x-this.anchor.x)/this.sx,dy=(point.y-this.anchor.y)/this.sy;if(!connect||Math.hypot(dx,dy)>.22)this.last=null;if(Math.hypot(dx,dy)>.001)this.heading=Math.atan2(dy,dx);this.anchor={...point};}
 step(f:AudioFrame|undefined,time:number):BrushFrame{
  const empty=():BrushFrame=>({segments:[],ink:[],point:null,feedback:{speed:0,radius:0,splashes:0}});
  if(!f?.active||f.energy<=0||this.opacity<=0){this.last=null;return empty();}
  this.energy+=(Math.min(1,f.energy)-this.energy)*.35;this.brightness+=(f.brightness-this.brightness)*.15;
  this.phase+=.09+.13*this.energy;
  const reach=(.008+.035*this.size),bend=this.heading+(this.brightness-.5)*1.8;
  const u=Math.sin(this.phase)*reach,v=Math.sin(this.phase*1.73+this.seed%19)*reach*.46;
  const point={x:Math.max(.025,Math.min(.975,this.anchor.x+(Math.cos(bend)*u-Math.sin(bend)*v)*this.sx)),y:Math.max(.025,Math.min(.975,this.anchor.y+(Math.sin(bend)*u+Math.cos(bend)*v)*this.sy))};
  const from=this.last??point;
  // Subdivide large hand movements, keeping geometry cost constant.
  const points=Array.from({length:5},(_,i)=>{const t=i/4;return {x:from.x+(point.x-from.x)*t,y:from.y+(point.y-from.y)*t};});
  const radius=(.0007+.0045*this.size)*(.25+1.25*this.energy);
  const color=(this.bird.color.match(/[a-f\d]{2}/gi)??['28','24','23']).map(v=>parseInt(v,16)/255) as [number,number,number];
  const ink:BrushFrame['ink']=[{points,start:time,duration:1/30,width:radius*2*768,opacity:this.opacity*(.65+.35*this.energy),seed:this.seed,continuous:true,color}];
  const segments:BrushFrame['segments']=[{a:from,b:point,radius:radius*1.5,load:this.opacity*(.18+.25*this.energy),slot:this.bird.pigmentSlot??0,water:false,waterAmount:0,strength:.32,coupling:.025,wetOnly:false,effect:'wash'}];
  let splashes=0;
  if(f.flux>.82&&time-this.attackAt>.65&&this.last){this.attackAt=time;const tip={x:Math.max(.025,Math.min(.975,point.x+Math.cos(bend+1)*reach*.4*this.sx)),y:Math.max(.025,Math.min(.975,point.y+Math.sin(bend+1)*reach*.4*this.sy))};segments.push({...segments[0],a:tip,b:tip,radius:radius*.6,load:this.opacity*.6,effect:'splash'});splashes=1;}
  this.last=point;
  return {segments,ink,point,feedback:{speed:this.energy,radius,splashes}};
 }
}
