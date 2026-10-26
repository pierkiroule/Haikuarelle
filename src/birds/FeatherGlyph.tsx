import {useId} from 'react';
import type {Bird} from './catalog';
import {PLUMAGE_PIGMENTS} from '../engine/palettes';

/** A shared quill silhouette: its tip is at (8,58), also the drawing hotspot. */
export function FeatherGlyph({bird,className=''}:{bird?:Bird;className?:string}){
  const gradient=useId();
  const colors=bird?(bird.plumage??[bird.slot]).map(slot=>PLUMAGE_PIGMENTS[slot]):['#9c7152','#c8aa78'];
  const broad=bird?.signature==='velvet';
  return <svg className={`feather-glyph ${className}`} viewBox="0 0 48 64" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <defs><linearGradient id={gradient} x1="12" y1="46" x2="40" y2="6" gradientUnits="userSpaceOnUse">{colors.map((color,i)=><stop key={i} offset={`${colors.length===1?0:i/(colors.length-1)*100}%`} stopColor={color}/>)}</linearGradient></defs>
    <path d={broad?'M12 47C1 28 17 5 42 4c3 15-1 25-11 32l-6 1 2 3-15 7Z':'M12 47C8 28 22 8 42 4c0 14-4 24-13 31l-5 1 2 3-14 8Z'} fill={`url(#${gradient})`} fillOpacity=".28" strokeOpacity=".7"/>
    <path d="M8 58C16 40 27 23 39 8" strokeWidth="1.4"/>
    <path d="m14 45 1-13m4 4 1-13m5 5 2-12m-9 25 11-4m-6-4 11-5m-6-2 10-6" strokeOpacity=".5"/>
    <path d="m12 49 6-3" strokeWidth="1.7"/>
  </svg>;
}
