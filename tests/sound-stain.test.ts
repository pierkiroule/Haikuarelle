import {describe,expect,it} from 'vitest';
import {SoundStain} from '../src/birds/SoundStain';
import {WetPaper,WET_FILM_THRESHOLD} from '../src/birds/WetPaper';
import {BIRD_PADS,BIRD_BRUSHES} from '../src/birds/catalog';
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
  it('keeps each brush within its own plumage',()=>{
    for(const bird of BIRD_PADS){
      const s=new SoundStain(bird,8,{x:.5,y:.5},settings,water());
      const slots=new Set(s.step(note(0),0).segments.filter(s=>!s.water).map(s=>s.slot));
      expect(slots.has(bird.slot)).toBe(true);
      expect([...slots].every(slot=>(bird.plumage??[bird.slot]).includes(slot))).toBe(true);
    }
  });
  it('opens the wash much more on a strong note than a quiet note',()=>{
    const weak=render(7,.12),strong=render(7,.95);
    const max=(frames:typeof weak)=>Math.max(...frames.flatMap(f=>f.segments.filter(s=>s.effect==='wash'&&Math.hypot(s.b.x-s.a.x,s.b.y-s.a.y)>1e-6).map(s=>s.radius)));
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
  it('scales every deposited pigment without altering wet paths and leaves opacity zero empty',()=>{
    for(const bird of BIRD_BRUSHES){
      const run=(opacity:number)=>{
        const stain=new SoundStain(bird,42,{x:.5,y:.5},settings,water(),.7,0,0,[],opacity);
        return Array.from({length:30},(_,i)=>stain.step(note(i),i/30));
      };
      const full=run(1),faint=run(.25);
      faint.forEach((f,i)=>f.segments.forEach((s,j)=>{expect(s.a).toEqual(full[i].segments[j].a);expect(s.b).toEqual(full[i].segments[j].b);expect(s.load).toBeCloseTo(full[i].segments[j].load*.25);}));
      expect(run(0).flatMap(f=>f.segments)).toEqual([]);
    }
  });
  it('keeps the Pie as separate black droplets throughout the wet basin',()=>{
    const stain=new SoundStain(BIRD_BRUSHES.find(b=>b.id==='pie')!,42,{x:.5,y:.5},settings,water(),.7);
    const frames=Array.from({length:60},(_,i)=>stain.step(note(i),i/30)),drops=frames.flatMap(f=>f.segments);
    expect(drops.length).toBeGreaterThan(20);
    expect(drops.every(s=>s.effect==='splash'&&s.slot===0&&s.wetOnly&&s.a===s.b)).toBe(true);
    expect(Math.max(...drops.map(s=>s.radius))).toBeGreaterThan(Math.min(...drops.map(s=>s.radius))*2);
    expect(frames.every(f=>f.segments.length<=12&&f.ink.length===0)).toBe(true);
  });
  it('keeps short deposits local rather than filling the entire pool',()=>{
    const w=new WetPaper('portrait');w.add({x:.15,y:.45},{x:.85,y:.45},.075,.45,0);
    w.add({x:.75,y:.8},{x:.85,y:.8},.08,.45,0);
    const times=Array.from({length:18},(_,i)=>i/30);
    const s=new SoundStain(BIRD_PADS[2],19,{x:.5,y:.45},settings,w,.6,0,0,times);
    const segments=times.flatMap((t,i)=>s.step(note(i),t).segments).filter(s=>s.wetOnly&&s.effect!=='splash');
    expect(segments.length).toBeGreaterThan(15);
    expect(Math.min(...segments.map(s=>s.b.x))).toBeGreaterThan(.25);
    expect(Math.max(...segments.map(s=>s.b.x))).toBeLessThan(.8);
    expect(segments.every(s=>s.b.y<.6&&w.at(s.b,0)>=WET_FILM_THRESHOLD)).toBe(true);
    expect(s.step(undefined,1).segments).toEqual([]);
  });
});

it('leaves visible pigment on dry paper without secretly wetting it',()=>{
  const w=new WetPaper('portrait'),stain=new SoundStain(BIRD_PADS[0],7,{x:.5,y:.5},settings,w);
  const drops=stain.step(note(0),0).segments;
  expect(drops.length).toBeGreaterThan(0);
  expect(drops.every(s=>!s.wetOnly&&s.waterAmount===0&&!s.water)).toBe(true);
  expect(w.at({x:.5,y:.5},0)).toBe(0);
});

it('connects the gesture on dry and wet cotton but never joins separate taps',()=>{
  for(const w of [new WetPaper('portrait'),water()]){
    const s=new SoundStain(BIRD_PADS[0],7,{x:.3,y:.5},settings,w);
    s.move({x:.6,y:.5},0);const f=s.step(note(0),0);
    expect(f.segments.some(d=>d.a.x===.3&&d.b.x===.6&&d.effect==='wash')).toBe(true);
    expect(f.segments.length).toBeLessThanOrEqual(12);
    s.move({x:.8,y:.8},.1,false);const tap=s.step(note(3),.1);
    expect(tap.segments.every(d=>!(d.a.x===.6&&d.b.x===.8))).toBe(true);
    expect(tap.segments.some(d=>d.a.x===.8&&d.b.x===.8)).toBe(true);
    expect(s.step({...note(4),active:false},.14).segments).toEqual([]);
  }
});

it('lays a wet glaze in a thin root instead of a broad dry deposit or remote splashes',()=>{
 const w=new WetPaper('portrait',Infinity),width=100,height=178,water=new Float32Array(width*height);
 for(let y=86;y<92;y++)for(let x=30;x<85;x++)water[y*width+x]=.012;
 w.replaceMoisture({width,height,water},0);
 const origin={x:.62,y:.5},s=new SoundStain({...BIRD_PADS[1],pigmentSlot:1},12,origin,settings,w,.5);
 s.move({x:.64,y:.5},0);
 const segments=Array.from({length:8},(_,i)=>s.step({...note(i),flux:.1},i/30)).flatMap(f=>f.segments);
 expect(segments.length).toBeGreaterThan(0);
 expect(segments.every(segment=>segment.wetOnly&&!segment.water&&segment.effect!=='splash')).toBe(true);
});
