import {describe,expect,it} from 'vitest';
import {SoundStain} from '../src/birds/SoundStain';
import {WetPaper} from '../src/birds/WetPaper';
import {BIRD_PADS} from '../src/birds/catalog';
import type {EngineSettings} from '../src/engine/types';
import type {AudioFrame} from '../src/audio/types';
const settings:EngineSettings={palette:'plumages',format:'portrait',granulation:.8,wetness:.53,complexity:.5,ink:.6,resonance:.96};
const note=(i:number,energy=.8):AudioFrame=>({time:i/30,rms:.1,energy,bass:.2,mid:.5,treble:.3,brightness:.6,flux:i%8===0?.9:.1,width:0,balance:0,active:true});
function water(){const w=new WetPaper('portrait');w.add({x:.2,y:.45},{x:.8,y:.55},.18,.45,0);return w;}
function render(seed=7,energy=.8,w=water(),size=.6){
  const stain=new SoundStain(BIRD_PADS[1],seed,{x:.5,y:.5},settings,w,size);
  return Array.from({length:60},(_,i)=>stain.step(note(i,energy),i/30));
}
describe('one sample dropped into water creates a finite stain',()=>{
  it('emits pigment without any moving brush but never in silence or without a frame',()=>{
    const s=new SoundStain(BIRD_PADS[0],7,{x:.5,y:.5},settings,water());
    expect(s.step(undefined,0).segments).toEqual([]);
    expect(s.step({...note(0),active:false},.03).segments).toEqual([]);
    expect(s.step(note(1),.06).segments.some(s=>!s.water)).toBe(true);
    expect(s.step(undefined,3).segments).toEqual([]);
  });
  it('is seeded, bounded and sensitive to both dynamics and wet paths',()=>{
    const a=render();expect(render()).toEqual(a);expect(render(8)).not.toEqual(a);
    expect(render(7,.15)).not.toEqual(a);
    const vertical=new WetPaper('portrait');vertical.add({x:.5,y:.2},{x:.5,y:.8},.06,.45,0);
    expect(render(7,.8,vertical)).not.toEqual(a);
    expect(render(7,.8,water(),.2)).not.toEqual(a);
    for(const frame of a){
      expect(frame.segments.length).toBeLessThanOrEqual(12);
      for(const s of frame.segments)for(const p of [s.a,s.b]){
        expect(p.x).toBeGreaterThanOrEqual(.025);expect(p.x).toBeLessThanOrEqual(.975);
        expect(p.y).toBeGreaterThanOrEqual(.025);expect(p.y).toBeLessThanOrEqual(.975);
      }
    }
  });
  it('keeps each bird in its real pigment channel with a grey companion for robin',()=>{
    for(const bird of BIRD_PADS){
      const s=new SoundStain(bird,8,{x:.5,y:.5},settings,water());
      const slots=new Set(s.step(note(0),0).segments.filter(s=>!s.water).map(s=>s.slot));
      expect(slots.has(bird.slot)).toBe(true);
      expect([...slots].every(slot=>slot===bird.slot||(bird.id==='rougegorge'&&slot===0))).toBe(true);
    }
  });
  it('opens the wash much more on a strong note than a quiet note',()=>{
    const weak=render(7,.12),strong=render(7,.95);
    const max=(frames:typeof weak)=>Math.max(...frames.flatMap(f=>f.segments.filter(s=>!s.wetOnly&&Math.hypot(s.b.x-s.a.x,s.b.y-s.a.y)>1e-6).map(s=>s.radius)));
    expect(max(strong)).toBeGreaterThan(max(weak)*1.6);
  });
  it('adjusts fine ink without changing the pigment paths',()=>{
    const run=(ink:number)=>{
      const s=new SoundStain(BIRD_PADS[1],7,{x:.5,y:.5},{...settings,ink},water());
      return Array.from({length:60},(_,i)=>s.step(note(i),i/30));
    };
    const noInk=run(0),withInk=run(1);
    expect(withInk.flatMap(f=>f.ink).length).toBeGreaterThan(0);
    expect(noInk.flatMap(f=>f.ink)).toEqual([]);
    expect(noInk.map(f=>f.segments)).toEqual(withInk.map(f=>f.segments));
    expect(withInk.flatMap(f=>f.ink).every(s=>s.points.length>=10)).toBe(true);
  });
  it('takes a short sample to both ends of a connected pool without entering another pool',()=>{
    const w=new WetPaper('portrait');w.add({x:.15,y:.45},{x:.85,y:.45},.075,.45,0);
    w.add({x:.75,y:.8},{x:.85,y:.8},.08,.45,0);
    const times=Array.from({length:18},(_,i)=>i/30);
    const s=new SoundStain(BIRD_PADS[2],19,{x:.5,y:.45},settings,w,.6,0,0,times);
    const segments=times.flatMap((t,i)=>s.step(note(i),t).segments).filter(s=>s.wetOnly);
    expect(segments.length).toBeGreaterThan(15);
    expect(Math.min(...segments.map(s=>s.b.x))).toBeLessThan(.2);
    expect(Math.max(...segments.map(s=>s.b.x))).toBeGreaterThan(.8);
    expect(segments.every(s=>s.b.y<.6&&w.at(s.b,0)>.025)).toBe(true);
    expect(s.step(undefined,1).segments).toEqual([]);
  });
});
