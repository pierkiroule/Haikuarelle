import {describe,expect,it} from 'vitest';
import {WetPaper,dryingTime} from '../src/birds/WetPaper';
describe('explicit water preparation',()=>{
  it('uses a continuous physical stroke, leaves dry reserves and evaporates',()=>{
    const w=new WetPaper('portrait',6);
    w.add({x:.25,y:.4},{x:.75,y:.4},.07,.45,10);
    expect(w.at({x:.5,y:.4},10)).toBeCloseTo(.45);
    expect(w.at({x:.5,y:.8},10)).toBe(0);
    expect(w.at({x:.5,y:.4},16)).toBeCloseTo(.45/Math.E);
    expect(w.at({x:.5,y:.4},40)).toBeLessThan(.004);
  });
  it('measures brush width on the short edge on both formats',()=>{
    const a=new WetPaper('portrait'),b=new WetPaper('landscape');
    for(const w of [a,b])w.add({x:.5,y:.5},{x:.5,y:.5},.05,.45,0);
    expect(a.at({x:.54,y:.5},0)).toBeCloseTo(b.at({x:.5,y:.54},0));
    expect(dryingTime(.9)).toBeGreaterThan(dryingTime(.1));
  });
  it('changes the evaporation rate without rejuvenating old water',()=>{
    const w=new WetPaper('portrait',6);w.add({x:.5,y:.5},{x:.5,y:.5},.06,.45,0);
    const before=w.at({x:.5,y:.5},6);w.retime(6,12);
    expect(w.at({x:.5,y:.5},6)).toBeCloseTo(before);
    expect(w.at({x:.5,y:.5},18)).toBeCloseTo(before/Math.E);
  });
  it('visits the whole connected water shape and respects dry cuts',()=>{
    const w=new WetPaper('portrait');
    w.add({x:.12,y:.3},{x:.7,y:.3},.065,.45,0);
    w.add({x:.7,y:.3},{x:.7,y:.65},.065,.45,0);
    w.add({x:.2,y:.8},{x:.4,y:.8},.06,.45,0);
    const region=w.region({x:.15,y:.3},0,96);
    expect(region.sites.length).toBeGreaterThan(20);expect(region.sites.length).toBeLessThanOrEqual(96);
    expect(region.sites.some(s=>s.point.y>.62&&s.point.x>.65)).toBe(true);
    expect(region.sites.every(s=>s.point.y<.73)).toBe(true);
    expect(region.sites.map(s=>s.distance)).toEqual(region.sites.map(s=>s.distance).sort((a,b)=>a-b));
    expect(region.sites.every(s=>w.at(s.point,0)>=.025)).toBe(true);
    expect(w.region({x:.9,y:.9},0).sites).toEqual([]);
    expect(w.region({x:.15,y:.3},40).sites).toEqual([]);
  });
});
