import {useEffect,useRef,type PointerEvent} from 'react';
import {fitPoem,POEM_LINE_HEIGHT,type PoemPlacement} from './poemPlacement';
interface Props{title?:boolean;verses:readonly string[];placement:PoemPlacement;editable:boolean;onChange:(p:PoemPlacement)=>void}
/** Text lives above the finished painting. Dragging never reaches the painter. */
export function HaikuBlock({title=false,verses,placement,editable,onChange}:Props){
 const block=useRef<HTMLDivElement>(null),drag=useRef<{id:number;x:number;y:number;p:PoemPlacement}|null>(null);
 const clamp=(p:PoemPlacement)=>{
  const box=block.current?.getBoundingClientRect(),paper=block.current?.closest('.bird-paper')?.getBoundingClientRect();
  return paper?.width&&box?fitPoem(p,box.width/paper.width,box.height/paper.height):fitPoem(p,.5,.12);
 };
 useEffect(()=>{
  const measure=()=>{const p=clamp(placement);if(Math.abs(p.x-placement.x)+Math.abs(p.y-placement.y)+Math.abs(p.size-placement.size)>.0001)onChange(p);};
  measure();const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(measure);if(block.current)observer?.observe(block.current);
  return()=>observer?.disconnect();
 },[placement.x,placement.y,placement.size,verses,onChange]);
 const end=(e:PointerEvent<HTMLDivElement>)=>{if(drag.current?.id!==e.pointerId)return;drag.current=null;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);};
 return <div ref={block} className={`${title?'resonant-title':'resonant-haiku'}${editable?' is-editable':''}`} style={{left:`${placement.x*100}%`,top:`${placement.y*100}%`,fontSize:`${placement.size*100}cqw`,lineHeight:POEM_LINE_HEIGHT}} tabIndex={editable?0:-1} role="group" aria-label={editable?`Déplacer ${title?'le titre':'le haïku'} : glisser ou utiliser les flèches du clavier`:title?'Titre du haïku':'Haïku résonant'}
  onPointerDown={e=>{e.stopPropagation();if(!editable||e.button!==0||e.isPrimary===false)return;e.preventDefault();e.currentTarget.focus({preventScroll:true});e.currentTarget.setPointerCapture(e.pointerId);drag.current={id:e.pointerId,x:e.clientX,y:e.clientY,p:{...placement}};}}
  onPointerMove={e=>{e.stopPropagation();const d=drag.current,paper=block.current?.closest('.bird-paper')?.getBoundingClientRect();if(!d||d.id!==e.pointerId||!paper?.width)return;onChange(clamp({...placement,x:d.p.x+(e.clientX-d.x)/paper.width,y:d.p.y+(e.clientY-d.y)/paper.height}));}}
  onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}
  onKeyDown={e=>{if(!editable||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();e.stopPropagation();const step=e.shiftKey?.03:.01;onChange(clamp({...placement,x:placement.x+(e.key==='ArrowRight'?step:e.key==='ArrowLeft'?-step:0),y:placement.y+(e.key==='ArrowDown'?step:e.key==='ArrowUp'?-step:0)}));}}>
  {verses.map((line,i)=><span key={i}>{line}</span>)}
 </div>;
}
