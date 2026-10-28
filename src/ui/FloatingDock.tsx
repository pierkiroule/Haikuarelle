import {PoeticMotion} from './PoeticMotion';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import {div as MotionDiv} from 'motion/react-m';
import {useMediaPreference} from './useMediaPreference';
import './poetic-ui.css';
/** Local CSS adaptation of the Floating Dock interaction; original tool buttons stay intact. */
export function FloatingDock({children,className,drawing=false,keepOpen=false}:{children:ReactNode;className:string;drawing?:boolean;keepOpen?:boolean}){
 const reduced=useMediaPreference('(prefers-reduced-motion: reduce)'),[awake,setAwake]=useState(true),[engaged,setEngaged]=useState(false),[keyboard,setKeyboard]=useState(false);
 const root=useRef<HTMLDivElement>(null),timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const wake=()=>{setAwake(true);if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>setAwake(false),4200);};
 useEffect(()=>{if(drawing){setAwake(false);return;}wake();return()=>{if(timer.current)clearTimeout(timer.current);};},[drawing,keepOpen]);
 const visible=reduced||keyboard||!drawing&&(awake||engaged||keepOpen);
 return <PoeticMotion>
  <button type="button" className={`poetic-dock-wake${visible||drawing?' is-concealed':''}`} onClick={()=>{wake();root.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();}} aria-hidden={visible||drawing} aria-label="Afficher les outils de peinture" tabIndex={visible||drawing?-1:0}>Outils <span aria-hidden="true">•°</span></button>
  <MotionDiv ref={root} className={`${className} poetic-dock`} data-dock-visible={visible} initial={false} animate={{opacity:visible?1:0}} transition={{duration:reduced?0:.65,ease:'easeInOut'}} style={{pointerEvents:drawing&&!keyboard?'none':undefined}}
   onPointerEnter={e=>{if(e.pointerType==='mouse'){setEngaged(true);wake();}}} onPointerLeave={()=>{setEngaged(false);wake();}} onPointerDownCapture={wake}
   onFocusCapture={()=>{setKeyboard(true);wake();}} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node|null)){setKeyboard(false);wake();}}}
   role="group" aria-label="Palette : eau, plume, souffle du vivant et Inkbird">{children}</MotionDiv>
 </PoeticMotion>;
}
