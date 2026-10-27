import {useRef,type PointerEvent} from 'react';
export interface PaintingPlacement{x:number;y:number;scale:number}
export const ORIGINAL_PAINTING:PaintingPlacement={x:0,y:0,scale:1};
export function fitPainting(p:PaintingPlacement):PaintingPlacement{
 const scale=Math.max(.25,Math.min(1,Number.isFinite(p.scale)?p.scale:1));
 return {scale,x:Math.max(0,Math.min(1-scale,Number.isFinite(p.x)?p.x:0)),y:Math.max(0,Math.min(1-scale,Number.isFinite(p.y)?p.y:0))};
}
export function PaintingHandle({placement,onChange}:{placement:PaintingPlacement;onChange:(p:PaintingPlacement)=>void}){
 const drag=useRef<{id:number;x:number;y:number;p:PaintingPlacement}|null>(null);
 const end=(e:PointerEvent<HTMLDivElement>)=>{if(drag.current?.id!==e.pointerId)return;drag.current=null;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);};
 return <div className="painting-handle" role="group" aria-label="Déplacer la peinture : glisser ou utiliser les flèches" tabIndex={0} style={{left:`${placement.x*100}%`,top:`${placement.y*100}%`,width:`${placement.scale*100}%`,height:`${placement.scale*100}%`}}
 onPointerDown={e=>{e.stopPropagation();if(e.button!==0||e.isPrimary===false)return;e.preventDefault();e.currentTarget.focus({preventScroll:true});e.currentTarget.setPointerCapture(e.pointerId);drag.current={id:e.pointerId,x:e.clientX,y:e.clientY,p:placement};}}
 onPointerMove={e=>{e.stopPropagation();const d=drag.current,r=e.currentTarget.parentElement?.getBoundingClientRect();if(!d||d.id!==e.pointerId||!r?.width)return;onChange(fitPainting({...d.p,x:d.p.x+(e.clientX-d.x)/r.width,y:d.p.y+(e.clientY-d.y)/r.height}));}}
 onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}
 onKeyDown={e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();e.stopPropagation();const n=e.shiftKey?.03:.01;onChange(fitPainting({...placement,x:placement.x+(e.key==='ArrowRight'?n:e.key==='ArrowLeft'?-n:0),y:placement.y+(e.key==='ArrowDown'?n:e.key==='ArrowUp'?-n:0)}));}}/>;
}
