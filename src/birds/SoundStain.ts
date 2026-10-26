import {createRng} from '../vendor/pigment-drift/engine/params';
import {clamp} from '../engine/composition';
import {sheetFor} from '../engine/layout';
import type {EngineSettings,Point,InkStroke} from '../engine/types';
import type {AudioFrame} from '../audio/types';
import type {Bird} from './catalog';
import type {BrushFrame,BrushSegment} from './ResonantBrush';
import {WetPaper,type WetRegion} from './WetPaper';
import {planSplashes} from './splashes';
import {plumageSlot,companionSlot} from './plumage';

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
  private region:WetRegion;
  private regionCursor=0;
  private splashes:BrushSegment[]=[];
  private accents=0;
  readonly bloom:Point;
  constructor(readonly bird:Bird,readonly seed:number,readonly origin:Point,private settings:EngineSettings,
    private water:WetPaper,readonly size=.55,readonly layer=0,placedAt=0,private audibleTimes:number[]=[],private opacity=1){
    this.rng=createRng(seed^0x513ac9);
    this.inkRng=createRng(seed^0x14b3c1);
    const sheet=sheetFor(settings.format),unit=Math.min(sheet.width,sheet.height);
    this.sx=sheet.width/unit;this.sy=sheet.height/unit;
    this.axis=this.rng()*Math.PI*2;
    // A preferential direction, not an evenly spaced radial rosette.
    let best=-1;
    const initialAxis=this.axis;
    for(let i=0;i<24;i++){
      const a=initialAxis+i*Math.PI/12;
      const q=this.offset(origin,a,.06+.06*size);
      const score=water.at(q,placedAt)+this.rng()*.13;
      if(score>best){best=score;this.axis=a;}
    }
    this.reach=.045+.10*size;
    this.bloom=this.offset(origin,this.axis+1.3,.017+.02*size);
    this.region=water.region(origin,placedAt,Math.max(12,(audibleTimes.length||60)*3.2),createRng(seed^0x753b1));
    this.splashes=planSplashes(seed,bird.slot,water,this.region,placedAt,settings.format).map(s=>({...s,waterAmount:0,effect:'splash'}));
    // Carmine is a few peripheral droplets, not a red core subsequently
    // overwritten by the green wash. At most three, and absent on quiet seeds.
    if(bird.signature==='ripple')this.splashes=this.splashes.map((drop,i)=>i<3?{...drop,slot:10}:drop);
  }
  private offset(p:Point,angle:number,distance:number):Point{
    return {x:clamp(p.x+Math.cos(angle)*distance/this.sx,.025,.975),y:clamp(p.y+Math.sin(angle)*distance/this.sy,.025,.975)};
  }
  private dot(p:Point,radius:number,load:number,slot=this.bird.slot):BrushSegment{
    return {a:p,b:p,radius,load,slot,water:false,strength:.38,coupling:0,wetOnly:true};
  }
  step(feature:AudioFrame|undefined,time:number):BrushFrame{
    const segments:BrushSegment[]=[],ink:InkStroke[]=[];
    const empty=()=>({segments,ink,point:null,feedback:{speed:0,radius:0,splashes:0}});
    // No autonomous pigment in silence or after the sound clock has ended.
    if(!feature?.active||feature.energy<=0||this.opacity<=0)return empty();
    const energy=clamp(feature.energy),attack=clamp(feature.flux),resonance=clamp(this.settings.resonance??.96);
    // Dry cotton catches a compact, broken deposit. It adds pigment, not an
    // invisible water pool. Nearby prepared water alone can mobilise its edges.
    if(this.water.at(this.origin,time)<.025){
      const angle=this.rng()*Math.PI*2,r=(.009+.025*this.size)*Math.sqrt(this.rng());
      const p=this.offset(this.origin,angle,r);
      const radius=this.bird.id==='pie'?(.001+.005*this.rng()):(.006+.018*this.size)*(.5+.5*energy);
      segments.push({...this.dot(p,radius,(.18+.40*energy)*this.opacity),wetOnly:false,waterAmount:0,effect:'splash'});
      this.tick++;
      return {segments,ink,point:this.origin,feedback:{speed:energy,radius,splashes:1}};
    }
    if(this.bird.id==='pie'){
      // Black punctuation visits the wet basin without becoming a drawn line.
      let progress=clamp((feature.time+1/30)/2);
      if(this.audibleTimes.length){let n=0;while(n<this.audibleTimes.length&&this.audibleTimes[n]<=feature.time+1e-5)n++;progress=n/this.audibleTimes.length;}
      const target=Math.ceil(this.region.sites.length*clamp(progress/.82));
      while(this.regionCursor<target&&segments.length<8){
        const p=this.region.sites[this.regionCursor++].point;
        if(this.water.at(p,time)<.012)continue;
        segments.push({...this.dot(p,(.0012+.006*Math.pow(this.rng(),2))*(.5+this.size),(.55+.35*energy)*this.opacity),effect:'splash'});
      }
      this.tick++;
      return {segments,ink,point:segments.length?this.origin:null,feedback:{speed:energy,radius:.025+.04*this.size,splashes:segments.length}};
    }
    const crow=this.bird.id==='corneille',robin=this.bird.id==='rougegorge';
    const style=this.bird.signature,soft=style==='velvet',lace=style==='lace',twig=style==='twig',ripple=style==='ripple';
    const companion=companionSlot(this.bird);
    const width=soft?1.27:lace?.70:twig?.73:1;
    const opening=(1-resonance)*.7+resonance*(.16+energy*1.3);
    const load=(.18+.72*Math.pow(energy,.75))*Math.max(.65,1-this.layer*.025);
    const freshAttack=attack>.48&&time-this.pulse>.12;
    if(!this.started){
      this.started=true;
      const r=(.021+.047*this.size)*(.65+.35*energy);
      if(robin)segments.push(this.dot(this.offset(this.origin,this.axis+1.7,r*.4),r*1.35,.16,0));
      if(companion!==undefined)segments.push(this.dot(this.offset(this.origin,this.axis+1.6,r*1.25),r*(soft?1.15:.85),load*.46,companion));
      segments.push(this.dot(this.origin,r,load*(crow?1.15:1)));
      for(let i=0;i<3;i++)this.fronts.push({point:{...this.origin},angle:this.axis+(i===0?0:i===1?1.2:-.75)+(this.rng()-.5)*.45,length:0,life:0,weight:i===0?1:i===1?.7:.46});
    }
    if(freshAttack){
      this.pulse=time;
      // New syllables charge the centre and release a new unequal lobe.
      const a=this.axis+(this.rng()-.5)*3.3;
      const start=this.offset(this.origin,a,.018+this.rng()*.025);
      if(this.fronts.length>=4)this.fronts.shift();
      this.fronts.push({point:start,angle:a,length:0,life:0,weight:.55+this.rng()*.35});
      segments.push(this.dot(start,(.012+.025*this.size)*opening,Math.min(.98,load+.1)));
    }
    // Tiny dark/red punctuation stays rare and is triggered only by audible
    // attacks. It uses its own bounded budget, never an all-over colour noise.
    if((freshAttack||this.tick===0)&&(lace||twig)&&this.accents<1){
      const p=this.offset(this.origin,this.axis+1.9,.04*(.6+this.size));
      segments.push(this.dot(p,.0028*(.6+this.size),.4,0));this.accents++;
    }
    // Alternate two lobes per tick: <= 12 sound segments + 4 user-water segments.
    let representative:Point=this.origin,splashes=0;
    for(let j=0;j<2;j++){
      const f=this.fronts[(this.tick*2+j)%this.fronts.length];
      const w=this.water.at(f.point,time);
      const stride=(this.bird.id==='geai'?.011+.032*energy:twig?.007+.022*energy:lace?.006+.020*energy:soft?.0025+.010*energy:.0035+.015*energy)*(.65+.75*this.size)*(f.weight+.2)*.22;
      const taper=clamp(1-f.length/this.reach);
      if(taper<=0||f.life>80)continue;
      const baseAngle=f.angle+(this.rng()-.5)*(.16+.25*feature.brightness)+(ripple?Math.sin(feature.time*7.5+f.weight*3)*.18:0);
      let angle=baseAngle,best=-Infinity;
      // Wet paths win over arbitrary radial motion, with a small persistent drift.
      for(const turn of [-.85,-.42,0,.42,.85]){
        const a=baseAngle+turn,q=this.offset(f.point,a,stride*1.8);
        const score=this.water.at(q,time)*2.4-Math.abs(turn)*.13+this.rng()*.06;
        if(score>best){best=score;angle=a;}
      }
      const outside=w<.035;
      if(outside&&f.length>.018){f.life=100;continue;}
      const next=this.offset(f.point,angle,stride*(.3+.7*clamp(w*2.5)));
      const radius=(.016+.06*this.size)*opening*(.28+.72*taper)*f.weight*(.5+.5*clamp(w*3))*(.85+this.rng()*.3)*(this.bird.id==='geai'?.67:width);
      if(robin&&segments.length<8){
        const grey=this.offset(next,angle+1.57,radius*.75);
        segments.push({...this.dot(grey,radius*.9,.035+.11*energy,0),a:this.offset(f.point,angle+1.57,radius*.75),strength:.2});
      }
      const washLoad=load*(.48+.38*taper)*(crow?.92:1);
      segments.push({a:f.point,b:next,radius:Math.max(.003,radius),load:Math.min(.95,washLoad),slot:plumageSlot(this.bird,next,this.origin,this.axis,this.sy/this.sx),water:false,strength:.31,wetOnly:true,effect:'wash',coupling:(soft?.08:.12)+.22*energy});
      // Fine ink appears as sparse interrupted veins, never as a continuous outline.
      if((this.settings.ink??.62)>0&&this.tick%14===0&&energy>.2){
        const a=this.offset(f.point,angle+1.3,radius*(this.inkRng()-.5));
        const control=this.offset({x:(a.x+next.x)*.5,y:(a.y+next.y)*.5},angle+1.57,radius*.09*Math.sin(f.life*.7));
        ink.push({points:curvedVein(a,control,next),start:time,duration:1/30,width:(crow?.85:.5)+feature.brightness*.3,
          opacity:(crow?.4:soft?.10:.22)*(this.settings.ink??.62)*(.5+.5*energy),seed:this.seed+this.tick*3+j,continuous:true});
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
    const glazes:BrushSegment[]=[];
    const spray=(freshAttack||this.tick%5===0)&&energy>.2?this.splashes.splice(0,2):[];
    splashes+=spray.length;
    this.tick++;this.delivered+=segments.filter(s=>!s.water).length;
    return {segments:[...glazes,...segments.slice(0,12-glazes.length-spray.length),...spray].map(s=>({...s,load:s.load*clamp(this.opacity)})),ink:ink.map(s=>({...s,opacity:s.opacity*clamp(this.opacity)})),point:this.delivered?representative:null,feedback:{speed:energy,radius:.025+.04*this.size,splashes}};
  }
}
