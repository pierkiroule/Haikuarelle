import {lazy,Suspense,useEffect,useRef,useState} from 'react';
import {HaikuarelleEngine} from './engine/WatercolorEngine';
import {PALETTES,getPalette} from './engine/palettes';
import type {EngineSettings,EngineStatus,Phase} from './engine/types';
import AudioImport,{type AudioSelection} from './audio/AudioImport';
import {sheetFor,exportSize,type ArtworkFormat} from './engine/layout';
import {useLargeScreen} from './useLargeScreen';
const Validation=lazy(()=>import('./Validation'));
const DEFAULT:EngineSettings={palette:'estuaire',granulation:.72,wetness:.64,complexity:.52,ink:.62};
const phaseLabels:Record<Phase,string>={idle:'Importez un MP3 pour commencer',wetting:'Le papier s’éveille',wash:'Les pigments se déposent',meeting:'Les lavis se rencontrent',bloom:'L’eau laisse son empreinte',ink:'L’encre dessine ses nervures',drying:'Les couleurs se posent',complete:'Une empreinte singulière'};
function readInitial():{settings:EngineSettings;seed:number}{
  const preferred:ArtworkFormat=innerWidth<900&&innerHeight>innerWidth?'portrait':'landscape';
  let settings:EngineSettings={...DEFAULT,format:preferred};
  try {const saved=JSON.parse(localStorage.getItem('haikuarelle-v1')||'null');if(saved)settings={
    palette:PALETTES.some(p=>p.id===saved.palette)?saved.palette:DEFAULT.palette,
    format:saved.format==='portrait'||saved.format==='landscape'?saved.format:preferred,
    ...Object.fromEntries(['granulation','wetness','complexity','ink'].map(key=>[key,typeof saved[key]==='number'&&Number.isFinite(saved[key])?Math.min(1,Math.max(0,saved[key])):DEFAULT[key as keyof EngineSettings]]))
  } as EngineSettings;}catch{/* Storage is optional. */}
  const params=new URLSearchParams(location.search);
  if(params.has('palette')&&PALETTES.some(p=>p.id===params.get('palette')))settings.palette=params.get('palette')!;
  for(const [query,key] of [['g','granulation'],['w','wetness'],['c','complexity'],['i','ink']] as const){const raw=params.get(query);if(raw!==null&&Number.isFinite(Number(raw)))settings={...settings,[key]:Math.min(1,Math.max(0,Number(raw)))};}
  const format=params.get('format');if(format==='portrait'||format==='landscape')settings.format=format;
  const raw=params.get('seed');const seed=raw!==null&&/^\d+$/.test(raw)?Number(raw)>>>0:240106;
  return {settings,seed};
}
export function Icon({name,size=18}:{name:string;size?:number}){
  const paths:Record<string,React.ReactNode>={
    generate:<><path d="M12 3v4m0 10v4M3 12h4m10 0h4M5.6 5.6l2.8 2.8m7.2 7.2 2.8 2.8M5.6 18.4l2.8-2.8m7.2-7.2 2.8-2.8"/><circle cx="12" cy="12" r="3"/></>,
    pause:<><path d="M9 5v14m6-14v14"/></>,play:<path d="m9 5 10 7-10 7z"/>,
    replay:<><path d="M4 10a8 8 0 1 1 2 8M4 4v6h6"/></>,
    download:<><path d="M12 3v12m-4-4 4 4 4-4M5 16v5h14v-5"/></>,
    screen:<><path d="M8 4H4v4m12-4h4v4M4 16v4h4m12-4v4h-4"/></>,
    chevron:<path d="m8 10 4 4 4-4"/>,close:<path d="m6 6 12 12M18 6 6 18"/>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]??paths.generate}</svg>;
}
function Studio(){
  const [initial]=useState(readInitial);
  const [settings,setSettings]=useState(initial.settings);
  const [seed,setSeed]=useState(initial.seed);
  const [seedText,setSeedText]=useState(String(initial.seed));
  const [status,setStatus]=useState<EngineStatus>({seed:initial.seed,progress:0,phase:'idle',paused:true,fps:0,ticks:0});
  const [title,setTitle]=useState('Le papier attend votre son');
  const [audioSelection,setAudioSelection]=useState<AudioSelection|null>(null);
  const [audioBusy,setAudioBusy]=useState(false);
  const audioCurrent=useRef<AudioSelection|null>(null);
  const audioBusyCurrent=useRef(false);
  const [error,setError]=useState('');const [toast,setToast]=useState('');const [exporting,setExporting]=useState(false);
  const [retry,setRetry]=useState(0);const [paletteOpen,setPaletteOpen]=useState(false);
  const studio=useRef<HTMLDivElement>(null);
  const largeScreen=useLargeScreen(studio);
  const canvas=useRef<HTMLCanvasElement>(null);const engine=useRef<HaikuarelleEngine|null>(null);
  const toolbar=useRef<HTMLDivElement>(null);const palettePicker=useRef<HTMLDivElement>(null);
  const currentSettings=useRef(settings);currentSettings.current=settings;
  const currentSeed=useRef(seed);currentSeed.current=seed;
  useEffect(()=>{
    if(!canvas.current)return;
    let e:HaikuarelleEngine;
    try{
      e=new HaikuarelleEngine(canvas.current,currentSettings.current,s=>setStatus(s),setError,{requireAudio:true});
      engine.current=e;if(audioCurrent.current){e.setAudio(audioCurrent.current.analysis);if(currentSeed.current!==audioCurrent.current.analysis.seed)e.generate(currentSeed.current);}setTitle(e.composition.title);
      if(audioCurrent.current&&matchMedia('(prefers-reduced-motion: reduce)').matches){e.pause();setToast('Animation en pause. Lancez-la à votre rythme.');}
    }catch(err){console.error('HAÏKUARELLE initialization',err);setError(err instanceof Error?err.message:'Ce navigateur ne permet pas d’ouvrir l’atelier.');}
    return ()=>{e?.destroy();engine.current=null;};
  },[retry]);
  useEffect(()=>{
    const timer=setTimeout(()=>{
      engine.current?.update(settings);if(engine.current)setTitle(engine.current.composition.title);
      try{localStorage.setItem('haikuarelle-v1',JSON.stringify(settings));}catch{}
      const url=new URL(location.href);url.searchParams.set('seed',String(currentSeed.current));url.searchParams.set('palette',settings.palette);url.searchParams.set('g',String(settings.granulation));url.searchParams.set('w',String(settings.wetness));url.searchParams.set('c',String(settings.complexity));url.searchParams.set('i',String(settings.ink??.62));url.searchParams.set('format',settings.format??'landscape');history.replaceState(null,'',url);
    },120);
    return ()=>clearTimeout(timer);
  },[settings]);
  useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(''),4500);return ()=>clearTimeout(timer);},[toast]);
  useEffect(()=>{
    const outside=(event:PointerEvent)=>{if(palettePicker.current&&!palettePicker.current.contains(event.target as Node))setPaletteOpen(false);};
    document.addEventListener('pointerdown',outside);return ()=>document.removeEventListener('pointerdown',outside);
  },[]);
  const generate=(value:number)=>{
    if(!audioCurrent.current||audioBusyCurrent.current||!engine.current||engine.current.paint.isContextLost)return;
    setError('');setSeed(value);setSeedText(String(value));
    engine.current?.generate(value);if(engine.current)setTitle(engine.current.composition.title);
    const url=new URL(location.href);url.searchParams.set('seed',String(value));url.searchParams.set('palette',settings.palette);history.replaceState(null,'',url);
  };
  const selectAudio=(selection:AudioSelection)=>{
    audioCurrent.current=selection;setAudioSelection(selection);setSeed(selection.analysis.seed);setSeedText(String(selection.analysis.seed));
    engine.current?.setAudio(selection.analysis);if(engine.current)setTitle(engine.current.composition.title);
    else setTitle('Une œuvre à partir de votre extrait');
    if(matchMedia('(prefers-reduced-motion: reduce)').matches)engine.current?.pause();
  };
  const clearAudio=()=>{
    audioCurrent.current=null;setAudioSelection(null);engine.current?.setAudio(null);
    setTitle('Le papier attend votre son');
    setStatus(s=>({...s,progress:0,phase:'idle',paused:true,ticks:0}));
  };
  const audioActivity=(busy:boolean)=>{audioBusyCurrent.current=busy;setAudioBusy(busy);};
  const newComposition=()=>{const n=crypto.getRandomValues(new Uint32Array(1))[0];generate(n===seed?(n+1)>>>0:n);};
  const replay=()=>generate(seed);
  const togglePause=()=>{const e=engine.current;if(!e||!audioCurrent.current||audioBusyCurrent.current)return;if(e.status.paused)e.resume();else e.pause();};
  useEffect(()=>{
    const key=(e:KeyboardEvent)=>{
      if(e.key==='Escape'){setPaletteOpen(false);if(largeScreen.viewing)largeScreen.exit();return;}
      if(e.target instanceof HTMLInputElement||e.target instanceof HTMLSelectElement||e.target instanceof HTMLButtonElement)return;
      if(e.code==='Space'){e.preventDefault();togglePause();}
      if(e.key.toLowerCase()==='g')newComposition();
      if(e.key.toLowerCase()==='f')largeScreen.toggle();
    };
    document.addEventListener('keydown',key);return ()=>document.removeEventListener('keydown',key);
  });
  const exportImage=async()=>{
    if(!audioCurrent.current||audioBusyCurrent.current||!engine.current||exporting)return;setExporting(true);
    try{
      const blob=await engine.current.exportPNG(),url=URL.createObjectURL(blob),link=document.createElement('a');
      link.href=url;link.download=`haikuarelle-${settings.palette}-${seed}.png`;link.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
      const size=exportSize(settings.format);setToast(`Votre aquarelle est exportée en ${size.width.toLocaleString('fr-FR')} × ${size.height.toLocaleString('fr-FR')} px.`);
    }catch(err){setToast(err instanceof Error?err.message:'L’export n’a pas abouti.');}finally{setExporting(false);}
  };
  const palette=getPalette(settings.palette),sheet=sheetFor(settings.format),pngSize=exportSize(settings.format);
  const audioReady=!!audioSelection&&!audioBusy;
  return <div ref={studio} className={`studio ${audioSelection?'audio-mode':''} ${largeScreen.viewing?'viewing':''} ${largeScreen.hud?'show-hud':''}`} data-format={settings.format} onPointerMove={largeScreen.viewing?largeScreen.reveal:undefined} onPointerDown={largeScreen.viewing?largeScreen.reveal:undefined} style={{'--paper':palette.paper,'--art-ratio':sheet.width/sheet.height,'--art-aspect':`${sheet.width} / ${sheet.height}`} as React.CSSProperties}>
    <header className="masthead">
      <a href="/" className="wordmark" aria-label="Haïkuarelle, accueil">HAÏKUARELLE <span className="mark">•°</span></a>
      <p className="tagline">Laisser le son devenir matière.</p>
      <div className="view-controls">
        <label className="format-choice"><span className="sr-only">Format de l’œuvre</span><select aria-label="Format de l’œuvre" value={settings.format??'landscape'} onChange={e=>setSettings(s=>({...s,format:e.target.value as ArtworkFormat}))}><option value="portrait">Portrait 9:16</option><option value="landscape">Paysage HD 16:9</option></select></label>
        <button className="screen-button" onClick={largeScreen.toggle} aria-label="Grand écran HD" title="Afficher l’œuvre en plein écran (F)"><Icon name="screen"/><span>Grand écran</span></button>
      </div>
    </header>
    <AudioImport onSelect={selectAudio} onClear={clearAudio} onBusy={audioActivity}/>
    <main className="workspace">
      <div className="artwork-wrap">
        <div className="paper">
          <canvas ref={canvas} className="painting" aria-label="Aquarelle abstraite et traits d’encre fine générés progressivement sur un papier texturé." role="img"/>
          {error&&<div className="error-panel" role="alert"><span className="error-mark">•°</span><h1>L’atelier a besoin de votre GPU.</h1><p>{error.includes('WebGL')||error.includes('float')?'Activez l’accélération graphique et utilisez un navigateur compatible WebGL2.':error}</p><button className="primary" onClick={()=>{setError('');setRetry(n=>n+1);}}>Réessayer</button></div>}
        </div>
        <div className="artwork-caption">
          <div className="caption-title"><span className="small-rule"/><span>{title}</span>{audioSelection&&<small className="audio-art-label">{audioSelection.analysis.duration.toFixed(1)} s transduites</small>}</div>
          <form className="seed-form" onSubmit={event=>{event.preventDefault();if(/^\d+$/.test(seedText)&&Number(seedText)<=4294967295)generate(Number(seedText));else setSeedText(String(seed));}}>
            <label htmlFor="seed">SEED</label><input id="seed" title="Saisir une seed puis valider avec Entrée" inputMode="numeric" disabled={!audioReady||!!error} value={seedText} onChange={e=>setSeedText(e.target.value)} aria-label="Seed de la composition"/>
            <button className="icon-button replay" type="button" disabled={!audioReady||!!error} onClick={replay} aria-label="Régénérer avec la même seed" title="Rejouer cette composition"><Icon name="replay" size={15}/></button>
          </form>
        </div>
      </div>
    </main>
    <div className="control-area">
      <div className="status-line" aria-live="polite"><span className={`status-dot ${audioReady&&status.progress<1&&!status.paused?'breathing':''}`}/><span>{audioBusy?'Écoute des matières sonores…':!audioSelection?phaseLabels.idle:status.phase==='idle'?'Cet extrait est silencieux · le papier reste blanc':status.paused&&status.progress<1?'Le temps est suspendu':phaseLabels[status.phase]}</span><span className="time-label">{Math.min(24,Math.floor(status.progress*24)).toString().padStart(2,'0')} / 24 s</span></div>
      <div className="toolbar" ref={toolbar}>
        <button className="primary generate" onClick={newComposition} disabled={!audioReady||!!error} title={!audioReady?'Importez et analysez un extrait audio pour créer l’œuvre':undefined}><Icon name="generate"/><span>Créer l’œuvre</span></button>
        <div className="palette-picker" ref={palettePicker}>
          <span className="control-label">PALETTE</span>
          <button className="palette-trigger" aria-haspopup="listbox" aria-expanded={paletteOpen} onClick={()=>setPaletteOpen(v=>!v)}>
            <span className="swatches" aria-hidden="true">{palette.colors.map(c=><i key={c} style={{background:c}}/>)}</span><span>{palette.name}</span><Icon name="chevron" size={14}/>
          </button>
          {paletteOpen&&<div className="palette-menu" role="listbox" aria-label="Choix de la palette" onKeyDown={e=>{if(e.key==='Escape')setPaletteOpen(false);}}>{PALETTES.map(p=><button key={p.id} role="option" aria-selected={p.id===settings.palette} onClick={()=>{setSettings(s=>({...s,palette:p.id}));setPaletteOpen(false);}}><span className="swatches">{p.colors.map(c=><i key={c} style={{background:c}}/>)}</span><span><strong>{p.name}</strong><small>{p.note}</small></span><span className="selected-check">{p.id===settings.palette?'✓':''}</span></button>)}</div>}
        </div>
        <div className="sliders">{([
          ['granulation','Texture','Grain fin','Grain minéral'],['wetness','Humidité','Papier sec','Papier humide'],['complexity','Complexité','Épure','Abondance'],...(audioSelection?[['ink','Encre','Filigrane','Nervures'] as const]:[])
        ] as const).map(([key,label,left,right])=><label key={key} className="slider-control" title={`${left} → ${right}`}><span className="control-label">{label}<output>{Math.round((settings[key]??.62)*100)}</output></span><input type="range" min="0" max="100" value={Math.round((settings[key]??.62)*100)} aria-label={label} aria-valuetext={`${Math.round((settings[key]??.62)*100)} %`} onChange={e=>setSettings(s=>({...s,[key]:Number(e.target.value)/100}))} style={{'--value':`${(settings[key]??.62)*100}%`} as React.CSSProperties}/></label>)}</div>
        <div className="toolbar-actions">
          <button className="icon-button pause" onClick={togglePause} disabled={!audioReady||status.phase==='idle'||status.progress===1||!!error} aria-label={status.paused?'Reprendre l’animation':'Mettre en pause'} title={status.paused?'Reprendre (Espace)':'Pause (Espace)'}><Icon name={status.paused?'play':'pause'} size={19}/></button>
          <button className="export-button" onClick={exportImage} disabled={!audioReady||exporting||!!error} title={`Exporter la peinture actuelle en PNG ${pngSize.width} × ${pngSize.height} px`}><Icon name="download" size={18}/><span>{exporting?'Export…':'PNG'}</span></button>
        </div>
      </div>
      <div className="footer-note"><span>Un son. Des pigments. Une empreinte.</span><a href="/PIGMENT-DRIFT-LICENSE.txt" target="_blank" rel="noreferrer">Moteur Pigment Drift · MIT</a></div>
    </div>
    {largeScreen.viewing&&<button className="exit-viewing" aria-label="Quitter le plein écran" onClick={largeScreen.exit} onFocus={largeScreen.reveal}><Icon name="close" size={18}/><span>Quitter</span></button>}
    {toast&&<div className="toast" role="status">{toast}</div>}
  </div>;
}
export default function App(){return new URLSearchParams(location.search).has('validation')?<Suspense fallback={<p>Ouverture de l’atelier…</p>}><Validation/></Suspense>:<Studio/>;}
