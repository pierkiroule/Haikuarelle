import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {HaikuarelleEngine} from '../src/engine/WatercolorEngine';
import {analyzePCM} from '../src/audio/analyze';
import {signal} from './audio.fixture';
import {BIRDS} from '../src/birds/catalog';

// Exercise the real facade and its clock; only GPU calls are replaced.
vi.mock('../src/vendor/pigment-drift/paint/engine',()=>({
  Kind:{Paint:0,Water:1,Lift:2},
  PaintEngine:class{
    canvas:HTMLCanvasElement;gl={};ready=false;k=1;isContextLost=false;
    newSheet=vi.fn(()=>{this.ready=true;});setLook=vi.fn();setView=vi.fn();
    step=vi.fn();render=vi.fn();dispose=vi.fn();
    constructor(canvas:HTMLCanvasElement){this.canvas=canvas;}
  },
}));
vi.mock('../src/engine/FineInkRenderer',()=>({
  FineInkRenderer:class{setStrokes=vi.fn();appendStrokes=vi.fn();draw=vi.fn();destroy=vi.fn();},
}));

const music=analyzePCM(signal('music'));
const silence=analyzePCM(signal('silence'));
let callbacks:Map<number,FrameRequestCallback>,nextFrame:number;
let engine:HaikuarelleEngine;
function open(requireAudio=true){
  const canvas={getBoundingClientRect:()=>({width:640,height:360}),addEventListener:vi.fn(),removeEventListener:vi.fn()} as unknown as HTMLCanvasElement;
  engine=new HaikuarelleEngine(canvas,{},undefined,undefined,{requireAudio});return engine;
}
function frame(time:number){
  const [id,callback]=callbacks.entries().next().value!;callbacks.delete(id);callback(time);
}
beforeEach(()=>{
  callbacks=new Map();nextFrame=0;
  vi.stubGlobal('document',{hidden:false,addEventListener:vi.fn(),removeEventListener:vi.fn()});
  vi.stubGlobal('devicePixelRatio',1);vi.stubGlobal('matchMedia',()=>({matches:false}));
  vi.stubGlobal('ResizeObserver',class{observe(){}disconnect(){}});
  vi.stubGlobal('requestAnimationFrame',vi.fn((callback:FrameRequestCallback)=>{callbacks.set(++nextFrame,callback);return nextFrame;}));
  vi.stubGlobal('cancelAnimationFrame',vi.fn((id:number)=>callbacks.delete(id)));
});
afterEach(()=>{engine?.destroy();vi.unstubAllGlobals();});

describe('musical studio requires an analyzed source',()=>{
  it('stays on blank paper at startup and rejects generation, resume and injected gestures without audio',async()=>{
    const e=open();
    for(const seed of [0,42,240106])e.generate(seed);
    e.resume();e.deposit(.5,.5,'0');e.addWater(.5,.5,.7);await e.finish();
    expect(e.status).toMatchObject({phase:'idle',ticks:0,progress:0,paused:true});
    expect(e.composition.gestures).toEqual([]);expect(e.composition.ink).toEqual([]);
    expect(e.paint.step).not.toHaveBeenCalled();expect(callbacks.size).toBe(0);
  });
  it('cannot start from settings, format changes or visibility events while empty',()=>{
    const e=open();
    e.update({wetness:.9,complexity:.8,ink:.2,format:'portrait'});
    e.update({palette:'argile',granulation:.9});
    const visibility=vi.mocked(document.addEventListener).mock.calls.find(([name])=>name==='visibilitychange')![1] as EventListener;
    visibility({} as Event);e.resume();
    expect(e.status.phase).toBe('idle');expect(e.paint.step).not.toHaveBeenCalled();expect(callbacks.size).toBe(0);
  });
  it('runs the audio score, then immediately clears and cancels it when its source is removed',()=>{
    const e=open();e.setAudio(music);
    expect(e.hasAudio).toBe(true);expect(e.composition.source?.fingerprint).toBe(music.seed);
    frame(1);frame(101);expect(e.paint.step).toHaveBeenCalled();
    const staleCallback=[...callbacks.values()][0];vi.mocked(e.paint.step).mockClear();
    e.setAudio(null);staleCallback(201);e.resume();e.generate(123);
    expect(e.hasAudio).toBe(false);expect(e.status).toMatchObject({phase:'idle',ticks:0,paused:true});
    expect(e.composition.gestures).toHaveLength(0);expect(e.composition.ink).toHaveLength(0);
    expect(e.paint.step).not.toHaveBeenCalled();expect(callbacks.size).toBe(0);
  });
  it('leaves a silent recording blank with no animation ticks',()=>{
    const e=open();e.setAudio(silence);e.resume();e.generate(silence.seed);
    expect(e.hasAudio).toBe(true);expect(e.status.phase).toBe('idle');
    expect(e.composition.title).toBe('Le papier écoute le silence');
    expect(e.paint.step).not.toHaveBeenCalled();expect(callbacks.size).toBe(0);
  });
  it('can restart from a new audio source after clearing or silence',()=>{
    const e=open();e.setAudio(music);e.setAudio(null);e.setAudio(silence);e.setAudio(music);
    expect(e.status.phase).toBe('wetting');expect(e.composition.gestures.length).toBeGreaterThan(0);
    expect(callbacks.size).toBe(1);frame(1);frame(101);expect(e.paint.step).toHaveBeenCalled();
  });
  it('keeps explicit autonomous generation available to the reusable V1 API',()=>{
    const e=open(false);e.generate(123);
    expect(e.composition.source).toBeUndefined();expect(e.composition.gestures.length).toBeGreaterThan(0);
    expect(callbacks.size).toBe(1);
    e.setAudio(music);e.setAudio(null);
    expect(e.status.phase).toBe('idle');expect(callbacks.size).toBe(0);
  });
  it('places a bird phrase only on demand and stops deposits when its voice ends',()=>{
    const e=open();e.beginSignature(99);expect(callbacks.size).toBe(0);
    expect(e.playBird(silence,BIRDS[0],{x:.3,y:.6},4)).toBe(false);
    expect(e.playBird(music,BIRDS[0],{x:.3,y:.6},4)).toBe(true);
    frame(1);frame(101);expect(e.paint.step).toHaveBeenCalled();
    e.stopBird();vi.mocked(e.paint.step).mockClear();frame(201);
    for(const call of vi.mocked(e.paint.step).mock.calls){expect(call[2]).toHaveLength(0);expect(call[3]).toHaveLength(0);}
    expect(e.status.phase).toBe('drying');
    const tick=e.status.ticks;e.update({wetness:.8,complexity:.9,ink:.4});
    expect(e.status.ticks).toBe(tick);
    e.beginSignature(101);expect(e.status.phase).toBe('idle');expect(callbacks.size).toBe(0);
  });
  it('keeps water physics running but adds no pigment during a silent interval in a playing bird',()=>{
    const intermittent={...music,frames:music.frames.map(f=>({...f,active:f.time<.1||f.time>.8}))};
    const e=open();e.beginSignature(4);e.playBird(intermittent,BIRDS[0],{x:.4,y:.5},4);
    frame(1);frame(101);frame(201);vi.mocked(e.paint.step).mockClear();frame(301);
    expect(e.paint.step).toHaveBeenCalled();
    for(const call of vi.mocked(e.paint.step).mock.calls){expect(call[2]).toHaveLength(0);expect(call[3]).toHaveLength(0);}
  });
  it('arms a live brush without drawing until pointer movement, then stops on release and voice end',()=>{
    const e=open(),marked=vi.fn();e.beginSignature(7);
    e.startBirdBrush(music,BIRDS[0],7,.6,0,()=>.3,marked);
    frame(1);frame(101);
    for(const call of vi.mocked(e.paint.step).mock.calls)expect(call[2].filter(s=>s.strength>0||s.kind!==1||s.waterAmount!==0)).toHaveLength(0);
    e.moveBrush({x:.3,y:.6},100);e.moveBrush({x:.4,y:.6},130);vi.mocked(e.paint.step).mockClear();frame(201);
    expect(vi.mocked(e.paint.step).mock.calls.some(call=>call[2].length>0)).toBe(true);expect(marked).toHaveBeenCalledOnce();
    expect(e.status.hasPigment).toBe(true);expect(e.status.wetStrokes).toBeGreaterThan(0);
    e.liftBrush();vi.mocked(e.paint.step).mockClear();frame(301);
    for(const call of vi.mocked(e.paint.step).mock.calls)expect(call[2].filter(s=>s.strength>0||s.kind!==1||s.waterAmount!==0)).toHaveLength(0);
    e.stopBird();e.moveBrush({x:.8,y:.2},400);vi.mocked(e.paint.step).mockClear();frame(401);
    for(const call of vi.mocked(e.paint.step).mock.calls)expect(call[2].filter(s=>s.strength>0||s.kind!==1||s.waterAmount!==0)).toHaveLength(0);
    expect(e.status.phase).toBe('drying');
    expect(e.composition.duration).toBeGreaterThan(20);
  });
  it('uses the actual audio clock for a live brush instead of an overdue simulation tick',()=>{
    const e=open();e.beginSignature(7);e.startBirdBrush(music,BIRDS[0],7,.6,0,()=>1000);
    e.moveBrush({x:.4,y:.5},0);e.moveBrush({x:.5,y:.5},30);frame(1);frame(101);
    for(const call of vi.mocked(e.paint.step).mock.calls)expect(call[2]).toHaveLength(0);
  });
  it('allows explicit clear water without sound',()=>{
    const e=open();e.beginSignature(8);
    e.wetBrush({x:.4,y:.5},.7);e.wetBrush({x:.6,y:.5},.7);e.liftWaterBrush();
    frame(1);frame(101);
    const calls=vi.mocked(e.paint.step).mock.calls;
    expect(calls.some(c=>c[2].length>0)).toBe(true);
    expect(calls.flatMap(c=>c[2]).every(s=>s.kind===1)).toBe(true);
    expect(e.status.hasPigment).toBe(false);
    expect(e.waterAt({x:.5,y:.5})).toBeGreaterThan(.025);
  });
  it('sends water size and quantity to both the wet guide and the GPU without pigment',()=>{
    const e=open();e.beginSignature(8);e.wetBrush({x:.5,y:.5},.8,.5,.2);e.holdWater();
    const low=e.waterAt({x:.5,y:.5});
    const segment=vi.mocked(e.paint.step).mock.calls.flatMap(c=>c[2])[0];
    expect(segment.waterAmount).toBe(.2);expect(segment.radius).toBeGreaterThan(90);
    expect(low).toBeLessThan(.1);expect(low).toBeGreaterThan(.025);
    e.beginSignature(8);e.wetBrush({x:.5,y:.5},.1,.5,1);e.holdWater();
    expect(e.waterAt({x:.5,y:.5})).toBeGreaterThan(low*4);expect(e.status.hasPigment).toBe(false);
  });
  it('commits a quick silent water tap before holding preparation without drying it away',()=>{
    const e=open();e.beginSignature(8);e.wetBrush({x:.5,y:.5},.6);e.holdWater();
    const calls=vi.mocked(e.paint.step).mock.calls;
    expect(calls.flatMap(c=>c[2]).some(s=>s.kind===1)).toBe(true);
    expect(calls.flatMap(c=>c[2]).every(s=>s.kind===1)).toBe(true);
    expect(e.status.hasPigment).toBe(false);expect(e.status.paused).toBe(true);
    expect(callbacks.size).toBe(0);expect(e.waterAt({x:.5,y:.5})).toBeGreaterThan(.025);
  });
  it('deposits automatically from a wet spot only during audible sample time and then only dries',()=>{
    const e=open(),marked=vi.fn();let audioTime=.3;e.beginSignature(9);
    e.wetBrush({x:.5,y:.5},.9);e.liftWaterBrush();
    expect(e.startSoundStain(silence,BIRDS[0],{x:.5,y:.5},9)).toBe(false);
    expect(e.startSoundStain(music,BIRDS[0],{x:.5,y:.5},9,.6,0,()=>audioTime,marked)).toBe(true);
    frame(1);frame(101);
    expect(vi.mocked(e.paint.step).mock.calls.some(c=>c[2].some(s=>s.kind===0))).toBe(true);
    expect(marked).toHaveBeenCalledExactlyOnceWith({x:.5,y:.5});
    audioTime=-1;vi.mocked(e.paint.step).mockClear();frame(201);
    expect(vi.mocked(e.paint.step).mock.calls.flatMap(c=>c[2]).some(s=>s.kind===0)).toBe(false);
    e.stopBird();audioTime=.4;vi.mocked(e.paint.step).mockClear();frame(301);
    expect(vi.mocked(e.paint.step).mock.calls.flatMap(c=>c[2]).some(s=>s.kind===0)).toBe(false);
    expect(e.status.phase).toBe('drying');expect(e.composition.duration).toBeGreaterThan(20);
  });
});

it('preserves water through successive sound clocks and dries only in the ritual drying stage',async()=>{
  const e=open(),p={x:.5,y:.5};e.beginSignature(8);e.wetBrush(p,.7);e.holdWater();
  const initial=e.waterAt(p);
  expect(e.startSoundStain(music,BIRDS[0],p,8)).toBe(true);await e.finish();e.stopBird();
  expect(e.waterAt(p)).toBeCloseTo(initial);
  expect(e.startSoundStain(music,BIRDS[1],{x:.1,y:.1},9)).toBe(true);await e.finish();e.stopBird();
  expect(e.waterAt(p)).toBeCloseTo(initial);
  e.setDrying(true);await e.finish();expect(e.waterAt(p)).toBeLessThan(initial*.005);
  const remaining=e.waterAt(p);e.setDrying(false);e.resume();await e.finish();
  expect(e.waterAt(p)).toBeCloseTo(remaining);
});

it('commits new water over pigment without pausing its clock or draining the water',async()=>{
  const e=open(),p={x:.5,y:.5};e.beginSignature(8);
  expect(e.startSoundStain(music,BIRDS[0],p,8)).toBe(true);
  frame(0);frame(100);e.wetBrush(p,.7);e.holdWater(false);
  expect(e.status.paused).toBe(false);const wet=e.waterAt(p);expect(wet).toBeGreaterThan(0);
  await e.finish();expect(e.waterAt(p)).toBeGreaterThanOrEqual(wet);
  e.setDrying(true);await e.finish();expect(e.waterAt(p)).toBeLessThan(wet*.005);
});

it('rewetting living paint triggers bounded expanding water backruns, while clear water alone does not',async()=>{
  const e=open(),p={x:.5,y:.5};e.beginSignature(8);e.wetBrush(p,.7);e.holdWater();
  expect(vi.mocked(e.paint.step).mock.calls.flatMap(c=>c[3])).toHaveLength(0);
  expect(e.startSoundStain(music,BIRDS[0],p,8)).toBe(true);await e.finish();e.stopBird();
  vi.mocked(e.paint.step).mockClear();e.wetBrush(p,.7,.5,1);e.holdWater(false);frame(200);frame(300);
  const calls=vi.mocked(e.paint.step).mock.calls,backruns=calls.flatMap(c=>c[3]);
  expect(backruns.length).toBeGreaterThan(0);expect(backruns.every(d=>d.kind===1&&d.r1>=d.r0)).toBe(true);
  expect(calls.every(c=>c[3].length<=4)).toBe(true);
  expect(backruns.some(d=>d.r1>d.r0)).toBe(true);expect(e.waterAt(p)).toBeGreaterThan(0);
});

it('the live sound clock excites prepared water without depositing pigment or adding water',()=>{
  const e=open(),p={x:.5,y:.5};e.beginSignature(7);e.wetBrush(p,.8);e.holdWater();
  const before=e.waterAt(p),analysis={...music,frames:music.frames.map(f=>({...f,active:true,energy:.8,flux:.1}))};
  let audioTime=.3;expect(e.startSoundStain(analysis,BIRDS[0],p,7,.6,0,()=>audioTime,undefined,0)).toBe(true);
  vi.mocked(e.paint.step).mockClear();frame(100);frame(200);
  const forces=vi.mocked(e.paint.step).mock.calls.flatMap(c=>c[2]).filter(s=>s.kind===1&&s.strength===0&&s.waterAmount===0);
  expect(forces.length).toBeGreaterThan(0);expect(forces.some(s=>Math.hypot(s.fx,s.fy)>0)).toBe(true);
  expect(e.waterAt(p)).toBe(before);expect(e.status.hasPigment).toBe(false);
  e.setDrying(true);vi.mocked(e.paint.step).mockClear();audioTime=.4;frame(300);
  expect(vi.mocked(e.paint.step).mock.calls.flatMap(c=>c[2]).filter(s=>s.kind===1&&s.strength===0)).toEqual([]);
});

it('plays an immersed water clock through the fluid response without creating pigment marks',()=>{
 const e=open(),p={x:.5,y:.5};e.beginSignature(8);e.wetBrush(p,.7);e.holdWater();
 const initial=e.waterAt(p),analysis={...music,frames:music.frames.map(f=>({...f,active:true,energy:.8,flux:.1}))};
 e.startWaterSong(analysis,()=>.3,()=>.6);vi.mocked(e.paint.step).mockClear();frame(1);frame(101);
 const segs=vi.mocked(e.paint.step).mock.calls.flatMap(c=>c[2]);
 expect(segs.some(s=>s.coupling>0&&Math.hypot(s.fx,s.fy)>0)).toBe(true);
 expect(segs.every(s=>s.kind===1&&s.strength===0&&s.waterAmount===0)).toBe(true);
 expect(e.status.hasPigment).toBe(false);expect(e.waterAt(p)).toBe(initial);e.stopWaterSong();
});

it('breath drives wet pigment without depositing or refilling and stops accepting input during drying',()=>{
 const e=open(),p={x:.5,y:.5};e.beginSignature(8);e.wetBrush(p,.8);e.holdWater();
 const initial=e.waterAt(p);vi.mocked(e.paint.step).mockClear();
 e.blow(p,0,.6);e.blow({x:.51,y:.5},30,.6);frame(1);frame(101);
 const forces=vi.mocked(e.paint.step).mock.calls.flatMap(c=>c[2]);
 expect(forces.length).toBeGreaterThan(0);
 expect(forces.every(s=>s.kind===1&&s.strength===0&&s.waterAmount===0&&s.fx>0&&s.breath===true)).toBe(true);
 expect(e.status.hasPigment).toBe(false);expect(e.waterAt(p)).toBe(initial);
 e.liftBreath();vi.mocked(e.paint.step).mockClear();
 e.blow({x:.9,y:.9},150,.6);e.blow({x:.91,y:.9},180,.6);frame(201);
 expect(vi.mocked(e.paint.step).mock.calls.flatMap(c=>c[2])).toEqual([]);
 e.setDrying(true);e.blow(p,220,.6);e.blow({x:.51,y:.5},250,.6);frame(301);
 expect(vi.mocked(e.paint.step).mock.calls.flatMap(c=>c[2])).toEqual([]);
});
