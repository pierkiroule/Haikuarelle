import {afterEach,beforeEach,it,expect,vi} from 'vitest';
import {BirdAudioBank,type BirdPlayback} from '../src/birds/BirdAudioBank';
import {analyzePCM} from '../src/audio/analyze';
import {signal} from './audio.fixture';
const analysis=analyzePCM(signal('music',1));
vi.mock('../src/audio/file',()=>({openAudio:vi.fn(async()=>({buffer:{length:16000,sampleRate:16000,numberOfChannels:1},duration:1})),analyzeExcerpt:vi.fn(async()=>analysis)}));
const param=()=>({value:0,setValueAtTime:vi.fn(),linearRampToValueAtTime:vi.fn(),cancelScheduledValues:vi.fn(),setTargetAtTime:vi.fn()});
const node=()=>({connect:vi.fn(),disconnect:vi.fn()});
const source=()=>({...node(),buffer:null,loop:false,start:vi.fn(),stop:vi.fn(),onended:null as null|(()=>void)});
let bank:BirdAudioBank,clock:number,sources:ReturnType<typeof source>[];
beforeEach(()=>{
 clock=0;sources=[];vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,blob:async()=>new Blob()})));
 vi.stubGlobal('AudioContext',vi.fn(function(){return {get currentTime(){return clock;},state:'running',destination:{},resume:vi.fn(async()=>{}),close:vi.fn(async()=>{}),
  createBufferSource:()=>{const s=source();sources.push(s);return s;},createGain:()=>({...node(),gain:param()}),createStereoPanner:()=>({...node(),pan:param()}),createBiquadFilter:()=>({...node(),type:'lowpass',Q:param(),frequency:param()})};}));
 bank=new BirdAudioBank();
});
afterEach(()=>{bank.destroy();vi.unstubAllGlobals();});
it('allows one reply beside the hand phrase and prevents another reply',async()=>{
 await bank.unlock();const done=vi.fn();let reply:BirdPlayback|undefined;
 await bank.playReply('mesange',{x:.2,y:.5},.2,s=>{reply=s;},done);
 expect(bank.replyBusy).toBe(true);expect(bank.mainBusy).toBe(false);expect(reply).toBeDefined();
 await bank.play('pie',()=>{},()=>{});expect(bank.replyBusy).toBe(true);expect(bank.mainBusy).toBe(true);
 await bank.playReply('geai',{x:.8,y:.5},.2,()=>{},()=>{});expect(sources).toHaveLength(2);
 bank.stop();expect(bank.mainBusy).toBe(false);expect(bank.replyBusy).toBe(true);expect(sources[0].stop).not.toHaveBeenCalled();
 sources[0].onended!();expect(done).toHaveBeenCalledOnce();expect(bank.replyBusy).toBe(false);
});
it('uses the actual reply envelope to drive the water and cleans up on disposal',async()=>{
 await bank.unlock();let sound:BirdPlayback|undefined;
 await bank.playReply('mesange',{x:.8,y:.5},.2,s=>{sound=s;},()=>{});
 expect(sound!.audibility!()).toBe(0);clock=.3;expect(sound!.audibility!()).toBeGreaterThan(0);clock=1.1;expect(sound!.audibility!()).toBe(0);
 bank.destroy();expect(sources[0].stop).toHaveBeenCalled();expect(sources[0].disconnect).toHaveBeenCalled();expect(bank.replyBusy).toBe(false);
});
it('cancels an asynchronously preparing reply when the soundscape is silenced',async()=>{
 await bank.unlock();const prepare=vi.spyOn(bank,'prepare');let resolve!:()=>void;
 const pending=new Promise<void>(r=>{resolve=r;});
 prepare.mockImplementationOnce(async()=>{await pending;return {document:{duration:1,buffer:{}} as never,analysis};});
 const start=vi.fn(),playing=bank.playReply('pie',{x:.5,y:.5},.2,start,()=>{});bank.stopReplies();resolve();await playing;
 expect(start).not.toHaveBeenCalled();expect(sources).toHaveLength(0);
});
it('softens the main source on relay without erasing its callback cleanup',async()=>{
 bank.setPosition({x:.5,y:.5});const ended=vi.fn();await bank.play('mesange',()=>{},ended);bank.fadeStop();
 expect(sources[0].stop).toHaveBeenCalledWith(.27);sources[0].onended!();expect(ended).toHaveBeenCalledOnce();expect(bank.mainBusy).toBe(false);
});
