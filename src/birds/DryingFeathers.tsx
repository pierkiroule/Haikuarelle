import type {CSSProperties} from 'react';
import type {Bird} from './catalog';
import {FeatherGlyph} from './FeatherGlyph';

/** A small CSS-only breeze in the paper margins, excluded from the artwork. */
export function DryingFeathers({bird}:{bird:Bird}){
  return <div className="drying-feathers" aria-hidden="true">{Array.from({length:12},(_,i)=>
    <span key={i} className={`drying-feather ${i%2?'on-right':'on-left'}`} style={{
      top:`${10+Math.floor(i/2)*15}%`,
      '--breeze-delay':`${-i*1.7}s`,
      '--breeze-duration':`${6+i%4*1.3}s`,
      '--breeze-size':`${12+i%3*3}px`,
      '--breeze-turn':`${i%2?25:-30}deg`,
    } as CSSProperties}><FeatherGlyph bird={bird}/></span>
  )}</div>;
}
