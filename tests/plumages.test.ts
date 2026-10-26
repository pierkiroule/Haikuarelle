import {describe,expect,it} from 'vitest';
import {absorptionTable,OPTICAL_UNIT} from '../src/vendor/pigment-drift/paint/optics';
import {hexToLinear} from '../src/vendor/pigment-drift/engine/color';
import {PLUMAGE_PIGMENTS,PLUMAGE_PALETTE} from '../src/engine/palettes';
import {BIRD_BRUSHES} from '../src/birds/catalog';
import {WetPaper} from '../src/birds/WetPaper';
import {SoundStain} from '../src/birds/SoundStain';
import {makeHaiku} from '../src/birds/haiku';
import type {AudioFrame} from '../src/audio/types';
const settings={palette:'plumages',format:'portrait' as const,granulation:.8,wetness:.6,complexity:.5,ink:.6,resonance:.96};
const note=(i:number):AudioFrame=>({time:i/30,rms:.1,energy:.75,bass:.1,mid:.5,treble:.4,brightness:.8,flux:i%9===0?.9:.1,width:0,balance:0,active:true});
describe('shared optical pigment field',()=>{
  it('recovers every pure pigment and mixes in absorption without a pad-dependent palette',()=>{
    const paper=hexToLinear(PLUMAGE_PALETTE.paper),table=absorptionTable(PLUMAGE_PIGMENTS,PLUMAGE_PALETTE.paper);
    for(let i=0;i<PLUMAGE_PIGMENTS.length;i++){
      const expected=hexToLinear(PLUMAGE_PIGMENTS[i]),a=table.slice(i*3,i*3+3);
      a.forEach((v,c)=>expect(paper[c]*Math.exp(-OPTICAL_UNIT*v)).toBeCloseTo(expected[c],6));
    }
    // A blue/yellow meeting is subtractive; it cannot make a bright RGB average.
    const mix=[0,1,2].map(c=>paper[c]*Math.exp(-OPTICAL_UNIT*(table[3*3+c]+table[4*3+c])*.5));
    expect(mix[1]).toBeGreaterThan(mix[0]);expect(mix[1]).toBeGreaterThan(mix[2]);
  });
  it('keeps coefficients of existing colours when more pigments are available',()=>{
    const before=absorptionTable(PLUMAGE_PIGMENTS.slice(0,3),PLUMAGE_PALETTE.paper).slice(0,9);
    expect(absorptionTable(PLUMAGE_PIGMENTS,PLUMAGE_PALETTE.paper).slice(0,9)).toEqual(before);
  });
});
describe('four plumage grammars',()=>{
  for(const bird of BIRD_BRUSHES.filter(b=>b.signature))it(`${bird.name}: audible, finite, reproducible and multicoloured`,()=>{
    const run=(ink=.6)=>{
      const water=new WetPaper('portrait');water.add({x:.18,y:.48},{x:.82,y:.52},.20,.45,0);
      const stain=new SoundStain(bird,934,{x:.5,y:.5},{...settings,ink},water,.7);
      expect(stain.step(undefined,0).segments).toEqual([]);
      return Array.from({length:90},(_,i)=>stain.step(note(i),i/30));
    };
    const frames=run(),segments=frames.flatMap(f=>f.segments),slots=new Set(segments.map(s=>s.slot));
    expect(run()).toEqual(frames);expect(run(0).map(f=>f.segments)).toEqual(frames.map(f=>f.segments));
    expect(slots.has(bird.slot)).toBe(true);expect(slots.size).toBeGreaterThan(1);
    expect([...slots].every(slot=>bird.plumage!.includes(slot))).toBe(true);
    expect(frames.every(f=>f.segments.length<=12)).toBe(true);
    if(bird.id==='picvert')expect(segments.filter(s=>s.slot===10).length).toBeLessThanOrEqual(3);
    expect(makeHaiku([{bird:bird.id,point:{x:.5,y:.5},seed:934}],'plumages',934)?.every(Boolean)).toBe(true);
  });
});
