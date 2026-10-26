import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {BirdAudioBank} from '../src/birds/BirdAudioBank';
import {analyzePCM} from '../src/audio/analyze';
import {signal} from './audio.fixture';
const analysis=analyzePCM(signal('music',1));
vi.mock('../src/audio/file',()=>({
  openAudio:vi.fn(async()=>({name:'bird.mp3',buffer:{length:16000,sampleRate:16000,numberOfChannels:1,getChannelData:()=>new Float32Array(16000)},duration:1})),
  analyzeExcerpt:vi.fn(async()=>analysis),
}));
let source:{connect:ReturnType<typeof vi.fn>;disconnect:ReturnType<typeof vi.fn>;start:ReturnType<typeof vi.fn>;stop:ReturnType<typeof vi.fn>;onended:null|(()=>void);loop?:boolean;buffer?:AudioBuffer},order:string[],state:string;
let bank:BirdAudioBank;let clock=0;
beforeEach(()=>{
  order=[];state='running';clock=0;
  source={connect:vi.fn(),disconnect:vi.fn(),start:vi.fn(()=>order.push('sound')),stop:vi.fn(),onended:null};
  vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,blob:async()=>new Blob(['audio'])})));
  vi.stubGlobal('AudioContext',vi.fn(function(){return {get state(){return state;},get currentTime(){return clock;},resume:vi.fn(async()=>{order.push('resume');}),createBufferSource:()=>source,createBuffer:(_n:number,length:number,rate:number)=>({duration:length/rate,copyToChannel:vi.fn()}),createGain:()=>({gain:{value:0},connect:vi.fn(),disconnect:vi.fn()}),destination:{},close:vi.fn(async()=>{})};}));
  bank=new BirdAudioBank();
});
afterEach(()=>{bank.destroy();vi.unstubAllGlobals();});
describe('audible pads gate pigment',()=>{
  it('preloads only the three selected birds without opening any playback context',async()=>{
    const ready=vi.fn();await bank.preload(ready);
    expect(ready).toHaveBeenCalledTimes(3);expect(AudioContext).not.toHaveBeenCalled();
    expect(source.start).not.toHaveBeenCalled();
  });
  it('starts actual audio before authorizing a mark and ends the mark when the audio ends',async()=>{
    const ended=vi.fn();await bank.play('merle',()=>order.push('paint'),ended);
    expect(order).toEqual(['resume','sound','paint']);
    source.onended!();expect(ended).toHaveBeenCalledOnce();
  });
  it('never paints when playback is blocked or the recording cannot be fetched',async()=>{
    state='suspended';const paint=vi.fn();
    await expect(bank.play('merle',paint,vi.fn())).rejects.toThrow('autoriser le son');
    expect(paint).not.toHaveBeenCalled();expect(source.start).not.toHaveBeenCalled();
    bank.destroy();bank=new BirdAudioBank();state='running';
    vi.mocked(fetch).mockResolvedValue({ok:false} as Response);
    await expect(bank.play('hibou',paint,vi.fn())).rejects.toThrow('chargé');expect(paint).not.toHaveBeenCalled();
  });
  it('ends the previous mark on interruption and releases a stopped voice',async()=>{
    const ended=vi.fn();await bank.play('merle',vi.fn(),ended);bank.stop();
    expect(source.stop).toHaveBeenCalledOnce();expect(source.disconnect).toHaveBeenCalled();expect(ended).toHaveBeenCalledOnce();
    bank.stop();expect(ended).toHaveBeenCalledOnce();
  });
  it('does not paint if source.start fails',async()=>{
    source.start.mockImplementation(()=>{throw new Error('audio device unavailable');});const paint=vi.fn();
    await expect(bank.play('geai',paint,vi.fn())).rejects.toThrow('audio device');
    expect(paint).not.toHaveBeenCalled();
  });
  it('exposes the actual audio clock and gates it when playback is suspended later',async()=>{
    let elapsed:()=>number=()=>-99;
    await bank.play('rougegorge',sound=>{elapsed=sound.elapsed;},vi.fn());
    clock=.37;expect(elapsed()).toBeCloseTo(.37);state='suspended';expect(elapsed()).toBe(-1);
  });
  it('loops intact phrases with a silent breath, reports their wrapped clock and stops after 90 seconds',async()=>{
    vi.useFakeTimers();
    try{
      const ended=vi.fn();let elapsed=()=>-1,cycle=0;
      await bank.play('geai',sound=>{elapsed=sound.elapsed;cycle=sound.cycleDuration;},ended,{loop:true});
      expect(source.loop).toBe(true);expect(cycle).toBeCloseTo(2.25);
      clock=2.4;expect(elapsed()).toBeCloseTo(.15);
      vi.advanceTimersByTime(90000);expect(source.stop).toHaveBeenCalledOnce();expect(ended).toHaveBeenCalledOnce();
    }finally{vi.useRealTimers();}
  });
  it('reuses the padded sample between brush contacts and keeps the configured silent breath',async()=>{
    let cycle=0;
    await bank.play('mesange',s=>{cycle=s.cycleDuration;},vi.fn(),{loop:true,breath:.28});
    const first=source.buffer;expect(cycle).toBeCloseTo(1.28);bank.stop();
    await bank.play('mesange',vi.fn(),vi.fn(),{loop:true,breath:.28});
    expect(source.buffer).toBe(first);
    bank.stop();await bank.play('mesange',vi.fn(),vi.fn(),{loop:true,breath:.5});
    expect(source.buffer).not.toBe(first);
  });
  it('does not leave a stale 90-second timer when the start callback immediately cancels',async()=>{
    vi.useFakeTimers();
    try{await bank.play('mesange',()=>bank.stop(),vi.fn(),{loop:true,breath:.28});expect(vi.getTimerCount()).toBe(0);}
    finally{vi.useRealTimers();}
  });
});
