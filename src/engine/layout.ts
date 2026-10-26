import type {Composition,Point} from './types';

export type ArtworkFormat='portrait'|'landscape';
export interface SheetSize{width:number;height:number}
export const SHEETS:Record<ArtworkFormat,SheetSize>={
  portrait:{width:1080,height:1920},
  landscape:{width:1920,height:1080},
};
/** Logical geometry remains stable; the wet pigment field is supersampled. */
export const PIGMENT_RESOLUTION={scale:4/3,pixels:1440*2560,maxDimension:4096} as const;
export function sheetFor(format:ArtworkFormat='landscape'):SheetSize{return SHEETS[format]??SHEETS.landscape;}
export function exportSize(format:ArtworkFormat='landscape'):SheetSize{
  const sheet=sheetFor(format),scale=4096/Math.max(sheet.width,sheet.height);
  return {width:Math.round(sheet.width*scale),height:Math.round(sheet.height*scale)};
}
/** Keep the same score and margins, turning its dominant gesture along the page. */
export function frameComposition(score:Composition,format:ArtworkFormat='landscape'):Composition{
  if(format!=='portrait')return score;
  const turn=(p:Point):Point=>({x:1-p.y,y:p.x});
  return {...score,
    gestures:score.gestures.map(g=>({...g,points:g.points.map(turn)})),
    ink:score.ink?.map(s=>({...s,points:s.points.map(turn)})),
  };
}
/** A resize never changes the simulation. It only changes the display buffer. */
export function displaySize(width:number,height:number,dpr:number,coarse=false):SheetSize{
  const pixelRatio=Math.min(Math.max(1,dpr||1),4);
  const w=Math.max(1,width)*pixelRatio,h=Math.max(1,height)*pixelRatio;
  const budget=coarse?4.2e6:8.4e6;
  const scale=Math.min(1,Math.sqrt(budget/(w*h)),4096/w,4096/h);
  return {width:Math.max(1,Math.round(w*scale)),height:Math.max(1,Math.round(h*scale))};
}
