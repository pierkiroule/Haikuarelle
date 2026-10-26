import {describe,expect,it} from 'vitest';
import {ResonantBrush,brushRadius,paperPoint} from '../src/birds/ResonantBrush';
import {BIRD_PADS,BIRD_BRUSHES} from '../src/birds/catalog';
import {getPalette} from '../src/engine/palettes';
import type {AudioFrame} from '../src/audio/types';
const settings={palette:'plumages',granulation:.7,wetness:.62,complexity:.52,ink:.62,format:'portrait' as const};
const sound:AudioFrame={time:0,rms:.1,energy:.65,bass:.1,mid:.5,treble:.4,brightness:.6,flux:.4,width:0,balance:0,active:true};
function path(step:number,seed=417,bird=BIRD_PADS[0]){
  const brush=new ResonantBrush(bird,seed,settings,.65);const frames=[];
  for(let i=0;i<90;i++){
    const t=(i*step)%.9,x=.2+(t<.45?t:.9-t);
    brush.move({x,y:.45+Math.sin(i*.07)*.02},i*1000/30);
    frames.push(brush.step(sound,i/30,settings));
  }
  return {brush,frames};
}
describe('gesture and live audio create the brush together',()=>{
  it('narrows progressively with speed, while preserving brush size and pen pressure',()=>{
    expect(brushRadius(1.8,.6,.6)).toBeLessThan(brushRadius(.03,.6,.6)*.3);
    expect(brushRadius(.1,1,.6)).toBeGreaterThan(brushRadius(.1,0,.6)*3);
    expect(brushRadius(.1,.6,.6,1)).toBeGreaterThan(brushRadius(.1,.6,.6,.1));
  });
  it('draws no path without movement, or from silent sound, and keeps the human trajectory',()=>{
    const brush=new ResonantBrush(BIRD_PADS[1],1,settings);
    expect(brush.step(sound,0,settings).segments).toHaveLength(0);
    brush.move({x:.2,y:.4},0);brush.move({x:.3,y:.45},33);
    const frame=brush.step(sound,0,settings),primary=frame.segments.filter(s=>!s.water&&s.slot===1);
    expect(primary.some(s=>s.b.x===.3&&s.b.y===.45)).toBe(true);
    expect(brush.step(sound,.1,settings).segments).toHaveLength(0);
    brush.move({x:.5,y:.5},66);expect(brush.step({...sound,active:false},.2,settings).segments).toHaveLength(0);
  });
  it('keeps a lift from connecting two distant parts of the paper',()=>{
    const brush=new ResonantBrush(BIRD_PADS[0],1,settings);
    brush.move({x:.2,y:.2},0);brush.step(sound,0,settings);brush.lift();
    brush.move({x:.8,y:.8},33);const frame=brush.step(sound,.1,settings);
    expect(frame.segments.every(s=>s.a.x>.7&&s.a.y>.7)).toBe(true);
  });
  it('makes fast movement finer and produces directional droplets; slow movement keeps broad washes',()=>{
    const slow=path(.002),fast=path(.06);
    expect(fast.brush.feedback.splashes).toBeGreaterThan(6);
    expect(slow.brush.feedback.splashes).toBe(0);
    const average=(frames:ReturnType<typeof path>['frames'])=>frames.slice(8).reduce((sum,f)=>sum+f.feedback.radius,0)/(frames.length-8);
    expect(average(fast.frames)).toBeLessThan(average(slow.frames)*.45);
    expect(path(.06).frames).toEqual(fast.frames);
  });
  it('keeps its coalesced input and actual GPU segment budgets bounded under stress',()=>{
    for(const bird of BIRD_BRUSHES){
      const brush=new ResonantBrush(bird,194,settings,1);
      for(let frame=0;frame<20;frame++){
        for(let i=0;i<500;i++)brush.move({x:.15+(i%30)/42,y:.4+.05*Math.sin(i)},frame*500+i,.8);
        expect(brush.queuedSamples).toBeLessThanOrEqual(96);
        const result=brush.step({...sound,time:frame/30,flux:.95},frame/30,settings);
        expect(result.segments.length).toBeLessThanOrEqual(16);
        expect(result.segments.every(s=>s.radius>0&&Object.values(s.a).every(Number.isFinite)&&s.a.x>=.015&&s.a.x<=.985)).toBe(true);
      }
    }
  });
  it('lets the sound reshape an identical gesture and adds pigment branches on attacks',()=>{
    const draw=(energy:number,flux:number,resonance=1)=>{
      const brush=new ResonantBrush(BIRD_PADS[2],32,settings,.6);
      brush.move({x:.4,y:.5},0);brush.move({x:.46,y:.5},100);
      return brush.step({...sound,time:1,energy,flux},1,{...settings,resonance});
    };
    const soft=draw(.04,.05),loud=draw(.95,.05),attack=draw(.95,.95);
    const radius=(f:typeof soft)=>Math.max(...f.segments.filter(s=>!s.water).map(s=>s.radius));
    expect(radius(loud)).toBeGreaterThan(radius(soft)*3);
    expect(attack.segments.filter(s=>s.effect==='filament').length).toBe(4);
    expect(attack.ink.some(s=>s.points.length>=5)).toBe(true);
    expect(loud.ink.every(s=>s.points.length===2)).toBe(true);
    expect(attack.segments.some(s=>s.a.y!==s.b.y)).toBe(true);
    expect(draw(.95,.95,0).ink.every(s=>s.points.length===2)).toBe(true);
  });
  it('responds to a note under a resting brush and never after a lift during silence',()=>{
    const brush=new ResonantBrush(BIRD_PADS[1],5,settings);
    brush.move({x:.4,y:.5},0);brush.step({...sound,flux:.1},0,settings);
    expect(brush.step({...sound,time:.2,flux:.95},.2,settings).segments.length).toBeGreaterThan(0);
    brush.move({x:.42,y:.5},100);brush.lift(true);
    brush.step({...sound,time:.3,active:false},.3,settings);
    expect(brush.step({...sound,time:.5,flux:.95},.5,settings).segments).toHaveLength(0);
  });
  it('gives the three selected birds stable, distinct pigments and actual different brush structures',()=>{
    expect(BIRD_PADS.map(b=>b.id)).toEqual(['corneille','rougegorge','geai']);
    const colors=BIRD_PADS.map(b=>getPalette('plumages').colors[b.slot]);expect(new Set(colors).size).toBe(3);
    const [crow,robin,jay]=BIRD_PADS.map(b=>path(.005,417,b).frames[2].segments.filter(s=>!s.water));
    expect(crow.some(s=>s.slot===0)).toBe(true);expect(crow.every(s=>[0,7,6].includes(s.slot))).toBe(true);expect(jay.some(s=>s.slot===2)).toBe(true);expect(jay.every(s=>[2,8,5,0].includes(s.slot))).toBe(true);
    expect(robin.some(s=>s.slot===0&&s.load<.2)).toBe(true);expect(robin.some(s=>s.slot===1)).toBe(true);
    expect(crow.find(s=>s.slot===0)!.strength).toBeGreaterThan(robin.find(s=>s.slot===1)!.strength);
  });
  it('projects separate black magpie droplets with varied sizes, no connecting stroke and a fixed budget',()=>{
    const pie=BIRD_BRUSHES.find(b=>b.id==='pie')!;
    const run=(size=.6)=>{
      const brush=new ResonantBrush(pie,75,settings,size),frames=[];
      for(let i=0;i<30;i++){
        brush.move({x:.2+i*.018,y:.5},i*1000/30);
        frames.push(brush.step({...sound,time:i/30,energy:.9,flux:.9},i/30,settings));
      }
      return frames;
    };
    const frames=run(),drops=frames.flatMap(f=>f.segments.filter(s=>!s.water));
    expect(frames).toEqual(run());expect(drops.length).toBeGreaterThan(20);
    expect(drops.every(s=>s.slot===0&&s.effect==='splash'&&s.a.x===s.b.x&&s.a.y===s.b.y)).toBe(true);
    expect(frames.every(f=>f.ink.length===0&&f.segments.length<=16)).toBe(true);
    expect(Math.max(...drops.map(s=>s.radius))).toBeGreaterThan(Math.min(...drops.map(s=>s.radius))*3);
    const radius=(size:number)=>run(size).flatMap(f=>f.segments.filter(s=>!s.water)).reduce((n,s)=>n+s.radius,0);
    expect(radius(1)).toBeGreaterThan(radius(0)*3);
  });
  it('scales only new pigment and ink opacity, including magpie droplets, and deposits nothing at zero',()=>{
    for(const bird of BIRD_BRUSHES){
      const draw=(opacity:number)=>{
        const b=new ResonantBrush(bird,58,settings,.7,0,opacity);
        b.move({x:.3,y:.5},0);b.move({x:.4,y:.5},100);
        return b.step({...sound,time:1,flux:.95},1,settings);
      };
      const full=draw(1),faint=draw(.25);
      expect(faint.segments.filter(s=>s.water)).toEqual(full.segments.filter(s=>s.water));
      const pigment=full.segments.filter(s=>!s.water);
      faint.segments.filter(s=>!s.water).forEach((s,i)=>expect(s.load).toBeCloseTo(pigment[i].load*.25));
      faint.ink.forEach((s,i)=>expect(s.opacity).toBeCloseTo(full.ink[i].opacity*.25));
      expect(draw(0).segments).toEqual([]);expect(draw(0).ink).toEqual([]);
    }
  });
  it('reserves short filaments for spaced strong attacks rather than each audio pulse',()=>{
    const brush=new ResonantBrush(BIRD_PADS[2],72,settings,.7);
    let filaments=0;
    for(let i=0;i<60;i++){
      brush.move({x:.2+i*.006,y:.5},i*1000/30);
      filaments+=brush.step({...sound,time:i/30,flux:.95},i/30,settings).segments.filter(s=>s.effect==='filament').length/4;
    }
    expect(filaments).toBeGreaterThan(0);expect(filaments).toBeLessThanOrEqual(3);
    const b=new ResonantBrush(BIRD_PADS[2],72,settings,.7);b.move({x:.4,y:.5},0);
    expect(b.step({...sound,flux:.7},1,settings).segments.some(s=>s.effect==='filament')).toBe(false);
  });
  it('transduces the audible timbre and attacks into wet margins without adding independent animation',()=>{
    const draw=(brightness:number,flux=.1,resonance=1)=>{
      const b=new ResonantBrush(BIRD_PADS[2],42,settings,.6);
      b.move({x:.4,y:.5},0);b.move({x:.42,y:.5},70);
      return b.step({...sound,brightness,flux},0,{...settings,resonance}).segments.find(s=>s.water)!;
    };
    const dark=draw(.1),bright=draw(.9),attack=draw(.9,.75);
    expect(dark.radius).toBeGreaterThan(bright.radius);
    expect(dark.load).toBeGreaterThan(bright.load);
    expect(attack.radius).toBeGreaterThan(bright.radius);
    expect(draw(.1,.1,0)).toEqual(draw(.9,.1,0));
  });
  it('maps the pointer accurately and rejects excursions outside the paper',()=>{
    const rect={left:20,top:40,width:300,height:600};
    expect(paperPoint(170,340,rect)).toEqual({x:.5,y:.5});
    expect(paperPoint(19,340,rect)).toBeNull();expect(paperPoint(170,641,rect)).toBeNull();expect(paperPoint(NaN,100,rect)).toBeNull();
  });
  it('lays water before pigment on dry paper, and each new plumage keeps its companion colour',()=>{
    for(const bird of BIRD_BRUSHES){
      const brush=new ResonantBrush(bird,91,settings,.7);
      brush.move({x:.3,y:.5},0);brush.move({x:.42,y:.5},80);
      const frame=brush.step({...sound,time:.2},.2,settings);
      expect(frame.segments[0].water).toBe(true);
      expect(frame.segments.some(s=>s.slot===bird.slot&&!s.water)).toBe(true);
      if(bird.signature)expect(new Set(frame.segments.filter(s=>!s.water).map(s=>s.slot)).size).toBeGreaterThan(1);
    }
  });
  it('keeps sound-triggered paint filaments when fine ink is off and tapers them to a fine tip',()=>{
    const draw=(ink:number)=>{
      const brush=new ResonantBrush(BIRD_BRUSHES[3],33,{...settings,ink},.7);
      brush.move({x:.3,y:.5},0);brush.move({x:.36,y:.5},50);
      return brush.step({...sound,time:.3,flux:.95},.3,{...settings,ink});
    };
    const withInk=draw(1),noInk=draw(0),jets=noInk.segments.filter(s=>s.effect==='filament');
    expect(noInk.ink).toEqual([]);expect(noInk.segments).toEqual(withInk.segments);expect(jets).toHaveLength(4);
    expect(jets[3].radius).toBeLessThan(jets[0].radius*.4);
    expect(jets.some(s=>Math.abs(s.a.y-s.b.y)>.0001)).toBe(true);
  });
});
