import {useEffect,useRef,useState} from 'react';
import type {BirdSound} from '../birds/BirdAudioBank';
import type {ArtworkPoetry} from '../birds/artworkPoetry';
import {deliverArtwork} from '../birds/share';
import {dancePoint} from './framing';
import {DanceRenderer,type DanceCredit} from './renderer';
import {DanceAudio,recordDance,type DanceVideo} from './media';
import {DANCE_TOOLS,addGesture,videoSize,clamp,type DanceTool,type DanceGesture} from './score';
import './dance.css';
interface Props{painting:Blob;sound:BirdSound;poetry:ArtworkPoetry;paper:string;seed:number;credit:DanceCredit;onClose:()=>void}
type Phase='loading'|'explore'|'countdown'|'recording'|'ready'|'exporting'|'done'|'error';
export default function DanceStudio({painting,sound,poetry,paper,seed,credit,onClose}:Props){
 const dialog=useRef<HTMLDialogElement>(null),canvas=useRef<HTMLCanvasElement>(null),renderer=useRef<DanceRenderer|null>(null),audio=useRef<DanceAudio|null>(null),phaseRef=useRef<Phase>('loading'),toolRef=useRef<DanceTool>('wave'),score=useRef<DanceGesture[]>([]),epoch=useRef<number|null>(null),pointer=useRef<number|null>(null),held=useRef(false),position=useRef({x:.5,y:.5}),abort=useRef<AbortController|null>(null),recorded=useRef<DanceGesture[]>([]),url=useRef('');
 const [phase,setPhase]=useState<Phase>('loading'),[tool,setTool]=useState<DanceTool>('wave'),[seconds,setSeconds]=useState(0),[count,setCount]=useState(3),[error,setError]=useState(''),[video,setVideo]=useState<DanceVideo|null>(null),[videoURL,setVideoURL]=useState(''),[notice,setNotice]=useState('');
 const change=(next:Phase)=>{phaseRef.current=next;setPhase(next);};
 const stop=()=>{audio.current?.stop();held.current=false;pointer.current=null;};
 const reset=()=>{abort.current?.abort();stop();score.current=[];recorded.current=[];epoch.current=null;setSeconds(0);setVideo(null);setVideoURL('');if(url.current)URL.revokeObjectURL(url.current);url.current='';setError('');change('explore');};
 useEffect(()=>{
  const previous=document.activeElement as HTMLElement|null;dialog.current?.showModal();let alive=true,frame=0;const size=videoSize(matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0||innerWidth<=700,(navigator as Navigator&{deviceMemory?:number}).deviceMemory);canvas.current!.width=size.width;canvas.current!.height=size.height;
  void DanceRenderer.create(canvas.current!,painting,poetry,sound,paper,credit).then(scene=>{if(!alive){scene.dispose();return;}renderer.current=scene;change('explore');}).catch(e=>{if(alive){setError(e instanceof Error?e.message:'La danse ne peut pas démarrer.');change('error');}});
  let countdownStart=0,lastSecond=-1,lastFrame=0;
  const tick=(now:number)=>{
   if(!alive)return;
   if(now-lastFrame<1000/30){frame=requestAnimationFrame(tick);return;}lastFrame=now;
   const p=phaseRef.current;if(p!=='countdown')countdownStart=0;
   try{
    if(p==='countdown'){
     if(!countdownStart)countdownStart=now;const elapsed=(now-countdownStart)/1000;setCount(Math.max(1,3-Math.floor(elapsed)));
     if(elapsed>=3){score.current=[];epoch.current=now;audio.current?.play(sound.document.buffer);change('recording');countdownStart=0;}
     renderer.current?.draw(0,[]);
    }else if(p==='recording'||p==='explore'){
     const t=epoch.current===null?0:Math.min(9,(now-epoch.current)/1000);
     if(held.current&&t<9)addGesture(score.current,{...position.current,time:t,tool:toolRef.current,strength:1});
     renderer.current?.draw(Math.min(8.999,t),score.current);
     const tenth=Math.floor(t*10);if(tenth!==lastSecond){setSeconds(t);lastSecond=tenth;}
     if(t>=9&&p==='recording'){recorded.current=score.current.map(g=>({...g}));stop();change('ready');}
    }
   }catch(e){stop();setError(e instanceof Error?e.message:'La danse a été interrompue.');change('error');}
   frame=requestAnimationFrame(tick);
  };frame=requestAnimationFrame(tick);
  const visibility=()=>{if(document.hidden&&(phaseRef.current==='recording'||phaseRef.current==='countdown'||phaseRef.current==='exporting')){abort.current?.abort();stop();epoch.current=null;setError('La danse a été interrompue. Recommence en gardant cet écran ouvert.');change(recorded.current.length?'ready':'explore');}else if(document.hidden)stop();};document.addEventListener('visibilitychange',visibility);
  return()=>{alive=false;cancelAnimationFrame(frame);document.removeEventListener('visibilitychange',visibility);abort.current?.abort();void audio.current?.dispose();renderer.current?.dispose();if(url.current)URL.revokeObjectURL(url.current);previous?.focus({preventScroll:true});};
 },[painting,sound,poetry,paper,credit]);
 const unlock=async()=>{audio.current??=new DanceAudio();await audio.current.unlock();};
 const start=async()=>{try{await unlock();stop();score.current=[];epoch.current=null;setCount(3);setError('');change('countdown');}catch(e){setError(e instanceof Error?e.message:'Le chant ne peut pas démarrer.');}};
 const touch=async()=>{
  if(phaseRef.current!=='explore'&&phaseRef.current!=='recording')return;
  if(phaseRef.current==='explore'&&(epoch.current===null||performance.now()-epoch.current>=9000)){
   const context=audio.current??(audio.current=new DanceAudio());try{await context.unlock();if(phaseRef.current!=='explore')return;score.current=[];epoch.current=performance.now();context.play(sound.document.buffer);}catch(e){setError(e instanceof Error?e.message:'Le chant ne peut pas démarrer.');}
  }
 };
 const move=(event:React.PointerEvent<HTMLCanvasElement>)=>{position.current=dancePoint(event.clientX,event.clientY,event.currentTarget.getBoundingClientRect());};
 const release=()=>{held.current=false;pointer.current=null;};
 const exportVideo=async()=>{if(!renderer.current||phaseRef.current!=='ready')return;const controller=new AbortController();abort.current=controller;change('exporting');setSeconds(0);setError('');try{await unlock();if(controller.signal.aborted)return;const result=await recordDance(canvas.current!,t=>renderer.current!.draw(t,recorded.current),audio.current!,sound.document.buffer,controller.signal,n=>setSeconds(n*15));if(controller.signal.aborted)return;if(url.current)URL.revokeObjectURL(url.current);url.current=URL.createObjectURL(result.blob);setVideoURL(url.current);setVideo(result);change('done');}catch(e){if(controller.signal.aborted)return;setError(e instanceof Error?e.message:'La vidéo n’a pas pu être préparée.');change('ready');}};
 const deliver=async(mode:'share'|'download')=>{if(!video)return;try{const result=await deliverArtwork(video.blob,`haikuarelle-danse-${seed}.${video.extension}`,poetry.title,mode);setNotice(result==='saved'?'La vidéo est téléchargée.':result==='shared'?'La danse a pris son envol.':'');}catch{setNotice('Le partage est indisponible. Essaie le téléchargement.');}};
 const editable=phase==='explore'||phase==='recording';
 return <dialog ref={dialog} className="dance-dialog" aria-labelledby="dance-title" onCancel={e=>{e.preventDefault();onClose();}}>
  <header><div><p className="dance-eyebrow">LES TROIS SOUFFLES</p><h2 id="dance-title">La danse de ton haïkuarelle</h2></div><button className="dance-close" onClick={onClose} aria-label="Revenir à mon œuvre">×</button></header>
  <div className="dance-body"><div className="dance-stage">
   <canvas ref={canvas} hidden={phase==='done'} aria-label="Surface de danse : glisse pour animer la matière. Au clavier, maintiens espace et utilise les flèches." tabIndex={editable?0:-1} onPointerDown={e=>{if(!editable||pointer.current!==null||e.isPrimary===false||e.button!==0)return;e.preventDefault();e.currentTarget.focus({preventScroll:true});e.currentTarget.setPointerCapture(e.pointerId);pointer.current=e.pointerId;held.current=true;move(e);void touch();}} onPointerMove={e=>{if(pointer.current===e.pointerId)move(e);}} onPointerUp={e=>{if(pointer.current===e.pointerId)release();}} onPointerCancel={e=>{if(pointer.current===e.pointerId)release();}} onLostPointerCapture={e=>{if(pointer.current===e.pointerId)release();}} onBlur={release} onKeyDown={e=>{if(!editable)return;if([' ','Enter','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();if(e.key===' '||e.key==='Enter'){held.current=true;void touch();}else{position.current={x:clamp(position.current.x+(e.key==='ArrowRight'?.04:e.key==='ArrowLeft'?-.04:0)),y:clamp(position.current.y+(e.key==='ArrowDown'?.04:e.key==='ArrowUp'?-.04:0))};}}}} onKeyUp={e=>{if(e.key===' '||e.key==='Enter')release();}}/>
   {phase==='done'&&<video src={videoURL} controls playsInline aria-label="Ta danse et sa présentation, quinze secondes"/>}
   {phase==='loading'&&<p className="dance-overlay" role="status">La matière prépare son envol…</p>}
   {phase==='countdown'&&<p className="dance-overlay dance-count" role="status">{count}</p>}
   {phase==='recording'&&<p className="dance-recording" role="status">● {Math.min(9,seconds).toFixed(1)} / 9 s</p>}
  </div><aside className="dance-panel">
   <p className="dance-intro">Ton œuvre devient matière en mouvement. Choisis un outil, puis glisse dans la couleur. Le chant lui répond.</p>
   <div className="dance-tools" role="group" aria-label="Cinq outils résonants">{DANCE_TOOLS.map((entry,i)=><button key={entry.id} aria-pressed={tool===entry.id} disabled={!editable} onClick={()=>{toolRef.current=entry.id;setTool(entry.id);}}><span aria-hidden="true">{['≋','◌','↻','⋰','⌁'][i]}</span>{entry.name}</button>)}</div>
   <p className="dance-tool-hint">{DANCE_TOOLS.find(t=>t.id===tool)?.hint}</p>
   {phase==='explore'&&<><button className="dance-primary" onClick={()=>void start()}>Enregistrer ma danse · 9 s</button><p className="dance-small">Explore librement, puis enregistre tes gestes. Trois vers accompagnent les trois temps de ta danse.</p></>}
   {phase==='recording'&&<><progress max={9} value={seconds} aria-label="Durée de la danse"/><button onClick={reset}>Recommencer</button></>}
   {phase==='countdown'&&<button onClick={reset}>Annuler le départ</button>}
   {phase==='ready'&&<><p>Ta chorégraphie est prête.</p><button className="dance-primary" onClick={()=>void exportVideo()}>Créer ma vidéo · 15 s</button><button onClick={reset}>Recomposer ma danse</button><p className="dance-small">9 s pour ton œuvre, puis 6 s pour faire découvrir Plume d’Haïkuarelle. Garde cet écran ouvert pendant la création.</p></>}
   {phase==='exporting'&&<><p role="status">Création de la vidéo · {Math.round(seconds/15*100)} %</p><progress max={15} value={seconds} aria-label="Création de la vidéo"/><button onClick={()=>{abort.current?.abort();audio.current?.stop();change('ready');}}>Annuler</button></>}
   {phase==='done'&&<><button className="dance-primary" onClick={()=>void deliver('share')}>Partager la danse ↗</button><button onClick={()=>void deliver('download')}>Télécharger · {video?.extension.toUpperCase()}</button><button onClick={reset}>Créer une autre danse</button>{video?.extension==='webm'&&<p className="dance-small">Ce navigateur exporte en WebM. Pour Instagram, convertis ce fichier en MP4 ou utilise un navigateur proposant le MP4.</p>}<p className="dance-small">Vidéo verticale · {canvas.current?.width} × {canvas.current?.height} · 15 s</p></>}
   {error&&<p className="dance-error" role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}
   <a href="/birds/credits.html" target="_blank" rel="noreferrer">Chant & crédits ↗</a>
  </aside></div>
 </dialog>;
}
