// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import type {EngineStatus,Point} from '../src/engine/types';
import type {Bird} from '../src/birds/catalog';
import {BirdStudio} from '../src/App';
interface TestPainter {status:EngineStatus;complete:()=>void;mark:()=>void;wetBrush:ReturnType<typeof vi.fn>;resume:ReturnType<typeof vi.fn>;capturePreview:ReturnType<typeof vi.fn>}
const h=vi.hoisted(()=>({painter:null as TestPainter|null,starts:0,moves:0,stops:0,finish:()=>{},previews:[] as string[],previewStops:0,previewEnd:()=>{}}));
vi.mock('../src/engine/WatercolorEngine',()=>({HaikuarelleEngine:class{
  status:EngineStatus={seed:0,progress:0,phase:'idle',paused:true,fps:30,ticks:0};composition={duration:20};
  constructor(_canvas:unknown,_settings:unknown,private change:(s:EngineStatus)=>void){h.painter=this;}
  beginSignature(seed:number){this.status={...this.status,seed,phase:'idle',ticks:0,hasPigment:false};this.change({...this.status});}
  update(){}setBrushSize(){}destroy(){}pause(){}liftWaterBrush(){}holdWater(){}
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
  preload(){}async prepare(){}
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
  await click(host.querySelector('.water-ready')!);
}
async function paint(){
  for(const bird of ['Geai','Bouvreuil','Mésange bleue'])await click(button(`Choisir la plume ${bird}`));
  await click(host.querySelector('.trio-start button')!);
  await water();
  const paper=host.querySelector<HTMLElement>('.bird-paper')!;
  await act(async()=>paper.dispatchEvent(new KeyboardEvent('keydown',{key:' ',bubbles:true})));
  await act(async()=>paper.dispatchEvent(new KeyboardEvent('keyup',{key:' ',bubbles:true})));
  await act(async()=>h.finish());
}
beforeEach(async()=>{
  h.starts=0;h.moves=0;h.stops=0;h.painter=null;h.previews=[];h.previewStops=0;h.previewEnd=()=>{};vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);
  vi.stubGlobal('matchMedia',()=>({matches:true}));vi.stubGlobal('requestAnimationFrame',()=>1);vi.stubGlobal('cancelAnimationFrame',()=>{});
  host=document.createElement('div');document.body.append(host);root=createRoot(host);
  await act(async()=>root.render(<BirdStudio/>));
});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.unstubAllGlobals();});
describe('choose three birds, paint, finalize',()=>{
  it('requires three distinct choices, previews their sounds and never deposits during selection',async()=>{
    const start=host.querySelector<HTMLButtonElement>('.trio-start button')!;expect(start.disabled).toBe(true);
    for(const bird of ['Geai','Bouvreuil','Mésange bleue'])await click(button(`Choisir la plume ${bird}`));
    expect(start.disabled).toBe(false);expect(button('Choisir la plume Corneille').disabled).toBe(true);expect(h.starts).toBe(0);
    await click(button('Choisir la plume Geai'));expect(start.disabled).toBe(true);
    await click(button('Choisir la plume Sittelle'));await click(start);
    expect(host.querySelector('.flow-water')).not.toBeNull();expect(host.querySelector<HTMLButtonElement>('.water-ready')!.disabled).toBe(false);
    expect(host.querySelector('.artwork-title')).toBeNull();expect(host.querySelector('.artwork-poem')).toBeNull();
    expect(h.starts).toBe(0);
  });
  it('previews selected plumes without pigment and stops preview before the water ritual',async()=>{
    expect(host.querySelector('#trio-title')!.textContent).toContain('Trois plumes sonores');
    await click(button('Choisir la plume Geai'));
    expect(h.previews).toEqual(['geai']);expect(host.querySelectorAll('.trio-bird.is-previewing')).toHaveLength(1);
    expect(h.starts).toBe(0);expect(h.painter!.status.hasPigment).toBe(false);
    await click(button('Choisir la plume Geai'));
    expect(host.querySelector('.is-previewing')).toBeNull();expect(h.previews).toHaveLength(1);
    for(const bird of ['Geai','Bouvreuil','Pie'])await click(button(`Choisir la plume ${bird}`));
    const previews=h.previews.length;
    await click(host.querySelector('.trio-start button')!);
    expect(host.querySelector('.is-previewing')).toBeNull();expect(host.querySelector('.flow-water')).not.toBeNull();
    await water();expect(h.previews).toHaveLength(previews);expect(h.starts).toBe(0);
  });
  it('offers silent water preparation and requires pigment before drying',async()=>{
    expect(host.querySelectorAll('.ritual-progress li')).toHaveLength(5);
    for(const bird of ['Pie','Geai','Corneille'])await click(button(`Choisir la plume ${bird}`));
    await click(host.querySelector('.trio-start button')!);
    expect(host.querySelector('#ritual-title')!.textContent).toBe('Dépose l’eau du silence sur ta toile');
    expect(host.querySelector('.water-ready')!.hasAttribute('disabled')).toBe(false);
    expect(host.querySelector('.bird-pads')).toBeNull();
    const painter=h.painter;
    await water();
    expect(painter!.wetBrush).toHaveBeenCalled();expect(h.starts).toBe(0);
    expect(h.painter).toBe(painter);
    expect(host.querySelector('.flow-paint')).not.toBeNull();
    expect(host.querySelector('.finalize-art')!.hasAttribute('disabled')).toBe(true);
    expect(host.querySelector('.ritual-progress [aria-current="step"]')!.textContent).toContain('Les chants');
    expect(host.querySelector('.share-art')).toBeNull();
  });
  it('waits for real marks and final drying before revealing words above and below the canvas',async()=>{
    await paint();expect(host.querySelector('.artwork-title')).toBeNull();
    await click(host.querySelector('.finalize-art')!);
    expect(host.querySelector('.flow-drying')).not.toBeNull();expect(h.painter!.resume).toHaveBeenCalledOnce();expect(host.querySelector('.artwork-poem')).toBeNull();
    const starts=h.starts,paper=host.querySelector<HTMLElement>('.bird-paper')!;
    await act(async()=>paper.dispatchEvent(new KeyboardEvent('keydown',{key:' ',bubbles:true})));
    expect(h.starts).toBe(starts);
    await act(async()=>h.painter!.complete());
    expect(host.querySelector('.flow-finished')).not.toBeNull();expect(host.querySelector('.share-art')).not.toBeNull();expect(host.querySelector('.download-art')).not.toBeNull();expect(host.querySelector('.artwork-title h2')!.textContent).toMatch(/azur|ciel/);
    expect(host.querySelectorAll('.artwork-poem .poem-lines>span')).toHaveLength(3);
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
    expect(host.querySelectorAll('.bird-pads button')).toHaveLength(3);
    expect(host.querySelector<HTMLButtonElement>('.finalize-art')!.disabled).toBe(false);
    await click(toggle);await click(host.querySelector('.canvas-restore')!);
    expect(host.querySelector('.canvas-only')).toBeNull();
  });
  it('offers eight choices including Pie and retains exactly three brushes with contextual controls',async()=>{
    expect(host.querySelectorAll('.trio-bird')).toHaveLength(8);
    for(const name of ['Pie','Geai','Corneille'])await click(button(`Choisir la plume ${name}`));
    await click(host.querySelector('.trio-start button')!);
    await water();
    const brushes=host.querySelectorAll<HTMLButtonElement>('.bird-pads .bird-pad');
    expect(brushes).toHaveLength(3);await click(brushes[0]);
    expect(host.querySelector('.brush-context')!.getAttribute('aria-label')).toBe('Réglages de la plume Pie');
    expect(host.querySelector('[aria-label="Taille de la plume Pie"]')).not.toBeNull();
    expect(host.querySelector('[aria-label="Opacité de la plume Pie"]')).not.toBeNull();
    expect(h.starts).toBe(0);
    expect(host.querySelectorAll('input[type=range]')).toHaveLength(2);
    await click(brushes[1]);expect(host.querySelectorAll('.brush-context')).toHaveLength(1);
    expect(host.querySelector('.brush-context')!.textContent).toContain('Geai');
    await click(button('Fermer les réglages de la plume'));
    expect(host.querySelector('.brush-context')).toBeNull();expect(document.activeElement).toBe(brushes[1]);
  });
  it('keeps a feather tip at the keyboard drawing position and replaces all bird silhouettes',async()=>{
    expect(host.querySelector('.bird-wordmark')!.getAttribute('aria-label')).toBe("HAÏKUARELLE des trois plumes");
    expect(host.querySelectorAll('.trio-bird .feather-glyph')).toHaveLength(8);
    expect(host.querySelector('.bird-glyph')).toBeNull();
    await paint();
    expect(host.querySelectorAll('.bird-pad .feather-glyph')).toHaveLength(3);
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
    for(const bird of ['Geai','Bouvreuil','Pie'])await click(button(`Choisir la plume ${bird}`));
    await click(host.querySelector('.trio-start button')!);await water();
    const paper=host.querySelector<HTMLElement>('.bird-paper')!;
    const stopped=h.stops,moves=h.moves;
    await act(async()=>paper.dispatchEvent(new KeyboardEvent('keydown',{key:' ',bubbles:true})));
    await act(async()=>paper.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true})));
    await act(async()=>paper.dispatchEvent(new KeyboardEvent('keyup',{key:' ',bubbles:true})));
    expect(h.starts).toBe(1);expect(h.stops).toBe(stopped);expect(h.moves).toBe(moves+1);
    expect(host.querySelector('.finalize-art')!.hasAttribute('disabled')).toBe(true);
    await click(host.querySelectorAll<HTMLButtonElement>('.bird-pad')[1]);
    expect(h.stops).toBe(stopped);expect(h.starts).toBe(1);
    await act(async()=>h.finish());
    expect(host.querySelector('.finalize-art')!.hasAttribute('disabled')).toBe(false);
  });
  it('cancels a pending revelation when the user resumes or clears, keeping the selected trio',async()=>{
    await paint();await click(host.querySelector('.finalize-art')!);await click(host.querySelector('.artwork-drying button')!);
    await act(async()=>h.painter!.complete());expect(host.querySelector('.artwork-title')).toBeNull();
    await click(host.querySelector('.finalize-art')!);expect(host.querySelector('.flow-finished')).not.toBeNull();
    const clear=[...host.querySelectorAll('button')].find(b=>b.textContent==='Effacer tout')!;await click(clear);
    expect(host.querySelector('.flow-water')).not.toBeNull();expect(host.querySelector('.bird-pads')).toBeNull();expect(host.querySelector('.artwork-title')).toBeNull();
    expect(host.querySelector<HTMLButtonElement>('.water-ready')!.disabled).toBe(false);
  });
});

it('can skip water preparation and deposit spontaneously on dry paper',async()=>{
  for(const bird of ['Pie','Geai','Corneille'])await click(button(`Choisir la plume ${bird}`));
  await click(host.querySelector('.trio-start button')!);
  expect(host.querySelector('.water-ready')!.textContent).toContain('Peindre sur le papier sec');
  await click(host.querySelector('.water-ready')!);expect(h.painter!.wetBrush).not.toHaveBeenCalled();
  const paper=host.querySelector<HTMLElement>('.bird-paper')!;
  await act(async()=>paper.dispatchEvent(new KeyboardEvent('keydown',{key:' ',bubbles:true})));
  expect(h.starts).toBe(1);expect(host.querySelector('.bird-live')!.textContent).not.toContain('zone humide');
});
