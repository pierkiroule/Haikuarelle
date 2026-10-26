import {Component,lazy,Suspense,useEffect,useRef,type ReactNode} from 'react';
import type {PaintingFrame} from '../birds/artworkPoetry';
import type {BirdMark} from '../birds/haiku';
import type {BirdId} from '../birds/catalog';
import './voyage.css';

export interface JourneyAudio {buffers:Map<BirdId,AudioBuffer>;failed:BirdId[]}
export interface Journey {
  frame:PaintingFrame;paper:string;marks:BirdMark[];title:string;seed:number;
  context:AudioContext|null;loadAudio:()=>Promise<JourneyAudio>;
}
const Voyage=lazy(()=>import('./Voyage'));
class VoyageBoundary extends Component<{children:ReactNode},{error:boolean}>{
  state={error:false};
  static getDerivedStateFromError(){return {error:true};}
  render(){return this.state.error?<p role="alert" className="voyage-message">Le voyage n’a pas pu s’ouvrir. Reviens à ton œuvre et réessaie.</p>:this.props.children;}
}

export default function VoyageDialog({journey,onClose}:{journey:Journey;onClose:()=>void}){
  const dialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{
    const node=dialog.current!;node.showModal?.();
    return()=>{node.close?.();};
  },[]);
  return <dialog ref={dialog} className="voyage-dialog" aria-labelledby="voyage-title" onCancel={event=>{event.preventDefault();onClose();}} onKeyDown={event=>event.stopPropagation()}>
    <header className="voyage-header"><div><span>MON VOYAGE · 360°</span><h2 id="voyage-title">{journey.title}</h2></div><button autoFocus onClick={onClose} aria-label="Retour à mon haïkuarelle">Retour à mon haïkuarelle <span aria-hidden="true">↙</span></button></header>
    <VoyageBoundary><Suspense fallback={<p className="voyage-message" role="status">La matière s’éveille…</p>}><Voyage journey={journey}/></Suspense></VoyageBoundary>
  </dialog>;
}
