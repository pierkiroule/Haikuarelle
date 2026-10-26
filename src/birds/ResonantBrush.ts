import {createRng} from '../vendor/pigment-drift/engine/params';
import {clamp} from '../engine/composition';
import {sheetFor} from '../engine/layout';
import type {AudioFrame} from '../audio/types';
import type {EngineSettings,InkStroke,Point} from '../engine/types';
import type {Bird} from './catalog';
import {companionSlot,plumageSlot} from './plumage';
import {sonicFilament} from './sonicFilament';

export interface BrushSegment {a:Point;b:Point;radius:number;load:number;slot:number;water:boolean;lift?:boolean;wetOnly?:boolean;strength:number;coupling:number;effect?:'filament'|'splash'}
export interface BrushFeedback {speed:number;radius:number;splashes:number;filaments?:number}
export interface BrushFrame {segments:BrushSegment[];ink:InkStroke[];point:Point|null;feedback:BrushFeedback}
interface Sample {point:Point;time:number;speed:number;pressure:number}

/** Speeds are measured in paper short-edge lengths per second, on every format. */
export function brushRadius(speed:number,size:number,energy:number,pressure=.5):number{
  const quick=clamp(speed/1.7);
  return (.012+.043*clamp(size))*(1-.79*Math.sqrt(quick))*(.78+.22*Math.sqrt(clamp(energy)))*(.72+.4*clamp(pressure));
}
export function paperPoint(x:number,y:number,rect:{left:number;top:number;width:number;height:number}):Point|null{
  if(!Number.isFinite(x)||!Number.isFinite(y)||!rect.width||!rect.height||x<rect.left||x>rect.left+rect.width||y<rect.top||y>rect.top+rect.height)return null;
  return {x:clamp((x-rect.left)/rect.width,.015,.985),y:clamp((y-rect.top)/rect.height,.015,.985)};
}

/**
 * Bounded pointer queue -> actual wet brush segments. No prerecorded path.
 * Lifts, silence and missing samples break the path. Fast gestures narrow the
 * nib and throw sparse, directional pigment droplets using distance, not FPS.
 */
export class ResonantBrush{
  private pending:Sample[]=[];
  private last:Sample|null=null;
  private painted:Point|null=null;
  private rng:()=>number;
  private spray=0;
  private inkSeed:number;
  private released=false;
  private lastFeatureTime=-1;
  private lastPulse=-1;
  private lastJet=-1;
  private jetRng:()=>number;
  private origin:Point|null=null;
  private tick=0;
  private accents=0;
  size:number;
  feedback:BrushFeedback={speed:0,radius:0,splashes:0};
  constructor(readonly bird:Bird,readonly seed:number,private settings:EngineSettings,size=.55,private layer=0,public opacity=1){
    this.rng=createRng(seed^0xb57a31);this.inkSeed=1+(seed%64999);this.size=size;
    this.jetRng=createRng(seed^0xa71f39);
  }
  private distance(a:Point,b:Point):number{
    const sheet=sheetFor(this.settings.format),unit=Math.min(sheet.width,sheet.height);
    return Math.hypot((b.x-a.x)*sheet.width/unit,(b.y-a.y)*sheet.height/unit);
  }
  move(point:Point,timeMs:number,pressure=.5):void{
    if(!Number.isFinite(point.x)||!Number.isFinite(point.y)||!Number.isFinite(timeMs))return;
    const p={x:clamp(point.x,.015,.985),y:clamp(point.y,.015,.985)};
    if(this.released)this.lift();
    if(this.last&&(timeMs-this.last.time>180||timeMs<this.last.time)){this.lift();}
    const dt=this.last?Math.max(.004,(timeMs-this.last.time)/1000):1/60;
    const raw=this.last?Math.min(5,this.distance(this.last.point,p)/dt):0;
    const alpha=1-Math.exp(-dt*24),speed=this.last?this.last.speed+(raw-this.last.speed)*alpha:0;
    const sample={point:p,time:timeMs,speed,pressure:clamp(pressure)};
    this.last=sample;this.pending.push(sample);
    // Coalesced pen events can arrive faster than the GPU. Keep a bounded path.
    if(this.pending.length>96)this.pending=this.pending.filter((_,i)=>i%2===0||i===this.pending.length-1);
    this.feedback={...this.feedback,speed,radius:brushRadius(speed,this.size,.5,pressure)};
  }
  lift(keepPending=false):void{
    if(keepPending&&this.pending.length){this.released=true;this.last=null;return;}
    this.pending=[];this.last=null;this.painted=null;this.spray=0;this.released=false;this.feedback={...this.feedback,speed:0};
  }
  get queuedSamples():number{return this.pending.length;}
  step(feature:AudioFrame|undefined,time:number,settings:EngineSettings):BrushFrame{
    this.settings=settings;
    const empty=():BrushFrame=>({segments:[],ink:[],point:null,feedback:{...this.feedback}});
    if(!feature?.active||feature.energy<=0||this.opacity<=0){this.pending=[];this.painted=null;this.spray=0;if(this.released)this.lift();return empty();}
    const resonance=clamp(settings.resonance??.92);
    const fresh=feature.time!==this.lastFeatureTime;this.lastFeatureTime=feature.time;
    const pulse=fresh&&feature.flux>.5&&time-this.lastPulse>.10&&resonance>.05;
    // A sounding note can bloom under a resting brush; a lifted brush stays idle.
    if(!this.pending.length){if(pulse&&this.last)this.pending=[{...this.last,speed:0}];else return empty();}
    this.origin??={...this.pending[0].point};
    let samples=this.pending;this.pending=[];
    if(samples.length>3)samples=Array.from({length:3},(_,i)=>samples[Math.round(i*(samples.length-1)/2)]);
    const segments:BrushSegment[]=[],ink:InkStroke[]=[],sheet=sheetFor(settings.format),unit=Math.min(sheet.width,sheet.height);
    const physical=(p:Point)=>({x:p.x*sheet.width/unit,y:p.y*sheet.height/unit});
    const normalized=(p:Point):Point=>({x:clamp(p.x*unit/sheet.width,.015,.985),y:clamp(p.y*unit/sheet.height,.015,.985)});
    const energy=clamp(feature.energy),light=Math.max(.5,1-this.layer*.018);
    let from=this.painted??samples[0].point,travel=0;
    if(this.bird.id==='pie'){
      // Isolated droplets follow the sampled gesture, never connecting its points.
      // Time-gated bursts make density independent of pointer event frequency.
      if(time-this.lastJet<.085){this.painted=null;return empty();}
      this.lastJet=time;
      const end=samples[samples.length-1],center=physical(end.point);
      const count=3+Math.floor(energy*3+clamp(feature.flux)*2);
      for(let i=0;i<count;i++){
        const angle=this.rng()*Math.PI*2;
        const spread=(.012+.075*this.size)*Math.sqrt(this.rng())*(.55+.65*energy);
        const p=normalized({x:center.x+Math.cos(angle)*spread,y:center.y+Math.sin(angle)*spread});
        const radius=(.0009+.006*Math.pow(this.rng(),2))*(.45+1.1*this.size)*(.7+.5*energy);
        segments.push({a:p,b:p,radius:radius*1.18,load:.2+.12*settings.wetness,slot:0,water:true,strength:.2,coupling:0});
        segments.push({a:p,b:p,radius,load:(.65+.3*this.rng())*clamp(this.opacity),slot:0,water:false,strength:.6,coupling:0,effect:'splash'});
      }
      this.feedback={speed:end.speed,radius:(.012+.075*this.size),splashes:this.feedback.splashes+count,filaments:0};
      this.painted=null;if(this.released)this.lift();
      return {segments,ink:[],point:end.point,feedback:{...this.feedback}};
    }
    for(const sample of samples){
      const distance=this.distance(from,sample.point);
      if(distance<.00015&&segments.length)continue;
      const quick=clamp(sample.speed/1.7);
      const crow=this.bird.id==='corneille',robin=this.bird.id==='rougegorge';
      const opening=(1-resonance)+resonance*(.22+1.58*Math.pow(energy,.85)+feature.flux*.18);
      const style=this.bird.signature,wide=style==='velvet'?1.25:style==='lace'?.78:style==='twig'?.83:1;
      const radius=brushRadius(sample.speed,this.size,energy,sample.pressure)*opening*(.87+this.rng()*.26)*(crow?.82:wide);
      const load=((1-resonance)*(.27+.44*energy)+resonance*(.10+.76*Math.pow(energy,.72)+.12*feature.flux))*light;
      segments.push({a:from,b:sample.point,radius:radius*(1.22-.12*quick),load:(crow?.22:.32)+.12*settings.wetness,slot:0,water:true,strength:.19,coupling:.014});
      const companion=robin?0:companionSlot(this.bird);
      if(companion!==undefined){
        const a=physical(from),b=physical(sample.point),length=Math.hypot(b.x-a.x,b.y-a.y);
        const vx=length>1e-5?(b.x-a.x)/length:Math.cos(this.bird.angle),vy=length>1e-5?(b.y-a.y)/length:Math.sin(this.bird.angle);
        const side=.65+.25*Math.sin((b.x+b.y)*17+this.seed*.01);
        const offset={x:-vy*radius*side,y:vx*radius*side};
        const mapped=plumageSlot(this.bird,sample.point,this.origin,this.bird.angle,sheet.height/sheet.width);
        segments.push({a:normalized({x:a.x+offset.x,y:a.y+offset.y}),b:normalized({x:b.x+offset.x,y:b.y+offset.y}),radius:radius*(robin?.62:.72),load:robin?.035+.11*energy:.13+.22*energy,slot:robin?0:mapped===this.bird.slot?companion:mapped,water:false,strength:.23,coupling:.012});
      }
      segments.push({a:from,b:sample.point,radius,load:Math.min(.99,load*(crow?1.25:1)),slot:this.bird.slot,water:false,strength:crow?.52:.37,coupling:.018+.025*quick});
      if(distance>.0006&&(settings.ink??.62)>0&&this.tick%5===0)ink.push({points:[from,sample.point],start:time,duration:1/30,
        width:((crow?.85:.5)+.45*feature.brightness)*(1-.5*quick)*(.48+.9*energy),opacity:(crow?.24:style==='velvet'?.06:.11)*(settings.ink??.62)*(.4+.6*energy),seed:this.inkSeed,continuous:true});
      travel+=distance;from=sample.point;this.feedback.radius=radius;
    }
    const end=samples[samples.length-1],quick=clamp((end.speed-.48)/1.7);
    const fling=fresh&&quick>.5&&travel>.012&&energy>.2&&resonance>.05;
    let filaments=0;
    if((pulse||fling)&&feature.flux>.82&&time-this.lastJet>.85){
      this.lastJet=time;
      this.lastPulse=time;
      const a=physical(this.painted??samples[0].point),b=physical(end.point),length=Math.hypot(b.x-a.x,b.y-a.y);
      const dx=length>1e-5?(b.x-a.x)/length:Math.cos(this.bird.angle),dy=length>1e-5?(b.y-a.y)/length:Math.sin(this.bird.angle);
      const angle=Math.atan2(dy,dx)+(this.jetRng()-.5)*.7;
      const jet=sonicFilament(end.point,angle,energy,clamp(feature.flux*resonance),feature.brightness,quick,this.size,this.bird.slot,this.jetRng,settings.format,this.feedback.radius);
      segments.push(...jet.segments);filaments++;
      if((settings.ink??.62)>0)ink.push({points:jet.points,start:time,duration:.11,width:.34+.35*feature.brightness,opacity:.26*(settings.ink??.62),seed:this.inkSeed+Math.floor(time*30)});
      if(feature.flux>.55&&this.jetRng()>.38){
        const tip=physical(jet.points[4]),before=physical(jet.points[3]),length=Math.hypot(tip.x-before.x,tip.y-before.y)||1;
        const gap=.005+.012*this.jetRng(),p=normalized({x:tip.x+(tip.x-before.x)/length*gap,y:tip.y+(tip.y-before.y)/length*gap});
        const carmine=this.bird.signature==='ripple'&&this.accents<3;if(carmine)this.accents++;
        segments.push({a:p,b:p,radius:.0015+.002*this.jetRng(),load:.48+.35*energy,slot:carmine?10:this.bird.slot,water:false,strength:.55,coupling:0,effect:'splash'});
        this.feedback.splashes++;
      }
    }
    this.spray+=travel*12*quick*(.25+.75*energy+.8*feature.flux*resonance);
    const amount=Math.min(3,16-segments.length,Math.floor(this.spray));this.spray-=Math.floor(this.spray);
    if(amount&&samples.length){
      const a=physical(this.painted??samples[0].point),b=physical(end.point),length=Math.hypot(b.x-a.x,b.y-a.y)||1;
      const dx=(b.x-a.x)/length,dy=(b.y-a.y)/length;
      for(let i=0;i<amount;i++){
        const side=(this.rng()-.5)*2,forward=.008+this.rng()*(.018+.04*quick),spread=side*(.009+this.rng()*.038*quick);
        const p=normalized({x:b.x+dx*forward-dy*spread,y:b.y+dy*forward+dx*spread});
        const q=normalized({x:b.x+dx*(forward+.0015)-dy*spread,y:b.y+dy*(forward+.0015)+dx*spread});
        const carmine=this.bird.signature==='ripple'&&this.accents<3&&feature.flux>.55&&this.rng()>.55;
        if(carmine)this.accents++;
        segments.push({a:p,b:q,radius:(.0012+this.rng()*.0032)*(.7+this.size*.7),load:(.55+this.rng()*.25)*light,
          slot:carmine?10:this.bird.slot,water:false,strength:.48,coupling:.008,effect:'splash'});
      }
      this.feedback.splashes+=amount;
    }
    // Reserve the final segment budget for at most three small droplets.
    this.tick++;this.feedback.filaments=(this.feedback.filaments??0)+filaments;
    this.painted=this.released?null:end.point;this.last=this.released?null:this.last;this.released=false;this.feedback.speed=end.speed;
    return {segments:segments.map(s=>s.water?s:{...s,load:s.load*clamp(this.opacity)}),ink:ink.map(s=>({...s,opacity:s.opacity*clamp(this.opacity)})),point:end.point,feedback:{...this.feedback}};
  }
}
