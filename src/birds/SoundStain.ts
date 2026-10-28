import {createRng} from '../vendor/pigment-drift/engine/params';
import {clamp} from '../engine/composition';
import {sheetFor} from '../engine/layout';
import type {EngineSettings,Point,InkStroke} from '../engine/types';
import type {AudioFrame} from '../audio/types';
import type {Bird} from './catalog';
import type {BrushFrame,BrushSegment} from './ResonantBrush';
import {WetPaper,WET_FILM_THRESHOLD} from './WetPaper';
import {planSplashes} from './splashes';


interface Front {point:Point;angle:number;length:number;life:number;weight:number}
const curvedVein=(a:Point,control:Point,b:Point):Point[]=>Array.from({length:10},(_,i)=>{
  const u=i/9,v=1-u;return {x:v*v*a.x+2*v*u*control.x+u*u*b.x,y:v*v*a.y+2*v*u*control.y+u*u*b.y};
});
/** A finite sound-powered splash from a fixed origin. No user path is required.
 * RMS opens the body; attacks split the wet fronts and throw satellite drops;
 * spectral brightness controls the fine ink and the capillary branching. The
 * pre-wetted paper attracts fronts; dry cotton holds compact deposits. The GPU
 * exchanges pigment locally; evaporation starts only in the ritual drying stage.
 */
export class SoundStain {
  private rng:()=>number;
  private inkRng:()=>number;
  private fronts:Front[]=[];
  private started=false;
  private tick=0;
  private pulse=-1;
  private sx:number;private sy:number;
  private axis:number;
  private reach:number;
  private delivered=0;
  private splashes:BrushSegment[]=[];
  private accents=0;
  private plumageAccents=0;
  private anchor:Point;
  private gestures:{a:Point;b:Point}[]=[];
  readonly bloom:Point;
  constructor(readonly bird:Bird,readonly seed:number,readonly origin:Point,private settings:EngineSettings,
    private water:WetPaper,readonly size=.55,readonly layer=0,placedAt=0,audibleTimes:number[]=[],private opacity=1){
    this.anchor={...origin};
    this.rng=createRng(seed^0x513ac9);
    this.inkRng=createRng(seed^0x14b3c1);
    const sheet=sheetFor(settings.format),unit=Math.min(sheet.width,sheet.height);
    this.sx=sheet.width/unit;this.sy=sheet.height/unit;
    this.axis=this.rng()*Math.PI*2;
    // A preferential direction, not an evenly spaced radial rosette.
    let best=-1;
    const initialAxis=this.axis,thinSource=water.at(origin,placedAt)<.04;
    for(let i=0;i<24;i++){
      const a=initialAxis+i*Math.PI/12;
      const q=this.offset(origin,a,.06+.06*size);
      const amount=water.at(q,placedAt);
      const score=(thinSource?(amount>=WET_FILM_THRESHOLD?.5+clamp(amount/.06):0):amount)+this.rng()*.13;
      if(score>best){best=score;this.axis=a;}
    }
    this.reach=.08+.18*size;
    this.bloom=this.offset(origin,this.axis+1.3,.017+.02*size);
    const region=water.region(origin,placedAt,Math.max(12,(audibleTimes.length||60)*3.2),createRng(seed^0x753b1));
    this.splashes=thinSource?[]:planSplashes(seed,bird.slot,water,region,placedAt,settings.format).map(s=>({...s,waterAmount:0,effect:'splash'}));
  }
  /** Gesture changes the material source while the same full phrase plays. */
  move(point:Point,time:number,connect=true):void{
    const p={x:clamp(point.x,.025,.975),y:clamp(point.y,.025,.975)};
    if(Math.hypot((p.x-this.anchor.x)*this.sx,(p.y-this.anchor.y)*this.sy)<.001)return;
    this.gestures.push({a:connect?{...this.anchor}:p,b:p});
    if(this.gestures.length>32)this.gestures.splice(0,this.gestures.length-32);
    this.anchor=p;this.started=false;this.fronts=[];this.splashes=[];
  }

  private offset(p:Point,angle:number,distance:number):Point{
    return {x:clamp(p.x+Math.cos(angle)*distance/this.sx,.025,.975),y:clamp(p.y+Math.sin(angle)*distance/this.sy,.025,.975)};
  }
  private dot(p:Point,radius:number,load:number,slot=this.bird.slot):BrushSegment{
    return {a:p,b:p,radius,load,slot,water:false,strength:.38,coupling:0,wetOnly:true};
  }
  /** Adjacent plumage zones follow the SAME geometry and fixed brush axis.
   * Secondary colours are not randomly layered into the primary wash. */
  private colours(segments:BrushSegment[]):BrushSegment[]{
    if(this.bird.pigmentSlot!==undefined)return segments.map(s=>({...s,slot:s.water?s.slot:this.bird.pigmentSlot!,load:s.load*clamp(this.opacity)}));
    const palette=this.bird.plumage??[this.bird.slot],out:BrushSegment[]=[];
    for(const s of segments){
      if(out.length>=12)break;
      // Dry deposits use the same plumage as wet washes.
      const colourBody=palette.length>1&&s.slot===this.bird.slot&&s.effect!=='splash';
      out.push({...s,radius:colourBody?s.radius*.78:s.radius,load:s.load*clamp(this.opacity)});
      if(!colourBody)continue;
      for(let i=1;i<palette.length&&out.length<12;i++){
        const dark=palette[i]===0||palette[i]===10;
        if(dark&&this.plumageAccents>=3)continue;
        const direction=i===1?1:-1,distance=s.radius*(i===1?.82:.78);
        const a=this.offset(s.a,this.axis+direction*Math.PI/2,distance);
        const b=s.a===s.b?a:this.offset(s.b,this.axis+direction*Math.PI/2,distance);
        out.push({...s,a,b,slot:palette[i],radius:s.radius*(dark?.23:i===1?.61:.46),
          load:s.load*(dark?.24:i===1?.82:.60)*clamp(this.opacity)});
        if(dark)this.plumageAccents++;
      }
    }
    return out;
  }
  step(feature:AudioFrame|undefined,time:number):BrushFrame{
    const segments:BrushSegment[]=[],ink:InkStroke[]=[];
    const empty=()=>({segments,ink,point:null,feedback:{speed:0,radius:0,splashes:0}});
    // No autonomous pigment in silence or after the sound clock has ended.
    if(!feature?.active||feature.energy<=0||this.opacity<=0)return empty();
    const energy=clamp(feature.energy),attack=clamp(feature.flux),resonance=clamp(this.settings.resonance??.96);
    // Broad connected marks follow the hand; audio still owns their pigment.
    for(const gesture of this.gestures.splice(0,3)){
      const wet=this.water.at(gesture.b,time)>=WET_FILM_THRESHOLD;
      const radius=(.012+.045*this.size)*(.35+1.15*Math.pow(energy,.65));
      segments.push({...this.dot(gesture.b,radius,(.22+.62*energy)),a:gesture.a,wetOnly:wet&&this.water.at(gesture.b,time)<.04,waterAmount:0,effect:'wash',coupling:wet?.12:0});
    }
    // Dry cotton catches a compact, broken deposit. It adds pigment, not an
    // invisible water pool. Nearby prepared water alone can mobilise its edges.
    if(this.water.at(this.anchor,time)<WET_FILM_THRESHOLD){
      const angle=this.rng()*Math.PI*2,r=(.008+.020*this.size)*Math.sqrt(this.rng());
      const p=this.offset(this.anchor,angle,r);
      const radius=(.013+.038*this.size)*(.30+1.05*Math.pow(energy,.7));
      segments.push({...this.dot(p,radius,(.18+.40*energy)),wetOnly:false,waterAmount:0,effect:'wash'});
      this.tick++;
      return {segments:this.colours(segments),ink,point:this.anchor,feedback:{speed:energy,radius,splashes:1}};
    }
    const crow=this.bird.id==='corneille';
    const style=this.bird.signature,soft=style==='velvet',lace=style==='lace',twig=style==='twig',ripple=style==='ripple';

    const width=soft?1.27:lace?.70:twig?.73:1;
    const opening=(1-resonance)*.7+resonance*(.14+Math.pow(energy,.72)*1.65);
    const load=(.18+.72*Math.pow(energy,.75))*Math.max(.65,1-this.layer*.025);
    const freshAttack=attack>.48&&time-this.pulse>.12;
    if(!this.started){
      this.started=true;
      const r=(.021+.047*this.size)*(.65+.35*energy);
      segments.push(this.dot(this.anchor,r,load*(crow?1.15:1)));
      for(let i=0;i<3;i++)this.fronts.push({point:{...this.anchor},angle:this.axis+(i===0?0:i===1?1.2:-.75)+(this.rng()-.5)*.45,length:0,life:0,weight:i===0?1:i===1?.7:.46});
    }
    if(freshAttack){
      this.pulse=time;
      // New syllables charge the centre and release a new unequal lobe.
      const a=this.axis+(this.rng()-.5)*3.3;
      const start=this.offset(this.anchor,a,.018+this.rng()*.025);
      if(this.fronts.length>=4)this.fronts.shift();
      this.fronts.push({point:start,angle:a,length:0,life:0,weight:.55+this.rng()*.35});
      segments.push(this.dot(start,(.012+.025*this.size)*opening,Math.min(.98,load+.1)));
    }
    // Sparse punctuation uses the same pigment, preserving the colour plane.
    if((freshAttack||this.tick===0)&&(lace||twig)&&this.accents<1){
      const p=this.offset(this.anchor,this.axis+1.9,.04*(.6+this.size));
      segments.push(this.dot(p,.0028*(.6+this.size),.4));this.accents++;
    }
    // Alternate two lobes per tick: <= 12 sound segments + 4 user-water segments.
    let representative:Point=this.anchor,splashes=0;
    for(let j=0;j<2;j++){
      const f=this.fronts[(this.tick*2+j)%this.fronts.length];
      const w=this.water.at(f.point,time);
      const stride=(this.bird.id==='geai'?.011+.032*energy:twig?.007+.022*energy:lace?.006+.020*energy:soft?.0025+.010*energy:.0035+.015*energy)*(.65+.75*this.size)*(f.weight+.2)*.52;
      const taper=clamp(1-f.length/this.reach);
      if(taper<=0||f.life>80)continue;
      const baseAngle=f.angle+(this.rng()-.5)*(.16+.25*feature.brightness)+(ripple?Math.sin(feature.time*7.5+f.weight*3)*.18:0);
      let angle=baseAngle,best=-Infinity;
      // Wet paths win over arbitrary radial motion, with a small persistent drift.
      for(const turn of [-.85,-.42,0,.42,.85]){
        const a=baseAngle+turn,q=this.offset(f.point,a,stride*1.8);
        const amount=this.water.at(q,time);
        const preference=w<.04?(amount>=WET_FILM_THRESHOLD?.5+clamp(amount/.06):0):amount*2.4;
        const score=preference-Math.abs(turn)*.13+this.rng()*.06;
        if(score>best){best=score;angle=a;}
      }
      const outside=w<WET_FILM_THRESHOLD;
      if(outside&&f.length>.018){f.life=100;continue;}
      const next=this.offset(f.point,angle,stride*(.3+.7*clamp(w*2.5)));
      const radius=(.016+.06*this.size)*opening*(.28+.72*taper)*f.weight*(.5+.5*clamp(w*3))*(.85+this.rng()*.3)*(this.bird.id==='geai'?.67:width);
      const washLoad=load*(.48+.38*taper)*(crow?.92:1);
      segments.push({a:f.point,b:next,radius:Math.max(.003,radius),load:Math.min(.95,washLoad),slot:this.bird.slot,water:false,strength:.31,wetOnly:true,effect:'wash',coupling:(soft?.08:.12)+.22*energy});
      // Fine ink appears as sparse interrupted veins, never as a continuous outline.
      if(this.bird.pigmentSlot===undefined&&(this.settings.ink??.62)>0&&this.tick%30===0&&energy>.2){
        const a=this.offset(f.point,angle+1.3,radius*(this.inkRng()-.5));
        const control=this.offset({x:(a.x+next.x)*.5,y:(a.y+next.y)*.5},angle+1.57,radius*.09*Math.sin(f.life*.7));
        ink.push({points:curvedVein(a,control,next),start:time,duration:1/30,width:(crow?.85:.5)+feature.brightness*.3,
          opacity:(crow?.18:soft?.05:.09)*(this.settings.ink??.62)*(.5+.5*energy),seed:this.seed+this.tick*3+j,continuous:true});
      }
      if(freshAttack&&segments.length<9){
        // An attack opens an unequal wet lobe rather than drawing a filament.
        const pocket=this.offset(next,angle+(this.rng()>.5?1:-1)*.9,radius*(.4+.5*attack));
        if(this.water.at(pocket,time)>.025)segments.push({...this.dot(pocket,Math.max(.003,radius*(.35+.4*feature.brightness)),load*(.25+.35*attack)),strength:.23,coupling:.12});
      }
      f.point=next;f.angle=angle;f.length+=stride;f.life++;representative=next;
    }
    // Pigment enters locally. Diffusion belongs to the GPU field, rather than
    // remotely painting every site of the connected basin during the sample.
    const spray=(freshAttack||this.tick%5===0)&&energy>.2?this.splashes.splice(0,2):[];
    splashes+=spray.length;
    this.tick++;this.delivered+=segments.filter(s=>!s.water).length;
    return {segments:this.colours([...segments.slice(0,12-spray.length),...spray]),ink:ink.map(s=>({...s,opacity:s.opacity*clamp(this.opacity)})),point:this.delivered?representative:null,feedback:{speed:energy,radius:.025+.04*this.size,splashes}};
  }
}
