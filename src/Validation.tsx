import {useEffect,useRef,useState} from 'react';
import {HaikuarelleEngine} from './engine/WatercolorEngine';
import {exportSize,sheetFor} from './engine/layout';
import {PALETTES} from './engine/palettes';
import type {EngineSettings} from './engine/types';
const SETTINGS:EngineSettings={palette:'estuaire',granulation:.72,wetness:.64,complexity:.52};
interface Result {seed:number;palette:string;image:string;hash:string;ms:number;white:number}
function hash(bytes:Uint8Array){let value=0x811c9dc5;for(const b of bytes){value^=b;value=Math.imul(value,0x01000193);}return (value>>>0).toString(16).padStart(8,'0');}
function imageData(frame:{width:number;height:number;pixels:Uint8Array}):string{
  const c=document.createElement('canvas');c.width=frame.width;c.height=frame.height;
  c.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(frame.pixels),frame.width,frame.height),0,0);
  return c.toDataURL('image/png');
}
function whiteShare(pixels:Uint8Array):number{let blank=0;for(let i=0;i<pixels.length;i+=4)if(Math.min(pixels[i],pixels[i+1],pixels[i+2])>220)blank++;return Math.round(blank/(pixels.length/4)*100);}
export default function Validation(){
  const canvas=useRef<HTMLCanvasElement>(null),engine=useRef<HaikuarelleEngine|null>(null);
  const [results,setResults]=useState<Result[]>([]),[logs,setLogs]=useState<string[]>([]),[running,setRunning]=useState(false),[png,setPng]=useState('');
  const [seed,setSeed]=useState(240106);
  const log=(s:string)=>setLogs(l=>[...l,s]);
  useEffect(()=>{
    try{engine.current=new HaikuarelleEngine(canvas.current!,SETTINGS,undefined,log);}catch(e){log(String(e));}
    return()=>engine.current?.destroy();
  },[]);
  const run=async()=>{
    const e=engine.current;if(!e)return;setRunning(true);setResults([]);setLogs([]);
    let lastHash='';
    try{
      const gl=e.paint.gl;log(`WebGL2 — ${gl.getParameter(gl.RENDERER)}`);
      const sheet=sheetFor(e.settings.format);log(`Champ canonique : ${sheet.width} × ${sheet.height} ; pas fixe : 1/30 s.`);
      e.generate(240105);e.pause();const stopped=e.status.ticks;
      await new Promise<void>(r=>setTimeout(r,120));if(e.status.ticks!==stopped)throw new Error('Pause instable.');
      e.resume();await new Promise<void>(r=>setTimeout(r,250));e.pause();
      if(e.status.ticks<=stopped)throw new Error('La reprise ne fait pas avancer la simulation.');
      log(`✓ Pause/reprise pendant la formation : ${stopped} → ${e.status.ticks} pas.`);
      for(let i=0;i<5;i++){
        const seed=240105+i;setSeed(seed);e.update({...SETTINGS,palette:PALETTES[i].id});
        log(`Composition ${i+1}/5 · seed ${seed} · ${PALETTES[i].name}…`);
        const begin=performance.now();e.generate(seed);await e.finish();
        const frame=e.capturePreview();lastHash=hash(frame.pixels);
        const result={seed,palette:PALETTES[i].name,image:imageData(frame),hash:lastHash,ms:Math.round(performance.now()-begin),white:whiteShare(frame.pixels)};
        setResults(r=>[...r,result]);log(`✓ Seed ${seed} · ${lastHash} · ${result.ms} ms · zones claires ${result.white} %`);
        if(gl.getError()!==gl.NO_ERROR)throw new Error('Erreur WebGL après génération.');
      }
      log('Rejeu de la dernière seed sur le même GPU…');
      e.generate(240109);await e.finish();const again=hash(e.capturePreview().pixels);
      if(again!==lastHash)throw new Error(`Reproductibilité : ${lastHash} ≠ ${again}`);
      log(`✓ Reproductibilité pixel à pixel : ${again}.`);
      e.setGranulation(0);const smooth=hash(e.capturePreview().pixels);e.setGranulation(1);const rough=hash(e.capturePreview().pixels);
      if(smooth===rough)throw new Error('Le réglage Texture ne modifie pas le rendu.');
      log(`✓ Texture : rendu différent à 0 et à 100 (${smooth} / ${rough}).`);
      e.setGranulation(SETTINGS.granulation);
      const blob=await e.exportPNG(),bitmap=await createImageBitmap(blob);
      const size=exportSize(e.settings.format);if(bitmap.width!==size.width||bitmap.height!==size.height)throw new Error(`Dimensions PNG incorrectes : ${bitmap.width} × ${bitmap.height}`);
      log(`✓ PNG décodé : ${bitmap.width} × ${bitmap.height} · ${Math.round(blob.size/1024)} Ko.`);bitmap.close();
      setPng(old=>{if(old)URL.revokeObjectURL(old);return URL.createObjectURL(blob);});
      log('VALIDATION GPU TERMINÉE — 5 compositions, reproductibilité, texture et PNG.');
    }catch(e){log(`ÉCHEC : ${e instanceof Error?e.message:String(e)}`);}finally{setRunning(false);}
  };
  const single=async()=>{if(!engine.current)return;setRunning(true);try{engine.current.generate(seed);await engine.current.finish();log(`Étude ${seed} terminée.`);}catch(e){log(String(e));}finally{setRunning(false);}};
  const report=JSON.stringify({date:new Date().toISOString(),results:results.map(({image,...r})=>r),checks:logs},null,2);
  const reportUrl='data:application/json;charset=utf-8,'+encodeURIComponent(report);
  return <main className="validation"><a href="/">← Retour à l’atelier</a><h1>HAÏKUARELLE •° — Validation GPU</h1><p>Tests avec le moteur réel. Les images apparaissent après chaque composition.</p>
    <button className="primary" disabled={running} onClick={run}>{running?'Validation en cours…':'Lancer les cinq compositions et les tests'}</button>
    <div className="qa-live"><canvas ref={canvas} className="qa-canvas" aria-label="Toile de validation"/><div><label>Seed <input value={seed} type="number" onChange={e=>setSeed(Number(e.target.value))}/></label><button disabled={running} onClick={single}>Étude isolée</button><pre role="log">{logs.join('\n')}</pre></div></div>
    <div className="qa-downloads"><a href={reportUrl} download="validation-haikuarelle.json">Rapport JSON</a>{png&&<a href={png} download="haikuarelle-validation-4096.png">PNG 4 096 px</a>}</div>
    <div className="qa-gallery">{results.map((r,i)=><figure key={r.seed}><a href={r.image} download={`etude-${r.seed}.png`}><img src={r.image} alt={`Étude ${i+1} — ${r.palette}`} /></a><figcaption>#{r.seed} · {r.palette} · {r.hash} · {r.white} % de zones claires</figcaption></figure>)}</div>
  </main>;
}
