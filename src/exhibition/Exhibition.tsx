import {useEffect,useRef,useState,type PointerEvent as ReactPointerEvent,type KeyboardEvent as ReactKeyboardEvent,type CSSProperties} from 'react';
import {HaikuarelleEngine} from '../engine/WatercolorEngine';
import {BIRD_BRUSHES,type Bird} from '../birds/catalog';
import {BIRD_COLOURS} from '../birds/colourPalettes';
import {PLUMAGE_PIGMENTS,getPalette} from '../engine/palettes';
import type {EngineSettings,EngineStatus,Point} from '../engine/types';
import {BirdAudioBank} from '../birds/BirdAudioBank';
import {SoundDeposit} from '../birds/SoundDeposit';
import {WaterSong} from '../birds/WaterSong';
import {CreationPalette} from '../birds/CreationPalette';
import {FeatherEncounter} from '../birds/FeatherEncounter';
import {FeatherGlyph} from '../birds/FeatherGlyph';
import {ArtworkTitle,ArtworkPoem} from '../birds/ArtworkWords';
import {composeBirdPoem} from '../birds/ornithopoetry';
import {paperPoint} from '../birds/ResonantBrush';
import {exportSignatureCard} from '../birds/export';
import {deliverArtwork} from '../birds/share';
import {sheetFor} from '../engine/layout';
import {Soundscape} from './Soundscape';
import {EXHIBITION} from './lifecycle';
import {APP_NAME} from '../brand';
import './exhibition.css';

type Stage='choose'|'poem'|'paint';
type Tool='water'|'plume'|'breath';
const settings:EngineSettings={palette:'plumages',granulation:.84,wetness:.57,complexity:.52,ink:0,resonance:.96,sharpness:.8,dryingThreshold:.42,format:'a4'};
const newSeed=()=>crypto.getRandomValues(new Uint32Array(1))[0];
const blank:EngineStatus={seed:0,progress:0,phase:'idle',paused:false,fps:0,ticks:0,hasPigment:false};

/** Sessions own words and tools. The shared painter lives for the whole installation. */
export default function Exhibition(){
 const [stage,setStage]=useState<Stage>('choose'),[bird,setBird]=useState<Bird>(BIRD_BRUSHES[0]);
 const [words,setWords]=useState<ReturnType<typeof composeBirdPoem>>(null),[seed]=useState(newSeed);
 const [tool,setTool]=useState<Tool>('water'),[colour,setColour]=useState<number|null>(null);
 const [size,setSize]=useState(.62),[opacity,setOpacity]=useState(1),[waterSize,setWaterSize]=useState(.62),[waterAmount,setWaterAmount]=useState(1);
 const [status,setStatus]=useState(blank),[busy,setBusy]=useState(false),[contact,setContact]=useState(false),[point,setPoint]=useState<Point|null>(null);
 const [notice,setNotice]=useState(''),[error,setError]=useState(''),[exporting,setExporting]=useState(false),[warning,setWarning]=useState(false),[quiet,setQuiet]=useState(false),[soundEnabled,setSoundEnabled]=useState(true);
 const [visitor,setVisitor]=useState(0),[retry,setRetry]=useState(0);
 const canvas=useRef<HTMLCanvasElement>(null),paper=useRef<HTMLDivElement>(null),root=useRef<HTMLDivElement>(null);
 const engine=useRef<HaikuarelleEngine|null>(null),bank=useRef<BirdAudioBank|null>(null),deposit=useRef<SoundDeposit|null>(null),water=useRef<WaterSong|null>(null),landscape=useRef<Soundscape|null>(null);
 const pointer=useRef<number|null>(null),keyHeld=useRef(false),wetting=useRef(false),serial=useRef(0),lastActivity=useRef(performance.now()),warnedAt=useRef<number|null>(null),preview=useRef(0);
 const snapshot=useRef({stage,bird,tool,size,opacity,waterSize,waterAmount,colour,soundEnabled});snapshot.current={stage,bird,tool,size,opacity,waterSize,waterAmount,colour,soundEnabled};
 const relayRef=useRef<()=>void>(()=>{});
 const sheet=sheetFor('a4'),palette=getPalette('plumages');
 const paintingBird=colour===null?bird:{...bird,color:BIRD_COLOURS[bird.id]?.[colour]?.hex??bird.color,pigmentSlot:PLUMAGE_PIGMENTS.length+colour};
 const touch=()=>{lastActivity.current=performance.now();warnedAt.current=null;setWarning(false);setQuiet(false);};
 const releasePointer=()=>{
  const wasWetting=wetting.current;
  const id=pointer.current;pointer.current=null;keyHeld.current=false;wetting.current=false;setContact(false);setPoint(null);
  if(id!==null&&paper.current?.hasPointerCapture(id))paper.current.releasePointerCapture(id);
  engine.current?.liftWaterBrush();engine.current?.liftBreath();if(wasWetting)engine.current?.holdWater(false);water.current?.release();
 };
 const pass=()=>{
  releasePointer();preview.current++;deposit.current?.cancel(true);engine.current?.stopWaterSong();
  setStage('choose');setWords(null);setColour(null);setTool('water');setBusy(false);setVisitor(v=>v+1);touch();
 };
 relayRef.current=pass;
 useEffect(()=>{
  let live=true;const sounds=new BirdAudioBank();bank.current=sounds;
  let painter:HaikuarelleEngine|undefined;
  try{
   painter=new HaikuarelleEngine(canvas.current!,settings,s=>{if(live)setStatus(s);},m=>{if(live)setError(m);},{requireAudio:true,exhibition:true});
   engine.current=painter;painter.beginSignature(seed);painter.setBirdPalette(BIRD_BRUSHES[0].id);
   const score=new Soundscape(sounds,painter);landscape.current=score;
   water.current=new WaterSong(sounds,painter,{preparing:()=>{if(live)setBusy(true);},started:()=>{if(live)setBusy(true);},stopped:()=>{if(live&&!deposit.current?.busy)setBusy(false);},error:m=>{if(live)setNotice(m);}});
   deposit.current=new SoundDeposit(sounds,painter,{preparing:()=>{if(live)setBusy(true);},started:()=>{if(live)setBusy(true);},stopped:()=>{if(live)setBusy(false);},
    marked:(b,p)=>{score.remember(b.id,p,painter!.livingSeconds);},error:m=>{if(live)setNotice(m);}});
   void sounds.preload(()=>{});
  }catch(cause){setError(cause instanceof Error?cause.message:'Le papier ne peut pas s’ouvrir.');}
  const timer=setInterval(()=>{
   if(!live||!painter)return;
   if(snapshot.current.soundEnabled)void landscape.current?.tick(painter.livingSeconds).catch(()=>{});
   if(snapshot.current.stage==='choose'||document.hidden)return;
   const idle=(performance.now()-lastActivity.current)/1000;
   if(idle>EXHIBITION.idle){
    if(warnedAt.current===null){warnedAt.current=performance.now();setWarning(true);}
    else if(performance.now()-warnedAt.current>EXHIBITION.warning*1000)relayRef.current();
   }
   if(idle>3&&!keyHeld.current&&pointer.current===null)setQuiet(true);
  },500);
  const hidden=()=>{if(document.hidden){releasePointer();engine.current?.liftBreath(true);deposit.current?.cancel(true);landscape.current?.silence();sounds.stop();}else touch();};
  const blur=()=>{releasePointer();deposit.current?.cancel(true);};
  document.addEventListener('visibilitychange',hidden);window.addEventListener('blur',blur);
  return()=>{live=false;clearInterval(timer);preview.current++;document.removeEventListener('visibilitychange',hidden);window.removeEventListener('blur',blur);landscape.current?.destroy();deposit.current?.cancel();water.current?.cancel();sounds.destroy();painter?.destroy();engine.current=null;bank.current=null;};
 },[seed,retry]);
 useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(''),5000);return()=>clearTimeout(timer);},[notice]);
 const choose=(b:Bird)=>{
  if(stage!=='choose')return;touch();setBird(b);setColour(null);setWords(composeBirdPoem([b.id],newSeed()));setStage('poem');
  engine.current?.setBirdPalette(b.id);const token=++preview.current;
  bank.current?.setPosition({x:.5,y:.5});
  if(soundEnabled)void bank.current?.play(b.id,()=>{},()=>{}).catch(()=>{if(token===preview.current)setNotice('Touche à nouveau la toile pour faire entendre le chant.');});
 };
 const enter=()=>{touch();preview.current++;bank.current?.fadeStop();setStage('paint');setTool('water');};
 const changeTool=(next:Tool)=>{releasePointer();engine.current?.liftBreath(true);touch();setTool(next);};
 const begin=(p:Point,time:number,pressure=.5)=>{
  const painter=engine.current;if(stage!=='paint'||!painter||error)return;touch();setPoint(p);setContact(true);bank.current?.setPosition(p);
  if(tool==='breath'){painter.blow(p,time,size);return;}
  if(tool==='water'){
   if(!wetting.current){wetting.current=true;if(!deposit.current?.busy&&soundEnabled)void water.current?.begin(bird);}
   painter.wetBrush(p,waterSize,pressure,waterAmount);return;
  }
  if(!soundEnabled){setNotice('Réactive les chants pour déposer la peinture sonore.');return;}
  if(deposit.current?.busy){deposit.current.move(p,false);return;}
  water.current?.cancel();
  const eventSeed=(seed^Math.imul(++serial.current,0x9e3779b1))>>>0;
  void deposit.current?.place(paintingBird,p,eventSeed,size,serial.current,opacity);
 };
 const down=(e:ReactPointerEvent<HTMLDivElement>)=>{
  if(stage!=='paint'||e.button!==0||e.isPrimary===false||pointer.current!==null)return;
  const p=paperPoint(e.clientX,e.clientY,e.currentTarget.getBoundingClientRect());if(!p)return;
  e.preventDefault();e.currentTarget.focus({preventScroll:true});e.currentTarget.setPointerCapture(e.pointerId);pointer.current=e.pointerId;begin(p,e.timeStamp,e.pointerType==='pen'?e.pressure:.5);
 };
 const move=(e:ReactPointerEvent<HTMLDivElement>)=>{
  if(stage!=='paint')return;
  const samples=e.nativeEvent.getCoalescedEvents?.();
  for(const sample of samples?.length?samples:[e.nativeEvent]){
   const p=paperPoint(sample.clientX,sample.clientY,e.currentTarget.getBoundingClientRect());
   if(!p){setPoint(null);engine.current?.liftWaterBrush();engine.current?.liftBreath();continue;}
   setPoint(p);
   if(pointer.current!==e.pointerId)continue;touch();bank.current?.setPosition(p);
   if(tool==='plume'&&deposit.current?.busy)deposit.current.move(p);else begin(p,sample.timeStamp,e.pointerType==='pen'?sample.pressure:.5);
  }
 };
 const up=(e:ReactPointerEvent<HTMLDivElement>)=>{if(pointer.current===e.pointerId){releasePointer();if(e.type==='pointercancel')engine.current?.liftBreath(true);}};
 const keyboard=(e:ReactKeyboardEvent<HTMLDivElement>)=>{
  if(stage!=='paint'||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','Enter'].includes(e.key))return;
  e.preventDefault();touch();const p=point??{x:.5,y:.5},next={x:Math.min(.97,Math.max(.03,p.x+(e.key==='ArrowRight'?.018:e.key==='ArrowLeft'?-.018:0))),y:Math.min(.97,Math.max(.03,p.y+(e.key==='ArrowDown'?.018:e.key==='ArrowUp'?-.018:0)))};setPoint(next);
  if(e.key===' '||e.key==='Enter'){if(!keyHeld.current&&!e.repeat){keyHeld.current=true;begin(next,performance.now());}}
  else if(keyHeld.current){if(tool==='plume'&&deposit.current?.busy)deposit.current.move(next);else begin(next,performance.now());}
 };
 const capture=async()=>{
  if(!engine.current||exporting||error)return;touch();setExporting(true);
  // Snapshot words and pixels before awaiting encoding; the living field never pauses.
  const capturedWords=words?{title:words.title,verses:[...words.verses]}:{title:'',verses:[]};
  const time=Date.now(),painter=engine.current;
  try{
   const image=painter.exportPNG();
   const png=await exportSignatureCard(await image,capturedWords.verses,palette.paper,seed,'',capturedWords.title,true);
   await deliverArtwork(png,`haikuarelle-instant-${time}.png`,capturedWords.title||APP_NAME,'download');setNotice('Un instant de l’œuvre a été cueilli.');
  }catch(cause){setNotice(cause instanceof Error?cause.message:'La capture n’a pas pu être préparée.');}finally{setExporting(false);}
 };
 const toggleSound=()=>{
  touch();setSoundEnabled(v=>!v);
  if(soundEnabled){deposit.current?.cancel(true);water.current?.cancel();landscape.current?.silence();bank.current?.fadeStop();}
  else void bank.current?.unlock().catch(()=>setNotice('Touche une plume pour autoriser le son.'));
 };
 return <div ref={root} className={`bird-studio direct-studio exhibition flow-paint exhibition-${stage}${contact?' is-painting':''}${quiet?' is-quiet':''}`} style={{'--paper':palette.paper,'--art-ratio':sheet.width/sheet.height,'--sample-color':paintingBird.color} as CSSProperties} onPointerDownCapture={touch} onKeyDownCapture={e=>{touch();if(e.key==='Escape'){releasePointer();deposit.current?.cancel(true);}}}>
  <header className="exhibition-header"><a href="/" className="exhibition-brand" aria-label={APP_NAME}><img src="/brand/plume-aquarelle.webp" alt="" width="36" height="36"/><span>Plume d’Haïkuarelle<small>Une œuvre collective, un instant vivant</small></span></a><div><button onClick={toggleSound} aria-pressed={!soundEnabled}>{soundEnabled?'Chants ouverts':'Chants en silence'}</button><button className="capture-instant" onClick={()=>void capture()} disabled={!status.hasPigment||exporting||!!error}>{exporting?'Capture…':'Cueillir un instant'} <span aria-hidden="true">↗</span></button></div></header>
  <main className="exhibition-layout">
   <section className="exhibition-sheet" aria-label="L’œuvre collective vivante">
    <div className="artwork-paper" style={{'--paper-ratio':210/297} as CSSProperties}>
     <div className="exhibition-title-slot">{words&&<ArtworkTitle poetry={words}/>}</div>
     <div ref={paper} className="bird-paper stable-sheet" role="button" tabIndex={stage==='paint'?0:-1} aria-disabled={stage!=='paint'} aria-label={`Toile vivante : ${tool==='water'?'déposer l’eau résonante':tool==='breath'?'souffler sur l’eau':'déposer le chant'}. Au clavier, maintiens espace et utilise les flèches.`} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onLostPointerCapture={up} onPointerLeave={()=>{if(pointer.current===null)setPoint(null);}} onKeyDown={keyboard} onKeyUp={e=>{if((e.key===' '||e.key==='Enter')&&keyHeld.current){e.preventDefault();releasePointer();}}} onBlur={()=>{if(keyHeld.current)releasePointer();}} onContextMenu={e=>e.preventDefault()}>
      <canvas ref={canvas} aria-label="Eau, pigments et traces des visiteurs"/>
      {stage==='choose'&&!status.hasPigment&&<div className="exhibition-paper-whisper">Le papier attend une rencontre.</div>}
      {point&&stage==='paint'&&<div className={`exhibition-cursor cursor-${tool}`} style={{left:`${point.x*100}%`,top:`${point.y*100}%`}} aria-hidden="true">{tool==='plume'?<FeatherGlyph bird={paintingBird}/>:tool==='water'?'◯':'≋'}</div>}
      {error&&<div className="bird-gpu-error" role="alert"><p>{error}</p><button onClick={()=>{setError('');setRetry(v=>v+1);}}>Réessayer le moteur</button><small>Une interruption graphique peut faire perdre les traces en cours.</small></div>}
     </div>
     <div className="paper-footer">{words&&<ArtworkPoem poetry={words}/>}<span className="paper-signature" aria-hidden="true">•°○</span></div>
    </div>
    <p className="exhibition-caption">Mouiller. Faire apparaître. Laisser partir.</p>
   </section>
   <aside className="exhibition-encounter" aria-label="Le passage des plumes">
    {stage==='choose'&&<><p className="bird-eyebrow">À VOUS DE FAIRE VIVRE L’ŒUVRE</p><h1>Attrape une plume.<br/><em>Prolonge ce qui vit.</em></h1><FeatherEncounter key={visitor} onChoose={choose}/><p className="exhibition-note">Chaque trace vit une minute.<br/>La prochaine rencontre poursuit l’œuvre.</p></>}
    {stage==='poem'&&words&&<div className="exhibition-invitation"><FeatherGlyph bird={bird}/><p className="bird-eyebrow">{bird.name}</p><h1>{words.title}</h1><ArtworkPoem poetry={words}/><button className="enter-atelier" onClick={enter}>Rejoindre l’œuvre <span aria-hidden="true">↗</span></button><button className="exhibition-link" onClick={pass}>Passer la plume</button></div>}
    {stage==='paint'&&<div className="exhibition-participation"><FeatherGlyph bird={bird}/><p>{bird.name}</p><p className="exhibition-note">L’eau rencontre ce qui reste.<br/>Tes traces poursuivront leur vie après toi.</p><button className="relay-button" onClick={pass}>Passer la plume ↗</button></div>}
   </aside>
  </main>
  {stage==='paint'&&<CreationPalette relay bird={bird} tool={tool} colour={colour} size={size} opacity={opacity} waterSize={waterSize} waterAmount={waterAmount} canDry={!error} onTool={changeTool} onColour={c=>{changeTool('plume');setColour(c);}} onSize={setSize} onOpacity={setOpacity} onWaterSize={setWaterSize} onWaterAmount={setWaterAmount} onDry={pass}/>}
  {stage==='paint'&&<div className="exhibition-status" role="status">{busy?'Le chant traverse la matière.':tool==='water'?'Dépose l’eau, avant ou après la couleur.':tool==='breath'?'Étire l’eau et ses pigments.':'Un geste, un chant entier.'}</div>}
  {warning&&<div className="exhibition-presence" role="dialog" aria-modal="false" aria-labelledby="presence-title"><h2 id="presence-title">Tu es toujours là ?</h2><p>La plume sera bientôt disponible pour une autre rencontre.</p><button autoFocus onClick={touch}>Je poursuis</button><button onClick={pass}>Passer la plume</button></div>}
  {notice&&<div className="toast" role="status">{notice}</div>}
  <footer className="exhibition-footer"><span>Chaque geste rencontre une histoire qui s’efface.</span><a href="/birds/credits.html" target="_blank" rel="noreferrer">Chants & crédits ↗</a><a href="?atelier">Atelier individuel ↗</a></footer>
 </div>;
}
