// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import type {EngineStatus,Point} from '../src/engine/types';
import type {Bird} from '../src/birds/catalog';
import {BIRD_POETICS} from '../src/birds/ornithopoetry';
import {BirdStudio} from '../src/App';
import type {Journey} from '../src/voyage/VoyageDialog';
interface TestPainter {status:EngineStatus;complete:()=>void;mark:()=>void;wetBrush:ReturnType<typeof vi.fn>;resume:ReturnType<typeof vi.fn>;capturePreview:ReturnType<typeof vi.fn>;holdWater:ReturnType<typeof vi.fn>;setDrying:ReturnType<typeof vi.fn>}
const h=vi.hoisted(()=>({painter:null as TestPainter|null,starts:0,moves:0,stops:0,finish:()=>{},previews:[] as string[],previewStops:0,previewEnd:()=>{},journey:null as Journey|null}));
vi.mock('../src/voyage/VoyageDialog',()=>({default:({journey,onClose}:{journey:Journey;onClose:()=>void})=>{
  h.journey=journey;return <section role="dialog" aria-label="Voyage 360"><button onClick={onClose}>Retour à mon haïkuarelle</button></section>;
}}));
vi.mock('../src/engine/WatercolorEngine',()=>({HaikuarelleEngine:class{
  status:EngineStatus={seed:0,progress:0,phase:'idle',paused:true,fps:30,ticks:0};composition={duration:20};
  constructor(_canvas:unknown,_settings:unknown,private change:(s:EngineStatus)=>void){h.painter=this;}
  beginSignature(seed:number){this.status={...this.status,seed,phase:'idle',ticks:0,hasPigment:false};this.change({...this.status});}
  update(){}setBrushSize(){}destroy(){}pause(){}liftWaterBrush(){}
  holdWater=vi.fn();
  wetBrush=vi.fn();
  setDrying=vi.fn();
  resume=vi.fn(()=>{this.status.paused=false;this.change({...this.status});});
  mark=()=>{this.status={...this.status,hasPigment:true,phase:'wash',ticks:50};this.change({...this.status});};
  complete=()=>{this.status={...this.status,hasPigment:true,phase:'complete',progress:1,ticks:600};this.change({...this.status});};
  capturePreview=vi.fn(()=>{
    const width=20,height=30,pixels=new Uint8Array(width*height*4);
    for(let y=0;y<height;y++)for(let x=0;x<width;x++)pixels.set(x>=6&&x<14&&y>=6&&y<24?[70,130,190,255]:[247,244,236,255],(y*width+x)*4);
    return {width,height,pixels};
  });
}}));
vi.mock('../src/birds/BirdAudioBank',()=>({BirdAudioBank:class{
  preload(){}async prepare(){}async unlock(){}
  async play(id:string,onStart:(sound:unknown)=>void,onEnd:()=>void){this.stop();h.previews.push(id);h.previewEnd=onEnd;onStart({});}
  stop(){h.previewStops++;const done=h.previewEnd;h.previewEnd=()=>{};done();}
  destroy(){this.stop();}
}}));
vi.mock('../src/birds/SoundDeposit',()=>({SoundDeposit:class{
  busy=false;
  constructor(_sounds:unknown,_painter:unknown,private callbacks:{preparing:(b:Bird)=>void;started:(b:Bird)=>void;stopped:()=>void;marked:(b:Bird,p:Point,s:number)=>void}){}
  async place(bird:Bird,point:Point,seed:number){this.busy=true;h.starts++;this.callbacks.started(bird);h.painter!.mark();this.callbacks.marked(bird,point,seed);h.finish=()=>{this.busy=false;this.callbacks.stopped();};}
  move(){h.moves++;}
  cancel(){h.stops++;this.busy=false;this.callbacks.stopped();}
}}));
let root:Root,host:HTMLDivElement;
const button=(label:string)=>host.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;
const click=async(element:HTMLElement)=>{await act(async()=>element.click());};
async function water(){
  const paper=host.querySelector<HTMLElement>('.bird-paper')!;
  await act(async()=>paper.dispatchEvent(new KeyboardEvent('keydown',{key:' ',bubbles:true})));
  await act(async()=>paper.dispatchEvent(new KeyboardEvent('keyup',{key:' ',bubbles:true})));
  await click(host.querySelector('.bird-pad')!);
}
async function spin(){
  await click(host.querySelector('.wheel-spin')!);
  await act(async()=>{await vi.advanceTimersByTimeAsync(110);});
}
async function paint(){
  await spin();
  await click(host.querySelector('.trio-start button')!);
  await click(host.querySelector('.enter-atelier')!);
  await water();
  const paper=host.querySelector<HTMLElement>('.bird-paper')!;
  await act(async()=>paper.dispatchEvent(new KeyboardEvent('keydown',{key:' ',bubbles:true})));
  await act(async()=>paper.dispatchEvent(new KeyboardEvent('keyup',{key:' ',bubbles:true})));
  await act(async()=>h.finish());
}
beforeEach(async()=>{
  vi.useFakeTimers();
  h.starts=0;h.moves=0;h.stops=0;h.painter=null;h.previews=[];h.previewStops=0;h.previewEnd=()=>{};vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);
  vi.stubGlobal('matchMedia',()=>({matches:true}));vi.stubGlobal('requestAnimationFrame',()=>1);vi.stubGlobal('cancelAnimationFrame',()=>{});
  host=document.createElement('div');document.body.append(host);root=createRoot(host);
  await act(async()=>root.render(<BirdStudio/>));
});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.unstubAllGlobals();vi.useRealTimers();});
describe('one bird, an opening haiku, a shared palette and a final title',()=>{
  it('draws exactly one bird, locks the wheel during rotation and previews without pigment',async()=>{
    const start=host.querySelector<HTMLButtonElement>('.trio-start button')!;
    expect(start.disabled).toBe(true);
    await click(host.querySelector('.wheel-spin')!);
    expect(host.querySelector<HTMLButtonElement>('.wheel-spin')!.disabled).toBe(true);
    expect(start.disabled).toBe(true);expect(h.previews).toHaveLength(0);
    await act(async()=>{await vi.advanceTimersByTimeAsync(110);});
    expect(start.disabled).toBe(false);expect(h.previews).toHaveLength(1);expect(h.starts).toBe(0);
    expect(host.querySelector('.wheel-result strong')).not.toBeNull();
    await click(start);expect(host.querySelector('.flow-poem')).not.toBeNull();
    expect(host.querySelectorAll('.poem-invitation .poem-lines>span')).toHaveLength(3);
    await click(host.querySelector('.enter-atelier')!);await water();expect(host.querySelectorAll('.bird-pad')).toHaveLength(1);
  });
  it('replaces the previous encounter on another spin and stops its preview before water',async()=>{
    await spin();await spin();expect(h.previews).toHaveLength(2);
    await click(host.querySelector('.trio-start button')!);
    expect(host.querySelector('.flow-poem')).not.toBeNull();
    expect(host.querySelector('.is-previewing')).toBeNull();expect(h.starts).toBe(0);
  });
  it('shows the haiku before painting, then offers water and a plume on the same canvas',async()=>{
    expect(host.querySelectorAll('.ritual-progress li')).toHaveLength(5);
    await spin();await click(host.querySelector('.trio-start button')!);
    const verses=[...host.querySelectorAll('.poem-invitation .poem-lines>span')].map(el=>el.textContent);
    expect(verses).toHaveLength(3);expect(host.querySelector('.artwork-title')).toBeNull();expect(h.starts).toBe(0);
    await click(host.querySelector('.enter-atelier')!);
    expect(button('Choisir l’eau résonante').getAttribute('aria-pressed')).toBe('true');
    const painter=h.painter,canvas=host.querySelector('canvas');await water();
    expect(painter!.wetBrush).toHaveBeenCalled();expect(h.starts).toBe(0);
    expect(host.querySelector('canvas')).toBe(canvas);expect(h.painter).toBe(painter);
    expect(host.querySelector('.flow-paint')).not.toBeNull();
    expect(host.querySelector<HTMLButtonElement>('.finalize-art')!.disabled).toBe(true);
    expect([...host.querySelectorAll('.poem-recall .poem-lines>span')].map(el=>el.textContent)).toEqual(verses);
    expect(host.querySelector('.water-ready')).toBeNull();expect(host.querySelector('.share-art')).toBeNull();
  });
  it('waits for real marks and final drying before revealing words above and below the canvas',async()=>{
    await paint();expect(host.querySelector('.artwork-title')).toBeNull();
    const openingVerses=[...host.querySelectorAll('.poem-recall .poem-lines>span')].map(el=>el.textContent);
    await click(host.querySelector('.finalize-art')!);
    expect(host.querySelector('.flow-drying')).not.toBeNull();expect(h.painter!.resume).toHaveBeenCalledOnce();expect(host.querySelector('.artwork-title')).toBeNull();
    const starts=h.starts,paper=host.querySelector<HTMLElement>('.bird-paper')!;
    await act(async()=>paper.dispatchEvent(new KeyboardEvent('keydown',{key:' ',bubbles:true})));
    expect(h.starts).toBe(starts);
    await act(async()=>h.painter!.complete());
    expect(host.querySelector('.flow-finished')).not.toBeNull();expect(host.querySelector('.share-art')).not.toBeNull();expect(host.querySelector('.download-art')).not.toBeNull();expect(BIRD_POETICS[h.previews.at(-1)! as keyof typeof BIRD_POETICS].titles).toContain(host.querySelector('.artwork-title h2')!.textContent);
    const lines=[...host.querySelectorAll('.bird-stage>.artwork-poem .poem-lines>span')];
    expect(lines).toHaveLength(3);expect(lines.map(el=>el.textContent)).toEqual(openingVerses);
    const trio=[h.previews.at(-1)!] as (keyof typeof BIRD_POETICS)[];
    const voices=lines.map((line,i)=>trio.find(id=>BIRD_POETICS[id].lines[i].includes(line.textContent!)));
    expect(voices.every(Boolean)).toBe(true);expect(new Set(voices).size).toBe(1);
    const children=[...host.querySelector('.bird-stage')!.children];
    expect(children.findIndex(el=>el.classList.contains('artwork-title'))).toBeLessThan(children.findIndex(el=>el.classList.contains('bird-paper')));
    expect(children.findIndex(el=>el.classList.contains('artwork-poem'))).toBeGreaterThan(children.findIndex(el=>el.classList.contains('bird-paper')));
    await click(host.querySelector('.resume-art')!);expect(host.querySelector('.artwork-title')).toBeNull();expect(host.querySelector('.flow-paint')).not.toBeNull();
  });
  it('keeps the artwork and trio when hiding tools and restores commands with Escape',async()=>{
    await paint();
    const sheet=host.querySelector('.bird-paper'),painter=h.painter;
    const toggle=[...host.querySelectorAll('button')].find(b=>b.textContent==='Toile seule')!;
    expect(host.querySelector('.atelier-panel')).toBeNull();
    expect(host.querySelector<HTMLDetailsElement>('.atelier-more')!.open).toBe(false);
    expect(host.querySelector('.final-dedication')).toBeNull();
    await click(toggle);
    expect(host.querySelector('.canvas-only')).not.toBeNull();
    expect(host.querySelector('.canvas-restore')).not.toBeNull();
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    await act(async()=>document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})));
    expect(host.querySelector('.canvas-only')).toBeNull();
    expect(host.querySelector('.bird-paper')).toBe(sheet);expect(h.painter).toBe(painter);
    expect(host.querySelectorAll('.bird-pads button')).toHaveLength(1);
    expect(host.querySelector<HTMLButtonElement>('.finalize-art')!.disabled).toBe(false);
    await click(toggle);await click(host.querySelector('.canvas-restore')!);
    expect(host.querySelector('.canvas-only')).toBeNull();
  });
  it('offers one full-plumage brush with contextual size and opacity controls',async()=>{
    expect(host.querySelectorAll('.wheel-feather')).toHaveLength(8);
    await spin();await click(host.querySelector('.trio-start button')!);await click(host.querySelector('.enter-atelier')!);await water();
    const brushes=host.querySelectorAll<HTMLButtonElement>('.bird-pad');expect(brushes).toHaveLength(1);
    await click(button('Fermer les réglages de la plume'));await click(brushes[0]);expect(host.querySelectorAll('.brush-context input[type=range]')).toHaveLength(2);
    await click(button('Fermer les réglages de la plume'));expect(host.querySelector('.brush-context')).toBeNull();
    expect(document.activeElement).toBe(brushes[0]);expect(h.starts).toBe(0);
  });
  it('keeps a feather tip at the keyboard drawing position and replaces all bird silhouettes',async()=>{
    expect(host.querySelector('.bird-wordmark')!.getAttribute('aria-label')).toBe("Plume d’Haïkuarelle");
    expect(host.querySelectorAll('.wheel-feather .feather-glyph')).toHaveLength(8);
    expect(host.querySelector('.bird-glyph')).toBeNull();
    await paint();
    expect(host.querySelectorAll('.bird-pad .feather-glyph')).toHaveLength(1);
    const paper=host.querySelector<HTMLElement>('.bird-paper')!;
    await act(async()=>paper.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true})));
    const cursor=host.querySelector<HTMLElement>('.feather-cursor')!;
    expect(cursor.style.left).toBe('51.6%');expect(cursor.style.top).toBe('50%');
    expect(cursor.getAttribute('aria-hidden')).toBe('true');
    expect(cursor.querySelector('.feather-glyph')).not.toBeNull();
    await act(async()=>paper.dispatchEvent(new KeyboardEvent('keydown',{key:' ',bubbles:true})));
    expect(cursor.classList.contains('resonating')).toBe(true);
    await act(async()=>paper.dispatchEvent(new KeyboardEvent('keyup',{key:' ',bubbles:true})));
    expect(cursor.classList.contains('resonating')).toBe(false);
  });
  it('paints along the gesture with one complete sample after release and selection changes',async()=>{
    await spin();
    await click(host.querySelector('.trio-start button')!);await click(host.querySelector('.enter-atelier')!);await water();
    const paper=host.querySelector<HTMLElement>('.bird-paper')!;
    const stopped=h.stops,moves=h.moves;
    await act(async()=>paper.dispatchEvent(new KeyboardEvent('keydown',{key:' ',bubbles:true})));
    await act(async()=>paper.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true})));
    await act(async()=>paper.dispatchEvent(new KeyboardEvent('keyup',{key:' ',bubbles:true})));
    expect(h.starts).toBe(1);expect(h.stops).toBe(stopped);expect(h.moves).toBe(moves+1);
    expect(host.querySelector('.finalize-art')!.hasAttribute('disabled')).toBe(true);
    await click(host.querySelectorAll<HTMLButtonElement>('.bird-pad')[0]);
    expect(h.stops).toBe(stopped);expect(h.starts).toBe(1);
    await act(async()=>h.finish());
    expect(host.querySelector('.finalize-art')!.hasAttribute('disabled')).toBe(false);
  });
  it('cancels a pending revelation when the user resumes or clears, keeping the selected trio',async()=>{
    await paint();await click(host.querySelector('.finalize-art')!);await click(host.querySelector('.artwork-drying button')!);
    await act(async()=>h.painter!.complete());expect(host.querySelector('.artwork-title')).toBeNull();
    await click(host.querySelector('.finalize-art')!);expect(host.querySelector('.flow-finished')).not.toBeNull();
    const clear=[...host.querySelectorAll('button')].find(b=>b.textContent==='Effacer tout')!;await click(clear);
    expect(host.querySelector('.flow-paint')).not.toBeNull();expect(host.querySelector('.bird-pads')).not.toBeNull();expect(host.querySelector('.artwork-title')).toBeNull();
    expect(button('Choisir l’eau résonante').getAttribute('aria-pressed')).toBe('true');
  });
});

it('can paint dry, then rewet without cancelling the full sample or replacing the canvas',async()=>{
  await spin();await click(host.querySelector('.trio-start button')!);await click(host.querySelector('.enter-atelier')!);
  await click(host.querySelector('.bird-pad')!);expect(h.painter!.wetBrush).not.toHaveBeenCalled();
  const paper=host.querySelector<HTMLElement>('.bird-paper')!,canvas=host.querySelector('canvas');
  await act(async()=>paper.dispatchEvent(new KeyboardEvent('keydown',{key:' ',bubbles:true})));
  await act(async()=>paper.dispatchEvent(new KeyboardEvent('keyup',{key:' ',bubbles:true})));
  const stops=h.stops;await click(button('Choisir l’eau résonante'));
  await act(async()=>paper.dispatchEvent(new KeyboardEvent('keydown',{key:' ',bubbles:true})));
  await act(async()=>paper.dispatchEvent(new KeyboardEvent('keyup',{key:' ',bubbles:true})));
  expect(h.painter!.wetBrush).toHaveBeenCalled();expect(h.painter!.holdWater).toHaveBeenLastCalledWith(false);expect(h.painter!.setDrying).not.toHaveBeenCalled();expect(h.stops).toBe(stops);expect(h.starts).toBe(1);
  expect(host.querySelector('canvas')).toBe(canvas);expect(host.querySelector('.flow-paint')).not.toBeNull();
  expect(host.querySelector<HTMLButtonElement>('.finalize-art')!.disabled).toBe(true);
  await act(async()=>h.finish());expect(host.querySelector<HTMLButtonElement>('.finalize-art')!.disabled).toBe(false);
});
it('opens the finished work as a separate journey and restores the painting with audio cleanup',async()=>{
  const close=vi.fn(async()=>{}),resume=vi.fn(async()=>{});
  vi.stubGlobal('AudioContext',class{close=close;resume=resume;});
  expect(host.querySelector('.journey-start')).toBeNull();await paint();
  await click(host.querySelector('.finalize-art')!);expect(host.querySelector('.journey-start')).toBeNull();
  await act(async()=>h.painter!.complete());const canvas=host.querySelector('canvas'),title=host.querySelector('.artwork-title')!.textContent;
  await click(host.querySelector('.journey-start')!);
  expect(host.querySelector('[role="dialog"]')).not.toBeNull();expect(h.journey!.marks.length).toBeGreaterThan(0);
  expect(h.journey!.frame.pixels.length).toBe(20*30*4);expect(resume).toHaveBeenCalledOnce();
  const context=h.journey!.context;expect(context).not.toBeNull();
  await click([...host.querySelectorAll('button')].find(b=>b.textContent==='Retour à mon haïkuarelle')!);
  expect(host.querySelector('[role="dialog"]')).toBeNull();expect(close).toHaveBeenCalledOnce();
  expect(host.querySelector('canvas')).toBe(canvas);expect(host.querySelector('.artwork-title')!.textContent).toBe(title);
});
