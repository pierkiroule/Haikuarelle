import {composeBirdPoem} from './ornithopoetry';
import type {BirdId} from './catalog';
import type {Point} from '../engine/types';
export interface BirdMark {bird:BirdId;point:Point;seed:number}
/** The legacy card uses the same living bird vocabulary as the ritual. */
export function makeHaiku(marks:BirdMark[],palette:string,seed:number):[string,string,string]|null{
  if(!marks.length)return null;
  const hash=marks.reduce((h,m)=>Math.imul(h^m.seed,31)^Math.round(m.point.y*100),seed);
  const colorSeed=[...palette].reduce((h,c)=>Math.imul(h,31)^c.charCodeAt(0),hash);
  return composeBirdPoem(marks.map(m=>m.bird),colorSeed)?.verses??null;
}
