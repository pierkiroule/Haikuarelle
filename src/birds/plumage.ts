import type {Bird} from './catalog';
import type {Point} from '../engine/types';

/** Coherent islands in paper coordinates keep blue/yellow or rose/grey legible.
 * Colours meet through the real fluid field, rather than alternating each tick.
 * White is unpainted paper; this grammar never pastes opaque white over a wash.
 */
export function plumageSlot(bird:Bird,p:Point,origin:Point,axis:number,sy:number):number{
  if(!bird.signature){
    const palette=bird.plumage;
    if(!palette||palette.length<2)return bird.slot;
    const band=Math.sin((p.x-origin.x)*22+(p.y-origin.y)*sy*17+1.4);
    return palette[Math.min(palette.length-1,Math.floor((band+1)*.5*palette.length))];
  }
  const x=p.x-origin.x,y=(p.y-origin.y)*sy;
  const across=-x*Math.sin(axis)+y*Math.cos(axis),along=x*Math.cos(axis)+y*Math.sin(axis);
  const islands=Math.sin(across*26+.8)+.32*Math.sin(along*38+1.9);
  if(bird.signature==='lace')return islands>.73?4:3;
  if(bird.signature==='velvet')return islands<-.42?6:islands<-.12?7:5;
  if(bird.signature==='twig')return Math.sin(along*24+across*19+1.5)>.48?8:7;
  return islands>.70?4:9;
}
export const companionSlot=(bird:Bird):number|undefined=>bird.signature==='lace'?4:bird.signature==='velvet'?6:bird.signature==='twig'?8:bird.signature==='ripple'?4:bird.plumage?.find(slot=>slot!==bird.slot);
