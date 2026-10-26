import {lazy,Suspense,useEffect,useRef,useState} from 'react';
import {HaikuarelleEngine} from './engine/WatercolorEngine';
import {getPalette,PLUMAGE_PIGMENTS} from './engine/palettes';
import {exportSize,sheetFor,type ArtworkFormat} from './engine/layout';
import type {EngineSettings,EngineStatus,Point} from './engine/types';
import {BIRD_BRUSHES as BIRDS,type Bird,type BirdId} from './birds/catalog';
import {paperPoint} from './birds/ResonantBrush';
import {BirdAudioBank} from './birds/BirdAudioBank';
import {DirectBrush} from './birds/DirectBrush';
import type {BirdMark} from './birds/haiku';
import {makeArtworkPoetry,readArtwork,type ArtworkPoetry} from './birds/artworkPoetry';
import {ArtworkTitle,ArtworkPoem} from './birds/ArtworkWords';
import {exportSignatureCard} from './birds/export';
import {useLargeScreen} from './useLargeScreen';
import './birds.css';
import './birds/paperSurface.css';
import './atelier.css';
import './plumes.css';
import {APP_NAME} from './brand';
import {FeatherGlyph} from './birds/FeatherGlyph';
const Validation=lazy(()=>import('./Validation'));
const Legacy=lazy(()=>import('./LegacyStudio'));
const randomSeed=()=>crypto.getRandomValues(new Uint32Array(1))[0];
const defaults:EngineSettings={palette:'plumages',granulation:.82,wetness:.57,complexity:.52,ink:.20,resonance:.96,sharpness:.66,dryingThreshold:.42,format:'portrait'};
const idle:EngineStatus={seed:0,progress:0,phase:'idle',paused:true,fps:0,ticks:0};
function Glyph({name}:{name:'screen'|'close'|'download'|'refresh'|'erase'|'stop'|'sound'}){
  const paths={screen:'M8 4H4v4m12-4h4v4M4 16v4h4m12-4v4h-4',close:'m6 6 12 12M18 6 6 18',download:'M12 3v12m-4-4 4 4 4-4M5 16v5h14v-5',refresh:'M4 10a8 8 0 1 1 2 8M4 4v6h6',erase:'m15 3 6 6-11 11H6l-4-4L15 3zm-9 9 6 6m-2 2h12',stop:'M7 7h10v10H7z',sound:'m11 5-5 4H3v6h3l5 4zM15 8c3 2 3 6 0 8m3-11c5 4 5 10 0 14'};
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]}/></svg>;
}

export function BirdStudio(){
  const [settings,setSettings]=useState<EngineSettings>(defaults),[seed,setSeed]=useState(randomSeed);
  const [featherTilt,setFeatherTilt]=useState(0);
  const cursorPrevious=useRef<Point|null>(null);
  const [point,setPoint]=useState<Point|null>(null),[contact,setContact]=useState(false);
  const [brushPrefs,setBrushPrefs]=useState<Partial<Record<BirdId,{size:number;opacity:number}>>>({});
  const [brushMenu,setBrushMenu]=useState<BirdId|null>(null);
  const [selected,setSelected]=useState<BirdId>('rougegorge');
  const brush=brushPrefs[selected]?.size??.62,opacity=brushPrefs[selected]?.opacity??1;
  const setBrush=(size:number)=>setBrushPrefs(p=>({...p,[selected]:{size,opacity}}));
  const setOpacity=(value:number)=>setBrushPrefs(p=>({...p,[selected]:{size:brush,opacity:value}}));
  const [padIds,setPadIds]=useState<BirdId[]>([]);
  const [stage,setStage]=useState<'choose'|'paint'|'drying'|'finished'>('choose');
  const [poetry,setPoetry]=useState<ArtworkPoetry|null>(null),[dryingStart,setDryingStart]=useState(0);
  const [marks,setMarks]=useState<BirdMark[]>([]),[ready,setReady]=useState<BirdId[]>([]);
  const [playing,setPlaying]=useState<BirdId|null>(null),[loading,setLoading]=useState<BirdId|null>(null);
  const [status,setStatus]=useState(idle),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const [retry,setRetry]=useState(0),[exporting,setExporting]=useState(false),[name,setName]=useState('');
  const [canvasOnly,setCanvasOnly]=useState(false);
  const artwork=useRef<HTMLElement>(null);
  const studio=useRef<HTMLDivElement>(null),canvas=useRef<HTMLCanvasElement>(null),paper=useRef<HTMLDivElement>(null);
  const engine=useRef<HaikuarelleEngine|null>(null),bank=useRef<BirdAudioBank|null>(null),stroke=useRef<DirectBrush|null>(null);
  const pointer=useRef<number|null>(null),keyHeld=useRef(false),voiceNumber=useRef(0);
  const current=useRef({settings,seed,brush,opacity,marks});current.current={settings,seed,brush,opacity,marks};
  const screen=useLargeScreen(studio);
  const canPaint=stage==='paint';
  const palette=getPalette(settings.palette),sheet=sheetFor(settings.format),busy=!!playing||!!loading;
  const selectedBird=BIRDS.find(b=>b.id===selected)!;
  const pads=padIds.map(id=>BIRDS.find(b=>b.id===id)!);
  useEffect(()=>{
    let live=true;const sounds=new BirdAudioBank();bank.current=sounds;setReady([]);
    void sounds.preload(id=>{if(live)setReady(list=>list.includes(id)?list:[...list,id]);});
    try{
      const painter=new HaikuarelleEngine(canvas.current!,current.current.settings,s=>{if(live)setStatus(s);},message=>{if(live)setError(message);},{requireAudio:true});
      engine.current=painter;painter.beginSignature(current.current.seed);
      stroke.current=new DirectBrush(sounds,painter,{
        preparing:bird=>{if(live)setLoading(bird.id);},
        started:bird=>{if(live){setLoading(null);setPlaying(bird.id);}},
        stopped:()=>{if(live){setLoading(null);setPlaying(null);setContact(false);}},
        marked:(bird,origin,eventSeed)=>{if(live)setMarks(list=>[...list.slice(-255),{bird:bird.id,point:{...origin},seed:eventSeed}]);},
        error:message=>{if(live)setNotice(message);},
      });
    }catch(error){setError(error instanceof Error?error.message:'Le moteur ne peut pas démarrer.');}
    return()=>{live=false;stroke.current?.end();stroke.current=null;sounds.destroy();engine.current?.destroy();engine.current=null;bank.current=null;};
  },[retry]);
  useEffect(()=>{engine.current?.update(settings);},[settings]);
  useEffect(()=>{engine.current?.setBrushSize(brush);engine.current?.setBrushOpacity?.(opacity);},[brush,opacity]);
  useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(''),4500);return()=>clearTimeout(timer);},[notice]);
  const stop=()=>{
    const id=pointer.current;pointer.current=null;keyHeld.current=false;
    stroke.current?.end();setContact(false);
    if(id!==null&&paper.current?.hasPointerCapture(id))paper.current.releasePointerCapture(id);
  };
  useEffect(()=>{
    if(!brushMenu)return;
    const dismiss=(event:PointerEvent)=>{
      if(event.target instanceof Element&&!event.target.closest('.brush-context, .bird-pad'))setBrushMenu(null);
    };
    document.addEventListener('pointerdown',dismiss);
    return()=>document.removeEventListener('pointerdown',dismiss);
  },[brushMenu]);
  const resetSheet=(next:number)=>{stop();setSeed(next);setMarks([]);setPoetry(null);setPoint(null);voiceNumber.current=0;engine.current?.beginSignature(next);setStage(padIds.length===3?'paint':'choose');setBrushMenu(null);};
  const fresh=()=>{resetSheet(randomSeed());setPadIds([]);setStage('choose');if(screen.viewing)screen.exit();};
  const erase=()=>{resetSheet(current.current.seed);setNotice('Tout est effacé. La feuille est prête.');};
  const begin=(p:Point,time:number,pressure=.5)=>{
    if(!canPaint||!stroke.current||error||exporting)return;
    const snapshot=current.current;
    const eventSeed=(snapshot.seed^Math.imul(++voiceNumber.current,0x9e3779b1)^BIRDS.indexOf(selectedBird)*107)>>>0;
    void stroke.current.begin(selectedBird,p,time,pressure,eventSeed,snapshot.brush,snapshot.marks.length,snapshot.opacity);
    setContact(true);
  };
  const prepare=(bird:Bird)=>{
    const sounds=bank.current;
    void sounds?.prepare(bird.id).then(()=>{if(bank.current===sounds)setReady(list=>list.includes(bird.id)?list:[...list,bird.id]);}).catch(()=>{if(bank.current===sounds)setNotice('Le chant sera rechargé au prochain coup de pinceau.');});
  };
  const choose=(bird:Bird)=>{if(!canPaint)return;stop();setSelected(bird.id);setBrushMenu(bird.id);prepare(bird);};
  const pickBird=(bird:Bird)=>{
    if(stage!=='choose')return;
    if(!padIds.includes(bird.id)&&padIds.length>=3)return;
    setPadIds(list=>list.includes(bird.id)?list.filter(id=>id!==bird.id):[...list,bird.id]);prepare(bird);
  };
  const startPainting=()=>{if(padIds.length!==3)return;setSelected(padIds[0]);setStage('paint');};
  const finalize=()=>{
    if(!canPaint||!marks.length||!engine.current||error)return;
    stop();setBrushMenu(null);setPoint(null);setDryingStart(engine.current.status.ticks);setStage('drying');engine.current.resume();
  };
  const continuePainting=()=>{setPoetry(null);setStage('paint');};
  useEffect(()=>{
    if(stage!=='drying'||status.phase!=='complete'||error||!engine.current)return;
    try{
      const words=makeArtworkPoetry(marks,seed,readArtwork(engine.current.capturePreview(),palette.paper));
      if(!words)throw new Error('Déposez un peu plus de pigment avant de finaliser.');
      setPoetry(words);setStage('finished');
    }catch(cause){setNotice(cause instanceof Error?cause.message:'Le poème n’a pas pu être composé.');setStage('paint');}
  },[stage,status.phase,error,marks,seed,palette.paper]);
  useEffect(()=>{
    if(stage!=='finished'&&stage!=='paint')return;
    const frame=requestAnimationFrame(()=>artwork.current?.scrollIntoView?.({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'}));
    return()=>cancelAnimationFrame(frame);
  },[stage]);
  useEffect(()=>{
    const keys=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){if(brushMenu)studio.current?.querySelector<HTMLButtonElement>(`[aria-controls="brush-settings-${brushMenu}"]`)?.focus();setBrushMenu(null);setCanvasOnly(false);stop();if(screen.viewing)screen.exit();return;}
      if(event.target instanceof HTMLInputElement||event.target instanceof HTMLSelectElement||event.target instanceof HTMLButtonElement||event.repeat)return;
      if(event.key.toLowerCase()==='f'&&stage!=='choose')screen.toggle();
      if(canPaint&&/^[1-3]$/.test(event.key)){event.preventDefault();choose(pads[Number(event.key)-1]);}
    };
    const visibility=()=>{if(document.hidden)stop();};
    document.addEventListener('keydown',keys);document.addEventListener('visibilitychange',visibility);window.addEventListener('blur',stop);
    return()=>{document.removeEventListener('keydown',keys);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('blur',stop);};
  });
  const position=(event:React.PointerEvent<HTMLDivElement>)=>{
    const rect=event.currentTarget.getBoundingClientRect(),down=pointer.current===event.pointerId;
    if(!canPaint||pointer.current!==null&&!down)return;
    const events=event.nativeEvent.getCoalescedEvents?.();
    for(const sample of events?.length?events:[event.nativeEvent]){
      const p=paperPoint(sample.clientX,sample.clientY,rect);
      if(!p){setPoint(null);if(down)stroke.current?.breakPath();continue;}
      if(cursorPrevious.current)setFeatherTilt(Math.max(-24,Math.min(24,(p.x-cursorPrevious.current.x)*rect.width*1.8)));
      cursorPrevious.current=p;setPoint(p);
      if(down)stroke.current?.move(p,sample.timeStamp,event.pointerType==='pen'?sample.pressure:.5);
    }
  };
  const down=(event:React.PointerEvent<HTMLDivElement>)=>{
    if(!canPaint||error||exporting||event.button!==0||event.isPrimary===false||pointer.current!==null)return;
    const p=paperPoint(event.clientX,event.clientY,event.currentTarget.getBoundingClientRect());if(!p)return;
    setBrushMenu(null);event.preventDefault();event.currentTarget.focus({preventScroll:true});event.currentTarget.setPointerCapture(event.pointerId);
    pointer.current=event.pointerId;setPoint(p);begin(p,event.timeStamp,event.pointerType==='pen'?event.pressure:.5);
  };
  const release=(event:React.PointerEvent<HTMLDivElement>)=>{if(pointer.current===event.pointerId)stop();};
  const keyboardPaper=(event:React.KeyboardEvent<HTMLDivElement>)=>{
    if(!canPaint||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter',' '].includes(event.key)||error||exporting)return;
    event.preventDefault();const old=point??{x:.5,y:.5};
    const p={x:Math.min(.97,Math.max(.03,old.x+(event.key==='ArrowLeft'?-.016:event.key==='ArrowRight'?.016:0))),y:Math.min(.97,Math.max(.03,old.y+(event.key==='ArrowUp'?-.016:event.key==='ArrowDown'?.016:0)))};
    setPoint(p);
    if(event.key==='Enter'||event.key===' '){if(!keyHeld.current&&!event.repeat){keyHeld.current=true;begin(p,performance.now());}}
    else if(keyHeld.current)stroke.current?.move(p,performance.now(),.5);
  };
  const exportArt=async()=>{
    if(!engine.current||!poetry||stage!=='finished'||exporting)return;stop();setExporting(true);
    try{
      const png=await exportSignatureCard(await engine.current.exportPNG(),poetry.verses,palette.paper,seed,name,poetry.title);
      const url=URL.createObjectURL(png),link=document.createElement('a');link.href=url;link.download=`les-3-plumes-haikuarelle-${seed}.png`;link.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
      setNotice('Votre œuvre, son titre et son haïku sont exportés.');
    }catch(error){setNotice(error instanceof Error?error.message:'L’export a échoué.');}finally{setExporting(false);}
  };
  const dryingEnd=(engine.current?.composition.duration??1)*30;
  const dryingProgress=Math.min(1,Math.max(0,(status.ticks-dryingStart)/Math.max(1,dryingEnd-dryingStart)));
  const liveText=stage==='drying'?'L’eau se retire. Le titre et le haïku vont apparaître…':stage==='finished'?'Votre œuvre a trouvé ses mots.':loading?'La plume prépare son chant…':playing?`${BIRDS.find(b=>b.id===playing)?.name} · le chant peint votre geste`:status.paused&&status.hasPigment&&status.phase!=='complete'?'Le séchage est suspendu.':status.phase==='complete'&&marks.length?'L’œuvre est sèche. Un nouveau geste la réveille.':marks.length?'Les pigments se posent. Les auréoles se révèlent.':'Choisissez une plume, puis effleurez la feuille.';
  const secondaryActions=stage!=='choose'?<details className="atelier-more"><summary aria-label="Autres actions">⋯</summary><div className="bird-actions"><button onClick={screen.toggle} aria-label="Grand écran HD"><Glyph name="screen"/>Grand écran</button><button onClick={fresh} disabled={exporting}><Glyph name="refresh"/>Nouvelle œuvre</button>{stage==='paint'&&!marks.length&&<button onClick={()=>{stop();setStage('choose');}}>Changer mes plumes</button>}<button onClick={erase} disabled={exporting}><Glyph name="erase"/>Effacer tout</button><a href="/birds/credits.html" target="_blank" rel="noreferrer">Chants & crédits ↗</a><a href="https://github.com/pierkiroule/Haikuarelle" target="_blank" rel="noreferrer">Code & installation ↗</a><a href="/PIGMENT-DRIFT-LICENSE.txt" target="_blank" rel="noreferrer">Licence du moteur ↗</a></div></details>:null;
  return <div ref={studio} className={`bird-studio water-studio direct-studio flow-${stage} ${canvasOnly?'canvas-only':''} ${contact?'is-painting':''} ${screen.viewing?'bird-viewing':''} ${screen.hud?'show-hud':''}`} onPointerMove={screen.viewing?screen.reveal:undefined} onPointerDown={screen.viewing?screen.reveal:undefined} style={{'--paper':palette.paper,'--art-ratio':sheet.width/sheet.height,'--sample-color':selectedBird.color} as React.CSSProperties}>
    <header className="bird-header">
      <a className="bird-wordmark feather-wordmark" href="/" aria-label={APP_NAME}><span className="brand-feathers"><FeatherGlyph/><FeatherGlyph/><FeatherGlyph/></span><span className="brand-copy"><span>Les 3 plumes</span><small>de l’Haikuarelle</small></span></a><span className="bird-edition">DU CHANT À LA PLUME · DE LA PLUME AU POÈME</span>
      <div className="bird-view-controls">{stage!=='choose'&&<button aria-pressed={canvasOnly} onClick={()=>{stop();setBrushMenu(null);setCanvasOnly(v=>!v);}}>Toile seule</button>}{stage==='choose'&&<select aria-label="Format de l’œuvre" value={settings.format} disabled={stage!=='choose'||busy} onChange={e=>setSettings(s=>({...s,format:e.target.value as ArtworkFormat}))}><option value="portrait">Portrait</option><option value="landscape">Paysage HD</option></select>}{secondaryActions}</div>
    </header>
    <nav className="bird-flow" aria-label="Les trois temps de votre aquarelle"><span aria-current={stage==='choose'?'step':undefined}>01 · Cueillir trois plumes</span><span aria-current={stage==='paint'?'step':undefined}>02 · Laisser une trace</span><span aria-current={stage==='drying'||stage==='finished'?'step':undefined}>03 · Révéler les mots</span></nav>
    {stage==='choose'&&<section className="bird-selection" aria-labelledby="trio-title"><p className="bird-eyebrow">HUIT PLUMES · TROIS COMPLICES</p><h1 id="trio-title">Trois plumes,<br/><em>une aquarelle.</em></h1><p>Chaque plume garde la couleur et le chant d’un oiseau. Cueillez-en trois, puis laissez votre geste écrire sur l’eau.</p><div className="bird-selection-grid">{BIRDS.map(bird=>{
      const order=padIds.indexOf(bird.id),chosen=order>=0;
      return <button key={bird.id} className={`trio-bird ${chosen?'chosen':''}`} aria-pressed={chosen} aria-label={`Choisir la plume ${bird.name}`} disabled={!chosen&&padIds.length===3} onClick={()=>pickBird(bird)} style={{'--bird-color':bird.color} as React.CSSProperties}><span className="trio-order">{chosen?String(order+1).padStart(2,'0'):'+'}</span><FeatherGlyph bird={bird}/><strong>{bird.name}</strong><small>{bird.gesture}</small><span className="pad-pigments" aria-hidden="true">{[...(bird.plumage??[bird.slot,...(bird.id==='rougegorge'?[6]:[])]).map(slot=>PLUMAGE_PIGMENTS[slot]),palette.paper].map((c,i)=><i key={i} style={{background:c}}/>)}</span></button>;
    })}</div><div className="trio-start"><span role="status" aria-live="polite">{padIds.length} / 3 plumes choisies</span><button disabled={padIds.length!==3} onClick={startPainting}>À vous de peindre <span aria-hidden="true">↗</span></button></div></section>}
    <main className="bird-workbench">
      <section ref={artwork} className="bird-stage" aria-label="Votre œuvre d’aquarelle abstraite">
        <div className="bird-sheet-meta"><span>{stage==='finished'?'VOTRE HAÏKUARELLE':stage==='drying'?'LE PAPIER GARDE LE CHANT':contact?'LE CHANT DEVIENT MATIÈRE':'VOS TROIS PLUMES · VOTRE GESTE'}</span><span>{String(marks.length).padStart(2,'0')} GESTES</span></div>
        {poetry&&<ArtworkTitle poetry={poetry}/>}
        <div ref={paper} className="bird-paper stable-sheet tool-paint" tabIndex={canPaint?0:-1} role="button" aria-disabled={!canPaint} aria-label="Papier : maintenez et glissez pour peindre. Au clavier, maintenez espace ou Entrée et déplacez la plume avec les flèches." onPointerDown={down} onPointerMove={position} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release} onPointerLeave={()=>{if(pointer.current===null){setPoint(null);cursorPrevious.current=null;setFeatherTilt(0);}}} onKeyDown={keyboardPaper} onKeyUp={event=>{if((event.key===' '||event.key==='Enter')&&keyHeld.current){event.preventDefault();stop();}}} onBlur={()=>{if(keyHeld.current)stop();}} onContextMenu={event=>event.preventDefault()}>
          <canvas ref={canvas} aria-label="Aquarelle et traces de plumes sur papier coton"/>
          {!marks.length&&!contact&&!error&&<div className="bird-paper-invitation"><FeatherGlyph bird={selectedBird} className="invitation-feather"/><span>Une plume, un souffle, une trace.</span><small>Posez la plume. Le chant devient couleur.</small></div>}
          {point&&canPaint&&!error&&<div className={`brush-cursor feather-cursor ${contact?'resonating':''}`} aria-hidden="true" style={{left:`${point.x*100}%`,top:`${point.y*100}%`,'--feather-tilt':`${featherTilt}deg`} as React.CSSProperties}><span className="feather-hotspot"/><FeatherGlyph bird={selectedBird}/></div>}
          {error&&<div className="bird-gpu-error" role="alert"><span>•°</span><p>Le papier attend votre GPU.</p><small>{error.includes('WebGL')?'Activez l’accélération graphique dans un navigateur compatible WebGL2.':error}</small><button onClick={event=>{event.stopPropagation();stop();setMarks([]);setPoetry(null);setStage(padIds.length===3?'paint':'choose');setPoint(null);setStatus(idle);setError('');setRetry(r=>r+1);}}>Réessayer</button></div>}
        </div>
        {poetry&&<ArtworkPoem poetry={poetry} dedication={name}/>}
        <div className="bird-art-caption"><span>{stage==='finished'?'Trois plumes. Votre empreinte.':stage==='drying'?'Les contours se déposent. Les mots viendront ensuite.':marks.length?'Levez la plume. Laissez l’eau poursuivre son chemin.':'Un geste lent ouvre le lavis. Un geste vif disperse les pigments.'}</span><span className="signature-id">N° {seed.toString(16).toUpperCase().padStart(8,'0')}</span></div>
      </section>
      <aside className="bird-instrument">
        <div className="bird-pad-board">
          {stage!=='finished'&&<>
          <div className="bird-pads" role="group" aria-label="Vos trois plumes">{pads.map((bird,index)=><div className="bird-pad-slot" key={index}>
            <button className={`bird-pad ${selected===bird.id?'is-selected':''} ${playing===bird.id?'is-playing':''} ${loading===bird.id?'is-loading':''}`} disabled={exporting||!canPaint} onClick={()=>choose(bird)} aria-label={`Choisir la plume ${bird.name} — ${bird.gesture}`} aria-pressed={selected===bird.id} aria-expanded={brushMenu===bird.id} aria-controls={`brush-settings-${bird.id}`} title={`${bird.name} · ${bird.gesture} · touche ${index+1}`} style={{'--bird-color':bird.color} as React.CSSProperties}>
              <span className="pad-number">{index+1}</span><FeatherGlyph bird={bird}/><strong>{bird.name}</strong><small>{loading===bird.id?'Préparation…':playing===bird.id?'Le chant peint…':bird.gesture}</small>
              <span className="pad-pigments" aria-hidden="true">{[...(bird.plumage??[bird.slot,...(bird.id==='rougegorge'?[6]:[])]).map(slot=>PLUMAGE_PIGMENTS[slot]),palette.paper].map((c,i)=><i key={i} style={{background:c}}/>)}</span><span className={`pad-ready ${ready.includes(bird.id)?'ready':''}`}/>
            </button>
            {brushMenu===bird.id&&canPaint&&<section className="brush-context" id={`brush-settings-${bird.id}`} aria-label={`Réglages de la plume ${bird.name}`}>
              <div className="brush-context-heading"><strong>{bird.name}</strong><button aria-label="Fermer les réglages de la plume" onClick={()=>{setBrushMenu(null);studio.current?.querySelector<HTMLButtonElement>(`[aria-controls="brush-settings-${bird.id}"]`)?.focus();}}><Glyph name="close"/></button></div>
              <label><span>Taille <output>{Math.round(brush*100)} %</output></span><input aria-label={`Taille de la plume ${bird.name}`} type="range" min="0" max="100" value={brush*100} onChange={e=>setBrush(Number(e.target.value)/100)}/></label>
              <label><span>Opacité <output>{Math.round(opacity*100)} %</output></span><input aria-label={`Opacité de la plume ${bird.name}`} type="range" min="0" max="100" value={opacity*100} onChange={e=>setOpacity(Number(e.target.value)/100)}/></label>
              {bird.id==='pie'&&<small>Gouttelettes noires · rythme synthétique</small>}
            </section>}
          </div>)}</div>
          <div className="bird-live" role="status" aria-live="polite"><span className={playing?'bird-live-dot active':'bird-live-dot'}/><span>{liveText}</span>{busy&&<button onClick={stop} aria-label="Lever la plume et arrêter le chant"><Glyph name="stop"/></button>}{canPaint&&!busy&&status.hasPigment&&status.phase!=='complete'&&<button className="drying-pause" onClick={()=>status.paused?engine.current?.resume():engine.current?.pause()} aria-label={status.paused?'Reprendre le séchage':'Mettre le séchage en pause'}>{status.paused?'Reprendre':'Pause'}</button>}</div>
          </>}
          {stage==='paint'&&<button className="finalize-art" onClick={finalize} disabled={!marks.length||!!error||exporting}>Finaliser mon œuvre <span aria-hidden="true">✧</span></button>}
          {stage==='drying'&&<div className="artwork-drying" role="status"><progress aria-label="Séchage de l’œuvre" max="1" value={dryingProgress}/><span>Laisser l’eau déposer ses derniers détails…</span><button onClick={continuePainting}>Reprendre la plume</button></div>}
          {stage==='finished'&&<div className="artwork-finished-actions"><span className="poem-mark">•°</span><p>Un titre. Trois lignes.<br/>Votre empreinte du vivant.</p><button className="finalize-art" onClick={()=>void exportArt()} disabled={exporting||!!error}><Glyph name="download"/>{exporting?'Export…':'Emporter mon œuvre · PNG'}</button><button className="continue-art" onClick={continuePainting} disabled={exporting}>Reprendre la plume</button></div>}
        </div>
        {stage==='finished'&&<label className="poem-dedication final-dedication"><span>Une dédicace</span><input aria-label="Prénom pour la dédicace du haïku" placeholder="Un prénom, si vous le souhaitez" maxLength={32} value={name} onChange={e=>setName(e.target.value)}/></label>}

      </aside>

    </main>
    <footer className="bird-footer"><span>Trois plumes pour peindre. Quelques mots pour garder la trace.</span><a href="/birds/credits.html" target="_blank" rel="noreferrer">Chants & crédits ↗</a><a href="https://github.com/pierkiroule/Haikuarelle" target="_blank" rel="noreferrer">Code & installation ↗</a><a href="/PIGMENT-DRIFT-LICENSE.txt" target="_blank" rel="noreferrer">Pigment Drift · MIT</a></footer>
    {canvasOnly&&<button className="canvas-restore" onClick={()=>setCanvasOnly(false)}>Afficher les commandes <span aria-hidden="true">↗</span></button>}
    {screen.viewing&&<button className="bird-exit" aria-label="Quitter le plein écran" onClick={screen.exit} onFocus={screen.reveal} onPointerMove={screen.reveal}><Glyph name="close"/>Quitter</button>}
    {screen.viewing&&playing&&<button className="bird-finish-screen" onClick={stop} aria-label="Lever la plume et arrêter le chant"><Glyph name="stop"/>Lever la plume</button>}
    {screen.viewing&&canPaint&&!busy&&marks.length>0&&<button className="bird-finalize-screen" onClick={finalize}>Finaliser mon œuvre ✧</button>}
    {notice&&<div className="toast" role="status">{notice}</div>}
  </div>;
}
export default function App(){const params=new URLSearchParams(location.search);return params.has('validation')?<Suspense fallback={<p>Ouverture…</p>}><Validation/></Suspense>:params.has('mp3')?<Suspense fallback={<p>Ouverture…</p>}><Legacy/></Suspense>:<BirdStudio/>;}
