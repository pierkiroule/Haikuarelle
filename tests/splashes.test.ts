import {describe,expect,it} from 'vitest';
import {planSplashes} from '../src/birds/splashes';
import {WetPaper} from '../src/birds/WetPaper';

describe('sparse satellites outside the prepared water',()=>{
  it('is seeded, sometimes absent and never becomes a uniform cloud of particles',()=>{
    const water=new WetPaper('portrait');water.add({x:.25,y:.43},{x:.75,y:.53},.10,.45,0);
    const region=water.region({x:.5,y:.48},0,80);
    const samples=Array.from({length:50},(_,seed)=>planSplashes(seed,2,water,region,0,'portrait'));
    expect(samples.some(s=>s.length===0)).toBe(true);
    expect(samples.some(s=>s.length>=3)).toBe(true);
    for(const [seed,drops] of samples.entries()){
      expect(planSplashes(seed,2,water,region,0,'portrait')).toEqual(drops);
      expect(drops.length).toBeLessThanOrEqual(7);
      for(const drop of drops){
        expect(water.at(drop.b,0)).toBeLessThan(.008);
        expect(drop.slot).toBe(2);expect(drop.water).toBe(false);
        expect(drop.radius).toBeGreaterThan(.0008);expect(drop.radius).toBeLessThan(.005);
        for(const v of [drop.b.x,drop.b.y]){expect(v).toBeGreaterThanOrEqual(.025);expect(v).toBeLessThanOrEqual(.975);}
      }
    }
  });
  it('produces no outside drops when the basin is empty',()=>{
    const water=new WetPaper('landscape');
    expect(planSplashes(7,0,water,{sites:[],radius:.03,area:0},0,'landscape')).toEqual([]);
  });
});
