import {describe,it,expect} from 'vitest';
import {compose,TICK_RATE,sampleGesture} from '../src/engine/composition';
import {PALETTES,inkRamp} from '../src/engine/palettes';
const settings={palette:'estuaire',granulation:.72,wetness:.64,complexity:.52};
describe('autonomous gesture grammar',()=>{
  it('replays the exact same score for the same uint32 seed',()=>{
    for(const seed of [0,1,240106,4294967295])expect(compose(seed,settings)).toEqual(compose(seed,settings));
  });
  it('offers five different structural families',()=>{
    const scores=[240105,240106,240107,240108,240109].map(s=>compose(s,settings));
    expect(new Set(scores.map(s=>s.title)).size).toBe(5);
    expect(new Set(scores.map(s=>JSON.stringify(s.gestures))).size).toBe(5);
  });
  it('keeps GPU budgets, a white margin and a final drying period over varied seeds',()=>{
    for(const complexity of [0,.52,1])for(let seed=0;seed<65;seed++){
      const score=compose(seed,{...settings,complexity});
      expect(score.gestures.every(g=>g.start+g.duration<16.1&&g.points.every(p=>p.x>=.09&&p.x<=.91&&p.y>=.09&&p.y<=.91))).toBe(true);
      let maxSegments=0,maxDrops=0;
      for(let tick=0;tick<24*TICK_RATE;tick++){
        const live=score.gestures.filter(g=>tick/TICK_RATE>=g.start&&tick/TICK_RATE<g.start+g.duration);
        maxSegments=Math.max(maxSegments,live.filter(g=>g.kind!=='bloom').length);
        maxDrops=Math.max(maxDrops,live.filter(g=>g.kind==='bloom').length);
      }
      expect(maxSegments).toBeLessThanOrEqual(16);expect(maxDrops).toBeLessThanOrEqual(4);
    }
  });
  it('responds to composition density and wetness',()=>{
    expect(compose(42,{...settings,complexity:1}).gestures.length).toBeGreaterThan(compose(42,{...settings,complexity:0}).gestures.length);
    expect(compose(42,{...settings,wetness:1})).not.toEqual(compose(42,{...settings,wetness:0}));
  });
  it('samples continuous paths without invalid values',()=>{
    for(const g of compose(42,settings).gestures)for(let tick=0;tick<=g.duration*TICK_RATE;tick++){
      const v=sampleGesture(g,g.start+tick/TICK_RATE);
      expect(Number.isFinite(v.radius)).toBe(true);expect(v.radius).toBeGreaterThan(0);
      expect(Math.hypot(v.b.x-v.a.x,v.b.y-v.a.y)).toBeLessThan(.05);
    }
  });
});
describe('pigment concentration ramps',()=>{
  it('has five palettes with three single-pigment ramps each',()=>{
    expect(PALETTES).toHaveLength(5);
    for(const p of PALETTES)for(const c of p.colors){const ramp=inkRamp(c,p.paper);expect(ramp).toHaveLength(5);expect(new Set(ramp).size).toBe(5);ramp.forEach(c=>expect(c).toMatch(/^#[\da-f]{6}$/));}
  });
});
