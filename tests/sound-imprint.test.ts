import {describe,expect,it} from 'vitest';
import {soundImprint} from '../src/birds/SoundImprint';
import {analyzePCM} from '../src/audio/analyze';
import {signal} from './audio.fixture';
describe('audible phrase becomes visible paint dynamics',()=>{
  it('gives the real phrase a useful envelope range and marks distinct attacks',()=>{
    const analysis=analyzePCM(signal('pulses',4)),mapped=soundImprint(analysis);
    const levels=mapped.map(f=>f.energy);
    expect(Math.max(...levels)-Math.min(...levels)).toBeGreaterThan(.6);
    expect(mapped.some(f=>f.flux>.6)).toBe(true);
    expect(mapped.filter(f=>!f.active).every(f=>f.energy===0&&f.flux===0)).toBe(true);
    expect(soundImprint(analysis)).toEqual(mapped);
  });
  it('never amplifies silence or very low noise into a visible note',()=>{
    const silent=analyzePCM(signal('silence',2));
    expect(soundImprint(silent).every(f=>!f.active&&f.energy===0&&f.flux===0)).toBe(true);
    const quiet={...silent,frames:silent.frames.map(f=>({...f,active:true,rms:.00001,energy:.02}))};
    expect(soundImprint(quiet).every(f=>!f.active&&f.energy===0)).toBe(true);
  });
});
