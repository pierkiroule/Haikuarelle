import type {Composition,Point} from './types';

export type ArtworkFormat='portrait'|'landscape'|'a4';
export interface SheetSize{width:number;height:number}
export const SHEETS:Record<ArtworkFormat,SheetSize>={
  // Full A4 page: 1400 × 1980, including header/footer (44% of width).
  a4:{width:1400,height:1364},
  portrait:{width:1080,height:1920},
  landscape:{width:1920,height:1080},
};
/** Logical geometry remains stable; the wet pigment field is supersampled. */
export const PIGMENT_RESOLUTION={scale:4/3,pixels:1440*2560,maxDimension:4096} as const;
export interface PaintingQuality {tier:'light'|'balanced'|'fine'|'studio';scale:number;pixels:number;maxDimension:number;displayPixels:number;detailPixels:number}
/** Conservative startup hints, not a GPU benchmark. Keep this fixed for a sheet. */
export function paintingQuality({coarse=false,memory,cores}:{coarse?:boolean;memory?:number;cores?:number}={}):PaintingQuality{
  const ram=typeof memory==='number'&&Number.isFinite(memory)&&memory>0?memory:undefined;
  const cpu=typeof cores==='number'&&Number.isFinite(cores)&&cores>0?cores:undefined;
  const tier=ram!==undefined&&ram<=2?'light':
    coarse&&(ram!==undefined&&ram<=4||cpu!==undefined&&cpu<=4)?'balanced':
    !coarse&&ram!==undefined&&ram>=8&&cpu!==undefined&&cpu>=12?'studio':'fine';
  const scale=tier==='light'?.8:tier==='balanced'?1:tier==='studio'?5/3:4/3;
  return {tier,scale,pixels:Math.round(1080*1920*scale*scale),maxDimension:4096,
    displayPixels:tier==='light'?2.1e6:coarse?4.2e6:8.4e6,
    detailPixels:tier==='studio'?2304*4096:tier==='light'?1080*1920:1440*2560};
}
export function sheetFor(format:ArtworkFormat='landscape'):SheetSize{return SHEETS[format]??SHEETS.landscape;}
export function exportSize(format:ArtworkFormat='landscape'):SheetSize{
  const sheet=sheetFor(format),scale=4096/(format==='a4'?1980:Math.max(sheet.width,sheet.height));
  return {width:Math.round(sheet.width*scale),height:Math.round(sheet.height*scale)};
}
/** Keep the same score and margins, turning its dominant gesture along the page. */
export function frameComposition(score:Composition,format:ArtworkFormat='landscape'):Composition{
  if(format==='landscape')return score;
  const turn=(p:Point):Point=>({x:1-p.y,y:p.x});
  return {...score,
    gestures:score.gestures.map(g=>({...g,points:g.points.map(turn)})),
    ink:score.ink?.map(s=>({...s,points:s.points.map(turn)})),
  };
}
/** A resize never changes the simulation. It only changes the display buffer. */
export function displaySize(width:number,height:number,dpr:number,coarse=false,pixelBudget?:number):SheetSize{
  const pixelRatio=Math.min(Math.max(1,dpr||1),4);
  const w=Math.max(1,width)*pixelRatio,h=Math.max(1,height)*pixelRatio;
  const budget=pixelBudget??(coarse?4.2e6:8.4e6);
  const scale=Math.min(1,Math.sqrt(budget/(w*h)),4096/w,4096/h);
  return {width:Math.max(1,Math.round(w*scale)),height:Math.max(1,Math.round(h*scale))};
}
