import {PoeticMotion} from './PoeticMotion';
import {useMotionValue,useSpring,type MotionStyle} from 'motion/react';
import {div as MotionDiv} from 'motion/react-m';
import type {ReactNode,PointerEvent} from 'react';
import {useMediaPreference} from './useMediaPreference';
import './poetic-ui.css';
/** A small card tilt, independent of the existing gust animation and selection button. */
export function DepthCard({children,className=''}:{children:ReactNode;className?:string}){
 const reduced=useMediaPreference('(prefers-reduced-motion: reduce)'),hover=useMediaPreference('(hover: hover) and (pointer: fine)');
 const x=useMotionValue(0),y=useMotionValue(0),rotateX=useSpring(x,{stiffness:90,damping:24}),rotateY=useSpring(y,{stiffness:90,damping:24});
 const move=(event:PointerEvent<HTMLDivElement>)=>{if(reduced||!hover||event.pointerType!=='mouse')return;const rect=event.currentTarget.getBoundingClientRect();x.set(Math.max(-3,Math.min(3,-((event.clientY-rect.top)/rect.height-.5)*6)));y.set(Math.max(-3,Math.min(3,((event.clientX-rect.left)/rect.width-.5)*6)));};
 const reset=()=>{x.set(0);y.set(0);};
 const style:MotionStyle=reduced||!hover?{}:{rotateX,rotateY,transformPerspective:850};
 return <PoeticMotion><MotionDiv className={`${className} poetic-depth`} style={style} onPointerMove={move} onPointerLeave={reset} onPointerCancel={reset} onBlurCapture={reset}>{children}</MotionDiv></PoeticMotion>;
}
