import {COMPOSITION_FONTS,DEFAULT_TEXT,type TextAppearance} from './compositionStyle';
import {useEffect,useRef,type PointerEvent} from 'react';
import {fitPoem,POEM_LINE_HEIGHT,type PoemPlacement} from './poemPlacement';
interface Props{title?:boolean;appearance?:TextAppearance;selected?:boolean;onSelect?:()=>void;verses:readonly string[];placement:PoemPlacement;editable:boolean;onChange:(p:PoemPlacement)=>void}
/** Text lives above the finished painting. Dragging never reaches the painter. */
export function HaikuBlock({title=false,appearance=DEFAULT_TEXT,selected=false,onSelect,verses,placement,editable,onChange}:Props){
 const block=useRef<HTMLDivElement>(null),drag=useRef<{id:number;x:number;y:number;p:PoemPlacement}|null>(null);
 const currentPlacement=useRef(placement);currentPlacement.current=placement;
 const content=verses.join('\n');
 const clamp=(p:PoemPlacement)=>{
  const box=block.current?.getBoundingClientRect(),paper=block.current?.closest('.bird-paper')?.getBoundingClientRect();
  return paper?.width&&box?fitPoem(p,box.width/paper.width,box.height/paper.height):fitPoem(p,.5,.12);
 };
 useEffect(()=>{
  const measure=()=>{const current=currentPlacement.current,p=clamp(current);if(Math.abs(p.x-current.x)+Math.abs(p.y-current.y)+Math.abs(p.size-current.size)>.0001)onChange(p);};
  measure();const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(measure);if(block.current)observer?.observe(block.current);
  return()=>observer?.disconnect();
 },[placement.size,content,appearance.font,onChange]);
 const end=(e:PointerEvent<HTMLDivElement>)=>{if(drag.current?.id!==e.pointerId)return;drag.current=null;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);};
 return <div ref={block} className={`${title?'resonant-title':'resonant-haiku'}${editable?' is-editable':''}${editable&&selected?' is-selected':''}`} style={{left:`${placement.x*100}%`,top:`${placement.y*100}%`,fontSize:`${placement.size*100}cqw`,lineHeight:POEM_LINE_HEIGHT,color:appearance.color,fontFamily:COMPOSITION_FONTS[appearance.font].family,textAlign:appearance.align}} tabIndex={editable?0:-1} role="group" aria-label={editable?`Déplacer ${title?'le titre':'le haïku'} : glisser ou utiliser les flèches du clavier`:title?'Titre du haïku':'Haïku résonant'}
  onFocus={()=>{if(editable)onSelect?.();}}
  onPointerDown={e=>{e.stopPropagation();if(!editable||e.button!==0||e.isPrimary===false)return;e.preventDefault();onSelect?.();e.currentTarget.focus({preventScroll:true});e.currentTarget.setPointerCapture(e.pointerId);drag.current={id:e.pointerId,x:e.clientX,y:e.clientY,p:{...placement}};}}
  onPointerMove={e=>{e.stopPropagation();const d=drag.current,paper=block.current?.closest('.bird-paper')?.getBoundingClientRect();if(!d||d.id!==e.pointerId||!paper?.width)return;onChange(clamp({...placement,x:d.p.x+(e.clientX-d.x)/paper.width,y:d.p.y+(e.clientY-d.y)/paper.height}));}}
  onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}
  onKeyDown={e=>{if(!editable||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();e.stopPropagation();const step=e.shiftKey?.03:.01;onChange(clamp({...placement,x:placement.x+(e.key==='ArrowRight'?step:e.key==='ArrowLeft'?-step:0),y:placement.y+(e.key==='ArrowDown'?step:e.key==='ArrowUp'?-step:0)}));}}>
  {verses.map((line,i)=><span key={i}>{line}</span>)}
 </div>;
}
