// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import type {EngineStatus,Point} from '../src/engine/types';
import type {Bird} from '../src/birds/catalog';
import {BIRD_POETICS} from '../src/birds/ornithopoetry';
import {BirdStudio} from '../src/App';
interface TestPainter {status:EngineStatus;complete:()=>void;mark:()=>void;wetBrush:ReturnType<typeof vi.fn>;resume:ReturnType<typeof vi.fn>;capturePreview:ReturnType<typeof vi.fn>;holdWater:ReturnType<typeof vi.fn>;setDrying:ReturnType<typeof vi.fn>}
const h=vi.hoisted(()=>({painter:null as TestPainter|null,starts:0,moves:0,stops:0,finish:()=>{},previews:[] as string[],previewStops:0,previewEnd:()=>{},placed:[] as Bird[]}));
vi.mock('../src/engine/WatercolorEngine',()=>({HaikuarelleEngine:class{
  status:EngineStatus={seed:0,progress:0,phase:'idle',paused:true,fps:30,ticks:0};composition={duration:20};
  constructor(_canvas:unknown,_settings:unknown,private change:(s:EngineStatus)=>void){h.painter=this;}
  beginSignature(seed:number){this.status={...this.status,seed,phase:'idle',ticks:0,hasPigment:false};this.change({...this.status});}
  setBirdPalette(){}update(){}setBrushSize(){}destroy(){}pause(){}liftWaterBrush(){}
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
  async place(bird:Bird,point:Point,seed:number){this.busy=true;h.placed.push(bird);h.starts++;this.callbacks.started(bird);h.painter!.mark();this.callbacks.marked(bird,point,seed);h.finish=()=>{this.busy=false;this.callbacks.stopped();};}
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
async function encounter(){await click(host.querySelector('.feather-choice[data-bird=geai]')!);}
async function paint(){
  await encounter();
  await click(host.querySelector('.enter-atelier')!);
  await water();
  const paper=host.querySelector<HTMLElement>('.bird-paper')!;
  await act(async()=>paper.dispatchEvent(new KeyboardEvent('keydown',{key:' ',bubbles:true})));
  await act(async()=>paper.dispatchEvent(new KeyboardEvent('keyup',{key:' ',bubbles:true})));
  await act(async()=>h.finish());
}
beforeEach(async()=>{
  vi.useFakeTimers();
  h.placed=[];h.starts=0;h.moves=0;h.stops=0;h.painter=null;h.previews=[];h.previewStops=0;h.previewEnd=()=>{};vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);
  vi.stubGlobal('matchMedia',()=>({matches:true}));vi.stubGlobal('requestAnimationFrame',()=>1);vi.stubGlobal('cancelAnimationFrame',()=>{});
  host=document.createElement('div');document.body.append(host);root=createRoot(host);
  await act(async()=>root.render(<BirdStudio/>));
});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.unstubAllGlobals();vi.useRealTimers();});
describe('one bird, an opening haiku, a shared palette and a final title',()=>{
  it('reveals the touched feather’s haiku immediately with its song, without a confirmation',async()=>{
    expect(host.querySelectorAll('.feather-choice')).toHaveLength(8);
    expect(host.querySelector('.trio-start')).toBeNull();
    await click(host.querySelector('.feather-choice[data-bird=mesange]')!);
    expect(h.previews).toEqual(['mesange']);expect(host.querySelector('.flow-poem')).not.toBeNull();
    expect(host.querySelectorAll('.poem-invitation .poem-lines>span')).toHaveLength(3);
    expect(host.querySelector('.feather-circle')).toBeNull();expect(h.starts).toBe(0);
    await click(host.querySelector('.enter-atelier')!);await water();expect(host.querySelectorAll('.bird-pad')).toHaveLength(1);
  });
  it('can suspend the gusts before catching a feather with a single choice',async()=>{
    const motion=host.querySelector<HTMLButtonElement>('.feather-motion')!;await click(motion);
    expect(motion.getAttribute('aria-pressed')).toBe('true');expect(host.querySelector('.feather-circle.is-paused')).not.toBeNull();
    await click(host.querySelector('.feather-choice[data-bird=pie]')!);expect(h.previews).toEqual(['pie']);
    expect(host.querySelector('.flow-poem')).not.toBeNull();expect(h.starts).toBe(0);
  });
  it('shows the haiku before painting, then offers water and a plume on the same canvas',async()=>{
    expect(host.querySelectorAll('.ritual-progress li')).toHaveLength(5);
    await encounter();
    const verses=[...host.querySelectorAll('.poem-invitation .poem-lines>span')].map(el=>el.textContent);
    expect(verses).toHaveLength(3);expect(host.querySelector('.artwork-title')).not.toBeNull();expect(h.starts).toBe(0);
    await click(host.querySelector('.enter-atelier')!);
    expect(button('Choisir l’eau résonante').getAttribute('aria-pressed')).toBe('true');
    const painter=h.painter,canvas=host.querySelector('canvas');await water();
    expect(painter!.wetBrush).toHaveBeenCalled();expect(h.starts).toBe(0);
    expect(host.querySelector('canvas')).toBe(canvas);expect(h.painter).toBe(painter);
    expect(host.querySelector('.flow-paint')).not.toBeNull();
    expect(host.querySelector<HTMLButtonElement>('.finalize-art')!.disabled).toBe(true);
    expect([...host.querySelectorAll('.paper-footer .poem-lines>span')].map(el=>el.textContent)).toEqual(verses);
    expect(host.querySelector('.water-ready')).toBeNull();expect(host.querySelector('.share-art')).toBeNull();
  });
  it('keeps title and haiku on protected paper areas throughout painting and drying',async()=>{
    await paint();expect(host.querySelector('.artwork-title')).not.toBeNull();
    const openingVerses=[...host.querySelectorAll('.paper-footer .poem-lines>span')].map(el=>el.textContent);
    await click(host.querySelector('.finalize-art')!);
    expect(host.querySelector('.flow-drying')).not.toBeNull();expect(h.painter!.resume).toHaveBeenCalledOnce();expect(host.querySelector('.artwork-title')).not.toBeNull();
    const starts=h.starts,paper=host.querySelector<HTMLElement>('.bird-paper')!;
    await act(async()=>paper.dispatchEvent(new KeyboardEvent('keydown',{key:' ',bubbles:true})));
    expect(h.starts).toBe(starts);
    await act(async()=>h.painter!.complete());
    expect(host.querySelector('.flow-finished')).not.toBeNull();expect(host.querySelector('.share-art')).not.toBeNull();expect(host.querySelector('.download-art')).not.toBeNull();expect(BIRD_POETICS[h.previews.at(-1)! as keyof typeof BIRD_POETICS].titles).toContain(host.querySelector('.artwork-title h2')!.textContent);
    const lines=[...host.querySelectorAll('.paper-footer .artwork-poem .poem-lines>span')];
    expect(lines).toHaveLength(3);expect(lines.map(el=>el.textContent)).toEqual(openingVerses);
    const trio=[h.previews.at(-1)!] as (keyof typeof BIRD_POETICS)[];
    const voices=lines.map((line,i)=>trio.find(id=>BIRD_POETICS[id].lines[i].includes(line.textContent!)));
    expect(voices.every(Boolean)).toBe(true);expect(new Set(voices).size).toBe(1);
    const children=[...host.querySelector('.artwork-paper')!.children];
    expect(children.findIndex(el=>el.classList.contains('artwork-title'))).toBeLessThan(children.findIndex(el=>el.classList.contains('bird-paper')));
    expect(children.findIndex(el=>el.classList.contains('paper-footer'))).toBeGreaterThan(children.findIndex(el=>el.classList.contains('bird-paper')));
    await click(host.querySelector('.resume-art')!);expect(host.querySelector('.artwork-title')).not.toBeNull();expect(host.querySelector('.flow-paint')).not.toBeNull();
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
  it('keeps colour, size and opacity accessible and can collapse the dock without losing the canvas',async()=>{
    await encounter();await click(host.querySelector('.enter-atelier')!);await water();
    const canvas=host.querySelector('canvas');
    expect(host.querySelectorAll('.palette-sliders input[type=range]')).toHaveLength(2);
    expect(host.querySelectorAll('.feather-colours button').length).toBeGreaterThan(6);
    expect(host.querySelector('[aria-label^="Opacité de la plume"]')).not.toBeNull();
    await click(button('Réduire la palette'));expect(host.querySelector('.palette-settings')).toBeNull();
    expect(host.querySelector('.creation-palette.is-collapsed')).not.toBeNull();
    await click(button('Déployer la palette'));expect(host.querySelectorAll('.palette-sliders input')).toHaveLength(2);
    expect(host.querySelector('canvas')).toBe(canvas);expect(h.starts).toBe(0);
    await click(button('Choisir l’eau résonante'));expect(host.querySelector('[aria-label="Quantité d’eau"]')).not.toBeNull();
  });
  it('keeps a feather tip at the keyboard drawing position and replaces all bird silhouettes',async()=>{
    expect(host.querySelector('.bird-wordmark')!.getAttribute('aria-label')).toBe("Plume d’Haïkuarelle");
    expect(host.querySelectorAll('.feather-choice .feather-glyph')).toHaveLength(8);
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
    await encounter();
    await click(host.querySelector('.enter-atelier')!);await water();
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
    await act(async()=>h.painter!.complete());expect(host.querySelector('.artwork-title')).not.toBeNull();
    await click(host.querySelector('.finalize-art')!);expect(host.querySelector('.flow-finished')).not.toBeNull();
    const clear=[...host.querySelectorAll('button')].find(b=>b.textContent==='Effacer tout')!;await click(clear);
    expect(host.querySelector('.flow-paint')).not.toBeNull();expect(host.querySelector('.bird-pads')).not.toBeNull();expect(host.querySelector('.artwork-title')).not.toBeNull();
    expect(button('Choisir l’eau résonante').getAttribute('aria-pressed')).toBe('true');
  });
});

it('can paint dry, then rewet without cancelling the full sample or replacing the canvas',async()=>{
  await encounter();await click(host.querySelector('.enter-atelier')!);
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
it('selects one plumage colour, keeps the same bird song and can restore the multicolour brush',async()=>{
  await encounter();await click(host.querySelector('.enter-atelier')!);
  await click(host.querySelector('.bird-pad')!);
  const swatches=host.querySelectorAll<HTMLButtonElement>('.feather-colours button:not(.whole-plumage)');
  expect(swatches.length).toBeGreaterThanOrEqual(6);await click(swatches[0]);
  expect(host.querySelector('.palette-settings')).not.toBeNull();expect(host.querySelector('.feather-colours [aria-pressed=true]')).toBe(swatches[0]);
  const paper=host.querySelector<HTMLElement>('.bird-paper')!;
  const deposit=async()=>{await act(async()=>paper.dispatchEvent(new KeyboardEvent('keydown',{key:' ',bubbles:true})));await act(async()=>paper.dispatchEvent(new KeyboardEvent('keyup',{key:' ',bubbles:true})));await act(async()=>h.finish());};
  await deposit();expect(h.placed.at(-1)!.pigmentSlot).toBe(11);expect(h.placed.at(-1)!.id).toBe(h.previews.at(-1));
  await click(host.querySelector('.bird-pad')!);await click(host.querySelector('.whole-plumage')!);await deposit();
  expect(h.placed.at(-1)!.pigmentSlot).toBeUndefined();expect(h.placed.at(-1)!.id).toBe(h.placed[0].id);
});
