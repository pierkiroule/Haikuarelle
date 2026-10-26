import {createRng} from '../vendor/pigment-drift/engine/params';
import {clamp,curve} from '../engine/composition';
import {sheetFor} from '../engine/layout';
import type {AudioAnalysis} from '../audio/types';
import type {Composition,EngineSettings,Gesture,InkStroke,Point} from '../engine/types';
import type {Bird} from './catalog';

/** A short, open brush gesture rooted at the user's point. No closed vector masks. */
export function composeBird(analysis:AudioAnalysis,bird:Bird,origin:Point,seed:number,settings:EngineSettings,size=.55,layer=0):Composition{
  const gestures:Gesture[]=[],ink:InkStroke[]=[];
  const duration=analysis.duration;
  if(!analysis.frames.some(f=>f.active&&f.energy>0))return {title:bird.name,gestures,ink,duration,seed};
  const rng=createRng(seed^analysis.seed),r=(a:number,b:number)=>a+(b-a)*rng();
  const inkRng=createRng(seed^analysis.seed^0x71b3),inkSeed=()=>1+Math.floor(inkRng()*64999);
  const sheet=sheetFor(settings.format),unit=Math.min(sheet.width,sheet.height);
  const angle=bird.angle+r(-.65,.65),scale=.65+clamp(size)*.85;
  const S=analysis.summary,reach=(.15+.11*S.brightness)*scale;
  const point=(x:number,y:number):Point=>({
    x:clamp(origin.x+(x*Math.cos(angle)-y*Math.sin(angle))*unit/sheet.width,.025,.975),
    y:clamp(origin.y+(x*Math.sin(angle)+y*Math.cos(angle))*unit/sheet.height,.025,.975),
  });
  // Portrait and landscape share physical proportions, with the brush point unchanged.
  const path=(bend=0,offset=0)=>curve(Array.from({length:8},(_,i)=>{
    const u=i/7,wave=Math.sin(u*Math.PI);
    return point(reach*u,.045*scale*wave*Math.sin(u*4.7+seed%9)+bend*wave+offset);
  }),64,.025);
  const main=path(),sub=path(r(-.035,.045)*scale,.025*scale);
  const light=Math.max(.47,1-layer*.022),radius=(bird.motif==='voile'?.067:.045)*scale*(.8+.3*S.energy);
  const add=(kind:Gesture['kind'],start:number,length:number,points:Point[],width:number,load:number,slot=bird.slot,flow=.04)=>{
    const end=Math.min(duration-.015,start+length);
    if(end<=start)return;
    gestures.push({kind,start,duration:end-start,points,radius:width,load:load*light,ink:slot,flow,phase:r(0,99)});
  };
  const sound=analysis.frames.filter(f=>f.active),first=sound[0]?.time??0;
  const begin=Math.min(first+.015,duration*.12),span=Math.max(.12,duration-begin-.04);
  add('water',begin,span*.45,main,radius*1.4,.48,0);
  add('wash',begin+.02,span*.85,main,radius,.43+.23*S.energy);
  add('wash',begin+span*.20,span*.63,sub,radius*.68,.25+.12*S.energy,(bird.slot+1)%3);
  const accents=analysis.onsets.length?analysis.onsets.slice(0,4):[duration*.22,duration*.57];
  for(let i=0;i<accents.length;i++){
    const t=accents[i],u=clamp(t/duration,.05,.9),root=main[Math.floor(u*(main.length-1))];
    const side=i%2?1:-1,tip=point(reach*u+.024,side*(.055+S.treble*.04)*scale);
    const twig=curve([root,{x:root.x*.6+tip.x*.4+.006,y:root.y*.6+tip.y*.4-.005},tip],32,.025);
    add('deposit',Math.max(begin+.06,t),.28,[root,{x:root.x+.001,y:root.y+.001}],radius*.34,.68+.20*S.energy);
    if(i<2)add('run',Math.min(duration*.62,t+.08),span*.3,twig,.0035*scale,.32,bird.slot,.08);
    if((settings.ink??.62)>0)ink.push({points:twig,start:Math.min(duration*.65,t+.1),duration:Math.min(.65,span*.35),width:.78+S.treble*.5,opacity:(.32+S.treble*.15)*(settings.ink??.62),seed:inkSeed()});
  }
  add('bloom',begin+span*.69,span*.2,[main[30],main[31]],radius*.23,.3,0);
  if((settings.ink??.62)>0)ink.push({points:main.map((p,i)=>({x:p.x,y:clamp(p.y-.002*Math.sin(i*.16),.025,.975)})),start:begin+span*.22,duration:span*.68,width:.82+S.brightness*.33,opacity:.37*(settings.ink??.62),seed:inkSeed()});
  // Split dry lines at actual silent windows too: no invisible sound keeps drawing ink.
  const audibleInk=ink.flatMap(stroke=>{
    const parts:InkStroke[]=[];let first=-1;
    const flush=(end:number)=>{if(first>=0&&end-first>=2){const a=first/(stroke.points.length-1),b=(end-1)/(stroke.points.length-1);parts.push({...stroke,points:stroke.points.slice(first,end),start:stroke.start+a*stroke.duration,duration:(b-a)*stroke.duration});}first=-1;};
    for(let i=0;i<stroke.points.length;i++){
      const time=stroke.start+i/(stroke.points.length-1)*stroke.duration;
      if(analysis.frames[Math.floor(time*30)]?.active){if(first<0)first=i;}else flush(i);
    }
    flush(stroke.points.length);return parts;
  });
  return {title:bird.gesture,gestures:gestures.sort((a,b)=>a.start-b.start),ink:audibleInk,duration,seed,
    source:{duration,fingerprint:analysis.seed,activeSeconds:sound.length/30}};
}
