import {describe,expect,it} from 'vitest';
import {analyzePCM} from '../src/audio/analyze';
import {composeAudio} from '../src/audio/composeAudio';
import {signal} from './audio.fixture';
const settings={palette:'estuaire',granulation:.72,wetness:.64,complexity:.52,ink:.62};
const bass=analyzePCM(signal('bass')),treble=analyzePCM(signal('treble')),music=analyzePCM(signal('music'));
describe('audio features from real PCM',()=>{
  it('separates low and high frequencies at the same amplitude',()=>{
    expect(bass.summary.bass).toBeGreaterThan(.97);expect(treble.summary.treble).toBeGreaterThan(.97);
    expect(treble.summary.brightness).toBeGreaterThan(bass.summary.brightness+.45);
    expect(Math.abs(bass.summary.energy-treble.summary.energy)).toBeLessThan(.02);
  });
  it('keeps energetic antiphase stereo instead of cancelling it',()=>{
    const input=signal('bass');input.right=input.left.map(x=>-x);
    const anti=analyzePCM(input);
    expect(anti.summary.energy).toBeCloseTo(bass.summary.energy,5);expect(anti.summary.width).toBeGreaterThan(.99);
  });
  it('keeps silence silent and all outputs finite',()=>{
    const silent=analyzePCM(signal('silence'));
    expect(silent.summary.silence).toBe(1);expect(silent.onsets).toHaveLength(0);
    expect(composeAudio(silent,settings).gestures).toHaveLength(0);expect(composeAudio(silent,settings).ink).toHaveLength(0);
    expect(silent.frames.every(f=>Object.values(f).every(v=>typeof v==='boolean'||Number.isFinite(v)))).toBe(true);
  });
  it('finds recurrent attacks and respects the refractory period',()=>{
    const pulses=analyzePCM(signal('pulses'));
    expect(pulses.onsets.length).toBeGreaterThan(15);
    expect(pulses.onsets.every((v,i)=>i===0||v-pulses.onsets[i-1]>=.24)).toBe(true);
  });
  it('analyzes exactly the first 15 seconds and fingerprints the audio content',()=>{
    const long=signal('music',20),a=analyzePCM(long),b=analyzePCM({left:long.left.slice(0,240000),right:long.right!.slice(0,240000),sampleRate:16000});
    expect(a).toEqual(b);expect(a.duration).toBe(15);expect(a.frames).toHaveLength(450);
    expect(analyzePCM(signal('treble')).seed).not.toBe(a.seed);
  });
  it('preserves actual loudness information',()=>{
    const quiet=signal('bass');quiet.left=quiet.left.map(v=>v*.05);quiet.right=quiet.right!.map(v=>v*.05);
    expect(analyzePCM(quiet).summary.energy).toBeLessThan(bass.summary.energy*.4);
  });
});
describe('harmonious audio-driven grammar',()=>{
  it('replays deterministically and responds to spectral content',()=>{
    expect(composeAudio(music,settings)).toEqual(composeAudio(music,settings));
    expect(composeAudio(bass,settings)).not.toEqual(composeAudio(treble,settings));
    const low=composeAudio(bass,settings),high=composeAudio(treble,settings);
    expect(high.ink!.reduce((s,i)=>s+i.width,0)/high.ink!.length).toBeGreaterThan(low.ink!.reduce((s,i)=>s+i.width,0)/low.ink!.length);
  });
  it('enables fine ink with its own control and a bounded cover of the paper',()=>{
    const score=composeAudio(music,settings);
    expect(score.ink!.length).toBeGreaterThan(8);expect(score.ink!.length).toBeLessThan(65);
    expect(composeAudio(music,{...settings,ink:0}).ink).toHaveLength(0);
    expect(composeAudio(music,{...settings,ink:0}).gestures).toEqual(score.gestures);
    expect(score.ink!.every(s=>s.width<2.5&&s.opacity<.9&&s.points.every(p=>p.x>=.09&&p.x<=.91&&p.y>=.09&&p.y<=.91))).toBe(true);
  });
  it('stays inside the real shader budgets and leaves a final drying period',()=>{
    for(const audio of [bass,treble,music,analyzePCM(signal('pulses'))])for(const complexity of [0,.52,1]){
      const score=composeAudio(audio,{...settings,complexity});let maxSegments=0,maxDrops=0;
      for(let t=0;t<720;t++){
        const active=score.gestures.filter(g=>t/30>=g.start&&t/30<g.start+g.duration);
        maxSegments=Math.max(maxSegments,active.filter(g=>g.kind!=='bloom').length);maxDrops=Math.max(maxDrops,active.filter(g=>g.kind==='bloom').length);
      }
      expect(maxSegments).toBeLessThanOrEqual(16);expect(maxDrops).toBeLessThanOrEqual(4);
      expect(Math.max(...score.gestures.map(g=>g.start+g.duration))).toBeLessThan(17);
      expect(score.duration).toBe(24);
    }
  });
  it('accepts a short excerpt without pretending it contains 15 seconds',()=>{
    const short=analyzePCM(signal('bass',2));const score=composeAudio(short,settings);
    expect(score.source?.duration).toBe(2);expect(score.source?.activeSeconds).toBeLessThanOrEqual(2);
  });
});
