import {useEffect,useRef,type RefObject} from 'react';
import type {HaikuarelleEngine} from '../engine/WatercolorEngine';
/** Local DOM animation: no 30 Hz rerender of the whole React atelier. */
export function InkbirdFlight({engine}:{engine:RefObject<HaikuarelleEngine|null>}){
 const node=useRef<HTMLDivElement>(null);
 useEffect(()=>{let frame=0;const draw=()=>{const el=node.current,flight=engine.current?.inkbirdFlight;if(el){el.hidden=!flight;if(flight){el.style.left=`${flight.point.x*100}%`;el.style.top=`${flight.point.y*100}%`;el.style.color=flight.color;el.style.setProperty('--flight-angle',`${flight.heading*180/Math.PI}deg`);}}frame=requestAnimationFrame(draw);};frame=requestAnimationFrame(draw);return()=>cancelAnimationFrame(frame);},[engine]);
 return <div ref={node} className="inkbird-flight" hidden aria-hidden="true"><svg viewBox="-20 -20 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path className="inkbird-wings" d="M0 0Q-13-19-17-10Q-8-8 0 0Q-5 12-15 15Q-2 17 0 0"/><path d="M-6 2Q3-5 9 0L15 1L9 3Q4 7-3 4L-11 8"/><circle cx="8" cy="1" r=".8" fill="currentColor"/></svg></div>;
}
