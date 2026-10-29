import {BIRD_COLOURS} from './colourPalettes';
import {useId} from 'react';
import type {Bird} from './catalog';
import {PLUMAGE_PIGMENTS} from '../engine/palettes';

/** Pigment washes share the bird's palette; the quill tip remains the drawing hotspot. */
export function FeatherGlyph({bird,className=''}:{bird?:Bird;className?:string}){
 const id=useId(),gradient=`${id}-wash`,clip=`${id}-outline`;
 const colors=bird?.pigmentSlot!==undefined?[bird.color]:bird?(BIRD_COLOURS[bird.id]?.map(c=>c.hex)??(bird.plumage??[bird.slot]).map(slot=>PLUMAGE_PIGMENTS[slot])):['#286d99','#68a496','#e0b944','#c66d65','#74618c'];
 const outline=bird?.signature==='velvet'?'M12 47C1 28 17 5 42 4c3 15-1 25-11 32l-6 1 2 3-15 7Z':'M12 47C8 28 22 8 42 4c0 14-4 24-13 31l-5 1 2 3-14 8Z';
 return <svg className={`feather-glyph ${className}`} viewBox="0 0 48 64" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
  <defs>
   <linearGradient id={gradient} x1="12" y1="46" x2="40" y2="6" gradientUnits="userSpaceOnUse">{colors.map((color,i)=><stop key={i} offset={`${colors.length===1?0:i/(colors.length-1)*100}%`} stopColor={color}/>)}</linearGradient>
   <clipPath id={clip}><path d={outline}/></clipPath>
  </defs>
  <path d={outline} fill={`url(#${gradient})`} fillOpacity=".64"/>
  <g clipPath={`url(#${clip})`}>
   {colors.map((color,i)=><path key={i} d={`M${8+i%3*3} ${46-i*36/colors.length}q12 -15 33 -6q-3 10 -15 12q-10 -3 -18 4Z`} fill={color} opacity=".55"/>)}
   <path d="M14 44Q19 20 40 7Q26 28 19 43Z" fill="#fff" opacity=".24"/>
   <path d="m16 37 18-8m-15 1 17-8m-13 0 15-8m-20 29 11-4" stroke="#fff" strokeOpacity=".32" strokeWidth=".55"/>
  </g>
  <path d={outline} stroke={colors[0]} strokeOpacity=".24" strokeWidth=".6"/>
  <path d="M8 58C16 40 27 23 39 8" stroke={colors[0]} strokeOpacity=".74" strokeWidth="1"/>
  <path d="M9 56C18 38 29 21 39 8" stroke="#fff" strokeOpacity=".65" strokeWidth=".45"/>
  <path d="m14 45 1-13m4 4 1-13m5 5 2-12m-7 24 9-3m-6-4 11-5m-6-2 10-6" stroke={colors[0]} strokeOpacity=".22" strokeWidth=".6"/>
 </svg>;
}
