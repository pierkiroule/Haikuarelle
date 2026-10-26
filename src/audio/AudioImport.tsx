import {useEffect,useRef,useState} from 'react';
import {openAudio,analyzeExcerpt,ExcerptPlayer,type AudioDocument} from './file';
import {EXCERPT_SECONDS,type AudioAnalysis} from './types';

export interface AudioSelection {name:string;start:number;analysis:AudioAnalysis}
const format=(time:number)=>`${Math.floor(time/60).toString().padStart(2,'0')}:${Math.floor(time%60).toString().padStart(2,'0')}`;

export default function AudioImport({onSelect,onClear,onBusy}:{onSelect:(selection:AudioSelection)=>void;onClear:()=>void;onBusy:(busy:boolean)=>void}){
  const [audio,setAudio]=useState<AudioDocument|null>(null),[start,setStart]=useState(0);
  const [analysis,setAnalysis]=useState<AudioAnalysis|null>(null);
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[playing,setPlaying]=useState(false);
  const [decoding,setDecoding]=useState(false);
  const analysisController=useRef<AbortController|null>(null);
  const input=useRef<HTMLInputElement>(null),player=useRef<ExcerptPlayer|null>(null),version=useRef(0);
  const callbacks=useRef({onSelect,onClear,onBusy});callbacks.current={onSelect,onClear,onBusy};
  useEffect(()=>{
    player.current=new ExcerptPlayer();
    return()=>{version.current++;player.current?.destroy();callbacks.current.onBusy(false);};
  },[]);
  // Invalidate synchronously, before decoding or the analysis debounce can run.
  // Keeping a previous score here would let the old painting continue without a valid source.
  const invalidate=()=>{
    analysisController.current?.abort();player.current?.stop();setPlaying(false);setAnalysis(null);callbacks.current.onClear();
  };
  useEffect(()=>{
    if(!audio||decoding)return;
    invalidate();
    const controller=new AbortController();analysisController.current=controller;
    setBusy(true);callbacks.current.onBusy(true);setError('');setAnalysis(null);player.current?.stop();setPlaying(false);
    const timer=setTimeout(()=>{
      analyzeExcerpt(audio,start,controller.signal).then(result=>{
        if(controller.signal.aborted)return;
        setAnalysis(result);callbacks.current.onSelect({name:audio.name,start,analysis:result});
      }).catch(error=>{
        if(controller.signal.aborted)return;
        setError(error instanceof Error?error.message:'Analyse impossible.');callbacks.current.onClear();
      }).finally(()=>{if(!controller.signal.aborted){setBusy(false);callbacks.current.onBusy(false);}});
    },180);
    return()=>{clearTimeout(timer);controller.abort();};
  },[audio,start,decoding]);
  const choose=async(file:File)=>{
    const request=++version.current;invalidate();setAudio(null);setStart(0);setBusy(false);
    setError('');setDecoding(true);callbacks.current.onBusy(true);
    try{
      const document=await openAudio(file);
      if(request!==version.current)return;
      setStart(0);setAudio(document);
    }catch(error){if(request===version.current){setError(error instanceof Error?error.message:'Lecture impossible.');callbacks.current.onBusy(false);}}
    finally{if(request===version.current)setDecoding(false);}
  };
  const example=async()=>{
    const request=++version.current;invalidate();setAudio(null);setStart(0);setBusy(false);setDecoding(true);callbacks.current.onBusy(true);setError('');
    try{
      const response=await fetch('/audio/etude-15s.mp3');
      if(!response.ok)throw new Error('L’extrait de démonstration est indisponible.');
      const blob=await response.blob();
      if(request===version.current)await choose(new File([blob],'Étude de résonance · 15 s.mp3',{type:'audio/mpeg'}));
    }catch(error){if(request===version.current){setError(error instanceof Error?error.message:'Extrait indisponible.');setDecoding(false);callbacks.current.onBusy(false);}}
  };
  const clear=()=>{
    version.current++;analysisController.current?.abort();player.current?.stop();setPlaying(false);setAudio(null);setAnalysis(null);setStart(0);setError('');setBusy(false);setDecoding(false);callbacks.current.onBusy(false);callbacks.current.onClear();
    if(input.current)input.current.value='';
  };
  const listen=async()=>{
    if(playing){player.current?.stop();setPlaying(false);return;}
    if(!audio)return;
    try{setPlaying(true);await player.current?.play(audio,start,()=>setPlaying(false));}
    catch{setPlaying(false);setError('Touchez à nouveau Écouter pour autoriser la lecture.');}
  };
  const length=Math.min(EXCERPT_SECONDS,audio?audio.duration-start:EXCERPT_SECONDS);
  const drop=(event:React.DragEvent)=>{event.preventDefault();const file=event.dataTransfer.files[0];if(file)void choose(file);};
  return <section className={`audio-import ${audio?'has-audio':''}`} aria-label="Transduire un extrait musical" onDragOver={e=>e.preventDefault()} onDrop={drop}>
    <input ref={input} type="file" accept=".mp3,.wav,.m4a,.ogg,.flac,audio/*" className="sr-only" id="audio-file" aria-label="Importer un fichier MP3" onChange={event=>{const file=event.target.files?.[0];if(file)void choose(file);event.target.value='';}}/>
    <div className="audio-heading">
      <button className="audio-file-button" onClick={()=>input.current?.click()} disabled={decoding}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M9 18V5l11-2v13M9 8l11-2"/><ellipse cx="6" cy="18" rx="3" ry="2"/><ellipse cx="17" cy="16" rx="3" ry="2"/></svg>
        {decoding?'Lecture du fichier…':audio?'Changer de MP3':'Importer un MP3'}
      </button>
      {audio?<span className="audio-name" title={audio.name}>{audio.name}</span>:<span className="audio-invitation">15 secondes de son. Une aquarelle, quelques lignes d’encre.</span>}
      {audio&&<button className="audio-clear" aria-label="Retirer le MP3" onClick={clear} title="Retirer le son et effacer la toile">×</button>}
      {!audio&&<button className="audio-example" onClick={example} disabled={decoding}>Essayer 15 s <span aria-hidden="true">↗</span></button>}
    </div>
    {audio&&<div className="audio-excerpt">
      <div className="waveform" aria-hidden="true">{analysis?.waveform.map((value,i)=><i key={i} style={{height:`${Math.max(3,value*100)}%`}}/>)}{!analysis&&<span className="analysis-message">{busy?'Écoute des matières sonores…':'Préparation de l’extrait…'}</span>}</div>
      <div className="excerpt-controls">
        <label className="excerpt-position"><span>EXTRAIT <strong>{format(start)} — {format(start+length)}</strong></span>
          <input aria-label="Début de l’extrait de 15 secondes" type="range" min="0" max={Math.max(0,audio.duration-EXCERPT_SECONDS)} step=".1" disabled={audio.duration<=EXCERPT_SECONDS||decoding} value={start} onChange={e=>{invalidate();setBusy(true);callbacks.current.onBusy(true);setStart(Number(e.target.value));}}/>
        </label>
        <button className="audio-listen" onClick={listen} disabled={busy||decoding}>{playing?'■ Arrêter':'▷ Écouter'}</button>
        <span className="excerpt-length">{length.toFixed(length<15?1:0)} s</span>
      </div>
      <p className="audio-grammar">Graves · profondeur <span/> Intensité · lavis <span/> Aigus · encre <span/> Silences · blancs</p>
      {analysis&&analysis.summary.silence>.99&&<p className="audio-silence" role="status">Cet extrait est silencieux : le papier reste blanc.</p>}
    </div>}
    {error&&<p className="audio-error" role="alert">{error}</p>}
  </section>;
}
