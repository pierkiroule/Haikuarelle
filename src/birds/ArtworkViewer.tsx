import {useEffect,useRef,useState,type PointerEvent} from 'react';
import './artworkViewer.css';
interface View{scale:number;x:number;y:number}
const initial:View={scale:1,x:0,y:0};
/** A separate reading lens: transforms only the exported image, never the artwork. */
export function ArtworkViewer({image,onClose}:{image:Blob;onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null),area=useRef<HTMLDivElement>(null),picture=useRef<HTMLImageElement>(null);
 const [url,setURL]=useState(''),[view,setView]=useState(initial);
 const current=useRef(initial),points=useRef(new Map<number,{x:number;y:number}>());
 const gesture=useRef<{view:View;x:number;y:number;distance:number}|null>(null);
 const tap=useRef({time:0,x:0,y:0}),down=useRef({x:0,y:0,moved:false});
 useEffect(()=>{const previous=document.activeElement;const src=URL.createObjectURL(image);setURL(src);dialog.current?.showModal();return()=>{dialog.current?.close();URL.revokeObjectURL(src);if(previous instanceof HTMLElement&&previous.isConnected)previous.focus({preventScroll:true});};},[image]);
 const apply=(next:View)=>{
  const r=area.current?.getBoundingClientRect(),img=picture.current;const scale=Math.min(5,Math.max(1,next.scale));
  let x=0,y=0;
  if(r&&img?.naturalWidth){const fit=Math.min(r.width/img.naturalWidth,r.height/img.naturalHeight);const mx=Math.max(0,(img.naturalWidth*fit*scale-r.width)/2),my=Math.max(0,(img.naturalHeight*fit*scale-r.height)/2);x=Math.max(-mx,Math.min(mx,next.x));y=Math.max(-my,Math.min(my,next.y));}
  current.current={scale,x,y};setView(current.current);
 };
 const start=()=>{const p=[...points.current.values()];if(!p.length){gesture.current=null;return;}const r=area.current!.getBoundingClientRect();const a=p[0],b=p[1]??a;gesture.current={view:{...current.current},x:(a.x+b.x)/2-r.left-r.width/2,y:(a.y+b.y)/2-r.top-r.height/2,distance:p.length>1?Math.hypot(a.x-b.x,a.y-b.y):0};};
 const zoomAt=(x:number,y:number)=>{const v=current.current,scale=v.scale>1?1:3;apply({scale,x:x-(x-v.x)*scale/v.scale,y:y-(y-v.y)*scale/v.scale});};
 const end=(e:PointerEvent<HTMLDivElement>)=>{
  if(!points.current.has(e.pointerId))return;
  const single=points.current.size===1;points.current.delete(e.pointerId);
  if(e.type==='pointerup'&&single&&!down.current.moved){const now=performance.now();if(now-tap.current.time<300&&Math.hypot(e.clientX-tap.current.x,e.clientY-tap.current.y)<25){const r=e.currentTarget.getBoundingClientRect();zoomAt(e.clientX-r.left-r.width/2,e.clientY-r.top-r.height/2);tap.current.time=0;}else tap.current={time:now,x:e.clientX,y:e.clientY};}
  if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);start();
 };
 useEffect(()=>{const observer=new ResizeObserver(()=>{current.current=initial;setView(initial);points.current.clear();gesture.current=null;});if(area.current)observer.observe(area.current);return()=>observer.disconnect();},[]);
 return <dialog ref={dialog} className="artwork-viewer" aria-labelledby="artwork-viewer-title" onCancel={e=>{e.preventDefault();onClose();}}>
  <header><h2 id="artwork-viewer-title">Contempler l’œuvre</h2><button onClick={onClose} aria-label="Fermer la vue agrandie">×</button></header>
  <div ref={area} className="artwork-viewer-area" aria-label="Pincez pour zoomer, glissez pour explorer" onPointerDown={e=>{if(e.button!==0)return;e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);points.current.set(e.pointerId,{x:e.clientX,y:e.clientY});down.current={x:e.clientX,y:e.clientY,moved:points.current.size>1};if(points.current.size>1)tap.current.time=0;start();}}
   onPointerMove={e=>{if(!points.current.has(e.pointerId)||!gesture.current)return;points.current.set(e.pointerId,{x:e.clientX,y:e.clientY});if(Math.hypot(e.clientX-down.current.x,e.clientY-down.current.y)>6)down.current.moved=true;const p=[...points.current.values()],a=p[0],b=p[1]??a,g=gesture.current,r=e.currentTarget.getBoundingClientRect();const scale=g.distance?g.view.scale*Math.hypot(a.x-b.x,a.y-b.y)/g.distance:g.view.scale;const bounded=Math.min(5,Math.max(1,scale));apply({scale:bounded,x:(a.x+b.x)/2-r.left-r.width/2-(g.x-g.view.x)*bounded/g.view.scale,y:(a.y+b.y)/2-r.top-r.height/2-(g.y-g.view.y)*bounded/g.view.scale});}}
   onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}>
   {url&&<img ref={picture} src={url} alt="Votre haïkuarelle, son titre et ses trois vers" draggable={false} style={{transform:`translate(${view.x}px,${view.y}px) scale(${view.scale})`}}/>}
  </div>
  <div className="artwork-viewer-tools" role="group" aria-label="Zoom de lecture"><button aria-label="Réduire le zoom" disabled={view.scale<=1} onClick={()=>apply({...current.current,scale:current.current.scale-.5})}>−</button><output aria-label="Niveau de zoom">{Math.round(view.scale*100)} %</output><button aria-label="Agrandir le zoom" disabled={view.scale>=5} onClick={()=>apply({...current.current,scale:current.current.scale+.5})}>+</button><button onClick={()=>apply(initial)}>Vue entière</button></div>
  <p className="artwork-viewer-hint">Pincez pour agrandir · Glissez pour explorer · Touchez deux fois pour zoomer</p>
 </dialog>;
}
