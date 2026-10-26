import {clamp} from '../engine/composition';
import {sheetFor} from '../engine/layout';
import type {EngineSettings,Point} from '../engine/types';
import type {BrushSegment} from './ResonantBrush';

/** A tapered pigment jet, emitted by a real audible attack. Geometry is in
 * paper short-edge units; every piece is a PaintEngine pigment segment. It
 * remains visible with the fine-ink overlay disabled, and dries in the field.
 */
export function sonicFilament(origin:Point,angle:number,energy:number,attack:number,brightness:number,quick:number,size:number,slot:number,random:()=>number,format:EngineSettings['format'],brushRadius=0):{segments:BrushSegment[];points:Point[]}{
  const sheet=sheetFor(format),unit=Math.min(sheet.width,sheet.height),sx=sheet.width/unit,sy=sheet.height/unit;
  const dx=Math.cos(angle),dy=Math.sin(angle);
  const side=random()>.5?1:-1;
  // Leave from the shoulder of the wash, so the thin jet is not swallowed
  // immediately by the broad wet core deposited on the same audio tick.
  const p={x:origin.x*sx-dy*side*brushRadius*.82,y:origin.y*sy+dx*side*brushRadius*.82};
  const reach=(.010+.032*attack+.016*quick)*(.6+size)*(.75+.5*random());
  const curl=side*(.45+.55*random()),forward=.3+.6*random();
  const end={x:p.x+(dx*forward-dy*curl)*reach,y:p.y+(dy*forward+dx*curl)*reach};
  const control={x:p.x+(dx*.75-dy*curl*.12)*reach,y:p.y+(dy*.75+dx*curl*.12)*reach};
  const points=Array.from({length:5},(_,i)=>{
    const t=i/4,v=1-t;
    return {x:clamp((v*v*p.x+2*v*t*control.x+t*t*end.x)/sx,.018,.982),y:clamp((v*v*p.y+2*v*t*control.y+t*t*end.y)/sy,.018,.982)};
  });
  const width=(.0014+.0026*energy)*(.65+.55*size)*(1-.42*brightness);
  const segments=points.slice(1).map((b,i):BrushSegment=>({a:points[i],b,radius:Math.max(.00065,width*(1-.78*(i/3))),
    load:.38+.46*attack,slot,water:false,strength:.63,coupling:.006,effect:'filament'}));
  return {segments,points};
}
