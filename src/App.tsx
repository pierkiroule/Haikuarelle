import {BIRD_COLOURS} from './birds/colourPalettes';
import {lazy,Suspense,useEffect,useRef,useState} from 'react';
import {HaikuarelleEngine} from './engine/WatercolorEngine';
import {getPalette,PLUMAGE_PIGMENTS} from './engine/palettes';
import {sheetFor,type ArtworkFormat} from './engine/layout';
import type {EngineSettings,EngineStatus,Point} from './engine/types';
import {BIRD_BRUSHES as BIRDS,type Bird,type BirdId} from './birds/catalog';
import {paperPoint} from './birds/ResonantBrush';
import {BirdAudioBank} from './birds/BirdAudioBank';
import {WaterSong} from './birds/WaterSong';
import {SoundDeposit} from './birds/SoundDeposit';
import type {BirdMark} from './birds/haiku';
import {makeResonantHaiku,readArtwork,type ArtworkPoetry} from './birds/artworkPoetry';
import {HaikuBlock} from './birds/HaikuBlock';
import type {PoemPlacement} from './birds/poemPlacement';
import './haiku-layout.css';
import {deliverArtwork} from './birds/share';
import {exportResonantArtwork} from './birds/export';
import {useLargeScreen} from './useLargeScreen';
import './birds.css';
import './birds/paperSurface.css';
import './atelier.css';
import './plumes.css';
import {RITUAL,RitualProgress,WaterDrop,SilenceSun,type RitualStage} from './birds/Ritual';
import './ritual.css';
import {APP_NAME} from './brand';
import {FeatherDrift} from './birds/FeatherDrift';
import {DryingFeathers} from './birds/DryingFeathers';
import './birds/drying.css';
import './aquarelle.css';
import './creation.css';
import {CreationPalette} from './birds/CreationPalette';
import {FeatherEncounter} from './birds/FeatherEncounter';
import {FeatherGlyph} from './birds/FeatherGlyph';
import './immersive.css';
const Validation=lazy(()=>import('./Validation'));
const Legacy=lazy(()=>import('./LegacyStudio'));
const randomSeed=()=>crypto.getRandomValues(new Uint32Array(1))[0];
const defaults:EngineSettings={palette:'plumages',granulation:.84,wetness:.57,complexity:.52,ink:.20,resonance:.96,sharpness:.80,dryingThreshold:.42,format:'a4'};
const idle:EngineStatus={seed:0,progress:0,phase:'idle',paused:true,fps:0,ticks:0};
function Glyph({name}:{name:'screen'|'close'|'download'|'refresh'|'erase'|'stop'|'sound'}){
  const paths={screen:'M8 4H4v4m12-4h4v4M4 16v4h4m12-4v4h-4',close:'m6 6 12 12M18 6 6 18',download:'M12 3v12m-4-4 4 4 4-4M5 16v5h14v-5',refresh:'M4 10a8 8 0 1 1 2 8M4 4v6h6',erase:'m15 3 6 6-11 11H6l-4-4L15 3zm-9 9 6 6m-2 2h12',stop:'M7 7h10v10H7z',sound:'m11 5-5 4H3v6h3l5 4zM15 8c3 2 3 6 0 8m3-11c5 4 5 10 0 14'};
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]}/></svg>;
}

export function BirdStudio(){
  const [settings,setSettings]=useState<EngineSettings>(defaults),[seed,setSeed]=useState(randomSeed);
  const [featherTilt,setFeatherTilt]=useState(0);
  const [breathAngle,setBreathAngle]=useState(0);
  const cursorPrevious=useRef<Point|null>(null);
  const [point,setPoint]=useState<Point|null>(null),[contact,setContact]=useState(false);
  const [brushPrefs,setBrushPrefs]=useState<Partial<Record<BirdId,{size:number;opacity:number}>>>({});
  const [colour,setColour]=useState<number|null>(null);
  const [tool,setTool]=useState<'water'|'plume'|'breath'>('water');
  const [placement,setPlacement]=useState<PoemPlacement>({x:.07,y:.78,size:.032});
  const [poemPlaced,setPoemPlaced]=useState(false);
  const [selected,setSelected]=useState<BirdId>('rougegorge');
  const brush=brushPrefs[selected]?.size??.62,opacity=brushPrefs[selected]?.opacity??1;
  const setBrush=(size:number)=>setBrushPrefs(p=>({...p,[selected]:{size,opacity}}));
  const setOpacity=(value:number)=>setBrushPrefs(p=>({...p,[selected]:{size:brush,opacity:value}}));
  const [previewing,setPreviewing]=useState<BirdId|null>(null);
  const previewToken=useRef(0);
  const [padIds,setPadIds]=useState<BirdId[]>([]);
  const [stage,setStage]=useState<RitualStage>('choose');
  const [waterSize,setWaterSize]=useState(.62),[waterAmount,setWaterAmount]=useState(1);
  const [waterPlaced,setWaterPlaced]=useState(false);
  const [poetry,setPoetry]=useState<ArtworkPoetry|null>(null),[dryingStart,setDryingStart]=useState(0);
  const [marks,setMarks]=useState<BirdMark[]>([]),[ready,setReady]=useState<BirdId[]>([]);
  const [playing,setPlaying]=useState<BirdId|null>(null),[loading,setLoading]=useState<BirdId|null>(null);
  const [status,setStatus]=useState(idle),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const [retry,setRetry]=useState(0),[exporting,setExporting]=useState(false);
  const [canvasOnly,setCanvasOnly]=useState(false),[immersive,setImmersive]=useState(false);
  const artwork=useRef<HTMLElement>(null);
  const studio=useRef<HTMLDivElement>(null),canvas=useRef<HTMLCanvasElement>(null),paper=useRef<HTMLDivElement>(null);
  const engine=useRef<HaikuarelleEngine|null>(null),bank=useRef<BirdAudioBank|null>(null),stroke=useRef<SoundDeposit|null>(null);
  const waterSong=useRef<WaterSong|null>(null),waterGesture=useRef(false);
  const pointer=useRef<number|null>(null),keyHeld=useRef(false),voiceNumber=useRef(0);
  const current=useRef({settings,seed,brush,opacity,marks,selected});current.current={settings,seed,brush,opacity,marks,selected};
  const screen=useLargeScreen(studio);
  const canCreate=stage==='paint',canPaint=canCreate&&tool==='plume',canWet=canCreate&&tool==='water',canBlow=canCreate&&tool==='breath',canDraw=canCreate;
  const immersiveActive=(immersive||screen.viewing)&&!canvasOnly&&['paint','drying'].includes(stage);
  useEffect(()=>{if(!immersiveActive)return;const before=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=before;};},[immersiveActive]);
  const ritual=RITUAL.find(step=>step.stage===stage)!;
  const palette=getPalette(settings.palette),sheet=sheetFor(settings.format),busy=!!playing||!!loading;
  const selectedBird=BIRDS.find(b=>b.id===selected)!;
  const paintingBird=colour===null?selectedBird:{...selectedBird,color:BIRD_COLOURS[selected]?.[colour]?.hex??selectedBird.color,pigmentSlot:PLUMAGE_PIGMENTS.length+colour};
  const pads=padIds.map(id=>BIRDS.find(b=>b.id===id)!);
  useEffect(()=>{
    let live=true;const sounds=new BirdAudioBank();bank.current=sounds;setReady([]);
    void sounds.preload(id=>{if(live)setReady(list=>list.includes(id)?list:[...list,id]);});
    try{
      const painter=new HaikuarelleEngine(canvas.current!,current.current.settings,s=>{if(live)setStatus(s);},message=>{if(live)setError(message);},{requireAudio:true});
      engine.current=painter;painter.beginSignature(current.current.seed);if(padIds[0])painter.setBirdPalette(padIds[0]);
      waterSong.current=new WaterSong(sounds,painter,{
        preparing:()=>{if(live)setLoading(current.current.selected);},
        started:()=>{if(live){setLoading(null);setPlaying(current.current.selected);}},
        stopped:()=>{if(live&&!stroke.current?.busy){setLoading(null);setPlaying(null);if(!waterGesture.current&&!painter.status.hasPigment&&!painter.isBlowing)painter.holdWater();}},
        error:message=>{if(live)setNotice(message);},
      });
      stroke.current=new SoundDeposit(sounds,painter,{
        preparing:bird=>{if(live)setLoading(bird.id);},
        started:bird=>{if(live){setLoading(null);setPlaying(bird.id);}},
        stopped:()=>{if(live){setLoading(null);setPlaying(null);setContact(false);}},
        marked:(bird,origin,eventSeed)=>{if(live)setMarks(list=>[...list.slice(-255),{bird:bird.id,point:{...origin},seed:eventSeed}]);},
        error:message=>{if(live)setNotice(message);},
      });
    }catch(error){setError(error instanceof Error?error.message:'Le moteur ne peut pas démarrer.');}
    return()=>{live=false;previewToken.current++;waterSong.current?.cancel();waterSong.current=null;stroke.current?.cancel();stroke.current=null;sounds.destroy();engine.current?.destroy();engine.current=null;bank.current=null;};
  },[retry]);
  useEffect(()=>{engine.current?.update(settings);},[settings]);
  useEffect(()=>{engine.current?.setBrushSize(brush);engine.current?.setBrushOpacity?.(opacity);},[brush,opacity]);
  useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(''),4500);return()=>clearTimeout(timer);},[notice]);
  const stop=()=>{
    engine.current?.liftBreath(true);
    const id=pointer.current;pointer.current=null;keyHeld.current=false;
    waterGesture.current=false;waterSong.current?.cancel();previewToken.current++;setPreviewing(null);stroke.current?.cancel();if(canWet)engine.current?.holdWater();setContact(false);
    if(id!==null&&paper.current?.hasPointerCapture(id))paper.current.releasePointerCapture(id);
  };
  const resetSheet=(next:number)=>{stop();setWaterPlaced(false);setSeed(next);setMarks([]);setPoetry(null);setPoemPlaced(false);setPoint(null);voiceNumber.current=0;engine.current?.beginSignature(next);setStage(padIds.length===1?'paint':'choose');setTool('water');};
  const fresh=()=>{setImmersive(false);resetSheet(randomSeed());setPadIds([]);setStage('choose');if(screen.viewing)screen.exit();};
  const erase=()=>{resetSheet(current.current.seed);setNotice('Tout est effacé. La feuille est prête.');};
  const wet=(p:Point,pressure=.5)=>{
    if(!canWet||!engine.current||error||exporting)return;
    if(!waterGesture.current){waterGesture.current=true;if(!stroke.current?.busy)void waterSong.current?.begin(selectedBird);}
    engine.current.wetBrush(p,waterSize,pressure,waterAmount);setWaterPlaced(true);setContact(true);
  };
  const begin=(p:Point,time:number,pressure=.5)=>{
    if(canBlow){engine.current?.blow(p,time,brush);setContact(true);return;}
    if(canWet){wet(p,pressure);return;}
    if(!canPaint||!stroke.current||error||exporting)return;
    if(stroke.current.busy){stroke.current.move(p,false);setContact(true);return;}
    const snapshot=current.current;
    const eventSeed=(snapshot.seed^Math.imul(++voiceNumber.current,0x9e3779b1)^BIRDS.indexOf(selectedBird)*107)>>>0;
    void stroke.current.place(paintingBird,p,eventSeed,snapshot.brush,snapshot.marks.length,snapshot.opacity);
    setContact(true);
  };
  const prepare=(bird:Bird)=>{
    const sounds=bank.current;
    void sounds?.prepare(bird.id).then(()=>{if(bank.current===sounds)setReady(list=>list.includes(bird.id)?list:[...list,bird.id]);}).catch(()=>{if(bank.current===sounds)setNotice('Le chant sera rechargé au prochain coup de pinceau.');});
  };
  const finishWater=()=>{
    const id=pointer.current;pointer.current=null;
    if(id!==null&&paper.current?.hasPointerCapture(id))paper.current.releasePointerCapture(id);
    keyHeld.current=false;setContact(false);waterGesture.current=false;waterSong.current?.release();
    engine.current?.holdWater(!engine.current.status.hasPigment&&!stroke.current?.busy&&!waterSong.current?.busy);
  };
  const selectTool=(next:'water'|'plume'|'breath')=>{
    if(!canCreate)return;
    engine.current?.liftBreath(true);
    if(canWet)finishWater();else{pointer.current=null;keyHeld.current=false;setContact(false);}
    setPoint(null);setTool(next);
  };
  const choose=(bird:Bird)=>{if(!canCreate)return;selectTool('plume');setSelected(bird.id);prepare(bird);};
  const pickBird=(bird:Bird)=>{
    if(stage!=='choose')return;
    const token=++previewToken.current,sounds=bank.current;
    sounds?.stop();setPreviewing(null);
    setPadIds([bird.id]);setSelected(bird.id);
    setWaterPlaced(false);engine.current?.beginSignature(seed);engine.current?.setBirdPalette(bird.id);setColour(null);setPoetry(null);setPoemPlaced(false);setTool('water');setStage('paint');setImmersive(true);
    if(!sounds)return;
    void sounds.play(bird.id,()=>{if(token===previewToken.current){setPreviewing(bird.id);setReady(list=>list.includes(bird.id)?list:[...list,bird.id]);}},()=>{if(token===previewToken.current)setPreviewing(null);})
      .catch(()=>{if(token===previewToken.current)setNotice('L’aperçu n’a pas pu démarrer. La plume reste sélectionnée ; tu pourras réécouter son chant lors du dépôt.');});
  };
  const finalize=()=>{
    if(!canCreate||!marks.length||!engine.current||error||busy||stroke.current?.busy)return;
    stop();setPoint(null);setDryingStart(engine.current.status.ticks);setStage('drying');engine.current.setDrying(true);engine.current.resume();
  };
  const continuePainting=()=>{engine.current?.setDrying(false);setPoetry(null);setPoemPlaced(false);setStage('paint');setImmersive(true);};
  useEffect(()=>{
    if(stage!=='drying'||status.phase!=='complete'||error||!engine.current)return;
    setPoetry(null);setPoemPlaced(false);setStage('finished');setImmersive(false);if(screen.viewing)screen.exit();
  },[stage,status.phase,error]);
  const revealHaiku=()=>{
    if(!engine.current||stage!=='finished'||error)return;
    try{
      const reading=readArtwork(engine.current.capturePreview(),palette.paper);
      const words=makeResonantHaiku(marks,seed,reading,selected);
      if(!words)throw new Error('Ajoute quelques pigments avant de révéler le haïku.');
      const width=paper.current?.getBoundingClientRect().width??400;
      setPlacement({x:(reading.centerX??.5)>.5?.07:.40,y:reading.centerY<.5?.78:.10,size:Math.min(.045,Math.max(.026,12/Math.max(200,width)))});
      setPoetry(words);setPoemPlaced(false);
    }catch(cause){setNotice(cause instanceof Error?cause.message:'Le haïku n’a pas pu être révélé.');}
  };
  useEffect(()=>{
    if(stage==='choose')return;
    const frame=requestAnimationFrame(()=>studio.current?.scrollIntoView?.({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'}));
    return()=>cancelAnimationFrame(frame);
  },[stage]);
  useEffect(()=>{
    const keys=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){setImmersive(false);setCanvasOnly(false);stop();if(screen.viewing)screen.exit();return;}
      if(event.target instanceof HTMLInputElement||event.target instanceof HTMLSelectElement||event.target instanceof HTMLButtonElement||event.repeat)return;
      if(event.key.toLowerCase()==='f'&&stage!=='choose')screen.toggle();
      if(canCreate&&event.key==='1'&&pads[0]){event.preventDefault();choose(pads[0]);}
    };
    const visibility=()=>{if(document.hidden)stop();};
    document.addEventListener('keydown',keys);document.addEventListener('visibilitychange',visibility);window.addEventListener('blur',stop);
    return()=>{document.removeEventListener('keydown',keys);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('blur',stop);};
  });
  const position=(event:React.PointerEvent<HTMLDivElement>)=>{
    const rect=event.currentTarget.getBoundingClientRect(),down=pointer.current===event.pointerId;
    if(!canDraw||pointer.current!==null&&!down)return;
    const events=event.nativeEvent.getCoalescedEvents?.();
    for(const sample of events?.length?events:[event.nativeEvent]){
      const p=paperPoint(sample.clientX,sample.clientY,rect);
      if(!p){setPoint(null);if(down){if(canWet)engine.current?.liftWaterBrush();if(canBlow)engine.current?.liftBreath();}continue;}
      if(canBlow&&cursorPrevious.current)setBreathAngle(Math.atan2((p.y-cursorPrevious.current.y)*rect.height,(p.x-cursorPrevious.current.x)*rect.width)*180/Math.PI);
      if(cursorPrevious.current)setFeatherTilt(Math.max(-24,Math.min(24,(p.x-cursorPrevious.current.x)*rect.width*1.8)));
      cursorPrevious.current=p;setPoint(p);
      if(down){if(canBlow){engine.current?.blow(p,sample.timeStamp,brush);setContact(true);}else if(canWet)wet(p,event.pointerType==='pen'?sample.pressure:.5);else if(stroke.current?.busy)stroke.current.move(p);else begin(p,event.timeStamp);}
    }
  };
  const down=(event:React.PointerEvent<HTMLDivElement>)=>{
    if(!canDraw||error||exporting||event.button!==0||event.isPrimary===false||pointer.current!==null)return;
    const p=paperPoint(event.clientX,event.clientY,event.currentTarget.getBoundingClientRect());if(!p)return;
    event.preventDefault();event.currentTarget.focus({preventScroll:true});event.currentTarget.setPointerCapture(event.pointerId);
    pointer.current=event.pointerId;setPoint(p);begin(p,event.timeStamp,event.pointerType==='pen'?event.pressure:.5);
  };
  const release=(event:React.PointerEvent<HTMLDivElement>)=>{if(pointer.current!==event.pointerId)return;if(canWet){finishWater();if(paper.current?.hasPointerCapture(event.pointerId))paper.current.releasePointerCapture(event.pointerId);return;}engine.current?.liftBreath(event.type==='pointercancel');pointer.current=null;setContact(false);if(paper.current?.hasPointerCapture(event.pointerId))paper.current.releasePointerCapture(event.pointerId);};
  const keyboardPaper=(event:React.KeyboardEvent<HTMLDivElement>)=>{
    if(!canDraw||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter',' '].includes(event.key)||error||exporting)return;
    event.preventDefault();const old=point??{x:.5,y:.5};
    const p={x:Math.min(.97,Math.max(.03,old.x+(event.key==='ArrowLeft'?-.016:event.key==='ArrowRight'?.016:0))),y:Math.min(.97,Math.max(.03,old.y+(event.key==='ArrowUp'?-.016:event.key==='ArrowDown'?.016:0)))};
    setPoint(p);
    if(event.key==='Enter'||event.key===' '){if(!keyHeld.current&&!event.repeat){keyHeld.current=true;begin(p,performance.now());}}
    else if(keyHeld.current){if(canBlow)engine.current?.blow(p,performance.now(),brush);else if(canWet)wet(p);else if(stroke.current?.busy)stroke.current.move(p);else begin(p,performance.now());}
  };
  const exportArt=async(mode:'download'|'share'='download')=>{
    if(!engine.current||!poetry||!poemPlaced||stage!=='finished'||exporting)return;stop();setExporting(true);
    try{
      const png=await exportResonantArtwork(await engine.current.exportPNG(),poetry.verses,placement);
      const filename=`haikuarelle-${seed}.png`;
      const result=await deliverArtwork(png,filename,APP_NAME,mode);
      if(result==='shared')setNotice('L’œuvre et ses trois vers ont pris leur envol.');
      if(result==='saved')setNotice(mode==='share'?'L’œuvre est téléchargée : tu peux maintenant la partager.':'L’image et ses trois vers sont téléchargés, avec la signature •°○.');
    }catch(error){setNotice(error instanceof Error?error.message:'L’export a échoué.');}finally{setExporting(false);}
  };
  const dryingEnd=(engine.current?.composition.duration??1)*30;
  const dryingProgress=Math.min(1,Math.max(0,(status.ticks-dryingStart)/Math.max(1,dryingEnd-dryingStart)));
  const liveText=canBlow?'Glisse pour déplacer l’eau et ses pigments vers l’extérieur.':canWet?(playing?'Le chant plonge dans l’eau…':loading?'L’eau accueille le chant…':waterPlaced?(marks.length?'L’eau réveille les pigments. Le chant peut revenir.':'L’eau accueille le chant. Tu peux encore l’étendre.'):'Glisse sur le papier pour déposer l’eau claire.') :stage==='drying'?'L’eau se retire. Les contours se précisent…':stage==='finished'?'Ton œuvre a trouvé ses mots.':loading?'La plume prépare son chant…':playing?`${BIRDS.find(b=>b.id===playing)?.name} · le chant anime la matière`:status.paused&&status.hasPigment&&status.phase!=='complete'?'La diffusion est suspendue.':status.phase==='complete'&&marks.length?'L’eau reste disponible pour les prochains chants.':marks.length?'Les pigments se diffusent doucement. L’eau reste présente.':'Dépose un chant sur le papier sec ou dans l’eau.';
  const secondaryActions=stage!=='choose'?<details className="atelier-more" onClick={event=>{if(event.target instanceof Element&&event.target.closest('button'))event.currentTarget.open=false;}}><summary aria-label="Autres actions">⋯</summary><div className="bird-actions"><button onClick={screen.toggle} aria-label="Grand écran HD"><Glyph name="screen"/>Grand écran</button>{busy&&<button onClick={stop}><Glyph name="stop"/>Interrompre le chant</button>}<button onClick={fresh} disabled={exporting||busy}><Glyph name="refresh"/>Nouvelle œuvre</button>{stage==='paint'&&!marks.length&&!busy&&<button onClick={()=>{stop();setStage('choose');}}>Retrouver les plumes</button>}<button onClick={erase} disabled={exporting||busy}><Glyph name="erase"/>Effacer tout</button><a href="/birds/credits.html" target="_blank" rel="noreferrer">Chants & crédits ↗</a><a href="https://github.com/pierkiroule/Haikuarelle" target="_blank" rel="noreferrer">Code & installation ↗</a><a href="/PIGMENT-DRIFT-LICENSE.txt" target="_blank" rel="noreferrer">Licence du moteur ↗</a></div></details>:null;
  return <div ref={studio} className={`bird-studio water-studio direct-studio flow-${stage} ${immersiveActive?'is-immersive':''} ${canvasOnly?'canvas-only':''} ${contact?'is-painting':''} ${screen.viewing?'bird-viewing':''} ${screen.hud?'show-hud':''}`} onPointerMove={screen.viewing?screen.reveal:undefined} onPointerDown={screen.viewing?screen.reveal:undefined} style={{'--paper':palette.paper,'--art-ratio':sheet.width/sheet.height,'--sample-color':paintingBird.color} as React.CSSProperties}>
    <FeatherDrift/>
    <header className="bird-header">
      <a className="bird-wordmark feather-wordmark" href="/" aria-label={APP_NAME}><img className="watercolor-brand" src="/brand/plume-aquarelle.webp" alt="" width="48" height="48" decoding="async"/><span className="brand-copy"><span>Plume</span><small>d’Haïkuarelle</small></span></a><span className="bird-edition">UN RITUEL D’EAU, DE CHANTS ET DE SILENCE</span>
      <div className="bird-view-controls">{['paint','drying'].includes(stage)&&!immersiveActive&&<button onClick={()=>{setCanvasOnly(false);setImmersive(true);}}>Toile immersive</button>}{stage!=='choose'&&<button aria-pressed={canvasOnly} onClick={()=>{if(canWet)stop();setCanvasOnly(v=>!v);}}>Toile seule</button>}{stage==='choose'&&<select aria-label="Format de l’œuvre" value={settings.format} disabled={stage!=='choose'||busy} onChange={e=>setSettings(s=>({...s,format:e.target.value as ArtworkFormat}))}><option value="a4">A4 · 21 × 29,7 cm</option><option value="portrait">Portrait allongé</option><option value="landscape">Paysage HD</option></select>}{!immersiveActive&&secondaryActions}</div>
    </header>
    {immersiveActive&&<div className="immersive-controls" role="group" aria-label="Commandes de la toile immersive"><button className="immersive-exit" aria-label="Quitter le mode immersif" title="Quitter le mode immersif · Échap" onClick={()=>{setImmersive(false);if(screen.viewing)screen.exit();}}><Glyph name="close"/></button>{secondaryActions}</div>}
    {immersiveActive&&<span className="sr-only" role="status" aria-live="polite">{liveText}</span>}
    <RitualProgress stage={stage}/>
    {stage==='choose'&&<section className="bird-selection" aria-labelledby="trio-title"><p className="bird-eyebrow">01 · LA RENCONTRE</p><h1 id="trio-title">Une plume sonore<br/><em>qui t’attire.</em></h1><p>Choisis parmi les plumes virevoltantes. Un geste, une rencontre. Son plumage devient ta palette. Le haïku naîtra de ta peinture.</p><FeatherEncounter onChoose={pickBird}/><span className="sr-only" role="status">{previewing?`Aperçu du chant : ${BIRDS.find(b=>b.id===previewing)?.name}`:''}</span></section>}
    {stage!=='choose'&&<section className="ritual-heading" aria-labelledby="ritual-title"><h1 id="ritual-title">{ritual.title}</h1><details className="ritual-help"><summary aria-label="Comment vivre cette étape ?">?</summary><div>{ritual.hint}</div></details></section>}
    <main className="bird-workbench">
      <section ref={artwork} className="bird-stage" aria-label="Votre œuvre d’aquarelle abstraite">
        <div className="bird-sheet-meta"><span>{stage==='finished'?'VOTRE HAÏKUARELLE':stage==='drying'?'LE PAPIER GARDE LE CHANT':contact?'LE CHANT DEVIENT MATIÈRE':'UNE PLUME · VOTRE GESTE'}</span><span>{String(marks.length).padStart(2,'0')} GESTES</span></div>
        <div className={`artwork-paper${stage==='drying'?' is-drying':''}`} style={{'--paper-ratio':sheet.width/sheet.height} as React.CSSProperties}>
        {stage==='drying'&&<DryingFeathers bird={selectedBird}/>}
        <div ref={paper} className="bird-paper stable-sheet tool-paint" tabIndex={canDraw?0:-1} role={stage==='finished'?'group':'button'} aria-disabled={stage==='finished'?undefined:!canDraw} aria-label={stage==='finished'?'Œuvre et haïku résonant':canBlow?"Souffle du vivant : glisse pour déplacer ensemble l’eau et les pigments humides. Au clavier, maintiens espace et utilise les flèches.":canWet?"Toile : maintiens et glisse pour déposer l’eau résonante. Au clavier, maintiens espace ou Entrée et utilise les flèches.":"Papier : touche ou glisse sur le papier sec ou humide pour peindre avec un chant entier. Au clavier, place la plume avec les flèches puis presse espace ou Entrée."} onPointerDown={down} onPointerMove={position} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release} onPointerLeave={()=>{if(pointer.current===null){setPoint(null);cursorPrevious.current=null;setFeatherTilt(0);}}} onKeyDown={keyboardPaper} onKeyUp={event=>{if((event.key===' '||event.key==='Enter')&&keyHeld.current){event.preventDefault();keyHeld.current=false;if(canWet)finishWater();else{engine.current?.liftBreath();setContact(false);}}}} onBlur={()=>{if(keyHeld.current){keyHeld.current=false;if(canWet)finishWater();else{engine.current?.liftBreath();setContact(false);}}}} onContextMenu={event=>event.preventDefault()}>
          <canvas ref={canvas} aria-label="Aquarelle et traces de plumes sur papier coton"/>
          {poetry&&stage==='finished'&&<HaikuBlock verses={poetry.verses} placement={placement} editable={!poemPlaced&&!exporting} onChange={setPlacement}/>}
          <span className="paper-signature" aria-hidden="true">•°○</span>
          {!marks.length&&!contact&&!error&&(!canWet||!waterPlaced)&&stage!=='drying'&&stage!=='finished'&&<div className="bird-paper-invitation">{canWet?<WaterDrop className="invitation-feather"/>:<FeatherGlyph bird={selectedBird} className="invitation-feather"/>}<span>{canBlow?'Un souffle, la matière s’étire.':canWet?(waterPlaced?'L’eau résonante est déposée.':'Un peu d’eau, avant les voix.'):'Ton oiseau peut entrer.'}</span><small>{canBlow?'Glisse sur une zone humide pour entraîner ses pigments.':canWet?'Dessine des chemins d’eau, sans un bruit.':'Dépose ou glisse la plume. Le chant anime ta matière.'}</small></div>}
          {point&&canPaint&&!error&&<div className={`brush-cursor feather-cursor ${contact?'resonating':''}`} aria-hidden="true" style={{left:`${point.x*100}%`,top:`${point.y*100}%`,'--feather-tilt':`${featherTilt}deg`} as React.CSSProperties}><span className="feather-hotspot"/><FeatherGlyph bird={paintingBird}/></div>}
          {point&&canBlow&&!error&&<div className={`breath-cursor ${contact?'is-blowing':''}`} aria-hidden="true" style={{left:`${point.x*100}%`,top:`${point.y*100}%`,width:`${24+brush*64}px`,height:`${24+brush*64}px`,'--breath-angle':`${breathAngle}deg`} as React.CSSProperties}><span>≋→</span></div>}
          {point&&canWet&&!error&&<div className={`water-cursor ${contact?'is-wetting':''}`} aria-hidden="true" style={{left:`${point.x*100}%`,top:`${point.y*100}%`}}><WaterDrop/></div>}
          {error&&<div className="bird-gpu-error" role="alert"><span>•°</span><p>Le papier attend votre GPU.</p><small>{error.includes('WebGL')?'Activez l’accélération graphique dans un navigateur compatible WebGL2.':error}</small><button onClick={event=>{event.stopPropagation();stop();setWaterPlaced(false);setMarks([]);setPoetry(null);setStage(padIds.length===1?'paint':'choose');setTool('water');setPoint(null);setColour(null);setStatus(idle);setError('');setRetry(r=>r+1);}}>Réessayer</button></div>}
        </div>
        </div>
        <div className="bird-art-caption"><span>{stage==='finished'?'Une plume. Votre empreinte.':stage==='drying'?'Les contours se déposent. Le papier garde le poème.':marks.length?'Levez la plume. Laissez l’eau poursuivre son chemin.':'Un geste, un chant. Le papier et l’eau composent la matière.'}</span><span className="signature-id">N° {seed.toString(16).toUpperCase().padStart(8,'0')}</span></div>
      </section>
      <aside className="bird-instrument">
        <div className="bird-pad-board">
          {stage==='paint'&&<>
          <CreationPalette immersive={immersiveActive} drawing={contact} bird={selectedBird} tool={tool} colour={colour} size={brush} opacity={opacity} waterSize={waterSize} waterAmount={waterAmount} canDry={!!marks.length&&!error&&!exporting&&!busy} onTool={next=>next==='plume'?choose(selectedBird):selectTool(next)} onColour={next=>{selectTool('plume');setColour(next);}} onSize={setBrush} onOpacity={setOpacity} onWaterSize={setWaterSize} onWaterAmount={setWaterAmount} onDry={finalize}/>
          <div className="bird-live" role="status" aria-live="polite"><span className={playing?'bird-live-dot active':'bird-live-dot'}/><span>{liveText}</span>{busy&&<button onClick={stop} aria-label="Interrompre le chant"><Glyph name="stop"/></button>}{canPaint&&!busy&&status.hasPigment&&status.phase!=='complete'&&<button className="drying-pause" onClick={()=>status.paused?engine.current?.resume():engine.current?.pause()} aria-label={status.paused?'Reprendre la diffusion':'Mettre la diffusion en pause'}>{status.paused?'Reprendre':'Pause'}</button>}</div>
          </>}
          {stage==='drying'&&<div className="artwork-drying" role="status"><SilenceSun/><progress aria-label="Séchage de l’œuvre" max="1" value={dryingProgress}/><span>Sous le soleil du silence…</span><button onClick={continuePainting}>Reprendre la plume</button></div>}
          {stage==='finished'&&<div className="resonant-actions">
            {!poetry?<button className="finalize-art reveal-haiku" onClick={revealHaiku} disabled={!!error}>Révéler le haïku résonant ✧</button>:<>
              {!poemPlaced?<><p>Déplace les trois lignes sur la peinture, puis ajuste leur taille.</p><label className="haiku-size"><span>Taille du haïku</span><input aria-label="Taille du haïku" type="range" min="16" max="60" value={Math.round(placement.size*1000)} onChange={e=>setPlacement(p=>({...p,size:Number(e.target.value)/1000}))}/></label><button className="finalize-art place-haiku" onClick={()=>setPoemPlaced(true)}>Valider le placement</button></>:<button className="continue-art" onClick={()=>setPoemPlaced(false)}>Modifier le placement</button>}
              <button className="finalize-art share-art" onClick={()=>void exportArt('share')} disabled={!poemPlaced||exporting||!!error}>{exporting?'Préparation…':'Partager l’œuvre'} ↗</button>
              <button className="continue-art download-art" onClick={()=>void exportArt()} disabled={!poemPlaced||exporting||!!error}>Télécharger l’image · PNG</button>
            </>}
            <p className="shared-attribution">Création Plume d’Haïkuarelle · •°○<br/>La participation n’attribue pas de propriété exclusive sur l’œuvre.</p>
            <button className="continue-art resume-art" onClick={continuePainting} disabled={exporting}>Reprendre la plume</button>
          </div>}
        </div>

      </aside>

    </main>
    <footer className="bird-footer"><span>Un oiseau. De l’eau, un chant, du silence. Une haïkuarelle.</span><a href="/birds/credits.html" target="_blank" rel="noreferrer">Chants & crédits ↗</a><a href="https://github.com/pierkiroule/Haikuarelle" target="_blank" rel="noreferrer">Code & installation ↗</a><a href="/PIGMENT-DRIFT-LICENSE.txt" target="_blank" rel="noreferrer">Pigment Drift · MIT</a></footer>
    {canvasOnly&&<button className="canvas-restore" onClick={()=>setCanvasOnly(false)}>Afficher les commandes <span aria-hidden="true">↗</span></button>}
    {screen.viewing&&!immersiveActive&&<button className="bird-exit" aria-label="Quitter le plein écran" onClick={screen.exit} onFocus={screen.reveal} onPointerMove={screen.reveal}><Glyph name="close"/>Quitter</button>}
    {screen.viewing&&playing&&<button className="bird-finish-screen" onClick={stop} aria-label="Interrompre le chant"><Glyph name="stop"/>Interrompre le chant</button>}
    {screen.viewing&&!immersiveActive&&canCreate&&!busy&&marks.length>0&&<button className="bird-finalize-screen" onClick={finalize}>Laisser sécher ☼</button>}
    {notice&&<div className="toast" role="status">{notice}</div>}
  </div>;
}
export default function App(){const params=new URLSearchParams(location.search);return params.has('validation')?<Suspense fallback={<p>Ouverture…</p>}><Validation/></Suspense>:params.has('mp3')?<Suspense fallback={<p>Ouverture…</p>}><Legacy/></Suspense>:<BirdStudio/>;}
