import {createRng} from '../vendor/pigment-drift/engine/params';
import {clamp,curve,DURATION} from '../engine/composition';
import type {Composition,EngineSettings,Gesture,GestureKind,InkStroke,Point} from '../engine/types';
import type {AudioAnalysis,AudioFrame} from './types';

function average(frames:AudioFrame[],key:keyof AudioFrame):number{
  return frames.reduce((sum,f)=>sum+Number(f[key]),0)/Math.max(1,frames.length);
}
function atPath(path:Point[],t:number):Point{
  const q=clamp(t)*(path.length-1),i=Math.min(path.length-2,Math.floor(q)),u=q-i;
  return {x:path[i].x+(path[i+1].x-path[i].x)*u,y:path[i].y+(path[i+1].y-path[i].y)*u};
}
function segment(path:Point[],a:number,b:number,bend:number,seed:number):Point[]{
  return curve(Array.from({length:7},(_,i)=>{
    const t=i/6,p=atPath(path,a+(b-a)*t);
    const arc=Math.sin(t*Math.PI);
    return {x:p.x+arc*bend*.24*Math.sin(seed),y:p.y+arc*bend};
  }),56);
}

/**
 * Audio does not scatter splashes. It modulates a shared spine, a subordinate
 * wash and their tributaries. Silence suppresses local gestures and ink.
 * Low / middle / high bands change DIFFERENT physical and pictorial parameters.
 */
export function composeAudio(analysis:AudioAnalysis,settings:EngineSettings,variation=analysis.seed):Composition{
  const rng=createRng((variation^analysis.seed^0xa5917)>>>0);
  const random=(a:number,b:number)=>a+(b-a)*rng();
  const inkRng=createRng((variation^analysis.seed^0x71b3)>>>0);
  const density=clamp(settings.complexity),inkAmount=clamp(settings.ink??.62);
  const gestures:Gesture[]=[],ink:InkStroke[]=[];
  const hasSound=analysis.frames.some(f=>f.active&&f.energy>0);
  if(!hasSound)return {title:'Le papier écoute le silence',gestures,ink,duration:DURATION,seed:variation>>>0,source:{duration:analysis.duration,fingerprint:analysis.seed,activeSeconds:0}};
  const S=analysis.summary;
  const archetype=S.silence>.26?'Les intervalles du souffle':S.bass>.58?'Les terres profondes':S.treble>.45?'Les nervures de l’air':S.contrast>.65?'La traversée des éclats':'La résonance de l’eau';
  const rotate=(S.brightness-.42)*.65+random(-.22,.22);
  const transform=(p:Point):Point=>{
    const x=p.x-.5,y=(p.y-.5)*.75;
    return {x:clamp(.5+x*Math.cos(rotate)-y*Math.sin(rotate),.12,.88),y:clamp(.5+(x*Math.sin(rotate)+y*Math.cos(rotate))/.75,.12,.88)};
  };
  // These few audio-derived anchors compose the whole painting before details.
  const anchors:Point[]=Array.from({length:6},(_,i)=>{
    const t=i/5,frames=analysis.frames.filter(f=>Math.abs(f.time/analysis.duration-t)<.13);
    const bright=average(frames,'brightness'),balance=average(frames,'balance');
    return transform({x:.16+.68*t,y:.56-.105*Math.sin(t*Math.PI*1.8)-.10*(bright-.4)+.034*balance+random(-.018,.018)});
  });
  const spine=curve(anchors,140);
  const secondary=curve(anchors.map((p,i)=>({x:clamp(p.x+.018*Math.sin(i),.12,.88),y:clamp(p.y+.10+S.width*.04+.025*Math.sin(i*1.8),.14,.83)})),140);
  const add=(kind:GestureKind,start:number,duration:number,points:Point[],radius:number,load:number,slot:number,flow=0)=>{
    gestures.push({kind,start,duration,points,radius,load,ink:slot,flow,phase:random(0,90)});
  };
  const addInk=(points:Point[],start:number,duration:number,width:number,opacity:number)=>{
    if(inkAmount<=0)return;
    ink.push({points,start,duration,width,opacity:opacity*(.32+.68*inkAmount),seed:1+Math.floor(inkRng()*64999)});
  };
  const chunks=24,chunk=analysis.duration/chunks;
  for(let i=0;i<chunks;i++){
    const time=i*chunk,frames=analysis.frames.filter(f=>f.time>=time&&f.time<time+chunk);
    const active=average(frames,'active');
    if(active<.32)continue;
    const energy=average(frames,'energy'),bass=average(frames,'bass'),treble=average(frames,'treble'),brightness=average(frames,'brightness'),flux=average(frames,'flux');
    if(energy<.003)continue;
    const u=(i+.5)/chunks,a=Math.max(.0,(i-.50)/chunks),b=Math.min(1,(i+1.65)/chunks);
    const main=segment(spine,a,b,random(-.018,.018)*(1+treble),i);
    const sub=segment(secondary,a,b,random(-.022,.022),i);
    const start=.45+time*.90;
    const radius=(.040+.072*Math.sqrt(energy)+.023*bass)*(.82+.25*density);
    const load=clamp(.17+.58*energy+.10*bass,.12,.91);
    const slot=bass>.55?0:brightness>.57?1:i%4===0?1:0;
    add('water',Math.max(.05,start-.20),.75,main,radius*1.38,.5,0);
    add('wash',start,.88,main,radius,load,slot,.025+flux*.10+settings.wetness*.04);
    if(i%2===0){
      add('wash',start+.32,.95,sub,radius*(.62+.22*energy),load*(.55+.15*treble),slot===0?1:0,.045);
    }
    if(i%3===1&&energy>.20){
      const p=atPath(spine,u),q=atPath(secondary,u+.03);
      add('meeting',start+.85,.62,curve([p,{x:p.x+(q.x-p.x)*.45,y:q.y-.015},q],36),radius*.43,.2,0,.16+flux*.20);
    }
    // The fine ink follows spectral phrasing, never an amplitude polyline.
    if(inkAmount>.05&&i%Math.max(1,Math.round(3-inkAmount*2))===0){
      const offset=treble>.25?-.018:.022;
      const line=segment(i%3===0?secondary:spine,a,b,offset,analysis.seed%101+i);
      const lifted=line.map((p,j)=>({x:p.x,y:clamp(p.y-.018+.003*Math.sin(j*.20+i),.10,.90)}));
      addInk(lifted,4.7+time*.77,.9+treble*.7,1.10+treble*.65+flux*.35,.55+.20*treble+.12*energy);
    }
  }
  const strongest=[...analysis.onsets].sort((a,b)=>{
    const f=(t:number)=>analysis.frames[Math.min(analysis.frames.length-1,Math.round(t*30))].flux;
    return f(b)-f(a);
  }).slice(0,4+Math.round(density*10)).sort((a,b)=>a-b);
  for(let i=0;i<strongest.length;i++){
    const t=strongest[i],f=analysis.frames[Math.min(analysis.frames.length-1,Math.round(t*30))];
    const u=clamp(t/analysis.duration),root=atPath(spine,u),side=i%3===0?1:-1;
    const reach=.07+.065*f.treble+.04*f.width+.04*S.contrast;
    const tip={x:clamp(root.x+random(-.018,.032),.12,.88),y:clamp(root.y+side*reach,.11,.88)};
    const twig=curve([root,{x:root.x+.018,y:root.y+side*reach*.42},tip],50);
    add('deposit',1.0+t*.90,.42,segment(spine,u-.035,u+.04,.015,i),.012+.020*f.bass,clamp(.49+.32*f.energy),i%5===0?2:0,.03);
    if(f.flux>.5&&i%2===0){
      add('bloom',2+t*.90,.63,curve([root,{x:root.x+.002,y:root.y+.002}],18),.009+.010*f.flux,.4,0);
    }
    addInk(twig,6+t*.78,.8+f.treble,1.05+.45*f.flux,.58+.20*f.treble);
    if(inkAmount>.35){
      const origin=twig[Math.floor(twig.length*.45)];
      const branch=curve([origin,{x:origin.x+.027,y:origin.y+side*.010},{x:clamp(tip.x+.044,.11,.89),y:tip.y-side*.012}],32);
      addInk(branch,6.4+t*.78,.75,.78+.30*f.treble,.45+.15*f.flux);
    }
  }
  gestures.sort((a,b)=>a.start-b.start);
  ink.sort((a,b)=>a.start-b.start);
  return {title:archetype,gestures,ink,duration:DURATION,seed:variation>>>0,
    source:{duration:analysis.duration,fingerprint:analysis.seed,activeSeconds:analysis.frames.filter(f=>f.active).length/30}};
}
