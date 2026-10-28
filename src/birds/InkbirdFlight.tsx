import {useEffect,useRef,type RefObject} from 'react';
import type {HaikuarelleEngine} from '../engine/WatercolorEngine';
/** Local DOM animation: no 30 Hz rerender of the whole React atelier. */
export function InkbirdFlight({engine}:{engine:RefObject<HaikuarelleEngine|null>}){
 const node=useRef<HTMLDivElement>(null);
 useEffect(()=>{let frame=0;const draw=()=>{const el=node.current,flight=engine.current?.inkbirdFlight;if(el){el.hidden=!flight;if(flight){el.style.left=`${flight.point.x*100}%`;el.style.top=`${flight.point.y*100}%`;el.style.color=flight.color;}}frame=requestAnimationFrame(draw);};frame=requestAnimationFrame(draw);return()=>cancelAnimationFrame(frame);},[engine]);
 return <div ref={node} className="inkbird-flight inkbird-point" hidden aria-hidden="true"/>;
}
