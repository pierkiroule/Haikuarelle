import {useEffect,useRef,useState} from 'react';
import './presentation.css';
const SESSION_KEY='haikuarelle-presentation-seen';
let shownInPage=false;
function firstVisit(){try{return !shownInPage&&sessionStorage.getItem(SESSION_KEY)!=='1';}catch{return !shownInPage;}}
export function Presentation(){
 const [open,setOpen]=useState(firstVisit);
 return <><button className="presentation-replay" onClick={()=>setOpen(true)}>Revoir la présentation <span aria-hidden="true">▷</span></button>{open&&<PresentationDialog onClose={()=>setOpen(false)}/>}</>;
}
function PresentationDialog({onClose}:{onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null),video=useRef<HTMLVideoElement>(null);
 const [started,setStarted]=useState(false),[playing,setPlaying]=useState(false);
 const [muted,setMuted]=useState(true),[failed,setFailed]=useState(false),[ended,setEnded]=useState(false);
 useEffect(()=>{
  const previous=document.activeElement,element=dialog.current,clip=video.current;
  shownInPage=true;try{sessionStorage.setItem(SESSION_KEY,'1');}catch{/* The in-page flag covers unavailable storage. */}
  if(element?.showModal)element.showModal();else element?.setAttribute('open','');
  return()=>{clip?.pause();if(element?.close)element.close();if(previous instanceof HTMLElement&&previous.isConnected)previous.focus({preventScroll:true});};
 },[]);
 const play=()=>{const clip=video.current;if(!clip)return;if(!started){clip.muted=false;setMuted(false);}if(ended){clip.currentTime=0;setEnded(false);}setStarted(true);void clip.play()?.catch(()=>setPlaying(false));};
 return <dialog ref={dialog} className="presentation-dialog" aria-labelledby="presentation-title" onCancel={e=>{e.preventDefault();onClose();}}>
  <header><div><p>UNE CRÉATION ARTISTIQUE</p><h2 id="presentation-title">Haïkuarelle</h2></div><button className="presentation-close" aria-label="Fermer la présentation" onClick={onClose}>×</button></header>
  <div className="presentation-film"><video ref={video} src="/presentation.mp4" poster="/brand/presentation-poster.webp" preload="metadata" playsInline muted={muted} controls={started} onPlay={()=>{setStarted(true);setPlaying(true);setEnded(false);}} onPause={()=>setPlaying(false)} onVolumeChange={e=>setMuted(e.currentTarget.muted)} onEnded={()=>{setEnded(true);setPlaying(false);}} onError={()=>setFailed(true)} aria-label="Présentation artistique de Haïkuarelle"/>
   {!playing&&!failed&&<button className="presentation-play" aria-label={ended?'Revoir la vidéo':started?'Reprendre la vidéo':'Lire la présentation avec le son'} onClick={play}><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M12 7 26 16 12 25Z" fill="currentColor"/></svg></button>}
  </div>
  {failed&&<p role="status" className="presentation-note">La vidéo ne peut pas être lue. Vous pouvez entrer dans l’atelier.</p>}
  <div className="presentation-actions"><button className="presentation-sound" disabled={!started||failed} aria-pressed={!muted} onClick={()=>{const clip=video.current;if(!clip)return;clip.muted=!clip.muted;setMuted(clip.muted);}}>{muted?'Activer le son':'Couper le son'}</button><button className="presentation-enter" onClick={onClose}>Entrer dans Haïkuarelle <span aria-hidden="true">→</span></button></div>
  <p className="presentation-note">{ended?'À vous de rencontrer une plume.':!started?'Touchez ▶ pour lancer la vidéo avec le son.':'Un prélude à la rencontre · Vous pouvez entrer à tout moment.'}</p>
 </dialog>;
}
