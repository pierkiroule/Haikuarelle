import type {CSSProperties} from 'react';
import type {Bird} from './catalog';
import {FeatherGlyph} from './FeatherGlyph';

/** An asynchronous CSS-only wind in the paper margins, excluded from the artwork. */
export function DryingFeathers({bird}:{bird:Bird}){
  return <div className="drying-feathers" aria-hidden="true">{Array.from({length:12},(_,i)=>
    <span key={i} className={`drying-feather ${i%2?'on-right':'on-left'}`} style={{
      top:`${10+Math.floor(i/2)*15}%`,
      '--breeze-delay':`${-i*1.7}s`,
      '--breeze-duration':`${5.2+i%5*.83}s`,
      '--breeze-flight':`drying-drift-${i%3}`,
      '--breeze-flutter':`${1.3+i%4*.37}s`,
      '--breeze-spin':`${3.1+i%5*.61}s`,
      '--breeze-direction':i%3?'normal':'reverse',
      '--breeze-size':`${12+i%3*3}px`,
    } as CSSProperties}><span className="drying-feather-tumble"><FeatherGlyph bird={bird}/></span></span>
  )}</div>;
}
