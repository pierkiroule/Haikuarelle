// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import type {EngineStatus,Point} from '../src/engine/types';
import type {Bird} from '../src/birds/catalog';
import {BIRD_POETICS} from '../src/birds/ornithopoetry';
import {BirdStudio} from '../src/App';
interface TestPainter {status:EngineStatus;complete:()=>void;mark:()=>void;wetBrush:ReturnType<typeof vi.fn>;blow:ReturnType<typeof vi.fn>;liftBreath:ReturnType<typeof vi.fn>;resume:ReturnType<typeof vi.fn>;capturePreview:ReturnType<typeof vi.fn>;holdWater:ReturnType<typeof vi.fn>;setDrying:ReturnType<typeof vi.fn>}
const h=vi.hoisted(()=>({painter:null as TestPainter|null,starts:0,moves:0,stops:0,finish:()=>{},previews:[] as string[],previewStops:0,previewEnd:()=>{},placed:[] as Bird[]}));
vi.mock('../src/engine/WatercolorEngine',()=>({HaikuarelleEngine:class{
  status:EngineStatus={seed:0,progress:0,phase:'idle',paused:true,fps:30,ticks:0};composition={duration:20};
  constructor(_canvas:unknown,_settings:unknown,private change:(s:EngineStatus)=>void){h.painter=this;}
  beginSignature(seed:number){this.status={...this.status,seed,phase:'idle',ticks:0,hasPigment:false};this.change({...this.status});}
  startWaterSong(){}stopWaterSong(){}setBirdPalette(){}update(){}setBrushSize(){}destroy(){}pause(){}liftWaterBrush(){}
  holdWater=vi.fn();
  wetBrush=vi.fn();blow=vi.fn();liftBreath=vi.fn();
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
  submerge(){this.stop();}
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

  await water();
  const paper=host.querySelector<HTMLElement>('.bird-paper')!;
  await act(async()=>paper.dispatchEvent(new KeyboardEvent('keydown',{key:' ',bubbles:true})));
  await act(async()=>paper.dispatchEvent(new KeyboardEvent('keyup',{key:' ',bubbles:true})));
  await act(async()=>h.finish());
}
beforeEach(async()=>{
  vi.useFakeTimers();
  vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue({font:'',measureText:(text:string)=>({width:text.length*15})} as unknown as CanvasRenderingContext2D);
  h.placed=[];h.starts=0;h.moves=0;h.stops=0;h.painter=null;h.previews=[];h.previewStops=0;h.previewEnd=()=>{};vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);
  vi.stubGlobal('matchMedia',()=>({matches:true}));vi.stubGlobal('requestAnimationFrame',()=>1);vi.stubGlobal('cancelAnimationFrame',()=>{});
  host=document.createElement('div');document.body.append(host);root=createRoot(host);
  await act(async()=>root.render(<BirdStudio/>));
});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.unstubAllGlobals();vi.restoreAllMocks();vi.useRealTimers();});
describe('one bird, an opening haiku, a shared palette and a final title',()=>{
  it('reveals the touched feather’s haiku immediately with its song, without a confirmation',async()=>{
    expect(host.querySelectorAll('.feather-choice')).toHaveLength(8);
    expect(host.querySelector('.trio-start')).toBeNull();
    await click(host.querySelector('.feather-choice[data-bird=mesange]')!);
    expect(h.previews).toEqual(['mesange']);expect(host.querySelector('.flow-paint')).not.toBeNull();
    expect(host.querySelector('.poem-invitation')).toBeNull();expect(host.querySelector('.artwork-title')).toBeNull();
    expect(host.querySelector('.feather-circle')).toBeNull();expect(h.starts).toBe(0);
    await water();expect(host.querySelectorAll('.bird-pad')).toHaveLength(1);
  });
  it('can suspend the gusts before catching a feather with a single choice',async()=>{
    const motion=host.querySelector<HTMLButtonElement>('.feather-motion')!;await click(motion);
    expect(motion.getAttribute('aria-pressed')).toBe('true');expect(host.querySelector('.feather-circle.is-paused')).not.toBeNull();
    await click(host.querySelector('.feather-choice[data-bird=pie]')!);expect(h.previews).toEqual(['pie']);
    expect(host.querySelector('.flow-paint')).not.toBeNull();expect(h.starts).toBe(0);
  });
  it('uses the entire paper without an initial title or haiku',async()=>{
    expect(host.querySelectorAll('.ritual-progress li')).toHaveLength(4);await encounter();
    expect(host.querySelector('.artwork-title')).toBeNull();expect(host.querySelector('.paper-footer')).toBeNull();
    expect(host.querySelector('.resonant-haiku')).toBeNull();expect(host.querySelector('.paper-signature')!.textContent).toBe('•°○');
    expect(button('Choisir l’eau résonante').getAttribute('aria-pressed')).toBe('true');await water();expect(h.starts).toBe(0);
  });
  it('reveals three morphic verses after drying, lets the user place them and gates sharing until confirmation',async()=>{
    await paint();const canvas=host.querySelector('canvas');await click(host.querySelector('.finalize-art')!);
    expect(host.querySelector('.flow-drying')).not.toBeNull();expect(host.querySelector('.resonant-haiku')).toBeNull();
    expect(host.querySelector('.artwork-paper.is-drying')).not.toBeNull();expect(host.querySelector('.drying-feathers')).toBeNull();expect(host.querySelector<HTMLProgressElement>('.drying-progress progress')!.value).toBe(0);
    await act(async()=>h.painter!.complete());expect(host.querySelector('.flow-finished')).not.toBeNull();expect(host.querySelector('.drying-progress')).toBeNull();expect(host.querySelector('.artwork-paper.is-drying')).toBeNull();
    expect(host.querySelector('.resonant-haiku')).toBeNull();await click(host.querySelector('.reveal-haiku')!);
    const poem=host.querySelector<HTMLElement>('.resonant-haiku')!;expect(poem.children).toHaveLength(3);expect(host.querySelector('.artwork-title')).toBeNull();
    expect(host.querySelector<HTMLButtonElement>('.share-art')!.disabled).toBe(true);
    const title=host.querySelector<HTMLElement>('.resonant-title')!;expect(title.textContent!.toLowerCase()).toContain('geai');
    const titleTop=title.style.top,poemTop=poem.style.top;
    await act(async()=>title.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true})));
    expect(title.style.top).toBe(titleTop);expect(poem.style.top).toBe(poemTop);expect(title.tabIndex).toBe(-1);
    await click(host.querySelector('.place-haiku')!);expect(host.querySelector<HTMLButtonElement>('.share-art')!.disabled).toBe(false);expect(poem.classList.contains('is-editable')).toBe(false);
    expect(host.querySelector('.final-dedication')).toBeNull();expect(host.querySelector('.shared-attribution')!.textContent).toContain('pas de propriété exclusive');
    expect(host.querySelector('canvas')).toBe(canvas);await click(host.querySelector('.resume-art')!);expect(host.querySelector('.resonant-haiku')).toBeNull();expect(host.querySelector('.flow-paint')).not.toBeNull();
  });
  it('offers only painting controls and keeps both text blocks fixed',async()=>{
    await paint();await click(host.querySelector('.finalize-art')!);await act(async()=>h.painter!.complete());await click(host.querySelector('.reveal-haiku')!);
    expect(host.querySelector('.composition-tabs')).toBeNull();expect(host.querySelector('select')).toBeNull();expect(host.querySelector('input[type="color"]')).toBeNull();
    expect(host.querySelectorAll('.composition-editor input')).toHaveLength(1);expect(host.querySelector('[aria-label="Taille de la peinture"]')).not.toBeNull();
    const title=host.querySelector<HTMLElement>('.resonant-title')!,poem=host.querySelector<HTMLElement>('.resonant-haiku')!;
    expect(title.classList.contains('fixed-poetry')).toBe(true);expect(poem.children).toHaveLength(3);expect(parseFloat(title.style.top)).toBeLessThan(10);expect(parseFloat(poem.style.top)).toBeGreaterThan(70);
    await click(host.querySelector('.place-haiku')!);expect(host.querySelector('.painting-handle')).toBeNull();expect(host.querySelector('.fixed-poetry')).not.toBeNull();
  });
  it('places Ink directly after Souffle and uses the current bird song with independent ink settings',async()=>{
    await encounter();const breath=button('Choisir le souffle du vivant'),ink=button('Choisir Inkbird');expect(breath.nextElementSibling).toBe(ink);
    await click(ink);expect(ink.getAttribute('aria-pressed')).toBe('true');expect(host.querySelector('[aria-label="Couleur de l’encre"]')).not.toBeNull();expect(host.querySelector('[aria-label="Étendue du vol Inkbird"]')).not.toBeNull();expect(host.querySelector('[aria-label="Opacité de l’encre"]')).not.toBeNull();
    const paper=host.querySelector<HTMLElement>('.bird-paper')!;await act(async()=>paper.dispatchEvent(new KeyboardEvent('keydown',{key:' ',bubbles:true})));await act(async()=>paper.dispatchEvent(new KeyboardEvent('keyup',{key:' ',bubbles:true})));
    expect(host.querySelector('.inkbird-flight')).not.toBeNull();expect(h.placed.at(-1)?.inkTool).toBe(true);expect(h.placed.at(-1)?.id).toBe('geai');expect(h.placed.at(-1)?.color).toBe('#282423');
    const moves=h.moves;await act(async()=>{paper.dispatchEvent(new KeyboardEvent('keydown',{key:' ',bubbles:true}));paper.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));paper.dispatchEvent(new KeyboardEvent('keyup',{key:' ',bubbles:true}));});expect(h.moves).toBe(moves);
    const stops=h.stops;await click(host.querySelector('.bird-pad')!);expect(h.stops).toBe(stops);expect(ink.getAttribute('aria-pressed')).toBe('false');await act(async()=>h.finish());expect(host.querySelector('.inkbird-flight')).toBeNull();
  });
  it('enters an immersive atelier, reopens tool settings and leaves with Escape without recreating the painting',async()=>{
    await encounter();
    const canvas=host.querySelector('canvas'),painter=h.painter;
    expect(host.querySelector('.is-immersive')).not.toBeNull();expect(document.body.style.overflow).toBe('hidden');
    expect(host.querySelector('.palette-settings')).toBeNull();
    await click(button('Choisir l’eau résonante'));expect(host.querySelector('[aria-label="Quantité d’eau"]')).not.toBeNull();
    const paper=host.querySelector<HTMLElement>('.bird-paper')!;
    await act(async()=>paper.dispatchEvent(new KeyboardEvent('keydown',{key:' ',bubbles:true})));
    expect(host.querySelector('.palette-settings')).toBeNull();
    await act(async()=>paper.dispatchEvent(new KeyboardEvent('keyup',{key:' ',bubbles:true})));
    await act(async()=>document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})));
    expect(host.querySelector('.is-immersive')).toBeNull();expect(document.body.style.overflow).not.toBe('hidden');
    expect(host.querySelector('canvas')).toBe(canvas);expect(h.painter).toBe(painter);
    expect(h.starts).toBe(0);
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
    await encounter();await water();
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
    await water();
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
  await encounter();
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
  await encounter();
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

 it('offers breath with size only, supports keyboard gestures and never plays or deposits a new bird song',async()=>{
  await paint();const starts=h.starts,previews=h.previews.length;
  await click(button('Choisir le souffle du vivant'));
  expect(button('Choisir le souffle du vivant').getAttribute('aria-pressed')).toBe('true');
  expect(host.querySelector('input[aria-label="Taille du souffle"]')).not.toBeNull();
  expect(host.querySelector('input[aria-label^="Opacité"]')).toBeNull();
  const paper=host.querySelector<HTMLElement>('.bird-paper')!;
  await act(async()=>paper.dispatchEvent(new KeyboardEvent('keydown',{key:' ',bubbles:true})));
  await act(async()=>paper.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true})));
  expect(h.painter!.blow).toHaveBeenCalledTimes(2);
  await act(async()=>paper.dispatchEvent(new KeyboardEvent('keyup',{key:' ',bubbles:true})));
  expect(h.painter!.liftBreath).toHaveBeenCalled();
  expect(h.starts).toBe(starts);expect(h.previews).toHaveLength(previews);
 });
