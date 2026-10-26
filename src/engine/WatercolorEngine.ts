import {LivingBreath} from '../birds/LivingBreath';
import type {WaterCurrent} from '../birds/ResonantWater';
import {ResonantWater} from '../birds/ResonantWater';
import {BIRD_COLOURS} from '../birds/colourPalettes';
import { PaintEngine, Kind, type Segment, type Drop, type Look } from '../vendor/pigment-drift/paint/engine';
import { createRng } from '../vendor/pigment-drift/engine/params';
import { compose, sampleGesture, TICK_RATE, DURATION, clamp } from './composition';
import { getPalette, inkRamp, PLUMAGE_PIGMENTS } from './palettes';
import { FineInkRenderer } from './FineInkRenderer';
import {displaySize,frameComposition,sheetFor,PIGMENT_RESOLUTION} from './layout';
import { composeAudio } from '../audio/composeAudio';
import type { AudioAnalysis } from '../audio/types';
import {composeBird} from '../birds/grammar';
import type {Bird} from '../birds/catalog';
import {ResonantBrush,type BrushFeedback,type BrushFrame,type BrushSegment} from '../birds/ResonantBrush';
import {soundImprint} from '../birds/SoundImprint';
import {WetPaper,dryingTime} from '../birds/WetPaper';
import {SoundStain} from '../birds/SoundStain';
import type {Point,InkStroke} from './types';
import type { WatercolorEngine, EngineSettings, EngineStatus, Composition, Phase, Gesture } from './types';

const RITUAL_DRYING_SECONDS=12;
const DEFAULTS:EngineSettings={palette:'estuaire',granulation:.72,wetness:.64,complexity:.52,ink:.62,format:'landscape'};
const phases: [number,Phase][]=[[1.1,'wetting'],[7.5,'wash'],[11.7,'meeting'],[15.7,'bloom'],[24,'drying']];

/**
 * Adapter around the real Pigment Drift PaintEngine. No fake upstream API.
 * Canonical sheet + 30 Hz simulation make the result independent of viewport,
 * RAF scheduling and pause duration. GPU floating-point differences remain.
 */
export class HaikuarelleEngine implements WatercolorEngine {
  readonly paint:PaintEngine;
  settings:EngineSettings;
  composition!:Composition;
  private fineInk:FineInkRenderer;
  private audio:AudioAnalysis|null=null;
  private readonly requireAudio:boolean;
  private active=false;
  private performance=false;
  private drying=false;
  private resonantWater=new ResonantWater(0);
  private pigmentColours:string[]=PLUMAGE_PIGMENTS;
  private voice:{gestures:Gesture[];ink:InkStroke[];analysis:AudioAnalysis;start:number}|null=null;
  private brushVoice:{brush:ResonantBrush;analysis:AudioAnalysis;start:number;clock?:()=>number;marked:boolean;onMark?:(p:Point)=>void}|null=null;
  private waterVoice:{analysis:AudioAnalysis;clock:()=>number;level:()=>number}|null=null;
  private stainVoice:{stain:SoundStain;analysis:AudioAnalysis;start:number;clock:()=>number;marked:boolean;onMark?:(p:Point)=>void}|null=null;
  private wetPaper=new WetPaper();
  private waterPending:BrushSegment[]=[];
  private waterLast:Point|null=null;
  private breath=new LivingBreath();
  private breathPending:WaterCurrent|null=null;
  private waterBlooms:{point:Point;start:number;duration:number;radius:number}[]=[];
  private hasPigment=false;
  private tick=0;
  private seed=0;
  private paused=false;
  private destroyed=false;
  private raf=0;
  private accumulator=0;
  private last=0;
  private notifyAt=-1;
  private frameMs=33;
  private observer:ResizeObserver;
  private onChange?:(s:EngineStatus)=>void;
  private onError?:(message:string)=>void;
  private queued:Gesture[]=[];
  private lastDisplay=[0,0];
  private contextLost=(e:Event)=>{e.preventDefault();this.pause();this.onError?.('Le contexte graphique a été interrompu. Touchez Réessayer pour reprendre.');};

  constructor(canvas:HTMLCanvasElement,settings:Partial<EngineSettings>={},onChange?:(s:EngineStatus)=>void,onError?:(s:string)=>void,options:{requireAudio?:boolean}={}) {
    this.settings={...DEFAULTS,...settings};this.onChange=onChange;this.onError=onError;
    this.requireAudio=options.requireAudio??false;
    // Same simulation budget on every device. Only display resolution adapts.
    this.paint=new PaintEngine(canvas,{coarse:true,fieldBudget:PIGMENT_RESOLUTION.pixels,fieldScale:PIGMENT_RESOLUTION.scale,maxDimension:PIGMENT_RESOLUTION.maxDimension});
    this.fineInk=new FineInkRenderer(this.paint.gl);
    this.paint.afterRender=()=>this.fineInk.draw(this.tick/TICK_RATE,[.11,.16,.15]);
    this.observer=new ResizeObserver(()=>this.resize());
    this.observer.observe(canvas);
    canvas.addEventListener('webglcontextlost',this.contextLost);
    document.addEventListener('visibilitychange',this.visibility);
    if(this.requireAudio)this.clear();
  }
  private visibility=()=>{this.last=0;if(!document.hidden&&!this.paused&&this.active)this.request();};
  private look():Look {
    const palette=getPalette(this.settings.palette);
    return {paper:palette.paper,inks:palette.colors.map(c=>inkRamp(c,palette.paper)),
      pigments:this.performance&&palette.id==='plumages'?this.pigmentColours:undefined,
      layers:6,bleed:this.settings.wetness,drift:0,texture:this.settings.granulation,
      edges:this.performance?1:.74,hueDrift:.02,mist:this.performance?.015:.12,ridge:.13,feather:this.performance?.22:.82,density:this.performance?.83:.68,detail:this.performance?1:0,
      dryingTime:this.performance?(this.drying?RITUAL_DRYING_SECONDS/5.6:Infinity):undefined,dryingDetail:this.performance?.95:0,
      dryingSharpness:this.performance?(this.settings.sharpness??.72):0,dryingThreshold:this.performance?(this.settings.dryingThreshold??.56):0};
  }
  generate(seed:number):void {
    if(this.destroyed)return;
    // The musical studio must never fall back to the autonomous V1 grammar.
    if(this.requireAudio&&!this.audio){this.clear();return;}
    this.seed=(Number.isFinite(seed)?seed:0)>>>0;
    this.tick=0;this.accumulator=0;this.last=0;this.queued=[];this.paused=false;this.notifyAt=-1;
    const score=this.audio?composeAudio(this.audio,this.settings,this.seed):compose(this.seed,this.settings);
    if(this.audio&&!score.gestures.length&&!score.ink?.length){this.clear();return;}
    this.composition=frameComposition(score,this.settings.format);
    this.active=true;this.prepareSheet();this.emit();this.request();
  }
  /** Discard the current painting and stop all physical ticks. */
  clear():void {
    if(this.destroyed)return;
    cancelAnimationFrame(this.raf);this.raf=0;this.active=false;this.paused=true;
    this.voice=null;this.brushVoice=null;this.stainVoice=null;this.waterVoice=null;
    this.breath.reset();this.breathPending=null;
    this.waterPending=[];this.waterLast=null;this.waterBlooms=[];this.hasPigment=false;
    this.drying=false;this.resonantWater=new ResonantWater(this.seed);
    this.wetPaper=new WetPaper(this.settings.format,this.performance?Infinity:dryingTime(this.settings.wetness));
    this.tick=0;this.accumulator=0;this.last=0;this.queued=[];this.notifyAt=-1;
    this.composition={title:this.audio?'Le papier écoute le silence':'Le papier attend votre son',gestures:[],ink:[],duration:DURATION,seed:this.seed};
    this.prepareSheet();this.emit();
  }
  private prepareSheet():void {
    const sheet=sheetFor(this.settings.format);
    this.fineInk.setStrokes(this.composition.ink??[],sheet);
    const random=createRng(this.seed^0x78a5);
    this.paint.newSheet({...sheet,unit:Math.min(sheet.width,sheet.height),seed:[random()*180-90,random()*180-90]});
    this.paint.setLook(this.look());
    this.resize();this.paint.render(0);
  }
  /** The decoded audio is never retained by the engine; only its compact score. */
  setAudio(analysis:AudioAnalysis|null):void {
    this.performance=false;
    this.audio=analysis;
    if(analysis)this.generate(analysis.seed);else this.clear();
  }
  get hasAudio():boolean{return this.audio!==null;}
  /** Interactive score: blank paper until an audible pad calls playBird(). */
  beginSignature(seed:number):void {
    this.performance=true;this.audio=null;this.seed=seed>>>0;this.clear();
  }
  /** Only switch the optical table on a blank sheet; deposited colour is immutable. */
  setBirdPalette(id:Bird['id']):void{
    if(this.hasPigment)throw new Error('La palette de l’oiseau reste fixe pendant l’œuvre.');
    this.pigmentColours=[...PLUMAGE_PIGMENTS,...(BIRD_COLOURS[id]??[]).map(c=>c.hex)];
    this.paint.setLook(this.look());
  }
  /** Explicit clear-water gesture. It never authorizes pigment or starts audio. */
  wetBrush(point:Point,size=.55,pressure=.5,amount=1):void{
    if(this.destroyed||!this.performance||![point.x,point.y].every(Number.isFinite))return;
    const p={x:clamp(point.x,.015,.985),y:clamp(point.y,.015,.985)},a=this.waterLast??p;
    const radius=(.025+.11*clamp(size))*(.75+.5*clamp(pressure)),time=this.tick/TICK_RATE;
    // Fresh water creates a bounded growing backrun in living pigment.
    // Merely raising a saturated moisture mask cannot push paint on its own.
    const waterSheet=sheetFor(this.settings.format),waterUnit=Math.min(waterSheet.width,waterSheet.height);
    const previous=this.waterBlooms[this.waterBlooms.length-1];
    const distance=previous?Math.hypot((p.x-previous.point.x)*waterSheet.width/waterUnit,(p.y-previous.point.y)*waterSheet.height/waterUnit):Infinity;
    if(this.hasPigment&&!this.drying&&amount>0&&(!previous||distance>radius*.5||time-previous.start>.28)){
      this.waterBlooms=this.waterBlooms.filter(b=>time<b.start+b.duration).slice(-3);
      this.waterBlooms.push({point:{...p},start:time,duration:.65+.6*clamp(amount),radius:radius*(.24+.40*Math.sqrt(clamp(amount)))});
    }
    this.wetPaper.add(a,p,radius,.45*clamp(amount),time);
    this.waterPending.push({a,b:p,radius,load:0,slot:0,water:true,waterAmount:clamp(amount),strength:.45,coupling:0});
    if(this.waterPending.length>96)this.waterPending=this.waterPending.filter((_,i)=>i%2===0||i===this.waterPending.length-1);
    this.waterLast=p;if(!this.active||this.paused)this.last=0;this.active=true;this.paused=false;
    this.composition.duration=Math.max(this.composition.duration,time+this.dryingDuration());this.request();
  }
  liftWaterBrush():void{this.waterLast=null;}
  /** Commit a water tap; keep the clock running when rewetting living pigment. */
  holdWater(pause=true):void{
    if(this.destroyed)return;
    this.liftWaterBrush();
    while(this.waterPending.length&&this.active)this.stepOnce();
    this.paint.render(0);if(pause)this.pause();
  }
  setDrying(enabled:boolean):void{
    if(!this.performance||this.destroyed)return;
    this.liftBreath();this.drying=enabled;if(enabled)this.resonantWater=new ResonantWater(this.seed);
    this.wetPaper.retime(this.tick/TICK_RATE,enabled?RITUAL_DRYING_SECONDS/5.6:Infinity);
    this.paint.setLook(this.look());
    this.composition.duration=this.tick/TICK_RATE+this.dryingDuration();
  }
  blow(point:Point,time:number,size:number):void{
    if(this.destroyed||!this.performance||this.drying)return;
    const sheet=sheetFor(this.settings.format),unit=Math.min(sheet.width,sheet.height);
    const current=this.breath.move(point,time,size,this.waterAt(point),{x:sheet.width/unit,y:sheet.height/unit});
    if(!current)return;
    this.breathPending=current;
    if(!this.active||this.paused)this.last=0;
    this.active=true;this.paused=false;
    this.composition.duration=Math.max(this.composition.duration,this.tick/TICK_RATE+this.dryingDuration());this.request();
  }
  liftBreath():void{this.breath.reset();this.breathPending=null;}
  waterAt(point:Point):number{return this.wetPaper.at(point,this.tick/TICK_RATE);}
  private dryingDuration():number{return this.drying?RITUAL_DRYING_SECONDS:dryingTime(this.settings.wetness)*5.6;}
  /** Drop one real sample onto dry or prepared wet paper. No live pointer path. */
  startSoundStain(analysis:AudioAnalysis,bird:Bird,point:Point,seed:number,size=.55,layer=0,clock?:()=>number,onMark?:(p:Point)=>void,opacity=1):boolean{
    if(this.destroyed||!this.performance||!analysis.frames.some(f=>f.active&&f.energy>0))return false;
    this.stopBird();
    const start=this.tick/TICK_RATE;
    const frames=soundImprint(analysis);
    this.stainVoice={stain:new SoundStain(bird,seed,{...point},{...this.settings,...(bird.pigmentSlot!==undefined?{ink:0}:{})},this.wetPaper,size,layer,start,frames.filter(f=>f.active&&f.energy>0).map(f=>f.time),opacity),
      analysis:{...analysis,frames},start,clock:clock??(()=>this.tick/TICK_RATE-start),marked:false,onMark};
    this.audio=analysis;this.composition.title=bird.gesture;
    this.composition.duration=start+analysis.duration+this.dryingDuration();
    this.active=true;this.paused=false;this.last=0;this.notifyAt=-1;this.emit();this.request();return true;
  }
  startWaterSong(analysis:AudioAnalysis,clock:()=>number,level:()=>number=()=>1):void{
    if(this.destroyed||!this.performance)return;
    this.waterVoice={analysis:{...analysis,frames:soundImprint(analysis)},clock,level};
    this.active=true;this.paused=false;this.last=0;
    this.composition.duration=Math.max(this.composition.duration,this.tick/TICK_RATE+analysis.duration+this.dryingDuration());this.request();
  }
  stopWaterSong():void{this.waterVoice=null;}
  moveSoundStain(point:Point,connect=true):void{
    if(!Number.isFinite(point.x)||!Number.isFinite(point.y))return;
    this.stainVoice?.stain.move(point,this.tick/TICK_RATE,connect);
  }
  playBird(analysis:AudioAnalysis,bird:Bird,point:Point,seed:number,size=.55,layer=0):boolean {
    if(this.destroyed||!analysis.frames.some(f=>f.active&&f.energy>0))return false;
    if(!this.performance)this.beginSignature(this.seed);
    this.stopBird();
    const score=composeBird(analysis,bird,point,seed,this.settings,size,layer),start=this.tick/TICK_RATE;
    const gestures=score.gestures.map(g=>({...g,start:g.start+start}));
    const ink=(score.ink??[]).map(s=>({...s,start:s.start+start}));
    this.composition={...this.composition,title:bird.gesture,gestures:[...this.composition.gestures,...gestures],
      ink:[...(this.composition.ink??[]),...ink],duration:start+analysis.duration+5};
    this.audio=analysis;this.voice={gestures,ink,analysis,start};this.active=true;this.paused=false;this.last=0;this.notifyAt=-1;
    this.fineInk.setStrokes(this.composition.ink??[],sheetFor(this.settings.format));this.emit();this.request();return true;
  }
  /** Arm an audible bird. Nothing is deposited before moveBrush receives input. */
  startBirdBrush(analysis:AudioAnalysis,bird:Bird,seed:number,size=.55,layer=0,clock?:()=>number,onMark?:(p:Point)=>void,opacity=1):boolean{
    if(this.destroyed||!analysis.frames.some(f=>f.active&&f.energy>0))return false;
    if(!this.performance)this.beginSignature(this.seed);
    this.stopBird();
    this.brushVoice={brush:new ResonantBrush(bird,seed,this.settings,size,layer,opacity),analysis:{...analysis,frames:soundImprint(analysis)},start:this.tick/TICK_RATE,clock,marked:false,onMark};
    this.audio=analysis;this.composition.title=bird.gesture;this.composition.duration=this.tick/TICK_RATE+6;
    this.active=true;this.paused=false;this.last=0;this.notifyAt=-1;this.emit();this.request();return true;
  }
  moveBrush(point:Point,timeMs:number,pressure=.5):void{this.brushVoice?.brush.move(point,timeMs,pressure);}
  liftBrush():void{this.brushVoice?.brush.lift();}
  setBrushSize(size:number):void{if(this.brushVoice)this.brushVoice.brush.size=clamp(size);}
  setBrushOpacity(opacity:number):void{if(this.brushVoice)this.brushVoice.brush.opacity=clamp(opacity);}
  get brushFeedback():BrushFeedback|null{return this.brushVoice?{...this.brushVoice.brush.feedback}:null;}
  /** Stop new pigment on interruption/end. The wet field keeps diffusing; evaporation is explicitly controlled. */
  stopBird():void {
    this.stopWaterSong();
    if(this.stainVoice){
      this.stainVoice=null;this.composition.duration=this.tick/TICK_RATE+this.dryingDuration();this.notifyAt=-1;this.emit();
    }
    if(this.brushVoice){
      this.brushVoice=null;this.composition.duration=this.tick/TICK_RATE+this.dryingDuration();this.notifyAt=-1;this.emit();
    }
    if(!this.voice)return;
    const time=this.tick/TICK_RATE,gestures=new Set(this.voice.gestures),ink=new Set(this.voice.ink);
    // Keep original paths/timing plus the cutoff: the score remains serializable.
    this.composition.gestures=this.composition.gestures.map(g=>gestures.has(g)?{...g,stop:time}:g);
    this.composition.ink=(this.composition.ink??[]).map(s=>ink.has(s)?{...s,stop:time}:s);
    this.voice=null;this.composition.duration=time+5;
    this.fineInk.setStrokes(this.composition.ink??[],sheetFor(this.settings.format));this.notifyAt=-1;this.emit();
  }
  private resize():void {
    const rect=this.paint.canvas.getBoundingClientRect();
    const size=displaySize(rect.width,rect.height,devicePixelRatio||1,matchMedia('(pointer:coarse)').matches);
    const {width:w,height:h}=size,sheet=sheetFor(this.settings.format);
    if(this.lastDisplay[0]===w&&this.lastDisplay[1]===h&&this.paint.ready){
      this.paint.setView(sheet.width,sheet.height,w,h);return;
    }
    this.lastDisplay=[w,h];
    this.paint.setView(sheet.width,sheet.height,w,h);
    if(this.paint.ready)this.paint.render(0);
  }
  private request():void {if(!this.raf&&this.active&&!this.destroyed&&!this.paused&&!document.hidden)this.raf=requestAnimationFrame(this.frame);}
  private frame=(now:number)=>{
    this.raf=0;
    if(this.destroyed||!this.active||this.paused||document.hidden)return;
    if(this.last){const delta=Math.min((now-this.last)/1000,.15);this.accumulator+=delta;this.frameMs=.92*this.frameMs+.08*(now-this.last);}
    this.last=now;
    // Never discard a physical tick. Slow devices take longer, but paint the same image.
    let budget=2;
    while(this.accumulator>=1/TICK_RATE&&budget-->0&&this.tick<this.composition.duration*TICK_RATE){
      this.stepOnce();this.accumulator-=1/TICK_RATE;
    }
    this.paint.render(0);
    if(this.tick%6===0)this.emit();
    if(this.tick<this.composition.duration*TICK_RATE)this.request();else{this.accumulator=0;this.emit();}
  };
  private stepOnce():void {
    const time=this.tick/TICK_RATE,segs:Segment[]=[],drops:Drop[]=[];
    const sheet=sheetFor(this.settings.format),unit=Math.min(sheet.width,sheet.height);
    const feature=this.voice?.analysis.frames[Math.max(0,Math.floor((time-this.voice.start)*TICK_RATE))];
    const audible=!this.performance||!!(feature?.active&&feature.energy>0);
    let brushPoint:Point|null=null,stainPoint:Point|null=null;
    let waterFeature=feature;
    if(this.waterVoice){
      const v=this.waterVoice,elapsed=v.clock(),f=elapsed>=0&&elapsed<v.analysis.duration?v.analysis.frames[Math.floor(elapsed*TICK_RATE)]:undefined;
      const level=Math.max(0,Math.min(1,v.level()));
      waterFeature=f?{...f,energy:f.energy*level,flux:f.flux*level,brightness:f.brightness*(.25+.3*level)}:undefined;
      if(elapsed>=v.analysis.duration)this.waterVoice=null;
    }
    const appendFrame=(frame:BrushFrame)=>{
      for(const s of frame.segments){
        const a={x:s.a.x*sheet.width*this.paint.k,y:(1-s.a.y)*sheet.height*this.paint.k};
        const b={x:s.b.x*sheet.width*this.paint.k,y:(1-s.b.y)*sheet.height*this.paint.k};
        segs.push({ax:a.x,ay:a.y,bx:b.x,by:b.y,radius:s.radius*unit*this.paint.k,target:s.load,strength:s.strength,wetOnly:s.wetOnly,waterAmount:s.waterAmount,
          kind:s.lift?Kind.Lift:s.water?Kind.Water:Kind.Paint,slot:s.slot,fx:(b.x-a.x)*TICK_RATE*.65,fy:(b.y-a.y)*TICK_RATE*.65,coupling:s.coupling});
      }
      const ink=frame.ink.slice(0,Math.max(0,12000-(this.composition.ink?.length??0)));
      if(ink.length){this.composition.ink??=[];this.composition.ink.push(...ink);this.fineInk.appendStrokes(ink);}
    };
    if(this.stainVoice){
      const live=this.stainVoice,elapsed=live.clock();
      const f=Number.isFinite(elapsed)&&elapsed>=0&&elapsed<live.analysis.duration?live.analysis.frames[Math.floor(elapsed*TICK_RATE)]:undefined;
      waterFeature=f;
      const frame=live.stain.step(f,time);appendFrame(frame);stainPoint=frame.point;
      if(elapsed>=live.analysis.duration){this.stainVoice=null;}
    }
    if(this.brushVoice){
      const live=this.brushVoice,elapsed=live.clock?.()??(time-live.start);
      const audioFrame=Number.isFinite(elapsed)&&elapsed>=0&&elapsed<live.analysis.duration?live.analysis.frames[Math.floor(elapsed*TICK_RATE)]:undefined;
      waterFeature=audioFrame;
      const frame=live.brush.step(audioFrame,time,this.settings);
      for(const s of frame.segments)if(s.water)this.wetPaper.add(s.a,s.b,s.radius,.45,time);
      appendFrame(frame);
      brushPoint=frame.point;this.composition.duration=time+this.dryingDuration();
    }
    if(this.breathPending&&this.performance&&!this.drying&&segs.length<16){
      const c=this.breathPending;this.breathPending=null;
      const x=c.point.x*sheet.width*this.paint.k,y=(1-c.point.y)*sheet.height*this.paint.k;
      segs.push({ax:x,ay:y,bx:x,by:y,radius:c.radius*unit*this.paint.k,target:0,strength:0,waterAmount:0,
        kind:Kind.Water,slot:0,breath:true,fx:c.vx*unit*this.paint.k,fy:-c.vy*unit*this.paint.k,coupling:c.coupling});
    }
    if(this.performance&&!this.drying&&!this.voice){
      const response=this.resonantWater.step(waterFeature,time,this.wetPaper);
      // Preserve slots for fresh hand-placed water, including during a phrase.
      const forceBudget=Math.max(0,16-segs.length-Math.min(4,this.waterPending.length));
      for(const c of response.currents.slice(0,forceBudget)){
        const x=c.point.x*sheet.width*this.paint.k,y=(1-c.point.y)*sheet.height*this.paint.k;
        // Zero-strength, zero-water force: it cannot paint, wet or lift anything.
        segs.push({ax:x,ay:y,bx:x,by:y,radius:c.radius*unit*this.paint.k,target:0,strength:0,waterAmount:0,
          kind:Kind.Water,slot:0,fx:c.vx*unit*this.paint.k,fy:-c.vy*unit*this.paint.k,coupling:c.coupling});
      }
      if(response.pulse){
        this.waterBlooms=this.waterBlooms.filter(b=>time<b.start+b.duration).slice(-3);
        this.waterBlooms.push({...response.pulse,start:time});
      }
    }
    const water=this.waterPending.splice(0,Math.max(0,Math.min(4,16-segs.length)));
    if(water.length)appendFrame({segments:water,ink:[],point:null,feedback:{speed:0,radius:0,splashes:0}});
    for(const bloom of this.waterBlooms){
      if(time<bloom.start||time>=bloom.start+bloom.duration)continue;
      const ease=(t:number)=>{const v=clamp(t);return v*v*(3-2*v);};
      drops.push({x:bloom.point.x*sheet.width*this.paint.k,y:(1-bloom.point.y)*sheet.height*this.paint.k,
        r0:bloom.radius*unit*this.paint.k*ease((time-bloom.start-1/TICK_RATE)/bloom.duration),
        r1:bloom.radius*unit*this.paint.k*ease((time-bloom.start)/bloom.duration),ink:0,kind:Kind.Water,slot:0});
    }
    this.waterBlooms=this.waterBlooms.filter(b=>time<b.start+b.duration);
    const gestures=[...this.composition.gestures,...this.queued];
    for(const g of gestures){
      if(time<g.start||time>=g.start+g.duration||(g.stop!==undefined&&time>=g.stop))continue;
      if(!audible)continue;
      const v=sampleGesture(g,time), k=this.paint.k;
      const a={x:v.a.x*sheet.width*k,y:(1-v.a.y)*sheet.height*k};
      const b={x:v.b.x*sheet.width*k,y:(1-v.b.y)*sheet.height*k};
      const radius=v.radius*unit*k;
      if(g.kind==='bloom'){
        // Growing clear-water drop, reusing upstream displacement of wet pigment.
        const smooth=(t:number)=>t*t*(3-2*t);
        const prev=clamp(v.progress-1/(g.duration*TICK_RATE));
        drops.push({x:b.x,y:b.y,r0:g.radius*unit*k*smooth(prev),r1:g.radius*unit*k*smooth(v.progress),ink:0,kind:Kind.Water,slot:0});
      }else{
        const kind=g.kind==='water'||g.kind==='meeting'?Kind.Water:g.kind==='lift'?Kind.Lift:Kind.Paint;
        const scale=this.settings.wetness;
        segs.push({ax:a.x,ay:a.y,bx:b.x,by:b.y,radius,target:g.load*(this.performance&&feature?.active?(.6+.6*feature.energy):1),
          strength:kind===Kind.Lift?.13:.26,kind,slot:g.ink,
          fx:(b.x-a.x)*TICK_RATE*(.4+scale),fy:(b.y-a.y)*TICK_RATE*(.4+scale),
          coupling:g.flow*(.3+.7*scale)});
      }
    }
    // Bound the grammar before it reaches the upstream uniform limits.
    if(segs.length>16||drops.length>4)throw new Error('Composition outside GPU gesture budget.');
    this.paint.step(1/TICK_RATE,(this.tick+1)*1000/TICK_RATE,segs,drops);
    if(stainPoint&&this.stainVoice&&!this.stainVoice.marked){this.hasPigment=true;this.stainVoice.marked=true;this.stainVoice.onMark?.(this.stainVoice.stain.origin);}
    if(brushPoint&&this.brushVoice&&!this.brushVoice.marked){this.hasPigment=true;this.brushVoice.marked=true;this.brushVoice.onMark?.(brushPoint);}
    this.tick++;
  }
  private emit():void {
    if(!this.composition)return;
    const s=this.status;
    if(s.ticks===this.notifyAt&&s.phase!=='complete')return;
    this.notifyAt=s.ticks;this.onChange?.(s);
  }
  get status():EngineStatus {
    const progress=clamp(this.tick/(this.composition?.duration*TICK_RATE||1));
    const phase=!this.active?'idle':progress===1?'complete':this.performance?(this.voice||this.brushVoice||this.stainVoice?'wash':!this.hasPigment&&this.wetPaper.count?'wetting':'drying'):this.audio&&this.tick/TICK_RATE>=15.7&&this.tick/TICK_RATE<20?'ink':phases.find(([until])=>this.tick/TICK_RATE<until)?.[1]??'drying';
    return {seed:this.seed,progress,phase,paused:this.paused,fps:Math.round(1000/this.frameMs),ticks:this.tick,wetStrokes:this.wetPaper.count,hasPigment:this.hasPigment};
  }
  update(settings:Partial<EngineSettings>):void {
    const before=this.settings;
    this.settings={...before,...settings,
      wetness:clamp(settings.wetness??before.wetness),granulation:clamp(settings.granulation??before.granulation),complexity:clamp(settings.complexity??before.complexity),resonance:clamp(settings.resonance??before.resonance??.92),
      sharpness:clamp(settings.sharpness??before.sharpness??.72),dryingThreshold:clamp(settings.dryingThreshold??before.dryingThreshold??.56)};
    if(!this.composition)return;
    if(this.performance){
      if(this.settings.format!==before.format)this.beginSignature(this.seed);
      else {
        if(this.settings.wetness!==before.wetness){
          this.wetPaper.retime(this.tick/TICK_RATE,this.drying?RITUAL_DRYING_SECONDS/5.6:Infinity);
          if(this.active)this.composition.duration=Math.max(this.composition.duration,this.tick/TICK_RATE+this.dryingDuration());
        }
        this.paint.setLook(this.look());this.paint.render(0);
      }
      return;
    }
    if(!this.active){this.clear();return;}
    // Wetness and density affect history: replay it. Texture and colors are live.
    if(this.settings.complexity!==before.complexity||this.settings.wetness!==before.wetness||this.settings.ink!==before.ink||this.settings.format!==before.format)this.generate(this.seed);
    else {this.paint.setLook(this.look());this.paint.render(0);}
  }
  setWetness(value:number):void{this.update({wetness:value});}
  setGranulation(value:number):void{this.update({granulation:value});}
  deposit(x:number,y:number,pigment:string):void {
    const palette=getPalette(this.settings.palette);
    const colors=this.performance&&palette.id==='plumages'?this.pigmentColours:palette.colors;
    const index=colors.findIndex(c=>c.toLowerCase()===pigment.toLowerCase());
    const slot=index>=0?index:Number(pigment);
    if(!Number.isInteger(slot)||slot<0||slot>=colors.length)throw new RangeError(`Pigment must be a palette hex value or slot 0..${colors.length-1}.`);
    this.inject('deposit',x,y,.035,.65,slot);
  }
  addWater(x:number,y:number,amount:number):void{this.inject('bloom',x,y,.012+.035*clamp(amount),clamp(amount),0);}
  private inject(kind:Gesture['kind'],x:number,y:number,radius:number,load:number,ink:number):void {
    if(!this.active||this.destroyed)return;
    const start=this.tick/TICK_RATE;
    this.queued.push({kind,start,duration:.8,points:[{x:clamp(x),y:clamp(y)},{x:clamp(x+.002),y:clamp(y+.002)}],radius,load,ink,flow:0,phase:this.seed%97});
    this.composition.duration=Math.max(this.composition.duration,start+8);this.paused=false;this.last=0;this.request();
  }
  pause():void{this.paused=true;cancelAnimationFrame(this.raf);this.raf=0;this.last=0;this.notifyAt=-1;this.emit();}
  resume():void{if(this.destroyed||!this.active)return;this.paused=false;this.last=0;this.notifyAt=-1;this.emit();if(this.status.progress<1)this.request();}
  /** Export the current format with a 4096 px long edge. */
  async exportPNG():Promise<Blob> {
    const {width,height,pixels}=this.paint.capture(4096/Math.max(this.paint.viewW,this.paint.viewH),0);
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
    const ctx=canvas.getContext('2d');if(!ctx)throw new Error('PNG export unavailable.');
    ctx.putImageData(new ImageData(new Uint8ClampedArray(pixels),width,height),0,0);
    return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('PNG encoding failed.')),'image/png'));
  }
  /** Validation harness: same physical steps as RAF, yielding between batches. */
  async finish(beforeStep?:(time:number)=>void):Promise<void> {
    if(!this.active)return;
    this.pause();const stop=this.composition.duration*TICK_RATE;
    while(this.tick<stop){for(let i=0;i<18&&this.tick<stop;i++){beforeStep?.(this.tick/TICK_RATE);this.stepOnce();}await new Promise<void>(r=>setTimeout(r,0));}
    this.paint.render(0);this.notifyAt=-1;this.emit();
  }
  capturePreview():{width:number;height:number;pixels:Uint8Array} {return this.paint.capture(1,0);}
  destroy():void {
    this.destroyed=true;cancelAnimationFrame(this.raf);this.observer.disconnect();
    this.paint.canvas.removeEventListener('webglcontextlost',this.contextLost);
    document.removeEventListener('visibilitychange',this.visibility);this.paint.afterRender=undefined;this.fineInk.destroy();this.paint.dispose();
  }
}
