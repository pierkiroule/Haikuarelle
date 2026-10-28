import {useEffect,useRef,useState} from 'react';
import type {BirdSound} from '../birds/BirdAudioBank';
import type {ArtworkPoetry} from '../birds/artworkPoetry';
import {deliverArtwork} from '../birds/share';
import {DanceRenderer,type DanceCredit} from './renderer';
import {DanceAudio,recordDance,type DanceVideo} from './media';
import {videoSize,VIDEO_SECONDS} from './score';
import './dance.css';
interface Props{painting:Blob;sound:BirdSound;poetry:ArtworkPoetry;paper:string;seed:number;credit:DanceCredit;audio:DanceAudio;onClose:()=>void}
type Phase='loading'|'flying'|'ready'|'exporting'|'done'|'error';
export default function DanceStudio({painting,sound,poetry,paper,seed,credit,audio,onClose}:Props){
 const dialog=useRef<HTMLDialogElement>(null),canvas=useRef<HTMLCanvasElement>(null),renderer=useRef<DanceRenderer|null>(null),phaseRef=useRef<Phase>('loading'),startTime=useRef(0),abort=useRef<AbortController|null>(null),url=useRef(''),alive=useRef(true),generation=useRef(0);
 const [phase,setPhase]=useState<Phase>('loading'),[seconds,setSeconds]=useState(0),[error,setError]=useState(''),[video,setVideo]=useState<DanceVideo|null>(null),[videoURL,setVideoURL]=useState(''),[notice,setNotice]=useState('');
 const change=(next:Phase)=>{phaseRef.current=next;setPhase(next);};
 const liveSize=()=>{if(!canvas.current)return;const scale=Math.min(devicePixelRatio||1,1.5,1440/Math.max(innerWidth,innerHeight));canvas.current.width=Math.round(innerWidth*scale);canvas.current.height=Math.round(innerHeight*scale);};
 const play=async()=>{try{await audio.unlock();if(!alive.current)return;liveSize();setError('');startTime.current=audio.context.currentTime;audio.play(sound.document.buffer);change('flying');}catch(e){if(alive.current){setError(e instanceof Error?e.message:'Touche Revoir le vol pour autoriser le chant.');change('ready');}}};
 useEffect(()=>{
  alive.current=true;const currentGeneration=++generation.current;let cancelled=false;const previous=document.activeElement as HTMLElement|null;dialog.current?.showModal();let frame=0,lastFrame=0,lastSecond=-1;liveSize();
  void DanceRenderer.create(canvas.current!,painting,poetry,sound,paper,credit).then(scene=>{if(cancelled||!alive.current){scene.dispose();return;}renderer.current=scene;void play();}).catch(e=>{if(!cancelled&&alive.current){setError(e instanceof Error?e.message:'Le vol ne peut pas démarrer.');change('error');}});
  const tick=(now:number)=>{
   if(!alive.current)return;
   if(now-lastFrame>=1000/30){lastFrame=now;try{
    if(phaseRef.current==='flying'){let t=Math.max(0,audio.context.currentTime-startTime.current);if(t>=VIDEO_SECONDS){startTime.current=audio.context.currentTime;audio.play(sound.document.buffer);t=0;}renderer.current?.draw(t);const tenth=Math.floor(t*10);if(tenth!==lastSecond){setSeconds(t);lastSecond=tenth;}}
   }catch(e){audio.stop();setError(e instanceof Error?e.message:'Le vol a été interrompu.');change('error');}}
   frame=requestAnimationFrame(tick);
  };frame=requestAnimationFrame(tick);
  const resize=()=>{if(phaseRef.current!=='exporting'&&phaseRef.current!=='done'){liveSize();if(phaseRef.current==='ready')renderer.current?.draw(0);}};
  const visibility=()=>{if(document.hidden){abort.current?.abort();audio.stop();if(phaseRef.current!=='loading'&&phaseRef.current!=='done'&&phaseRef.current!=='error')change('ready');}};
  window.addEventListener('resize',resize);document.addEventListener('visibilitychange',visibility);
  return()=>{cancelled=true;alive.current=false;cancelAnimationFrame(frame);window.removeEventListener('resize',resize);document.removeEventListener('visibilitychange',visibility);abort.current?.abort();audio.stop();queueMicrotask(()=>{if(generation.current===currentGeneration)void audio.dispose();});renderer.current?.dispose();if(url.current)URL.revokeObjectURL(url.current);previous?.focus({preventScroll:true});};
 },[painting,sound,poetry,paper,credit,audio]);
 const exportVideo=async()=>{
  if(!renderer.current||!['ready','flying'].includes(phaseRef.current))return;
  const controller=new AbortController();abort.current=controller;change('exporting');setSeconds(0);setError('');
  try{const size=videoSize(matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0||innerWidth<=700,(navigator as Navigator&{deviceMemory?:number}).deviceMemory);canvas.current!.width=size.width;canvas.current!.height=size.height;
   const result=await recordDance(canvas.current!,t=>renderer.current!.draw(t),audio,sound.document.buffer,controller.signal,n=>setSeconds(n*VIDEO_SECONDS));
   if(controller.signal.aborted||!alive.current)return;if(url.current)URL.revokeObjectURL(url.current);url.current=URL.createObjectURL(result.blob);setVideoURL(url.current);setVideo(result);change('done');
  }catch(e){if(controller.signal.aborted||!alive.current)return;setError(e instanceof Error?e.message:'Le film n’a pas pu être préparé.');liveSize();renderer.current?.draw(0);change('ready');}
 };
 const deliver=async(mode:'share'|'download')=>{if(!video)return;try{const result=await deliverArtwork(video.blob,`haikuarelle-vol-${seed}.${video.extension}`,poetry.title,mode);setNotice(result==='saved'?'Le film est téléchargé.':result==='shared'?'Ton haïkuarelle a pris son envol.':'');}catch{setNotice('Le partage est indisponible. Essaie le téléchargement.');}};
 return <dialog ref={dialog} className="dance-dialog flight-dialog" aria-labelledby="flight-title" onCancel={e=>{e.preventDefault();onClose();}}>
  <header><h2 id="flight-title">Rorschach vivant</h2><button className="dance-close" onClick={onClose} aria-label="Revenir à mon œuvre">×</button></header>
  <canvas ref={canvas} hidden={phase==='done'} className="flight-canvas" aria-label="Voyage automatique en trois dimensions dans les pigments de ton haïkuarelle"/>
  {phase==='done'&&<video className="flight-video" src={videoURL} controls playsInline loop aria-label="Le vol de ton haïkuarelle, trente secondes"/>}
  {phase==='loading'&&<p className="flight-loading" role="status">La matière prépare son envol…</p>}
  <div className="flight-controls">
   {phase==='flying'&&<><span className="flight-status">Deux ailes, un même souffle</span><button onClick={()=>{audio.stop();change('ready');}}>Suspendre</button><button onClick={()=>void exportVideo()}>Garder la boucle · 30 s</button></>}
   {phase==='ready'&&<><button className="dance-primary" onClick={()=>void play()}>Revoir le vol</button><button onClick={()=>void exportVideo()}>Garder la boucle · 30 s</button></>}
   {phase==='exporting'&&<><p role="status">Création du film · {Math.round(seconds/VIDEO_SECONDS*100)} %</p><progress max={VIDEO_SECONDS} value={seconds} aria-label="Création du film"/><button onClick={()=>{abort.current?.abort();audio.stop();liveSize();renderer.current?.draw(0);change('ready');}}>Annuler</button></>}
   {phase==='done'&&<><button className="dance-primary" onClick={()=>void deliver('share')}>Partager le vol ↗</button><button onClick={()=>void deliver('download')}>Télécharger · {video?.extension.toUpperCase()}</button><button onClick={()=>{setVideo(null);setVideoURL('');if(url.current)URL.revokeObjectURL(url.current);url.current='';void play();}}>Revoir le vol</button>{video?.extension==='webm'&&<p className="flight-note">WebM sur ce navigateur. Pour Instagram, convertis le film en MP4 ou utilise un navigateur proposant le MP4.</p>}</>}
   {error&&<p className="dance-error" role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}
  </div>
 </dialog>;
}
