// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import type {EngineStatus,Point} from '../src/engine/types';
import type {Bird} from '../src/birds/catalog';
import {BirdStudio} from '../src/App';
interface TestPainter {status:EngineStatus;complete:()=>void;mark:()=>void;resume:ReturnType<typeof vi.fn>;capturePreview:ReturnType<typeof vi.fn>}
const h=vi.hoisted(()=>({painter:null as TestPainter|null,starts:0,stops:0}));
vi.mock('../src/engine/WatercolorEngine',()=>({HaikuarelleEngine:class{
  status:EngineStatus={seed:0,progress:0,phase:'idle',paused:true,fps:30,ticks:0};composition={duration:20};
  constructor(_canvas:unknown,_settings:unknown,private change:(s:EngineStatus)=>void){h.painter=this;}
  beginSignature(seed:number){this.status={...this.status,seed,phase:'idle',ticks:0,hasPigment:false};this.change({...this.status});}
  update(){}setBrushSize(){}destroy(){}pause(){}
  resume=vi.fn(()=>{this.status.paused=false;this.change({...this.status});});
  mark=()=>{this.status={...this.status,hasPigment:true,phase:'wash',ticks:50};this.change({...this.status});};
  complete=()=>{this.status={...this.status,hasPigment:true,phase:'complete',progress:1,ticks:600};this.change({...this.status});};
  capturePreview=vi.fn(()=>{
    const width=20,height=30,pixels=new Uint8Array(width*height*4);
    for(let y=0;y<height;y++)for(let x=0;x<width;x++)pixels.set(x>=6&&x<14&&y>=6&&y<24?[70,130,190,255]:[247,244,236,255],(y*width+x)*4);
    return {width,height,pixels};
  });
}}));
vi.mock('../src/birds/BirdAudioBank',()=>({BirdAudioBank:class{preload(){}async prepare(){}destroy(){}}}));
vi.mock('../src/birds/DirectBrush',()=>({DirectBrush:class{
  constructor(_sounds:unknown,_painter:unknown,private callbacks:{started:(b:Bird)=>void;stopped:()=>void;marked:(b:Bird,p:Point,s:number)=>void}){}
  async begin(bird:Bird,point:Point,_time:number,_pressure:number,seed:number){h.starts++;this.callbacks.started(bird);h.painter!.mark();this.callbacks.marked(bird,point,seed);}
  move(){}breakPath(){}end(){h.stops++;this.callbacks.stopped();}
}}));
let root:Root,host:HTMLDivElement;
const button=(label:string)=>host.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;
const click=async(element:HTMLElement)=>{await act(async()=>element.click());};
async function paint(){
  for(const bird of ['Geai','Bouvreuil','Mésange bleue'])await click(button(`Choisir ${bird}`));
  await click(host.querySelector('.trio-start button')!);
  const paper=host.querySelector<HTMLElement>('.bird-paper')!;
  await act(async()=>paper.dispatchEvent(new KeyboardEvent('keydown',{key:' ',bubbles:true})));
  await act(async()=>paper.dispatchEvent(new KeyboardEvent('keyup',{key:' ',bubbles:true})));
}
beforeEach(async()=>{
  h.starts=0;h.stops=0;h.painter=null;vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);
  vi.stubGlobal('matchMedia',()=>({matches:true}));vi.stubGlobal('requestAnimationFrame',()=>1);vi.stubGlobal('cancelAnimationFrame',()=>{});
  host=document.createElement('div');document.body.append(host);root=createRoot(host);
  await act(async()=>root.render(<BirdStudio/>));
});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.unstubAllGlobals();});
describe('choose three birds, paint, finalize',()=>{
  it('requires exactly three distinct choices and never starts a sound from selection',async()=>{
    const start=host.querySelector<HTMLButtonElement>('.trio-start button')!;expect(start.disabled).toBe(true);
    for(const bird of ['Geai','Bouvreuil','Mésange bleue'])await click(button(`Choisir ${bird}`));
    expect(start.disabled).toBe(false);expect(button('Choisir Corneille').disabled).toBe(true);expect(h.starts).toBe(0);
    await click(button('Choisir Geai'));expect(start.disabled).toBe(true);
    await click(button('Choisir Sittelle'));await click(start);
    expect(host.querySelectorAll('.bird-pads button')).toHaveLength(3);expect(host.querySelector('.artwork-title')).toBeNull();expect(host.querySelector('.artwork-poem')).toBeNull();
    expect(host.querySelector<HTMLButtonElement>('.finalize-art')!.disabled).toBe(true);
  });
  it('waits for real marks and final drying before revealing words above and below the canvas',async()=>{
    await paint();expect(host.querySelector('.artwork-title')).toBeNull();
    await click(host.querySelector('.finalize-art')!);
    expect(host.querySelector('.flow-drying')).not.toBeNull();expect(h.painter!.resume).toHaveBeenCalledOnce();expect(host.querySelector('.artwork-poem')).toBeNull();
    const starts=h.starts,paper=host.querySelector<HTMLElement>('.bird-paper')!;
    await act(async()=>paper.dispatchEvent(new KeyboardEvent('keydown',{key:' ',bubbles:true})));
    expect(h.starts).toBe(starts);
    await act(async()=>h.painter!.complete());
    expect(host.querySelector('.flow-finished')).not.toBeNull();expect(host.querySelector('.artwork-title h2')!.textContent).toMatch(/azur|ciel/);
    expect(host.querySelectorAll('.artwork-poem .poem-lines>span')).toHaveLength(3);
    const children=[...host.querySelector('.bird-stage')!.children];
    expect(children.findIndex(el=>el.classList.contains('artwork-title'))).toBeLessThan(children.findIndex(el=>el.classList.contains('bird-paper')));
    expect(children.findIndex(el=>el.classList.contains('artwork-poem'))).toBeGreaterThan(children.findIndex(el=>el.classList.contains('bird-paper')));
    await click(host.querySelector('.continue-art')!);expect(host.querySelector('.artwork-title')).toBeNull();expect(host.querySelector('.flow-paint')).not.toBeNull();
  });
  it('keeps the artwork and trio when hiding tools and restores commands with Escape',async()=>{
    await paint();
    const sheet=host.querySelector('.bird-paper'),painter=h.painter;
    const toggle=[...host.querySelectorAll('button')].find(b=>b.textContent==='Toile seule')!;
    expect(host.querySelector<HTMLDetailsElement>('.atelier-panel')!.open).toBe(false);
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
  it('cancels a pending revelation when the user resumes or clears, keeping the selected trio',async()=>{
    await paint();await click(host.querySelector('.finalize-art')!);await click(host.querySelector('.artwork-drying button')!);
    await act(async()=>h.painter!.complete());expect(host.querySelector('.artwork-title')).toBeNull();
    await click(host.querySelector('.finalize-art')!);expect(host.querySelector('.flow-finished')).not.toBeNull();
    const clear=[...host.querySelectorAll('button')].find(b=>b.textContent==='Effacer tout')!;await click(clear);
    expect(host.querySelector('.flow-paint')).not.toBeNull();expect(host.querySelectorAll('.bird-pads button')).toHaveLength(3);expect(host.querySelector('.artwork-title')).toBeNull();
    expect(host.querySelector<HTMLButtonElement>('.finalize-art')!.disabled).toBe(true);
  });
});
