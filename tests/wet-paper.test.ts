import {describe,expect,it} from 'vitest';
import {WetPaper,dryingTime,WET_FILM_THRESHOLD} from '../src/birds/WetPaper';
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
    expect(region.sites.every(s=>w.at(s.point,0)>=WET_FILM_THRESHOLD)).toBe(true);
    expect(w.region({x:.9,y:.9},0).sites).toEqual([]);
    expect(w.region({x:.15,y:.3},40).sites).toEqual([]);
  });
});

it('holds prepared water for multiple songs and evaporates only on request',()=>{
  const w=new WetPaper('portrait',Infinity),p={x:.5,y:.5};w.add(p,p,.07,.45,0);
  expect(w.at(p,600)).toBeCloseTo(.45);
  expect(w.region(p,600).sites.length).toBeGreaterThan(0);
  w.retime(600,6);expect(w.at(p,606)).toBeCloseTo(.45/Math.E);
  const remaining=w.at(p,606);w.hold(606);expect(w.at(p,1200)).toBeCloseTo(remaining);
});

it('uses the transported GPU water for later gestures, connected basins and drying',()=>{
 const paper=new WetPaper('portrait',Infinity);
 paper.add({x:.1,y:.5},{x:.1,y:.5},.05,.45,0);
 const width=20,height=32,water=new Float32Array(width*height);
 for(let y=12;y<20;y++)for(let x=10;x<19;x++)water[y*width+x]=.3;
 paper.replaceMoisture({width,height,water},3);
 expect(paper.at({x:.1,y:.5},3)).toBe(0);
 expect(paper.at({x:.85,y:.5},3)).toBeCloseTo(.3);
 expect(paper.region({x:.85,y:.5},3,24).sites.length).toBeGreaterThan(0);
 expect(paper.resonantSites(3).length).toBeGreaterThan(0);
 paper.retime(3,2);expect(paper.at({x:.85,y:.5},5)).toBeCloseTo(.3/Math.E);
 paper.add({x:.1,y:.5},{x:.1,y:.5},.05,.45,5);
 expect(paper.at({x:.1,y:.5},5)).toBeCloseTo(.45);
});

it('keeps thin connected water roots reachable while excluding a nearby dry reserve',()=>{
 const paper=new WetPaper('portrait',Infinity),width=100,height=178,water=new Float32Array(width*height);
 for(let y=76;y<104;y++)for(let x=24;x<44;x++)water[y*width+x]=.4;
 for(let x=43;x<82;x++)for(let y=88;y<92;y++)water[y*width+x]=.012;
 for(let x=60;x<75;x++)for(let y=115;y<119;y++)water[y*width+x]=.012;
 paper.replaceMoisture({width,height,water},0);
 const region=paper.region({x:.35,y:.5},0,120);
 expect(region.sites.some(s=>s.point.x>.72&&s.point.y<.56)).toBe(true);
 expect(region.sites.every(s=>s.point.y<.61&&paper.at(s.point,0)>=WET_FILM_THRESHOLD)).toBe(true);
});
