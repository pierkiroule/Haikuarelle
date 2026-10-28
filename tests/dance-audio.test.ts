import {afterEach,it,expect,vi} from 'vitest';
import {DanceAudio} from '../src/dance/media';
afterEach(()=>vi.unstubAllGlobals());
it('plays the original bird buffer forwards across thirty seconds and releases every source',async()=>{
 const nodes:{buffer:AudioBuffer|null;connect:ReturnType<typeof vi.fn>;start:ReturnType<typeof vi.fn>;stop:ReturnType<typeof vi.fn>;disconnect:ReturnType<typeof vi.fn>}[]=[],ramps=vi.fn(),close=vi.fn(async()=>{});
 vi.stubGlobal('AudioContext',class{
  currentTime=100;state='running';destination={};resume=vi.fn(async()=>{});close=close;
  createGain(){return {connect:vi.fn(),disconnect:vi.fn(),gain:{setValueAtTime:vi.fn(),linearRampToValueAtTime:ramps}};}
  createBufferSource(){const node={buffer:null,connect:vi.fn(),start:vi.fn(),stop:vi.fn(),disconnect:vi.fn()};nodes.push(node);return node;}
 });
 const audio=new DanceAudio(),buffer={duration:3} as AudioBuffer;await audio.unlock();audio.play(buffer);
 expect(nodes.length).toBe(9);expect(nodes.every(node=>node.buffer===buffer)).toBe(true);
 expect(nodes.map(node=>node.start.mock.calls[0][0])).toEqual([100,103.5,107,110.5,114,117.5,121,124.5,128]);
 expect(nodes.at(-1)!.stop).toHaveBeenCalledWith(130);expect(ramps).toHaveBeenCalledWith(0,130);
 await audio.dispose();expect(nodes.every(node=>node.disconnect.mock.calls.length===1)).toBe(true);expect(close).toHaveBeenCalledOnce();
});
