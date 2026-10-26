import {createRng} from '../vendor/pigment-drift/engine/params';
import {sheetFor,type ArtworkFormat} from '../engine/layout';
import type {Point} from '../engine/types';
import type {BrushSegment} from './ResonantBrush';
import type {WetPaper,WetRegion} from './WetPaper';

/** A single sparse flight of pigment, sometimes absent. Planned deterministically
 * at a basin edge, emitted later ONLY on audible frames. No particle animation,
 * no repeatable confetti and no extra drawing after the sound has finished.
 */
export function planSplashes(seed:number,slot:number,water:WetPaper,region:WetRegion,time:number,format:ArtworkFormat='portrait'):BrushSegment[]{
  const random=createRng(seed^0x46e3c5);
  if(random()<.36||!region.sites.length)return [];
  const sheet=sheetFor(format),unit=Math.min(sheet.width,sheet.height),sx=sheet.width/unit,sy=sheet.height/unit;
  const angle=random()*Math.PI*2,dx=Math.cos(angle),dy=Math.sin(angle);
  const physical=(p:Point)=>({x:p.x*sx,y:p.y*sy});
  const inside=(p:Point)=>p.x>=.025&&p.x<=.975&&p.y>=.025&&p.y<=.975;
  const edge=region.sites.reduce((a,b)=>{const p=physical(a.point),q=physical(b.point);return q.x*dx+q.y*dy>p.x*dx+p.y*dy?b:a;});
  let outside:Point|null=null;
  for(let d=.012;d<.25;d+=.008){
    const p={x:edge.point.x+dx*d/sx,y:edge.point.y+dy*d/sy};
    if(!inside(p))break;
    if(water.at(p,time)<.004){outside=p;break;}
  }
  if(!outside)return [];
  const count=3+Math.floor(random()*5),drops:BrushSegment[]=[];
  for(let i=0;i<count;i++){
    const forward=.008+random()*.045,side=(random()-.5)*(.018+.025*i/count);
    const p={x:outside.x+(dx*forward-dy*side)/sx,y:outside.y+(dy*forward+dx*side)/sy};
    if(!inside(p)||water.at(p,time)>.008)continue;
    const radius=(i===0?.0027:.00085)+random()*(i===0?.0022:.0018);
    drops.push({a:p,b:p,radius,load:.38+random()*.45,slot,water:false,strength:.44,coupling:0});
  }
  return drops;
}
