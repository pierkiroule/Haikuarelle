import {describe,expect,it} from 'vitest';
import {BIRDS,BIRD_BRUSHES,BIRD_PADS} from '../src/birds/catalog';
import {composeBird} from '../src/birds/grammar';
import {makeHaiku,type BirdMark} from '../src/birds/haiku';
import {analyzePCM} from '../src/audio/analyze';
import {signal} from './audio.fixture';
const settings={palette:'estuaire',granulation:.7,wetness:.62,complexity:.52,ink:.62,format:'portrait' as const};
const music=analyzePCM(signal('music',4)),silent=analyzePCM(signal('silence',4));
describe('bird brush grammar',()=>{
  it('provides eight playable brushes and keeps the ten historical recordings credited',()=>{
    expect(BIRDS).toHaveLength(15);expect(new Set(BIRDS.map(b=>b.id)).size).toBe(15);
    expect(BIRD_BRUSHES).toHaveLength(8);expect(BIRD_BRUSHES.find(b=>b.id==='pie')?.source).toBe('https://freesound.org/people/naturenotesuk/sounds/555096/');expect(BIRD_PADS).toHaveLength(3);
    expect(BIRDS.filter(b=>b.id!=='pie').every(b=>/^https:\/\/(bigsoundbank.com|commons.wikimedia.org)\//.test(b.source)&&b.author)).toBe(true);
  });
  it('uses the placed brush as its origin, including near the paper edge',()=>{
    for(const point of [{x:.04,y:.05},{x:.3,y:.6},{x:.9,y:.92}]){
      const score=composeBird(music,BIRDS[0],point,12,settings);
      expect(score.gestures[0].points[0].x).toBeCloseTo(point.x,8);
      expect(score.gestures[0].points[0].y).toBeCloseTo(point.y,8);
    }
  });
  it('is deterministic, responds to the bird and never paints from silence',()=>{
    const root={x:.5,y:.5},a=composeBird(music,BIRDS[0],root,12,settings);
    expect(composeBird(music,BIRDS[0],root,12,settings)).toEqual(a);
    expect(composeBird(music,BIRDS[1],root,12,settings)).not.toEqual(a);
    expect(composeBird(silent,BIRDS[0],root,12,settings).gestures).toHaveLength(0);
    expect(composeBird(silent,BIRDS[0],root,12,settings).ink).toHaveLength(0);
  });
  it('keeps gesture budgets and the final paper margins for all birds and brush sizes',()=>{
    for(const bird of BIRDS)for(const size of [0,.55,1]){
      const score=composeBird(music,bird,{x:.5,y:.5},893,settings,size);
      expect(score.gestures.length).toBeGreaterThan(3);
      for(let t=0;t<120;t++){
        const active=score.gestures.filter(g=>g.start<=t/30&&g.start+g.duration>t/30);
        expect(active.filter(g=>g.kind==='bloom').length).toBeLessThanOrEqual(4);
        expect(active.filter(g=>g.kind!=='bloom').length).toBeLessThanOrEqual(16);
      }
      expect(score.gestures.every(g=>g.start+g.duration<=music.duration&&g.points.every(p=>p.x>=.025&&p.x<=.975&&p.y>=.025&&p.y<=.975))).toBe(true);
    }
  });
  it('makes brush size physical and keeps the ink control independent of washes',()=>{
    const root={x:.5,y:.5},small=composeBird(music,BIRDS[0],root,12,settings,0),large=composeBird(music,BIRDS[0],root,12,settings,1);
    expect(large.gestures[0].radius).toBeGreaterThan(small.gestures[0].radius*1.8);
    const without=composeBird(music,BIRDS[0],root,12,{...settings,ink:0},1);
    expect(without.ink).toHaveLength(0);
    // The ink RNG must not consume random values that change the washes.
    expect(without.gestures).toEqual(large.gestures);
  });
});
describe('personal haiku',()=>{
  const mark:BirdMark={bird:'rougegorge',point:{x:.5,y:.2},seed:42};
  it('waits for an actual mark, then gives three original, deterministic lines',()=>{
    expect(makeHaiku([],'estuaire',1)).toBeNull();
    const poem=makeHaiku([mark],'estuaire',1)!;
    expect(poem).toHaveLength(3);expect(poem.every(line=>line.length>8)).toBe(true);
    expect(makeHaiku([mark],'estuaire',1)).toEqual(poem);
  });
  it('responds to the chosen birds, pigments and placement',()=>{
    const poem=makeHaiku([mark],'estuaire',1)!;
    expect(makeHaiku([{...mark,bird:'hibou'}],'estuaire',1)![0]).not.toBe(poem[0]);
    expect(makeHaiku([mark],'argile',1)![1]).not.toBe(poem[1]);
    expect(makeHaiku([{...mark,point:{x:.5,y:.9}}],'estuaire',1)![2]).not.toBe(poem[2]);
  });
});
