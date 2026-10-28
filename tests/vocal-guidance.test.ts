import {it,expect,vi,afterEach} from 'vitest';
import {VocalGuidance} from '../src/audio/VocalGuidance';
afterEach(()=>vi.unstubAllGlobals());
it('waits for a gesture, serializes voices, ignores repeat steps and restores songs',async()=>{
 const sources:{onended:(()=>void)|null;start:ReturnType<typeof vi.fn>;stop:ReturnType<typeof vi.fn>;connect:ReturnType<typeof vi.fn>;disconnect:ReturnType<typeof vi.fn>}[]=[];
 const param=()=>({value:0,setValueAtTime:vi.fn(),linearRampToValueAtTime:vi.fn()});
 const fetcher=vi.fn(async(_url:string)=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(1)}));vi.stubGlobal('fetch',fetcher);
 vi.stubGlobal('AudioContext',class {state='running';currentTime=0;destination={};resume=async()=>{};close=async()=>{};decodeAudioData=async()=>({duration:2});createGain=()=>({gain:param(),connect:vi.fn(),disconnect:vi.fn()});createBufferSource(){const source={onended:null,start:vi.fn(),stop:vi.fn(),connect:vi.fn(),disconnect:vi.fn()};sources.push(source);return source;}});
 const duck=vi.fn(),voice=new VocalGuidance(duck);voice.request(0);voice.request(0);voice.request(1);expect(fetcher).not.toHaveBeenCalled();voice.unlock();await vi.waitFor(()=>expect(sources).toHaveLength(1));expect(duck).toHaveBeenLastCalledWith(true);expect(fetcher).toHaveBeenCalledTimes(1);
 sources[0].onended?.();await vi.waitFor(()=>expect(sources).toHaveLength(2));expect(fetcher.mock.calls[1][0]).toContain('Vocal01.mp3');
 voice.setEnabled(false);expect(sources[1].stop).toHaveBeenCalled();expect(duck).toHaveBeenLastCalledWith(false);voice.request(2);expect(fetcher).toHaveBeenCalledTimes(2);voice.destroy();
});
it('skips a missing file without ducking or blocking subsequent steps',async()=>{
 const missing=vi.fn(),duck=vi.fn();vi.stubGlobal('fetch',vi.fn(async()=>({ok:false})));vi.stubGlobal('AudioContext',class {state='running';resume=async()=>{};close=async()=>{};});
 const voice=new VocalGuidance(duck,missing);voice.request(0);voice.request(1);voice.unlock();await vi.waitFor(()=>expect(missing).toHaveBeenCalledTimes(2));expect(duck).not.toHaveBeenCalledWith(true);voice.destroy();
});
